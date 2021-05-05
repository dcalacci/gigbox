import React, { useState, FunctionComponent, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet,
    Pressable,
    Modal,
    Alert,
    TextInput,
} from 'react-native';
import { tailwind } from 'tailwind';
import { Region, Marker, LatLng } from 'react-native-maps';
import { useQueryClient, useMutation } from 'react-query';
import moment from 'moment';
import { Job, Screenshot, Shift } from '../../types';
import TripMap from '../shiftList/TripMap';
import { parse } from 'wellknown';
import ScreenshotUploader from './ScreenshotPicker';
import { updateJobTip, updateJobTotalPay, updateJobValue } from './api';

//TODO: show start and end of trip in map

// Scroll view of screenshots
const Screenshots = ({
    screenshots,
    onPressAddScreenshots,
}: {
    screenshots: [Screenshot] | undefined;
    onPressAddScreenshots: () => void;
}) => {
    if (screenshots == undefined) {
        return (
            <View style={tailwind('flex-col justify-center bg-gray-100 w-1/2 rounded-lg m-2 p-2')}>
                <Pressable
                    onPress={onPressAddScreenshots}
                    style={tailwind('self-center justify-self-center bg-gray-800 rounded-lg p-2')}
                >
                    <Text style={tailwind('text-white font-bold underline')}>Add Screenshots</Text>
                </Pressable>
                <Text style={tailwind('text-sm text-center p-1')}>
                    Upload a screenshot of this job to automatically record your pay.
                </Text>
            </View>
        );
    } else {
        const ScreenshotItems = screenshots.map((s, idx) => (
            <View style={tailwind('flex-row p-0 flex-auto')} key={s.id}>
                <View style={tailwind('flex-col p-1')}>
                    <Image
                        style={[tailwind('flex-auto m-0')]}
                        source={{ uri: s.onDeviceUri }}
                        resizeMethod={'scale'}
                        resizeMode={'contain'}
                    />
                    <Text style={[{ alignSelf: 'flex-start' }, tailwind('font-bold')]}>
                        {moment.utc(s.timestamp).local().format('h:mm a')}
                    </Text>
                </View>

                {idx < screenshots.length - 1 ? (
                    <View style={[tailwind('border-b-2 border-green-500 w-12 self-center')]} />
                ) : null}
            </View>
        ));
        return (
            <ScrollView
                horizontal={true}
                style={tailwind('m-2 rounded-lg bg-gray-100 w-1/3 p-2')}
                contentContainerStyle={tailwind('justify-center')}
            >
                {ScreenshotItems}
            </ScrollView>
        );
    }
};

