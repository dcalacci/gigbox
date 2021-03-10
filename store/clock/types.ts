export enum ClockActionTypes {
  StartTracking = "START_TRACKING",
  StopTracking = "STOP_TRACKING",
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

export interface StartTrackingAction {
    type: typeof ClockActionTypes.StartTracking,
    meta: {
        timestamp: Date
    }
}

export interface StopTrackingAction {
    type: typeof ClockActionTypes.StopTracking,
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

export type ClockAction = StartTrackingAction | StopTrackingAction | SetEmployersAction | AddLocationAction

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
