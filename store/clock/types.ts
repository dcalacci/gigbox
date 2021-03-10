export enum ClockActionTypes {
  StartShift = "START_SHIFT",
  StopShift = "STOP_SHIFT",
  AddEmployers = "ADD_EMPLOYERS",
  SetEmployers = "SET_EMPLOYERS",
  AddLocations = "ADD_LOCATIONS"
}

export interface LocationRecord {
    lat: number,
    lng: number,
    timestamp: number,
    accuracy: number
}

export interface StartShiftAction {
    type: typeof ClockActionTypes.StartShift,
    meta: {
        timestamp: Date
    }
}

export interface StopShiftAction {
    type: typeof ClockActionTypes.StopShift,
    meta: {
        timestamp: Date
    }
}

export interface AddLocationAction {
    type: typeof ClockActionTypes.AddLocations;
    locations: LocationRecord[];
}

export interface SetEmployersAction {
    type: typeof ClockActionTypes.SetEmployers;
    payload: Employers[]
}

export type ClockAction = StartShiftAction | StopShiftAction | SetEmployersAction | AddLocationAction

export interface PreviousShift {
    startTime: Date;
    endTime: Date;
    milesTracked: number;
    employers: Employers[];
    locations: LocationRecord[];
}
export interface ClockState {
  startTime: Date;
  milesTracked: number;
  employers: Employers[];
  locations: LocationRecord[];
  active: boolean;
  previousShifts: PreviousShift[]
}

export enum Employers {
  Instacart,
  DoorDash,
  GrubHub,
  Postmates,
  UberEats,
  Shipt,
  Favor,
}
