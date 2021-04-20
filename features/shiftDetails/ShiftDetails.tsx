import React, { useState, FunctionComponent } from 'react';
import { View, Text, SafeAreaView, StyleSheet, RefreshControl } from 'react-native';
import TripMap from '../shiftList/TripMap';
import { tailwind } from 'tailwind';

const ShiftDetails = ({ navigation, route }) => {
    console.log('Showing details for shift:', route.params);
    const shift = route.params.shift;
    return (
        <View style={tailwind('pt-20 bg-white h-full')}>
            <View
                style={[
                    tailwind('h-1/3 pt-2'),
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
                <Text style={tailwind('text-black text-lg font-bold')}>
                    {route.params.startStr}
                    </Text>
        </View>
    );
};

export default ShiftDetails;
