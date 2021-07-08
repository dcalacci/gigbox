import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import tailwind from 'tailwind-rn';
import { Picker } from '@react-native-picker/picker';

import BinaryFilterPill from './BinaryFilterPill';
import { useEffect } from 'react';

export default ({
    isOpen,
    onClose,
    promptText,
    options,
    selected,
    onSelectOptions,
    buttonText,
}: {
    isOpen: boolean;
    onClose: () => void;
    promptText: string;
    options: string[];
    selected: string[];
    onSelectOptions: (o: string[]) => void;
    buttonText: string;
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(selected);
    const toggleSelect = (s: string): void => {
        if (!selectedOptions.includes(s)) {
            console.log('Adding', s);
            setSelectedOptions([...selectedOptions, s]);
        } else {
            console.log('removing', s);
            setSelectedOptions(selectedOptions.filter((str) => str !== s));
        }
    };
    return (
        <Modal
            style={tailwind('flex-col justify-end items-center')}
            isVisible={isOpen}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
        >
            <View style={tailwind('rounded-lg bg-white p-2 m-2')}>
                <View style={tailwind('flex-row flex-wrap p-2')}>
                    {options.map((o) => {
                        return (
                            <BinaryFilterPill
                                displayText={o}
                                onPress={() => toggleSelect(o)}
                                key={o}
                                value={selectedOptions.includes(o)}
                            />
                        );
                    })}
                </View>
                <View style={tailwind('m-2 w-full border-t p-5')}>
                    <Text style={tailwind('text-xl text-center')}>{promptText}</Text>
                </View>
            </View>
            <Pressable
                onPress={() => {
                    onSelectOptions(selectedOptions);
                }}
                style={tailwind('bg-black p-5 rounded-lg items-center mt-5 mb-5 w-full')}
            >
                <Text style={tailwind('text-white font-bold text-lg')}>{buttonText}</Text>
            </Pressable>
        </Modal>
    );
};
