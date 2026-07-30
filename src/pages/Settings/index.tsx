import React, { useState, useEffect } from 'react';
import useAIStore from '../../stores/aiStore';
import useSettingsStore from '../../stores/settingsStore';
import useAutobiographyStore from '../../stores/autobiographyStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../hooks/useNotification';
import ExportService from '../../services/export/ExportService';
import BackupService from '../../services/backup/BackupService';
import { isTauriEnvironment, migrateToTauriStorage } from '../../services/storage/tauriStorage';
import FileStorageService from '../../services/storage/FileStorageService';
import { useToast } from '../../components';
import { AI_VENDORS, getVendorById, getVendorModels } from '../../ai_config/vendors';
import AIService from '../../services/ai/AIService';

const SettingsPage: React.FC = () => {
  const {
    apiKey,
    model,
    baseUrl,
    vendor,
    temperature,
    customModelName,
    testUrl,
    setApiKey,
    setModel,
    setBaseUrl,
    setVendor,
    setTemperature,
    setCustomModelName,
    setTestUrl,
    loadSettings,
    saveSettings,
  } = useAIStore();

  const {
    autoSave,
    notifications,
    storageType,
    storageFilePath,
    setAutoSave,
    setNotifications,
    setStorageType,
    selectStorageDirectory,
    loadSettings: loadAppSettings,
    saveSettings: saveAppSettings,
  } = useSettingsStore();

  const { autobiography } = useAutobiographyStore();

  const { isDark, setTheme } = useTheme();
  const { permission: notificationPermission, requestPermission, isSupported: notificationSupported } = useNotification();
  const toast = useToast();

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    loadAppSettings();
  }, [loadSettings, loadAppSettings]);

  useEffect(() => {
    const models = getVendorModels(vendor);
    setAvailableModels(models);
  }, [vendor]);

  const currentVendor = getVendorById(vendor);

  const handleVendorChange = async (newVendor: string) => {
    setVendor(newVendor);
    setValidationResult(null);
    await saveSettings();
  };

  const handleModelChange = async (newModel: string) => {
    setModel(newModel);
    await saveSettings();
  };

  const handleCustomModelNameChange = async (newName: string) => {
    setCustomModelName(newName);
    await saveSettings();
  };

  const handleTestUrlChange = async (newUrl: string) => {
    setTestUrl(newUrl);
    await saveSettings();
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    setValidationResult(null);
  };

  const handleApiKeyBlur = async () => {
    await saveSettings();
  };

  const handleTemperatureChange = async (value: number) => {
    setTemperature(value);
    await saveSettings();
  };

  const handleToggleAutoSave = async (value: boolean) => {
    setAutoSave(value);
    await saveAppSettings();
  };

  const handleToggleDarkMode = async (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value && notificationSupported && notificationPermission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        alert('请在浏览器设置中允许通知权限');
        return;
      }
    }
    setNotifications(value);
    await saveAppSettings();
  };

  const handleStorageTypeChange = async (type: 'localStorage' | 'file') => {
    setStorageType(type);
    await saveAppSettings();
  };

  const handleSelectDirectory = async () => {
    const path = await selectStorageDirectory();
    if (path) {
      await saveAppSettings();
    }
  };

  const handleMigrateData = async () => {
    const keys = ['achievement_system_v1', 'app-settings', 'simulation-save'];
    try {
      const fileStorage = FileStorageService.getInstance();
      const result = await fileStorage.migrateFromLocalStorage(keys);
      toast.addToast({
        type: 'success',
        message: `数据迁移完成：成功 ${result.success.length} 项`,
      });
    } catch (error) {
      toast.addToast({ type: 'error', message: '数据迁移失败' });
    }
  };

  const handleExportData = () => {
    ExportService.downloadAsMarkdown(autobiography);
  };

  const handleExportSettings = () => {
    const settings = {
      ai: { apiKey: apiKey.slice(0, 8) + '***', model, baseUrl, vendor, temperature },
      app: { autoSave, notifications },
    };
    const content = JSON.stringify(settings, null, 2);
    ExportService.download(content, 'settings.json', 'application/json;charset=utf-8');
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.ai) {
          if (data.ai.model) setModel(data.ai.model);
          if (data.ai.baseUrl) setBaseUrl(data.ai.baseUrl);
          if (data.ai.vendor) setVendor(data.ai.vendor);
          if (data.ai.temperature) setTemperature(data.ai.temperature);
          await saveSettings();
        }
        if (data.app) {
          if (typeof data.app.autoSave === 'boolean') setAutoSave(data.app.autoSave);
          if (typeof data.app.notifications === 'boolean') setNotifications(data.app.notifications);
          await saveAppSettings();
        }
        alert('设置导入成功！');
      } catch (error) {
        alert('导入失败：文件格式错误');
      }
    };
    input.click();
  };

  const handleBackup = () => {
    try {
      BackupService.createBackup();
      toast.addToast({ type: 'success', message: '备份创建成功' });
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '备份失败' });
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await BackupService.restoreBackup(file);
        toast.addToast({ type: 'success', message: '数据恢复成功' });
      } catch (error) {
        toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '恢复失败' });
      }
    };
    input.click();
  };

  const handleLocalBackup = () => {
    try {
      BackupService.createLocalBackup();
      toast.addToast({ type: 'success', message: '本地备份创建成功' });
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '本地备份失败' });
    }
  };

  const handleMigrateToTauri = async () => {
    const keys = ['autobiography', 'dialogue-sessions', 'ai-settings', 'settings'];
    try {
      const result = await migrateToTauriStorage(keys);
      toast.addToast({
        type: 'success',
        message: `迁移完成：成功 ${result.success.length} 项，失败 ${result.failed.length} 项`,
      });
    } catch (error) {
      toast.addToast({ type: 'error', message: error instanceof Error ? error.message : '迁移失败' });
    }
  };

  const handleValidateApiKey = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setValidationMessage('');

    try {
      const aiService = new AIService({
        apiKey,
        model: customModelName || model,
        baseUrl,
        vendor,
        customModelName,
        testUrl,
      });

      const result = await aiService.testConnection();

      if (result.success) {
        setValidationResult('success');
        setValidationMessage(result.message);
        if (result.models && result.models.length > 0) {
          setAvailableModels(result.models);
        }
      } else {
        setValidationResult('error');
        setValidationMessage(result.message);
      }
    } catch (error) {
      setValidationResult('error');
      setValidationMessage(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="content-panel">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink mb-6">
          设置
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="section-title mb-4">AI 配置</h2>
            <div className="card p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">AI 供应商</label>
                <div className="grid grid-cols-2 gap-3">
                  {AI_VENDORS.map((v) => (
                    <div
                      key={v.id}
                      className={`model-card ${vendor === v.id ? 'selected' : ''}`}
                      onClick={() => handleVendorChange(v.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink">{v.name}</span>
                        {vendor === v.id && (
                          <svg className="model-check w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-ink-faint">{v.defaultModel || '自定义模型'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {vendor !== 'ollama' && vendor !== 'custom' && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">模型选择</label>
                  <select
                    className="input w-full"
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    ) : (
                      <option value={model}>{model}</option>
                    )}
                  </select>
                </div>
              )}
              {(vendor === 'ollama' || vendor === 'custom') && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">模型名称</label>
                  <input
                    className="input w-full"
                    placeholder={vendor === 'ollama' ? '例如: llama3.2:1b, codellama' : '输入模型名称'}
                    value={customModelName}
                    onChange={(e) => handleCustomModelNameChange(e.target.value)}
                  />
                  <p className="text-xs text-ink-faint mt-1">
                    {vendor === 'ollama'
                      ? '填写本地已拉取的模型名称（执行 ollama list 查看）'
                      : '填写自定义 API 的模型名称'}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink">API Key</label>
                  {(vendor === 'ollama' || vendor === 'custom') && (
                    <span className="text-xs text-ink-faint">选填</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="password"
                    placeholder={vendor === 'ollama' ? 'Ollama 默认无需 API Key' : '输入你的 API Key'}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    onBlur={handleApiKeyBlur}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={handleValidateApiKey}
                    disabled={isValidating}
                  >
                    {isValidating ? '测试中...' : '测试连接'}
                  </button>
                </div>
                {validationResult && (
                  <p className={`text-xs mt-1 ${validationResult === 'success' ? 'text-success' : 'text-danger'}`}>
                    {validationMessage}
                  </p>
                )}
                {currentVendor && vendor !== 'ollama' && vendor !== 'custom' && (
                  <p className="text-xs text-ink-faint mt-1">
                    当前使用 {currentVendor.name} 的 {currentVendor.authHeader} 认证方式
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink">温度参数</label>
                  <span className="text-sm text-ink-muted">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-ink-faint mt-1">
                  <span>精确</span>
                  <span>创意</span>
                </div>
              </div>

              {(vendor === 'custom' || vendor === 'ollama') && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">
                    {vendor === 'ollama' ? 'Ollama Base URL' : '自定义 Base URL'}
                  </label>
                  <input
                    className="input w-full"
                    placeholder={vendor === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com/v1'}
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    onBlur={saveSettings}
                  />
                  {vendor === 'ollama' && (
                    <p className="text-xs text-ink-faint mt-1">
                      Ollama 默认地址为 http://localhost:11434，如使用远程服务器请修改
                    </p>
                  )}
                </div>
              )}

              {vendor === 'custom' && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">测试 URL（可选）</label>
                  <input
                    className="input w-full"
                    placeholder="https://api.example.com/v1/models（用于测试连接）"
                    value={testUrl}
                    onChange={(e) => handleTestUrlChange(e.target.value)}
                  />
                  <p className="text-xs text-ink-faint mt-1">
                    自定义测试端点，留空则使用 Base URL + /models 进行测试
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4">写作偏好</h2>
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">自动保存</p>
                  <p className="text-xs text-ink-faint mt-0.5">每 30 秒自动保存内容</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => handleToggleAutoSave(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">深色模式</p>
                  <p className="text-xs text-ink-faint mt-0.5">切换深色主题</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">消息通知</p>
                  <p className="text-xs text-ink-faint mt-0.5">接收写作提醒</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => handleToggleNotifications(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4">数据存储</h2>
            <div className="card p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">存储方式</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`model-card ${storageType === 'localStorage' ? 'selected' : ''}`}
                    onClick={() => handleStorageTypeChange('localStorage')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">浏览器存储</span>
                      {storageType === 'localStorage' && (
                        <svg className="model-check w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint">使用 localStorage（浏览器本地）</p>
                  </div>
                  <div
                    className={`model-card ${storageType === 'file' ? 'selected' : ''}`}
                    onClick={() => handleStorageTypeChange('file')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">文件系统</span>
                      {storageType === 'file' && (
                        <svg className="model-check w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint">保存到本地文件系统</p>
                  </div>
                </div>
              </div>

              {storageType === 'file' && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">存储路径</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="选择数据存储文件夹"
                      value={storageFilePath}
                      readOnly
                    />
                    <button
                      className="btn btn-outline"
                      onClick={handleSelectDirectory}
                    >
                      浏览...
                    </button>
                  </div>
                  <p className="text-xs text-ink-faint mt-1">
                    数据存储在该文件夹下的 JSON 文件中
                  </p>
                </div>
              )}

              {storageType === 'file' && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">迁移现有数据</p>
                    <p className="text-xs text-ink-faint mt-0.5">将浏览器存储的数据迁移到文件系统</p>
                  </div>
                  <button className="btn btn-outline text-xs" onClick={handleMigrateData}>迁移</button>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4">数据与隐私</h2>
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-ink">导出所有数据</p>
                  <p className="text-xs text-ink-faint mt-0.5">下载全部传记内容（Markdown格式）</p>
                </div>
                <button className="btn btn-outline text-xs" onClick={handleExportData}>导出</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-ink">完整备份</p>
                  <p className="text-xs text-ink-faint mt-0.5">备份所有数据到本地文件</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline text-xs" onClick={handleBackup}>创建备份</button>
                  <button className="btn btn-outline text-xs" onClick={handleRestore}>恢复备份</button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-ink">本地自动备份</p>
                  <p className="text-xs text-ink-faint mt-0.5">保存到浏览器本地存储（最多5份）</p>
                </div>
                <button className="btn btn-outline text-xs" onClick={handleLocalBackup}>创建</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-ink">导入/导出设置</p>
                  <p className="text-xs text-ink-faint mt-0.5">备份或恢复应用设置</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline text-xs" onClick={handleImportSettings}>导入</button>
                  <button className="btn btn-outline text-xs" onClick={handleExportSettings}>导出</button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-ink">清除对话历史</p>
                  <p className="text-xs text-ink-faint mt-0.5">删除所有对话记录</p>
                </div>
                <button className="btn btn-outline text-xs" disabled>清除</button>
              </div>
              {isTauriEnvironment() && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">迁移数据到文件系统</p>
                    <p className="text-xs text-ink-faint mt-0.5">将localStorage数据迁移到Tauri文件系统</p>
                  </div>
                  <button className="btn btn-outline text-xs" onClick={handleMigrateToTauri}>迁移</button>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-danger">删除账户</p>
                  <p className="text-xs text-ink-faint mt-0.5">永久删除账户及所有数据</p>
                </div>
                <button className="btn btn-outline text-xs text-danger border-danger/20 hover:bg-danger/5" disabled>删除</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
