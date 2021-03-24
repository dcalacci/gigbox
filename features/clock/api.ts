import { fetchWithQueryParams, uri } from "../../utils"
import { Shift } from '../../features/clock/clockSlice'
import { store } from '../../store/store'
import fetch from 'node-fetch'

export interface CreateShiftResponse {
    shiftCreated: boolean;
    status: number
    shift: Shift
}

export const createShift = async (shift: Shift): Promise<CreateShiftResponse> => {
    const state = store.getState()
    const headers = new fetch.Headers({
        'Content-Type': 'application/json',
        authorization: state.auth.jwt

    })
    const response = await fetch(`${uri}/api/v1/shifts`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(shift),
        })
    console.log("response:", response)
    const data = await response.json()
    console.log("Response data:", data)
    return {
        shiftCreated: true,
        status: 200,
        shift: {
            startTime: data.startTime,
            endTime: data.endTime,
            active: data.active,
            milesTracked: 0, //TODO
            employers: [],
            locations: []
        }
    }
}
//TODO: #5 abstract out authenticated API endpoints with JSON bodies to make writing APi code easier on the frontend
