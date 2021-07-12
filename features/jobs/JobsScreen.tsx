import React, { useState } from 'react';
import {
    Text,
    Image,
    View,
    RefreshControl,
    Pressable,
    ViewStyle,
    LayoutAnimation,
} from 'react-native';

import Toast from 'react-native-root-toast';
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { defaultJobFilter, mergeJobs, getPaginatedUncategorizedJobs } from './hooks';
import { Employers, Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { JobDetailScreen } from './JobDetailScreen';
import { JobItem } from './JobItem';
import { StyleProp } from 'react-native';
import { useEffect } from 'react';
import moment, { Moment } from 'moment';
import AnimatedEllipsis from '../../components/Ellipsis';
import { StatusBar } from 'expo-status-bar';
import { deleteJob } from '../job/api';
import { DateRangeFilterPill, JobFilter } from '../job/JobList';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import BinaryFilterPill from '../../components/BinaryFilterPill';
const TripsStack = createStackNavigator();

export default function JobsScreen({ navigation }: { navigation: TripsScreenNavigationProp }) {
    return (
        <TripsStack.Navigator
            screenOptions={{
                headerTransparent: true,
            }}
        >
            <TripsStack.Screen
                name="Trips"
                component={JobsList}
                options={{
                    headerShown: false,
                }}
            ></TripsStack.Screen>

            <TripsStack.Screen
                name="Trip Detail"
                component={JobDetailScreen}
                options={{
                    headerShown: false,
                }}
            ></TripsStack.Screen>
        </TripsStack.Navigator>
    );
}

const JobsScreenHeader = ({
    isEditing,
    onPress,
    onPressDelete,
    onPressCombine,
    deleteEnabled,
    combineEnabled,
}: {
    isEditing: boolean;
    onPress: () => void;
    onPressDelete: () => void;
    onPressCombine: () => void;
    deleteEnabled: boolean;
    combineEnabled: boolean;
}) => {
    const EditButton = () =>
        isEditing ? (
            <View style={tailwind('flex-row justify-around')}>
                {isEditing && deleteEnabled ? (
                    <Pressable
                        onPress={() => onPressDelete()}
                        style={[
                            tailwind(
                                'flex-row rounded-lg ml-2 mr-2 p-1 border-2 border-red-400 items-center'
                            ),
                            tailwind('bg-red-400'),
                        ]}
                    >
                        <Text style={[tailwind('text-red-400 font-bold'), tailwind('text-white')]}>
                            Delete
                        </Text>
                    </Pressable>
                ) : null}
                {isEditing ? (
                    <Pressable
                        onPress={() =>
                            combineEnabled
                                ? onPressCombine()
                                : Toast.show('Select more than one Job to combine them.')
                        }
                        style={[
                            tailwind('flex-row rounded-lg ml-2 mr-2 p-1 border-2 items-center'),
                            combineEnabled ? tailwind('bg-black') : null,
                        ]}
                    >
                        <Text
                            style={[
                                tailwind('text-black font-bold'),
                                combineEnabled ? tailwind('text-white') : null,
                            ]}
                        >
                            Combine
                        </Text>

                        <Ionicons
                            name="git-merge"
                            color={combineEnabled ? 'white' : 'black'}
                            size={16}
                            style={tailwind('p-1')}
                        />
                    </Pressable>
                ) : null}

                <Pressable
                    onPress={onPress}
                    style={[tailwind('flex-row rounded-lg ml-2 mr-2 p-2 border-2 items-center')]}
                >
                    <Text style={tailwind('text-black font-bold')}>Cancel</Text>
                </Pressable>
            </View>
        ) : (
            <Pressable
                onPress={onPress}
                style={[tailwind('flex-row rounded-lg p-2 bg-black items-center')]}
            >
                <Text style={tailwind('text-white font-bold')}>Edit</Text>
                <Ionicons name="create" color="white" size={16} style={tailwind('p-1')} />
            </Pressable>
        );
    return (
        <View style={tailwind('flex-col w-full bg-gray-100 h-24')}>
            <View style={tailwind('flex-row p-2 mt-5 justify-between')}>
                <Text style={[tailwind('text-4xl font-bold')]}>Jobs</Text>
                <EditButton />
            </View>
        </View>
    );
};

const JobsListHeader = ({
    cancelCombine,
    isCombining,
    selectedJobs,
    isVisible,
    onConfirmCombine,
}: {
    cancelCombine: () => void;
    isCombining: boolean;
    selectedJobs: String[];
    isVisible: boolean;
    onConfirmCombine: () => void;
}) => {
    const [jobPreview, setJobPreview] = useState<Job>();
    const [totalPay, setTotalPay] = useState<number>();
    const [tip, setTip] = useState<number>();
    const [employer, setEmployer] = useState<Employers>();
    const [dryRun, setDryRun] = useState<boolean>(true);

    const { mutate, status } = useMutation(mergeJobs, {
        onSuccess: async (data, v, c) => {
            setJobPreview(data.mergeJobs.mergedJob);
            if (v.dryRun == false) {
                onConfirmCombine();
                Toast.show(`Successfully merged ${selectedJobs.length} trips!`);
            }
        },
        onError: (err, v) => {
            log.error("Couldn't merge jobs...");
            if (v.dryRun == false) Toast.show('Had trouble merging those trips. Try again?');
        },
    });

    // create a dry-run preview each time our selected jobs changes
    useEffect(() => {
        if (selectedJobs.length > 0) {
            setDryRun(true);
            mutate({
                jobIds: selectedJobs,
                dryRun: true,
                totalPay,
                tip,
                employer,
            });
        }
    }, [selectedJobs]);

    // separate useEffect for the tip, pay, and employer - it's faster this way.
    useEffect(() => {
        if (jobPreview !== undefined) {
            let newJob = jobPreview;
            newJob.totalPay = totalPay;
            newJob.tip = tip;
            if (employer) newJob.employer = employer;
            setJobPreview(newJob);
        }
    }, [totalPay, tip, employer]);

    const CombinedTripPreview = () => {
        if (jobPreview !== undefined) {
            const startTimeText = moment.utc(jobPreview.startTime).local().format('LT');
            const endTimeText = moment.utc(jobPreview.endTime).local().format('LT');
            return (
                <View style={tailwind('flex-col')}>
                    <Text style={tailwind('text-black p-1')}>
                        You'll make one {jobPreview.mileage.toFixed(2)} mi trip, from{' '}
                        {startTimeText} to {endTimeText}.
                    </Text>
                    <JobItem
                        job={jobPreview}
                        displayDetails={true}
                        setEmployer={setEmployer}
                        setTotalPay={(s) => setTotalPay(parseFloat(s))}
                        setTip={(s) => setTip(parseFloat(s))}
                    />
                </View>
            );
        } else {
            return <></>;
        }
    };

    const confirmCombine = () => {
        setDryRun(false);
        if (jobPreview !== undefined) {
            mutate({
                jobIds: selectedJobs,
                dryRun: false,
                totalPay: totalPay,
                tip: tip,
                employer: employer,
            });
        } else {
            Toast.show('Had trouble merging those trips. Try again?');
        }
    };

    return (
        <View style={tailwind('flex-col w-full')}>
            {isCombining ? (
                <View style={tailwind('flex-col rounded-lg bg-white m-1 p-2 items-center')}>
                    {isVisible ? (
                        <>
                            <Text style={tailwind('font-bold text-lg')}>
                                Combine these {selectedJobs.length} trips?
                            </Text>
                            {status === 'success' && !dryRun ? (
                                <Text style={tailwind('text-black font-bold text-xl')}>
                                    Success!
                                </Text>
                            ) : null}
                            {status === 'loading' && !dryRun ? (
                                <Text style={tailwind('text-black font-bold')}>Loading...</Text>
                            ) : (
                                <CombinedTripPreview />
                            )}
                            <View style={tailwind('flex-row items-center')}>
                                <Pressable
                                    onPress={() => {
                                        cancelCombine();
                                    }}
                                    style={tailwind('border rounded-lg p-1 pl-2 pr-2 m-2 ')}
                                >
                                    <Text style={tailwind('text-black text-lg font-bold')}>
                                        Cancel
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={confirmCombine}
                                    style={tailwind('bg-black rounded-lg p-1 pl-2 pr-2 m-2 ')}
                                >
                                    <Text style={tailwind('text-white text-lg font-bold')}>
                                        Combine
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <Text style={tailwind('font-bold text-lg')}>Select trips to combine.</Text>
                    )}
                </View>
            ) : null}
        </View>
    );
};

export const JobsList = ({ inputFilters }: { inputFilters?: JobFilter }) => {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedJobs, setSelectedJobs] = useState<String[]>([]);
    const [filter, setFilter] = useState<JobFilter>(inputFilters ? inputFilters : defaultJobFilter);
    const [isCombining, setIsCombining] = useState<boolean>(false);
    // True if user is in the process of combining jobs
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState<boolean>(false);

    const deleteJobs = (jobIds: String[]) => {
        return Promise.all(
            jobIds.map(async (jobId) => {
                return deleteJob({ jobId });
            })
        );
    };

    const removeJob = useMutation(deleteJobs, {
        onSuccess: async (data, v, c) => {
            log.info('Successfully deleted jobs...');
            setConfirmDeleteModalVisible(false);
            onRefresh();
            setSelectedJobs([]);
            Toast.show('Jobs successfully deleted.');
        },
        onError: (err, v) => {
            log.error("Couldn't delete jobs...");
            Toast.show('Had trouble deleting those job(s). Try again?');
        },
    });

    const onRefresh = () => {
        setRefreshing(true);
        queryClient.invalidateQueries(['filteredJobs', filter]);
    };

    const { status, data, error, fetchNextPage, hasNextPage } = useInfiniteQuery(
        ['filteredJobs', filter],
        getPaginatedUncategorizedJobs,
        {
            staleTime: 60,
            notifyOnChangeProps: ['data'],
            // keepPreviousData: true,
            enabled: true,
            getNextPageParam: (lastPage, pages) => {
                console.log('last page:', lastPage);
                console.log(lastPage);
                return lastPage.allJobs.pageInfo.endCursor;
            },
            select: (d) => {
                return d?.pages.map((a) => a.allJobs.edges).flat();
            },
            onSettled: () => setRefreshing(false),
        }
    );

    useEffect(() => {
        log.info('invalidating filtered jobs query...');
        queryClient.invalidateQueries('filteredJobs');
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        log.info('new filter:', filter);
    }, [filter]);

    useEffect(() => {
        if (inputFilters) {
            setFilter({ ...inputFilters });
        }
    }, [inputFilters]);

    // called after user combines jobs
    const onConfirmCombine = () => {
        setSelectedJobs([]);
        setIsCombining(false);
        onRefresh();
    };

    const toggleEditing = () => {
        LayoutAnimation.configureNext(LayoutAnimation.create(100, 'linear', 'opacity'));
        setIsEditing(!isEditing);
        if (!isEditing) {
            setSelectedJobs([]);
            setIsCombining(false);
        }
    };

    const selectOrUnselectJob = (jobId: String) => {
        const jobIsSelected = selectedJobs.indexOf(jobId) !== -1;
        if (jobIsSelected) {
            setSelectedJobs(selectedJobs.filter((id) => id != jobId));
        } else {
            setSelectedJobs(selectedJobs.concat(jobId));
        }
    };

    const confirmDeleteSelectedJobs = () => {
        // Calls the 'deleteJob' hook with selectedJobs as an argument
        console.log('Deleting Jobs:', selectedJobs);
        removeJob.mutate(selectedJobs);
    };

    const previewCombinedJobs = () => {
        setIsCombining(true);
    };

    const ConfirmDeleteModal = () => (
        <Modal
            style={tailwind('flex-col justify-end items-center')}
            isVisible={confirmDeleteModalVisible}
            onBackButtonPress={() => setConfirmDeleteModalVisible(false)}
            onBackdropPress={() => setConfirmDeleteModalVisible(false)}
        >
            <View style={tailwind('bg-white rounded-lg p-5 m-2')}>
                {selectedJobs.length > 1 ? (
                    <Text style={tailwind('text-2xl font-bold text-black')}>
                        Are you sure you want to delete these {selectedJobs.length} Jobs?{' '}
                    </Text>
                ) : (
                    <Text style={tailwind('text-xl font-bold text-black')}>
                        Are you sure you want to delete this Job?
                    </Text>
                )}

                <Text style={tailwind('text-base text-black')}>
                    Non-work trips we accidentally track as Jobs should be deleted, but be careful!
                    This can't be undone.
                </Text>

                {removeJob.isLoading ? (
                    <View style={tailwind('flex-row w-full m-2 content-center items-center')}>
                        <AnimatedEllipsis></AnimatedEllipsis>
                    </View>
                ) : (
                    <View style={tailwind('flex-row w-full m-2 content-around')}>
                        <Pressable
                            onPress={confirmDeleteSelectedJobs}
                            style={tailwind('p-2 m-2 bg-red-400 rounded-lg flex-grow items-center')}
                        >
                            <Text style={tailwind('font-bold text-white text-lg')}>Delete</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setConfirmDeleteModalVisible(false)}
                            style={tailwind('p-2 m-2 bg-black rounded-lg flex-grow items-center')}
                        >
                            <Text style={tailwind('font-bold text-white text-lg')}>Cancel</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );

    const EditingRadioButton = ({
        jobId,
        style,
        onPress,
    }: {
        jobId: String;
        style: StyleProp<ViewStyle>;
        onPress: () => void;
    }) => {
        const jobIsSelected = selectedJobs.indexOf(jobId) !== -1;

        const Icon = () => {
            if (jobIsSelected) {
                return <Ionicons name="radio-button-on" size={36} />;
            } else {
                return <Ionicons name="radio-button-off" size={36} />;
            }
        };

        return (
            <Pressable style={style} onPress={onPress}>
                <Icon />
            </Pressable>
        );
    };

    const FlatListJobItem = (props: { item: { node: Job } }) => {
        // Renders a Job Item with details, plus a radio button to its left if
        // the state variable 'isEditing' is true. Calls `selectOrUnselectJob` on radio button
        // press with the job's ID as input if selected.
        return props.item.node == null ? null : (
            <View key={props.item.node.id} style={tailwind('flex-row w-full m-0 p-0 items-center')}>
                {isEditing ? (
                    <EditingRadioButton
                        onPress={() => selectOrUnselectJob(props.item.node.id)}
                        style={tailwind('p-2')}
                        jobId={props.item.node.id}
                    />
                ) : null}
                <JobItem job={props.item.node} displayDetails={true} />
            </View>
        );
    };

    const JobFilters = () => {
        return (
            <KeyboardAwareScrollView
                horizontal={true}
                style={tailwind('content-around flex-row flex-none border-b border-gray-200')}
            >
                <Text style={tailwind('font-bold text-lg text-center self-center')}>Filters:</Text>
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
                        filter.startDate?.isSame(moment().subtract(1, 'month').startOf('day')) &&
                        filter.endDate?.isSame(moment().startOf('day'))
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
            </KeyboardAwareScrollView>
        );
    };

    const ListEmpty = () => {
        return (
            <View style={tailwind('h-full w-full p-1 items-center')}>
                <Text style={tailwind('text-lg font-bold text-black p-2')}>
                    All done! You don't have any trips!
                </Text>
                <Image
                    style={tailwind('w-3/4 h-64 mt-10 mb-10 self-center')}
                    resizeMode={'contain'}
                    source={require('./loc-img.png')}
                />
                <Text style={tailwind('text-lg font-bold text-black p-2')}>
                    Clock in and drive to automatically track your trips, and then return here to
                    save your pay.
                </Text>
            </View>
        );
    };
    const ListEmptyComponent = () => {
        if (filter.needsEntry) {
            return (
                <View style={tailwind('h-full w-full p-1 items-center')}>
                    <Text style={tailwind('text-lg font-bold text-black p-2')}>
                        All done! You don't have any trips!
                    </Text>
                    <Image
                        style={tailwind('w-3/4 h-64 mt-10 mb-10 self-center')}
                        resizeMode={'contain'}
                        source={require('./loc-img.png')}
                    />
                    <Text style={tailwind('text-lg font-bold text-black p-2')}>
                        Clock in and drive to automatically track your trips, and then return here
                        to save your pay.
                    </Text>
                </View>
            );
        }
        if (status == 'loading') {
            return <AnimatedEllipsis style={{ color: '#1c1c1c', fontSize: 100 }} />;
        } else {
            return (
                <View style={tailwind('h-full w-full p-1 items-center justify-center')}>
                    <Text style={tailwind('text-lg font-bold text-black p-2')}>No Jobs found!</Text>
                    <Image
                        style={tailwind('w-3/4 h-64 mt-10 mb-10 self-center')}
                        resizeMode={'contain'}
                        source={require('./loc-img.png')}
                    />
                </View>
            );
        }
    };

    return (
        <View style={tailwind('pt-10 flex-col h-full bg-gray-100')}>
            <StatusBar style="dark" />
            <ConfirmDeleteModal />
            <FlatList
                ListEmptyComponent={ListEmptyComponent}
                ListFooterComponent={() => {
                    return (
                        <View style={tailwind('flex-row p-2 items-center justify-center')}>
                            <Text style={tailwind('text-black font-bold text-lg')}>
                                {data?.length} Jobs
                            </Text>
                        </View>
                    );
                }}
                ListHeaderComponent={
                    <>
                        <JobsScreenHeader
                            isEditing={isEditing}
                            onPress={toggleEditing}
                            onPressDelete={() => setConfirmDeleteModalVisible(true)}
                            onPressCombine={previewCombinedJobs}
                            deleteEnabled={selectedJobs.length > 0}
                            combineEnabled={selectedJobs.length > 1}
                        />
                        <JobsListHeader
                            cancelCombine={() => {
                                LayoutAnimation.configureNext(
                                    LayoutAnimation.create(100, 'linear', 'opacity')
                                );
                                setIsCombining(false);
                                setSelectedJobs([]);
                                setIsEditing(false);
                            }}
                            onConfirmCombine={onConfirmCombine}
                            isCombining={isCombining}
                            selectedJobs={selectedJobs}
                            isVisible={selectedJobs.length > 0}
                        />
                        <View style={tailwind('w-full border-t border-b border-gray-200')}>
                            <JobFilters />
                        </View>
                    </>
                }
                style={[tailwind('w-full flex-auto flex-col flex-grow pl-1 pr-1')]}
                data={data}
                renderItem={FlatListJobItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing || status === 'loading'}
                        onRefresh={onRefresh}
                    />
                }
                refreshing={status === 'loading'}
                onEndReached={() => {
                    console.log('reached end');
                    if (hasNextPage) {
                        console.log('fetching next page');
                        fetchNextPage();
                    }
                }}
                keyExtractor={(job) => job.node.id}
            ></FlatList>
        </View>
    );
};
