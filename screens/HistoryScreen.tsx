import {
    LayoutAnimation,
    StyleSheet,
    View,
    Text,
    ScrollView,
    Pressable,
    RefreshControl,
} from 'react-native';

import moment from 'moment';

import { StatusBar } from 'expo-status-bar';
import NetPayCard from '../features/history/NetPayCard';
import tailwind from 'tailwind-rn';
import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types';
import { uri as API_URI } from '../utils';
import { JobFilter } from '../components/FilterPills';
import { exportJobs, getFilteredJobs } from '../features/jobs/api';
import WorkingTimeCard from '../features/history/WorkingTimeCard';

export default function HistoryScreen({ route }) {
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();
    /* let filter: JobFilter | undefined; */
    const filter = route.params?.filters
        ? {
              ...route.params.filters,
              startDate: route.params.filters?.startDate
                  ? moment(route.params.filters?.startDate)
                  : null,
              endDate: route.params.filters?.endDate ? moment(route.params.filters?.endDate) : null,
          }
        : undefined;

    console.log('history filter in params:', route.params?.filters);
    const onRefresh = () => {
        setRefreshing(true);
        queryClient.invalidateQueries('netPay');
        queryClient.invalidateQueries('filteredJobs');
        setRefreshing(false);
    };
    return (
        <View style={tailwind('bg-gray-100 items-center justify-start flex-col h-full')}>
            <StatusBar style="dark" />
            {/* <Text style={styles.title}>Jobs</Text> */}
            <JobFilterList inputFilters={filter} />
            <ScrollView
                style={tailwind('p-2 m-0 flex-col flex w-full')}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <NetPayCard />
                <WorkingTimeCard />
            </ScrollView>
        </View>
    );
}

const defaultFilter: JobFilter = {
    startDate: moment().startOf('year'),
    endDate: moment().endOf('day'),
    minTotalPay: undefined,
    minTip: undefined,
    minMileage: undefined,
    sort: undefined,
};

export const JobFilterList = ({ inputFilters }: { inputFilters?: JobFilter }) => {
    // routing gives us dates as strings, so convert them
    const [filter, setFilter] = useState<JobFilter>(inputFilters ? inputFilters : defaultFilter);
    const [allJobs, setAllJobs] = useState<{ edges: { node: Job }[] }>({ edges: [] });

    const exportSelection = useMutation(exportJobs, {
        onSuccess: async (d) => {
            console.log('exported jobs:', d);
            Linking.openURL(`${API_URI}${d.exportJobs.fileUrl}`);
        },
    });

    const filteredJobsStatus = useQuery(['filteredJobs', filter], getFilteredJobs, {
        onSuccess: (data) => {
            console.log('filtered all jobs:', data, filter);
            setAllJobs(data.allJobs);
        },
    });

    useEffect(() => {
        if (inputFilters) {
            setFilter({ ...inputFilters });
        }
    }, [inputFilters]);

    const queryClient = useQueryClient();

    useEffect(() => {
        console.log('invalidating filtered jobs query...');
        queryClient.invalidateQueries('filteredJobs');
        queryClient.invalidateQueries('trackedJobs');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [filter]);

    const avgTime = (edges: { node: Job }[]) => {
        const m =
            edges
                .map((n) => moment(n.node.endTime).diff(moment(n.node.startTime), 'minutes'))
                .reduce((a, b) => a + b, 0) / (edges.length > 0 ? edges.length : 1);
        const hr = m > 60;
        return (
            <>
                <Text style={tailwind('text-xl text-green-500 font-bold')}>
                    {hr ? (m / 60).toFixed(0) : m.toFixed(0)}
                </Text>
                <Text style={tailwind('text-xl font-bold')}> {hr ? 'hr' : 'min'} (avg)</Text>
            </>
        );
    };

    const totalTime = (edges: { node: Job }[]) => {
        const m = edges
            .map((n) => moment(n.node.endTime).diff(moment(n.node.startTime), 'minutes'))
            .reduce((a, b) => a + b, 0);

        const hr = m > 60;
        return (
            <>
                <Text style={tailwind('text-xl text-green-500 font-bold')}>
                    {hr ? (m / 60).toFixed(0) : m.toFixed(0)}
                </Text>
                <Text style={tailwind('text-xl font-bold')}> {hr ? 'hr' : 'min'} (total)</Text>
            </>
        );
    };
    const JobFilterListHeader = (
        <View style={tailwind('flex-col w-full')}>
            <View style={tailwind('flex-row items-center justify-between mt-5')}>
                <View style={tailwind('flex-row justify-start')}>
                    <Text style={tailwind('text-4xl font-bold')}>Your Stats</Text>
                </View>
                <Pressable
                    style={tailwind('rounded-lg bg-green-500 p-2 flex-row')}
                    onPress={() => {
                        exportSelection.mutate({ ids: allJobs.edges.map(({ node }) => node.id) });
                        console.log('Exporting data...');
                    }}
                >
                    <Ionicons name="download" color="white" size={20} />
                    <Text style={tailwind('text-lg font-bold text-white')}>Export</Text>
                </Pressable>
            </View>
            <View style={tailwind('flex-row flex-wrap p-2')}>
                <View style={tailwind('flex-row p-2')}>
                    <Text style={tailwind('text-xl text-green-500 font-bold')}>
                        {allJobs.edges
                            .map((n) => n.node.mileage)
                            .reduce((a, b) => a + b, 0)
                            .toFixed(1)}
                    </Text>
                    <Text style={tailwind('text-xl font-bold')}> Miles</Text>
                </View>
                <View style={tailwind('flex-row p-2')}>
                    <Text style={tailwind('text-xl text-green-500 font-bold')}>
                        $
                        {allJobs.edges
                            .map((n) => (n.node.totalPay ? n.node.totalPay : 0))
                            .reduce((a, b) => a + b, 0)
                            .toFixed(1)}
                    </Text>
                    <Text style={tailwind('text-xl font-bold')}> Total pay</Text>
                </View>
                <View style={tailwind('flex-row p-2')}>
                    <Text style={tailwind('text-xl text-green-500 font-bold')}>
                        $
                        {allJobs.edges
                            .map((n) => (n.node.tip ? n.node.tip : 0))
                            .reduce((a, b) => a + b, 0)
                            .toFixed(1)}
                    </Text>
                    <Text style={tailwind('text-xl font-bold')}> Tips</Text>
                </View>
                <View style={tailwind('flex-row p-2')}>{avgTime(allJobs.edges)}</View>
                <View style={tailwind('flex-row p-2')}>{totalTime(allJobs.edges)}</View>
            </View>
        </View>
    );

    return (
        <>
            <View style={tailwind('p-5 pt-10 flex-col')}>{JobFilterListHeader}</View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
