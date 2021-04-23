import React, { useEffect, useState } from 'react';
import { View, Text, EmitterSubscription, StyleSheet, Pressable } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { tailwind } from 'tailwind';
import { useToast } from 'react-native-fast-toast';

import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library';

import { RootState } from '../../store/index';
import Toggle from '../../components/Toggle';

import { Ionicons } from '@expo/vector-icons';
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
import TripMap from '../shiftList/TripMap';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';

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
        // registerMileageTask();
    });

    const [jobStarted, setJobStarted] = useState(false);
    const [locations, setLocations] = useState([{}]);
    const [region, setRegion] = useState(null);
    useEffect(() => {
        console.log('trying to set geometry');
        if (shiftStatus.data?.getActiveShift && shiftStatus.data?.getActiveShift.snappedGeometry) {
            log.info('Setting locations and bounding box for shift.');
            const { geometries, bounding_box } = JSON.parse(
                shiftStatus.data?.getActiveShift.snappedGeometry
            );
            const locations = geometries.map((c) => {
                return { latitude: c[1], longitude: c[0] };
            });
            setLocations(locations);
            const bbox = bounding_box;
            setRegion({
                latitudeDelta: (bbox.maxLat - bbox.minLat) * 2.05,
                longitudeDelta: (bbox.maxLng - bbox.minLng) * 2.05,
                latitude: bbox.maxLat - (bbox.maxLat - bbox.minLat) / 2,
                longitude: bbox.maxLng - (bbox.maxLng - bbox.minLng) / 2,
            });
        }
    }, [shiftStatus.data?.getActiveShift]);

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
                                timestamp: new Date(),
                            })
                        );
                        /* processScreenshots(obj.insertedAssets, shiftStatus.data?.getActiveShift); */
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
                            const shift_id = shiftStatus.data.getActiveShift.id;
                            log.info('Shift ID:', shift_id);
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
            <View style={[tailwind('flex flex-col')]}>
                <View
                    style={[
                        { zIndex: 100 },
                        tailwind(
                            'flex-shrink flex-row justify-around items-center p-3 border-green-600 h-16 bg-white'
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
                {shiftActive() ? (
                    <View
                        style={[
                            tailwind('flex-auto flex-col ml-1 mb-1 mr-1'),
                            styles.cardShadow,
                            styles.card,
                        ]}
                    >
                        <View
                            style={[
                                tailwind('flex-auto w-full flex-col'),
                                styles.card,
                            ]}
                        >
                            {jobStarted ? (
                                <View style={tailwind('h-36 border-b-2 border-green-500')}>
                                    <View style={styles.mapTitle}>
                                        <Text style={tailwind('text-xl text-gray-800 font-bold underline')}>Current Job</Text>
                                    </View>
                                    <TripMap
                                        interactive={true}
                                        isActive={false}
                                        tripLocations={locations}
                                        region={region}
                                        shiftId={shift.id}
                                    />
                                </View>
                            ) : null}
                            {jobStarted ? (
                                <View style={tailwind('w-full p-2')}>
                                    <View
                                        style={tailwind(
                                            'flex-initial bg-green-500 rounded-2xl p-1'
                                        )}
                                    >
                                        <Text
                                            style={tailwind(
                                                'text-sm font-bold text-white flex-initial'
                                            )}
                                        >
                                            Started: 4:32pm
                                        </Text>
                                    </View>
                                </View>
                            ) : null}
                            {shiftActive() ? 
                            <Pressable
                                onPress={() => setJobStarted(!jobStarted)}
                                style={[
                                    tailwind('mb-0 p-2'),
                                    jobStarted ? tailwind('bg-red-300') : tailwind('bg-gray-600'),
                                    styles.roundedBottom,
                                ]}
                            >
                                <Text
                                    style={tailwind(
                                        'underline font-bold text-white text-lg self-center'
                                    )}
                                >
                                    {jobStarted ? 'End This Job' : 'Start New Job'}
                                </Text>
                            </Pressable>
                            : null}
                        </View>
                    </View>
                ) : null}
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
        zIndex: 101
    }
});
