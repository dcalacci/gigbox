import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { tailwind } from 'tailwind';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchAvailableSurveys } from './api';
import { log } from '../../utils';
import { RootState } from '../../store/index';

const SurveyCard = ({ navigation }) => {
    const [numUnansweredSurveys, setNumUnansweredSurveys] = useState<number>(0);
    const userAge = useSelector((state: RootState): User | null => {
        return moment(state.auth.user?.dateCreated).diff(moment(), 'days');
    });
    const availableSurveys = useQuery(['surveys'], fetchAvailableSurveys, {
        select: (d) => {
            const unansweredSurveys = d.allSurveys.edges.filter(({ node }) => {
                const unansweredQs = node.questions.edges.filter(
                    ({ node }) => node.answers?.edges.length == 0
                );
                const answeredQs = node.questions.edges.filter(
                    ({ node }) => node.answers?.edges.length > 0
                );
                return unansweredQs.length > 0 && userAge >= node.daysAfterInstall;
            });
            return unansweredSurveys;
        },
        onSettled: (d) => {
            setNumUnansweredSurveys(d.length);
        },
        onError: (err) => {
            log.error('Could not retrieve available surveys:', err);
        },
    });
    // if there are no unanswered surveys, don't show anything.
    if (numUnansweredSurveys == 0) {
        return null;
    }
    if (availableSurveys.isError) log.error('survey error', availableSurveys);
    if (availableSurveys.isLoading || availableSurveys.isError) {
        return (
            <View style={tailwind('flex-1 w-11/12')}>
                <Text>Loading...</Text>
            </View>
        );
    } else {
        return (
            <View style={[tailwind('flex-1 flex-col m-2 p-2 rounded-xl bg-white flex-col')]}>
                <Pressable
                    onPress={() =>
                        navigation.navigate('Survey Form', {
                            surveys: availableSurveys.data,
                            navigation,
                        })
                    }
                    style={[
                        tailwind('flex-row items-center p-2'),
                        { justifyContent: 'space-between' },
                    ]}
                >
                    <View style={tailwind('justify-start flex-row items-center')}>
                        <View style={tailwind('rounded-full bg-red-400 p-1 m-2')}>
                            <Ionicons size={20} name="alert" />
                        </View>
                        <Text style={tailwind('text-black text-lg font-bold')}>
                            {availableSurveys.data?.length} Survey
                            {availableSurveys.data?.length > 1 || availableSurveys.data?.length == 0
                                ? 's'
                                : null}{' '}
                            to complete
                        </Text>
                    </View>

                    <Ionicons name="caret-forward-outline" size={24} color="black" />
                </Pressable>
            </View>
        );
    }
};

export default SurveyCard;

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
