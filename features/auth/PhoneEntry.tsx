import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Text, Pressable } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tailwind } from 'tailwind';
import { useToast } from 'react-native-fast-toast';
import { AsYouType, parsePhoneNumber } from 'libphonenumber-js';
import { RootState } from '../../store/index';
import { requestOtp, loginWithOtp, reset, clearErrorMessage } from './otpSlice';
import { useQueryClient } from 'react-query';

const PhoneEntry: React.FC = (props) => {
    const [phone, setPhone] = useState<string>('');
    const [phoneIsValid, setPhoneValid] = useState<boolean>(false);
    const [otp, setOtp] = useState<string>('');
    const tokenSent = useSelector((state: RootState): boolean => state.otp.tokenSent);
    const errormsg = useSelector((state: RootState): string => state.otp.errorMessage);
    const otpIsLoading = useSelector((state: RootState): boolean => state.otp.isLoading);
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const submittedPhone = useSelector((state: RootState): string => state.otp.phone);

    const ayt = new AsYouType('US');
    const toast = useToast();

    useEffect(() => {
        if (errormsg != '')
            //TODO: figure out how to type this
            toast?.show(errormsg);
        dispatch(clearErrorMessage());
    }, [errormsg]);

    // validate phone number
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

    console.log('otp is loading? ', otpIsLoading);
    return (
        <SafeAreaView style={tailwind('px-10')}>
            {tokenSent || otpIsLoading ? (
                <SafeAreaView>
                    <Text style={tailwind('text-black text-xl font-semibold')}>
                        Verify your Passcode
                    </Text>
                    <Text style={tailwind('text-gray-400 text-sm font-semibold pb-2')}>
                        Enter the passcode we sent to your phone below:
                    </Text>
                    <TextInput
                        style={[
                            tailwind('items-center py-2 px-2 rounded-md border-4'),
                            tokenSent ? tailwind('border-green-500') : null,
                        ]}
                        value={otp}
                        onChangeText={setOtp}
                        placeholder={'555555'}
                        keyboardType="numeric"
                        autoFocus={true}
                    ></TextInput>
                    <Pressable
                        style={tailwind('items-center rounded-md py-2 w-full mt-6 bg-green-500')}
                        onPress={() => {
                            queryClient.refetchQueries('loggedIn');
                            dispatch(loginWithOtp({ phone: submittedPhone, otp }));
                        }}
                    >
                        <Text style={tailwind('text-white font-semibold')}>Verify</Text>
                    </Pressable>
                    <Pressable
                        style={tailwind('items-center rounded-md py-2 w-full mt-6 bg-gray-800')}
                        onPress={() => {
                            toast?.show(`Sending code to ${phone}`)
                            dispatch(requestOtp(phone))
                        }}
                    >
                        <Text style={tailwind('text-white font-semibold')}>Re-Send Passcode</Text>
                    </Pressable>
                    <Pressable
                        style={tailwind('rounded-md mt-5')}
                        onPress={() => dispatch(reset())}
                    >
                        <Text style={tailwind('text-gray-400 text-sm font-semibold p-2')}>
                            Entered the wrong number? Tap here to restart.
                        </Text>
                    </Pressable>
                </SafeAreaView>
            ) : (
                <SafeAreaView>
                    <Text style={tailwind('text-black text-xl font-semibold')}>
                        Get your One-Time Passcode
                    </Text>
                    <Text style={tailwind('text-gray-400 text-sm font-semibold pb-2')}>
                        Enter your phone number below:
                    </Text>
                    <TextInput
                        style={[
                            tailwind('items-center py-2 px-2 rounded-md border-4'),
                            tokenSent ? tailwind('border-green-500') : null,
                        ]}
                        key={'phoneInput'}
                        value={phone}
                        onChangeText={setFormattedPhone}
                        placeholder={'(555) 555-5555'}
                        keyboardType={'phone-pad'}
                        autoCompleteType={'tel'}
                        autoFocus={true}
                    ></TextInput>
                    <Pressable
                        style={[
                            tailwind('items-center rounded-md py-2 w-full mt-6'),
                            phoneIsValid ? tailwind('bg-green-500') : tailwind('bg-gray-600'),
                        ]}
                        disabled={!phoneIsValid}
                        onPress={() =>  {
                            toast?.show(`Sending code to ${phone}`)
                            dispatch(requestOtp(phone))}
                        }
                    >
                        <Text style={tailwind('text-white font-semibold')}>Request Code</Text>
                    </Pressable>
                </SafeAreaView>
            )}
        </SafeAreaView>
    );
};

export default PhoneEntry;
