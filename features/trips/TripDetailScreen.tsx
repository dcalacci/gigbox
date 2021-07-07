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

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs, filter } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Job, TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripItem } from './TripItem';
import { StyleProp } from 'react-native';
import { useEffect } from 'react';
import { JobItem } from '../job/Job';

const TripScreenHeader = ({ isMerging, onPress }: { isMerging: boolean; onPress: () => void }) => {
    return (
        <View style={tailwind('flex-col w-full')}>
            <View style={tailwind('flex-row p-2 mt-10 justify-between')}>
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

export const TripDetailScreen = ({ route}: { route: {params: {job: Job}}}) => {
    const job = route.params.job
    return (
        <>
            <TripScreenHeader
                isMerging={false}
                onPress={() => console.log('press...')}
            ></TripScreenHeader>
            <JobItem job={job} />
        </>
    );
};
