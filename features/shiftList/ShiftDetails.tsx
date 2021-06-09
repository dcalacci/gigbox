import React, { useEffect, useState } from 'react';
import { ScrollView, View, Modal, Text, StyleSheet, Pressable } from 'react-native';
import { tailwind } from 'tailwind';
import { useMutation, useQueryClient } from 'react-query';
import { Job, Shift } from '../../types';
import { JobList } from '../job/JobList';
import TripMap from './TripMap';
import { log } from '../../utils';

import { deleteShift } from './api';

export const ShiftTrips = ({
    routeParams,
    shift,
    goHome,
}: {
    routeParams: any;
    shift: Shift;
    goHome: () => void;
}) => {
    const [jobs, setJobs] = useState<[{ node: Job }]>();
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const deleteShiftById = useMutation(deleteShift, {
        onSuccess: (d) => {
            log.info('deleted Shift');
            queryClient.invalidateQueries('shifts');
            setDeleteModalVisible(false);
            goHome();
        },
    });
    useEffect(() => {
        setJobs(shift.jobs.edges);
    }, [shift]);

    return (
        <>
            <Modal
                animationType="slide"
                transparent={false}
                visible={deleteModalVisible}
                presentationStyle={'formSheet'}
                onRequestClose={() => {
                    console.log('modal closed');
                }}
            >
                <View style={tailwind('flex flex-col w-full h-full p-5')}>
                    <Text style={tailwind('text-3xl underline text-red-500 font-bold p-2')}>
                        Delete Shift
                    </Text>

                    <Text style={tailwind('text-lg p-2')}>
                        Are you sure you want to delete this shift? By deleting this shift you will
                        also delete {shift.jobs.edges.length} jobs.
                    </Text>
                    <View style={[tailwind('h-1/4 m-2'), { borderRadius: 10, overflow: 'hidden' }]}>
                        <TripMap
                            interactive={true}
                            isActive={false}
                            tripLocations={routeParams.locations}
                            region={routeParams.region}
                        >
                            <></>
                        </TripMap>
                    </View>
                    <View style={tailwind('pl-2 flex-auto flex-col rounded-lg bg-white m-2 p-3')}>
                        <Text style={tailwind('text-black text-lg font-bold')}>
                            {routeParams.startStr}
                        </Text>
                        <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                            {routeParams.mileage.toFixed(2)} miles (total)
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => deleteShiftById.mutate({ id: shift.id })}
                        style={[tailwind('bg-red-500 rounded-lg items-center p-2 m-2')]}
                    >
                        <Text style={tailwind('text-lg font-bold p-1 text-white')}>
                            Yes, Delete Shift
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setDeleteModalVisible(false)}
                        style={[tailwind('bg-gray-500 rounded-lg items-center p-2 m-2')]}
                    >
                        <Text style={tailwind('text-lg font-bold p-1 text-white')}>Cancel</Text>
                    </Pressable>

                </View>
            </Modal>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    <JobList jobs={jobs} />
                </View>

                <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
            </View>

            <View style={[tailwind('flex flex-col pl-10 pr-10 m-10 ')]}>
                <Pressable
                    onPress={() => setDeleteModalVisible(true)}
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

            <ShiftTrips routeParams={route.params} goHome={route.params.goHome} shift={shift} />
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
