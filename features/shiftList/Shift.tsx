import React, { useState, FunctionComponent } from 'react';
import { Text, View, SafeAreaView, StyleSheet, RefreshControl } from 'react-native';

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from 'react-query';
import { FlatList } from 'react-native-gesture-handler';

import { log } from '../../utils';
import { tailwind } from 'tailwind';
import { getShifts, getShiftGeometry } from './api';
import ShiftDetails from '../shiftDetails/ShiftDetails';
import ShiftCard from './ShiftCard';

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
        },
        getNextPageParam: (lastPage, pages) => {
            return lastPage.allShifts.pageInfo.endCursor;
        },
    });
    const [expanded, setExpanded] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = () => {
        setRefreshing(true);
        queryClient.invalidateQueries('shifts');
    };

    const Header = () => <Text style={tailwind('text-3xl text-black font-bold pl-2 pt-20')}>Shifts</Text>;

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
                    style={[
                        tailwind('h-full w-full flex-auto'),
                        { flexDirection: 'col', minHeight: 70, flexGrow: 1 },
                    ]}
                    data={flattened_data}
                    renderItem={(props) => (
                        <ShiftCard {...props} setExpanded={setExpanded} navigation={navigation} />
                    )}
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
                    extraData={expanded}
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
