import React, { useState, useEffect } from 'react';
import { LayoutAnimation, ScrollView, View, Text, Image, Pressable, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useQuery, useMutation } from 'react-query';
import moment, { Moment } from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import ScreenshotUploader from './ScreenshotPicker';
import DateRangePicker from './DateRangePicker';
import { getFilteredJobs } from './api';
import { JobItem } from './Job';
import * as Haptics from 'expo-haptics';
import { fileAsyncTransport } from 'react-native-logs';

export enum SortArgs {
    START,
    END,
    PAY,
    TIP,
    MILES,
}

export interface JobFilter {
    startDate: Moment | null;
    endDate: Moment | null;
    needsEntry: boolean;
    saved: boolean;
    minTotalPay: number | undefined;
    minTip: number | undefined;
    minMileage: number | undefined;
    sort: SortArgs | undefined;
}

const defaultFilter: JobFilter = {
    startDate: moment().startOf('week'),
    endDate: moment().endOf('day'),
    needsEntry: false,
    saved: false,
    minTotalPay: undefined,
    minTip: undefined,
    minMileage: undefined,
    sort: undefined,
};

const DateRangeFilterPill = ({
    displayText,
    onPress,
    onDateRangeChange,
    start,
    end,
}: {
    displayText: string;
    onPress: () => void;
    onDateRangeChange: (dates: { startDate: Moment | null; endDate: Moment | null }) => void;
    start: Moment | null;
    end: Moment | null;
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [dates, setDates] = useState<{ startDate: Moment | null; endDate: Moment | null }>({
        startDate: start,
        endDate: end,
    });
    const [pillText, setPillText] = useState<string>(displayText);
    useEffect(() => {
        if (start !== null && end != null) {
            setPillText(`${start.format('MM/DD/YY')}-${end.format('MM/DD/YY')}`);
        } else {
            setPillText(displayText);
        }
        setDates({ startDate: start, endDate: end });
    }, [start, end]);

    return (
        <>
            <Pressable
                style={[
                    tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
                    start && end ? tailwind('bg-black') : null,
                ]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOpen(!open);
                }}
            >
                <Text
                    style={[
                        tailwind('text-sm font-bold'),
                        start && end ? tailwind('text-white') : tailwind('text-black'),
                    ]}
                >
                    {pillText}
                </Text>
            </Pressable>

            <Modal
                style={tailwind('flex-col')}
                onDismiss={() => setOpen(false)}
                isVisible={open}
                hasBackdrop={true}
                onBackdropPress={() => {
                    console.log('backdrop pressed');
                    setOpen(false);
                }}
                backdropOpacity={0.9}
                presentationStyle={'overFullScreen'}
                useNativeDriverForBackdrop={true}
                swipeDirection={'down'}
                onSwipeComplete={() => setOpen(false)}
                onModalWillHide={() => {
                    if (dates.startDate == null || dates.endDate == null) {
                        onDateRangeChange({ startDate: null, endDate: null });
                    } else if (dates.startDate != start || dates.endDate != end) {
                        onDateRangeChange(dates);
                    }
                }}
            >
                <DateRangePicker
                    initialRange={[
                        moment(dates.startDate).format('YYYY-MM-DD'),
                        moment(dates.endDate).format('YYYY-MM-DD'),
                    ]}
                    onSuccess={(start, end) => {
                        setDates({ startDate: moment(start), endDate: moment(end) });
                    }}
                    theme={{ markColor: '#0FB981', markTextColor: 'white' }}
                />

                <Pressable
                    style={tailwind('justify-self-end rounded-2xl m-2 p-2 bg-red-300')}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onDateRangeChange({ startDate: null, endDate: null });
                        setDates({ startDate: null, endDate: null });
                        setOpen(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    }}
                >
                    <Text style={tailwind('text-white text-xl font-bold self-center')}>
                        Clear Filter
                    </Text>
                </Pressable>
                <Pressable
                    style={tailwind('justify-self-end rounded-2xl m-2 p-2 bg-green-500')}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onDateRangeChange(dates);
                        setOpen(false);
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    }}
                >
                    <Text style={tailwind('text-white text-xl font-bold self-center')}>Filter</Text>
                </Pressable>
            </Modal>
        </>
    );
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
        style={[
            tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
            value ? tailwind('bg-black') : null,
        ]}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
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
        style={[
            tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
            value ? tailwind('bg-black') : null,
        ]}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
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

