import React, { useState, useEffect } from 'react';
import { Image, ScrollView, View, Modal, Pressable, Text } from 'react-native';
import { tailwind } from 'tailwind';
import { useMutation, useQueryClient } from 'react-query';
import { Asset } from 'expo-media-library';
import { addScreenshotToShift } from '../clock/api';
import { deleteImage } from './api';

import Ellipsis from '../../components/Ellipsis';
import { log } from '../../utils';
import * as ImagePicker from 'expo-image-picker';

import { useToast } from 'react-native-fast-toast';

const ScreenshotUploader = ({
    modalVisible,
    setModalVisible,
    shiftId,
    jobId,
}: {
    modalVisible: boolean;
    setModalVisible: Function;
    shiftId: string;
    jobId: string;
}) => {
    const [imageUri, setImageUri] = useState<string>();
    const [parsedText, setParsedText] = useState<string>('');
    const toast = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
            }
        })();
    }, []);

    const uploadScreenshot = useMutation(addScreenshotToShift, {
        onSuccess: (data, variables, context) => {
            log.info('Submitted screenshot!', data, variables, context);
            setParsedText(data.addScreenshotToShift.data);
            queryClient.invalidateQueries('shifts');
            queryClient.invalidateQueries('weeklySummary');

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

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            exif: true,
        });

        if (!result.cancelled) {
            setImageUri(result.uri);
            uploadScreenshot.mutate({
                screenshotLocalUri: result.uri,
                objectId: jobId,
                modificationTime: new Date(result.exif?.DateTimeOriginal).getTime(),
            });
        }
    };

    const deleteImg = useMutation(deleteImage, {
        onSuccess: (d) => {
            log.info('Deleted image:', d);
            if (d.deleteImage.ok) {
                queryClient.invalidateQueries('filteredJobs');
            }
        },
        onError: (err) => {
            toast?.show('Error deleting image. Try again.');
        },
    });

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            presentationStyle={'formSheet'}
            onRequestClose={() => {
                Alert.alert('Modal has been closed.');
            }}
        >
            <ScrollView style={tailwind('flex flex-col h-full p-5')}>
                <Text style={tailwind('text-3xl underline text-green-500 font-bold p-2')}>
                    Upload Images
                </Text>
                <Text style={tailwind('text-lg p-2')}>
                    Upload images like receipts, pictures while on the job, and screenshots to keep
                    for later.
                </Text>
                <Text style={tailwind('text-lg p-2')}>
                    In the future, you'll be able to upload screenshots of your in-app pay summaries
                    to automatically track your pay and tips.
                </Text>
                {imageUri ? (
                    <View style={tailwind('flex flex-col h-1/2 content-center')}>
                        <Image
                            source={{ uri: imageUri }}
                            resizeMethod={'scale'}
                            resizeMode={'contain'}
                            style={[tailwind('self-center flex w-full h-full')]}
                        />
                    </View>
                ) : null}

                <View style={tailwind('flex flex-grow w-full')}>
                    {uploadScreenshot.status == 'loading' ? (
                        <Ellipsis style={tailwind('text-black self-center')} />
                    ) : null}
                </View>

                {parsedText == '' ? (
                    <Pressable
                        style={tailwind('rounded-lg bg-gray-800 self-center w-10/12 m-2')}
                        onPress={() => {
                            pickImage();
                        }}
                    >
                        <Text
                            style={tailwind(
                                'text-white font-bold text-lg underline p-2 self-center'
                            )}
                        >
                            Choose Image
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={tailwind('rounded-lg bg-gray-800 self-center w-10/12 m-2')}
                        onPress={() => {
                            setModalVisible(false);
                            setImageUri(undefined);
                            setParsedText('');
                            // update job list to pull new screenshot
                            queryClient.invalidateQueries('filteredJobs');
                        }}
                    >
                        <Text
                            style={tailwind(
                                'text-white font-bold text-lg underline p-2 self-center'
                            )}
                        >
                            Done
                        </Text>
                    </Pressable>
                )}

                <Pressable
                    style={tailwind('rounded-lg bg-red-400 self-center w-10/12 m-2')}
                    onPress={() => {
                        if (uploadScreenshot.data?.addScreenshotToShift.screenshot) {
                            const screenshot = uploadScreenshot.data?.addScreenshotToShift.screenshot
                            console.log(
                                'canceled; deleting screenshot:',
                                screenshot
                            );
                            deleteImg.mutate({ id: screenshot.id });
                            queryClient.invalidateQueries('filteredJobs');
                        }
                        setImageUri(undefined);
                        setParsedText('');
                        setModalVisible(false);
                    }}
                >
                    <Text
                        style={tailwind('text-white font-bold text-lg underline p-2 self-center')}
                    >
                        Cancel
                    </Text>
                </Pressable>
                <View style={tailwind('pb-20')} />
            </ScrollView>
        </Modal>
    );
};

export default ScreenshotUploader;
