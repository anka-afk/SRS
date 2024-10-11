import React, { useState, useEffect, useRef } from "react";
import { View, Text, Button, Image, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import "./quiz.css";

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState(""); // 保存转写结果
  const [analyser, setAnalyser] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const canvasRef = useRef(null);

  const router = useRouter();
  const { name, age } = useLocalSearchParams();

  // 获取题目
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

  // 开始录音
  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

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

  // 停止录音
  const stopRecording = async () => {
    try {
      if (Platform.OS === "web" && recording) {
        recording.stop();
        audioContext.close();
        setRecording(null);
        setAnalyser(null);
      }
    } catch (error) {
      console.error("停止录音失败:", error);
    }
  };

  // 频谱图绘制
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

  // 处理下一题逻辑并上传录音
  const handleNext = async () => {
    if (recordingUri) {
      try {
        const currentQuestion = questions[currentQuestionIndex];

        const response = await fetch(recordingUri);
        const audioBlob = await response.blob();

        // 将音频文件上传到后端
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav"); // 指定文件名
        formData.append("question_id", currentQuestion.question_id);

        const result = await axios.post(
          "http://localhost:5000/api/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const transcript = result.data.text;
        setTranscription(transcript); // 保存转写结果
        console.log("语音识别结果:", transcript);

        if (transcript && transcript.includes(currentQuestion.correct_answer)) {
          alert("识别成功，继续下一题！");
          if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            router.push({ pathname: "/result", params: { name, age } });
          }
        } else {
          alert("识别内容不匹配正确答案，请重新录制！");
        }
      } catch (error) {
        console.error("提交录音失败:", error);
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

      {/* 显示转写结果 */}
      {transcription && (
        <div className="transcriptionResult">
          <p>转写结果：{transcription}</p>
        </div>
      )}
    </div>
  );
}
