import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import tailwind from 'tailwind-rn';

export default function SettingsScreen({ route }) {
    /* let filter: JobFilter | undefined; */
    return (
        <View style={tailwind('bg-gray-100 items-center justify-start flex-col')}>
            {/* <Text style={styles.title}>Jobs</Text> */}
            <Text style={tailwind('text-2xl text-green-500')}>
                Settings
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
