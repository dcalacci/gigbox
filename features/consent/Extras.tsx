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
} from 'react-native';
import { tailwind } from 'tailwind';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AsYouType, parsePhoneNumber } from 'libphonenumber-js';
import * as Haptics from 'expo-haptics';
import BinarySurveyQuestion from './BinarySurveyQuestion';

export const Extras = ({
    setInterviewConsent,
    setDataSharingConsent,
    dataSharingConsent,
    interviewConsent,
    onPressContinue,
    onPressBack,
    setContactEmail,
    setContactPhone
}: {
    setInterviewConsent: (yes: boolean) => void;
    setDataSharingConsent: (yes: boolean) => void;
    dataSharingConsent: boolean | undefined;
    interviewConsent: boolean | undefined;
    onPressContinue: () => void;
    onPressBack: () => void;
    setContactEmail: (name: string) => void;
    setContactPhone: (phone: string) => void;
}) => {
    const [phoneIsValid, setPhoneValid] = useState<boolean>(false);
    const [emailIsValid, setEmailValid] = useState<boolean>(false);
    const ayt = new AsYouType('US');
    const [phone, setPhone] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    useEffect(() => {
        try {
            const phoneNumber = parsePhoneNumber(phone, 'US');
            setPhoneValid(phoneNumber.isValid());
        } catch (e) {
            setPhoneValid(false);
        }
    }, [phone]);

    const setFormattedPhone = (phone: string) => {
        // formats phone number to US-centric (xxx) xxx-xxxx
        console.log('setting phone:', phone);
        // only do for over length 4 -- otherwise, when you try to delete (XXX, it formats
        // incorrectly.
        if (phone.length > 4) {
            setPhone(ayt.input(phone));
        } else {
            setPhone(phone);
        }
    };
    console.log('valid:', phoneIsValid, emailIsValid);
    console.log('disabled?', interviewConsent ? !phoneIsValid || !emailIsValid : false);

    return (
        <KeyboardAwareScrollView style={tailwind('bg-gray-100')}>
            <View style={tailwind('flex-row')}>
                <Pressable
                    style={tailwind('rounded-lg border border-green-500 m-2')}
                    onPress={onPressBack}
                >
                    <Text style={tailwind('text-xl underline text-green-500 p-2 font-bold ')}>
                        {'< Back'}
                    </Text>
                </Pressable>
            </View>
            <View style={tailwind('p-2')}>
                <Text style={[tailwind('text-3xl font-bold text-green-500 pb-2')]}>
                    User Interviews and Data Sharing
                </Text>
            </View>
            <View style={tailwind('flex-col p-5')}>
                <Text style={tailwind('text-lg underline text-green-500 font-bold pb-5')}>
                    🎉 Congratulations! You’re enrolled. Consenting to either of the below is
                    totally optional.
                </Text>

                <Text style={tailwind('text-base p-2')}>
                    You can opt-in to sharing data with other researchers to help facilitate
                    research on worker’s experiences, and to being contacted for a user interview to
                    help make gigbox better and share your experience as a worker.
                </Text>
                <BinarySurveyQuestion
                    questionText={`Do you consent to MIT sharing data with other researchers securely? Other researchers will be able to analyze your location history + accelerometer readings from the app, the screenshots you’ve taken, and your survey responses, all associated with an anonymous ID (not your phone number or name). They’ll be able to use that data without your additional informed consent.`}
                    onPress={(yes: boolean) => {
                        setDataSharingConsent(yes);
                        console.log('pressss');
                    }}
                    value={dataSharingConsent}
                />
                <BinarySurveyQuestion
                    questionText={
                        'Do you consent to being contacted for further user interviews? If you do, we’ll ask for your contact information so we can schedule an interview. Your contact info will not be associated with the data you share through the app.'
                    }
                    onPress={(yes: boolean) => {
                        setInterviewConsent(yes);
                    }}
                    value={interviewConsent}
                />
                {interviewConsent ? (
                    <>
                        <Text style={tailwind('p-2')}>Phone</Text>
                        <TextInput
                            style={[
                                tailwind('items-center py-2 px-2 rounded-md border-4'),
                                phoneIsValid ? tailwind('border-green-500') : null,
                            ]}
                            key={'phoneInput'}
                            value={phone}
                            onChangeText={setFormattedPhone}
                            placeholder={'(555) 555-5555'}
                            keyboardType={'phone-pad'}
                            autoCompleteType={'tel'}
                            returnKeyType={'done'}
                        ></TextInput>

                        <Text style={tailwind('p-2')}>OR email</Text>
                        <TextInput
                            style={[
                                tailwind('items-center py-2 px-2 rounded-md border-4'),
                                emailIsValid ? tailwind('border-green-500') : null,
                            ]}
                            key={'emailInput'}
                            value={email}
                            onChangeText={(email) => {
                                setEmail(email);
                                let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
                                if (reg.test(email) === false) {
                                    setEmailValid(false);
                                } else {
                                    setEmailValid(true);
                                }
                            }}
                            placeholder={'mygreatemail@aol.com'}
                            keyboardType={'email-address'}
                            autoCompleteType={'email'}
                            returnKeyType={'done'}
                        ></TextInput>
                    </>
                ) : null}
            </View>

            <Pressable
                style={[
                    tailwind('rounded-lg p-5 m-2'),
                    interviewConsent && !phoneIsValid && !emailIsValid
                        ? tailwind('bg-gray-400')
                        : tailwind('bg-green-500'),
                ]}
                disabled={interviewConsent ? !phoneIsValid && !emailIsValid : false}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (phoneIsValid) {
                        setContactPhone(phone)
                    }
                    if (emailIsValid) {
                        setContactEmail(email)
                    }
                    onPressContinue();
                }}
            >
                <Text style={tailwind('font-bold text-white text-xl text-center')}>
                    {interviewConsent && !phoneIsValid && !emailIsValid
                        ? 'Enter a valid email or phone to continue'
                        : 'Continue'}
                </Text>
            </Pressable>
        </KeyboardAwareScrollView>
    );
};
