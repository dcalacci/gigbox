import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { tailwind } from 'tailwind';
import { useToast } from 'react-native-fast-toast';

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
import { log } from '../../utils';

export default function TrackingBar() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const shiftStatus = useQuery('activeShift', fetchActiveShift, {
        /* placeholderData: { getActiveShift: { active: false } }, */
    });
    const endActiveShift = useMutation(endShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            queryClient.invalidateQueries('shifts');
            stopGettingBackgroundLocation();
        },

        onMutate: async (data) => {
            await queryClient.cancelQueries('activeShift');
            const previousShift = queryClient.getQueryData('activeShift');
            log.info('Providing mutate with optimistic data...');
            queryClient.setQueryData('activeShift', () => ({
                getActiveShift: { active: false, startTime: new Date() },
            }));
            return { previousShift };
        },
        onError: (err, newShift, context) => {
            log.error(`Problem ending shift: ${err}`)
            queryClient.setQueryData('activeShift', context.previousShift);
            toast?.show("Encountered a problem ending your shift... Try again?");
        }
    });

    const createActiveShift = useMutation(createShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            queryClient.invalidateQueries('shifts');
            startGettingBackgroundLocation();
        },

        onMutate: async (data) => {
            await queryClient.cancelQueries('activeShift');
            const previousShift = queryClient.getQueryData('activeShift');
            log.info('Providing mutate with optimistic data...');
            queryClient.setQueryData('activeShift', () => ({
                getActiveShift: { active: true, startTime: new Date() },
            }));
            return { previousShift };
        },
        onError: (err, newShift, context) => {
            log.error(`Problem starting shift: ${err}, ${context}`)
            queryClient.setQueryData('activeShift', context.previousShift);
            toast?.show("Couldn't start a shift. Try again?");
        },
        onSettled: () => {
            queryClient.invalidateQueries('activeShift');
        },
    });

    const dispatch = useDispatch();

    if (shiftStatus.isLoading) log.info('Tracking bar loading...');
    if (shiftStatus.isError) {
        log.error(`tracking bar Error! ${shiftStatus.error}`);
        toast?.show(`Problem loading shifts: ${shiftStatus.error}`);
    }

    const activeShift = shiftStatus.data?.getActiveShift
        ? shiftStatus.data.getActiveShift.active
        : false;

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
            log.info('Ending shift ', shiftStatus.data.getActiveShift.id);
            endActiveShift.mutate(shiftStatus.data.getActiveShift.id);
        }
    };

    const textStyle = [tailwind('text-lg'), activeShift ? tailwind('font-semibold') : null];

    if (!shiftStatus.isLoading && !shiftStatus.isError) {
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
    } else {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        );
    }
}
