import React from "react";
import { View, Image, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  logo: {
      flex: 1,
      width: '100%',
  },
});

type ImageDisplayProps = {
    imageURI: String,
}

export default function DisplayAnImage(props: ImageDisplayProps) {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={{uri: props.imageURI}}
      />
    </View>
  );
}
