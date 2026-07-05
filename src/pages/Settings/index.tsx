import React, { useState, useCallback } from 'react';
import { Card, Input, Button } from '../../components';
import { useAIStore } from '../../stores';
import { AI_VENDORS, getVendorModels, fetchVendorModels } from '../../ai_config';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const Settings: React.FC = () => {
  const {
    apiKey, model, baseUrl, vendor, temperature, maxInputTokens, maxOutputTokens,
    setApiKey, setModel, setBaseUrl, setVendor, setTemperature,
    setMaxInputTokens, setMaxOutputTokens, saveSettings,
  } = useAIStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localVendor, setLocalVendor] = useState(vendor);
  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localMaxInputTokens, setLocalMaxInputTokens] = useState(maxInputTokens);
  const [localMaxOutputTokens, setLocalMaxOutputTokens] = useState(maxOutputTokens);
  const [saved, setSaved] = useState(false);

  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);

  const isCustomVendor = localVendor === 'custom';
  const modelList = fetchedModels.length > 0 ? fetchedModels : getVendorModels(localVendor);

  const handleVendorChange = (newVendor: string) => {
    setLocalVendor(newVendor);
    setFetchedModels([]);
    setTestStatus('idle');
    setTestMessage('');
    const v = AI_VENDORS.find((item) => item.id === newVendor);
    if (v) {
      if (v.baseUrl) setLocalBaseUrl(v.baseUrl);
      if (v.defaultModel) setLocalModel(v.defaultModel);
    }
  };

  const handleTestConnection = useCallback(async () => {
    if (!localApiKey.trim()) {
      setTestStatus('error');
      setTestMessage('请先输入 API Key');
      return;
    }
    if (isCustomVendor && !localBaseUrl.trim()) {
      setTestStatus('error');
      setTestMessage('自定义供应商请先填写 Base URL');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');
    setFetchedModels([]);

    try {
      const models = await fetchVendorModels(localVendor, localApiKey.trim());
      setFetchedModels(models);
      setTestStatus('success');
      setTestMessage(`连接成功，获取到 ${models.length} 个模型`);
      if (models.length > 0) {
        setLocalModel(models[0]);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : '连接失败');
    }
  }, [localVendor, localApiKey, localBaseUrl, isCustomVendor]);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    setBaseUrl(localBaseUrl);
    setVendor(localVendor);
    setTemperature(localTemperature);
    setMaxInputTokens(localMaxInputTokens);
    setMaxOutputTokens(localMaxOutputTokens);
    saveSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-display-md mb-6">
        设置
      </h1>

      <Card title="AI 配置" className="mb-6">
        <div className="space-y-5">
          {/* Vendor Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-ink-secondary">
              AI 供应商
            </label>
            <select
              value={localVendor}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="input-base appearance-none"
            >
              {AI_VENDORS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key + Test Button */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-ink-secondary">
              API Key
            </label>
            <div className="flex gap-3">
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="请输入您的 AI API Key"
                className="flex-1 w-full px-4 py-[0.75rem] font-sans text-[0.9375rem] leading-normal text-ink-primary bg-bg-elevated border border-border-default rounded-xl outline-none transition-all duration-200 placeholder:text-ink-faint focus:border-brand-primary focus:shadow-[0_0_0_3px_var(--color-brand-primary-light)]"
              />
              <Button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="whitespace-nowrap"
              >
                {testStatus === 'testing' ? '测试中...' : '测试并获取模型'}
              </Button>
            </div>
            {testStatus !== 'idle' && testMessage && (
              <p className={`text-caption ${
                testStatus === 'success' ? 'text-success' :
                testStatus === 'error' ? 'text-error' :
                'text-ink-muted'
              }`}>
                {testMessage}
              </p>
            )}
          </div>

          {/* Base URL */}
          <Input
            label="Base URL"
            value={localBaseUrl}
            onChange={setLocalBaseUrl}
            placeholder={isCustomVendor ? '请输入自定义 API 地址' : '默认自动填充'}
          />

          {/* Model Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-ink-secondary">
              模型
              {fetchedModels.length > 0 && (
                <span className="ml-2 text-caption text-success font-normal">
                  (已从供应商获取)
                </span>
              )}
            </label>
            {modelList.length > 0 ? (
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="input-base appearance-none"
              >
                {modelList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={localModel}
                onChange={setLocalModel}
                placeholder="请输入模型名称，或点击上方「测试并获取模型」"
              />
            )}
          </div>

          {/* Temperature Slider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-ink-secondary">
              温度 (Temperature): {localTemperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localTemperature}
              onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-fine-print text-ink-muted">
              <span>精确 (0)</span>
              <span>创意 (2)</span>
            </div>
          </div>

          {/* Max Input Tokens */}
          <Input
            label="最大输入 Token 数"
            value={String(localMaxInputTokens)}
            onChange={(v) => setLocalMaxInputTokens(parseInt(v, 10) || 4000)}
            type="number"
            placeholder="4000"
          />

          {/* Max Output Tokens */}
          <Input
            label="最大输出 Token 数"
            value={String(localMaxOutputTokens)}
            onChange={(v) => setLocalMaxOutputTokens(parseInt(v, 10) || 2000)}
            type="number"
            placeholder="2000"
          />

          <p className="text-caption text-ink-muted">
            支持 OpenAI、DeepSeek、Claude 等主流 AI 服务提供商。请确保您的 API Key 具有足够的权限和额度。
          </p>

          <Button onClick={handleSave} className="w-full">
            {saved ? '已保存' : '保存设置'}
          </Button>
        </div>
      </Card>

      <Card title="使用说明">
        <div className="space-y-3 text-body text-ink-secondary">
          <p>1. 选择您的 AI 供应商并填写对应的 API Key</p>
          <p>2. 点击「测试并获取模型」验证连通性并拉取最新模型列表</p>
          <p>3. 选择您想使用的 AI 模型</p>
          <p>4. 调整温度参数：越低越精确，越高越有创意</p>
          <p>5. 返回首页，开始对话式创作</p>
          <p>6. 在对话中输入 <code className="bg-bg-secondary px-2 py-0.5 rounded text-caption font-mono">/compact</code> 可压缩上下文</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
