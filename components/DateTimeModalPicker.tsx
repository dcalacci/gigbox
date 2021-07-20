import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { tailwind } from 'tailwind';
import moment from 'moment';

import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';

export default ({
    defaultDate = new Date(),
    onSetDate,
}: {
    defaultDate?: Date;
    onSetDate: (d: Date) => void;
}) => {
    const [date, setDate] = useState(defaultDate);
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setDate(currentDate);
        onSetDate(currentDate);
    };

    const showMode = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
        setShowModal(true);
    };

    const showTimepicker = () => {
        showMode('time');
        setShowModal(true);
    };

    return (
        <View>
            <Modal
                style={tailwind('flex-col justify-end items-center')}
                isVisible={showModal}
                onBackButtonPress={() => setShowModal(false)}
                onBackdropPress={() => setShowModal(false)}
                hasBackdrop={true}
            >
                <View style={tailwind('rounded-lg bg-white p-2 m-2 w-full h-1/2 flex-col')}>
                    {show && (
                        <DateTimePicker
                            style={tailwind('m-1 flex-grow')}
                            testID="dateTimePicker"
                            value={date}
                            mode={mode}
                            is24Hour={true}
                            display={
                                Platform.OS === 'ios'
                                    ? mode == 'date'
                                        ? 'inline'
                                        : 'spinner'
                                    : 'default'
                            }
                            onChange={onChange}
                        />
                    )}
                </View>
                <Pressable
                    onPress={() => setShowModal(false)}
                    style={tailwind('bg-black rounded-lg p-2 w-full items-center')}
                >
                    <Text style={tailwind('font-bold text-white m-1')}>Done</Text>
                </Pressable>
            </Modal>
            <View style={tailwind('flex-row w-full items-center')}>
                <Pressable
                    onPress={showDatepicker}
                    style={tailwind('p-2 m-1 bg-gray-100 rounded-lg')}
                >
                    <Text>{moment(date).format('M/D/YY')}</Text>
                </Pressable>
                <Pressable
                    onPress={showTimepicker}
                    style={tailwind('p-2 m-1 bg-gray-100 rounded-lg')}
                >
                    <Text>{moment(date).format('h:mm a')}</Text>
                </Pressable>
            </View>
        </View>
    );
};