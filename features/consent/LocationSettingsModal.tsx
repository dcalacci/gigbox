import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
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
import * as Linking from 'expo-linking';

import {
    requestForegroundPermissionsAsync,
    requestBackgroundPermissionsAsync,
    getBackgroundPermissionsAsync,
    getForegroundPermissionsAsync,
} from 'expo-location';

export const LocationSettingsModal = ({
    visible,
    setVisible,
}: {
    visible: boolean;
    setVisible: (visible: boolean) => void
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            presentationStyle={'formSheet'}
        >
            <View style={tailwind('flex flex-col h-full p-5')}>
                <Text style={tailwind('text-3xl underline font-bold p-2')}>Location Settings</Text>

                <Text style={tailwind('text-lg p-2')}>
                    Gigbox needs 'always on' location tracking to work properly. We'll never share
                    your location with anyone. here's how to enable it:
                </Text>
                <Text style={tailwind('text-lg p-2')}>
                    1. Tap button below to open Gigbox settings
                </Text>
                <Text style={tailwind('text-lg p-2')}>2. Tap "Location"</Text>
                <Text style={tailwind('text-lg p-2')}>
                    3. Choose "Always" and enable Precise Location
                </Text>

                <Pressable
                    style={tailwind('rounded-lg bg-gray-800 self-center w-10/12 m-2')}
                    onPress={() => {
                        Linking.openSettings();
                    }}
                >
                    <Text
                        style={tailwind('text-white font-bold text-lg underline p-2 self-center')}
                    >
                        Open Settings
                    </Text>
                </Pressable>

                <Pressable
                    style={tailwind('rounded-lg bg-red-400 self-center w-10/12 m-2')}
                    onPress={() => {
                        setVisible(false)
                    }}
                >
                    <Text
                        style={tailwind('text-white font-bold text-lg underline p-2 self-center')}
                    >
                            Close
                    </Text>
                </Pressable>
            </View>
        </Modal>
    );
};
