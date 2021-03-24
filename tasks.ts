import * as Loc from "expo-location";
import { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { saveLocations, Location } from "./features/clock/clockSlice";
import { grantLocationPermissions, denyLocationPermissions } from './features/auth/authSlice'
import { store } from "./store/store";
import * as Permissions from "expo-permissions"


//TODO: #6 occasionally tasks show up as undefined, or as being not registered on app reload.
// not sure why this is.
TaskManager.isTaskRegisteredAsync("gigbox.mileageTracker").then(
  (isRegistered) => {
    if (isRegistered) {
      console.log("gigbox mileage task already registered.");
    } else {
      TaskManager.defineTask("gigbox.mileageTracker", ({ data, error }) => {
        if (error) {
          console.log("error message:", error.message);
          return;
        }
        const state = store.getState();
        if (state.clock.shift.active) {
          let locs = data.locations.map((location: LocationObject) => {
            let obj = {
              point: {
                coordinates: [
                  location.coords.longitude,
                  location.coords.latitude]
              },
              timestamp: location.timestamp,
              accuracy: location.coords.accuracy,
            };
            return obj;
          }) as Location[];
          console.log("dispatching save locations, ...", locs)
          store.dispatch(saveLocations(locs))
        }
      });
    }
  }
);

const askPermissions = async () => {
  const state = store.getState();
  const { status, granted } = await Permissions.askAsync(
    Permissions.LOCATION
  );
  if (status === "granted") {
    store.dispatch(grantLocationPermissions())
  } else {
    store.dispatch(denyLocationPermissions())
  }
};

/**
 * Creates a new background location task using Expo's `startLocationUpdatesAsync`.
 *
 * The task is titled "gigbox.mileageTracker", uses Loc.Accuracy.Balanced, and
 * includes a foreground notification service.
 */
export const startGettingBackgroundLocation = async () => {
  await askPermissions()
  Loc.startLocationUpdatesAsync("gigbox.mileageTracker", {
    accuracy: Loc.Accuracy.Balanced,
    timeInterval: 10000,
    foregroundService: {
      notificationTitle: "Gigbox is tracking your mileage",
      notificationBody:
        "MIT Gigbox is using your location to track your mileage and work shifts.",
      notificationColor: "#ffffff",
    },
    activityType: Loc.ActivityType.AutomotiveNavigation,
  }).then(() => console.log("Location task registered."));
};

/**
 * Stops background location task
 */
export const stopGettingBackgroundLocation = () => {
  Loc.stopLocationUpdatesAsync("gigbox.mileageTracker");
};
