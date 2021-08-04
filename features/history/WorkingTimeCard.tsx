import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { store } from '../../store/store';
import { getClient } from '../../utils';
import { gql } from 'graphql-request';
import { DateRangeFilterPill } from '../../components/FilterPills';
import { ContributionGraph, ProgressChart } from 'react-native-chart-kit';
import ProgressBar from './ProgressBar';
import { LinearGradient } from 'expo-linear-gradient';

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
                startDate
                endDate
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
        ['stats', 'workingTime', dates.startDate, dates.endDate],
        () => {
            console.log('dates:', dates);
            return getWorkingTime(dates.startDate, dates.endDate);
        },
        {
            onSuccess: (d) => {
                console.log('Got working time:', d);
            },
            onError: (err) => {
                console.log('working time error:', err);
            },
            select: (d) => {
                return {
                    ...d.getWorkingTime,
                    clockPct: 1,
                    jobPct: d.getWorkingTime.jobTime / d.getWorkingTime.clockedInTime,
                };
            },
        }
    );

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(30, 30, 30, ${opacity || 1})`,
        strokeWidth: 3, // optional, default 3
        barPercentage: 0.2,
        useShadowColorFromDataset: false, // optional
    };

    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <Text style={tailwind('font-bold text-3xl')}>Working Time</Text>
            <ScrollView
                horizontal={true}
                style={tailwind('border-t border-b border-gray-100 flex-row w-full')}
            >
                <DateRangeFilterPill
                    displayText={'All Time - Select Dates'}
                    end={dates.endDate}
                    start={dates.startDate}
                    onDateRangeChange={setDates}
                />
            </ScrollView>

            {status == 'success' && (data.clockedInTime == 0 || data.jobTime == 0) && (
                <View style={tailwind('flex-row w-full p-2')}>
                    <Text style={tailwind('text-lg')}>
                        No working time to show. Clock in and track your jobs to see your working
                        time.
                    </Text>
                </View>
            )}
            <View style={tailwind('flex-row w-full pl-2 pr-2')}>
                {status == 'success' && data.clockedInTime > 0 && data.jobTime > 0 && (
                    <ProgressBar
                        bgcolor={'#000000'}
                        completed={data.jobPct}
                        total={`${data.clockedInTime.toFixed(0)} hrs`}
                        barCaption={`${data.jobTime.toFixed(0)} hrs in tracked jobs`}
                        caption={`You tracked ${data.clockedInTime.toFixed(
                            0
                        )} hours in total, and ${(data.clockedInTime - data.jobTime).toFixed(
                            0
                        )} hours were spent waiting.`}
                    />
                )}
            </View>

            {status == 'success' && data.clockedInTime > 0 && data.jobTime > 0 && (
                <View
                    style={tailwind(
                        'flex-col w-full items-start justify-start mt-2 pt-2 border-t border-gray-100'
                    )}
                >
                    <Text style={tailwind('text-lg font-bold')}>Calendar</Text>
                    <Text style={tailwind('text-base')}>
                        Darker blocks show days you worked more hours.
                    </Text>
                    <View style={tailwind('flex-col w-full content-center items-center')}>
                        <View style={tailwind('w-1/2 flex-row items-center')}>
                            <Text style={tailwind('text-base pr-1')}>0 hrs</Text>
                            <LinearGradient
                                // Button Linear Gradient
                                colors={['#cecece', '#1e1e1e']}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    tailwind('flex-row w-5/6 rounded-xl h-2 mt-1 mb-1'),
                                    { borderRadius: 4 },
                                ]}
                            ></LinearGradient>

                            <Text style={tailwind('text-base pl-1')}>
                                {Math.max(...data.shiftHoursDaily.map((d) => d.hrs)).toFixed(0)} hrs
                            </Text>
                        </View>
                    </View>

                    <View style={tailwind('flex-row w-full')}>
                        <View
                            style={tailwind(
                                'flex-col flex-shrink items-end justify-around pt-12 w-8 pr-1'
                            )}
                        >
                            <Text>M</Text>
                            <Text>T</Text>
                            <Text>W</Text>
                            <Text>Th</Text>
                            <Text>F</Text>
                            <Text>Sa</Text>
                            <Text>Su</Text>
                        </View>

                        <ScrollView style={tailwind('flex-row w-full')} horizontal={true}>
                            <ContributionGraph
                                style={{
                                    borderColor: 'black',
                                    borderWidth: 0,
                                    borderRadius: 4,
                                    width: 400,
                                }}
                                values={data.shiftHoursDaily}
                                accessor={'hrs'}
                                endDate={dates.endDate || new Date()}
                                numDays={
                                    dates.startDate
                                        ? moment(dates.endDate || new Date()).diff(
                                              dates.startDate,
                                              'days'
                                          )
                                        : 90
                                }
                                width={'100%'}
                                height={200}
                                showOutOfRangeDays={false}
                                chartConfig={chartConfig}
                            />
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
};

export default WorkingTimeCard;
