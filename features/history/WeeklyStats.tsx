import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import moment, { Moment } from 'moment';
import React, { useState } from 'react';
import { Dimensions, View, ScrollView, Text } from 'react-native';
import { useQuery } from 'react-query';
import { tailwind } from 'tailwind';
import { StackedBarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';

const getDailyStats = (startDate: Moment | null, endDate: Moment | null) => {
    const client = getClient(store);
    const query = gql`
        query query($startDate: DateTime, $endDate: DateTime) {
            getDailyStats(startDate: $startDate, endDate: $endDate) {
                data {
                    date
                    basePay
                    tip
                    expenses
                    mileage
                    activeTime
                    clockedInTime
                    hourlyPay
                    hourlyPayActive
                }
                nDays
            }
        }
    `;
    const vars = { startDate, endDate };
    const res = client.request(query, vars);
    return res;
};

export const WeeklyStats = ({
    dates = { startDate: moment().startOf('week'), endDate: moment().endOf('week') },
}: {
    dates: { startDate: Moment | null; endDate: Moment | null };
}) => {
    const { status, data } = useQuery(
        ['stats', 'weeklyStats', dates.startDate, dates.endDate],
        () => getDailyStats(dates.startDate, dates.endDate),
        {
            onError: (err) => {
                console.log('error:', err);
            },
            select: (data) => {
                const d = data.getDailyStats.data;

                const chartData = d.map((item) => {
                    return {
                        label: moment(item.date).format('dd'),
                        // tip: Math.floor((Math.random() + 1) * 10),
                        // basePay: Math.floor((Math.random() + 1) * 10),
                        tip: item.tip,
                        basePay: item.basePay,
                    };
                });
                return chartData;
            },
        }
    );
    const screenWidth = Dimensions.get('window').width;

    const colors = ['#212121', '#757575bd'];
    const keys = ['basePay', 'tip'];
    const contentInset = { left: 10, top: 10, bottom: 10 };

    //TODO: if no data, show some random bars and a message on top
    const sumPay = data?.reduce((a, b) => a + b.basePay, 0);

    return (
        <View style={tailwind('rounded-lg p-2 w-full flex-col mt-2 mb-2')}>
            <View style={tailwind('flex-row rounded-lg ')}>
                {status == 'success' && (
                    <View style={tailwind('flex-row')}>
                        {sumPay == 0 && (
                            <View style={tailwind('flex-col w-full absolute bg-gray-200 p-5 rounded-lg self-start justify-self-center')}>
                                <Text style={tailwind('text-lg')}>
                                    No pay recorded for this week. Clock in to track your pay and see stats!
                                </Text>
                            </View>
                        )}
                        <YAxis
                            data={data}
                            numberOfTicks={3}
                            svg={{ fontSize: 12, fill: 'black' }}
                            style={{ marginVertical: 20 }}
                            yAccessor={({ index }) => data[index].basePay + data[index].tip}
                            formatLabel={(value) => {
                                return `$${value}`;
                            }}
                            contentInset={contentInset}
                            spacingInner={10}
                        />

                        <View style={tailwind('flex-col')}>
                            <StackedBarChart
                                style={{ height: 200, width: screenWidth * 0.75 }}
                                keys={keys}
                                svg={{
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'bevel',
                                    strokeWidth: 10,
                                }}
                                colors={colors}
                                data={data}
                                showGrid={false}
                                animate={true}
                                contentInset={contentInset}
                            >
                                <Grid />
                            </StackedBarChart>
                            <XAxis
                                data={data}
                                style={{ marginHorizontal: 20 }}
                                xAccessor={({ index }) => index}
                                contentInset={contentInset}
                                spacingInner={10}
                                formatLabel={(value, index) => data[value].label}
                                svg={{ fontSize: 12, fill: 'black' }}
                            />
                        </View>
                    </View>
                )}
            </View>
            <View style={tailwind('flex-row')}>
                <View style={tailwind('flex-row items-center pl-1 pr-1')}>
                    <View
                        style={[tailwind('rounded w-4 h-4'), { backgroundColor: '#212121' }]}
                    ></View>
                    <Text style={tailwind('text-base p-1 ')}>Base Pay</Text>
                </View>
                <View style={tailwind('flex-row items-center pl-1 pr-1')}>
                    <View
                        style={[tailwind('rounded w-4 h-4'), { backgroundColor: '#757575bd' }]}
                    ></View>
                    <Text style={tailwind('text-base p-1 ')}>Tips</Text>
                </View>
            </View>
        </View>
    );
};
