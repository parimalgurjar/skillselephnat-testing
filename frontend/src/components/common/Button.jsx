import { Loader2 } from "lucide-react";
import "./Button.css";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  onClick,
  className = "",
}) => {
  const classes = [
    "se-button",
    `se-button-${variant}`,
    `se-button-${size}`,
    fullWidth ? "se-button-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2
          className="se-button-loader"
          size={17}
        />
      ) : (
        icon
      )}

      <span>{children}</span>
    </button>
  );
};

export default Button;