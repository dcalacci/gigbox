import * as React from 'react';
import { ScrollView, Pressable, SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    getUserInfo,
    updateDataSharing,
    updateInterview,
    unenrollAndDeleteMutation,
} from '../features/consent/api';
import tailwind from 'tailwind-rn';
import AnimatedEllipsis from '../components/Ellipsis';
import BinarySurveyQuestion from '../features/consent/BinarySurveyQuestion';
import { reset } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { User } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ route }) {
    const dispatch = useDispatch();
    const userStatus = useQuery('userInfoSettings', getUserInfo, {
        onSuccess: (d) => {
            console.log('user info in settings:', d.consent);
        },
        select: (d): User => d.getUserInfo,
    });
    const queryClient = useQueryClient();
    const updateDataSharingM = useMutation(updateDataSharing, {
        onSuccess: () => queryClient.invalidateQueries('userInfoSettings'),
    });
    const updateInterviewM = useMutation(updateInterview, {
        onSuccess: () => queryClient.invalidateQueries('userInfoSettings'),
    });
    const unenrollAndDelete = useMutation(unenrollAndDeleteMutation, {
        onSuccess: (data) => {
            console.log('data:', data);
            if (data.unenrollAndDelete.ok) {
                queryClient.invalidateQueries('userInfo'),
                dispatch(reset());
            }
        },
    });
    const LoadingScreen = () => {
        return (
            <View style={tailwind('flex flex-col content-around content-center')}>
                <AnimatedEllipsis />
            </View>
        );
    };
    /* let filter: JobFilter | undefined; */
    return userStatus.isLoading || userStatus.isError ? (
        <LoadingScreen />
    ) : (
        <SafeAreaView style={tailwind('bg-gray-100 justify-start flex-col')}>
            <ScrollView>
                {/* <Text style={styles.title}>Jobs</Text> */}
                <View style={tailwind('flex-row p-5 content-start')}>
                    <Text style={tailwind('text-3xl font-bold ')}>Settings</Text>
                </View>

                <View style={tailwind('flex-row p-5 content-start')}>
                    <Text style={tailwind('text-2xl font-bold underline')}>
                        Consent, Data, and Enrollment
                    </Text>
                </View>
                <BinarySurveyQuestion
                    onPress={(press) => {
                        console.log('Pressed interview in settings');
                        updateInterviewM.mutate({ interview: press });
                    }}
                    value={userStatus.data.consent.interview}
                    yesButtonText={'I consent'}
                    noButtonText={'I do not consent'}
                    declineText={'You will not be contacted for an interview.'}
                    questionText={
                        userStatus.data.consent.interview
                            ? "You've consented to being contacted for an interview."
                            : "You didn't consent to being contacted for an interview. Change your mind? Just flip the switch."
                    }
                ></BinarySurveyQuestion>
                <BinarySurveyQuestion
                    onPress={(press) => {
                        console.log('Pressed data sharing in settings');
                        updateDataSharingM.mutate({ dataSharing: press });
                    }}
                    value={userStatus.data.consent.dataSharing}
                    yesButtonText={'I consent'}
                    noButtonText={'I do not consent'}
                    declineText={'Your data will not be shared with other researchers.'}
                    questionText={
                        userStatus.data.consent.dataSharing
                            ? 'You consented to sharing your data with other researchers.'
                            : "You didn't consent to sharing data with other researchers. You can change your mind at any time"
                    }
                ></BinarySurveyQuestion>
                <View style={tailwind('rounded-lg bg-white p-2 m-2')}>
                    <Text style={tailwind('text-xl pt-2 pb-2 text-left font-bold')}>
                        Want to un-enroll from the study?
                    </Text>

                    <Text style={tailwind('text-lg pt-2 pb-2 underline text-center')}>
                        Are you sure? this will un-enroll you from the study, and deletion cannot be
                        undone -- you'll need to start over if you want to join again.
                    </Text>
                    <Text style={tailwind('text-lg pt-2 pb-2 underline text-center')}>
                        Your gigbox account will be reset and you can re-join at any time.
                    </Text>
                    <Pressable
                        onPress={() => {
                            console.log('deleting account');
                            unenrollAndDelete.mutate();
                        }}
                        style={[tailwind('rounded-lg flex-grow m-2 p-2 border-2 border-red-400')]}
                    >
                        <Text
                            style={[
                                tailwind('text-lg text-white font-bold text-center text-red-400'),
                            ]}
                        >
                            <Ionicons size={24} name={'close-circle-outline'} />
                            Un-Enroll & Delete Data
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
