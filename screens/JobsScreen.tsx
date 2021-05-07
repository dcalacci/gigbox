import * as React from 'react';
import { StyleSheet, View, Text} from 'react-native';

import JobsList from '../components/JobsList'

import {JobFilterList} from '../features/job/JobList'


export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jobs</Text>
          <JobFilterList/>
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
