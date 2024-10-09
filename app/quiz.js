import React, { useState } from "react";
import { View, Text, Button } from "react-native";
import * as Audio from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function QuizScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const router = useRouter();
  const { name, age } = useLocalSearchParams();

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionAsync();
      if (permission.status === "granted") {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      } else {
        alert("请允许录音权限");
      }
    } catch (err) {
      console.log("录音失败", err);
    }
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
    console.log("录音文件保存在:", uri);
  };

  const handleNext = () => {
    if (recordingUri) {
      router.push({ pathname: "/result", params: { name, age, recordingUri } });
    } else {
      alert("请录音");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button
        title={recording ? "停止录音" : "开始录音"}
        onPress={recording ? stopRecording : startRecording}
      />
      <Button title="提交录音" onPress={handleNext} />
    </View>
  );
}
