import React, { useRef, FunctionComponent } from 'react';
import { StyleSheet } from 'react-native';
import { tailwind } from 'tailwind';
import MapView, { Polyline, Region, LatLng} from 'react-native-maps';

interface TripMapProps {
    tripLocations: LatLng[] | undefined;
    shiftId: string;
    isActive: boolean;
    interactive?: boolean;
    showUserLocation?: boolean;
    region: Region | undefined;
    children: JSX.Element
}

const TripMap: FunctionComponent<TripMapProps> = (props: TripMapProps) => {
    const mapRef = useRef(null);

    const locations = (!props.tripLocations ? [] : props.tripLocations)
    return (
        <MapView
            ref={mapRef}
            region={props.region}
            zoomEnabled={false || props.interactive}
            rotateEnabled={false || props.interactive}
            scrollEnabled={false || props.interactive}
            showsUserLocation={false || props.showUserLocation}
            // /* showsUserLocation={props.isActive} */
            zoomControlEnabled={false}
            loadingEnabled={true}
            style={[tailwind('w-full h-full')]}
        >
            <Polyline
                coordinates={locations}
                strokeColor="#000"
                strokeWidth={5}
                lineJoin="bevel"
            />
            {props.children}
            
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
