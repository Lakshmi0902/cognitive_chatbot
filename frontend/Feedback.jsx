
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Feedback() {
  const [rating, setRating] = useState(null);
  const navigate = useNavigate();

  const handleShareFeedback = () => {
    if (!rating) {
      alert("Please select your feedback 😊");
      return;
    }
    alert(`Thanks for your feedback: ${rating === "good" ? "Great!" : "Not good 😢"}`);
    navigate("/"); // Go back to welcome or you can navigate to a thank-you page
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7f9fc",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px 60px",
          borderRadius: "16px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "400px",
        }}
      >
        <h2 style={{ color: "#002b5c", marginBottom: "10px" }}>
          Did we resolve your query?
        </h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "30px" }}>
          Please rate your conversation with the Support Agent
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginBottom: "30px",
          }}
        >
          <div
            onClick={() => setRating("good")}
            style={{
              cursor: "pointer",
              background: rating === "good" ? "#e8f3ff" : "#f1f1f1",
              padding: "20px 30px",
              borderRadius: "12px",
              transition: "0.3s",
            }}
          >
            <span style={{ fontSize: "40px" }}>😄</span>
            <p style={{ margin: 0, color: "#0047ab", fontWeight: 500 }}>Great!</p>
          </div>

          <div
            onClick={() => setRating("bad")}
            style={{
              cursor: "pointer",
              background: rating === "bad" ? "#ffeaea" : "#f1f1f1",
              padding: "20px 30px",
              borderRadius: "12px",
              transition: "0.3s",
            }}
          >
            <span style={{ fontSize: "40px" }}>😢</span>
            <p style={{ margin: 0, color: "#d9534f", fontWeight: 500 }}>Not good</p>
          </div>
        </div>

        <button
          onClick={handleShareFeedback}
          style={{
            width: "100%",
            padding: "12px 0",
            background: "#007bff",
            border: "none",
            color: "white",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          SHARE FEEDBACK
        </button>

        <p
          onClick={() => navigate("/")}
          style={{
            color: "#007bff",
            fontSize: "14px",
            cursor: "pointer",
            textDecoration: "underline",
            margin: 0,
          }}
        >
          SKIP THIS STEP
        </p>
      </div>
    </div>
  );
}
