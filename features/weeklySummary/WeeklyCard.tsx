import React, { FunctionComponent, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { fetchWeeklySummary } from './api';
import { log } from '../../utils';

type WeeklyCardProps = {};

const WeeklyCard: FunctionComponent<WeeklyCardProps> = ({}) => {
    const weeklySummary = useQuery('weeklySummary', fetchWeeklySummary);
    if (weeklySummary.isError) log.error(weeklySummary)
    if (weeklySummary.isLoading || weeklySummary.isError) {
        return (
            <View style={tailwind('flex-1 w-11/12')}>
                <Text>Loading...</Text>
            </View>
        );
    } else {
        log.info('summary:', weeklySummary);

        const summary = weeklySummary.data.getWeeklySummary;
        return (
            <View style={[tailwind('flex-1 m-2 p-5 h-48 rounded-xl bg-white')]}>
                <Text style={tailwind('text-green-500 text-3xl font-bold underline')}>
                    This week
                </Text>
                <Text style={tailwind('text-black')}> Traveled {summary.miles.toFixed(1)} miles.</Text>
                <Text> Tracked {summary.numShifts} shifts.</Text>
            </View>
        );
    }
};

export default WeeklyCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 5,
    },
});
