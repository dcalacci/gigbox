import React, { useEffect, useState, FunctionComponent } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import moment from 'moment';

import { log } from '../../utils'
import { tailwind } from 'tailwind';
import { getShifts } from './api';

const ShiftCard: FunctionComponent<ShiftCardProps> = (props: any) => {
    const calendarStart = moment(props.item.node.startTime).calendar();
    const endTime = props.item.node.endTime ? moment(props.item.node.endTime).format('LT') : 'Now';
    const timeString = `${calendarStart} to ${endTime}`;
    return (
        <View style={tailwind('flex-1 w-full p-2 mb-10')} key={props.item.node.id}>
            <View
                style={tailwind(
                    'self-start absolute bg-transparent border-2 border-green-500 w-full h-full'
                )}
            ></View>
            <View
                style={tailwind(
                    'self-start bg-transparent border mt-1 ml-1 mr-4 p-1 w-full h-full'
                )}
            >
                <View style={tailwind('p-2')}>
                    <Text style={tailwind('text-black text-xl font-bold')}>
                        {moment(props.item.node.startTime).fromNow()}
                    </Text>
                    <Text style={tailwind('text-black text-xl font-bold')}>{timeString}</Text>
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
            <SafeAreaView>
                <FlatList
                    data={flattened_data}
                    renderItem={ShiftCard}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    keyExtractor={(shift) => shift.node.id}
                ></FlatList>
            </SafeAreaView>
        );
    }
}
