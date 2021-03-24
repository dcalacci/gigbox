import { createSlice, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import fetch from 'node-fetch'
import { uri } from '../../utils'
import { store } from '../../store/store'
import { LocationObject } from "expo-location";

import { ShiftResponse, createShift } from './api'
import { State } from 'react-native-gesture-handler';
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
    id: string;
    dateCreated: string;
    dateModified: string;
    userId: string;
    startTime: string;
    endTime: string | null;
    active: boolean;
    milesTracked: number;
    employers: Employers[];
    locations: LocationRecord[];
}
export interface ClockState {
    shift: Shift
    previousShifts: Shift[]
}

export const clockIn = createAsyncThunk(
    'clock/clockIn',
    async (startTime: string, thunkApi: any): Promise<ShiftResponse> => {
        const state = thunkApi.getState()
        const data = await createShift(startTime, state.auth.jwt)
        if (data.status != 200) {
            return thunkApi.rejectWithValue(data)
        }
        console.log("created shift:", data)
        return data
    }
)

export const clockOut = createAsyncThunk(
    'clock/clockOut',
    async (endTime: string, thunkApi: any): Promise<any> => {
        const state = thunkApi.getState()
        const response = await fetch(`${uri}/api/v1/shifts`,
            {
                method: 'PUT',
                headers: new fetch.Headers({
                    'Content-Type': 'application/json',
                    authorization: state.auth.jwt
                }),
                body: JSON.stringify({
                    shiftId: state.clock.shift.id,
                    fields: {
                        active: false,
                        endTime: new Date().toISOString()
                    }

                })
            })
        const data = await response.json()
        if (data.updated)
            return { shift: data.shift.new_val }
        else
            return thunkApi.rejectWithValue(false)
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
    shift: {
        active: false,
        employers: [] as Employers[]
    } as Shift,
    previousShifts: [] as Shift[]
};

const clockSlice = createSlice({
    name: 'clock',
    initialState: initialState,
    reducers: {
        reset: (state: ClockState): ClockState => initialState,
        addLocations: (state, action) => {
            state.shift.locations = [...state.shift.locations, ...action.payload]
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(clockIn.fulfilled, (state, action) => {
                state.shift = action.payload.shift
            })
            .addCase(clockOut.fulfilled, (state, action) => {
                // move shift to previous shifts, and change current shift to default
                state.previousShifts.push(action.payload.shift)
                state.shift = initialState.shift
            })
    }
})

export const { reset } = clockSlice.actions
export default clockSlice.reducer
