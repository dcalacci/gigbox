import React, { useState, FunctionComponent, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    SafeAreaView,
    StyleSheet,
    Pressable,
    RefreshControl,
} from 'react-native';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { Job } from '../../types';
import { Region, Marker } from 'react-native-maps';
import moment from 'moment';
import TripMap from '../shiftList/TripMap';
import { parse } from 'wellknown';
//TODO: show start and end of trip in map

const Screenshots = ({ screenshots }) => {
    if (screenshots.length == 0) {
        return (
            <View style={tailwind('flex-col justify-center bg-gray-100 w-1/2 rounded-lg m-2 p-2')}>
                <Pressable
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
                <ScreenshotItems />
            </ScrollView>
        );
    }
};

const JobItem = ({ job, screenshots }) => {
    const [region, setRegion] = useState<Region>();
    const [locations, setLocations] = useState([{}]);
    useEffect(() => {
        console.log('job snapped geometry:', job.snappedGeometry);
        if (job.snappedGeometry) {
            const { geometries, bounding_box } = JSON.parse(job.snappedGeometry);
            const locations = geometries.map((c) => {
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
    }: {
        label: string;
        value: number | string;
        prefix: string;
        suffix: string;
        placeholder: string;
    }) => {
        const valueString = typeof value === 'number' ? value.toFixed(2) : value;

        return (
            <View style={tailwind('flex flex-col pt-1')}>
                <Text style={tailwind('text-xs text-black p-0 m-0')}>{label}</Text>
                <View
                    style={[
                        tailwind('rounded-lg p-2 h-12'),
                        value == null
                            ? tailwind('bg-gray-100')
                            : tailwind('bg-green-500 bg-opacity-50'),
                    ]}
                >
                    <Text
                        style={[
                            tailwind('text-lg text-black'),
                            value == null ? null : tailwind('text-black font-bold underline'),
                        ]}
                    >
                        {prefix} {value ? `${valueString} ${suffix}` : placeholder}
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
            <View style={[tailwind('h-36 w-full'), { overflow: 'hidden' }]}>
                {locations && region ? (
                    <TripMap
                        interactive={true}
                        isActive={false}
                        tripLocations={locations}
                        region={region}
                    >
                        <Marker
                            pinColor={'red'}
                            coordinate={{
                                longitude: parse(job.endLocation).coordinates[0],
                                latitude: parse(job.endLocation).coordinates[1],
                            }}
                        ></Marker>

                        <Marker
                            pinColor={'green'}
                            coordinate={{
                                longitude: parse(job.startLocation).coordinates[0],
                                latitude: parse(job.startLocation).coordinates[1],
                            }}
                        ></Marker>
                    </TripMap>
                ) : (
                    <Text>A map will appear after you finish this job</Text>
                )}
            </View>
            <View style={tailwind('flex-row p-5')}>
                <Screenshots screenshots={screenshots} />
                <View
                    style={tailwind('flex flex-col flex-grow p-2 content-between justify-between')}
                >
                    <JobDetail
                        label={'Mileage'}
                        value={job.mileage}
                        prefix={''}
                        suffix={' mi'}
                        placeholder={'Still Tracking'}
                    />
                    <JobDetail
                        label={'Total Pay'}
                        value={job.totalPay}
                        prefix={'$ '}
                        suffix={''}
                        placeholder={''}
                    ></JobDetail>
                    <JobDetail
                        label={'Tip'}
                        value={job.tip}
                        prefix={'$ '}
                        suffix={''}
                        placeholder={''}
                    ></JobDetail>
                </View>
            </View>
        </View>
    );
};
const JobList = ({ jobs, screenshots }) => {
    return (
        <ScrollView style={[tailwind('flex-col w-full pl-2 pr-2')]}>
            {jobs?.map((j) => (
                <JobItem job={j} screenshots={screenshots} key={j.id} />
            ))}
        </ScrollView>
    );
};

const Trips = ({ shift }) => {
    const [screenshots, setScreenshots] = useState([]);
    const [jobs, setJobs] = useState<Job[]>();
    useEffect(() => {
        setScreenshots(shift.screenshots);
        setJobs(shift.jobs);
    }, [shift]);

    const deleteShift = () => {
        console.log('deleting shift');
    };

    return (
        <>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    <JobList jobs={jobs} screenshots={screenshots} />
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

const ShiftDetails = ({ navigation, route }) => {
    console.log('Showing details for shift:', route.params);
    const shift = route.params.shift;
    return (
        <ScrollView style={tailwind('bg-gray-100 flex-col')}>
            <View style={[tailwind('h-48 m-2'), { borderRadius: 10, overflow: 'hidden' }]}>
                <TripMap
                    interactive={true}
                    isActive={false}
                    tripLocations={route.params.locations}
                    region={route.params.region}
                    shiftId={shift.id}
                />
            </View>
            <View style={tailwind('pl-2 flex-auto flex-col rounded-lg bg-white m-2 p-3')}>
                <Text style={tailwind('text-black text-lg font-bold')}>
                    {route.params.startStr}
                </Text>
                <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                    {route.params.mileage.toFixed(2)} miles (total)
                </Text>
            </View>
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