// A single job, including its map, details, and screenshot uploader
const JobItem = ({
    job,
    screenshots,
    shift,
}: {
    job: Job;
    screenshots: [Screenshot] | undefined;
    shift: Shift;
}) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState<LatLng>();

    const [modalVisible, setModalVisible] = useState(false);
    useEffect(() => {
        console.log('job snapped geometry:', job.snappedGeometry);
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

    console.log('Rendering job item:', job);

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
                console.log('updating job value:', data, variables);
                queryClient.invalidateQueries('shifts');
                queryClient.invalidateQueries('weeklySummary');
            },
        });

        // set value from our input, and submit mutation
        useEffect(() => {
            console.log(`${label} value: ${value}`);
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
            <View style={[tailwind('flex flex-col pt-1')]}>
                <Text style={tailwind('text-xs text-black p-0 m-0')}>{label}</Text>
                <View
                    style={[
                        tailwind('rounded-lg h-12 flex-row w-36 items-center'),
                        isFocused ? tailwind('border-2') : null,
                        displayValue == undefined
                            ? tailwind('bg-gray-100')
                            : tailwind('bg-green-500 bg-opacity-50'),
                    ]}
                >
                    <Text style={tailwind('ml-2 text-xl text-black flex-auto')}>{prefix}</Text>
                    <TextInput
                        style={[
                            tailwind('text-xl mb-2 text-black w-full flex-auto'),
                            displayValue == undefined
                                ? null
                                : tailwind('text-black font-bold underline'),
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
                    <Text style={tailwind('text-xl text-black flex-grow font-bold mr-4')}>
                        {suffix}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View
            style={[
                tailwind('flex-col w-full rounded-lg bg-white mb-2 mt-5 pt-0'),
                { overflow: 'hidden' },
            ]}
        >
            <ScreenshotUploader
                shiftId={shift.id}
                jobId={job.id}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />

            <View style={[tailwind('h-36 w-full'), { overflow: 'hidden' }]}>
                {locations && region ? (
                    <TripMap
                        interactive={false}
                        isActive={false}
                        tripLocations={locations}
                        region={region}
                    >
                        <Marker
                            pinColor={'red'}
                            coordinate={{
                                longitude: parse(job.endLocation)?.coordinates[0] as number,
                                latitude: parse(job.endLocation)?.coordinates[1] as number,
                            }}
                        ></Marker>

                        <Marker
                            pinColor={'green'}
                            coordinate={{
                                longitude: parse(job.startLocation)?.coordinates[0] as number,
                                latitude: parse(job.startLocation)?.coordinates[1] as number,
                            }}
                        ></Marker>
                    </TripMap>
                ) : (
                    <Text>No locations recorded for this job</Text>
                )}
            </View>
            <View style={tailwind('flex-row p-5')}>
                <Screenshots
                    screenshots={screenshots}
                    onPressAddScreenshots={() => setModalVisible(true)}
                />
                <View
                    style={tailwind('flex flex-col flex-grow p-2 content-between justify-between')}
                >
                    <JobDetail
                        label={'Mileage'}
                        value={job.mileage}
                        prefix={''}
                        suffix={' mi'}
                        placeholder={''}
                        mutationKey={'setJobMileage'}
                        dataKey={'mileage'}
                    />
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
    );
};
//List of job components
//TODO: remove shift screenshot bits here
const JobList = ({
    jobs,
    screenshots,
    shift,
}: {
    jobs: [{ node: Job }] | undefined;
    screenshots: [Screenshot] | undefined;
    shift: Shift;
}) => {
    return (
        <ScrollView style={[tailwind('flex-col w-full pl-2 pr-2')]}>
            {jobs?.map((j) => (
                <JobItem job={j.node} screenshots={screenshots} shift={shift} key={j.node.id} />
            ))}
        </ScrollView>
    );
};

const Trips = ({ shift }: { shift: Shift }) => {
    const [screenshots, setScreenshots] = useState<[Screenshot]>();
    const [jobs, setJobs] = useState<[{ node: Job }]>();
    useEffect(() => {
        // setScreenshots(shift.screenshots);
        setJobs(shift.jobs.edges);
    }, [shift]);

    const deleteShift = () => {
        console.log('deleting shift');
    };

    return (
        <>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    <JobList jobs={jobs} screenshots={screenshots} shift={shift} />
                </View>

                <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
            </View>

            <View style={[tailwind('flex flex-col pl-10 pr-10 m-10 ')]}>
                <Pressable
                    onPress={deleteShift}
                    style={[tailwind('border-red-500 bg-red-500 border-2 rounded-lg items-center')]}
                >
                    <Text style={tailwind('text-lg font-bold p-1 text-white')}>Delete Shift</Text>
                </Pressable>
            </View>
        </>
    );
};

const ShiftDetails = ({ route }) => {
    console.log('Showing details for shift:', route.params);
    const shift = route.params.shift;
    const jobMileage = shift.jobs.edges
        .map((j: { node: Job }) => j.node.mileage)
        .reduce((a: number, b: number) => a + b, 0);
    return (
        <ScrollView style={tailwind('bg-gray-100 flex-col')}>
            <View style={[tailwind('h-48 m-2'), { borderRadius: 10, overflow: 'hidden' }]}>
                <TripMap
                    interactive={true}
                    isActive={false}
                    tripLocations={route.params.locations}
                    region={route.params.region}
                >
                    <></>
                </TripMap>
            </View>
            <View style={tailwind('pl-2 flex-auto flex-col rounded-lg bg-white m-2 p-3')}>
                <Text style={tailwind('text-black text-lg font-bold')}>
                    {route.params.startStr}
                </Text>
                <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                    {route.params.mileage.toFixed(2)} miles (total)
                </Text>
                <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                    {jobMileage.toFixed(2)} miles (Jobs)
                </Text>
            </View>

            <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
            <Text style={tailwind('text-3xl text-green-500 underline font-bold p-2')}>
                {route.params.shift.jobs.edges.length} Jobs
            </Text>

            <Trips shift={shift} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    imgItem: {
        backgroundColor: '#eeeeee',
        padding: 20,
        width: '100%',
    },
});

export default ShiftDetails;
