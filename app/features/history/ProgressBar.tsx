import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { tailwind } from 'tailwind';

const ProgressBar = (props) => {
    const { bgcolor, completed, barCaption, total, caption } = props;

    const containerStyles = {
        height: 20,
        width: '100%',
        backgroundColor: '#e0e0de',
        borderRadius: 50,
        margin: 50,
    };

    const fillerStyles = {
        height: '100%',
        width: `${completed * 100}%`,
        textAlign: 'right',
    };

    const labelStyles = {
        padding: 5,
        color: 'white',
        fontWeight: 'bold',
    };

    return (
        <View style={tailwind('flex-col w-full')}>
            <Text style={tailwind('text-base p-1')}>{caption}</Text>
            <View style={tailwind('w-full flex-row items-center')}>
                <View style={tailwind('h-2 w-5/6 bg-gray-200 rounded-xl mt-1 mb-1')}>
                    <View style={[fillerStyles, tailwind('rounded-2xl bg-black')]}></View>
                </View>

                <Text style={tailwind('text-base pl-2')}>{total}</Text>
            </View>
            <View style={tailwind('flex-row w-5/6 justify-between')}>
                <View style={[fillerStyles, tailwind('justify-center flex-row')]}>
                    <View style={tailwind('flex-col items-center')}>
                        <View style={tailwind('border-l border-black h-2')}></View>
                        <Text style={tailwind('text-base text-center')}>{barCaption}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ProgressBar;
