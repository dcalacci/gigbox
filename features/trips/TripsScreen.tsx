import React, { useState, FunctionComponent } from 'react';
import { Text, View, SafeAreaView, StyleSheet, RefreshControl } from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { JobItem } from '../job/Job';
import { TripsScreenNavigationProp } from '@/types';
import { createStackNavigator } from '@react-navigation/stack';
import { TripItem } from './TripItem'

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

const TripListHeader = () => {
    // const { status, data, error } = useRefreshJobs();
    return (
        <View style={tailwind("flex-row p-2")}>
            <Text style={tailwind("text-4xl font-bold")}>Trips</Text>
        </View>
    )
}


export function TripList() {
    const { status, data, error, isFetching } = useUncategorizedJobs();

    console.log('uncategorized jobs query:', status, data, error, isFetching);

    if (status == 'loading') {
        return (
            <View style={tailwind('pt-10 flex-col')}>
                <Text style={tailwind('text-xl font-bold')}>Loading...</Text>
            </View>
        );
    } else {
        const jobs = data?.allJobs.edges;
        return (
            <View style={tailwind('pt-10 flex-col bg-gray-100 h-full')}>
                <KeyboardAwareScrollView style={[tailwind('flex-col w-full pr-2 pl-2')]}>

                <TripListHeader/>
                    {jobs?.map((j) => (
                        <TripItem job={j.node} key={j.node.id} />
                    ))}
                </KeyboardAwareScrollView>
            </View>
        );
    }
}
