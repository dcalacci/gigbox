import { ClockAction, ClockActionTypes, LocationRecord } from './types'

export function clockIn(): ClockAction {
    console.log("Clocking in.")
    return {
        type: ClockActionTypes.StartShift,
        meta: {
            timestamp: new Date()
        }
    }
}

export function clockOut(): ClockAction {
    console.log("Clocking out.")
    return {
        type: ClockActionTypes.StopShift,
        meta: {
            timestamp: new Date()
        }
    }
}

export function addLocations(locs: LocationRecord[]): ClockAction {
    console.log("locs in action:", locs)
    return {
        type: ClockActionTypes.AddLocations,
        locations: locs
    }
}

