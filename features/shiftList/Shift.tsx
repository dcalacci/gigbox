import React, { useEffect, useState, FunctionComponent } from 'react';
import {
    View,
    ScrollView,
    Text,
    SafeAreaView,
    StyleSheet,
    Pressable,
    LayoutAnimation,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { getShifts, getShiftGeometry } from './api';
import TripMap from './TripMap';

const ShiftCard: FunctionComponent<ShiftCardProps> = (props: any) => {
    const calendarStart = moment.utc(props.item.node.startTime).calendar();
    const endTime = props.item.node.endTime
        ? moment.utc(props.item.node.endTime).format('LT')
        : 'Now';
    const timeString = `${calendarStart} to ${endTime}`;

    const [locations, setLocations] = useState([{}]);
    const [region, setRegion] = useState(null);
    const routeStatus = useQuery(
        ['shiftRoute', props.item.node.id],
        () => getShiftGeometry(props.item.node.id),
        {
            onSuccess: (data) => {
                console.log('ON SUCCESS for shift route:', props.item.node.id);
                console.log(props.item.node);
                console.log(data);
                if (data.getRouteLine !== null) {
                    const coords = JSON.parse(data.getRouteLine.geometry);
                    const locations = coords.map((c) => {
                        return { latitude: c[1], longitude: c[0] };
                    });
                    setLocations(locations);
                    const bbox = data.getRouteLine.boundingBox;
                    setRegion({
                        latitudeDelta: (bbox.maxLat - bbox.minLat) * 2.05,
                        longitudeDelta: (bbox.maxLng - bbox.minLng) * 2.05,
                        latitude: bbox.maxLat - (bbox.maxLat - bbox.minLat) / 2,
                        longitude: bbox.maxLng - (bbox.maxLng - bbox.minLng) / 2,
                    });
                }
            },
        }
    );

    // open drawer
    const [tripDrawerOpen, setTripDrawerOpen] = useState(false);
    const toggleTripDrawer = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (!tripDrawerOpen) {
            props.setExpanded(props.item.node.id);
        }
        setTripDrawerOpen(!tripDrawerOpen);
    };

    const daysAgo = moment.utc(props.item.node.startTime).diff(moment(), 'days');
    const mileage = props.item.node.roadSnappedMiles ? props.item.node.roadSnappedMiles : 0;
    return (
        <View style={[tailwind('flex-auto m-2 flex flex-shrink flex-col'), styles.card, ]}>
            <View
                style={[
                    tailwind('pb-1 h-full flex flex-col flex-grow'),
                    styles.card,
                    { overflow: 'hidden' },
                ]}
            >
                <View style={[tailwind('flex-auto'), { height: 150}]}>
                    {region != null ? (
                        <TripMap
                            tripLocations={locations}
                            region={region}
                            shiftId={props.item.node.id}
                        />
                    ) : (
                        <Text>Loading...</Text>
                    )}
                </View>
                <View style={tailwind('p-2 flex-row justify-between')}>
                    <Text style={tailwind('text-black text-xl font-bold')}>
                        {moment.utc(props.item.node.startTime).fromNow()}
                    </Text>
                    <Text style={tailwind('text-black text-lg font-bold')}>
                        {mileage.toFixed(1)} mi (total)
                    </Text>
                </View>

                <View style={[tailwind('flex flex-col p-5 justify-items-center')]}>
                    <Pressable
                        onPress={toggleTripDrawer}
                        style={[
                            tailwind(
                                'p-5 flex flex-row justify-items-center border-t border-green-500'
                            ),
                            { justifyContent: 'space-between' },
                        ]}
                    >
                        <Text style={tailwind('text-green-500 text-xl font-bold underline')}>
                            2 Trips
                        </Text>
                        {tripDrawerOpen ? (
                            <Ionicons name="caret-down-outline" size={24} color="green" />
                        ) : (
                            <Ionicons name="caret-back-outline" size={24} color="green" />
                        )}
                    </Pressable>
                    {tripDrawerOpen ? (
                        <>
                            <Text>Open</Text>
                            <Text>Opennn</Text>
                        </>
                    ) : (
                        <Text>Closed</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

export default function ShiftList() {
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();
    const n = 10;
    const fetchShifts = ({ pageParam = null }) => {
        return getShifts(n, pageParam);
    };
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery('shifts', fetchShifts, {
        getNextPageParam: (lastPage, pages) => {
            return lastPage.allShifts.pageInfo.endCursor;
        },
    });
    const [expanded, setExpanded] = useState(null);

    // TODO: unclear why this refresh does not work but our job list one does
    const onRefresh = () => {
        log.info('invalidating all shift queries...');
        setRefreshing(true);
        queryClient.invalidateQueries('shifts');
    };
    const onSizeChange = (w, h) => {
        log.info('ON SIZE CHANGE');
        console.log(w, h);
        console.log('expanded:', expanded);
    };

    const flattened_data = data?.pages.map((a) => a.allShifts.edges).flat();
    /* console.log('flattened:', flattened_data); */
    /* return status === 'loading' ? ( */
    /*     <Text>Loading...</Text> */
    /* ) : status === 'error' ? ( */
    /*     <Text>Error: {error.message}</Text> */
    /* ) : ( */
    /*         ); */
    if (status === 'loading') {
        return <Text> Loading...</Text>;
    } else if (status === 'error') {
        return <Text>Error: {error.message}</Text>;
    } else {
        return (

        <SafeAreaView style={styles.container}>
            <FlatList
                style={[
                    tailwind('h-full w-full flex-auto'),
                    {flexDirection: 'col', minHeight: 70, flexGrow: 1 },
                ]}
                data={flattened_data}
                renderItem={(props) => <ShiftCard {...props} setExpanded={setExpanded} />}
                onRefresh={() => onRefresh()}
                refreshing={refreshing}
                onContentSizeChange={onSizeChange}
                extraData={expanded}
                keyExtractor={(shift) => shift.node.id}
            ></FlatList>
                    </SafeAreaView>
        );
    }
}

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
