import React, { useRef, useEffect, useState, FunctionComponent } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';

import moment from 'moment';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { getShifts } from './api';
import { Location } from 'graphql/language/source';
import MapView, { Polyline } from 'react-native-maps';
import { getShiftGeometry } from './api';

interface TripMapProps {
    tripLocations: [{ latitude: number; longitude: number }];
    shiftId: string;
    region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
}

const TripMap: FunctionComponent<TripMapProps> = (props: TripMapProps) => {
    const mapRef = useRef(null);

    return (
        <MapView
            ref={mapRef}
            initialRegion={props.region}
            style={[tailwind('w-full h-full')]}
        >
            <Polyline
                coordinates={props.tripLocations}
                strokeColor="#000"
                strokeWidth={5}
                lineJoin="bevel"
            />
        </MapView>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 5,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TripMap;
