import { useEffect, useState } from "react";
import "./ProfileAvatar.css";

const ProfileAvatar = ({
  user,
  size = 44,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const avatar = user?.avatar || "";

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const initial = (user?.name || "U")
    .trim()
    .charAt(0)
    .toUpperCase() || "U";

  return (
    <div
      className={`common-profile-avatar ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: size * 0.42,
      }}
    >
      {avatar && !imageError ? (
        <img
          src={avatar}
          alt={`${user?.name || "User"} profile`}
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export default ProfileAvatar;