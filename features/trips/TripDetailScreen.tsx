import React, {  } from 'react';
import {
    Text,
    View,
    Pressable,
} from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { tailwind } from 'tailwind';
import { Job } from '@/types';
import { JobItem } from '../job/Job';

const TripScreenHeader = ({ isMerging, onPress }: { isMerging: boolean; onPress: () => void }) => {
    return (
        <View style={tailwind('flex-col w-full')}>
            <View style={tailwind('flex-row p-2 mt-10 justify-between')}>
                <Text style={[tailwind('text-4xl font-bold')]}>Trips</Text>
                {isMerging ? (
                    <Pressable
                        onPress={onPress}
                        style={[tailwind('flex-row rounded-lg p-2 border items-center')]}
                    >
                        <Text style={tailwind('text-black font-bold')}>Done</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={onPress}
                        style={[tailwind('flex-row rounded-lg p-2 bg-black items-center')]}
                    >
                        <Text style={tailwind('text-white font-bold')}>Merge</Text>
                        <Ionicons name="git-merge" color="white" size={16} />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

export const TripDetailScreen = ({ route}: { route: {params: {job: Job}}}) => {
    const job = route.params.job
    return (
        <>
            <TripScreenHeader
                isMerging={false}
                onPress={() => console.log('press...')}
            ></TripScreenHeader>
            <JobItem job={job} />
        </>
    );
};
