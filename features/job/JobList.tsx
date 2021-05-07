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

{
    /* <DateRangePicker
                    backdropStyle={tailwind('bg-transparent')}
                    presetButtons={true}
                    onChange={(newDates: { startDate: Date | null; endDate: Date | null }) => {
                        console.log('dates:', dates);
                        setDates({ ...dates, ...newDates });
                    }}
                    endDate={dates.endDate}
                    startDate={dates.startDate}
                    displayedDate={displayedDate}
                    open={true}
                    range={true}
                >
                    <Text></Text>
                </DateRangePicker> */
}
const defaultFilter: JobFilter = {
    startDate: null,
    endDate: null,
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
    }, [start, end]);

    console.log('start end end props:', start, end);
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
                            {(
                                allJobs.edges
                                    .map((n) =>
                                        moment(n.node.endTime).diff(
                                            moment(n.node.startTime),
                                            'minutes'
                                        )
                                    )
                                    .reduce((a, b) => a + b, 0) /
                                (allJobs.edges.length > 0 ? allJobs.edges.length : 1) // don't divide by 0
                            ).toFixed(0)}
                        </Text>
                        <Text style={tailwind('text-xl font-bold')}> min (avg)</Text>
                    </View>
                    <View style={tailwind('flex-row p-2')}>
                        <Text style={tailwind('text-xl text-green-500 font-bold')}>
                            {allJobs.edges
                                .map((n) =>
                                    moment(n.node.endTime).diff(moment(n.node.startTime), 'minutes')
                                )
                                .reduce((a, b) => a + b, 0)
                                .toFixed(0)}
                        </Text>
                        <Text style={tailwind('text-xl font-bold')}> min (total)</Text>
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
                </View>
            </View>
            {filteredJobsStatus.isLoading || filteredJobsStatus.isError || filteredJobsStatus.data.allJobs.edges.length === 0 ? (
                <Text style={tailwind("text-xl font-bold text-black")}>No Jobs that match your filters!</Text>
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
