import { ConsentFlow } from "../features/consent/ConsentFlow";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tailwind } from "tailwind";
import PhoneEntry from "../features/auth/PhoneEntry"

export default function OnboardingScreen() {
  const [onboarded, setOnboarded] = useState(false)
  return (
    <View style={tailwind("bg-white h-full")}>
      <SafeAreaView
        style={tailwind("pt-10 bg-white")}
      >
        {onboarded ? 
        <PhoneEntry />
        :
        <ConsentFlow/>
        }
      </SafeAreaView>
    </View >
  );
}
