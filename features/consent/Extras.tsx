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
import * as Haptics from 'expo-haptics';
import BinarySurveyQuestion from './BinarySurveyQuestion';

export const Extras = ({}) => {
    const [locationConsent, setLocationConsent] = useState<boolean>();
    const [photoConsent, setPhotoConsent] = useState<boolean>();

    return (
        <ScrollView style={tailwind('bg-gray-100')}>
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
                    onPress={(yes: boolean) => console.log('pressss')}
                />
                <BinarySurveyQuestion
                    questionText={
                        'Do you consent to being contacted for further user interviews? If you do, we’ll ask for your contact information so we can schedule an interview. Your contact info will not be associated with the data you share through the app.'
                    }
                    onPress={(yes: boolean) => console.log('interviews')}
                />
            </View>
            <Pressable
                style={tailwind('rounded-lg bg-green-500 p-5 m-2')}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
            >
                <Text style={tailwind('font-bold text-white text-xl text-center')}>Continue</Text>
            </Pressable>
        </ScrollView>
    );
};
