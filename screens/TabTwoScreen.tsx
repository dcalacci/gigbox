import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import {tailwind} from "tailwind"
import ShiftList from '../features/shiftList/Shift';

export default function TabTwoScreen() {
    return (
        <View style={styles.container}>
            <ShiftList style={tailwind("pt-10")}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
