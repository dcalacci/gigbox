import { createSlice, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import fetch from 'node-fetch'
import { fetchWithQueryParams, uri } from '../../utils'
import { Shift } from '../clock/clockSlice'

interface GetListInput {
    limit: number
    last: string | null
}
export const getShiftList = createAsyncThunk(
    'shiftList/getList',
    async ({ limit, last }: GetListInput, thunkApi: any): Promise<any> => {
        const state = thunkApi.getState()
        const response = await fetchWithQueryParams(`${uri}/api/v1/shifts`,
            { limit, last }, 'GET', new fetch.Headers({
                authorization: state.auth.jwt
            }))
        const data = await response.json()
        console.log("got data on shift list get:", data)
        return data
    }
)

interface ShiftListState {
    shifts: Shift[];
    lastFetched: string;
}

const initialState: ShiftListState = {
    shifts: [] as Shift[],
    lastFetched: ''
}

const shiftSlice = createSlice({
    name: 'shiftList',
    initialState: initialState,
    reducers: {
        reset: (state: ShiftListState): ShiftListState => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(getShiftList.fulfilled, (state, action) => {
                console.log("getShiftList fulfilled:", action)
                state.shifts = action.payload
            })
            .addCase(getShiftList.rejected, (state, action) => {
                console.log("getShiftList rejected:", action)
            })
    }
})

export default shiftSlice.reducer