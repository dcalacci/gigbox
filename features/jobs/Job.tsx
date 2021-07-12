import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    TextInput,
    StyleSheet,
    Modal,
} from 'react-native';
import { tailwind } from 'tailwind';
import { Ionicons } from '@expo/vector-icons';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import ScreenshotUploader from './ScreenshotPicker';
import { log } from '../../utils';
import { updateJobValue, deleteImage } from './api';
import { EmployerBox } from '../clock/EmployerSelector';

import Toast from 'react-native-root-toast';

// Scroll view of screenshots
export const Screenshots = ({
    screenshots,
    onPressAddScreenshots,
}: {
    screenshots: Screenshot[];
    onPressAddScreenshots: () => void;
}) => {
    const [imageViewVisible, setImageViewVisible] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<Screenshot>();
    const queryClient = useQueryClient()
    const deleteImg = useMutation(deleteImage, {
        onSuccess: (d) => {
            log.info('Deleted image:', d);
            if (d.deleteImage.ok) {
                Toast.show('Deleted Image.')
                setImageViewVisible(false)
                setSelectedImage(undefined)
                queryClient.invalidateQueries('filteredJobs');
            } else {
                Toast.show(d.deleteImage.message)
            }
        },
        onError: (err) => {
            Toast.show('Error deleting image. Try again.');
        },
    });
    const uploadScreenshotView = () => (
        <>
            <Pressable
                onPress={onPressAddScreenshots}
                style={tailwind('self-center justify-self-center bg-gray-800 rounded-lg p-2')}
            >
                <Text style={tailwind('text-white font-bold underline')}>Add Images</Text>
            </Pressable>
            <Text style={tailwind('text-sm text-center p-1')}>
                Upload images to keep track of expenses, verify your pay, and more.
            </Text>
        </>
    );
    if (!screenshots || screenshots.length === 0) {
        return (
            <View style={tailwind('flex-col justify-center bg-gray-100 w-1/2 rounded-lg m-2 p-2')}>
                {uploadScreenshotView()}
            </View>
        );
    } else {
        const ScreenshotItems = screenshots.map((s, idx) => (
            <View style={tailwind('flex-row p-0 flex-auto')} key={s.id}>
                <View style={tailwind('flex-col p-1')}>
                    <Pressable
                        style={[tailwind('flex-auto m-0')]}
                        onPress={() => {
                            setSelectedImage(s);
                            setImageViewVisible(true);
                        }}
                    >
                        <Image
                            style={[tailwind('flex-auto m-0')]}
                            source={{ uri: s.onDeviceUri }}
                            resizeMethod={'scale'}
                            resizeMode={'contain'}
                        />
                        <Text style={[{ alignSelf: 'flex-start' }, tailwind('font-bold p-1')]}>
                            {moment.utc(s.timestamp).local().format('M/D h:mm a')}
                        </Text>
                    </Pressable>
                </View>

                {idx < screenshots.length - 1 ? (
                    <View style={[tailwind('border-b-2 border-green-500 w-12 self-center')]} />
                ) : null}
            </View>
        ));
        return (
            <ScrollView
                horizontal={true}
                style={tailwind('m-2 rounded-lg bg-gray-100 w-1/2 m-2 p-2')}
                contentContainerStyle={tailwind('justify-center')}
            >
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={imageViewVisible}
                    presentationStyle={'formSheet'}
                    onRequestClose={() => {}}
                >
                    <ScrollView style={tailwind('flex flex-col h-full p-5')}>
                        <View style={tailwind('flex-row justify-between p-2')}>
                            <Text style={tailwind('text-2xl font-bold text-black')}>
                                Image Details
                            </Text>
                            <Pressable
                                onPress={() => setImageViewVisible(false)}
                                style={[tailwind('items-center')]}
                            >
                                <Ionicons name="close-circle" size={30} />
                            </Pressable>
                        </View>
                        <Image
                            style={[tailwind('flex-grow m-5 h-96')]}
                            source={{ uri: selectedImage?.onDeviceUri }}
                            resizeMethod={'scale'}
                            resizeMode={'contain'}
                        />

                        <Text style={tailwind('text-lg font-black font-normal')}>
                            Added: {moment.utc(selectedImage?.timestamp).local().format('LLLL')}
                        </Text>

                        <Pressable
                            onPress={() => deleteImg.mutate({id: selectedImage?.id})}
                            style={[
                                tailwind(
                                    'border-red-500 bg-red-500 border-2 rounded-lg items-center m-2 p-2'
                                ),
                            ]}
                        >
                            <Text style={tailwind('text-lg font-bold p-1 text-white')}>
                                Delete Image
                            </Text>
                        </Pressable>
                    </ScrollView>
                </Modal>
                {ScreenshotItems}
                <View style={tailwind('flex-col justify-center m-2 mr-3 w-32')}>
                    <Pressable
                        onPress={onPressAddScreenshots}
                        style={tailwind(
                            'self-center justify-self-center bg-gray-800 rounded-lg p-2'
                        )}
                    >
                        <Text style={tailwind('text-white font-bold underline')}>Add Images</Text>
                    </Pressable>
                    <Text style={tailwind('text-sm text-center p-1')}></Text>
                </View>
            </ScrollView>
        );
    }
};

