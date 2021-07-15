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

import Toast from 'react-native-root-toast';
import EmployerModalPicker from './EmployerModalPicker';
import { JobItem } from './JobItem';

export const JobDetailScreen = ({ route }: { route: { params: { job: Job } } }) => {
    const job = route.params.job;
    return (
        <>
            <JobDetailCard job={job} />
        </>
    );
};

// A single job, including its map, details, and screenshot uploader
export const JobDetailCard = ({ job }: { job: Job }) => {
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
    const JobDetailScreenHeader = () => {
        return (
            <View style={tailwind('flex-col w-full bg-white')}>
                <View style={tailwind('flex-row p-2 justify-between')}>
                    <Text style={[tailwind('text-3xl font-bold')]}>Job Details</Text>
                </View>
            </View>
        );
    };
    return (
        <ScrollView style={[tailwind('flex-col w-full rounded-lg bg-white h-full')]}>
            <ScreenshotUploader
                shiftId={job.shiftId}
                jobId={job.id}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />

            <View style={[tailwind('h-80 w-full'), { overflow: 'hidden' }]}>
                {locations && region ? (
                    <TripMap
                        interactive={true}
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
            <JobDetailScreenHeader />
            <View style={tailwind('flex-col flex-grow justify-center w-full pl-1 pr-1')}>
                <JobItem job={job} displayDetails={true} submitChanges={true} showMap={false} />
                <View style={tailwind('flex-row w-full justify-center mb-10')}>
                    <Screenshots
                        screenshots={job.screenshots}
                        onPressAddScreenshots={() => setModalVisible(true)}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

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
    const queryClient = useQueryClient();
    const deleteImg = useMutation(deleteImage, {
        onSuccess: (d) => {
            log.info('Deleted image:', d);
            if (d.deleteImage.ok) {
                Toast.show('Deleted Image.');
                setImageViewVisible(false);
                setSelectedImage(undefined);
                queryClient.invalidateQueries('filteredJobs');
            } else {
                Toast.show(d.deleteImage.message);
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
                <Text style={tailwind('text-white text-xl font-bold underline')}>Add Images</Text>
            </Pressable>
            <Text style={tailwind('text-base text-center m-1')}>
                Upload images to keep track of expenses, verify your pay, and more.
            </Text>
        </>
    );
    if (!screenshots || screenshots.length === 0) {
        return (
            <View style={tailwind('flex-col justify-center bg-gray-100 rounded-lg m-2 p-2')}>
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
            <View style={tailwind('flex-col justify-center bg-gray-100 rounded-lg m-2 p-4 w-5/6')}>
                <Text style={tailwind('text-xl font-bold p-2')}>Attached Images</Text>
                <ScrollView
                    horizontal={true}
                    style={tailwind('m-2 rounded-lg bg-gray-100 m-2 p-2 w-full h-48')}
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
                                onPress={() => deleteImg.mutate({ id: selectedImage?.id })}
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
                </ScrollView>
                <View style={tailwind('flex-col justify-center')}>
                    <Pressable
                        onPress={onPressAddScreenshots}
                        style={tailwind(
                            'self-center justify-self-center bg-gray-800 rounded-lg p-2'
                        )}
                    >
                        <Text style={tailwind('text-white text-xl font-bold underline')}>
                            Add Images
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }
};