export const JobFilterList = ({ inputFilters }: { inputFilters?: JobFilter }) => {
    console.log('input filters:', inputFilters);
    // routing gives us dates as strings, so convert them
    const [filter, setFilter] = useState<JobFilter>(inputFilters ? inputFilters : defaultFilter);
    const [allJobs, setAllJobs] = useState<{ edges: { node: Job }[] }>({ edges: [] });

    const filteredJobsStatus = useQuery(['filteredJobs', filter], getFilteredJobs, {
        keepPreviousData: true,
        onSuccess: (data) => {
            console.log('SUCCESS:', data);
        },
    });

    useEffect(() => {
        if (inputFilters) {
            setFilter({ ...inputFilters });
        }
    }, [inputFilters]);

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

    return (
        <View style={tailwind('p-5 pt-10 flex-col')}>
            <View style={tailwind('flex-col')}>
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

                <View style={tailwind('border-b border-gray-200 h-1 mb-2 mr-5 ml-5')} />
                <ScrollView
                    horizontal={true}
                    style={tailwind('content-around flex-row flex-none border-b border-gray-200')}
                >
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
                    <BinaryFilterPill
                        displayText={'Today'}
                        value={
                            // use 'hour' here because the endOf is not precise when parsed from a string, like from our route params (not sure why)
                            (filter.startDate?.isSame(moment().startOf('day'), 'hour') &&
                                filter.endDate?.isSame(moment().endOf('day'), 'hour')) ||
                            false
                        }
                        onPress={() => {
                            if (
                                filter.startDate?.isSame(moment().startOf('day'), 'hour') &&
                                filter.endDate?.isSame(moment().endOf('day'), 'hour')
                            ) {
                                setFilter({ ...filter, startDate: null, endDate: null });
                            } else {
                                setFilter({
                                    ...filter,
                                    startDate: moment().startOf('day'),
                                    endDate: moment().endOf('day'),
                                });
                            }
                        }}
                    />

                    <BinaryFilterPill
                        displayText={'This Week'}
                        value={
                            (filter.startDate?.isSame(moment().startOf('week'), 'day') &&
                                filter.endDate?.isSame(moment().endOf('day'), 'day')) ||
                            false
                        }
                        onPress={() => {
                            if (
                                filter.startDate?.isSame(moment().startOf('week'), 'day') &&
                                filter.endDate?.isSame(moment().endOf('day'), 'day')
                            ) {
                                setFilter({ ...filter, startDate: null, endDate: null });
                            } else {
                                setFilter({
                                    ...filter,
                                    startDate: moment().startOf('week'),
                                    endDate: moment().endOf('day'),
                                });
                            }
                        }}
                    />
                    <BinaryFilterPill
                        displayText={'This Month'}
                        value={
                            filter.startDate?.isSame(moment().startOf('month'), 'day') &&
                            filter.endDate?.isSame(moment().endOf('day'), 'day')
                        }
                        onPress={() => {
                            if (
                                filter.startDate?.isSame(moment().startOf('month'), 'day') &&
                                filter.endDate?.isSame(moment().endOf('day'), 'day')
                            ) {
                                setFilter({ ...filter, startDate: null, endDate: null });
                            } else {
                                setFilter({
                                    ...filter,
                                    startDate: moment().startOf('month'),
                                    endDate: moment().endOf('day'),
                                });
                            }
                        }}
                    />

                    <DateRangeFilterPill
                        displayText={'Date Range'}
                        onDateRangeChange={(dates: {
                            startDate: Moment | null;
                            endDate: Moment | null;
                        }) => {
                            setFilter({ ...filter, ...dates });
                        }}
                        start={filter.startDate}
                        end={filter.endDate}
                        onPress={() => {
                            console.log('pressed date pill');
                        }}
                    />
                    <BinaryFilterPill
                        displayText={'Past 30 Days'}
                        value={
                            filter.startDate?.isSame(
                                moment().subtract(1, 'month').startOf('day')
                            ) && filter.endDate?.isSame(moment().startOf('day'))
                        }
                        onPress={() => {
                            if (
                                filter.startDate?.isSame(
                                    moment().subtract(1, 'month').startOf('day')
                                ) &&
                                filter.endDate?.isSame(moment().startOf('day'))
                            ) {
                                setFilter({ ...filter, startDate: null, endDate: null });
                            } else {
                                setFilter({
                                    ...filter,
                                    startDate: moment().subtract(1, 'month').startOf('day'),
                                    endDate: moment().startOf('day'),
                                });
                            }
                        }}
                    />
                </ScrollView>
            </View>
            {filteredJobsStatus.isLoading ||
            filteredJobsStatus.isError ||
            filteredJobsStatus.data.allJobs.edges.length === 0 ? (
                <View style={tailwind('flex-col flex-grow justify-center items-center')}>
                    <Text style={tailwind('text-xl font-bold text-black pt-20')}>
                        No Jobs that match your filters!
                    </Text>
                </View>
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
