import * as React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

import moment from 'moment';

import { StatusBar } from 'expo-status-bar';
import { JobFilterList } from '../features/history/JobList';
import NetPayCard from '../features/history/NetPayCard';
import tailwind from 'tailwind-rn';

export default function HistoryScreen({ route }) {
    /* let filter: JobFilter | undefined; */
    const filter = route.params?.filters
        ? {
              ...route.params.filters,
              startDate: route.params.filters?.startDate
                  ? moment(route.params.filters?.startDate)
                  : null,
              endDate: route.params.filters?.endDate ? moment(route.params.filters?.endDate) : null,
          }
        : undefined;
    return (
        <View style={tailwind('bg-gray-100 items-center justify-start flex-col h-full p-2')}>
            <StatusBar style="dark" />
            {/* <Text style={styles.title}>Jobs</Text> */}
            <JobFilterList inputFilters={filter} />
            <ScrollView style={tailwind('p-2 m-0 flex-col flex w-full')}>
                <NetPayCard />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
