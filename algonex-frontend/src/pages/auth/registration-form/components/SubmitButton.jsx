const SubmitButton = () => {
  return (
    <div className="submit-action-container">
      <button type="submit" id="submitBtn" className="btn-complete">
        <span className="btn-text">Complete Registration</span>
        <i className="fa-solid fa-rocket btn-icon animate-pulse"></i>
      </button>
    </div>
  );
};

export default SubmitButton;
