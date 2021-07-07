import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import tailwind from 'tailwind-rn';
import { Picker } from '@react-native-picker/picker';

export default ({
    isOpen,
    onClose,
    options,
    onSelectOption,
    defaultText,
}: {
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    onSelectOption: (option: String) => void;
    defaultText: String;
}) => {
    const [selectedOption, setSelectedOption] = useState<String>(defaultText);
    console.log("selected option:", selectedOption)
    return (
        <Modal
            style={tailwind('flex-col justify-end')}
            isVisible={isOpen}
            onBackButtonPress={onClose}
            onBackdropPress={onClose}
        >
            <Picker
                style={tailwind('bg-white justify-center rounded-lg')}
                selectedValue={selectedOption}
                onValueChange={(itemValue, itemIndex) => setSelectedOption(itemValue)}
            >
                {options.map((e, i) => (
                    <Picker.Item label={e} value={e} key={e}/>
                ))}
            </Picker>
            <Pressable
                onPress={() => onSelectOption(selectedOption)}
                style={tailwind('bg-black p-5 rounded-lg items-center mt-5 mb-5')}
            >
                <Text style={tailwind('text-white font-bold')}>Done</Text>
            </Pressable>
        </Modal>
    );
};
