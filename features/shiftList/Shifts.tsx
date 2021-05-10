import React, { useState, FunctionComponent } from 'react';
import { Text, View, SafeAreaView, StyleSheet, RefreshControl } from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { getShifts } from './api';
import ShiftDetails from './ShiftDetails';
import ShiftCard from './ShiftCard';
import Statistics from './Statistics';

export default function ShiftList({ navigation }) {
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
        onSettled: () => {
            setRefreshing(false);
            log.info('Done refreshing shift list.');
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.allShifts.pageInfo.endCursor;
        },
        refetchInterval: 10000,
    });
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = () => {
        setRefreshing(true);
        log.info('Refreshing shift list..');
        queryClient.invalidateQueries('shifts');
    };

    const Header = () => (
        <>
            <Text style={tailwind('text-3xl text-black font-bold pl-2 pt-20')}>Shifts</Text>
        </>
    );

    const flattened_data = data?.pages.map((a) => a.allShifts.edges).flat();
    if (status === 'loading') {
        return <Text> Loading...</Text>;
    } else if (status === 'error') {
        return <Text>Error: {error.message}</Text>;
    } else {
        return (
            <View style={styles.container}>
                <FlatList
                    ListHeaderComponent={<Header />}
                    style={[tailwind('h-full w-full flex-auto flex-col flex-grow')]}
                    data={flattened_data}
                    renderItem={(props) =>
                        props.item.node == null ? null : (
                            <ShiftCard {...props} navigation={navigation} />
                        )
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    onEndReached={() => {
                        console.log('reached end');
                        if (hasNextPage) {
                            console.log('fetching next page');
                            fetchNextPage();
                        }
                    }}
                    keyExtractor={(shift) => shift.node.id}
                ></FlatList>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        width: '100%',
    },
});
