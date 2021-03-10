import { ClockAction, ClockActionTypes, LocationRecord } from './types'

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

export function addLocations(locs: LocationRecord[]): ClockAction {
    console.log("locs in action:", locs)
    return {
        type: ClockActionTypes.AddLocations,
        locations: locs
    }
}

