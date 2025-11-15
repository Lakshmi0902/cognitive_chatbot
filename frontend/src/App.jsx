import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ChatbotWidget from "./ChatbotWidget";
import Welcome from "./Welcome";
import LanguageSelection from "./LanguageSelection";
import Feedback from "./Feedback";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/language" element={<LanguageSelection />} />
        <Route path="/chat" element={<ChatbotWidget />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Router>
  );
}

export default App;
