import React, { useState, useEffect } from "react";
import { TextInput, Text, Pressable } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { tailwind } from "tailwind";
import { AsYouType } from 'libphonenumber-js'
import { RootState } from "../../store/index"
import { requestOtp, loginWithOtp, reset } from "./otpSlice"

const PhoneEntry: React.FC = (props) => {
    const [phone, setPhone] = useState<string>("")
    const [otp, setOtp] = useState<string>("")
    const tokenSent = useSelector((state: RootState): boolean => state.otp.tokenSent)
    const dispatch = useDispatch()
    const ayt = new AsYouType('US')

    const setFormattedPhone = (phone: string) => {
        // formats phone number to US-centric (xxx) xxx-xxxx
        console.log("setting phone:", phone)
        // only do for over length 4 -- otherwise, when you try to delete (XXX, it formats
        // incorrectly.
        if (phone.length > 4) {
            setPhone(ayt.input(phone))
        } else {
            setPhone(phone)
        }
    }

    const TokenInput = () => (
        <SafeAreaView>
            <Text style={tailwind("text-black text-xl font-semibold")}>
                Verify your Passcode
            </Text>
            <Text style={tailwind("text-gray-400 text-sm font-semibold pb-2")}>
                Enter the passcode we sent to your phone below:
            </Text>
            <TextInput style={[tailwind("items-center py-2 px-2 rounded-md border-4"),
            tokenSent ? tailwind("border-green-500") : null
            ]}
                value={otp}
                onChangeText={setOtp}
                placeholder={"55555"}
                keyboardType="numeric"
                autoFocus={true}>
            </TextInput>
            <Pressable style={tailwind("items-center rounded-md py-2 w-full mt-6 bg-green-500")}
                onPress={() => dispatch(loginWithOtp({ phone, otp }))}>
                <Text style={tailwind("text-white font-semibold")}>
                    Verify
                </Text>
            </Pressable>
            <Pressable style={tailwind("items-center rounded-md py-2 w-full mt-6 bg-gray-800")}
                onPress={() => dispatch(requestOtp(phone))}>
                <Text style={tailwind("text-white font-semibold")}>
                    Re-Send Passcode
                </Text>
            </Pressable>
            <Pressable style={tailwind("rounded-md mt-5")}
                onPress={() => dispatch(reset())}>
                <Text style={tailwind("text-gray-400 text-sm font-semibold p-2")}>
                    Entered the wrong number? Tap here to restart.
                </Text>
            </Pressable>
        </SafeAreaView>
    )

    const PhoneInput = () => (
        <SafeAreaView>
            <Text style={tailwind("text-black text-xl font-semibold")}>
                Get your One-Time Passcode
            </Text>
            <Text style={tailwind("text-gray-400 text-sm font-semibold pb-2")}>
                Enter your phone number below:
            </Text>
            <TextInput style={[tailwind("items-center py-2 px-2 rounded-md border-4"),
            tokenSent ? tailwind("border-green-500") : null
            ]}
                value={phone}
                onChangeText={setFormattedPhone}
                placeholder={"(555) 555-5555"}
                keyboardType="phone-pad"
                autoCompleteType="tel"
                autoFocus={true}>
            </TextInput>
            <Pressable style={[tailwind("items-center rounded-md py-2 w-full mt-6 bg-green-500")]}
                onPress={() => dispatch(requestOtp(phone))}>
                <Text style={tailwind("text-white font-semibold")}>
                    Request Code
                </Text>
            </Pressable>
        </SafeAreaView>
    )

    return (<SafeAreaView style={tailwind("px-20")}>
        {tokenSent ? <TokenInput /> : <PhoneInput />}

    </SafeAreaView>)
}

export default PhoneEntry