import React, { useState } from "react";
import axios from "axios";

export default function AddQuestion() {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [message, setMessage] = useState("");

  const handleMediaChange = (event) => {
    setMediaFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!text || !orderNumber) {
      setMessage("请填写所有必填字段");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);
    formData.append("description", description);
    formData.append("order_number", parseInt(orderNumber, 10));
    formData.append("show_spectrum", showSpectrum);
    Array.from(mediaFiles).forEach((file) => {
      formData.append("media_files", file);
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/questions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage(response.data.message);
      setText("");
      setDescription("");
      setOrderNumber("");
      setShowSpectrum(false);
      setMediaFiles([]);
    } catch (error) {
      console.error("Failed to upload question:", error);
      setMessage("题目上传失败，请重试");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>添加新题目</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          题目文本:
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </label>
        <label>
          题目描述:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          上传图片或视频:
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaChange}
          />
        </label>
        <label>
          是否显示频谱:
          <input
            type="checkbox"
            checked={showSpectrum}
            onChange={(e) => setShowSpectrum(e.target.checked)}
          />
        </label>
        <label>
          顺序:
          <input
            type="number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </label>
        <button type="submit">提交题目</button>
      </form>
    </div>
  );
}
