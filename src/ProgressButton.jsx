import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProgressButton.css";

const ProgressButton = () => {
  const navigate = useNavigate();

  return (
    <button
      className="progress-btn"
      type="button"
      onClick={() => navigate("/progress")}
      aria-label="Open progress"
    >
      <svg
        className="progress-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M12 6v6l4 2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>PROGRESS</span>
    </button>
  );
};

export default ProgressButton;
