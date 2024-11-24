import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Session from "./components/Session";
import Home from "./components/Home";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session" element={<Session />} />
      </Routes>
    </Router>
  );
};

export default App;
