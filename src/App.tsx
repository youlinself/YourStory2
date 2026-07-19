import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components";
import { Home, DialogueAgent, Settings, Autobiography } from "./pages";
import { useAIStore } from "./stores";
import { AppLayout } from "./components/layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./App.css";

function App() {
  const { loadSettings } = useAIStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <ThemeProvider>
      <Router>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dialogue" element={<DialogueAgent />} />
              <Route path="/dialogue/:chapterId" element={<DialogueAgent />} />
              <Route path="/autobiography" element={<Autobiography />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
