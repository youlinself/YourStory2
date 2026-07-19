import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout, ToastProvider } from "./components";
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
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dialogue"
            element={
              <MainLayout>
                <DialogueAgent />
              </MainLayout>
            }
          />
          <Route
            path="/dialogue/:chapterId"
            element={
              <MainLayout>
                <DialogueAgent />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />
          <Route
            path="/autobiography"
            element={
              <MainLayout>
                <Autobiography />
              </MainLayout>
            }
          />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
