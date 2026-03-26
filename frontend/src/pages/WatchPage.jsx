import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

export default function WatchPage() {
  const { videoId } = useParams();

  const hlsUrl = `http://localhost:9000/processed-videos/${videoId}/playlist.m3u8`;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Watch Video</h2>
      <VideoPlayer src={hlsUrl} />
    </div>
  );
}