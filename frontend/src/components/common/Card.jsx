import "./Card.css";

const Card = ({
  children,
  title,
  subtitle,
  action,
  padding = true,
  className = "",
}) => {
  return (
    <div
      className={`se-card ${
        padding ? "se-card-padding" : ""
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="se-card-header">
          <div className="se-card-heading">
            {title && (
              <h3 className="se-card-title">
                {title}
              </h3>
            )}

            {subtitle && (
              <p className="se-card-subtitle">
                {subtitle}
              </p>
            )}
          </div>

          {action && (
            <div className="se-card-action">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="se-card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;