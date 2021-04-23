import React, { FunctionComponent } from 'react';
import { StyleSheet, Pressable, Text, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailwind } from 'tailwind';
import TrackingBar from '../features/clock/TrackingBar';
import WeeklyCard from '../features/weeklySummary/WeeklyCard';

export default function TabOneScreen() {
    return (
        <View style={tailwind('bg-gray-100 h-full')}>
            <TrackingBar />
            <ScrollView style={tailwind('bg-gray-100 h-full')}>
                <Pressable style={[tailwind('bg-white m-2 p-2 rounded-2xl flex-col')]}>
                    <View style={[tailwind('flex-row p-2'), { justifyContent: 'space-between' }]}>
                        <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                            See 2 tracked jobs
                        </Text>
                        <Ionicons name="caret-forward-outline" size={24} color="black" />
                    </View>
                    <View style={tailwind('border-b border-gray-200 ml-5 mr-5')}></View>
                </Pressable>

                <WeeklyCard />
            </ScrollView>
        </View>
    );
}

type CardProps = {
    title: string;
};

const Card: FunctionComponent<CardProps> = ({ title }) => (
    <View style={tailwind('flex-1 w-11/12')}>
        <View style={tailwind('self-start bg-transparent border w-10/12 h-36')}></View>
        <View
            style={tailwind(
                'self-start absolute bg-transparent border-2 border-green-500 h-36 w-10/12 mt-2 ml-2 p-2'
            )}
        >
            <Text style={tailwind('text-black text-3xl font-bold')}>{title}</Text>
        </View>
    </View>
);
