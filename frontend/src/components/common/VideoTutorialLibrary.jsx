
import { useEffect, useState } from "react";
import {
  Play,
  LoaderCircle,
  ExternalLink,
  Video,
} from "lucide-react";
import api from "../../services/api";
import "./VideoTutorialLibrary.css";

const VideoTutorialLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/video-tutorials/published");

      if (response.data?.success) {
        setVideos(response.data.videos || []);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error("Video tutorials error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load video tutorials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="video-library-page">
      <div className="video-library-header">
        <div>
          <div className="video-library-eyebrow">
            <Video size={15} />
            LEARNING RESOURCES
          </div>

          <h1>Video Tutorials</h1>

          <p>
            Watch helpful video tutorials shared by Skillselephant.
          </p>
        </div>

        <div className="video-library-count">
          <Video size={18} />
          <span>{videos.length} Videos</span>
        </div>
      </div>

      {loading ? (
        <div className="video-library-loading">
          <LoaderCircle
            size={30}
            className="video-library-spinner"
          />
          <span>Loading video tutorials...</span>
        </div>
      ) : error ? (
        <div className="video-library-empty">
          <div className="video-library-empty-icon">
            <Video size={32} />
          </div>

          <h3>Unable to load videos</h3>
          <p>{error}</p>

          <button
            type="button"
            className="video-library-retry"
            onClick={fetchVideos}
          >
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="video-library-empty">
          <div className="video-library-empty-icon">
            <Video size={34} />
          </div>

          <h3>No video tutorials available</h3>

          <p>
            Video tutorials will appear here when they are shared
            by your administrator.
          </p>
        </div>
      ) : (
        <div className="video-library-grid">
          {videos.map((video) => {
            const thumbnail =
              video.thumbnail ||
              `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

            return (
              <a
                key={video._id}
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="video-library-card"
                aria-label={`Watch ${video.title} on YouTube`}
              >
                <div className="video-library-thumbnail">
                  <img
                    src={thumbnail}
                    alt={video.title}
                    loading="lazy"
                  />

                  <div className="video-library-play">
                    <Play size={27} fill="currentColor" />
                  </div>

                  <div className="video-library-youtube">
                    <Video size={18} />
                    YouTube
                  </div>
                </div>

                <div className="video-library-card-content">
                  <h3>{video.title}</h3>

                  <div className="video-library-watch">
                    <span>
                      <Play size={14} fill="currentColor" />
                      Watch Tutorial
                    </span>

                    <ExternalLink size={15} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoTutorialLibrary;
