import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../store/index';
import { Shift } from '../clock/clockSlice';
import { getShiftList } from './shiftListSlice';
import { FlatList } from 'react-native-gesture-handler';

const ShiftCard = (props: any) => {
    console.log('shift: ', props.item);
    return (
        <View key={props.item.id}>
            <Text>
                Start time: {props.item.startTime}
                End Time: {props.item.endTime}
            </Text>
        </View>
    );
};

export default function ShiftList() {
    const shifts = useSelector((state: RootState): Shift[] => state.shiftList.shifts);
    const dispatch = useDispatch();

    useEffect(() => {
        console.log('GETTING SHIFT LIST');
        dispatch(getShiftList({ limit: 10, last: null }));
        //TODO GetShiftsFromServer
    }, []);

    return (
        <SafeAreaView>
            <FlatList
                data={shifts}
                renderItem={ShiftCard}
                keyExtractor={(shift) => shift.id}
            ></FlatList>
        </SafeAreaView>
    );
}

