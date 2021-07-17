import React, { useState } from 'react';
import { Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import { DateRangeFilterPill } from '../../components/FilterPills';

const getNetPay = (startDate: Moment | null, endDate: Moment | null) => {
    const client = getClient(store);
    const query = gql`
        query query($startDate: DateTime, $endDate: DateTime) {
            getNetPay(startDate: $startDate, endDate: $endDate) {
                mileageDeduction
                tip
                pay
                startDate
                endDate
            }
        }
    `;
    const vars = { startDate, endDate };
    console.log('sending query w vars:', vars);
    const res = client.request(query, vars);
    return res;
};

const NetPayCard = () => {
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: null,
        endDate: moment(),
    });

    const { status, data } = useQuery(
        ['stats', 'netPay', dates.startDate, dates.endDate],
        () => getNetPay(dates.startDate, dates.endDate),
        {
            onSuccess: (d) => {
                console.log('Successfully got net pay:', d);
            },
            onError: (err) => {
                console.log('error:', err);
            },
            select: (d) => {
                return d.getNetPay;
            },
        }
    );

    console.log('got net pay data:', data);

    const netPay = data && data.pay + data.tip - data.mileageDeduction;

    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <View style={tailwind('flex-row w-full items-center justify-between')}>
                <Text style={tailwind('font-bold text-3xl')}>Pay</Text>
                <DateRangeFilterPill
                    displayText={'All Time - Select Dates'}
                    end={dates.endDate}
                    start={dates.startDate}
                    onDateRangeChange={setDates}
                />
            </View>
            <View style={tailwind('flex-row p-2 justify-around')}>
                <View style={tailwind('flex-col border rounded-lg p-1')}>
                    <Text style={tailwind('font-bold text-xl')}>
                        {status == 'success' ? `$${data.pay.toFixed(2)}` : '...'}
                    </Text>
                    <Text style={tailwind('text-base')}>Pay</Text>
                </View>
                <View style={tailwind('flex-col border rounded-lg p-1')}>
                    <Text style={tailwind('font-bold text-xl')}>
                        {status == 'success' ? `$${data.tip.toFixed(2)}` : '...'}
                    </Text>
                    <Text style={tailwind('text-base')}>Tip</Text>
                </View>
                <View style={tailwind('flex-col border rounded-lg p-1')}>
                    <Text style={tailwind('font-bold text-xl')}>
                        {status == 'success' ? `$${data.mileageDeduction.toFixed(2)}` : '...'}
                    </Text>
                    <Text style={tailwind('text-base')}>Expenses</Text>
                </View>
            </View>

            <View style={tailwind('flex-row p-2')}>
                <Text style={tailwind('font-bold text-xl')}>
                    Net Pay: {status == 'success' ? `$${netPay.toFixed(2)}` : '...'}
                </Text>
            </View>
        </View>
    );
};

export default NetPayCard;
