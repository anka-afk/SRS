import React, { useState } from "react";
import { View, Text, Image, Button } from "react-native";
import * as Audio from "expo-av";

const QuizScreen = ({ route, navigation }) => {
  const { name, age } = route.params;
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionAsync();
      if (permission.status === "granted") {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      } else {
        alert("需要麦克风权限");
      }
    } catch (err) {
      console.error("录音失败", err);
    }
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    serRecording(null);
    console.log("录音文件保存在:", uri);
  };

  const handleSubmit = () => {
    if (recordingUri) {
      navigation.navigate("ResultScreen", { name, age, recordingUri });
    } else {
      alert("请先录音");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>题目</Text>
      <Image source={{ uri: "待定地址" }} style={{ width: 300, height: 300 }} />

      <Button
        title={recording ? "停止录音" : "开始录音"}
        onPress={recording ? stopRecording : startRecording}
      />

      <Button title="提交录音" onPress={handleSubmit} />
    </View>
  );
};
