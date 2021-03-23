import React, { useState, useEffect } from "react";
import { StyleSheet, Text, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tailwind } from "tailwind";
import PhoneEntry from "../components/PhoneEntry"

export default function OnboardingScreen() {
  return (
    <View style={tailwind("bg-white h-full")}>
      <SafeAreaView
        style={tailwind("pt-10 bg-white")}
      >
        <PhoneEntry />
      </SafeAreaView>
    </View >
  );
}
