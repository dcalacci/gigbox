import React, { useState, FunctionComponent, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation } from 'react-native';

import { useQuery } from 'react-query';

import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import TripMap from './TripMap';

const ShiftCard: FunctionComponent<ShiftCardProps> = (props: any) => {
    const startTime = moment.utc(props.item.node.startTime).local();
    const endTime = props.item.node.endTime ? moment.utc(props.item.node.endTime).local() : false;
    let startStr = startTime.format('dddd MMMM Do, h:mm a');
    if (endTime) {
        startStr = `${startStr} - ${endTime.format('h:mm a')}`;
    }

    const [locations, setLocations] = useState([{}]);
    const [region, setRegion] = useState(null);

    useEffect(() => {
        if (props.item.node.snappedGeometry) {
            log.info('Setting locations and bounding box for shift.');
            const { geometries, bounding_box } = JSON.parse(props.item.node.snappedGeometry);
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
    }, [props.item.node.snappedGeometry]);

    // open drawer
    const [tripDrawerOpen, setTripDrawerOpen] = useState(false);
    const daysAgo = moment.utc(props.item.node.startTime).diff(moment(), 'days');
    const mileage = props.item.node.roadSnappedMiles ? props.item.node.roadSnappedMiles : 0;

    const openDetails = () => {
        props.navigation.navigate('Details', {
            shift: props.item.node,
            locations,
            region,
            mileage,
            startStr,
        });
    };

    const toggleTripDrawer = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTripDrawerOpen(!tripDrawerOpen);
    };

    return (
        <View style={[tailwind('flex-auto m-2 flex flex-shrink flex-col'), styles.card]}>
            <View
                style={[
                    tailwind('pb-1 h-full flex flex-col flex-grow'),
                    styles.card,
                    { overflow: 'hidden' },
                ]}
            >
                <View style={[tailwind('flex-auto'), { height: 150 }]}>
                    {region != null ? (
                        <TripMap
                            interactive={false}
                            isActive={endTime == false}
                            tripLocations={locations}
                            region={region}
                            shiftId={props.item.node.id}
                        />
                    ) : (
                        <Text>Loading...</Text>
                    )}
                </View>

                <View style={tailwind('flex-col justify-start')}>
                    <View style={tailwind('p-2 flex-row justify-between')}>
                        <Text style={tailwind('text-black text-xl font-bold')}>
                            {moment.utc(props.item.node.startTime).fromNow()}
                        </Text>
                        <Text style={tailwind('text-black text-lg font-bold')}>
                            {mileage.toFixed(1)} mi (total)
                        </Text>
                    </View>

                    <Text style={tailwind('text-black text-lg pl-2')}>{startStr}</Text>
                </View>

                <View style={[tailwind('flex flex-col p-5 justify-items-center')]}>
                    <Pressable
                        onPress={openDetails}
                        style={[
                            tailwind(
                                'p-5 flex flex-row justify-items-center border-t border-green-500'
                            ),
                            { justifyContent: 'space-between' },
                        ]}
                    >
                        <Text style={tailwind('text-green-500 text-xl font-bold underline')}>
                            {props.item.node.screenshots.length} Screenshots
                        </Text>

                        <Ionicons name="caret-forward-outline" size={24} color="green" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

/*                         {tripDrawerOpen ? ( */
/*                             <Ionicons name="caret-down-outline" size={24} color="green" /> */
/*                         ) : ( */
/*                             <Ionicons name="caret-back-outline" size={24} color="green" /> */
/*                         )} */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    card: {
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        height: 'auto',
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 5,
    },
});

export default ShiftCard;
