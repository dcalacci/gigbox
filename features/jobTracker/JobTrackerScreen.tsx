import React, { useState, FunctionComponent } from 'react';
import { Text, View, SafeAreaView, StyleSheet, RefreshControl } from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { useUncategorizedJobs } from './hooks';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { JobItem } from '../jobs/Job';

export default function JobTrackerScreen({ navigation }) {
    const { status, data, error, isFetching } = useUncategorizedJobs();

    console.log('uncategorized jobs query:', status, data, error, isFetching);

    if (status == 'loading') {
        return (
            <View style={tailwind('p-5 pt-10 flex-col')}>
                <Text style={tailwind('text-xl font-bold')}>Loading...</Text>
            </View>
        );
    } else if (status == 'success') {
        const jobs = data?.allJobs.edges;
        return (
            <View style={tailwind('p-5 pt-10 flex-col')}>
                <KeyboardAwareScrollView style={[tailwind('flex-col w-full ml-0 mr-0 pl-2 mr-2')]}>
                    {jobs?.map((j) => (
                        <JobItem job={j.node} key={j.node.id} />
                    ))}
                </KeyboardAwareScrollView>
            </View>
        );
    }
}
