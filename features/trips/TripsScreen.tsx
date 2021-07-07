import React, { useState, FunctionComponent, useMemo } from 'react';
import {
    Text,
    View,
    SafeAreaView,
    StyleSheet,
    RefreshControl,
    Pressable,
    ViewStyle,
    LayoutAnimation,
    ScrollView,
} from 'react-native';

import Toast from 'react-native-root-toast';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs, filter, useMergedTripsPreview, mergeJobs } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Employers, Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripDetailScreen } from './TripDetailScreen';
import { TripItem } from './TripItem';
import { StyleProp } from 'react-native';
import { useEffect } from 'react';
import moment from 'moment';
import { deleteJob } from '../job/api';

const TripsStack = createStackNavigator();

export default function TripsScreen({ navigation }: { navigation: TripsScreenNavigationProp }) {
    return (
        <TripsStack.Navigator
            screenOptions={{
                headerTransparent: true,
            }}
        >
            <TripsStack.Screen
                name="Trips"
                component={TripList}
                options={{
                    headerShown: false,
                }}
            ></TripsStack.Screen>

            <TripsStack.Screen
                name="Trip Detail"
                component={TripDetailScreen}
                options={{
                    headerShown: false,
                }}
            ></TripsStack.Screen>
        </TripsStack.Navigator>
    );
}

