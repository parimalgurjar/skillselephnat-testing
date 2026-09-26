import "./LoadingScreen.css";

const LoadingScreen = ({
  message = "Loading...",
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <div className="loading-spinner" />

        <p className="loading-message">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;