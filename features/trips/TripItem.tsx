import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, TextInput, StyleSheet } from 'react-native';
import { tailwind } from 'tailwind';
import { Ionicons } from '@expo/vector-icons';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation } from 'react-query';
import moment from 'moment';
import { Employers, Job, Screenshot, Shift } from '../../types';
import { parse } from 'wellknown';
import TripMap from '../shiftList/TripMap';
import { TripDetailScreen } from './TripDetailScreen';
import { log } from '../../utils';
import { updateJobValue, deleteImage, updateJobEmployer } from '../job/api';
import { EmployerBox } from '../clock/EmployerSelector';
import Modal from 'react-native-modal';

import Toast from 'react-native-root-toast';
import { useNavigation } from '@react-navigation/core';

import ModalPicker from '../../components/ModalPicker';
import { setShiftEmployers } from '../clock/api';

export const TripItem = ({
    job,
    displayDetails,
    setEmployer,
    setTotalPay,
    setTip,
}: {
    job: Job;
    displayDetails: boolean;
    setEmployer?: (e: Employers) => void;
    setTotalPay?: (s: string) => void;
    setTip?: (s: string) => void;
}) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState<LatLng[]>();

    const navigation = useNavigation();
    useEffect(() => {
        console.log('Updating map, geometry changed');
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
        onChangeValue,
    }: {
        label: string;
        value: number | string | undefined;
        prefix: string;
        suffix: string;
        placeholder: string;
        onChangeValue: ((v: string) => void) | undefined;
    }) => {
        const [displayValue, setDisplayValue] = useState<string>();
        const [isFocused, setFocused] = useState<boolean>();
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
                if (onChangeValue) onChangeValue(val);
            }
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
                        onEndEditing={onSubmit}
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

    const EmployerModalPicker = ({
        job,
        onEmployerChange,
    }: {
        job: Job;
        onEmployerChange: (e: Employers) => void;
    }) => {
        const [selectedEmployer, setSelectedEmployer] = useState<String | undefined>(job.employer);
        const [open, setOpen] = useState<boolean>(false);

        return (
            <View style={tailwind('m-1 pl-2 pr-2')}>
                <Text style={tailwind('text-xs text-black p-0 m-0')}>Service</Text>
                <Pressable
                    style={tailwind('flex flex-col rounded-lg w-40 flex-col bg-gray-100 p-2')}
                    onPress={() => setOpen(true)}
                >
                    <ModalPicker
                        options={Object.keys(Employers)}
                        onSelectOption={(option) => {
                            setSelectedEmployer(option);
                            setOpen(false);
                            if (option === 'Select Service') {
                                return;
                            } else {
                                const enumEmployer: Employers = option;
                                onEmployerChange(enumEmployer);
                            }
                        }}
                        onClose={() => setOpen(false)}
                        isOpen={open}
                        defaultText={'Select Service'}
                    />
                    <View style={tailwind('flex-row items-center')}>
                        <Text style={tailwind('p-1 text-black')}>{selectedEmployer}</Text>
                    </View>
                </Pressable>
            </View>
        );
    };

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
                    displayDetails ? tailwind('h-44') : tailwind('h-24'),
                ]}
            >
                <View style={tailwind('flex-row flex-none')}>
                    <View style={[tailwind('h-full w-1/3')]}>
                        {locations && region ? <Map /> : <Text>No locations...</Text>}
                    </View>
                    <View style={tailwind('flex-col w-2/3')}>
                        <RowHeader />
                        {displayDetails ? (
                            <>
                                <View style={[tailwind('flex flex-row pl-2 pr-2')]}>
                                    <JobDetail
                                        label={'Total Pay'}
                                        value={job.totalPay}
                                        prefix={'$ '}
                                        suffix={''}
                                        placeholder={''}
                                        onChangeValue={setTotalPay}
                                    ></JobDetail>
                                    <JobDetail
                                        label={'Tip'}
                                        value={job.tip}
                                        prefix={'$ '}
                                        suffix={''}
                                        placeholder={''}
                                        onChangeValue={setTip}
                                    ></JobDetail>
                                </View>
                                <EmployerModalPicker
                                    job={job}
                                    onEmployerChange={(e: Employers) => {
                                        setEmployer(e);
                                    }}
                                />
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
