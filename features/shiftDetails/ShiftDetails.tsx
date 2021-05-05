
import React, { useEffect, useState} from 'react'
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    Pressable
} from 'react-native';
import { tailwind } from 'tailwind';
import { Job, Shift} from '../../types';
import { JobList } from '../job/JobList'
import TripMap from '../shiftList/TripMap';

export const ShiftTrips = ({ shift }: { shift: Shift }) => {
    const [jobs, setJobs] = useState<[{ node: Job }]>();
    useEffect(() => {
        setJobs(shift.jobs.edges);
    }, [shift]);

    const deleteShift = () => {
        console.log('deleting shift');
    };

    return (
        <>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    <JobList jobs={jobs} shift={shift} />
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

            <ShiftTrips shift={shift} />
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
