import { createSlice, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { LocationObject } from "expo-location";

import { CreateShiftResponse, createShift } from './api'
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

export interface Shift {
    startTime: number;
    endTime: number | null;
    active: boolean;
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
    previousShifts: Shift[];
}

// ACTIONS
export const startShift = createAction('clock/startShift')
export const stopShift = createAction<number>('clock/stopShift')
export const addLocations = createAction<LocationRecord[]>('clock/addLocations')
export const setEmployers = createAction<Employers[]>('clock/setEmployers')

export type ClockAction = | typeof startShift | typeof stopShift | typeof addLocations | typeof setEmployers

export const makeShift = createAsyncThunk(
    'clock/createShift',
    async (shift: Shift, thunkApi: any): Promise<CreateShiftResponse> => {
        const data = await createShift(shift)
        if (data.status != 200) {
            return thunkApi.rejectWithValue(data)
        }
        console.log("created shift:", shift)
        return data
    }
)

// export const saveLocationsToShift = createAsyncThunk(
//     'clock/addLocations',
//     async (shiftId: string, locations: LocationObject[]): Promise<AddLocationsResponse> => {
//         const data = addLocationsToShift(shiftId, locations)
//     }
// )

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
    }, 
    extraReducers: (builder) => {
        builder
        .addCase(makeShift.fulfilled, (state, action) => {
            console.log("make shift fulfilled:", action)
        })
    }
})

export const {reset} = clockSlice.actions
export default clockSlice.reducer
