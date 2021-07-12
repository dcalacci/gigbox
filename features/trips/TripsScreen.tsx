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
import { useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs, filter, mergeJobs } from './hooks';
import { Employers, Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripDetailScreen } from './TripDetailScreen';
import { TripItem } from './TripItem';
import { StyleProp } from 'react-native';
import { useEffect } from 'react';
import moment from 'moment';
import AnimatedEllipsis from '../../components/Ellipsis';
import { StatusBar } from 'expo-status-bar';
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

const TripScreenHeader = ({
    canCombine,
    isCombining,
    onPress,
}: {
    canCombine: boolean;
    isCombining: boolean;
    onPress: () => void;
}) => {
    const CombineButton = () =>
        isCombining ? (
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
                <Text style={tailwind('text-white font-bold')}>Combine</Text>
                <Ionicons name="git-merge" color="white" size={16} />
            </Pressable>
        );
    return (
        <View style={tailwind('flex-col w-full bg-gray-100')}>
            <View style={tailwind('flex-row p-2 mt-5 justify-between')}>
                <Text style={[tailwind('text-4xl font-bold')]}>Jobs</Text>
                {canCombine ? <CombineButton /> : null}
            </View>
        </View>
    );
};

const TripListHeader = ({
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

export const TripList = () => {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedJobs, setSelectedJobs] = useState<String[]>([]);
    const [isCombining, setIsMerging] = useState<boolean>(false);

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

    const onConfirmCombine = () => {
        setSelectedJobs([]);
        setIsMerging(false);
        onRefresh();
    };

    const toggleMerging = () => {
        LayoutAnimation.configureNext(LayoutAnimation.create(100, 'linear', 'opacity'));
        setIsMerging(!isCombining);
        if (!isCombining) {
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

    if (status == 'loading' || data === undefined) {
        return (
            <View style={tailwind('pt-10 flex-col w-full h-full items-center justify-center')}>
                <AnimatedEllipsis
                    numberOfDots={3}
                    style={{
                        minHeight: 50,
                        color: '#1C1C1C',
                        fontSize: 100,
                    }}
                />
            </View>
        );
    } else {
        return (
            <View style={tailwind('pt-10 flex-col h-full bg-gray-100')}>
                <StatusBar style="dark" />
                <FlatList
                    ListEmptyComponent={ListEmpty}
                    ListHeaderComponent={
                        <>
                            <TripScreenHeader
                                canCombine={data.length > 0}
                                isCombining={isCombining}
                                onPress={toggleMerging}
                            />
                            <TripListHeader
                                cancelCombine={() => {
                                    LayoutAnimation.configureNext(
                                        LayoutAnimation.create(100, 'linear', 'opacity')
                                    );
                                    setIsMerging(false);
                                    setSelectedJobs([]);
                                }}
                                onConfirmCombine={onConfirmCombine}
                                isCombining={isCombining}
                                selectedJobs={selectedJobs}
                                isVisible={selectedJobs.length > 0}
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
                                {isCombining ? (
                                    <MergingRadioButton
                                        onPress={() => onPressTripSelector(props.item.node.id)}
                                        style={tailwind('p-2')}
                                        jobId={props.item.node.id}
                                    />
                                ) : null}
                                <TripItem job={props.item.node} displayDetails={true} />
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
