import React, { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import { DateRangeFilterPill } from '../../components/FilterPills';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
                clockedInTime
                jobTime
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
        startDate: moment().startOf('week'),
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

    const [helpButtonPressed, setHelpButtonPressed] = useState<boolean>(false);
    const [activeHelpButtonPressed, setActiveHelpButtonPressed] = useState<boolean>(false);

    const netPay = data && data.pay + data.tip - data.mileageDeduction;

    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <View style={tailwind('flex-row w-full items-center justify-between')}>
                <Text style={tailwind('font-bold text-3xl')}>Summary</Text>
                <DateRangeFilterPill
                    displayText={'All Time - Select Dates'}
                    end={dates.endDate}
                    start={dates.startDate}
                    onDateRangeChange={setDates}
                />
            </View>

            <View style={tailwind('flex-row p-2 justify-around items-center')}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setHelpButtonPressed(!helpButtonPressed);
                        setActiveHelpButtonPressed(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                >
                    <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                        <View style={tailwind('flex-row justify-between')}>
                            <Text style={tailwind('font-bold text-xl')}>
                                {status == 'success'
                                    ? `$${(netPay / data.clockedInTime || 0).toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Ionicons
                                name={'help-circle'}
                                size={24}
                                color={helpButtonPressed ? 'black' : 'gray'}
                            />
                        </View>
                        <Text style={tailwind('text-sm')}>Per Hour</Text>
                        <Text style={tailwind('text-xs')}>(Incl. Waiting Time)</Text>
                    </View>
                </Pressable>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveHelpButtonPressed(!activeHelpButtonPressed);
                        setHelpButtonPressed(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                >
                    <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                        <View style={tailwind('flex-row justify-between')}>
                            <Text style={tailwind('font-bold text-xl')}>
                                {status == 'success'
                                    ? `$${(netPay / data.jobTime || 0).toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Ionicons
                                name={'help-circle'}
                                size={24}
                                color={activeHelpButtonPressed ? 'black' : 'gray'}
                            />
                        </View>
                        <Text style={tailwind('text-sm')}>Per Hour</Text>
                        <Text style={tailwind('text-xs')}>(Active Time Only)</Text>
                    </View>
                </Pressable>
            </View>

            {(helpButtonPressed || activeHelpButtonPressed) && (
                <>
                    {helpButtonPressed ? (
                        <View style={tailwind('flex-row bg-gray-100 p-2 m-2 rounded-xl')}>
                            <Text style={tailwind('text-base')}>
                                You clocked{' '}
                                <Text style={tailwind('font-bold')}>
                                    {data.clockedInTime.toFixed(0)}
                                </Text>{' '}
                                hours, and you made...
                            </Text>
                        </View>
                    ) : (
                        <View style={tailwind('flex-row bg-gray-100 p-2 m-2 rounded-xl')}>
                            <Text style={tailwind('text-base')}>
                                <Text style={tailwind('font-bold')}>{data.jobTime.toFixed(0)}</Text>{' '}
                                of your hours were "active" (in a job), and you made...
                            </Text>
                        </View>
                    )}

                    <View style={tailwind('flex-row p-2 justify-around items-center')}>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${data.pay.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Base Pay</Text>
                        </View>
                        <Text style={tailwind('text-xl')}>+</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${data.tip.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Tips</Text>
                        </View>

                        <Text style={tailwind('text-xl')}>-</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success'
                                    ? `$${data.mileageDeduction.toFixed(2)}`
                                    : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Expenses</Text>
                        </View>
                        <Text style={tailwind('text-xl')}>=</Text>
                        <View style={tailwind('flex-col rounded-lg p-1 bg-gray-100')}>
                            <Text style={tailwind('font-bold text-lg')}>
                                {status == 'success' ? `$${netPay.toFixed(2)}` : '...'}
                            </Text>
                            <Text style={tailwind('text-sm')}>Net Pay</Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};

export default NetPayCard;
