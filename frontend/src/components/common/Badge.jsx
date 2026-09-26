import "./Badge.css";

const Badge = ({
  children,
  variant = "default",
  size = "medium",
  className = "",
}) => {
  return (
    <span
      className={[
        "se-badge",
        `se-badge-${variant}`,
        `se-badge-${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
};

export default Badge;