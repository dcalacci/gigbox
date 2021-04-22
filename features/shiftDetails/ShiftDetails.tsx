import React, { useState, FunctionComponent } from 'react';
import {
    ScrollView,
    View,
    Text,
    Image,
    SafeAreaView,
    StyleSheet,
    Pressable,
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
    const deleteShift = () => {
        console.log('deleting shift');
    };

    const TripList = () => {
        return screenshotStatus.data.getShiftScreenshots.map((s) => {
            return (
                <View style={[tailwind('flex-col justify-center w-full pl-2 pr-2')]}>
                    <View style={tailwind('flex-row w-full')}>
                        <ScrollView
                            horizontal={true}
                            key={s.id}
                            style={tailwind('m-2 rounded-lg bg-gray-200 w-1/3 p-2')}
                        >
                            <View style={tailwind('flex-row p-0')}>
                                <View style={tailwind('flex-col p-1 justify-start')}>
                                    <Image
                                        style={[tailwind('flex-auto m-0')]}
                                        source={{ uri: s.onDeviceUri }}
                                        resizeMethod={'scale'}
                                        resizeMode={'contain'}
                                    />
                                    <Text style={{ alignSelf: 'center' }}>
                                        {moment.utc(s.timestamp).local().format('h:mm a')}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        tailwind('border-b-2 border-green-500 w-1/2 self-center'),
                                    ]}
                                />
                            </View>
                        </ScrollView>
                        <View
                            style={tailwind(
                                'flex flex-col flex-grow p-2 content-between justify-between'
                            )}
                        >
                            <View
                                style={tailwind(
                                    'flex flex-col rounded-lg bg-green-500 bg-opacity-60 m-1 p-2'
                                )}
                            >
                                <Text style={tailwind('text-lg font-bold text-black')}>
                                    Mileage
                                </Text>
                                <Text style={tailwind('text-lg text-black')}>4.87mi</Text>
                            </View>

                            <View
                                style={tailwind(
                                    'flex flex-col rounded-lg bg-green-500 bg-opacity-60 m-1 p-2'
                                )}
                            >
                                <Text style={tailwind('text-lg font-bold')}>Total Pay</Text>
                                <Text style={tailwind('text-lg')}>$10.23</Text>
                            </View>
                            <View
                                style={tailwind(
                                    'flex flex-col rounded-lg bg-green-500 bg-opacity-60 m-1 p-2'
                                )}
                            >
                                <Text style={tailwind('text-lg font-bold')}>Tip</Text>
                                <Text style={tailwind('text-lg')}>$11.23</Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        });
    };

    return (
        <ScrollView style={tailwind('h-2/3 bg-white flex-col')}>
            <View style={tailwind('flex-col')}>
                <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
                <View style={tailwind('flex flex-row flex-auto content-between')}>
                    {screenshotStatus.isLoading || screenshotStatus.isError ? (
                        <Text>Loading...</Text>
                    ) : (
                        <TripList />
                    )}
                </View>

                <View style={tailwind('border-b border-green-500 h-1 mb-2 mr-5 ml-5')} />
            </View>

            <View style={[tailwind('flex flex-col pl-10 pr-10 ')]}>
                <Pressable
                    onPress={deleteShift}
                    style={[tailwind('border-red-500 bg-red-500 border-2 rounded-lg items-center')]}
                >
                    <Text style={tailwind('text-lg font-bold p-1 text-white')}>Delete Shift</Text>
                </Pressable>
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
