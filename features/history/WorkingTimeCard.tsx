import React, { useState } from 'react';
import { Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import { DateRangeFilterPill } from '../../components/FilterPills';
import { ContributionGraph } from 'react-native-chart-kit';

const getWorkingTime = (startDate: Moment | null, endDate: Moment | null) => {
    const client = getClient(store);
    const query = gql`
        query query($startDate: DateTime, $endDate: DateTime) {
            getWorkingTime(startDate: $startDate, endDate: $endDate) {
                clockedInTime
                jobTime
                shiftHoursDaily {
                    date
                    hrs
                }
            }
        }
    `;
    const vars = { startDate, endDate };
    const res = client.request(query, vars);
    return res;
};

const WorkingTimeCard = () => {
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: null,
        endDate: moment(),
    });

    const { status, data } = useQuery(
        ['workingTime', dates.startDate, dates.endDate],
        () => getWorkingTime(dates.startDate, dates.endDate),
        {
            onSuccess: (d) => {
                console.log('Successfully got working time:', d);
            },
            onError: (err) => {
                console.log('working time error:', err);
            },
            select: (d) => {
                return d.getWorkingTime;
            },
        }
    );

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(30, 30, 30, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false, // optional
    };
    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <View style={tailwind('flex-row w-full items-center justify-between')}>
                <Text style={tailwind('font-bold text-2xl')}>Working Time</Text>
                <DateRangeFilterPill
                    displayText={'All Time - Select Dates'}
                    end={dates.endDate}
                    start={dates.startDate}
                    onDateRangeChange={setDates}
                />
            </View>
            <Text>{status == 'success' ? `${data.clockedInTime} hrs` : '...'} </Text>
            {status == 'success' && (
                <ContributionGraph
                    values={data.shiftHoursDaily}
                    accessor={'hrs'}
                    endDate={new Date()}
                    numDays={90}
                    width={330}
                    height={220}
                    showOutOfRangeDays={true}
                    chartConfig={chartConfig}
                />
            )}
        </View>
    );
};

export default WorkingTimeCard;
