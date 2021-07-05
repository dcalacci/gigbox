import React, { useState, FunctionComponent, useMemo } from 'react';
import {
    Text,
    View,
    SafeAreaView,
    StyleSheet,
    RefreshControl,
    Pressable,
    ViewStyle,
    LayoutAnimation
} from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripItem } from './TripItem';
import { StyleProp } from 'react-native';
import { JobFilter, SortArgs } from '../job/JobList';
import { getFilteredJobs } from '../job/api';

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
        </TripsStack.Navigator>
    );
}

const TripListHeader = ({ isMerging, onPress }: { isMerging: boolean; onPress: () => void }) => {
    return (
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
    );
};

export const TripList = () => {

    //const { status, data, error, isFetching, refetch} = useUncategorizedJobs();
    const filter: JobFilter = {
        needsEntry: true,
        saved: false,
        sort: SortArgs.START 
    }
    const { status, data, error, isFetching, refetch} = useQuery<{allJobs: { edges: {node: Job}[]}}, Error>(["uncategorizedJobs", filter], 
    getFilteredJobs,
    {
        notifyOnChangeProps: ['data'],
        staleTime: 60,
        keepPreviousData: true,
        enabled: true
    })
    const [selectedJobs, setSelectedJobs] = useState<String[]>([]);
    const [isMerging, setIsMerging] = useState<boolean>(false);

    const toggleMerging = () => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(100, 'linear', 'opacity'))
        setIsMerging(!isMerging);
    };

    const onPressTripSelector = (jobId: String) => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(100, 'linear', 'opacity'))
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
                return <Ionicons name="radio-button-on" size={30} />;
            } else {
                return <Ionicons name="radio-button-off" size={30} />;
            }
        };

        return (
            <Pressable style={style} onPress={onPress}>
                <Icon />
            </Pressable>
        );
    };

    const MemoTripItem = (props: {job: Job}) => {
        return useMemo(() => {
            console.log("job changed?")
            return (
            <TripItem job={props.job} key={props.job.id}/>
            )
        }, [props.job.id])
    }
    if (status == 'loading') {
        return (
            <View style={tailwind('pt-10 flex-col')}>
                <Text style={tailwind('text-xl font-bold')}>Loading...</Text>
            </View>
        );
    } else {
        return (
            <View style={tailwind('pt-10 flex-col bg-gray-100 h-full')}>
                <KeyboardAwareScrollView style={[tailwind('flex-col w-full pr-2 pl-2')]}>
                    <TripListHeader isMerging={isMerging} onPress={toggleMerging} />
                    {data?.allJobs.edges.map((j) => (
                        <View
                            key={j.node.id}
                            style={tailwind('flex-row w-full m-0 p-0 items-center')}
                        >
                            {isMerging ? (
                                <MergingRadioButton
                                    onPress={() => onPressTripSelector(j.node.id)}
                                    style={tailwind('pr-1')}
                                    jobId={j.node.id}
                                />
                            ) : null}
                            <TripItem job={j.node}/>
                        </View>
                    ))}
                </KeyboardAwareScrollView>
            </View>
        );
    }
}
