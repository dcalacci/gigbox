import React, { useEffect, useState, FunctionComponent } from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import moment from 'moment';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { getShifts, getShiftGeometry } from './api';
import TripMap from './TripMap';

const ShiftCard: FunctionComponent<ShiftCardProps> = (props: any) => {
    const calendarStart = moment(props.item.node.startTime).calendar();
    console.log('start time:', calendarStart, props.item.node.startTime);
    const endTime = props.item.node.endTime
        ? moment.utc(props.item.node.endTime).format('LT')
        : 'Now';
    const timeString = `${calendarStart} to ${endTime}`;

    const [locations, setLocations] = useState([{}]);
    const [region, setRegion] = useState({});
    const routeStatus = useQuery('shiftRoute', () => getShiftGeometry(props.item.node.id), {
        onSuccess: (data) => {
            console.log("Got data:", data)
            const coords = JSON.parse(data.getRouteLine.geometry);
            const locations = coords.map((c) => {
                return { latitude: c[1], longitude: c[0] };
            });
            setLocations(locations);
            const bbox = data.getRouteLine.boundingBox;
            setRegion({
                latitudeDelta: ((bbox.maxLat - bbox.minLat)*2.05),
                longitudeDelta: ((bbox.maxLng - bbox.minLng)*2.05),
                latitude: bbox.maxLat - (bbox.maxLat - bbox.minLat)/2,
                longitude: bbox.maxLng - (bbox.maxLng - bbox.minLng)/2,
            });
            /* setRegion({ */
            /*     ...center, */
            /*     latitude: bbox.maxLat - center.latitudeDelta, */
            /*     longitude: bbox.maxLng - center.longitudeDelta, */
            /* }); */
        },
    });

    const daysAgo = moment.utc(props.item.node.startTime).diff(moment(), 'days');
    const mileage = props.item.node.roadSnappedMiles ? props.item.node.roadSnappedMiles : 0;
    return (
        <View style={[tailwind('flex flex-row')]} key={props.item.node.id}>
            <View style={[tailwind('m-2 h-48 flex flex-grow flex-col'), styles.card]}>
                <View
                    style={[
                        tailwind('flex-1 pb-1 h-full flex flex-col'),
                        styles.card,
                        { overflow: 'hidden' },
                    ]}
                >
                    <View style={[tailwind('flex-1'), { borderRadius: 10 }]}>
                        {routeStatus.isSuccess ? (
                            <TripMap
                                tripLocations={locations}
                                region={region}
                                shiftId={props.item.node.id}
                            />
                        ) : (
                            <Text>Loading...</Text>
                        )}
                    </View>
                    <View style={tailwind('p-2')}>
                        <Text style={tailwind('text-black text-xl font-bold')}>
                            {moment.utc(props.item.node.startTime).fromNow()}
                        </Text>
                        <Text style={tailwind('text-black text-xl font-bold')}>{timeString}</Text>
                        <Text style={tailwind('text-black text-xl')}>{mileage.toFixed(1)}mi</Text>
                    </View>
                </View>
            </View>
            <View
                style={tailwind(
                    'flex-grow-0 w-10 p-5 flex flex-col h-full border-l-4 border-green-500'
                )}
            >
                <View
                    style={[
                        tailwind('rounded-full bg-green-500 h-8 w-8'),
                        daysAgo % 7 == 0 ? tailwind('w-24') : null,
                    ]}
                ></View>
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

    // TODO: unclear why this refresh does not work but our job list one does
    const onRefresh = () => {
        log.info('invalidating all shift queries...');
        setRefreshing(true);
        queryClient.invalidateQueries('shifts');
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
            <View style={[tailwind('flex-1 w-full flex-row'), { margin: 0 }]}>
                <FlatList
                    style={tailwind('')}
                    data={flattened_data}
                    renderItem={(props) => (<ShiftCard {...props}/>)}
                    onRefresh={() => onRefresh()}
                    refreshing={refreshing}
                    keyExtractor={(shift) => shift.node.id}
                ></FlatList>
            </View>
        );
    }
}

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
});
