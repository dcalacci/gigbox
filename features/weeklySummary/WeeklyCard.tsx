import React, { FunctionComponent, useState } from 'react';
import { Pressable, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchWeeklySummary } from './api';
import { log } from '../../utils';
import { HomeScreenNavigationProp, Job } from '../../types';
import { getFilteredJobs } from '../job/api';


const WeeklyCard: FunctionComponent = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const weeklySummary = useQuery(['trackedJobs', 'weeklySummary'], fetchWeeklySummary);
    const jobsNeedEntryStatus = useQuery(
        [
            'trackedJobs',
            {
                startDate: moment().startOf('week'),
                endDate: moment().endOf('week'),
                needsEntry: true,
            },
        ],
        getFilteredJobs,
        {
            select: (d: { allJobs: { edges: { node: Job }[] } }) => d.allJobs.edges.length,
        }
    );
    if (weeklySummary.isError) log.error('Weekly summary error', weeklySummary);
    if (weeklySummary.isLoading || weeklySummary.isError) {
        return (
            <View style={tailwind('flex-1 w-11/12')}>
                <Text>Loading...</Text>
            </View>
        );
    } else {
        log.info('summary:', weeklySummary);

        const summary = weeklySummary.data.getWeeklySummary;
        return (
            <View style={[tailwind('flex-1 m-2 p-5 rounded-xl bg-white flex-col')]}>
                <Text style={tailwind('text-green-500 text-3xl font-bold underline')}>
                    This week
                </Text>

                <View style={tailwind('border-b border-green-500 -mr-5 ml-5 p-0 pt-1 pb-2')}></View>
                <View style={tailwind('flex-row flex-wrap items-start content-around mt-5 pb-5')}>
                    <View style={tailwind('flex-col items-start w-1/3 flex-auto')}>
                        <Text style={tailwind('ml-1')}>jobs</Text>

                        <Text style={tailwind('text-2xl text-green-500 font-bold')}>
                            {summary.numJobs}
                        </Text>
                    </View>
                    <View style={tailwind('flex-col items-start w-1/3 flex-auto')}>
                        <Text style={tailwind('ml-1')}>total pay</Text>

                        <Text style={tailwind('text-2xl text-green-500 font-bold')}>
                            ${summary.totalPay.toFixed(2)}
                        </Text>
                    </View>
                    <View style={tailwind('flex-col items-start w-1/3 flex-auto')}>
                        <Text style={tailwind('ml-1')}>total tips</Text>

                        <Text style={tailwind('text-2xl text-green-500 font-bold')}>
                            ${summary.totalTips.toFixed(2)}
                        </Text>
                    </View>
                    <View style={tailwind('flex-col items-start w-1/3 flex-auto')}>
                        <Text style={tailwind('ml-1')}>miles driven</Text>

                        <Text style={tailwind('text-2xl text-green-500 font-bold')}>
                            {summary.miles.toFixed(2)}mi
                        </Text>
                    </View>
                </View>

                <View style={tailwind('border-b border-gray-200 ml-5 mr-5')}></View>
                <Pressable
                    style={[tailwind('flex-row p-2'), { justifyContent: 'space-between' }]}
                    onPress={() =>
                        navigation.navigate('Jobs', {
                            filters: {
                                startDate: moment().startOf('week'),
                                endDate: moment().endOf('day'),
                                needsEntry: true,
                            },
                        })
                    }
                >
                    <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                        {jobsNeedEntryStatus.isLoading || jobsNeedEntryStatus.isError
                            ? '... jobs that need entry'
                            : `${jobsNeedEntryStatus.data} jobs that need entry`}
                    </Text>
                    <Ionicons name="caret-forward-outline" size={24} color="black" />
                </Pressable>
            </View>
        );
    }
};

export default WeeklyCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 5,
    },
});