const TripScreenHeader = ({ isMerging, onPress }: { isMerging: boolean; onPress: () => void }) => {
    return (
        <View style={tailwind('flex-col w-full bg-gray-100')}>
            <View style={tailwind('flex-row p-2 mt-5 justify-between')}>
                <Text style={[tailwind('text-4xl font-bold')]}>Trips</Text>
                {isMerging ? (
                    <Pressable
                        onPress={onPress}
                        style={[tailwind('flex-row rounded-lg p-2 border items-center')]}
                    >
                        <Text style={tailwind('text-black font-bold')}>Done</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={onPress}
                        style={[tailwind('flex-row rounded-lg p-2 bg-black items-center')]}
                    >
                        <Text style={tailwind('text-white font-bold')}>Merge</Text>
                        <Ionicons name="git-merge" color="white" size={16} />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const TripListHeader = ({
    cancelMerge,
    isMerging,
    selectedJobs,
    isVisible,
    onConfirmMerge,
}: {
    cancelMerge: () => void;
    isMerging: boolean;
    selectedJobs: String[];
    isVisible: boolean;
    onConfirmMerge: () => void;
}) => {
    const [jobPreview, setJobPreview] = useState<Job>();
    const [totalPay, setTotalPay] = useState<number>();
    const [tip, setTip] = useState<number>();
    const [employer, setEmployer] = useState<Employers>();
    const [dryRun, setDryRun] = useState<boolean>(true);
    const [successfulMerge, setSuccessfulMerge] = useState<boolean>(false);

    const { mutate, status } = useMutation(mergeJobs, {
        onSuccess: async (data, v, c) => {
            setJobPreview(data.mergeJobs.mergedJob);
            if (v.dryRun == false) {
                onConfirmMerge();
                setSuccessfulMerge(true);
                Toast.show(`Successfully merged ${selectedJobs.length} trips!`)
            }
        },
        onError: (err, v) => {
            log.error("Couldn't merge jobs...");
            if (v.dryRun == false) Toast.show('Had trouble merging those trips. Try again?');
        },
    });

    // create a dry-run preview each time our selected jobs changes
    useEffect(() => {
        if (selectedJobs.length > 1) {
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

    const MergedTripPreview = () => {
        if (jobPreview !== undefined) {
            const startTimeText = moment.utc(jobPreview.startTime).local().format('LT');
            const endTimeText = moment.utc(jobPreview.endTime).local().format('LT');
            return (
                <View style={tailwind('flex-col')}>
                    <Text style={tailwind('text-black p-1')}>
                        You'll make one {jobPreview.mileage.toFixed(2)} mi trip, from{' '}
                        {startTimeText} to {endTimeText}.
                    </Text>
                    <TripItem
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

    const confirmMerge = () => {
        console.log('merging job with values:', jobPreview);
        console.log(employer);
        console.log(totalPay);
        console.log(tip);
        console.log(selectedJobs);
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
            {isMerging ? (
                <View style={tailwind('flex-col rounded-lg bg-white m-1 p-2 items-center')}>
                    {isVisible ? (
                        <>
                            <Text style={tailwind('font-bold text-lg')}>
                                Merge these {selectedJobs.length} trips?
                            </Text>
                            {status === 'success' && !dryRun ? (
                                <Text style={tailwind('text-black font-bold text-xl')}>
                                    Success!
                                </Text>
                            ) : null}
                            {status === 'loading' && !dryRun ? (
                                <Text style={tailwind('text-black font-bold')}>Loading...</Text>
                            ) : (
                                <MergedTripPreview />
                            )}
                            <View style={tailwind('flex-row items-center')}>
                                <Pressable
                                    onPress={() => {
                                        cancelMerge();
                                    }}
                                    style={tailwind('border rounded-lg p-1 pl-2 pr-2 m-2 ')}
                                >
                                    <Text style={tailwind('text-black text-lg font-bold')}>
                                        Cancel
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={confirmMerge}
                                    style={tailwind('bg-black rounded-lg p-1 pl-2 pr-2 m-2 ')}
                                >
                                    <Text style={tailwind('text-white text-lg font-bold')}>
                                        Merge
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <Text style={tailwind('font-bold text-lg')}>Select trips to merge.</Text>
                    )}
                </View>
            ) : null}
        </View>
    );
};

export const TripList = () => {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedJobs, setSelectedJobs] = useState<String[]>([]);
    const [isMerging, setIsMerging] = useState<boolean>(false);

    const onRefresh = () => {
        setRefreshing(true);
        queryClient.invalidateQueries(['uncategorizedJobs', filter]);
    };

    // const { status, data, error, isFetching, refetch} = ,
    const { status, data, error, fetchNextPage, hasNextPage } = useUncategorizedJobs({
        onSettled: () => {
            setRefreshing(false);
        },
    });

    const onConfirmMerge = () => {
        setSelectedJobs([]);
        setIsMerging(false);
        onRefresh();
    };

    const toggleMerging = () => {
        LayoutAnimation.configureNext(LayoutAnimation.create(100, 'linear', 'opacity'));
        setIsMerging(!isMerging);
        if (!isMerging) {
            setSelectedJobs([]);
        }
    };

    const onPressTripSelector = (jobId: String) => {
        const jobIsSelected = selectedJobs.indexOf(jobId) !== -1;
        if (jobIsSelected) {
            setSelectedJobs(selectedJobs.filter((id) => id != jobId));
        } else {
            setSelectedJobs(selectedJobs.concat(jobId));
        }
    };

    const MergingRadioButton = ({
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

    if (status == 'loading' || data === undefined) {
        return (
            <View style={tailwind('pt-10 flex-col')}>
                <Text style={tailwind('text-xl font-bold')}>Loading...</Text>
            </View>
        );
    } else {
        return (
            <View style={tailwind('pt-10 flex-col h-full bg-gray-100')}>
                <FlatList
                    ListHeaderComponent={
                        <>
                            <TripScreenHeader isMerging={isMerging} onPress={toggleMerging} />
                            <TripListHeader
                                cancelMerge={() => {
                                    LayoutAnimation.configureNext(
                                        LayoutAnimation.create(100, 'linear', 'opacity')
                                    );
                                    setIsMerging(false);
                                    setSelectedJobs([]);
                                }}
                                onConfirmMerge={onConfirmMerge}
                                isMerging={isMerging}
                                selectedJobs={selectedJobs}
                                isVisible={selectedJobs.length > 1}
                            />
                        </>
                    }
                    style={[tailwind('w-full flex-auto flex-col flex-grow pl-1 pr-1')]}
                    data={data}
                    renderItem={(props) =>
                        props.item.node == null ? null : (
                            <View
                                key={props.item.node.id}
                                style={tailwind('flex-row w-full m-0 p-0 items-center')}
                            >
                                {isMerging ? (
                                    <MergingRadioButton
                                        onPress={() => onPressTripSelector(props.item.node.id)}
                                        style={tailwind('p-2')}
                                        jobId={props.item.node.id}
                                    />
                                ) : null}
                                <TripItem job={props.item.node} displayDetails={false} />
                            </View>
                        )
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
    }
};
