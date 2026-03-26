import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a video");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      setStatus("Uploading...");

      const res = await axios.post(
        "http://localhost:3000/api/videos/upload",
        formData
      );

      const videoId = res.data.videoId;

      setStatus("Processing...");

      // 🔁 Polling every 5 sec
      const interval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `http://localhost:3000/api/videos/${videoId}/status`
          );

          if (statusRes.data.status === "Processing") {
            setStatus("Processing...");
          }

          if (statusRes.data.status === "Ready") {
            clearInterval(interval);
            setStatus("Ready!");

            navigate(`/watch/${videoId}`);
          }
        } catch (err) {
          console.error(err);
        }
      }, 5000);
    } catch (error) {
      console.error(error);
      setStatus("Upload failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Video</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Video File: </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Thumbnail (Optional): </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
        />
      </div>

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <p>{status}</p>
    </div>
  );
}