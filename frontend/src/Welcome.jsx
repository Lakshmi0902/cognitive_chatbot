
// import React from "react";
// import { useNavigate } from "react-router-dom";

// const Welcome = () => {
//   const navigate = useNavigate();

//   const handleEnter = () => {
//     navigate("/chat");
//   };

//   return (
//     <div
//       style={{
//         height: "100vh",
//         background: "linear-gradient(to bottom right, #ffffff, #007bff)",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         color: "#003366",
//         fontFamily: "'Poppins', sans-serif",
//         textAlign: "center",
//       }}
//     >
//       <h1 style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>
//         🤖 Welcome to <span style={{ color: "#0056b3" }}>FinSmart Assistant</span>
//       </h1>
//       <p style={{ fontSize: "1.2rem", maxWidth: "600px", marginBottom: "2rem" }}>
//         Your intelligent banking companion — here to assist you with accounts, loans, and insurance queries.
//       </p>
//       <button
//         onClick={handleEnter}
//         style={{
//           padding: "12px 28px",
//           fontSize: "1rem",
//           border: "none",
//           borderRadius: "30px",
//           backgroundColor: "#0056b3",
//           color: "white",
//           cursor: "pointer",
//           transition: "0.3s ease",
//         }}
//         onMouseOver={(e) => (e.target.style.backgroundColor = "#003d80")}
//         onMouseOut={(e) => (e.target.style.backgroundColor = "#0056b3")}
//       >
//         Enter Assistant →
//       </button>
//     </div>
//   );
// };

// export default Welcome;
import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/language"); // ✅ Go to Language Selection Page
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(to bottom right, #ffffff, #007bff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#003366",
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>
        🤖 Welcome to <span style={{ color: "#0056b3" }}>FinSmart Assistant</span>
      </h1>
      <p style={{ fontSize: "1.2rem", maxWidth: "600px", marginBottom: "2rem" }}>
        Your intelligent banking companion — here to assist you with accounts,
        loans, and insurance queries.
      </p>
      <button
        onClick={handleEnter}
        style={{
          padding: "12px 28px",
          fontSize: "1rem",
          border: "none",
          borderRadius: "30px",
          backgroundColor: "#0056b3",
          color: "white",
          cursor: "pointer",
          transition: "0.3s ease",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#003d80")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#0056b3")}
      >
        Enter Assistant →
      </button>
    </div>
  );
};

export default Welcome;
