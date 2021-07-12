import React, { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import Modal from 'react-native-modal';
import tailwind from 'tailwind-rn';
import { Picker } from '@react-native-picker/picker';

export default ({
    isOpen,
    onClose,
    options,
    onSelectOption,
    defaultText,
    promptText,
}: {
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    onSelectOption: (option: String) => void;
    defaultText: String;
    promptText: String;
}) => {
    const [selectedOption, setSelectedOption] = useState<String>(defaultText);
    console.log('selected option:', selectedOption);
    console.log('displaying options:', options);
    return (
        <Modal
            style={tailwind('flex-col justify-end')}
            isVisible={isOpen}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
        >
            <View style={tailwind('flex bg-white justify-center rounded-lg')}>
                <Text style={tailwind('text-xl p-5')}>{promptText}</Text>
                <Picker
                    style={tailwind('justify-center h-32')}
                    selectedValue={selectedOption}
                    onValueChange={(itemValue, itemIndex) => setSelectedOption(itemValue)}
                >
                    {options.map((e, i) => (
                        <Picker.Item label={e} value={e} key={e} />
                    ))}
                </Picker>
            </View>
            <Pressable
                onPress={() => onSelectOption(selectedOption)}
                style={tailwind('bg-black p-5 rounded-lg items-center mt-5 mb-5')}
            >
                <Text style={tailwind('text-white font-bold')}>Done</Text>
            </Pressable>
        </Modal>
    );
};
