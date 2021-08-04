import React, { useState } from 'react';
import { Dimensions, Text, View } from 'react-native';
import moment, { Moment } from 'moment';
import { tailwind } from 'tailwind';

import ProgressBar from './ProgressBar';

import { Ionicons } from '@expo/vector-icons';
import { useWorkingTime } from '../../hooks/api';
import { ClockedInCalendar } from '../adjustHours/AdjustHoursCard';

const WorkingTimeCard = () => {
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: null,
        endDate: moment(),
    });

    const { status, data } = useWorkingTime(dates.startDate, dates.endDate);

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(30, 30, 30, ${opacity || 1})`,
        strokeWidth: 3, // optional, default 3
        barPercentage: 0.2,
        useShadowColorFromDataset: false, // optional
    };

    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={tailwind('rounded-lg bg-white p-2 w-full flex-col mt-2 mb-2')}>
            <Text style={tailwind('font-bold text-3xl')}>Working Time</Text>
            <Text style={tailwind('text-sm')}>Stats on how long you've worked and waited.</Text>

            {status == 'success' && (data.clockedInTime == 0 || data.jobTime == 0) && (
                <View style={tailwind('flex-row w-full p-2')}>
                    <Text style={tailwind('text-lg')}>
                        No working time to show. Clock in and track your jobs to see your working
                        time.
                    </Text>
                </View>
            )}
            <View style={tailwind('flex-col w-full pr-2 border-t-2 border-gray-100 mt-2 pt-2')}>
                <View style={tailwind('justify-start flex-row items-center')}>
                    <Ionicons style={tailwind('mr-2')} size={24} name="stopwatch-outline" />
                    <Text style={tailwind('text-lg font-bold')}>Waiting Time</Text>
                </View>
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
                        )} hours were spent "waiting" (clocked in, but not on a job).`}
                    />
                )}
            </View>

            {status == 'success' && data.clockedInTime > 0 && data.jobTime > 0 && (
                <View
                    style={tailwind(
                        'flex-col w-full items-start justify-start mt-2 pt-2 border-t-2 border-gray-100'
                    )}
                >
                    <View style={tailwind('justify-start flex-row items-center')}>
                        <Ionicons style={tailwind('p-2')} size={24} name="calendar" />
                        <Text style={tailwind('text-lg font-bold')}>Calendar</Text>
                    </View>
                    <Text style={tailwind('text-black text-base m-2 pb-2 ')}>
                        Darker blocks show days you worked more hours. Tap on a day to change when
                        you clocked in - getting this right helps Gigbox estimate your hourly pay.
                    </Text>

                    <Text style={tailwind('text-gray-400 font-bold text-sm ml-2')}>
                        Hint: you might have forgotten to clock out on red days
                    </Text>
                    <ClockedInCalendar width={screenWidth * 0.8} />
                </View>
            )}
        </View>
    );
};

export default WorkingTimeCard;
