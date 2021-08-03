import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import moment, { Moment } from 'moment';
import React, { useState } from 'react';
import { Dimensions, View, ScrollView, Text } from 'react-native';
import { StackedBarChart, BarChart } from 'react-native-chart-kit';
import { useQuery } from 'react-query';
import { tailwind } from 'tailwind';

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
    console.log('sending query w vars:', vars);
    const res = client.request(query, vars);
    return res;
};

export const WeeklyStats = () => {
    const [chartData, setChartData] = useState(null);
    const [startDate, setStartDate] = useState(moment().startOf('week'));
    const [endDate, setEndDate] = useState(moment());
    const { status, data } = useQuery(
        ['stats', 'weeklyStats', startDate, endDate],
        () => getDailyStats(startDate, endDate),
        {
            onError: (err) => {
                console.log('error:', err);
            },
            select: (data) => {
                console.log('Successfully got weekly stats:', data);
                const d = data.getDailyStats.data;

                const cd = {
                    labels: d.map((d) => moment(d.date).format('dd')),
                    legend: ['Base Pay', 'Tip'],
                    // data: [
                    //     [10, 2],
                    //     [14, 3],
                    // ],
                    datasets: [
                        {
                            data: 
                                d.map(
                                (d) => Math.floor((Math.random() + 1) * 10)
                                // Math.floor((Math.random() + 1) * 5),
                                ),
                        }
                    ],
                    barColors: ['#dfe4ea', '#a4b0be'],
                };
                console.log('Setting chart data:', cd);
                return cd;
            },
        }
    );
    const screenWidth = Dimensions.get('window').width;

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        withInnerLines: false,
        backgroundGradientTo: '#ffffff',
        barRadius: 10,
        showBarTops: false,
        color: (opacity = 1) => `rgba(80, 80, 80, 1)`,
        strokeWidth: 3, // optional, default 3
        barPercentage: 0.5,
        yAxisLabel: "$",
        fromZero: true,
        useShadowColorFromDataset: false, // optional
    };

    console.log('chart data:', chartData);
    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <Text style={tailwind('font-bold text-3xl')}>This Week</Text>
            <View style={tailwind('flex-row rounded-lg ')}>
                <ScrollView style={tailwind('flex-row w-full m-2')} horizontal={true}>
                    {status == 'success' && (
                        <BarChart
                            style={{
                                borderColor: 'black',
                                borderWidth: 0,
                                borderRadius: 4,
                                width: 400,
                            }}
                            withInnerLines={false}
                            flatColor={true}
                            showBarTops={false}
                            showValuesOnTopOfBars={true}
                            fromZero={true}
                            data={data}
                            width={screenWidth * 0.9}
                            height={175}
                            chartConfig={chartConfig}
                        />
                    )}
                </ScrollView>
            </View>
        </View>
    );
};
