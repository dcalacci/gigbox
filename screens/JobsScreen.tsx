import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import moment from 'moment';
import JobsList from '../components/JobsList';

import { JobFilterList, JobFilter } from '../features/job/JobList';

export default function JobsScreen({ route }) {
    const sentFilters = route.params.filters;
    const filter: JobFilter = {
        ...route.params.filters,
        startDate: sentFilters?.startDate ? moment(sentFilters?.startDate) : null,
        endDate: sentFilters?.endDate ? moment(sentFilters?.endDate) : null,
    };
    console.log('Sending filters:', filter);
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
