import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../store/index';
import { FlatList } from 'react-native-gesture-handler';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { getShifts } from './api';

const ShiftCard = (props: any) => {
    return (
        <View key={props.item.node.id}>
            <Text>
                Start time: {props.item.node.startTime}
                End Time: {props.item.node.endTime}
            </Text>
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
