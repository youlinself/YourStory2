import React, { useState, useEffect } from 'react';
import useAIStore from '../../stores/aiStore';
import useSettingsStore from '../../stores/settingsStore';
import useAutobiographyStore from '../../stores/autobiographyStore';
import useThinkTankStore, { defaultConfig } from '../../stores/thinkTankStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../hooks/useNotification';
import ExportService from '../../services/export/ExportService';
import BackupService from '../../services/backup/BackupService';
import { isTauriEnvironment, migrateToTauriStorage } from '../../services/storage/tauriStorage';
import FileStorageService from '../../services/storage/FileStorageService';
import { useToast } from '../../components';
import { AI_VENDORS, getVendorById, getVendorModels } from '../../ai_config/vendors';
import AIService from '../../services/ai/AIService';
import type { ThinkTankMember, ThinkTankRole } from '../../types';

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

  const {
    members,
    rolePresets,
    addMember,
    updateMember,
    removeMember,
    toggleMemberEnabled,
    loadMembers,
  } = useThinkTankStore();

  const { isDark, setTheme } = useTheme();
  const { permission: notificationPermission, requestPermission, isSupported: notificationSupported } = useNotification();
  const toast = useToast();

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ThinkTankMember | null>(null);

  useEffect(() => {
    loadSettings();
    loadAppSettings();
    loadMembers();
  }, [loadSettings, loadAppSettings, loadMembers]);

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

  const getRolePreset = (role: ThinkTankRole) => {
    return rolePresets.find((p) => p.role === role);
  };

  const getVendorName = (vendorId: string) => {
    const v = getVendorById(vendorId);
    return v?.name || vendorId;
  };

  return (
    <div className="content-panel">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink mb-6">
          设置
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="section-title mb-4">默认AI配置</h2>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">AI 智囊团</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddMemberModal(true)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                添加AI成员
              </button>
            </div>
            <div className="card p-5">
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">🤖</span>
                  <p className="text-ink-muted mb-2">还没有AI成员</p>
                  <p className="text-xs text-ink-faint mb-4">添加AI成员来组建你的智囊团，每个AI可以配置不同的模型和参数</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    添加第一个AI成员
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const rolePreset = getRolePreset(member.role);
                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-lg border transition-all ${
                          member.isEnabled
                            ? 'border-border-subtle bg-white'
                            : 'border-border-subtle/50 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{rolePreset?.icon || '⚙️'}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-ink">{member.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand">
                                  {rolePreset?.name || member.role}
                                </span>
                                {!member.isEnabled && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-500">
                                    已禁用
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-faint mt-1">{member.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                                <span>模型: {member.config.customModelName || member.config.model}</span>
                                <span>供应商: {getVendorName(member.config.vendor)}</span>
                                <span>温度: {member.config.temperature.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={member.isEnabled}
                                onChange={() => toggleMemberEnabled(member.id)}
                              />
                              <span className="toggle-slider" />
                            </label>
                            <button
                              className="p-1.5 rounded hover:bg-gray-100 text-ink-muted hover:text-ink transition-colors"
                              onClick={() => setEditingMember(member)}
                              title="编辑"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-red-50 text-ink-muted hover:text-danger transition-colors"
                              onClick={() => {
                                if (confirm('确定要删除这个AI成员吗？')) {
                                  removeMember(member.id);
                                }
                              }}
                              title="删除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onAdd={(member) => {
            addMember(member);
            setShowAddMemberModal(false);
          }}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updates) => {
            updateMember(editingMember.id, updates);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
};

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (member: Omit<ThinkTankMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAdd }) => {
  const { rolePresets } = useThinkTankStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState<ThinkTankRole>('plot_writer');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState(defaultConfig);
  const [isEnabled, setIsEnabled] = useState(true);

  const selectedRolePreset = rolePresets.find((p) => p.role === role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入AI成员名称');
      return;
    }
    onAdd({
      name: name.trim(),
      role,
      description: description.trim() || selectedRolePreset?.description || '',
      config,
      isEnabled,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink">添加AI成员</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">成员名称 *</label>
            <input
              className="input w-full"
              placeholder="例如：情节大师、角色顾问..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">角色类型</label>
            <div className="grid grid-cols-2 gap-2">
              {rolePresets.map((preset) => (
                <div
                  key={preset.role}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    role === preset.role
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-brand/50'
                  }`}
                  onClick={() => setRole(preset.role)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{preset.icon}</span>
                    <span className="text-sm font-medium text-ink">{preset.name}</span>
                  </div>
                  <p className="text-xs text-ink-faint">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">描述</label>
            <textarea
              className="input w-full min-h-[60px]"
              placeholder={selectedRolePreset?.description || '描述这个AI成员的用途...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-medium text-ink mb-3">AI 配置</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">AI 供应商</label>
                <select
                  className="input w-full"
                  value={config.vendor}
                  onChange={(e) => {
                    const newVendor = e.target.value;
                    const vendorInfo = getVendorById(newVendor);
                    setConfig({
                      ...config,
                      vendor: newVendor,
                      baseUrl: vendorInfo?.baseUrl || config.baseUrl,
                      model: vendorInfo?.defaultModel || config.model,
                    });
                  }}
                >
                  {AI_VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">模型</label>
                <input
                  className="input w-full"
                  placeholder="输入模型名称"
                  value={config.customModelName || config.model}
                  onChange={(e) => {
                    const vendorInfo = getVendorById(config.vendor);
                    if (e.target.value === vendorInfo?.defaultModel) {
                      setConfig({ ...config, model: e.target.value, customModelName: '' });
                    } else {
                      setConfig({ ...config, customModelName: e.target.value });
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">API Key</label>
                <input
                  className="input w-full"
                  type="password"
                  placeholder="输入 API Key"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Base URL</label>
                <input
                  className="input w-full"
                  placeholder="https://api.example.com/v1"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-ink-muted">温度参数</label>
                  <span className="text-xs text-ink">{config.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  className="range-slider w-full"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">启用此AI成员</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-outline flex-1" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditMemberModalProps {
  member: ThinkTankMember;
  onClose: () => void;
  onSave: (updates: Partial<ThinkTankMember>) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose, onSave }) => {
  const { rolePresets } = useThinkTankStore();
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<ThinkTankRole>(member.role);
  const [description, setDescription] = useState(member.description);
  const [config, setConfig] = useState(member.config);
  const [isEnabled, setIsEnabled] = useState(member.isEnabled);

  const selectedRolePreset = rolePresets.find((p) => p.role === role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入AI成员名称');
      return;
    }
    onSave({
      name: name.trim(),
      role,
      description: description.trim() || selectedRolePreset?.description || '',
      config,
      isEnabled,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink">编辑AI成员</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">成员名称 *</label>
            <input
              className="input w-full"
              placeholder="例如：情节大师、角色顾问..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">角色类型</label>
            <div className="grid grid-cols-2 gap-2">
              {rolePresets.map((preset) => (
                <div
                  key={preset.role}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    role === preset.role
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-brand/50'
                  }`}
                  onClick={() => setRole(preset.role)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{preset.icon}</span>
                    <span className="text-sm font-medium text-ink">{preset.name}</span>
                  </div>
                  <p className="text-xs text-ink-faint">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-2 block">描述</label>
            <textarea
              className="input w-full min-h-[60px]"
              placeholder={selectedRolePreset?.description || '描述这个AI成员的用途...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-medium text-ink mb-3">AI 配置</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">AI 供应商</label>
                <select
                  className="input w-full"
                  value={config.vendor}
                  onChange={(e) => {
                    const newVendor = e.target.value;
                    const vendorInfo = getVendorById(newVendor);
                    setConfig({
                      ...config,
                      vendor: newVendor,
                      baseUrl: vendorInfo?.baseUrl || config.baseUrl,
                      model: vendorInfo?.defaultModel || config.model,
                    });
                  }}
                >
                  {AI_VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">模型</label>
                <input
                  className="input w-full"
                  placeholder="输入模型名称"
                  value={config.customModelName || config.model}
                  onChange={(e) => {
                    const vendorInfo = getVendorById(config.vendor);
                    if (e.target.value === vendorInfo?.defaultModel) {
                      setConfig({ ...config, model: e.target.value, customModelName: '' });
                    } else {
                      setConfig({ ...config, customModelName: e.target.value });
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">API Key</label>
                <input
                  className="input w-full"
                  type="password"
                  placeholder="输入 API Key"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Base URL</label>
                <input
                  className="input w-full"
                  placeholder="https://api.example.com/v1"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-ink-muted">温度参数</label>
                  <span className="text-xs text-ink">{config.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  className="range-slider w-full"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">最大输入 Token</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={config.maxInputTokens}
                    onChange={(e) => setConfig({ ...config, maxInputTokens: parseInt(e.target.value) || 4000 })}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">最大输出 Token</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={config.maxOutputTokens}
                    onChange={(e) => setConfig({ ...config, maxOutputTokens: parseInt(e.target.value) || 2000 })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">启用此AI成员</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn btn-outline flex-1" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
