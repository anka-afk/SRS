import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

const UserInfoScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleNext = () => {
    if (name && age) {
      navigation.navigate("QuizScreen", { name, age });
    } else {
      alert("请输入姓名和年龄");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>请输入姓名:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="姓名"
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />
      <Text>请输入年龄:</Text>
      <TextInput
        value={age}
        onChangeText={setAge}
        placeholder="年龄"
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
      />
      <Button title="下一步" onPress={handleNext} />
    </View>
  );
};

export default UserInfoScreen;
