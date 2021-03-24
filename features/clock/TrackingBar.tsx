import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { tailwind } from "tailwind";

import { RootState } from "../../store/index";
import Toggle from "../../components/Toggle";

import { clockIn, clockOut, Shift } from './clockSlice'
import { formatElapsedTime } from "../../utils";
import {
  startGettingBackgroundLocation,
  stopGettingBackgroundLocation,
} from "../../tasks";

import EmployerBoxes from "../../components/EmployerBox";

export default function TrackingBar() {
  const shift = useSelector((state: RootState): Shift => state.clock.shift);
  const dispatch = useDispatch();

  const [elapsedTime, setElapsedTime] = useState<string>(
    formatElapsedTime(null)
  );

  // updates the tracking bar time logger every second. Uses useEffect
  // so our setInterval resets on cue.
  useEffect(() => {
    let interval = setInterval(() => {
      const clockTime = new Date(shift.startTime).getTime()
      const startTimestamp = shift.active
        ? clockTime
        : null;
      setElapsedTime(formatElapsedTime(startTimestamp));
    }, 1000);
    return () => clearInterval(interval);
  });

  const onTogglePress = () => {
    if (!shift.active) {
      dispatch(clockIn(new Date().toISOString()))
      startGettingBackgroundLocation();
    } else {
      dispatch(clockOut(new Date().toISOString()));
      stopGettingBackgroundLocation();
    }
  };

  const textStyle = [
    tailwind("text-lg"),
    shift.active ? tailwind("font-semibold") : null,
  ];

  return (
    <View style={[tailwind(""), shift.active ? tailwind("bg-green-500") : null]}>
      <View
        style={[
          tailwind("flex-shrink flex-row justify-around items-center border-b-4 p-3 border-green-600 h-16 bg-white"),
          shift.active ? tailwind("bg-green-500") : null,
        ]}
      >
        <Toggle
          title={shift.active ? "Tracking Shift" : "Clock In"}
          activeText="On"
          inactiveText="Off"
          value={shift.active}
          onToggle={() => onTogglePress()}
        />
        <View style={tailwind("flex-grow-0")}>
          <Text style={textStyle}>0.0mi</Text>
          <Text style={textStyle}>{elapsedTime}</Text>
        </View>
      </View>
      <EmployerBoxes hidden={!shift.active} />
    </View>
  );
}
