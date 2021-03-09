import * as React from "react";
import { View, Text } from "react-native";
import { tailwind } from "tailwind";
import Toggle from "../components/Toggle";

export default function TrackingBar() {
  const onToggle = (active: boolean) => {
    console.log("Active?", active);
  };

  return (
    <View
      style={tailwind(
        "flex-auto flex-row overflow-scroll justify-around items-center m-2"
      )}
    >
      <Toggle
        title="Clock In"
        activeText="Off"
        inactiveText="On"
        defaultValue={false}
        onToggle={onToggle}
      />
      <View>
          <Text style={tailwind("text-lg")}>0.0mi</Text>
        <Text style={tailwind("text-lg")}>12:00</Text>
      </View>
    </View>
  );
}
