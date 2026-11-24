
import { useEffect, useMemo, useState } from "react";
import {
  Play,
  LoaderCircle,
  ExternalLink,
  Video,
  Filter,
  Layers,
  ChevronDown,
    Check,
} from "lucide-react";
import api from "../../services/api";
import "./VideoTutorialLibrary.css";

const VideoTutorialLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [selectedModule, setSelectedModule] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [showModuleFilter, setShowModuleFilter] = useState(false);
  // Fetch published videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/video-tutorials/published"
      );

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

  // Get unique modules from published videos
  const modules = useMemo(() => {
    const moduleMap = new Map();

    videos.forEach((video) => {
      (video.modules || []).forEach((module) => {
        // Module must be populated by backend
        if (!module || typeof module !== "object" || !module._id) {
          return;
        }

        moduleMap.set(String(module._id), module);
      });
    });

    return Array.from(moduleMap.values()).sort(
      (a, b) =>
        Number(a.moduleNumber || 0) -
        Number(b.moduleNumber || 0)
    );
  }, [videos]);

  // Filter videos by selected module
  const filteredVideos = useMemo(() => {
    if (selectedModule === "all") {
      return videos;
    }

    return videos.filter((video) =>
      (video.modules || []).some(
        (module) =>
          String(
            typeof module === "object"
              ? module?._id
              : module
          ) === selectedModule
      )
    );
  }, [videos, selectedModule]);

  return (
    <div className="video-library-page">
      {/* Header */}
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
          <span>{filteredVideos.length} Videos</span>
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
        <>
          {/* Module Filter */}
          <div className="video-library-filter">
            <div className="video-library-filter-heading">
              <div className="video-library-filter-icon">
                <Filter size={17} />
              </div>

              <div>
                <h3>Filter by Module</h3>
                <p>
                  Find tutorials from your required course module.
                </p>
              </div>
            </div>

           

<div className="video-library-filter-dropdown">
  <button
    type="button"
    className={`video-library-filter-trigger ${
      showModuleFilter ? "open" : ""
    }`}
    onClick={() =>
      setShowModuleFilter((prev) => !prev)
    }
    aria-expanded={showModuleFilter}
  >
    <span className="video-library-filter-current">
      <Layers size={17} />

      <span>
        {selectedModule === "all"
          ? "All Modules"
          : (() => {
              const module = modules.find(
                (item) =>
                  String(item._id) === selectedModule
              );

              return module
                ? `Module ${module.moduleNumber}: ${module.name}`
                : "All Modules";
            })()}
      </span>
    </span>

    <ChevronDown
      size={18}
      className={showModuleFilter ? "rotated" : ""}
    />
  </button>

  {showModuleFilter && (
    <div className="video-library-filter-menu">
      <button
        type="button"
        className={`video-library-filter-option ${
          selectedModule === "all" ? "active" : ""
        }`}
        onClick={() => {
          setSelectedModule("all");
          setShowModuleFilter(false);
        }}
      >
        <span>All Modules</span>

        {selectedModule === "all" && (
          <Check size={17} />
        )}
      </button>

      {modules.map((module) => {
        const isSelected =
          selectedModule === String(module._id);

        return (
          <button
            type="button"
            key={module._id}
            className={`video-library-filter-option ${
              isSelected ? "active" : ""
            }`}
            onClick={() => {
              setSelectedModule(String(module._id));
              setShowModuleFilter(false);
            }}
          >
            <span>
              Module {module.moduleNumber}: {module.name}
            </span>

            {isSelected && <Check size={17} />}
          </button>
        );
      })}
    </div>
  )}
</div>


          </div>

          {/* Video Grid */}
          {filteredVideos.length === 0 ? (
            <div className="video-library-empty video-library-filter-empty">
              <div className="video-library-empty-icon">
                <Video size={34} />
              </div>

              <h3>No videos in this module</h3>

              <p>
                No tutorials have been assigned to this module yet.
              </p>

              <button
                type="button"
                className="video-library-retry"
                onClick={() => setSelectedModule("all")}
              >
                View All Videos
              </button>
            </div>
          ) : (
            <div className="video-library-grid">
              {filteredVideos.map((video) => {
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

                      {/* Assigned Modules */}
                      {video.modules?.length > 0 && (
                        <div className="video-library-card-modules">
                          {video.modules.map((module) => {
                            if (
                              !module ||
                              typeof module !== "object"
                            ) {
                              return null;
                            }

                            return (
                              <span key={module._id}>
                                Module {module.moduleNumber}: {module.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

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
        </>
      )}
    </div>
  );
};

export default VideoTutorialLibrary;
