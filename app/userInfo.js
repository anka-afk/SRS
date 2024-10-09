// UserInfoScreen.js
import React, { useState } from "react";
import { Container, Form, Button, Alert } from "react-bootstrap";
import { useRouter } from "expo-router";
import "./userInfo.css";

export default function UserInfoScreen() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const router = useRouter();
  const [error, setError] = useState("");

  const handleNext = () => {
    if (name && age) {
      router.push({ pathname: "/quiz", params: { name, age } });
    } else {
      setError("请输入姓名和年龄");
    }
  };

  return (
    <Container className="user-info-container">
      <h2 className="text-center">用户信息</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form>
        <Form.Group controlId="formName">
          <Form.Label>请输入姓名:</Form.Label>
          <Form.Control
            type="text"
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formAge" className="mt-3">
          <Form.Label>请输入年龄:</Form.Label>
          <Form.Control
            type="number"
            placeholder="年龄"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" className="mt-4 w-100" onClick={handleNext}>
          下一步
        </Button>
      </Form>
    </Container>
  );
}
