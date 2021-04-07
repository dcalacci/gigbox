import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import moment from 'moment';

import { tailwind } from 'tailwind';
import { getShifts } from './api';
import { RootState } from '../../store/index';
const ShiftCard: FunctionComponent<ShiftCardProps> = (props: any) => {
    const calendarStart = moment(props.item.node.startTime).calendar();
    const endTime = moment(props.item.node.endTime).format('LT');
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
                <View style={tailwind("p-2")}>
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
            console.log(lastPage, data, error);
            return lastPage.allShifts.pageInfo.endCursor;
        },
    });

    const flattened_data = data?.pages.map((a) => a.allShifts.edges).flat();
    console.log('flattened:', flattened_data);
    return status === 'loading' ? (
        <Text>Loading...</Text>
    ) : status === 'error' ? (
        <Text>Error: {error.message}</Text>
    ) : (
        <SafeAreaView>
            <FlatList
                data={flattened_data}
                renderItem={ShiftCard}
                keyExtractor={(shift) => shift.node.id}
            ></FlatList>
        </SafeAreaView>
    );
}
