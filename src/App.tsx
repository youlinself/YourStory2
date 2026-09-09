import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components";
import { Home, DialogueAgent, Settings, Autobiography, Novel, NovelEditor, AIWorkshop, Simulation, ThinkTank, AchievementWall, GameRecords, RecordDetail } from "./pages";
import { useAIStore } from "./stores";
import { AppLayout } from "./components/layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import AchievementNotification from "./components/achievement/AchievementNotification";
import FileStorageService from "./services/storage/FileStorageService";
import ContextMenu from "./components/ContextMenu";
import "./App.css";

function App() {
  const { loadSettings } = useAIStore();

  useEffect(() => {
    FileStorageService.getInstance().loadConfig();
    loadSettings();
  }, [loadSettings]);

  return (
    <ThemeProvider>
      <Router>
        <ToastProvider>
          <AchievementNotification />
          <ContextMenu />
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dialogue" element={<DialogueAgent />} />
              <Route path="/dialogue/:chapterId" element={<DialogueAgent />} />
              <Route path="/autobiography" element={<Autobiography />} />
              <Route path="/novel" element={<Novel />} />
              <Route path="/novel/:novelId" element={<NovelEditor />} />
              <Route path="/workshop" element={<AIWorkshop />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/achievements" element={<AchievementWall />} />
              <Route path="/thinktank" element={<ThinkTank />} />
              <Route path="/thinktank/battle" element={<ThinkTank />} />
              <Route path="/records" element={<GameRecords />} />
              <Route path="/records/:recordId" element={<RecordDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
