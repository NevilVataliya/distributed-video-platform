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
              borderRadius: "10px",
            }}
            onClick={() => navigate(`/watch/${video._id}`)}
          >
            {video.thumbnail ? (
              <img 
                src={video.thumbnail}
                alt="Thumbnail"
                style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }}
              />
            ) : (
              <div style={{ width: "100%", height: "200px", backgroundColor: "#eee", borderRadius: "8px", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span>No Thumbnail</span>
              </div>
            )}
            <p style={{ fontWeight: "bold", margin: 0 }}>{video.title || "Untitled Video"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}