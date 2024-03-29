import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, Pressable, Platform } from 'react-native';
import { tailwind } from 'tailwind';
import { Ionicons } from '@expo/vector-icons';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation, QueryClient, useQuery } from 'react-query';
import moment from 'moment';
import { Employers, Job, Screenshot } from '../../types';
import { parse } from 'wellknown';
import TripMap from './TripMap';
import ScreenshotUploader from './ScreenshotPicker';
import { log } from '../../utils';
import { deleteImage } from './api';

import Toast from 'react-native-root-toast';
import { JobItem } from './JobItem';
import JobDetail from './JobDetail';
import Modal from 'react-native-modal';
import EmployerModalPicker from '../../components/EmployerModalPicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { createJob } from '../history/api';
import { timeUntilStale } from 'react-query/types/core/utils';
import DateTimeModalPicker from '../../components/DateTimeModalPicker';

export const JobAddScreen = () => {
    const [employer, setEmployer] = useState('');
    const [pay, setPay] = useState(0.0);
    const [tip, setTip] = useState(0.0);
    const [miles, setMiles] = useState(0.0);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const makeJob = useMutation(createJob, {
        onSuccess: (res) => {
            console.log('mutation response:', res);
            queryClient.invalidateQueries('filteredJobs');
            navigation.navigate('Tracked Jobs');
            Toast.show('Job Saved!');
        },
        onError: (res) => {
            Toast.show('Ran into an issue. Try again?');
        },
    });
    return (
        <View style={tailwind('flex-col p-2 flex-grow bg-gray-100 items-center')}>
            <View style={[tailwind('flex-row w-full mt-20 content-start')]}>
                <Text style={tailwind('text-4xl font-bold ')}>Add Job</Text>
            </View>
            <View style={tailwind('flex-col w-full bg-white rounded-lg m-2 p-5')}>
                <View style={[tailwind('flex-row flex-wrap w-full items-center justify-evenly')]}>
                    <JobDetail
                        label={'Pay'}
                        value={pay}
                        prefix={'$ '}
                        suffix={''}
                        placeholder={'Job Pay'}
                        onChangeValue={setPay}
                    ></JobDetail>
                    <JobDetail
                        label={'Tip'}
                        value={tip}
                        prefix={'$ '}
                        suffix={''}
                        placeholder={'Enter Tip'}
                        onChangeValue={setTip}
                    ></JobDetail>
                    <JobDetail
                        label={'Mileage'}
                        value={miles}
                        prefix={''}
                        suffix={' mi'}
                        placeholder={'Enter Miles'}
                        onChangeValue={setMiles}
                    ></JobDetail>
                    <EmployerModalPicker
                        job={undefined}
                        submitChange={false}
                        onEmployerChange={(e: Employers) => {
                            if (setEmployer) setEmployer(e);
                        }}
                    />
                </View>
                <View style={tailwind('flex-row items-center justify-evenly')}>
                    <Text style={tailwind('text-lg font-bold')}>Started:</Text>
                    <DateTimeModalPicker defaultDate={startDate} onSetDate={setStartDate} />
                </View>
                <View style={tailwind('flex-row items-center justify-evenly ')}>
                    <Text style={tailwind('text-lg font-bold')}>Ended:</Text>
                    <DateTimeModalPicker defaultDate={startDate} onSetDate={setEndDate} />
                </View>
                <Pressable
                    onPress={() => {
                        if (employer && startDate <= endDate) {
                            makeJob.mutate({
                                employer: employer as Employers,
                                totalPay: pay,
                                tip: tip,
                                startTime: startDate,
                                endTime: endDate,
                                mileage: miles,
                            });
                        } else {
                            if (!employer) {
                                Toast.show('You need to select a service');
                            } else if (endDate < startDate) {
                                Toast.show(
                                    'The start time of this job is greater than its end time'
                                );
                            } else {
                                console.log(employer);
                                Toast.show('Try filling in all the fields you can and try again');
                            }
                        }
                    }}
                    style={tailwind('bg-black p-2 m-2 rounded-lg justify-center items-center')}
                >
                    <Text style={tailwind('text-white text-lg font-bold')}>Save Job</Text>
                </Pressable>
                <Pressable
                    onPress={() => navigation.navigate('Tracked Jobs')}
                    style={tailwind('border p-2 m-2 rounded-lg justify-center items-center')}
                >
                    <Text style={tailwind('text-black text-lg font-bold')}>Back</Text>
                </Pressable>
            </View>
        </View>
    );
};
