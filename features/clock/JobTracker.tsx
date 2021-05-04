import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';

import { tailwind } from 'tailwind';
import { log } from '../../utils';
import { Shift, Job, Employers } from '@/types';
import { LatLng, Marker, Region } from 'react-native-maps';
import { QueryClient, useMutation } from 'react-query';
import { useToast } from 'react-native-fast-toast';
import moment from 'moment';

import { createJob, endJob } from './api';
import TripMap from '../shiftList/TripMap';
import EmployerSelector from './EmployerSelector';
import Ellipsis from '../../components/Ellipsis';
import parse from 'wellknown';

export interface JobTrackerProps {
    shift: Shift;
}

export default function JobTracker({ shift }: { shift: Shift }) {
    const [jobStarted, setJobStarted] = useState(false);
    const [locations, setLocations] = useState<LatLng[]>();
    const [region, setRegion] = useState<Region>();
    const [employer, setEmployer] = useState<Employers>();
    const [activeJob, setActiveJob] = useState<Job>();
    const toast = useToast();

    useEffect(() => {
        const activeJobs: Job[] = shift.jobs.filter((j) => !j.endTime);
        const activeJob: Job | undefined = activeJobs.length == 0 ? undefined : activeJobs[0];
        setActiveJob(activeJob);
    }, [shift.jobs]);

    useEffect(() => {
        if (activeJob && activeJob?.snappedGeometry) {
            const { geometries, bounding_box } = JSON.parse(activeJob.snappedGeometry);
            const locations = geometries.map((c) => {
                return { latitude: c[1], longitude: c[0] };
            });
            console.log("setting locations", locations)
            setLocations(locations);
            const bbox = bounding_box;
            setRegion({
                latitudeDelta: (bbox.maxLat - bbox.minLat) * 2.05,
                longitudeDelta: (bbox.maxLng - bbox.minLng) * 2.05,
                latitude: bbox.maxLat - (bbox.maxLat - bbox.minLat) / 2,
                longitude: bbox.maxLng - (bbox.maxLng - bbox.minLng) / 2,
            });
        }
    }, [activeJob]);

    const startJob = useMutation(createJob, {
        mutationKey: ['createJob'],
        onSettled: (data, variables, context) => {
            console.log('STARTED JOB:, data:', data);
            if (data.createJob.ok) {
                setActiveJob(data.createJob.job);
            } else {
                //TODO: toast saying we couldn't start a job for some reason
                toast?.show("Couldn't start that job. Try again?");
            }
        },
        onError: (data, variables) => {
            //TODO: send toast
            log.error('ERROR starting job');
        },
    });

    const finishJob = useMutation(endJob, {
        mutationKey: ['endJob'],
        onSuccess: (data, variables, context) => {
            console.log('ENDING job:', data);
            if (data.endJob.ok) {
                log.info('ended job successfully: ', data);
                setActiveJob(undefined);
                setJobStarted(false);
                setEmployer(undefined);
            } else {
                //TODO: send toast
                log.error('failed to end job...');
                toast?.show("Couldn't stop your job. Try again?");
            }
        },
        onError: (err, variables) => {
            //TODO: send toast
            log.error('Couldnt finish job.');
        },
    });

    const pressStartOrEndJob = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        if (startJob.status == 'loading' || finishJob.status == 'loading') {
            log.debug('Job status is loading, not doing anything...');
            return;
        } else if (activeJob) {
            finishJob.mutate({ jobId: activeJob.id });
        } else if (!employer) {
            // jobstarted = true but the job hasn't been created yet - we need to
            // ask user for an employer
            setJobStarted(true);
        } else {
            // finally, submit job
            startJob.mutate({ shiftId: shift.id, employer });
        }
    };

    const submitEmployer = (employer: Employers): void => {
        setJobStarted(true);
        setEmployer(employer);
        // then, start the job!
        startJob.mutate({ shiftId: shift.id, employer });
    };

    const getButtonText = () => {
        if (activeJob) {
            return 'Finish this Job';
        } else if (!activeJob && jobStarted) {
            // we're selecting an employer
            return 'What app are you working for?';
        } else if (!activeJob) {
            return 'Start New Job';
        }
    };
    return (
        <View
            style={[tailwind('flex-auto flex-col bg-white ml-2 mb-1 mr-2'), styles.roundedBottom]}
        >
            <View style={[tailwind('flex-auto w-full flex-col')]}>
                {activeJob ? (
                    <View style={tailwind('h-36 border-b-2 border-green-500')}>
                        <View style={styles.mapTitle}>
                            <Text style={tailwind('text-xl text-gray-800 font-bold underline')}>
                                Current Job
                            </Text>
                        </View>
                        <TripMap
                            interactive={false}
                            showUserLocation={true}
                            isActive={false}
                            tripLocations={locations}
                            region={region}
                        >
                            <Marker
                                pinColor={'green'}
                                coordinate={{
                                    longitude: parse(activeJob.startLocation).coordinates[0],
                                    latitude: parse(activeJob.startLocation).coordinates[1],
                                }}
                            ></Marker>
                        </TripMap>
                    </View>
                ) : null}
                {activeJob ? (
                    <View style={tailwind('w-full p-2')}>
                        <View style={tailwind('flex-initial bg-green-500 rounded-2xl p-1')}>
                            <Text style={tailwind('text-sm font-bold text-white flex-initial')}>
                                Started: {moment.utc(activeJob.startTime).local().format('h:mm a')}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {jobStarted && !employer ? (
                    <View style={tailwind('w-full p-2')}>
                        <EmployerSelector
                            onEmployersSubmitted={submitEmployer}
                            potentialEmployers={shift.employers}
                            submissionStatus={employer ? 'success' : ''}
                            singleSelect={true}
                        />
                    </View>
                ) : null}

                {shift.active ? (
                    <Pressable
                        onPress={pressStartOrEndJob}
                        style={[
                            tailwind('mb-0 p-2'),
                            activeJob ? tailwind('bg-red-400') : tailwind('bg-gray-600'),
                            styles.roundedBottom,
                        ]}
                    >
                        {startJob.status == 'loading' || finishJob.status == 'loading' ? (
                            <Ellipsis style={tailwind('text-lg self-center')} />
                        ) : (
                            <Text
                                style={tailwind(
                                    'underline font-bold text-white text-lg self-center'
                                )}
                            >
                                {getButtonText()}
                            </Text>
                        )}
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mapTitle: {
        position: 'absolute',
        top: 2,
        left: 10,
        zIndex: 101,
    },
    roundedBottom: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
});
