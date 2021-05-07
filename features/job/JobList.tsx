import React, { useState, useEffect } from 'react';
import { LayoutAnimation, ScrollView, View, Text, Image, Pressable, TextInput } from 'react-native';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import ScreenshotUploader from './ScreenshotPicker';
import { getFilteredJobs } from './api';
import { JobItem } from './Job';

export enum SortArgs {
    START,
    END,
    PAY,
    TIP,
    MILES,
}

export interface JobFilter {
    after: Date | undefined;
    before: Date | undefined;
    needsEntry: boolean;
    saved: boolean;
    minTotalPay: number | undefined;
    minTip: number | undefined;
    minMileage: number | undefined;
    sort: SortArgs | undefined;
}

const defaultFilter: JobFilter = {
    after: undefined,
    before: undefined,
    needsEntry: false,
    saved: false,
    minTotalPay: undefined,
    minTip: undefined,
    minMileage: undefined,
    sort: undefined,
};
const NumericFilterPill = ({
    displayText,
    onPress,
    value,
}: {
    displayText: string;
    onPress: () => void;
    value: boolean;
}) => (
    <Pressable
        style={[tailwind('rounded-2xl border m-2 p-1'), value ? tailwind('bg-black') : null]}
        onPress={onPress}
    >
        <Text
            style={[
                tailwind('text-sm font-bold'),
                value ? tailwind('text-white') : tailwind('text-black'),
            ]}
        >
            {displayText}
        </Text>
    </Pressable>
);

const BinaryFilterPill = ({
    displayText,
    onPress,
    value,
}: {
    displayText: string;
    onPress: () => void;
    value: boolean;
}) => (
    <Pressable
        style={[tailwind('rounded-2xl border m-2 p-1'), value ? tailwind('bg-black') : null]}
        onPress={onPress}
    >
        <Text
            style={[
                tailwind('text-sm font-bold'),
                value ? tailwind('text-white') : tailwind('text-black'),
            ]}
        >
            {displayText}
        </Text>
    </Pressable>
);

export const JobFilterList = () => {
    const [filter, setFilter] = useState<JobFilter>(defaultFilter);
    const [allJobs, setAllJobs] = useState<{ edges: Job[] }>({ edges: [] });
    const filteredJobsStatus = useQuery(['filteredJobs', filter], getFilteredJobs, {
        keepPreviousData: true,
        onSuccess: (data) => {
            console.log('SUCCESS:', data);
        },
    });
    const queryClient = useQueryClient();
    console.log('Filtered jobs status:', filteredJobsStatus);
    console.log('new filter:', filter);

    useEffect(() => {
        queryClient.invalidateQueries('filteredJobs');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [filter]);

    useEffect(() =>
        setAllJobs(
            filteredJobsStatus.isLoading || filteredJobsStatus.isError
                ? { edges: [] }
                : filteredJobsStatus.data.allJobs
        )
    );

    console.log("allJobs:", allJobs)

    return (
        <View style={tailwind('p-5 pt-10')}>
            <View style={tailwind('content-end flex-col')}>
                <View style={tailwind('flex-row p-2')}>
                    <Text style={tailwind('text-3xl text-green-500 font-bold')}>
                        {allJobs.edges.length}
                    </Text>
                    <Text style={tailwind('text-3xl font-bold')}> Jobs</Text>
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
                                .map((n) => n.node.totalPay)
                                .reduce((a, b) => a + b, 0)
                                .toFixed(1)}
                        </Text>
                        <Text style={tailwind('text-xl font-bold')}> Total pay</Text>
                    </View>
                    <View style={tailwind('flex-row p-2')}>
                        <Text style={tailwind('text-xl text-green-500 font-bold')}>
                            $
                            {allJobs.edges
                                .map((n) => n.node.tip)
                                .reduce((a, b) => a + b, 0)
                                .toFixed(1)}
                        </Text>
                        <Text style={tailwind('text-xl font-bold')}> Tips</Text>
                    </View>
                    <View style={tailwind('flex-row p-2')}>
                        <Text style={tailwind('text-xl text-green-500 font-bold')}>
                            $
                            {allJobs.edges
                                .map((n) => n.node.tip)
                                .reduce((a, b) => a + b, 0)
                                .toFixed(1)}
                        </Text>
                        <Text style={tailwind('text-xl font-bold')}> Tips</Text>
                    </View>
                </View>

                <View style={tailwind('border-b border-gray-200 h-1 mb-2 mr-5 ml-0')} />
                <View style={tailwind('overflow-scroll content-around flex-row ')}>
                    <BinaryFilterPill
                        displayText={'Needs Entry'}
                        value={filter.needsEntry}
                        onPress={() =>
                            setFilter({
                                ...filter,
                                needsEntry: !filter.needsEntry ? true : false,
                                saved: false,
                            })
                        }
                    />
                    <BinaryFilterPill
                        displayText={'Saved'}
                        value={filter.saved}
                        onPress={() =>
                            setFilter({
                                ...filter,
                                saved: !filter.saved ? true : false,
                                needsEntry: false,
                            })
                        }
                    />
                </View>
            </View>
            {filteredJobsStatus.isLoading || filteredJobsStatus.isError ? (
                <Text>is loading...</Text>
            ) : (
                <JobList jobs={filteredJobsStatus.data.allJobs.edges}></JobList>
            )}
        </View>
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
        <ScrollView style={[tailwind('flex-col w-full pl-2 pr-2 bg-gray-100')]}>
            {jobs?.map((j) => (
                <JobItem job={j.node} key={j.node.id} />
            ))}
        </ScrollView>
    );
};
