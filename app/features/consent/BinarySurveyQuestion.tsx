import { tailwind } from 'tailwind';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const BinarySurveyQuestion = ({
    yesButtonTestID,
    noButtonTestID,
    onPress,
    declineText,
    questionText,
    value,
    yesButtonText='Yes',
    noButtonText='No'
}: {

    yesButtonTestID: string;
    noButtonTestID: string;
    onPress: (yes: boolean) => void;
    declineText?: string;
    questionText?: string;
    value: boolean | undefined
    yesButtonText?: string
    noButtonText?: string
}) => {
    const onPressButton = (yes: boolean) => {
        onPress(yes);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };
    console.log("button value in button:", value)
    return (
        <View style={tailwind('rounded-lg bg-white p-2 m-2')}>
            <Text style={tailwind('text-lg pt-2 pb-2 underline text-center')}>{questionText}</Text>

            <View style={tailwind('flex-row flex-grow content-around p-2 w-full')}>
                <Pressable
                    testID={noButtonTestID}
                    onPress={() => onPressButton(false)}
                    style={[
                        tailwind('rounded-lg flex-grow m-2 p-2 '),
                        value === false
                            ? tailwind('bg-gray-800')
                            : tailwind('border-2 border-gray-800'),
                    ]}
                >
                    <Text
                        style={[
                            tailwind('text-lg text-white font-bold text-center'),
                            value === false ? tailwind('text-white') : tailwind('text-gray-500'),
                        ]}
                    >
                        <Ionicons
                            size={24}
                            name={'close-circle-outline'}
                            color={value === false ? 'white' : 'gray'}
                        />
                        {noButtonText}
                    </Text>
                </Pressable>
                <Pressable
                    testID={yesButtonTestID}
                    onPress={() => onPressButton(true)}
                    style={[
                        tailwind('rounded-lg flex-grow m-2 p-2'),
                        value ? tailwind('bg-green-500') : tailwind('border-2 border-green-500'),
                    ]}
                >
                    <Text
                        style={[
                            tailwind('text-lg text-white font-bold text-center'),
                            value ? tailwind('text-white') : tailwind('text-green-500'),
                        ]}
                    >
                        <Ionicons
                            size={24}
                            name={'checkmark-circle-outline'}
                            color={value ? 'white' : 'green'}
                        />
                        {yesButtonText}
                    </Text>
                </Pressable>
            </View>
            {value === false ? (
                <View style={tailwind('p-2 ')}>
                    <Text style={tailwind('text-red-500 font-bold text-center')}>
                        {declineText}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
export default BinarySurveyQuestion;
