import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet} from 'react-native';

import { tailwind } from 'tailwind'
import { log } from '../../utils'
import { Shift} from '@/types'
import { LatLng, Region } from 'react-native-maps'

import TripMap from '../shiftList/TripMap'

export interface JobTrackerProps {
    shift: Shift
}

export default function JobTracker({shift}: {shift: Shift}) {

    const [jobStarted, setJobStarted] = useState(false);
    const [locations, setLocations] = useState<LatLng[]>();
    const [region, setRegion] = useState<Region>();

    useEffect(() => {
        console.log('trying to set geometry');
        if (shift && shift.snappedGeometry) {
            log.info('Setting locations and bounding box for shift.');
            const { geometries, bounding_box } = (typeof(shift.snappedGeometry) == 'string' ? JSON.parse(shift.snappedGeometry) : shift.snappedGeometry)

            const locations: LatLng[] = geometries.map((c: [number, number][]) => {
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
    }, [shift]);


    return (
        <View
            style={[tailwind('flex-auto flex-col ml-2 mb-1 mr-2')]}
        >
            <View style={[tailwind('flex-auto w-full flex-col')]}>
                {jobStarted ? (
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
                            shiftId={shift.id}
                        />
                    </View>
                ) : null}
                {jobStarted ? (
                    <View style={tailwind('w-full p-2')}>
                        <View style={tailwind('flex-initial bg-green-500 rounded-2xl p-1')}>
                            <Text style={tailwind('text-sm font-bold text-white flex-initial')}>
                                Started: 4:32pm
                            </Text>
                        </View>
                    </View>
                ) : null}
                {shift.active ? (
                    <Pressable
                        onPress={() => setJobStarted(!jobStarted)}
                        style={[
                            tailwind('mb-0 p-2'),
                            jobStarted ? tailwind('bg-red-400') : tailwind('bg-gray-600'),
                            styles.roundedBottom,
                        ]}
                    >
                        <Text
                            style={tailwind('underline font-bold text-white text-lg self-center')}
                        >
                            {jobStarted ? 'End This Job' : 'Start New Job'}
                        </Text>
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
        zIndex: 101
    },
    roundedBottom: {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
})