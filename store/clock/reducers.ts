import { ClockState, ClockActionTypes, ClockAction, Employers } from "./types";

const initialState: ClockState = {
  startTime: new Date(),
  milesTracked: 0,
  employers: [Employers.Instacart, Employers.Postmates],
  active: false,
  previousShifts: [],
  locations: []
};

export function ClockReducer(
  state = initialState,
  action: ClockAction
): ClockState {
  switch (action.type) {
    case ClockActionTypes.StartShift:
      return {
        ...state,
        startTime: action.meta.timestamp,
        active: true,
      };
    case ClockActionTypes.StopShift:
      //TODO submit tracked period
      return {
        ...state,
        active: false,
        locations: [],
        milesTracked: 0,
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
