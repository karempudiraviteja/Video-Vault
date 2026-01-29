import '../styles/ProgressBar.css';

export const ProgressBar = ({ progress, status = 'processing' }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar progress-${status}`}
          style={{ width: `${progress}%` }}
        >
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
      <p className="progress-status">{status}</p>
    </div>
  );
};

export default ProgressBar;
