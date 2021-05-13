import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    TextInput,
    StyleSheet,
} from 'react-native';
import { tailwind } from 'tailwind';
import * as Haptics from 'expo-haptics';
import { SignatureView } from 'react-native-signature-capture-view';
import BinarySurveyQuestion from './BinarySurveyQuestion';

export const Signature = ({}) => {
    const [locationConsent, setLocationConsent] = useState<boolean>();
    const [photoConsent, setPhotoConsent] = useState<boolean>();

    const sigRef = useRef(null);
    const [sigText, setSigText] = useState<string>();

    return (
        <View style={tailwind('bg-gray-100')}>
            <View style={tailwind('p-2')}>
                <Text style={[tailwind('text-3xl font-bold text-green-500 pb-2')]}>Signature</Text>
            </View>
            <View style={tailwind('flex-col p-5')}>
                <Text style={tailwind('text-lg underline text-green-500 font-bold pb-5')}>
                    🎉 To show you understand the procedures, and that you agree to participate in
                    this study, please enter your name, and sign with your finger below:
                </Text>
            </View>
            <View style={tailwind('w-full h-64')}>
                <SignatureView
                    style={{
                        borderWidth: 2,
                        height: 200,
                    }}
                    ref={sigRef}
                    // onSave is automatically called whenever signature-pad onEnd is called and saveSignature is called
                    onSave={(val) => {
                        //  a base64 encoded image
                        console.log('saved signature');
                        setSigText(val);
                    }}
                    onClear={() => {
                        console.log('cleared signature');
                        setSigText('');
                    }}
                />
            </View>
            <Pressable
                style={tailwind('rounded-lg bg-red-400 p-2 m-2')}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    sigRef.current.clearSignature();
                }}
            >
                <Text style={tailwind('font-bold text-white text-lg text-center')}>
                    Clear Signature
                </Text>
            </Pressable>

            <Pressable
                style={tailwind('rounded-lg bg-green-500 p-5 m-2')}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    //TODO: send value to server, wait until we get a response back, and continue
                }}
            >
                <Text style={tailwind('font-bold text-white text-xl text-center')}>
                    I agree to participate in this study
                </Text>
            </Pressable>
        </View>
    );
};
