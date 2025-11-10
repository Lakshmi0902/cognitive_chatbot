import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./style.css";

export default function ChatbotWidget() {
  const navigate = useNavigate();
 // ✅ Ensure lowercase ISO code
let storedLang = localStorage.getItem("selectedLanguage") || "en";
const languageMap = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
  Tamil: "ta",
  Telugu: "te",
  Malayalam: "ml",
  Marathi: "mr",
  Bengali: "bn",
};
const selectedLanguage = languageMap[storedLang] || storedLang.toLowerCase();
// ✅ Get user-selected language

  // ✅ Multilingual greetings
  const greetings = {
    en: "👋 Hello! I'm your FinSmart Assistant. How can I help you today?",
    hi: "👋 नमस्ते! मैं आपका FinSmart सहायक हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?",
    kn: "👋 ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ FinSmart ಸಹಾಯಕ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    ta: "👋 வணக்கம்! நான் உங்கள் FinSmart உதவியாளர். எப்படி உதவலாம்?",
    te: "👋 హలో! నేను మీ FinSmart సహాయకుడు. నేను ఎలా సహాయం చేయగలను?",
    ml: "👋 ഹലോ! ഞാൻ നിങ്ങളുടെ FinSmart സഹായി. എങ്ങനെ സഹായിക്കാം?",
    mr: "👋 नमस्कार! मी तुमचा FinSmart सहाय्यक आहे. मी कशी मदत करू शकतो?",
    bn: "👋 হ্যালো! আমি আপনার FinSmart সহকারী। আমি কীভাবে সাহায্য করতে পারি?",
  };

  const [messages, setMessages] = useState([
    { from: "bot", text: greetings[selectedLanguage] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [humanMode, setHumanMode] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Translate function using Google API
  const translateText = async (text, targetLang) => {
    if (!text || targetLang === "en") return text; // No translation needed
    try {
      const res = await axios.post(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
          text
        )}`
      );
      return res.data[0][0][0];
    } catch (err) {
      console.error("Translation error:", err);
      return text;
    }
  };


const handleSend = async (customMessage = null) => {
  const userMessage = customMessage || input.trim();
  if (!userMessage) return;

  setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
  setInput("");
  setLoading(true);

  // 👨‍💼 Human mode chat simulation (with translation)
if (humanMode) {
  let reply = "";

  if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
    reply = "👨‍💼 Rahul: Hi there! How can I assist you today?";
  } else if (userMessage.toLowerCase().includes("account")) {
    reply = "👨‍💼 Rahul: I can help you with account creation or status updates. Could you please specify your request?";
  } else if (userMessage.toLowerCase().includes("thank")) {
    reply = "👨‍💼 Rahul: You're most welcome! Always happy to assist you. 😊";
  } else if (userMessage.toLowerCase().includes("bye")) {
    reply = "👨‍💼 Rahul: Have a great day ahead! Goodbye!";
  } else {
    reply = "👨‍💼 Rahul: Sure, I’ll note your query and help you with that right away.";
  }

  // ✅ Translate human message based on selected language
  try {
    const res = await axios.post("http://localhost:5000/translate", {
      text: reply,
      language: selectedLanguage, // use lowercase code (already mapped)
    });
    reply = res.data.translated || reply;
  } catch (err) {
    console.log("⚠️ Human message translation failed:", err);
  }

  // ✅ Translate return button
  let returnChip = "Return to AI Assistant";
  try {
    const resChip = await axios.post("http://localhost:5000/translate", {
      text: "Return to AI Assistant",
      language: selectedLanguage,
    });
    returnChip = resChip.data.translated || returnChip;
  } catch (err) {
    console.log("⚠️ Return chip translation failed:", err);
  }

  setMessages((prev) => [
    ...prev,
    { from: "human", text: reply },
    { from: "system", text: "", chips: [returnChip] },
  ]);
  setLoading(false);
  return;
}


  // 🤖 AI Chatbot mode (send language to backend)
  try {
    const res = await axios.post("http://localhost:5000/chat", {
      message: userMessage,
      session_id: sessionId,
      language: selectedLanguage,
    });

    const { reply, session_id, chips, intent } = res.data;
    setSessionId(session_id);


if (intent === "talk_to_agent" || intent === "human_handoff") {
  setHumanMode(true);

  try {
    const lang = selectedLanguage;

    // Define all text to translate
    const textsToTranslate = [
      "🧑‍💼 Human Agent (Rahul) has joined the chat.",
      "👨‍💼 Rahul: Hi, this is Rahul from FinSmart support. How can I assist you today?",
      "🔄 You can click below anytime to return to AI Assistant.",
      "Return to AI Assistant",
    ];

    // Translate all at once
    const translatedResponses = await Promise.all(
      textsToTranslate.map(async (text) => {
        try {
          const res = await axios.post("http://localhost:5000/translate", {
            text,
            language: lang,
          });

          console.log("🌐 Translated (frontend):", text, "→", res.data.translated);
          return res.data.translated || text;
        } catch (error) {
          console.error("❌ Translation failed for:", text, error);
          return text;
        }
      })
    );

    // Destructure translated responses
    const [msg1, msg2, msg3, chipTranslated] = translatedResponses;

    setMessages((prev) => [
      ...prev,
      { from: "system", text: msg1 },
      { from: "human", text: msg2 },
      { from: "system", text: msg3, chips: [chipTranslated] },
    ]);
  } catch (err) {
    console.error("⚠️ Translation failed for human agent:", err);
    setMessages((prev) => [
      ...prev,
      { from: "system", text: "🧑‍💼 Human Agent (Rahul) has joined the chat." },
      {
        from: "human",
        text: "👨‍💼 Rahul: Hi, this is Rahul from FinSmart support. How can I assist you today?",
      },
      {
        from: "system",
        text: "🔄 You can click below anytime to return to AI Assistant.",
        chips: ["Return to AI Assistant"],
      },
    ]);
  }

  setLoading(false);
  return;
}




    // ✅ 2️⃣ Otherwise, show normal AI response
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: reply, chips: chips || [] },
    ]);
  } catch (error) {
    console.error("Chat error:", error);
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "⚠️ Oops! Something went wrong. Please try again later." },
    ]);
  } finally {
    setLoading(false);
  }
};



const handleChipClick = async (chip) => {
  const label = chip.label || chip;
  const value = chip.value || chip;

  console.log("🖱️ Clicked chip →", label, value);

  // 🔹 Detect multilingual “Return to AI Assistant”
  const isReturnToAI =
    value.toLowerCase().includes("return") ||
    value.toLowerCase().includes("assistant") ||
    value.toLowerCase().includes("ಮರಳಿ") ||
    value.toLowerCase().includes("ಹಿಂತಿರುಗಿ") ||
    value.toLowerCase().includes("वापस") ||
    value.toLowerCase().includes("திரும்ப") ||
    value.toLowerCase().includes("తిరిగి") ||
    value.toLowerCase().includes("തിരികെ") ||
    value.toLowerCase().includes("ফিরে");

  if (isReturnToAI) {
    console.log("🔄 Returning to AI mode...");
    setHumanMode(false);

    // Translate “back to AI” message for confirmation
    try {
      const res = await axios.post("http://localhost:5000/translate", {
        text: "🤖 You are now back with FinSmart AI Assistant!",
        language: selectedLanguage,
      });

      setMessages((prev) => [
        ...prev,
        { from: "system", text: res.data.translated },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "system", text: "🤖 You are now back with FinSmart AI Assistant!" },
      ]);
    }

    setLoading(false);
    return; // ⛔ stop here, do not call backend
  }

  // 🔹 Detect multilingual “Talk to agent”
  const isAgent =
    value.toLowerCase().includes("agent") ||
    value.toLowerCase().includes("ಏಜೆಂಟ್") ||
    value.toLowerCase().includes("एजेंट") ||
    value.toLowerCase().includes("ఏజెంట్") ||
    value.toLowerCase().includes("எஜென்ட்") ||
    value.toLowerCase().includes("এজেন্ট") ||
    value.toLowerCase().includes("എജന്റ്");

  if (isAgent) {
    console.log("🧑‍💼 Switching to human agent...");
    setHumanMode(true);

    const textsToTranslate = [
      "🧑‍💼 Human Agent (Rahul) has joined the chat.",
      "👨‍💼 Rahul: Hi, this is Rahul from FinSmart support. How can I assist you today?",
      "🔄 You can click below anytime to return to AI Assistant.",
      "Return to AI Assistant",
    ];

    try {
      const translatedResponses = await Promise.all(
        textsToTranslate.map(async (text) => {
          const res = await axios.post("http://localhost:5000/translate", {
            text,
            language: selectedLanguage,
          });
          return res.data.translated || text;
        })
      );

      const [msg1, msg2, msg3, chipTranslated] = translatedResponses;

      setMessages((prev) => [
        ...prev,
        { from: "system", text: msg1 },
        { from: "human", text: msg2 },
        { from: "system", text: msg3, chips: [chipTranslated] },
      ]);
    } catch (err) {
      console.error("⚠️ Translation failed for agent messages:", err);
    }

    setLoading(false);
    return;
  }

  // ✅ Normal chip click — send to backend
  setMessages((prev) => [...prev, { from: "user", text: label }]);
  setInput("");
  setLoading(true);

  try {
    const res = await axios.post("http://localhost:5000/chat", {
      message: value,
      session_id: sessionId,
      language: selectedLanguage,
    });

    const { reply, session_id, chips, intent } = res.data;
    setSessionId(session_id);

    setMessages((prev) => [
      ...prev,
      { from: "bot", text: reply, chips: chips || [] },
    ]);
  } catch (error) {
    console.error("Chat error:", error);
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "⚠️ Oops! Something went wrong. Please try again later." },
    ]);
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        💼 FinSmart Banking Assistant
        <div style={{ fontSize: "0.8rem", marginTop: "5px", color: "#ccc" }}>
          🌐 Language:{" "}
          {{
            en: "English",
            hi: "Hindi",
            kn: "Kannada",
            ta: "Tamil",
            te: "Telugu",
            ml: "Malayalam",
            mr: "Marathi",
            bn: "Bengali",
          }[selectedLanguage] || "English"}
        </div>
      </div>

      {/* Chat Body */}
<div className="chatbot-body">
  {messages.map((msg, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chat-message ${msg.from}`}
    >
      {/* 🧠 Bot/User Message */}
      {msg.text}

      {/* 💬 Chips (buttons/options) */}
{Array.isArray(msg.chips) && msg.chips.length > 0 && (
  <div className="chips">
    {msg.chips.map((chip, i) => (
      <button key={i} onClick={() => handleChipClick(chip)}>
        {chip.label || chip}
      </button>
    ))}
  </div>
)}


    </motion.div>
  ))}

  {loading && (
    <motion.div
      className="chat-message bot typing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span></span>
      <span></span>
      <span></span>
    </motion.div>
  )}

  <div ref={chatEndRef} />
