import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    Pressable,
} from 'react-native';
import { tailwind } from 'tailwind';
import { useQueryClient, useMutation } from 'react-query';
import * as Haptics from 'expo-haptics';
import { submitUserEmployers } from './api';
import { Employers } from '../../types';
import BinaryFilterPill from '../../components/BinaryFilterPill';

export const EmployerSelector = ({ onSubmit }: { onSubmit: () => void }) => {
    const [selectedServices, setSelectedServices] = useState<Employers[]>([]);
    const queryClient = useQueryClient();
    const submitSurvey = useMutation(submitUserEmployers, {
        onSuccess: (data) => {
            console.log('data:', data);
            queryClient.invalidateQueries('userInfo');
            onSubmit();
        },
    });
    const toggleSelect = (e: Employers): void => {
        if (!selectedServices.includes(e)) {
            console.log('Adding', e);
            setSelectedServices([...selectedServices, e]);
        } else {
            console.log('removing', e);
            setSelectedServices(selectedServices.filter((empl) => empl !== e));
        }
    };

    return (
        <View style={tailwind('flex-col')}>
            <View style={tailwind('rounded-lg bg-white p-2 m-2')}>
                <Text style={tailwind('text-lg pt-2 pb-2 underline text-center')}>
                    What services do you work for?
                </Text>
                <View style={tailwind('flex-row flex-wrap p-2')}>
                    <BinaryFilterPill
                        displayText={'Instacart'}
                        onPress={() => toggleSelect(Employers.INSTACART)}
                        value={selectedServices.includes(Employers.INSTACART)}
                    />
                    <BinaryFilterPill
                        displayText={'Doordash'}
                        onPress={() => toggleSelect(Employers.DOORDASH)}
                        value={selectedServices.includes(Employers.DOORDASH)}
                    />
                    <BinaryFilterPill
                        displayText={'GrubHub'}
                        onPress={() => toggleSelect(Employers.GRUBHUB)}
                        value={selectedServices.includes(Employers.GRUBHUB)}
                    />
                    <BinaryFilterPill
                        displayText={'UberEats'}
                        onPress={() => toggleSelect(Employers.UBEREATS)}
                        value={selectedServices.includes(Employers.UBEREATS)}
                    />
                    <BinaryFilterPill
                        displayText={'Shipt'}
                        onPress={() => toggleSelect(Employers.SHIPT)}
                        value={selectedServices.includes(Employers.SHIPT)}
                    />
                </View>
            </View>
            <Pressable
                style={[
                    tailwind('rounded-lg p-5 m-2'),
                    selectedServices.length == 0
                        ? tailwind('bg-gray-400')
                        : tailwind('bg-green-500'),
                ]}
                disabled={selectedServices.length == 0}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    submitSurvey.mutate({ employers: selectedServices });
                    //TODO: send value to server, wait until we get a response back, and continue
                }}
            >
                <Text style={tailwind('font-bold text-white text-xl text-center')}>
                    {selectedServices.length == 0 ? `Continue` : `Continue`}
                </Text>
            </Pressable>
        </View>
    );
};

export const InitialSurvey = ({ onSurveyFinish }: { onSurveyFinish: () => void }) => {
    return (
        <ScrollView style={tailwind('bg-gray-100 ')}>
            <View style={tailwind('p-2')}>
                <Text style={[tailwind('text-3xl font-bold text-green-500')]}>
                    Let's get started
                </Text>
            </View>
            <EmployerSelector onSubmit={onSurveyFinish} />
        </ScrollView>
    );
};
