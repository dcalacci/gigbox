import React, { Component } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

import * as Loc from "expo-location";
import * as Permissions from "expo-permissions";

import MapView from "react-native-maps";

type Location = {
  latitude: number;
  longitude: number;
};

type MapConsentState = {
  currentLocation: Location;
  mapReady: boolean;
  locationConsentGiven: boolean;
  locationGranted: boolean;
  map: MapView | null;
  errorMessage: string;
};

const DELTAS = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export class MapConsent extends Component<{}, MapConsentState> {
    /* private mapref = React.createRef<MapView|null>(); */
    private map: MapView | null
  /* private mapref: React.RefObject<MapView>; */

  constructor(props: object) {
    super(props);
    this.map = null;
    this.state = {
      currentLocation: { latitude: -1, longitude: -1 },
      mapReady: false,
      locationConsentGiven: false,
      locationGranted: false,
      map: null,
      errorMessage: "",
    };
  }

  componentDidUpdate() {
    // once we have current location and the map is ready, animate the map to the user.
    if (this.state.currentLocation.latitude != -1 && this.map !== null) {
      console.log("got current location for user, animating the map...");
      console.log(this.state.currentLocation)
      this.map.animateToRegion({
        latitude: this.state.currentLocation.latitude,
        longitude: this.state.currentLocation.longitude,
        ...DELTAS,
      });
    } else if (!this.state.currentLocation) {
      console.log("checking permissions because we don't have location:", this.state.currentLocation)
      this._checkPermissionsAndLocation()
    }
  }

  _locationDataError = (text: string) => {
    return (
      data: Permissions.PermissionResponse
    ): Permissions.PermissionResponse => {
      if (data.status != "granted") {
        Alert.alert(
          "Background Location",
          text,
          [{ text: "Cancel" }, { text: "Continue Anyway" }],
          { cancelable: false }
        );
        return data;
      } else {
        return data;
      }
    };
  };

  _checkPermissionsAndLocation = async () => {
    let { status } = await Permissions.getAsync(Permissions.LOCATION);
    if (status == "granted") {
      let location = await Loc.getCurrentPositionAsync({});
      console.log("location coords:", location.coords);
      this.setState({
        locationGranted: true,
        currentLocation: { ...location.coords },
      });
    }
  };

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        ...this.state,
        locationGranted: false,
        errorMessage: "Permission to access location was denied",
      });
    } else {
      //TODO: this fails if we don't have GPS or if data/wifi is turned off.
      // check how to handle this error.
      let location = await Loc.getCurrentPositionAsync({});
      console.log("got location:", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      this.setState({
        locationGranted: true,
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
    }
  };

  render() {
    if (this.state.locationGranted) {
      return (
        <MapView
          ref={map=> {this.map = map}}
          showsUserLocation={true}
          showsCompass={true}
          style={styles.mapStyle}
          cacheEnabled={false}
          zoomEnabled={false}
          zoomTapEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          loadingEnabled={true}
          onMapReady={() => this.setState({ mapReady: true })}
        >
        </MapView>
      );
    } else {
      return (
        <View style={styles.mapContainer}>
          <TouchableOpacity
            onPress={this._getLocationAsync}
            style={styles.locationButton}
          >
            <Text style={styles.buttonText}>Request Location Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }
}

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
