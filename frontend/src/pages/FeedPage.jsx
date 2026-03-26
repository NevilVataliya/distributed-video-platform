import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function FeedPage() {
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/videos"
        );
        setVideos(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Video Feed</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "15px",
        }}
      >
        {videos.map((video) => (
          <div
            key={video._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/watch/${video._id}`)}
          >
            <p>{video.title || "Untitled Video"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}