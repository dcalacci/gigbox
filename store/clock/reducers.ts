import { LocationSubscriber } from "expo-location/build/LocationSubscribers";
import { ClockState, ClockActionTypes, ClockAction } from "./types";

const initialState: ClockState = {
  startTime: new Date(),
  milesTracked: 0,
  employers: [],
  active: false,
  previousShifts: [],
  locations: []
};

export function ClockReducer(
  state = initialState,
  action: ClockAction
): ClockState {
  switch (action.type) {
    case ClockActionTypes.StartTracking:
      return {
        ...state,
        startTime: action.meta.timestamp,
        active: true,
      };
    case ClockActionTypes.StopTracking:
      //todo submit tracked period
      return {
        ...state,
        active: false,
        previousShifts: [
          ...state.previousShifts,
          {
            startTime: state.startTime,
            endTime: new Date(),
            milesTracked: state.milesTracked,
            employers: state.employers,
            locations: state.locations
          },
        ],
      };
    case ClockActionTypes.AddLocations:
      return {
        ...state,
        locations: [
            ...state.locations, 
            ...action.locations],
      };

    default:
      return state;
  }
}
