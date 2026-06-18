const LoadingModal = () => {
  return (
    <div className="modal-overlay" id="loadingOverlay">
      <div className="loader-box">
        <div className="spinner"></div>
        <p className="loader-text">Processing Submission...</p>
        <p className="loader-subtext">
          Generating your Digital ID Card &amp; preparing credentials...
        </p>
      </div>
    </div>
  );
};

export default LoadingModal;
