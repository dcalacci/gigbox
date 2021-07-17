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
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false, // optional
    };
    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <ScrollView horizontal={true} style={tailwind('flex-row w-full')}>
                <Text style={tailwind('font-bold text-3xl')}>Working Time</Text>
                <DateRangeFilterPill
                    displayText={'All Time - Select Dates'}
                    end={dates.endDate}
                    start={dates.startDate}
                    onDateRangeChange={setDates}
                />
            </ScrollView>
            <View style={tailwind('flex-row w-full pl-2 pr-2')}>
                {status == 'success' && (
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
            {status == 'success' && (
                <View
                    style={tailwind(
                        'flex-col w-full items-start justify-start mt-2 pt-2 border-t border-gray-100'
                    )}
                >
                    <Text style={tailwind('text-lg font-bold')}>Calendar</Text>
                    <Text style={tailwind('text-base')}>
                        Darker blocks show days you worked more hours.
                    </Text>
                    <View style={tailwind('flex-row w-full')}>
                        <View
                            style={tailwind('flex-col flex-shrink items-end justify-around pt-12')}
                        >
                            <Text>M</Text>
                            <Text>T</Text>
                            <Text>W</Text>
                            <Text>Th</Text>
                            <Text>F</Text>
                            <Text>Sa</Text>
                            <Text>Su</Text>
                        </View>
                        <ContributionGraph
                            style={{
                                borderColor: 'black',
                                borderWidth: 0,
                                borderRadius: 4,
                                width: '90%',
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
                            showOutOfRangeDays={true}
                            chartConfig={chartConfig}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

export default WorkingTimeCard;
