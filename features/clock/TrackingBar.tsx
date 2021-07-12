import React, { useEffect, useState } from 'react';
import { View, Text, LayoutAnimation } from 'react-native';
import { useSelector } from 'react-redux';
import { tailwind } from 'tailwind';

import Toast from 'react-native-root-toast';

import { useQuery, useMutation, useQueryClient } from 'react-query';

import Tooltip from 'react-native-walkthrough-tooltip';

import { RootState } from '../../store/index';
import Toggle from '../../components/Toggle';

import { AuthState } from '../auth/authSlice';
import { formatElapsedTime } from '../../utils';
import {
    isGettingBackgroundLocation,
    startGettingBackgroundLocation,
    stopGettingBackgroundLocation,
} from '../../tasks';
import { setShiftEmployers, fetchActiveShift, endShift, createShift } from './api';
import { log } from '../../utils';
import { Employers } from '../../types';
import ModalMultiSelect from '../../components/ModalMultiSelect';

export default function TrackingBar() {
    const queryClient = useQueryClient();
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const activeShift = useQuery('activeShift', fetchActiveShift, {
        refetchInterval: 1000,
        // refetchIntervalInBackground: true,
        placeholderData: {
            active: false,
            id: '',
            roadSnappedMiles: 0,
            startTime: new Date(),
            snappedGeometry: '',
            employers: [],
            jobs: [],
        },
        onError: (err) => {
            log.error('Could not fetch shift');
        },
    });
    const endActiveShift = useMutation(endShift, {
        onSuccess: async (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            // update weekly summary data
            queryClient.invalidateQueries('weeklySummary');
            // update shift list
            queryClient.invalidateQueries('shifts');
            log.info('Ended shift:', data);
            queryClient.setQueryData('activeShift', data.endShift.shift);
        },

        onMutate: async (data) => {
            /* await queryClient.cancelQueries('activeShift'); */
            const previousShift = queryClient.getQueryData('activeShift');
            log.info('ending shift optimistically...');
            queryClient.setQueryData('activeShift', () => ({
                getActiveShift: { active: false, startTime: new Date() },
            }));
            return { previousShift };
        },
        onError: (err, newShift, context) => {
            queryClient.invalidateQueries('activeShift');
            log.error(`Problem ending shift: ${err}`);
            log.error(err.message);
            // err.response.errors.map((e) => Toast.show(e.message));
        },
        onSettled: async (d, error) => {
            // if the shift is inactive, stop our location updates.
            if (d == undefined || d.endShift.shift.active == false) {
                const res = await stopGettingBackgroundLocation();
                log.info(`Stopped getting background location.`);
            }
        },
    });

    const createActiveShift = useMutation(createShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            queryClient.invalidateQueries('shifts');
            log.info('Created new shift:', data);
        },

        onMutate: async (data) => {
            await queryClient.cancelQueries('activeShift');
            const previousShift = queryClient.getQueryData('activeShift');
            log.info('Providing mutate with optimistic data...');
            queryClient.setQueryData('activeShift', () => ({
                getActiveShift: { active: true, startTime: new Date(), roadSnappedMiles: 0.0 },
            }));
            return { previousShift };
        },
        onError: (err, newShift, context) => {
            log.error(`Problem starting shift: ${err}, ${context}`);
            queryClient.setQueryData('activeShift', context.previousShift);
            Toast.show("Couldn't start a shift. Try again?");
        },
        onSettled: () => {
            queryClient.invalidateQueries('activeShift');
        },
    });

    if (activeShift.isLoading) {
        log.info('Tracking bar loading...');
    }
    if (activeShift.isError) {
        log.error(`tracking bar Error! ${activeShift.error}`);
        Toast.show(`Problem loading shifts: ${activeShift.error}`);
    }

    const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(null));

    // updates the tracking bar time logger every second. Uses useEffect
    // so our setInterval resets on cue.
    useEffect(() => {
        if (activeShift.status == 'success' && activeShift.data.active) {
            let interval = setInterval(() => {
                const clockInTime = activeShift.data.startTime;
                setElapsedTime(formatElapsedTime(clockInTime));
            }, 100);
            return () => clearInterval(interval);
        } else {
            // otherwise set it to zero
            setElapsedTime(formatElapsedTime(null));
        }
    });

    const onTogglePress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (!activeShift.data?.active) {
            createActiveShift.mutate();
            startGettingBackgroundLocation().catch((err) => {
                log.error("Couldn't start tracking location");
                log.error(err);
                Toast.show("Couldn't start tracking location, but clocking you in anyway.");
            });
        } else {
            stopGettingBackgroundLocation()
                .then(() => {
                    log.info(`Stopped getting background location.`);
                    log.info('Ending shift ', activeShift.data.id);
                    endActiveShift.mutate(activeShift.data.id);
                    Toast.show('Successfully clocked out.');
                })
                .catch((err) => {
                    log.error(`Caught an error while trying to stop background location: ${err}`);
                })
                .finally(() => {
                    // If we don't have a location task, end our shift anyway. Otherwise
                    // show user an error happened.
                    isGettingBackgroundLocation().then((isRegistered: boolean) => {
                        if (isRegistered) {
                            Toast.show(
                                "Couldn't stop getting background location. Try again soon."
                            );
                        } else {
                            endActiveShift.mutate(activeShift.data.id);
                            Toast.show('Successfully clocked out.');
                        }
                    });
                });
        }
    };

    if (activeShift.data) {
        const shift = activeShift.data;
        const textStyle = [tailwind('text-lg'), shift.active ? tailwind('font-semibold') : null];
        const nMiles = (shift && shift.roadSnappedMiles ? shift.roadSnappedMiles : 0.0).toFixed(1);

        const setEmployers = useMutation(setShiftEmployers, {
            onSuccess: (data) => {
                console.log('Successfully set employers:', data);
                queryClient.invalidateQueries('activeShift');
            },
            onError: (data) => {
                console.log('couldnt set employers...');
            },
            onMutate: async (data) => {
                console.log('optimistically updating employers for shift...', data);
                const previousShift = queryClient.getQueryData('activeShift');
                await queryClient.cancelQueries('activeShift');
                const newShift = { ...previousShift, employers: data.employers };
                queryClient.setQueryData('activeShift', newShift);
            },
        });

        const onEmployersSubmitted = (selectedEmployers: Employers[]) => {
            setEmployers.mutate({
                shiftId: shift.id,
                employers: selectedEmployers,
            });
        };

        const [toolTipVisible, setToolTipVisible] = useState<boolean>(false);

        return (
            <Tooltip
                isVisible={toolTipVisible}
                content={
                    <Text>
                        When you start a shift, clock in here. Your mileage and time will
                        automatically be tracked while you work.
                    </Text>
                }
                placement="bottom"
                onClose={() => setToolTipVisible(false)}
            >
                <View style={[tailwind('flex flex-col')]}>
                    <View
                        style={[
                            { zIndex: 100 },
                            tailwind(
                                'flex-shrink flex-row justify-around items-center p-3 border-green-600 h-16 bg-white'
                            ),
                            shift.active ? tailwind('bg-green-500') : null,
                        ]}
                    >
                        <Toggle
                            title={shift.active ? 'Clocked In' : 'Clock In'}
                            activeText="On"
                            inactiveText="Off"
                            value={shift.active}
                            onToggle={onTogglePress}
                        />
                        <View style={tailwind('flex-grow-0')}>
                            <Text style={[textStyle, { alignSelf: 'flex-end' }]}>{nMiles}mi</Text>
                            <Text style={textStyle}>{elapsedTime}</Text>
                        </View>
                    </View>

                    <ModalMultiSelect
                        isOpen={shift.active && !shift.employers}
                        onClose={() => {
                            endActiveShift.mutate(activeShift.data.id);
                            console.log('closed');
                        }}
                        promptText={
                            "Select any apps you're working for (looking for jobs on) during this shift."
                        }
                        options={auth.user?.employers}
                        selected={[]}
                        onSelectOptions={onEmployersSubmitted}
                        buttonText={'Clock In'}
                    ></ModalMultiSelect>
                </View>
            </Tooltip>
        );
    } else {
        return (
            <View style={[tailwind('flex flex-col')]}>
                <View
                    style={[
                        { zIndex: 100 },
                        tailwind(
                            'flex-shrink flex-row justify-around items-center p-3 border-green-600 h-16 bg-white'
                        ),
                        tailwind('bg-gray-300'),
                    ]}
                >
                    <Toggle
                        title={'Loading...'}
                        activeText="On"
                        inactiveText="Off"
                        value={false}
                        onToggle={() => log.info('toggled while loading')}
                    />
                    <View style={tailwind('flex-grow-0')}>
                        <Text style={[{ alignSelf: 'flex-end' }]}>{0.0}mi</Text>
                        <Text>{elapsedTime}</Text>
                    </View>
                </View>
            </View>
        );
    }
}