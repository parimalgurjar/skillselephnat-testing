import "./PageLoader.css";

const PageLoader = ({
  message = "Loading...",
}) => {
  return (
    <div
      className="page-loader"
      role="status"
      aria-live="polite"
    >
      <div className="page-loader-spinner" />

      <span className="page-loader-message">
        {message}
      </span>
    </div>
  );
};

export default PageLoader;