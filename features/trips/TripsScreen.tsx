import React, { useState, FunctionComponent } from 'react';
import {
    Text,
    View,
    SafeAreaView,
    StyleSheet,
    RefreshControl,
    Pressable,
    ViewStyle,
} from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { JobItem } from '../job/Job';
import { Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripItem } from './TripItem';
import { StyleProp } from 'react-native';

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

const TripGroups = ({ jobs }: { jobs: Job[] | undefined }) => {
    if (jobs === undefined) {
        return <></>;
    }
    const diffInMinutes = (a: Date, b: Date) => {
        let difference = new Date(a).getTime() - new Date(b).getTime();
        let resultInMinutes = Math.round(difference / 60000);
        return resultInMinutes;
    };

    // sort jobs by start time
    let sortedJobs = jobs.sort((a, b): number => {
        if (a.endTime === undefined) {
            return -1;
        } else {
            // ascending order from startTime
            const diff = diffInMinutes(b.startTime, a.startTime);
            return diff;
        }
    });

    const GroupItem = ({ group }: { group: Job[] }) => (
        <View style={tailwind('border rounded-lg m-1 pt-2 pl-1 pr-1 mb-5')}>
            <Text
                style={[
                    styles.mergeGroupTitle,
                    tailwind('bg-gray-100 text-lg pl-1 pr-1 border rounded-lg'),
                ]}
            >
                Merge
            </Text>
            <View style={tailwind('rounded-lg p-2')}>
                <Text style={tailwind('text-lg p-2')}>Are these trips part of the same job?</Text>
                <Pressable style={tailwind('rounded-lg border p-1')}>
                    <Text style={tailwind('text-lg')}>Yes, merge them</Text>
                    <Text style={tailwind('text-lg')}>Yes, merge them</Text>
                </Pressable>
            </View>
            {group.map((j) => (
                <TripItem job={j} key={j.id} />
            ))}
        </View>
    );

    const Groups = groups.map((g) => {
        return <GroupItem group={g} />;
    });

    return <>{Groups}</>;
};

const styles = StyleSheet.create({
    mergeGroupTitle: {
        position: 'absolute',
        top: -15,
        right: 50,
    },
});

const TripListHeader = ({ isMerging, onPress }: { isMerging: boolean; onPress: () => void }) => {
    return (
        <View style={tailwind('flex-row p-2 justify-between')}>
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

export function TripList() {

    const { status, data, error, isFetching } = useUncategorizedJobs();
    const [selectedJobs, setSelectedJobs] = useState<String[]>([]);
    const [isMerging, setIsMerging] = useState<boolean>(false);

    const toggleMerging = () => {
        console.log('merging?', isMerging);
        setIsMerging(!isMerging);
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
                return <Ionicons name="radio-button-on" size={24} />;
            } else {
                return <Ionicons name="radio-button-off" size={24} />;
            }
        };

        return (
            <Pressable style={style} onPress={onPress}>
                <Icon />
            </Pressable>
        );
    };

    const MemoTripItem = React.memo(TripItem)
    if (status == 'loading') {
        return (
            <View style={tailwind('pt-10 flex-col')}>
                <Text style={tailwind('text-xl font-bold')}>Loading...</Text>
            </View>
        );
    } else {
        const jobs = data?.allJobs.edges.slice(0, 5);
        return (
            <View style={tailwind('pt-10 flex-col bg-gray-100 h-full')}>
                <KeyboardAwareScrollView style={[tailwind('flex-col w-full pr-2 pl-2')]}>
                    <TripListHeader isMerging={isMerging} onPress={toggleMerging} />
                    {jobs?.map((j) => (
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
                            <MemoTripItem job={j.node} key={j.node.id} />
                        </View>
                    ))}
                </KeyboardAwareScrollView>
            </View>
        );
    }
}
