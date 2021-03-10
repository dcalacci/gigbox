import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { tailwind } from "tailwind";

import { RootState } from "../store/index";
import Toggle from "../components/Toggle";
import { clockIn, clockOut } from "../store/clock/actions";

import { ClockState } from "../store/clock/types";
import { formatElapsedTime } from "../utils";
import {
  startGettingBackgroundLocation,
  stopGettingBackgroundLocation,
} from "../tasks";
import EmployerBoxes from "./EmployerBox";

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
  }, [elapsedTime]);

  const onTogglePress = () => {
    console.log(clockState);
    if (!clockState.active) {
      dispatch(clockIn());
      startGettingBackgroundLocation();
    } else {
      dispatch(clockOut());
      stopGettingBackgroundLocation();
    }
  };

  const textStyle = [
    tailwind("text-lg"),
    clockState.active ? tailwind("font-semibold") : null,
  ];

  return (
    <>
      <View
        style={[
          tailwind("flex-shrink flex-row justify-around items-center p-2 border-b-2 border-green-600"),
          clockState.active ? tailwind("bg-green-400 border-0 p-3") : null,
        ]}
      >
        <Toggle
          title="Clock In"
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
      <EmployerBoxes hidden={!clockState.active}/>
    </>
  );
}
