import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  uploadProfilePhoto,
  removeProfilePhoto,
} from "../../services/authApi";

import ProfileAvatar from "./ProfileAvatar";

import "./ProfilePhotoUpload.css";

const ProfilePhotoUpload = ({ onUpdated }) => {
  const { user, updateUser } = useAuth();

  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WebP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setProgress(0);

      const response = await uploadProfilePhoto(
        selectedFile,
        (event) => {
          if (event.total) {
            setProgress(
              Math.round(
                (event.loaded * 100) / event.total
              )
            );
          }
        }
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      updateUser(response.user);
onUpdated?.(response.user);
      setSelectedFile(null);
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("Profile photo updated successfully.");

    } catch (err) {
      setError(
        err.message || "Unable to upload profile photo."
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!user?.avatar) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await removeProfilePhoto();

      if (!response.success) {
        throw new Error(response.message);
      }

      updateUser(response.user);
      onUpdated?.(response.user);

      setSelectedFile(null);
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("Profile photo removed successfully.");

    } catch (err) {
      setError(
        err.message || "Unable to remove profile photo."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="profile-photo-upload">

      <div className="profile-photo-preview">
        {preview ? (
          <img src={preview} alt="Selected profile" />
        ) : (
          <ProfileAvatar user={user} size={120} />
        )}
      </div>

      <div className="profile-photo-content">
        <h3>Profile Photo</h3>

        <p>
          Upload a professional photo for your portal profile.
          JPG, PNG or WebP. Maximum 5 MB.
        </p>

        <div className="profile-photo-actions">

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="photo-btn photo-btn-primary"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={17} />
            {user?.avatar ? "Change Photo" : "Choose Photo"}
          </button>

          {selectedFile && (
            <>
              <button
                type="button"
                className="photo-btn photo-btn-save"
                disabled={loading}
                onClick={handleUpload}
              >
                <Upload size={17} />
                {loading ? "Uploading..." : "Save Photo"}
              </button>

              <button
                type="button"
                className="photo-btn photo-btn-cancel"
                disabled={loading}
                onClick={cancelPreview}
              >
                <X size={17} />
                Cancel
              </button>
            </>
          )}

          {user?.avatar && !selectedFile && (
            <button
              type="button"
              className="photo-btn photo-btn-remove"
              disabled={loading}
              onClick={handleRemove}
            >
              <Trash2 size={17} />
              Remove Photo
            </button>
          )}
        </div>

        {loading && (
          <div className="photo-progress">
            <div className="photo-progress-track">
              <div
                className="photo-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span>{progress}%</span>
          </div>
        )}

        {message && (
          <p className="photo-success">{message}</p>
        )}

        {error && (
          <p className="photo-error">{error}</p>
        )}

      </div>
    </div>
  );
};

export default ProfilePhotoUpload;