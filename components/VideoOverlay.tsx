"use client";

import { useState } from "react";

import videos from "@/data/videos.json";

type VideoOverlayProps = {
  isMapOnly: boolean;
};


type Video = {
  id: number;
  title: string;
  youtubeId: string;
};

export default function VideoOverlay({
  isMapOnly
}: VideoOverlayProps) {

  const videoList = videos as Video[];
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  if (isMapOnly) return null;

  return (
    <>
      <div className="mapAnchor">
        <div className="globalVideoButtonsContent">
          {videoList.map((video) => (
            <button
              key={video.id}
              type="button"
              className="globalVideoButton"
              onClick={() => setActiveVideo(video)}
              title={video.title}
              aria-label={video.title}
            >
              <span className="videoPlayIcon">▶</span>
              <span className="videoTitle">{video.title}</span>
            </button>
          ))}
        </div>
      </div>

      {activeVideo && (
        <div
          className="videoOverlay"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="videoFrame"
            onClick={(event) => event.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}