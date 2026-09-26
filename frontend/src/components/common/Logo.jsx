import { Link } from "react-router-dom";
import "./Logo.css";

const Logo = ({
  to = "/",
  showText = true,
  size = "medium",
}) => {
  return (
    <Link
      to={to}
      className={`skillselephant-logo skillselephant-logo-${size}`}
      aria-label="Skillselephant"
    >
     <img
  src="/logo/skillselephant-logo-primary.png"
  alt="Skillselephant"
  className="skillselephant-logo-image"
/>

      {showText && (
        <span className="skillselephant-logo-hidden-text">
          Skillselephant
        </span>
      )}
    </Link>
  );
};

export default Logo;