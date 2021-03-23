import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { tailwind } from "tailwind";

import { RootState } from "../../store/index";
import Toggle from "../../components/Toggle";

import { startShift, stopShift, ClockState } from './clockSlice'
import { formatElapsedTime } from "../../utils";
import {
  startGettingBackgroundLocation,
  stopGettingBackgroundLocation,
} from "../../tasks";

import { requestOtp } from '../auth/authSlice'
import EmployerBoxes from "../../components/EmployerBox";

export default function TrackingBar() {
  const clockState = useSelector((state: RootState): ClockState => state.clock);
  const dispatch = useDispatch();

  const [elapsedTime, setElapsedTime] = useState<string>(
    formatElapsedTime(null)
  );

  // updates the tracking bar time logger every second. Uses useEffect
  // so our setInterval resets on cue.
  useEffect(() => {
    let interval = setInterval(() => {
      const clockTime = new Date(clockState.startTime).getTime()
      const startTimestamp = clockState.active
        ? clockTime
        : null;
      setElapsedTime(formatElapsedTime(startTimestamp));
    }, 1000);
    return () => clearInterval(interval);
  });

  const onTogglePress = () => {
    console.log(clockState);
    dispatch(requestOtp('+19082298992'))
    if (!clockState.active) {
      dispatch(startShift())
      startGettingBackgroundLocation();
    } else {
      dispatch(stopShift(new Date().getTime()));
      stopGettingBackgroundLocation();
    }
  };

  const textStyle = [
    tailwind("text-lg"),
    clockState.active ? tailwind("font-semibold") : null,
  ];

  return (
    <View style={[tailwind(""), clockState.active ? tailwind("bg-green-500") : null]}>
      <View
        style={[
          tailwind("flex-shrink flex-row justify-around items-center border-b-4 p-3 border-green-600 h-16 bg-white"),
          clockState.active ? tailwind("bg-green-500") : null,
        ]}
      >
        <Toggle
          title={clockState.active ? "Tracking Shift" : "Clock In"}
          activeText="On"
          inactiveText="Off"
          value={clockState.active}
          onToggle={() => onTogglePress()}
        />
        <View style={tailwind("flex-grow-0")}>
          <Text style={textStyle}>0.0mi</Text>
          <Text style={textStyle}>{elapsedTime}</Text>
        </View>
      </View>
      <EmployerBoxes hidden={!clockState.active} />
    </View>
  );
}
