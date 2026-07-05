import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components";
import { Home, DialogueAgent, Settings, Autobiography } from "./pages";
import { useAIStore } from "./stores";
import "./App.css";

function App() {
  const { loadSettings } = useAIStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dialogue" element={<DialogueAgent />} />
          <Route path="/dialogue/:chapterId" element={<DialogueAgent />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/autobiography" element={<Autobiography />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