// A single job, including its map, details, and screenshot uploader
export const JobItem = ({ job }: { job: Job }) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState<LatLng>();

    const [modalVisible, setModalVisible] = useState(false);
    useEffect(() => {
        if (job.snappedGeometry) {
            const { geometries, bounding_box } = JSON.parse(job.snappedGeometry);
            const locations = geometries.map((c: [number, number]) => {
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
    }, [job.snappedGeometry]);

    const JobDetail = ({
        label,
        value,
        prefix,
        suffix,
        placeholder,
        mutationKey,
        dataKey,
    }: {
        label: string;
        value: number | string;
        prefix: string;
        suffix: string;
        placeholder: string;
        mutationKey: string;
        dataKey: string;
    }) => {
        const [displayValue, setDisplayValue] = useState<string>();
        const [isFocused, setFocused] = useState<boolean>();
        const queryClient = useQueryClient();

        const setJobValue = useMutation(updateJobValue, {
            onSuccess: (data, variables) => {
                log.info('updating job value:', data, variables);
                queryClient.invalidateQueries('filteredJobs');
                queryClient.invalidateQueries('shifts');
                queryClient.invalidateQueries('trackedJobs');
                queryClient.invalidateQueries('weeklySummary');
            },
        });

        // set value from our input, and submit mutation
        useEffect(() => {
            if (value) {
                setDisplayValue(
                    typeof value === 'number' ? value.toFixed(2) : parseFloat(value).toFixed(2)
                );
            }
        }, [value]);

        const setFormattedValue = (input: string) => {
            console.log('Setting formatted val:', input);
            setDisplayValue(input);
        };

        const onSubmit = () => {
            if (displayValue) {
                const val = parseFloat(displayValue).toFixed(2);
                console.log('Submitted. data:', val);
                setJobValue.mutate({
                    jobId: job.id,
                    mutationKey: mutationKey,
                    key: dataKey,
                    value: val,
                });
                //TODO: Submit to server on mutation
                //TODO: decimal formatting (for convenience)
            }
        };

        const onFocus = () => {
            console.log('Focused text input!');
        };

        const onBlur = () => {
            console.log('Blurred text input!');
        };

        return (
            <View style={[tailwind('flex flex-col pt-1')]}>
                <Text style={tailwind('text-xs text-black p-0 m-0')}>{label}</Text>
                <View
                    style={[
                        tailwind('rounded-lg h-12 flex-row w-36 items-center'),
                        isFocused ? tailwind('border-2') : null,
                        displayValue == undefined
                            ? tailwind('bg-gray-100')
                            : tailwind('bg-green-500'),
                    ]}
                >
                        <Text style={[tailwind('ml-2 text-xl flex-auto'),
                            displayValue == undefined
                                ? tailwind('text-black')
                                : tailwind('text-white font-bold'),
                        ]}>{prefix}</Text>
                    <TextInput
                        style={[
                            tailwind('text-xl mb-2 text-black w-full flex-auto'),
                            displayValue == undefined
                                ? tailwind('border-b-2')
                                : tailwind('text-white font-bold underline'),
                        ]}
                        key={`${value}`}
                        onChangeText={setFormattedValue}
                        maxLength={5}
                        keyboardType={'decimal-pad'}
                        onSubmitEditing={onSubmit}
                        onEndEditing={onSubmit}
                        returnKeyType={'done'}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                    >
                        {displayValue}
                    </TextInput>
                        <Text style={[tailwind('text-xl flex-grow font-bold mr-4'),
                            displayValue == undefined
                                ? tailwind('text-black')
                                : tailwind('text-white font-bold'),
                        ]}>
                        {suffix}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View
            style={[
                tailwind('flex-col w-full rounded-lg bg-white mb-2 mt-5 pt-0'),
                { overflow: 'hidden' },
            ]}
        >
            <ScreenshotUploader
                shiftId={job.shiftId}
                jobId={job.id}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />

            <View style={[tailwind('h-36 w-full'), { overflow: 'hidden' }]}>
                <View style={styles.mapTitle}>
                    <EmployerBox employer={job.employer} size={14} style={tailwind('')} />
                </View>

                {locations && region ? (
                    <TripMap
                        interactive={false}
                        isActive={false}
                        tripLocations={locations}
                        region={region}
                    >
                        {job.endLocation ? (
                            <Marker
                                pinColor={'red'}
                                coordinate={{
                                    longitude: parse(job.endLocation)?.coordinates[0] as number,
                                    latitude: parse(job.endLocation)?.coordinates[1] as number,
                                }}
                            ></Marker>
                        ) : null}

                        {job.startLocation ? (
                            <Marker
                                pinColor={'green'}
                                coordinate={{
                                    longitude: parse(job.startLocation)?.coordinates[0] as number,
                                    latitude: parse(job.startLocation)?.coordinates[1] as number,
                                }}
                            ></Marker>
                        ) : null}
                    </TripMap>
                ) : (
                    <Text>No locations recorded for this job</Text>
                )}
            </View>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('flex-row justify-between p-2 pl-5 pr-5')}>
                    <Text style={tailwind('text-xl font-bold')}>
                        {moment.utc(job.startTime).local().format('LL')}{' '}
                    </Text>

                    <Text style={tailwind('text-xl font-bold')}>
                        {moment.utc(job.startTime).local().format('LT')} -{' '}
                        {moment.utc(job.endTime).local().format('LT')}{' '}
                    </Text>
                </View>
                <View style={tailwind('flex-row p-5')}>
                    <Screenshots
                        screenshots={job.screenshots}
                        onPressAddScreenshots={() => setModalVisible(true)}
                    />
                    <View
                        style={tailwind(
                            'flex flex-col flex-grow p-2 content-between justify-between'
                        )}
                    >
                        <JobDetail
                            label={'Mileage'}
                            value={job.mileage}
                            prefix={''}
                            suffix={' mi'}
                            placeholder={''}
                            mutationKey={'setJobMileage'}
                            dataKey={'mileage'}
                        />
                        <JobDetail
                            label={'Total Pay'}
                            value={job.totalPay}
                            prefix={'$ '}
                            suffix={''}
                            placeholder={''}
                            mutationKey={'setJobTotalPay'}
                            dataKey={'totalPay'}
                        ></JobDetail>
                        <JobDetail
                            label={'Tip'}
                            value={job.tip}
                            prefix={'$ '}
                            suffix={''}
                            placeholder={''}
                            mutationKey={'setJobTip'}
                            dataKey={'tip'}
                        ></JobDetail>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mapTitle: {
        position: 'absolute',
        top: 2,
        left: 10,
        zIndex: 101,
    },
});
