import React from "react";
import { useNavigate } from "react-router-dom";
import "./language.css";

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
];

export default function LanguageSelection() {
  const navigate = useNavigate();

  const handleLanguageSelect = (langCode) => {
    localStorage.setItem("selectedLanguage", langCode);
    navigate("/chat"); // Go to chatbot after language selection
  };

  return (
    <div className="language-container">
      <h2>🌐 Select your preferred language</h2>
      <ul className="language-list">
        {languages.map((lang) => (
          <li
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            className="language-item"
          >
            <div>
              <strong>{lang.name}</strong>
              <p>{lang.native}</p>
            </div>
            <span>➡️</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
