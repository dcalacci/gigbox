import { createSlice, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import fetch from 'node-fetch'
import { uri } from '../../utils'

import { ShiftResponse, createShift } from './api'

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

export interface Location {
    timestamp: string;
    point: {
        coordinates: [number, number]
    }
    accuracy: number;
    shiftId: string | null;
    jobId: string | null;
    userId: string | null;
    id: string;
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
    locations: Location[];
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

export const saveLocations = createAsyncThunk(
    'clock/addLocations',
    async (locations: Location[], thunkApi: any): Promise<any> => {
        const state = thunkApi.getState()
        const response = await fetch(`${uri}/api/v1/shifts/locations`,
            {
                method: 'POST',
                headers: new fetch.Headers({
                    'Content-Type': 'application/json',
                    authorization: state.auth.jwt
                }),
                body: JSON.stringify({
                    locations,
                    shiftId: state.clock.shift.id
                })
            })
        const data = await response.json()
        if (data.status == 200)
            return data.locations
        else
            return thunkApi.rejectWithValue(data)
    }
)

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
            .addCase(saveLocations.fulfilled, (state, action) => {
                // not sure why but the mutation shortcut (locations.push(...)) from redux-toolkit didn't work here,
                // so we use deconstruction to recreate our state
                state.shift.locations = [...state.shift.locations, ...action.payload]
            })
    }
})

export const { reset } = clockSlice.actions
export default clockSlice.reducer