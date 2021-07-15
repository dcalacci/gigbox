import React, { useEffect, useState } from 'react';
import { tailwind } from 'tailwind';
import { View, Text, TextInput } from 'react-native';

export default ({
    label,
    value,
    prefix,
    suffix,
    placeholder,
    onChangeValue,
}: {
    label: string;
    value: number | string | undefined;
    prefix: string;
    suffix: string;
    placeholder: string;
    onChangeValue: ((v: string) => void) | undefined;
}) => {
    const [displayValue, setDisplayValue] = useState<string>();
    const [isFocused, setFocused] = useState<boolean>();
    // set value from our input, and submit mutation
    useEffect(() => {
        if (value) {
            setDisplayValue(
                typeof value === 'number' ? value.toFixed(2) : parseFloat(value).toFixed(2)
            );
        }
    }, [value]);

    const setFormattedValue = (input: string) => {
        console.log('Setting formatted val:', input);
        setDisplayValue(input);
    };

    const onSubmit = () => {
        console.log('submitting?');
        if (displayValue) {
            console.log('submitting value:', displayValue);
            const val = parseFloat(displayValue).toFixed(2);
            if (onChangeValue) onChangeValue(val);
        }
    };

    return (
        <View style={[tailwind('flex flex-col m-1 pl-1 pr-1 ')]}>
            <Text style={tailwind('text-base text-black m-0 p-0')}>{label}</Text>
            <View
                style={[
                    tailwind('rounded-lg flex-row items-center bg-gray-100 pl-1 pr-1 pb-1 max-w-md'),
                    isFocused ? tailwind('border') : null,
                ]}
            >
                <Text style={[tailwind('text-lg self-center'), tailwind('text-black')]}>
                    {prefix}
                </Text>
                <TextInput
                    style={[tailwind('text-lg text-black flex-grow border-b')]}
                    key={`${value}`}
                    onChangeText={setFormattedValue}
                    maxLength={6}
                    keyboardType={'decimal-pad'}
                    onSubmitEditing={onSubmit}
                    onEndEditing={onSubmit}
                    returnKeyType={'done'}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                >
                    {displayValue}
                </TextInput>
                <Text
                    style={[
                        tailwind('flex-initial font-bold mr-4'),
                        displayValue == undefined ? tailwind('text-black') : tailwind('font-bold'),
                    ]}
                >
                    {suffix}
                </Text>
            </View>
        </View>
    );
};
