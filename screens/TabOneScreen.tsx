import React, { FunctionComponent } from "react";
import { StyleSheet, Text, ScrollView, View } from "react-native";
import { tailwind } from "tailwind";

import TrackingBar from "../features/clock/TrackingBar";

export default function TabOneScreen() {
  return (
    <View style={tailwind("bg-white")}>
        <TrackingBar/>
          <ScrollView
            style={tailwind("pt-10 bg-white")}
          >
        <Card title={"Hours Worked"} />
        <Card title={"Miles Driven"} />
        <Card title={"Miles Driven"} />
        <Card title={"Miles Driven"} />
        <Card title={"Miles Driven"} />
        <Card title={"Miles Driven"} />
        <Card title={"Miles Driven"} />
      </ScrollView>
    </View>
  );
}

type CardProps = {
  title: string;
};

const Card: FunctionComponent<CardProps> = ({ title }) => (
  <View style={tailwind("flex-1 w-11/12")}>
    <View
      style={tailwind("self-start bg-transparent border w-10/12 h-36")}
    ></View>
    <View
      style={tailwind(
        "self-start absolute bg-transparent border-2 border-green-500 h-36 w-10/12 mt-2 ml-2 p-2"
      )}
    >
      <Text style={tailwind("text-black text-3xl font-bold")}>{title}</Text>
    </View>
  </View>
);
