import React, { useState, FunctionComponent } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    SafeAreaView,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { tailwind } from 'tailwind';
import { useQuery } from 'react-query';
import { getShiftScreenshots } from './api';
import moment from 'moment';
import TripMap from '../shiftList/TripMap';

const Trips = ({ shift }) => {
    const screenshotStatus = useQuery(
        ['screenshots', shift.id],
        () => getShiftScreenshots(shift.id),
        {
            onSuccess: (data) => {
                console.log('retrieved screenshots:', data);
            },
        }
    );
    return (
        <ScrollView style={tailwind('h-2/3 bg-white')}>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    {screenshotStatus.data.getShiftScreenshots.map((s) => {
                        return (
                            <View style={tailwind('flex-auto flex-col pl-2 pr-2')}>
                                <Image
                                    style={[tailwind('flex-auto h-36 m-0 p-0')]}
                                    key={s.id}
                                    source={{ uri: s.onDeviceUri }}
                                    resizeMethod={'scale'}
                                    resizeMode={'contain'}
                                />
                                <Text style={{ alignSelf: 'center' }}>
                                    {moment.utc(s.timestamp).format('h:mm a')}
                                </Text>
                            </View>
                        );
                    })}
                </View>
                <View style={tailwind('border-b border-green-500 mb-2 mr-5 ml-5')}>
                    <Text style={tailwind('text-xl font-bold')}>INSTACART</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const ShiftDetails = ({ navigation, route }) => {
    console.log('Showing details for shift:', route.params);
    const shift = route.params.shift;
    return (
        <>
            <View style={tailwind('pt-20 bg-white h-1/2')}>
                <View
                    style={[
                        tailwind('h-3/4 pt-2'),
                        { borderRadius: 10, overflow: 'hidden', elevation: 5 },
                    ]}
                >
                    <TripMap
                        interactive={true}
                        isActive={false}
                        tripLocations={route.params.locations}
                        region={route.params.region}
                        shiftId={shift.id}
                    />
                </View>
                <View style={tailwind('pl-2 pt-2 flex-auto flex-col')}>
                    <Text style={tailwind('text-black text-lg font-bold')}>
                        {route.params.startStr}
                    </Text>
                    <Text style={tailwind('text-gray-800 text-lg font-bold')}>
                        {route.params.mileage.toFixed(2)} miles (total)
                    </Text>
                </View>
            </View>

            <Trips shift={shift} />
        </>
    );
};

const styles = StyleSheet.create({
    imgItem: {
        backgroundColor: '#eeeeee',
        padding: 20,
        width: '100%',
    },
});

export default ShiftDetails;
