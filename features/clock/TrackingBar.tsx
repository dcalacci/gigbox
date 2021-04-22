import React, { useEffect, useState } from 'react';
import { View, Text, EmitterSubscription } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { tailwind } from 'tailwind';
import { useToast } from 'react-native-fast-toast';

import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library';

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
import { fetchActiveShift, endShift, createShift, addScreenshotToShift } from './api';
import { log } from '../../utils';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';

const processScreenshots = (screenshots: Asset[], activeShift: any) => {
    //TODO: process screenshots into jobs / send to server
    /* log.info(' MEDIA LIBRARY CHANGED; incremental changes:', screenshots.length); */
    log.info('screenshot 0:', screenshots[0]);
    log.info('Adding screenshot to shift: ', activeShift);
};

export default function TrackingBar() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const auth = useSelector((state: RootState): AuthState => state.auth);
    const shiftStatus = useQuery('activeShift', fetchActiveShift, {
        refetchInterval: 10000,
        refetchIntervalInBackground: true,
        placeholderData: { getActiveShift: { active: false } },
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

    if (shiftStatus.isLoading) {
        log.info('Tracking bar loading...');
    }
    if (shiftStatus.isError) {
        log.error(`tracking bar Error! ${shiftStatus.error}`);
        toast?.show(`Problem loading shifts: ${shiftStatus.error}`);
    }

    const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(null));

    // convenience function to check if there's a current active shift
    const shiftActive = () => {
        if (shiftStatus.isLoading || shiftStatus.isError) {
            return false;
        }
        return !shiftStatus.data.getActiveShift ? false : shiftStatus.data.getActiveShift.active;
    };

    // updates the tracking bar time logger every second. Uses useEffect
    // so our setInterval resets on cue.
    useEffect(() => {
        if (shiftActive()) {
            let interval = setInterval(() => {
                const clockInTime = shiftStatus.data.getActiveShift.startTime;
                /* const startTimestamp = shiftActive() ? clockInTime : null; */
                setElapsedTime(formatElapsedTime(clockInTime));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            // otherwise set it to zero
            setElapsedTime(formatElapsedTime(null));
        }
        registerMileageTask();
    });

    const [mediaListener, setMediaListener] = useState<any | null>(null);
    // Processes new screenshots while tracking bar is on
    useEffect(() => {
        if (mediaListener == null && shiftActive()) {
            log.info('trying to add media listener...');
            console.log(mediaListener);
            const listener = MediaLibrary.addListener(async (obj) => {
                log.info('Adding listener...');
                //TODO: if user takes a screenshot of an app, but they're not in an active shift,
                // ask them if they would like to start a shift.
                if (Device.osName === 'iOS') {
                    log.info('Trying to retrieve screenshots from iOS...');
                    if ('insertedAssets' in obj && shiftActive()) {
                        const shift_id = shiftStatus.data.getActiveShift.id;

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
                                timestamp: new Date()
                            })
                        );
                        /* processScreenshots(obj.insertedAssets, shiftStatus.data?.getActiveShift); */
                    }
                } else {
                    log.info('Trying to retrieve screenshots from android..');
                    try {
                        const screenshotAlbum = await MediaLibrary.getAlbumAsync('Screenshots')
                        MediaLibrary.getAssetsAsync({
                            album: screenshotAlbum,
                            mediaType: [MediaLibrary.MediaType.photo],
                            // you'd think it would be creationTime, but screenshots have a 
                            // creationTime of 0 on android it seems
                            sortBy: [[MediaLibrary.SortBy.modificationTime, false]],
                        }).then((screenshots) => {
                            console.log('screenshots:', screenshots.assets);
                            const shift_id = shiftStatus.data.getActiveShift.id;
                            log.info("Shift ID:", shift_id)
                            uploadScreenshot.mutate({
                                screenshot: screenshots.assets[0],
                                shiftId: shift_id
                            })
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
        if (!shiftActive()) {
            createActiveShift.mutate();
        } else {
            log.info('Ending shift ', shiftStatus.data.getActiveShift.id);
            endActiveShift.mutate(shiftStatus.data.getActiveShift.id);
        }
    };

    const textStyle = [tailwind('text-lg'), shiftActive() ? tailwind('font-semibold') : null];
    /* log.info('Rendering shift:', shiftStatus.data.getActiveShift); */

    if (!shiftStatus.isLoading && !shiftStatus.isError) {
        const shift = shiftStatus.data.getActiveShift;
        const nMiles = (shift && shift.roadSnappedMiles ? shift.roadSnappedMiles : 0.0).toFixed(1);
        return (
            <View style={[tailwind(''), shiftActive() ? tailwind('bg-green-500') : null]}>
                <View
                    style={[
                        tailwind(
                            'flex-shrink flex-row justify-around items-center border-b-4 p-3 border-green-600 h-16 bg-white'
                        ),
                        shiftActive() ? tailwind('bg-green-500') : null,
                    ]}
                >
                    <Toggle
                        title={shiftActive() ? 'Tracking Shift' : 'Clock In'}
                        activeText="On"
                        inactiveText="Off"
                        value={shiftActive()}
                        onToggle={onTogglePress}
                    />
                    <View style={tailwind('flex-grow-0')}>
                        <Text style={textStyle}>{nMiles}mi</Text>
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
