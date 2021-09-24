import React, { FunctionComponent, useState } from 'react';
import {
    Pressable,
    Text,
    ScrollView,
    View,
    RefreshControl,
    SafeAreaView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { tailwind } from 'tailwind';
import { useQuery, useQueryClient } from 'react-query';
import TrackingBar from '../features/clock/TrackingBar';
import SurveyCard from '../features/surveys/Surveycard';
import WeeklyCard from '../features/weeklySummary/WeeklyCard';
import { getFilteredJobs } from '../features/jobs/api';
import { useNumTrackedShifts } from '../features/clock/api';
import { Job, RootStackParamList, HomeScreenNavigationProp } from '../types';
import { incrementHintIndex } from '../features/history/OnboardingSlice';

import { useDispatch, useSelector } from 'react-redux';

import moment from 'moment';
import { RootState } from '@/store';
import Tooltip from 'react-native-walkthrough-tooltip';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation }: { navigation: HomeScreenNavigationProp }) {
    const dispatch = useDispatch();
    const dismissedCombineHint = useSelector(
        (state: RootState): boolean => state.onboarding.dismissedClockInHint || false
    );
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
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();
    const onRefresh = () => {
        setRefreshing(true);
        queryClient.invalidateQueries('trackedJobs');
        queryClient.invalidateQueries('surveys');
        setRefreshing(false);
    };
    const dismissedClockInHint = useSelector(
        (state: RootState): boolean => state.onboarding.dismissedClockInHint || false
    );
    const [showClockInHint, setShowClockInHint] = useState<boolean>(true);
    const hintIndex = useSelector(
        (state: RootState): number => state.onboarding.onboardingHintIndex
    );
    console.log('hint:', hintIndex);
    return (
        <SafeAreaView style={tailwind('bg-gray-100 h-full pt-10')}>
            <StatusBar style="dark" />
            <Tooltip
                isVisible={showClockInHint && (!hintIndex || hintIndex == 0)}
                useReactNativeModal={false}
                backgroundColor={'rgba(0,0,0,0.2)'}
                allowChildInteraction={false}
                childrenWrapperStyle={tailwind('-mt-12')}
                content={
                    <View style={tailwind('flex-col')}>
                        <Text style={tailwind('text-lg font-bold')}>Welcome to Gigbox!</Text>
                        <Text style={tailwind('text-base')}>
                            When you start a shift, clock in here. Your mileage and time will
                            automatically be tracked while you work.
                        </Text>
                        <Pressable
                            style={tailwind('bg-black p-1 m-2 rounded-lg items-center')}
                            onPress={() => dispatch(incrementHintIndex())}
                        >
                            <Text style={tailwind('text-white text-base font-bold')}>Next</Text>
                        </Pressable>
                    </View>
                }
                placement="bottom"
            >
                <TrackingBar />
            </Tooltip>
            <ScrollView
                style={tailwind('bg-gray-100 h-full')}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <SurveyCard />
                <View style={[tailwind('bg-white m-2 p-5 rounded-2xl flex-col')]}>
                    <Text style={tailwind('text-black text-xl font-bold')}>Today</Text>

                    <View
                        style={tailwind('border-b border-green-500 mr-5 -ml-5 p-0 pt-1 pb-2')}
                    ></View>
                    <View style={tailwind('flex-row p-2')}>
                        <Text style={tailwind('text-black text-base')}>
                            {numTrackedJobsStatus.status == 'success' &&
                            numTrackedJobsStatus.data > 0
                                ? `Gigbox tracked ${numTrackedJobsStatus.data} jobs today so far.`
                                : `You haven't tracked any jobs yet today.`}
                        </Text>
                    </View>
                    <Tooltip
                        isVisible={hintIndex == 1}
                        backgroundColor={'rgba(0,0,0,0.2)'}
                        allowChildInteraction={false}
                        onClose={() => null}
                        content={
                            <View style={tailwind('flex-col')}>
                                <Text style={tailwind('text-base')}>
                                    When you clock out, Gigbox will automatically separate your
                                    drive into Jobs. Check back here, or go to the 'Jobs' screen, to
                                    add pay, combine jobs, and track your work.
                                </Text>
                                <Pressable
                                    style={tailwind('bg-black p-1 m-2 rounded-lg items-center')}
                                    onPress={() => {
                                        dispatch(incrementHintIndex());
                                        navigation.navigate('Jobs', {
                                            screen: 'Tracked Jobs',
                                        });
                                    }}
                                >
                                    <Text style={tailwind('text-white text-base font-bold')}>
                                        Next
                                    </Text>
                                </Pressable>
                            </View>
                        }
                        childrenWrapperStyle={Platform.OS == 'android' && tailwind('-mt-5')}
                        childContentSpacing={Platform.OS == 'android' ? 25 : 4}
                        placement="top"
                    >
                        {numTrackedJobsStatus.status == 'success' && (
                            <Pressable
                                style={[tailwind('p-2 bg-black rounded-lg items-center w-full')]}
                                onPress={() =>
                                    navigation.navigate('Jobs', {
                                        screen: 'Tracked Jobs',
                                        params: {
                                            filters: {
                                                startDate: moment().startOf('day'),
                                                endDate: moment().endOf('day'),
                                            },
                                        },
                                    })
                                }
                            >
                                <Text style={tailwind('text-white text-base font-bold')}>
                                    Enter your pay for today
                                </Text>
                            </Pressable>
                        )}
                    </Tooltip>
                </View>

                <WeeklyCard />
            </ScrollView>
        </SafeAreaView>
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
