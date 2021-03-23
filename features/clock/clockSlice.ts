import { createSlice, createAction } from '@reduxjs/toolkit'

// TYPES
export enum Employers {
    Instacart = "Instacart",
    DoorDash = "DoorDash",
    GrubHub = "GrubHub",
    Postmates = "Postmates",
    UberEats = "UberEats",
    Shipt = "Shipt",
    Favor = "Favor",
}

export interface LocationRecord {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy: number;
}

export interface PreviousShift {
    startTime: number;
    endTime: number;
    milesTracked: number;
    employers: Employers[];
    locations: LocationRecord[];
}
export interface ClockState {
    startTime: number;
    milesTracked: number;
    employers: Employers[];
    locations: LocationRecord[];
    active: boolean;
    previousShifts: PreviousShift[];
}

// ACTIONS
export const startShift = createAction('clock/startShift')
export const stopShift = createAction<number>('clock/stopShift')
export const addLocations = createAction<LocationRecord[]>('clock/addLocations')
export const setEmployers = createAction<Employers[]>('clock/setEmployers')

export type ClockAction = | typeof startShift | typeof stopShift | typeof addLocations | typeof setEmployers


// SLICE
const initialState: ClockState = {
    startTime: new Date().getTime(),
    // milesTracked: 0,
    employers: [Employers.Instacart, Employers.Postmates],
    active: false,
    previousShifts: [],
    milesTracked: 0,
    locations: [],
};

const clockSlice = createSlice({
    name: 'clock',
    initialState: initialState,
    reducers: {
        reset: (state: ClockState): ClockState => initialState,
        startShift: (state) => {
            state.startTime = new Date().getTime()
            state.active = true
        },
        stopShift: (state, action) => {
            console.log("STOPPED SHIFT")
            //TODO: send previous shift to database
            state = initialState
            return state
        },
        addLocations: (state, action) => {
            state.locations = [...state.locations, ...action.payload]
        }
    }
})

export const {reset} = clockSlice.actions
export default clockSlice.reducer
