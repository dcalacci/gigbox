import React, { useState, useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";

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

type MapProps = {
  centerLocation: Location;
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

  const askPermissions = async () => {
    const { status, granted } = await Permissions.askAsync(
      Permissions.LOCATION
    );
    if (status === "granted") {
      setLocPermission(granted);
    } else {
      console.log("Permissions denied.");
      setLocPermission(false);
    }
  };

  useEffect(() => {
    if (!locPermission) {
      askPermissions();
    }
    // get the user location as soon as permissions update
    if (locPermission && !userLocation) {
      getUserLocation();
    }
  }, [locPermission]);

  if (userLocation) {
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
