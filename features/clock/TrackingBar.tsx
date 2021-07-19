import React, { useEffect, useState } from 'react';
import { View, Text, LayoutAnimation, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { tailwind } from 'tailwind';

import Toast from 'react-native-root-toast';
import Modal from 'react-native-modal';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import Tooltip from 'react-native-walkthrough-tooltip';

import { RootState } from '../../store/index';
import Toggle from '../../components/Toggle';

import DateTimeModalPicker from '../../components/DateTimeModalPicker';
import { AuthState } from '../auth/authSlice';
import { formatElapsedTime } from '../../utils';
import {
    isGettingBackgroundLocation,
    startGettingBackgroundLocation,
    stopGettingBackgroundLocation,
} from '../../tasks';
import {
    setShiftEmployers,
    fetchActiveShift,
    endShift,
    createShift,
    updateShiftEndTime,
} from './api';
import { log } from '../../utils';
import { Employers, Shift } from '../../types';
import ModalMultiSelect from '../../components/ModalMultiSelect';
import moment from 'moment';
import { variants } from '@/tailwind.config';

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
    const [longShiftModalVisible, setLongShiftModalVisible] = useState(false);
    const [shiftLength, setShiftLength] = useState(0);
    const [endedShift, setEndedShift] = useState<Shift>();
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
            log.info('on settled mutation...', d, error);
            const shiftLength = moment(d.endShift.shift.endTime).diff(
                moment(d.endShift.shift.startTime),
                'hours'
            );
            console.log('Shift length:', shiftLength);
            setShiftLength(shiftLength);
            setEndedShift(d.endShift.shift);
            if (shiftLength > 8) {
                setLongShiftModalVisible(true);
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

    const updateShiftEnd = useMutation(updateShiftEndTime, {
        onSuccess: (d, v, c) => {
            log.info('Updated shift end time:', d);
        },
        onError: (err) => {
            log.error(`Problem updating shift end time: ${err.message}`);
            Toast.show(`Sorry, ${err.message}`);
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
            let hasEndedShift = false;
            isGettingBackgroundLocation()
                .then((res) => {
                    return res ? stopGettingBackgroundLocation() : Promise.resolve();
                })
                .then(() => {
                    log.info(`Stopped getting background location.`);
                    log.info('Ending shift ', activeShift.data.id);
                    endActiveShift.mutate(activeShift.data.id);
                    hasEndedShift = true;
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
                            if (!hasEndedShift) {
                                console.log("hasn't ended shift, trying end again:", hasEndedShift);
                                endActiveShift.mutate(activeShift.data.id);
                                hasEndedShift = true;
                            }
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

        const [manualShiftEndDate, setManualShiftEndDate] = useState<Date | null>(null);
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
                    <Modal
                        style={tailwind('flex-col justify-end items-center')}
                        onDismiss={() => setLongShiftModalVisible(false)}
                        isVisible={longShiftModalVisible}
                        hasBackdrop={true}
                        onBackdropPress={() => {
                            console.log('backdrop pressed');
                            Toast.show('Clocked out!');
                            setLongShiftModalVisible(false);
                        }}
                        backdropOpacity={0.9}
                        presentationStyle={'overFullScreen'}
                        useNativeDriverForBackdrop={true}
                        swipeDirection={'down'}
                        onSwipeComplete={() => setLongShiftModalVisible(false)}
                        onModalWillHide={() => {}}
                    >
                        <View style={tailwind('rounded-lg bg-white items-center p-5')}>
                            <Text style={tailwind('text-xl font-bold')}>Forgot to clock out?</Text>
                            <Text style={tailwind('text-base')}>
                                You just ended a {shiftLength} hour long shift. If you meant to
                                clock out earlier, no worries - just enter when you think you
                                stopped working.
                            </Text>
                            <Text style={tailwind('text-sm text-gray-500 font-bold p-1')}>
                                Hint: You last clocked in at{' '}
                                {moment.utc(endedShift?.startTime).local().format('LT')} on{' '}
                                {moment.utc(endedShift?.startTime).local().format('L')}
                            </Text>
                            <View style={tailwind('flex-row items-center justify-evenly ')}>
                                <Text style={tailwind('text-lg font-bold')}>Ended at:</Text>
                                <DateTimeModalPicker
                                    defaultDate={moment.utc(endedShift?.endTime).local()}
                                    onSetDate={(d) => {
                                        console.log('setting date to:', d);
                                        setManualShiftEndDate(d);
                                    }}
                                />
                            </View>
                        </View>
                        <Pressable
                            style={tailwind('bg-black rounded-lg p-5 m-2 w-full items-center')}
                            onPress={() => {
                                console.log(
                                    'Updating date on shift:',
                                    endedShift,
                                    manualShiftEndDate || endedShift?.endTime
                                );
                                if (endedShift == undefined) {
                                    return;
                                }
                                updateShiftEnd
                                    .mutateAsync({
                                        shiftId: endedShift.id,
                                        endTime: manualShiftEndDate || endedShift.endTime,
                                    })
                                    .then(() => {
                                        Toast.show('Clocked out!');
                                        setLongShiftModalVisible(false);
                                    });
                            }}
                        >
                            <Text style={tailwind('text-white font-bold')}>Clock Out</Text>
                        </Pressable>
                    </Modal>

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