</div>


      {/* Human Mode Button */}
{humanMode && (
  <div className="chips" style={{ textAlign: "center", marginTop: "10px" }}>
    <button
      onClick={() => handleChipClick("Return to AI Assistant")}
    >
      🔄 {selectedLanguage === "kn"
        ? "AI ಸಹಾಯಕನಿಗೆ ಹಿಂದಿರುಗಿ"
        : selectedLanguage === "hi"
        ? "एआई सहायक पर वापस जाएं"
        : selectedLanguage === "ta"
        ? "AI உதவியாளர் திரும்ப"
        : selectedLanguage === "te"
        ? "AI సహాయకుడికి తిరిగి వెళ్ళండి"
        : selectedLanguage === "ml"
        ? "AI സഹായി അടുത്തേക്ക് മടങ്ങുക"
        : selectedLanguage === "bn"
        ? "AI সহকারীকে ফিরে যান"
        : "Return to AI Assistant"}
    </button>
  </div>
)}


      {/* Feedback Button */}
      <div
        className="feedback-section"
        style={{ textAlign: "center", marginTop: "1rem" }}
      >
        <button
          onClick={() => navigate("/feedback")}
          style={{
            backgroundColor: "#0047ab",
            color: "white",
            border: "none",
            borderRadius: "20px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          💬 Give Feedback
        </button>
      </div>

      {/* Input Bar */}
      <div className="chatbot-footer">
        <input
          type="text"
          placeholder={
            humanMode
              ? "Chatting with Rahul... type your message"
              : "Ask me anything about banking..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={() => handleSend()}>Send</button>
      </div>
    </div>
  );
}
