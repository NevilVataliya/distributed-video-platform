import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default function VideoPlayer({ src }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current && containerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      containerRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        controls: true,
        fluid: true,
        autoplay: false,
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || !src) return;

    playerRef.current.src({
      src,
      type: "application/x-mpegURL",
    });
    playerRef.current.load();
  }, [src]);

  return (
    <div data-vjs-player>
      <div ref={containerRef} />
    </div>
  );
}