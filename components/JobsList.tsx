import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, FlatList, SafeAreaView, View } from 'react-native';

import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library';
import { useQuery } from 'react-query'
import { fetchActiveShift } from '../features/clock/api';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 10,
        width: '100%',
    },
    imgItem: {
        backgroundColor: '#eeeeee',
        padding: 20,
        width: '100%',
    },
    imgImage: {
        width: '100%',
        height: 500,
    },
});

const processScreenshots = (screenshots: Asset[], shiftStatus: any) => {
    //TODO: process screenshots into jobs / send to server
    console.log("Shift status in processing:", shiftStatus)
    console.log(' MEDIA LIBRARY CHANGED; incremental changes:', screenshots.length);
    console.log('screenshot 0:', screenshots[0]);
};

const JobsList = () => {
    // list of 'assets' - images from media library
    const [assetList, setAssetList] = useState<Asset[]>([]);
    // true if list is currently refreshing
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const shiftStatus = useQuery('activeShift', fetchActiveShift, {
        /* placeholderData: { getActiveShift: { active: false } }, */
    });

    useEffect(() => {
        // get recent screenshots on load
        getRecentScreenshots();
    }, []);

    useEffect(() => {
        // processes screenshots and adds to list when a new one is taken
        MediaLibrary.addListener((obj) => {
            if ('insertedAssets' in obj) {
                setAssetList([...obj.insertedAssets, ...assetList]);
                /* if (!shiftStatus.isLoading && !shiftStatus.isError) { */
                /*     console.log("Shift found, processing screenshot...") */
                /*     processScreenshots(obj.insertedAssets, shiftStatus.data.getActiveShift); */
                /* } */
            }
        });
        return () => {
            MediaLibrary.removeAllListeners();
        };
    });

    const getRecentScreenshots = async () => {
        // make sure we have permissions
        const { status, permissions } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);

        const assets = await MediaLibrary.getAssetsAsync({
            first: 20,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: ['creationTime', 'mediaType'],
        });

        var screenshots = assets.assets.filter(
            (a) => a.mediaSubtypes != undefined && a.mediaSubtypes.includes('screenshot')
        );
        setAssetList(screenshots);
    };

    const onRefresh = () => {
        console.log('refreshing...');
        setRefreshing(true);
        getRecentScreenshots().then(() => setRefreshing(false));
    };

    // Item component for each image
    const Item: React.FC<{ imageURI: string }> = ({ imageURI }) => (
        <View style={styles.imgItem}>
            <Image
                style={styles.imgImage}
                source={{ uri: imageURI }}
                resizeMethod={'scale'}
                resizeMode={'contain'}
            />
            <Text>{imageURI}</Text>
        </View>
    );

    const renderImage: React.FC<{ item: Asset }> = ({ item }) => <Item imageURI={item.uri} />;

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={assetList}
                renderItem={renderImage}
                keyExtractor={(item) => item.id}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
        </SafeAreaView>
    );
};

export default JobsList;
