import React, { useState, useEffect } from 'react';
import { Image, ScrollView, View, Modal, Pressable, Text } from 'react-native';
import { tailwind } from 'tailwind';
import * as ImagePicker from 'expo-image-picker';

const ScreenshotUploader = ({ modalVisible, setModalVisible }: { modalVisible: boolean }) => {
    const [image, setImage] = useState(null);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
            }
        })();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            exif: true,
        });

        console.log(result);
        if (!result.cancelled) {
            setImage(result.uri);
        }
    };

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
                    Upload Screenshot
                </Text>
                <Text style={tailwind('text-lg p-2')}>
                    To automatically track pay, the differences between estimated pay and actual
                    pay, and tips, you can upload a screenshot for this job. You can upload one of
                    two kinds of screens:
                </Text>
                <View style={tailwind('flex-row content-between pt-5 mb-10')}>
                    <View style={tailwind('flex-1 flex-col p-1 w-36 ')}>
                        <Text style={tailwind('text-lg underline p-2 self-center')}>
                            Job Accept Screen
                        </Text>
                        <View style={tailwind('bg-gray-100 rounded-lg ml-5 mr-5 h-48')}></View>
                    </View>
                    <View style={tailwind('flex-1 flex-col p-1 w-36')}>
                        <Text style={tailwind('text-lg underline p-2 self-center')}>
                            Job Pay Screen
                        </Text>
                        <View style={tailwind('bg-gray-100 rounded-lg ml-5 mr-5 h-48')}></View>
                    </View>
                </View>

                {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}

                <Pressable
                    style={tailwind('rounded-lg bg-gray-800 self-center w-10/12 m-2')}
                    onPress={() => {
                        pickImage();
                    }}
                >
                    <Text
                        style={tailwind('text-white font-bold text-lg underline p-2 self-center')}
                    >
                        Pick Screenshot
                    </Text>
                </Pressable>

                <Pressable
                    style={tailwind('rounded-lg bg-red-400 self-center w-10/12 m-2')}
                    onPress={() => {
                        setModalVisible(false);
                    }}
                >
                    <Text
                        style={tailwind('text-white font-bold text-lg underline p-2 self-center')}
                    >
                        Close
                    </Text>
                </Pressable>
                <View style={tailwind('pb-20')}/>
            </ScrollView>
        </Modal>
    );
};

export default ScreenshotUploader;
