import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import moment from 'moment';
import JobsList from '../components/JobsList';

import { JobFilterList, JobFilter } from '../features/job/JobList';

export default function JobsScreen({ route }) {
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
        <View style={styles.container}>
            <Text style={styles.title}>Jobs</Text>
            <JobFilterList inputFilters={filter} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
