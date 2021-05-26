import React, { FunctionComponent } from 'react';
import { Pressable, Text, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import TrackingBar from '../features/clock/TrackingBar';
import SurveyCard from '../features/surveys/Surveycard'
import WeeklyCard from '../features/weeklySummary/WeeklyCard';
import {
    getFilteredJobs,
} from '../features/job/api';
import { useNumTrackedShifts } from '../features/clock/api';
import { useLinkProps } from '@react-navigation/native';
import { Job } from '../types';
import moment from 'moment';

export default function TabOneScreen({ navigation }) {
    // const numTrackedJobsStatus = useNumTrackedJobsToday();
    const numJobsTodayNeedEntry = useQuery(
        [
            'trackedJobs',
            {
                startDate: moment().startOf('day'),
                endDate: moment().endOf('day'),
                needsEntry: true,
            },
        ],
        getFilteredJobs,
        {
            select: (d: { allJobs: { edges: { node: Job }[] } }) => d.allJobs.edges.length,
        }
    );

    const numTrackedJobsStatus = useQuery(
        ['trackedJobs', { startDate: moment().startOf('day'), endDate: moment().endOf('day') }],
        getFilteredJobs,
        {
            select: (d: { allJobs: { edges: { node: Job }[] } }) => d.allJobs.edges.length,
        }
    );
    const numTrackedShiftsStatus = useNumTrackedShifts();
    return (
        <View style={tailwind('bg-gray-100 h-full')}>
            <TrackingBar />
            <ScrollView style={tailwind('bg-gray-100 h-full')}>
                <SurveyCard navigation={navigation}/>
                <Pressable style={[tailwind('bg-white m-2 p-5 rounded-2xl flex-col')]}>
                    <Text style={tailwind('text-green-500 text-3xl font-bold underline')}>
                        Today
                    </Text>

                    <View
                        style={tailwind('border-b border-green-500 -mr-5 ml-5 p-0 pt-1 pb-2')}
                    ></View>
                    <Pressable
                        style={[tailwind('flex-row p-2'), { justifyContent: 'space-between' }]}
                        onPress={() =>
                            navigation.navigate('Jobs List', {
                                filters: {
                                    startDate: moment().startOf('day').format(),
                                    endDate: moment().endOf('day').format(),
                                },
                            })
                        }
                    >
                        <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                            {numTrackedJobsStatus.isLoading || numTrackedJobsStatus.isError
                                ? '... tracked jobs'
                                : `${numTrackedJobsStatus.data} tracked jobs`}
                        </Text>
                        <Ionicons name="caret-forward-outline" size={24} color="black" />
                    </Pressable>

                    <View style={tailwind('border-b border-gray-200 ml-5 mr-5')}></View>
                    <Pressable
                        style={[tailwind('flex-row p-2'), { justifyContent: 'space-between' }]}
                        onPress={() =>
                            navigation.navigate('Jobs List', {
                                filters: {
                                    needsEntry: true,
                                    startDate: moment().startOf('day').format(),
                                    endDate: moment().endOf('day').format(),
                                },
                            })
                        }
                    >
                        <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                            {numJobsTodayNeedEntry.isLoading || numJobsTodayNeedEntry.isError
                                ? '... tracked jobs'
                                : `${numJobsTodayNeedEntry.data} jobs that need entry`}
                        </Text>
                        <Ionicons name="caret-forward-outline" size={24} color="black" />
                    </Pressable>
                    <View style={tailwind('border-b border-gray-200 ml-5 mr-5')}></View>
                    <View style={[tailwind('flex-row p-2'), { justifyContent: 'space-between' }]}>
                        <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                            {numTrackedShiftsStatus.isLoading || numTrackedShiftsStatus.isError
                                ? '... tracked shifts'
                                : `${numTrackedJobsStatus.data} tracked shifts`}
                        </Text>
                        <Ionicons name="caret-forward-outline" size={24} color="black" />
                    </View>
                    <View style={tailwind('border-b border-gray-200 ml-5 mr-5')}></View>
                </Pressable>

                <WeeklyCard navigation={navigation} />
            </ScrollView>
        </View>
    );
}

type CardProps = {
    title: string;
};

const Card: FunctionComponent<CardProps> = ({ title }) => (
    <View style={tailwind('flex-1 w-11/12')}>
        <View style={tailwind('self-start bg-transparent border w-10/12 h-36')}></View>
        <View
            style={tailwind(
                'self-start absolute bg-transparent border-2 border-green-500 h-36 w-10/12 mt-2 ml-2 p-2'
            )}
        >
            <Text style={tailwind('text-black text-3xl font-bold')}>{title}</Text>
        </View>
    </View>
);
