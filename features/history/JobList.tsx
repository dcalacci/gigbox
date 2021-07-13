import React, { useState, useEffect } from 'react';
import { LayoutAnimation, View, Text, Pressable } from 'react-native';
import { Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { tailwind } from 'tailwind';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../../types';
import { getFilteredJobs, exportJobs } from '../jobs/api';
import { JobItem } from '../jobs/Job';
import { uri as API_URI } from '../../utils';
import { defaultFilter, JobFilter } from '../../components/FilterPills';

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
        keepPreviousData: true,
        onSuccess: (data) => {
            setAllJobs(
                filteredJobsStatus.isLoading || filteredJobsStatus.isError
                    ? { edges: [] }
                    : data.allJobs
            );
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
        <View style={tailwind('flex-col')}>
            <View style={tailwind('flex-row p-2 justify-between mt-5')}>
                <View style={tailwind('flex-row justify-start')}>
                    <Text style={tailwind('text-4xl text-green-500 font-bold')}>
                        {allJobs.edges.length}
                    </Text>
                    <Text style={tailwind('text-4xl font-bold')}> Jobs</Text>
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
            <View style={tailwind('flex-row p-2 flex-wrap')}>
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

//List of job components
//TODO: remove shift screenshot bits here
export const JobList = ({ jobs }: { jobs: [{ node: Job }] | undefined }) => {
    const [filter, setFilter] = useState<JobFilter>();
    // const { status, data, error, isFetching } = useFilteredJobs(filter);
    // console.log('fitlered job status', status);
    // console.log('jobs:', jobs);
    return (
        <KeyboardAwareScrollView style={[tailwind('flex-col w-full ml-0 mr-0 pl-2 mr-2')]}>
            {jobs?.map((j) => (
                <JobItem job={j.node} key={j.node.id} />
            ))}
        </KeyboardAwareScrollView>
    );
};
