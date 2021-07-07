import React from 'react';
import { Pressable, Text } from 'react-native';
import { tailwind } from 'tailwind';
import * as Haptics from 'expo-haptics';

export default ({
    displayText,
    onPress,
    value,
}: {
    displayText: string;
    onPress: () => void;
    value: boolean;
}) => (
    <Pressable
        style={[
            tailwind('rounded-2xl m-2 p-1 pl-2 pr-2 bg-gray-200'),
            value ? tailwind('bg-black') : null,
        ]}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
    >
        <Text
            style={[
                tailwind(' text-base font-bold'),
                value ? tailwind('text-white') : tailwind('text-black'),
            ]}
        >
            {displayText}
        </Text>
    </Pressable>
);
