import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { tailwind } from 'tailwind';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ShiftList from '../features/shiftList/Shift';
import ShiftDetails from '../features/shiftDetails/ShiftDetails';

const ShiftStack = createStackNavigator();

export default function ShiftsScreen({ navigation }) {
    return (
        <ShiftStack.Navigator screenOptions={{
            headerTransparent: true
        }}>
            <ShiftStack.Screen
                name="Home"
                component={ShiftList}
                options={{
                    headerShown: false,
                }}
            />
            <ShiftStack.Screen name="Shift Details" 
            component={ShiftDetails} 
            options={{
                headerStyle: {
                  backgroundColor: 'white',
                },
                headerTransparent: false,
                headerBackTitle: "All Shifts",
                headerTintColor: '#000',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}/>
        </ShiftStack.Navigator>
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
