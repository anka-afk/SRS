import React from "react";
import { View, Text } from "react-native";

const ResultScreen = ({ route }) => {
  const { name, age, recordingUri } = route.params;

  return (
    <View style={{ padding: 20 }}>
      <Text>姓名: {name}</Text>
      <Text>年龄: {age}</Text>
      <Text>录音文件位置: {recordingUri}</Text>
    </View>
  );
};
