import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Animated } from 'react-native';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import moment from 'moment';
import { Employers, Job } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import { log } from '../../utils';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { useNavigation } from '@react-navigation/core';

import { updateJobEmployer, updateJobValue } from './api';
import { useMutation } from 'react-query';
import EmployerModalPicker from './EmployerModalPicker';
import JobDetail from './JobDetail';
import ScreenshotUploader from './ScreenshotPicker';
import { Screenshots } from './JobDetailScreen';

export const JobItem = ({
    job,
    displayDetails,
    setEmployer,
    setTotalPay,
    setTip,
    submitChanges = true,
    showMap = true,
    showScreenshots = false,
}: {
    job: Job;
    displayDetails: boolean; // whether to display job details
    submitChanges?: boolean; // whether to submit changes to server
    setEmployer?: (e: Employers) => void; // callback to set employer
    setTotalPay?: (p: string) => void; // callback to set total pay
    setTip?: (t: string) => void; // callback to set tip
    showMap?: boolean; // whether to show map
    showScreenshots?: boolean;
}) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState<LatLng[]>();
    const [modalVisible, setModalVisible] = useState(false);

    const navigation = useNavigation();
    useEffect(() => {
        if (job.snappedGeometry) {
            const { geometries, bounding_box } = JSON.parse(job.snappedGeometry);
            const locations = geometries.map((c: [number, number]) => {
                return { latitude: c[1], longitude: c[0] };
            });
            setLocations(locations);
            const bbox = bounding_box;
            setRegion({
                latitudeDelta: (bbox.maxLat - bbox.minLat) * 2.05,
                longitudeDelta: (bbox.maxLng - bbox.minLng) * 2.05,
                latitude: bbox.maxLat - (bbox.maxLat - bbox.minLat) / 2,
                longitude: bbox.maxLng - (bbox.maxLng - bbox.minLng) / 2,
            });
        }
    }, [job.snappedGeometry]);

    const submitJobValue = useMutation(['job'], updateJobValue, {
        onSuccess: (d) => {
            log.info('Successfully updated job value:', d);
        },
    });

    const updateJobPay = (totalPay: string) => {
        if (submitChanges) {
            return submitJobValue.mutate({
                jobId: job.id,
                mutationKey: 'setJobTotalPay',
                key: 'totalPay',
                value: totalPay,
            });
        }
        if (setTotalPay) setTotalPay(totalPay);
    };
    const updateJobTip = (tip: string) => {
        if (submitChanges) {
            return submitJobValue.mutate({
                jobId: job.id,
                mutationKey: 'setJobTip',
                key: 'tip',
                value: tip,
            });
        }
        if (setTip) setTip(tip);
    };

    // it's expensive to render, so we use useCallback
    const Map = useCallback(
        () => (
            <TripMap interactive={false} isActive={false} tripLocations={locations} region={region}>
                {job.endLocation ? (
                    <Marker
                        pinColor={'red'}
                        coordinate={{
                            longitude: parse(job.endLocation)?.coordinates[0] as number,
                            latitude: parse(job.endLocation)?.coordinates[1] as number,
                        }}
                    ></Marker>
                ) : null}

                {job.endLocation ? (
                    <Marker
                        pinColor={'green'}
                        coordinate={{
                            longitude: parse(job.startLocation)?.coordinates[0] as number,
                            latitude: parse(job.startLocation)?.coordinates[1] as number,
                        }}
                    ></Marker>
                ) : null}
            </TripMap>
        ),
        [job, locations]
    );

    const RowHeader = () => (
        <View style={tailwind('flex-row p-1 pl-2 pr-2 justify-between')}>
            <View style={tailwind('flex-col')}>
                <Text style={tailwind('font-bold')}>
                    {moment.utc(job.startTime).local().format('LL')}{' '}
                </Text>

                <Text style={tailwind('font-bold')}>
                    {moment.utc(job.startTime).local().format('LT')} -{' '}
                    {moment.utc(job.endTime).local().format('LT')}{' '}
                </Text>
            </View>
            <Text style={tailwind('text-lg font-bold')}>{job.mileage.toFixed(2)} mi</Text>
        </View>
    );

    return (
        <Pressable
            style={[
                tailwind('flex-col w-full mt-2 mb-2 bg-white rounded-lg'),
                { overflow: 'hidden' },
            ]}
            onPress={() => {
                log.info('Navigating to job detail', job);
                navigation.navigate('Trip Detail', { job: job });
            }}
        >
            <View
                style={[
                    tailwind('flex-col w-full m-0'),
                    displayDetails ? tailwind('max-h-48') : tailwind('max-h-24'),
                ]}
            >
                <ScreenshotUploader
                    shiftId={job.shiftId}
                    jobId={job.id}
                    modalVisible={modalVisible}
                    setModalVisible={setModalVisible}
                />
                <View style={tailwind('flex-row flex-none')}>
                    {showMap ? (
                        <View style={[tailwind('h-full w-1/3')]}>
                            {locations && region ? <Map /> : <Text>No locations...</Text>}
                        </View>
                    ) : null}
                    <View
                        style={[
                            tailwind('flex-col justify-start'),
                            showMap ? tailwind('w-2/3') : tailwind('w-full'),
                        ]}
                    >
                        <RowHeader />
                        {displayDetails ? (
                            <>
                                <View style={[tailwind('flex-row flex-wrap'), showMap ? null : tailwind("justify-evenly")]}>
                                    <JobDetail
                                        label={'Pay'}
                                        value={job.totalPay}
                                        prefix={'$ '}
                                        suffix={''}
                                        placeholder={''}
                                        onChangeValue={updateJobPay}
                                    ></JobDetail>
                                    <JobDetail
                                        label={'Tip'}
                                        value={job.tip}
                                        prefix={'$ '}
                                        suffix={''}
                                        placeholder={''}
                                        onChangeValue={updateJobTip}
                                    ></JobDetail>
                                    <EmployerModalPicker
                                        job={job}
                                        submitChange={submitChanges}
                                        onEmployerChange={(e: Employers) => {
                                            if (setEmployer) setEmployer(e);
                                        }}
                                    />
                                    {showScreenshots ? (
                                        <Screenshots
                                            screenshots={job.screenshots}
                                            onPressAddScreenshots={() => setModalVisible(true)}
                                        />
                                    ) : null}
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </View>
        </Pressable>
    );
};
const styles = StyleSheet.create({
    mapTitle: {
        position: 'absolute',
        top: 2,
        left: 10,
        zIndex: 101,
    },
});
