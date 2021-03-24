import { fetchWithQueryParams, uri } from "../../utils"
import { Shift } from '../../features/clock/clockSlice'
import fetch from 'node-fetch'

export interface ShiftResponse {
    shiftCreated: boolean;
    status: number
    shift: Shift
}

export const createShift = async (startTime: string, jwt: string): Promise<ShiftResponse> => {
    const headers = new fetch.Headers({
        'Content-Type': 'application/json',
        authorization: jwt

    })
    const response = await fetch(`${uri}/api/v1/shifts`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ startTime })
        })
    const data = await response.json()
    console.log("Response data:", data)
    return {
        shiftCreated: true,
        status: 200,
        shift: data.shift
    }
}

//TODO: #5 abstract out authenticated API endpoints with JSON bodies to make writing APi code easier on the frontend
