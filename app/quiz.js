import React, { useState, useEffect, useRef } from "react";
import { View, Text, Button, Image, Platform } from "react-native";
import { Video } from "expo-av";
import * as Audio from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import "./quiz.css";

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyser, setAnalyser] = useState(null); // 用于音频分析
  const [audioContext, setAudioContext] = useState(null); // 音频上下文
  const canvasRef = useRef(null); // 频谱图 Canvas

  const router = useRouter();
  const { name, age } = useLocalSearchParams();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/questions");
        const updatedQuestions = response.data.map((question) => ({
          ...question,
          media_files: question.media_files.map(
            (file) => `http://localhost:5000${file}`
          ),
        }));
        setQuestions(updatedQuestions);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };
    fetchQuestions();
  }, []);

  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // 创建AudioContext和AnalyserNode
        const audioCtx = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 2048;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        setAudioContext(audioCtx);
        setAnalyser(analyserNode);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        mediaRecorder.ondataavailable = (event) => {
          const audioUrl = URL.createObjectURL(event.data);
          setRecordingUri(audioUrl);
          console.log("录音文件保存在:", audioUrl);
        };

        setRecording(mediaRecorder);
        drawSpectrum(analyserNode);
      }
    } catch (err) {
      console.log("录音失败", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (Platform.OS === "web" && recording) {
        recording.stop();
        audioContext.close(); // 停止音频上下文
        setRecording(null);
        setAnalyser(null); // 停止分析
      }
    } catch (error) {
      console.error("停止录音失败:", error);
    }
  };

  // 画频谱图的函数
  const drawSpectrum = (analyserNode) => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = "rgb(0, 0, 0)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        canvasCtx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        canvasCtx.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2
        );
        x += barWidth + 1;
      }
    };

    draw();
  };

  const handleNext = async () => {
    if (recordingUri) {
      try {
        const currentQuestion = questions[currentQuestionIndex];
        const formData = new FormData();
        formData.append("user_id", name);
        formData.append("question_id", currentQuestion.question_id);

        if (Platform.OS === "web") {
          const response = await fetch(recordingUri);
          const blob = await response.blob();
          formData.append(
            "recording",
            blob,
            `${currentQuestion.question_id}-${Date.now()}.webm`
          );
        } else {
          formData.append("recording", {
            uri: recordingUri,
            name: `${currentQuestion.question_id}-${Date.now()}.m4a`,
            type: "audio/m4a",
          });
        }

        await axios.post("http://localhost:5000/api/recordings", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setRecordingUri(null);

        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          router.push({ pathname: "/result", params: { name, age } });
        }
      } catch (error) {
        console.error("Failed to submit recording:", error);
      }
    } else {
      alert("请录音");
    }
  };

  if (loading) {
    return (
      <View className="loading-container">
        <Text>加载题目中...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="no-questions-container">
        <Text>没有可用的题目</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container">
      <div className="questionContainer">
        <p className="questionText">{currentQuestion.text}</p>
        <p className="descriptionText">{currentQuestion.description}</p>

        <div className="mediaContainer scrollable">
          {currentQuestion.media_files.map((media, index) =>
            media.endsWith(".mp4") ? (
              <video key={index} controls className="video">
                <source src={media} type="video/mp4" />
              </video>
            ) : (
              <img
                key={index}
                src={media}
                alt={`media-${index}`}
                className="image"
              />
            )
          )}
        </div>
      </div>

      {/* 新增频谱图显示 */}
      <canvas
        ref={canvasRef}
        width="500"
        height="200"
        className="spectrumCanvas"
      ></canvas>

      <div className="buttonContainer">
        <button
          className="button"
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "停止录音" : "开始录音"}
        </button>
        <button
          className="button submitButton"
          onClick={handleNext}
          disabled={!recordingUri}
        >
          提交录音
        </button>
      </div>

      <p className="progressText">
        当前题目 {currentQuestionIndex + 1} / {questions.length}
      </p>
    </div>
  );
}
