import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { tailwind } from "tailwind";

import { RootState } from "../store/index";
import Toggle from "../components/Toggle";
import { clockIn, clockOut } from "../store/clock/actions";

export default function TrackingBar() {
  const clockState = useSelector((state: RootState) => state.clock);
  const dispatch = useDispatch();

  const getElapsedTime = ():string => {
    const now = new Date()
    const startTime = new Date(clockState.startTime)
    if (clockState.startTime !== null) {
      // strip milliseconds
      let timeDiff = (now.getTime() - startTime.getTime())/1000
      //var timeStr = timeDiff.toTimeString().split(' ')[0];
      const seconds = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);
      var minutes = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);
      var hours = Math.round(timeDiff % 24);
      const timestr = `${hours}h ${minutes}m`
      return timestr
    } else {
      return "0h 0m"
    }
  }

  const [elapsedTime, setElapsedTime] = useState<string>(getElapsedTime())

  useEffect(() => {
    let interval = setInterval(() => {
      setElapsedTime(getElapsedTime())
    }, 1000);
    return () => clearInterval(interval)
  }, [elapsedTime])

  const onTogglePress = () => {
    console.log(clockState)
    if (!clockState.active) {
      dispatch(clockIn());
    } else {
      dispatch(clockOut());
    }
  };

  const textStyle = [tailwind("text-lg"), clockState.active ? tailwind("font-semibold") : ""]

  return (
    <View
      style={[tailwind(
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
