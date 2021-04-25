import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation } from 'react-native';
import { useSelector } from 'react-redux';
import { tailwind } from 'tailwind';
import { useToast } from 'react-native-fast-toast';

import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library';

import { RootState } from '../../store/index';
import Toggle from '../../components/Toggle';

import { Ionicons } from '@expo/vector-icons';
import { AuthState } from '../auth/authSlice';
import { formatElapsedTime } from '../../utils';
import { startGettingBackgroundLocation, stopGettingBackgroundLocation } from '../../tasks';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchActiveShift, endShift, createShift, addScreenshotToShift } from './api';
import { log } from '../../utils';
import JobTracker from './JobTracker';
import * as Device from 'expo-device';

export default function TrackingBar() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const activeShift = useQuery('activeShift', fetchActiveShift, {
        refetchInterval: 5000,
        // refetchIntervalInBackground: true,
        placeholderData: {
            active: false,
            id: '',
            roadSnappedMiles: 0,
            startTime: new Date(),
            snappedGeometry: '',
            jobs: [],
        },
        onError: (err) => {
            log.error("Could not fetch shift")
        }
    });
    const endActiveShift = useMutation(endShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            // update weekly summary data
            queryClient.invalidateQueries('weeklySummary');
            // update shift list
            queryClient.invalidateQueries('shifts');
            stopGettingBackgroundLocation();
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
            log.error(`Problem ending shift: ${err}`);
            queryClient.setQueryData('activeShift', context.previousShift);
            toast?.show('Encountered a problem ending your shift... Try again?');
        },
    });

    const createActiveShift = useMutation(createShift, {
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries('activeShift');
            queryClient.invalidateQueries('shifts');
            log.info('Created new shift:', data);
            startGettingBackgroundLocation();
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
            toast?.show("Couldn't start a shift. Try again?");
        },
        onSettled: () => {
            queryClient.invalidateQueries('activeShift');
        },
    });

    const uploadScreenshot = useMutation(addScreenshotToShift, {
        onSuccess: (data, variables, context) => {
            log.info('Submitted screenshot!', data, variables, context);
            console.log(data);
        },
        onError: (err, problem, context) => {
            log.error('Had a problem:', err, problem);
            console.log(err);
        },
        onSettled: () => {
            log.info('Settled adding screenshot.');
        },
    });

    if (activeShift.isLoading) {
        log.info('Tracking bar loading...');
    }
    if (activeShift.isError) {
        log.error(`tracking bar Error! ${activeShift.error}`);
        toast?.show(`Problem loading shifts: ${activeShift.error}`);
    }

    const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(null));

    // updates the tracking bar time logger every second. Uses useEffect
    // so our setInterval resets on cue.
    useEffect(() => {
        if (activeShift.status == 'success' && activeShift.data.active) {
            let interval = setInterval(() => {
                const clockInTime = activeShift.data.startTime;
                /* const startTimestamp = shiftActive() ? clockInTime : null; */
                setElapsedTime(formatElapsedTime(clockInTime));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            // otherwise set it to zero
            setElapsedTime(formatElapsedTime(null));
        }
        // registerMileageTask();
    });

    const [mediaListener, setMediaListener] = useState<any | null>(null);
    // Processes new screenshots while tracking bar is on
    useEffect(() => {
        if (activeShift.status != 'success' || !activeShift.data?.active) {
            return;
        } else if (mediaListener == null) {
            log.info('trying to add media listener...');
            console.log(mediaListener);
            const listener = MediaLibrary.addListener(async (obj) => {
                log.info('Adding listener...');
                //TODO: if user takes a screenshot of an app, but they're not in an active shift,
                // ask them if they would like to start a shift.

                // return / break if user is not actively tracking a shift
                if (activeShift.status != 'success' || activeShift.data.active) {
                    return;
                }

                if (Device.osName === 'iOS') {
                    log.info('Trying to retrieve screenshots from iOS...');
                    if ('insertedAssets' in obj) {
                        const shift_id = activeShift.data.id;

                        var screenshots = obj.insertedAssets.filter(
                            (a) =>
                                a.mediaSubtypes != undefined &&
                                a.mediaSubtypes.includes('screenshot')
                        );
                        log.info('Shift found, processing a screenshot for shift ', shift_id);
                        screenshots.map((s: Asset) =>
                            uploadScreenshot.mutate({
                                screenshot: s,
                                shiftId: shift_id,
                            })
                        );
                    }
                } else {
                    log.info('Trying to retrieve screenshots from android..');
                    try {
                        const screenshotAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
                        MediaLibrary.getAssetsAsync({
                            album: screenshotAlbum,
                            mediaType: [MediaLibrary.MediaType.photo],
                            // you'd think it would be creationTime, but screenshots have a
                            // creationTime of 0 on android it seems
                            sortBy: [[MediaLibrary.SortBy.modificationTime, false]],
                        }).then((screenshots) => {
                            console.log('screenshots:', screenshots.assets);
                            const shift_id = activeShift.data.id;
                            uploadScreenshot.mutate({
                                screenshot: screenshots.assets[0],
                                shiftId: shift_id,
                            });
                        });
                        // const scrAlbum = await MediaLibrary.getAlbumAsync('Screenshots')
                        // console.log('album', scrAlbum)
                    } catch (e) {
                        log.error('Could not retrieve screenshots:', e);
                    }
                }
            });
            log.info('Setting media listener local state...');
            setMediaListener(listener);
            return () => {
                if (mediaListener !== null) {
                    log.info('Removing medialistener from local state...');
                    mediaListener.remove();
                    setMediaListener(null);
                }
            };
        }
    });

    const onTogglePress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (!activeShift.data?.active) {
            createActiveShift.mutate();
        } else {
            log.info('Ending shift ', activeShift.data.id);
            endActiveShift.mutate(activeShift.data.id);
        }
    };

    if (activeShift.data) {
        const shift = activeShift.data;
        const textStyle = [tailwind('text-lg'), shift.active ? tailwind('font-semibold') : null];
        const nMiles = (shift && shift.roadSnappedMiles ? shift.roadSnappedMiles : 0.0).toFixed(1);
        return (
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
                        title={shift.active ? 'Tracking Shift' : 'Clock In'}
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
                {shift.active ? <JobTracker shift={shift} /> : null}
            </View>
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

const styles = StyleSheet.create({
    cardShadow: {
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 5,
    },
    card: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
    },
    roundedBottom: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    mapTitle: {
        position: 'absolute',
        top: 2,
        left: 10,
        zIndex: 101,
    },
});
