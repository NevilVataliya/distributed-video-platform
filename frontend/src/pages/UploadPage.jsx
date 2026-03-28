import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext, api } from "../context/AuthContext";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Authentication Required</h2>
        <p style={{marginBottom: "16px"}}>You must be logged in to upload videos.</p>
        <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>Go to Login</Link>
      </div>
    );
  }

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

      const res = await api.post(
        "/videos/upload",
        formData
      );

      const videoId = res.data.videoId;

      setStatus("Processing...");

      // 🔁 Polling every 5 sec
      const interval = setInterval(async () => {
        try {
          const statusRes = await api.get(
            `/videos/${videoId}/status`
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