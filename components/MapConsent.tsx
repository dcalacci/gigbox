import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, Text, TouchableOpacity, Dimensions } from "react-native";

import * as Loc from "expo-location";
import * as Permissions from "expo-permissions";

import MapView from "react-native-maps";

type Location = {
  latitude: number;
  longitude: number;
};

const DELTAS = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type LocConsentProps = {
  onPermissionRecieved: Function;
};

type MapProps = {
  centerLocation: Location;
};

const LocationConsentButton: React.SFC<LocConsentProps> = (props) => {
  // sets permission to true or false and stores it in async storage

  useEffect(() => {
      // if we've already recieved permissions, don't show the button
    if (hasGrantedPermission()) {
      props.onPermissionRecieved(true);
    }
  });

  const hasGrantedPermission = async () => {
    const val = await AsyncStorage.getItem("@locationPermission");
    if (val) {
      const { granted } = JSON.parse(val);
      return granted;
    } else {
      return false;
    }
  };

  const setPermission = async (granted: boolean, date: Date) => {
    const val = JSON.stringify({ granted, date });
    await AsyncStorage.setItem("@locationPermission", val);
    props.onPermissionRecieved(granted);
  };

  // retrieves locatino permission from expo permissions API.
  // nothing is stored if user refuses
  const getLocPermission = async () => {
    if (!hasGrantedPermission()) {
      const { status } = await Permissions.getAsync(Permissions.LOCATION);
      if (status == "granted") {
        setPermission(true, new Date());
      }
    } else {
      // we've already gotten permission, send it up
      props.onPermissionRecieved(true);
    }
  };

  return (
    <TouchableOpacity onPress={getLocPermission} style={styles.locationButton}>
      <Text style={styles.buttonText}>Request Location Permission</Text>
    </TouchableOpacity>
  );
};

const Map: React.SFC<MapProps> = (props) => {
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [map, setMap] = useState<MapView | null>(null);

  useEffect(() => {
    if (mapReady && map) {
      map.animateToRegion({ ...props.centerLocation, ...DELTAS });
    }
  }, [props, mapReady]);

  return (
    <MapView
      ref={(m: MapView) => {
        setMap(m);
      }}
      showsUserLocation={true}
      showsCompass={true}
      style={styles.mapStyle}
      cacheEnabled={false}
      zoomEnabled={false}
      zoomTapEnabled={false}
      rotateEnabled={false}
      scrollEnabled={false}
      loadingEnabled={true}
      onMapReady={() => setMapReady(true)}
    ></MapView>
  );
};

const MapConsent = () => {
  const [locPermission, setLocPermission] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  const getUserLocation = async () => {
    const loc = await Loc.getCurrentPositionAsync();
    console.log("got user location:", loc);
    setUserLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  };

  useEffect(() => {
    // get the user location as soon as permissions update
    if (locPermission && !userLocation) {
      getUserLocation();
    }
  }, [locPermission]);

  if (!locPermission) {
    return <LocationConsentButton onPermissionRecieved={setLocPermission} />;
  } else if (userLocation) {
    return <Map centerLocation={userLocation} />;
  } else {
    // TODO: small loading screen here
    return <></>;
  }
};

export default MapConsent;

const styles = StyleSheet.create({
  mapStyle: {
    width: Dimensions.get("window").width,
    height: 250,
    alignSelf: "flex-start",
  },
  locationButton: {
    backgroundColor: "transparent",
    borderColor: "green",
    borderWidth: 2,
    alignSelf: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 0,
    alignItems: "center",
    borderRadius: 10,
  },
  locationButtonNext: {
    position: "absolute",
    bottom: 15,
    right: 10,
  },
  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxHeight: 250,
  },
  buttonText: {
    fontSize: 18,
    color: "green",
  },
});
