export enum ClockActionTypes {
  StartTracking = "START_TRACKING",
  StopTracking = "STOP_TRACKING",
  AddEmployers = "ADD_EMPLOYERS",
  SetEmployers = "SET_EMPLOYERS",
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

export interface SetEmployersAction {
    type: typeof ClockActionTypes.SetEmployers,
    payload: Employers[]
}

export type ClockAction = StartTrackingAction | StopTrackingAction | SetEmployersAction

export interface ClockState {
  startTime: Date | null;
  milesTracked: number;
  employers: Employers[];
  active: boolean;
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
