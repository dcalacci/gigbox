import * as Loc from "expo-location";
import { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { addLocations } from "./store/clock/actions";
import { store } from "./store/store";

TaskManager.defineTask(
  "gigbox.mileageTracker",
  ({ data: { locations }, error }) => {
    if (error) {
      console.log("error message:", error.message);
      // check `error.message` for more details.
      return;
    }
    let locs = locations.map((location: LocationObject) => {
      let obj = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy,
      };
      return obj;
    });
    const state = store.getState();
    if (state.clock.active) {
      store.dispatch(addLocations(locs));
    }
  }
);

/**
 * Creates a new background location task using Expo's `startLocationUpdatesAsync`. 
 * 
 * The task is titled "gigbox.mileageTracker", uses Loc.Accuracy.Balanced, and 
 * includes a foreground notification service.
 */
export const startGettingBackgroundLocation = () => {
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
    Loc.stopLocationUpdatesAsync("gigbox.mileageTracker")
}
