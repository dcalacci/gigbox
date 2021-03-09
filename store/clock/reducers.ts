import { ClockState, ClockActionTypes, ClockAction } from './types'

const initialState: ClockState = {
    startTime: null,
    milesTracked: 0,
    employers: [],
    active: false
}

export function ClockReducer(
    state = initialState,
    action: ClockAction
): ClockState {
    switch (action.type) {
        case ClockActionTypes.StartTracking:
            return {
                ...state,
                startTime: action.meta.timestamp,
                active: true
            }
        case ClockActionTypes.StopTracking:
            //todo submit tracked period
            return {
                ...state,
                active: false
            }
        default:
            return state
    }
}