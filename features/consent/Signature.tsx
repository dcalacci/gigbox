import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    KeyboardAvoidingView,
    TextInput,
    Platform,
    StyleSheet,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { tailwind } from 'tailwind';
import * as Haptics from 'expo-haptics';
import { SignatureView } from 'react-native-signature-capture-view';
import BinarySurveyQuestion from './BinarySurveyQuestion';

export const Signature = ({
    saveSignature,
    saveName,
    onPressContinue,
}: {
    saveSignature: (val: string) => void;
    saveName: (val: string) => void;
    onPressContinue: () => void;
}) => {
    const sigRef = useRef(null);
    const [sigText, setSigText] = useState<string>('');
    const [name, setName] = useState<string>('');

    return (
        <KeyboardAwareScrollView style={tailwind('bg-gray-100')}>
            <View style={tailwind('p-2')}>
                <Text style={[tailwind('text-3xl font-bold text-green-500 pb-2')]}>Signature</Text>
            </View>
            <View style={tailwind('flex-col p-5')}>
                <Text style={tailwind('text-lg underline text-green-500 font-bold pb-5')}>
                    🎉 To show you understand the procedures, and that you agree to participate in
                    this study, please enter your name, and sign with your finger below:
                </Text>
            </View>
            <View style={[tailwind('w-full h-64 bg-gray-100 mb-5'), { overflow: 'hidden' }]}>
                <SignatureView
                    style={tailwind('h-48 ml-2 mr-2 mb-0')}
                    ref={sigRef}
                    // onSave is automatically called whenever signature-pad onEnd is called and saveSignature is called
                    onSave={(val) => {
                        //  a base64 encoded image
                        console.log('saved signature');
                        setSigText(val);
                        saveSignature(val);
                    }}
                    onClear={() => {
                        console.log('cleared signature');
                        setSigText('');
                    }}
                />
                <Pressable
                    style={[tailwind('bg-red-400 p-2 ml-2 mr-2'), styles.roundedBottom]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        sigRef.current.clearSignature();
                    }}
                >
                    <Text style={tailwind('font-bold text-white text-lg text-center')}>
                        Clear Signature
                    </Text>
                </Pressable>
            </View>
            <View style={tailwind('content-around justify-items-center flex-row w-full')}>
                <TextInput
                    style={[
                        tailwind(
                            ' self-center text-xl mb-2 p-2 text-black ml-2 mr-2 flex-grow h-16 border rounded-lg'
                        ),
                        name == undefined
                            ? tailwind('border-b-2')
                            : tailwind('text-black font-bold underline'),
                    ]}
                    placeholder={'Full Name'}
                    key={`${name}`}
                    autoCapitalize={'words'}
                    autoCompleteType={'name'}
                    onSubmitEditing={({ nativeEvent: { text } }) => {
                        setName(text);
                    }}
                    defaultValue={name}
                    returnKeyType={'done'}
                ></TextInput>
            </View>

            <Pressable
                style={[
                    tailwind('rounded-lg p-5 m-2'),
                    sigText === '' || name === ''
                        ? tailwind('bg-gray-400')
                        : tailwind('bg-green-500'),
                ]}
                disabled={sigText === undefined || name === undefined}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onPressContinue();
                    //TODO: send value to server, wait until we get a response back, and continue
                }}
            >
                <Text style={tailwind('font-bold text-white text-xl text-center')}>
                    I agree to participate in this study
                </Text>
            </Pressable>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    roundedBottom: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
});
