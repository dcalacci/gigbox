import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { tailwind } from "tailwind";

type ToggleProps = {
  title: string;
  activeText: string;
  inactiveText: string;
  defaultValue: boolean;
  onToggle(active: boolean): void;
};

const Toggle: React.FC<ToggleProps> = ({
  title,
  activeText,
  inactiveText,
  defaultValue,
  onToggle,
}) => {
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(defaultValue);
  }, [defaultValue]);

  return (
    <View style={tailwind("justify-start flex-row flex-auto")}>
      <Pressable
        onPress={() => {
          setActive(!active);
          onToggle(active);
        }}
        style={tailwind(
          "bg-gray-200 text-sm text-gray-500 border-2 border-gray-200 rounded-full flex-row"
        )}
      >
        <View
          style={[
            tailwind("items-center rounded-l-full px-4 py-2"),
            active ? styles.active : null,
          ]}
        >
          <Text>{activeText}</Text>
        </View>
        <View
          style={[
            tailwind("items-center rounded-l-full px-4 py-2"),
            active ? null : styles.active,
          ]}
        >
          <Text>{inactiveText}</Text>
        </View>
      </Pressable>
      <Text style={tailwind("text-black text-lg font-bold p-1")}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  active: {
    backgroundColor: "white",
    borderRadius: 9999,
    color: "#63b3ed",
  },
});

export default Toggle;
