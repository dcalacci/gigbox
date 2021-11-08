import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { tailwind } from 'tailwind';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ShiftList from '../features/shiftList/Shifts';
import ShiftDetails from '../features/shiftList/ShiftDetails';

const JobTrackerStack = createStackNavigator();

export default function JobTrackerScreen({ navigation }) {
    return (
        <JobTrackerStack.Navigator
        >
            <JobTrackerStack.Screen
                name="Enter Jobs"
                component={JobTrackerScreen}
            />
        </JobTrackerStack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
