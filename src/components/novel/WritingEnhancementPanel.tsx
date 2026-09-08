import React, { useState, useEffect, useCallback, useRef } from 'react';

interface WritingEnhancementPanelProps {
  wordCount: number;
  targetWordCount: number;
  onTypewriterModeToggle: (enabled: boolean) => void;
  onFocusModeToggle: (enabled: boolean) => void;
  isTypewriterMode: boolean;
  isFocusMode: boolean;
}

type TimerMode = 'pomodoro' | 'custom' | 'none';

interface WritingSession {
  startTime: Date;
  wordsAtStart: number;
  wordsAtEnd: number;
  duration: number;
}

const WritingEnhancementPanel: React.FC<WritingEnhancementPanelProps> = ({
  wordCount,
  targetWordCount,
  onTypewriterModeToggle,
  onFocusModeToggle,
  isTypewriterMode,
  isFocusMode,
}) => {
  const [timerMode, setTimerMode] = useState<TimerMode>('none');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionWords, setSessionWords] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [todayWords, setTodayWords] = useState(0);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'cafe' | 'forest'>('none');
  const [focusIntensity, setFocusIntensity] = useState<'light' | 'medium' | 'deep'>('medium');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining]);

  const startTimer = useCallback(() => {
    setTimeRemaining(timerMinutes * 60);
    setIsTimerRunning(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
      setSessionWords(0);
    }
  }, [timerMinutes, sessionStartTime]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimeRemaining(timerMinutes * 60);
  }, [timerMinutes]);

  const stopSession = useCallback(() => {
    if (sessionStartTime) {
      const session: WritingSession = {
        startTime: sessionStartTime,
        wordsAtStart: wordCount - sessionWords,
        wordsAtEnd: wordCount,
        duration: Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000),
      };
      setSessions((prev) => [session, ...prev].slice(0, 20));
    }
    setSessionStartTime(null);
    setSessionWords(0);
    setIsTimerRunning(false);
    setTimeRemaining(0);
  }, [sessionStartTime, wordCount, sessionWords]);

  useEffect(() => {
    if (sessionStartTime) {
      setSessionWords(wordCount - (wordCount - sessionWords));
    }
  }, [wordCount]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dailyProgress = dailyGoal > 0 ? Math.min(100, (todayWords / dailyGoal) * 100) : 0;
  const overallProgress = targetWordCount > 0 ? Math.min(100, (wordCount / targetWordCount) * 100) : 0;

  return (
    <div className="w-72 border-l border-border-subtle bg-bg-base overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">写作增强</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle">
            <div className="flex items-center gap-2">
              <span className="text-lg">⌨️</span>
              <div>
                <span className="text-xs font-medium text-ink block">打字机模式</span>
                <span className="text-[10px] text-ink-faint">光标保持居中</span>
              </div>
            </div>
            <button
              className={`w-10 h-5 rounded-full transition-all ${
                isTypewriterMode ? 'bg-brand' : 'bg-bg-base'
              }`}
              onClick={() => onTypewriterModeToggle(!isTypewriterMode)}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isTypewriterMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <span className="text-xs font-medium text-ink block">专注模式</span>
                <span className="text-[10px] text-ink-faint">淡化非当前段落</span>
              </div>
            </div>
            <button
              className={`w-10 h-5 rounded-full transition-all ${
                isFocusMode ? 'bg-brand' : 'bg-bg-base'
              }`}
              onClick={() => onFocusModeToggle(!isFocusMode)}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isFocusMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {isFocusMode && (
            <div className="pl-4 space-y-2">
              <span className="text-[10px] text-ink-faint">专注强度</span>
              <div className="flex gap-1">
                {[
                  { value: 'light', label: '轻度' },
                  { value: 'medium', label: '中度' },
                  { value: 'deep', label: '深度' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    className={`flex-1 px-2 py-1 rounded text-[10px] transition-all ${
                      focusIntensity === value
                        ? 'bg-brand text-white'
                        : 'bg-bg-base text-ink-muted hover:bg-brand/10'
                    }`}
                    onClick={() => setFocusIntensity(value as typeof focusIntensity)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink">写作计时器</span>
            <select
              className="input text-[10px] py-1 w-24"
              value={timerMode}
              onChange={(e) => setTimerMode(e.target.value as TimerMode)}
            >
              <option value="none">关闭</option>
              <option value="pomodoro">番茄钟</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          {timerMode !== 'none' && (
            <div className="space-y-3">
              {timerMode === 'custom' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-faint">时长:</span>
                  <input
                    type="number"
                    className="input text-xs py-1 w-16"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={120}
                  />
                  <span className="text-xs text-ink-faint">分钟</span>
                </div>
              )}

              <div className="text-center py-4">
                <div className="text-3xl font-mono font-bold text-ink mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="flex justify-center gap-2">
                  {!isTimerRunning ? (
                    <button
                      className="btn btn-primary btn-sm text-xs"
                      onClick={startTimer}
                    >
                      {timeRemaining === 0 ? '开始' : '继续'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={pauseTimer}
                    >
                      暂停
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm text-xs"
                    onClick={resetTimer}
                  >
                    重置
                  </button>
                  {sessionStartTime && (
                    <button
                      className="btn btn-ghost btn-sm text-xs text-danger"
                      onClick={stopSession}
                    >
                      结束
                    </button>
                  )}
                </div>
              </div>

              {sessionStartTime && (
                <div className="p-2 rounded bg-bg-subtle text-center">
                  <span className="text-xs text-ink-faint">本次写作: </span>
                  <span className="text-sm font-medium text-ink">{sessionWords} 字</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink">背景音效</span>
            <select
              className="input text-[10px] py-1 w-24"
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value as typeof ambientSound)}
            >
              <option value="none">关闭</option>
              <option value="rain">雨声</option>
              <option value="cafe">咖啡厅</option>
              <option value="forest">森林</option>
            </select>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink">写作目标</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-ink-faint">今日目标</span>
                <span className="text-[10px] text-ink-faint">{todayWords}/{dailyGoal}</span>
              </div>
              <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-ink-faint">总进度</span>
                <span className="text-[10px] text-ink-faint">{wordCount}/{targetWordCount || '∞'}</span>
              </div>
              <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-success/80 rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink">写作会话</span>
            <button
              className="text-xs text-brand hover:underline"
              onClick={() => setShowSessionHistory(!showSessionHistory)}
            >
              {showSessionHistory ? '收起' : '历史'}
            </button>
          </div>

          {showSessionHistory && sessions.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sessions.map((session, idx) => (
                <div key={idx} className="p-2 rounded bg-bg-subtle text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">
                      {session.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-ink">{session.wordsAtEnd - session.wordsAtStart} 字</span>
                  </div>
                  <div className="text-[10px] text-ink-faint mt-0.5">
                    时长: {Math.floor(session.duration / 60)}分{session.duration % 60}秒
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSessionHistory && sessions.length === 0 && (
            <p className="text-xs text-ink-faint text-center py-2">暂无写作记录</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingEnhancementPanel;
