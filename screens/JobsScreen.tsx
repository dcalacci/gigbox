import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import moment from 'moment';
import JobsList from '../components/JobsList';

import { JobFilterList, JobFilter } from '../features/job/JobList';
import tailwind from 'tailwind-rn';

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
        <View style={tailwind('bg-gray-100 items-center justify-start flex-col')}>
            {/* <Text style={styles.title}>Jobs</Text> */}
            <JobFilterList inputFilters={filter} />
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
