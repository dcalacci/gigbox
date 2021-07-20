import { ConsentFlow } from '../features/consent/ConsentFlow';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, ScrollView, TextInput, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tailwind } from 'tailwind';
import PhoneEntry from '../features/auth/PhoneEntry';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
    const [onboarded, setOnboarded] = useState(false);
    console.log('onboarded?', onboarded);
    return (
        <View style={tailwind('bg-gray-100 h-full')}>
            <StatusBar style="dark" />
            <SafeAreaView style={tailwind('pt-10 bg-gray-100')}>
                {onboarded ? <PhoneEntry /> : <ConsentFlow />}
            </SafeAreaView>
        </View>
    );
}
