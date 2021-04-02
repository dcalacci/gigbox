import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { tailwind } from 'tailwind';

import { RootState } from '../../store/index';
import Toggle from '../../components/Toggle';

import { AuthState } from '../auth/authSlice';
import { formatElapsedTime } from '../../utils';
import {
    startGettingBackgroundLocation,
    stopGettingBackgroundLocation,
    registerMileageTask,
} from '../../tasks';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchActiveShift, endShift, createShift } from './api';

import EmployerBoxes from '../../components/EmployerBox';

export default function TrackingBar() {
    const queryClient = useQueryClient();
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const shiftStatus = useQuery('activeShift', fetchActiveShift, {
        placeholderData: { getActiveShift: {active: false}}
    });
    const endActiveShift = useMutation(endShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            stopGettingBackgroundLocation();
        },
    });

    const createActiveShift = useMutation(createShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            startGettingBackgroundLocation();
        },
    });

    const dispatch = useDispatch();

    if (shiftStatus.isLoading) console.log('Tracking bar loading...');
    if (shiftStatus.isError) console.log(`tracking bar Error! ${shiftStatus.error}`);
    console.log('Shiftstatus:', shiftStatus);

    const activeShift = shiftStatus.data?.getActiveShift ? shiftStatus.data.getActiveShift.active : false

    const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(null));

    // updates the tracking bar time logger every second. Uses useEffect
    // so our setInterval resets on cue.
    useEffect(() => {
        if (activeShift) {
            let interval = setInterval(() => {
                const clockTime = new Date(shiftStatus.data.getActiveShift.startTime).getTime();
                const startTimestamp = activeShift ? clockTime : null;
                setElapsedTime(formatElapsedTime(startTimestamp));
            }, 1000);
            return () => clearInterval(interval);
        }
        registerMileageTask();
    });

    const onTogglePress = () => {
        if (!activeShift) {
            createActiveShift.mutate();
        } else {
            console.log('Ending shift ', shiftStatus.data.getActiveShift.id);
            endActiveShift.mutate(shiftStatus.data.getActiveShift.id);
        }
    };

    const textStyle = [tailwind('text-lg'), activeShift ? tailwind('font-semibold') : null];

    return (
        <View style={[tailwind(''), activeShift ? tailwind('bg-green-500') : null]}>
            <View
                style={[
                    tailwind(
                        'flex-shrink flex-row justify-around items-center border-b-4 p-3 border-green-600 h-16 bg-white'
                    ),
                    activeShift ? tailwind('bg-green-500') : null,
                ]}
            >
                <Toggle
                    title={activeShift ? 'Tracking Shift' : 'Clock In'}
                    activeText="On"
                    inactiveText="Off"
                    value={activeShift}
                    onToggle={onTogglePress}
                />
                <View style={tailwind('flex-grow-0')}>
                    <Text style={textStyle}>0.0mi</Text>
                    <Text style={textStyle}>{elapsedTime}</Text>
                </View>
            </View>
        </View>
    );
}
