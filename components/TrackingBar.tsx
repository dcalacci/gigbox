import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import * as TaskManager from "expo-task-manager";
import { tailwind } from "tailwind";
import { LocationObject } from "expo-location";
import * as Loc from "expo-location";

import { RootState } from "../store/index";
import Toggle from "../components/Toggle";
import { clockIn, clockOut } from "../store/clock/actions";

import { ClockState } from "../store/clock/types";
import { formatElapsedTime } from "../utils"
import { startGettingBackgroundLocation } from "../tasks"


export default function TrackingBar() {
  const clockState = useSelector((state: RootState) : ClockState => state.clock);
  const dispatch = useDispatch();

  const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(null));

  // updates the tracking bar time logger every second. Uses useEffect
  // so our setInterval resets on cue.
  useEffect(() => {
    let interval = setInterval(() => {
      const startTimestamp = clockState.active ? clockState.startTime : null
      setElapsedTime(formatElapsedTime(startTimestamp));
    }, 1000);
    return () => clearInterval(interval);
  }, [elapsedTime]);

  const onTogglePress = () => {
    console.log(clockState);
    if (!clockState.active) {
      dispatch(clockIn());
      startGettingBackgroundLocation()
    } else {
      dispatch(clockOut());
    }
  };

  const textStyle = [
    tailwind("text-lg"),
    clockState.active ? tailwind("font-semibold") : "",
  ];

  return (
    <View
      style={[
        tailwind(
          "flex-shrink flex-row overflow-scroll justify-around items-center m-2"
        ),
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
  );
}
