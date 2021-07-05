import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    Pressable,
    TextInput,
    StyleSheet,
    Modal,
} from 'react-native';
import { tailwind } from 'tailwind';
import { Ionicons } from '@expo/vector-icons';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import { log } from '../../utils';
import { updateJobValue, deleteImage } from '../job/api';
import { EmployerBox } from '../clock/EmployerSelector';

import Toast from 'react-native-root-toast';

export const TripItem = ({ job }: { job: Job }) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState<LatLng>();

    const [modalVisible, setModalVisible] = useState(false);
    useEffect(() => {
        console.log("Updating map, geometry changed")
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

    const JobDetail = ({
        label,
        value,
        prefix,
        suffix,
        placeholder,
        mutationKey,
        dataKey,
    }: {
        label: string;
        value: number | string;
        prefix: string;
        suffix: string;
        placeholder: string;
        mutationKey: string;
        dataKey: string;
    }) => {
        const [displayValue, setDisplayValue] = useState<string>();
        const [isFocused, setFocused] = useState<boolean>();
        const queryClient = useQueryClient();

        const setJobValue = useMutation(updateJobValue, {
            onSuccess: (data, variables) => {
                log.info('updating job value:', data, variables);
                queryClient.invalidateQueries('filteredJobs');
                queryClient.invalidateQueries('shifts');
                queryClient.invalidateQueries('trackedJobs');
                queryClient.invalidateQueries('weeklySummary');
            },
        });

        // set value from our input, and submit mutation
        useEffect(() => {
            if (value) {
                setDisplayValue(
                    typeof value === 'number' ? value.toFixed(2) : parseFloat(value).toFixed(2)
                );
            }
        }, [value]);

        const setFormattedValue = (input: string) => {
            console.log('Setting formatted val:', input);
            setDisplayValue(input);
        };

        const onSubmit = () => {
            if (displayValue) {
                const val = parseFloat(displayValue).toFixed(2);
                console.log('Submitted. data:', val);
                setJobValue.mutate({
                    jobId: job.id,
                    mutationKey: mutationKey,
                    key: dataKey,
                    value: val,
                });
                //TODO: Submit to server on mutation
                //TODO: decimal formatting (for convenience)
            }
        };

        const onFocus = () => {
            console.log('Focused text input!');
        };

        const onBlur = () => {
            console.log('Blurred text input!');
        };

        return (
            <View style={[tailwind('flex flex-col m-1')]}>
                <Text style={tailwind('text-xs text-black p-0 m-0')}>{label}</Text>
                <View
                    style={[
                        tailwind('rounded-lg flex-row w-24 items-center'),
                        isFocused ? tailwind('border-2') : null,
                        tailwind('bg-gray-100'),
                    ]}
                >
                    <Text style={[tailwind('ml-2 text-lg flex-auto'), tailwind('text-black')]}>
                        {prefix}
                    </Text>
                    <TextInput
                        style={[
                            tailwind('text-lg mb-2 text-black w-full flex-auto'),
                            displayValue == undefined
                                ? tailwind('border-b-2')
                                : tailwind('font-bold underline'),
                        ]}
                        key={`${value}`}
                        onChangeText={setFormattedValue}
                        maxLength={5}
                        keyboardType={'decimal-pad'}
                        onSubmitEditing={onSubmit}
                        returnKeyType={'done'}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                    >
                        {displayValue}
                    </TextInput>
                    <Text
                        style={[
                            tailwind('flex-grow font-bold pt-2 mr-4'),
                            displayValue == undefined
                                ? tailwind('text-black')
                                : tailwind('font-bold'),
                        ]}
                    >
                        {suffix}
                    </Text>
                </View>
            </View>
        );
    };

    const Map = () => (
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
    );

    const RowHeader = () => (
        <View style={tailwind('flex-row p-2 justify-between')}>
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
        <View
            style={[
                tailwind('flex-col w-full mt-2 mb-2 bg-white rounded-lg'),
                {overflow: 'hidden'}
            ]}
        >
            <View style={tailwind('flex-col w-full m-0 h-36')}>
                <View style={tailwind('flex-row flex-none')}>
                    <View style={[tailwind('h-full w-1/3')]}>
                        <View style={styles.mapTitle}></View>

                        {locations && region ? (
                            <Map />
                        ) : (
                            <Text>No locations recorded for this job</Text>
                        )}
                    </View>
                    <View style={tailwind('flex-col w-2/3')}>
                        <RowHeader />
                        <View style={[tailwind('flex flex-row flex-wrap pl-2 pr-2')]}>
                            <JobDetail
                                label={'Total Pay'}
                                value={job.totalPay}
                                prefix={'$ '}
                                suffix={''}
                                placeholder={''}
                                mutationKey={'setJobTotalPay'}
                                dataKey={'totalPay'}
                            ></JobDetail>
                            <JobDetail
                                label={'Tip'}
                                value={job.tip}
                                prefix={'$ '}
                                suffix={''}
                                placeholder={''}
                                mutationKey={'setJobTip'}
                                dataKey={'tip'}
                            ></JobDetail>
                        </View>
                    </View>
                </View>
            </View>
        </View>
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
