import { ClockAction, ClockActionTypes } from './types'

export function clockIn(): ClockAction {
    console.log("Clocking in.")
    return {
        type: ClockActionTypes.StartTracking,
        meta: {
            timestamp: new Date()
        }
    }
}

export function clockOut(): ClockAction {
    console.log("Clocking out.")
    return {
        type: ClockActionTypes.StopTracking,
        meta: {
            timestamp: new Date()
        }
    }
}

