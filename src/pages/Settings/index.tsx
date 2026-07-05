import React, { useState } from 'react';
import { Card, Input, Button } from '../../components';
import { useAIStore } from '../../stores';
import { AI_VENDORS, getVendorModels } from '../../ai_config';

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

  const vendorModels = getVendorModels(localVendor);
  const isCustomVendor = localVendor === 'custom';

  const handleVendorChange = (newVendor: string) => {
    setLocalVendor(newVendor);
    // 切换供应商时自动填充默认值
    const v = AI_VENDORS.find((item) => item.id === newVendor);
    if (v) {
      if (v.baseUrl) setLocalBaseUrl(v.baseUrl);
      if (v.defaultModel) setLocalModel(v.defaultModel);
    }
  };

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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        设置
      </h2>

      <Card title="AI 配置" className="mb-6">
        <div className="space-y-4">
          {/* 供应商选择 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              AI 供应商
            </label>
            <select
              value={localVendor}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {AI_VENDORS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <Input
            label="API Key"
            value={localApiKey}
            onChange={setLocalApiKey}
            placeholder="请输入您的 AI API Key"
            type="password"
          />

          {/* Base URL */}
          <Input
            label="Base URL"
            value={localBaseUrl}
            onChange={setLocalBaseUrl}
            placeholder={isCustomVendor ? '请输入自定义 API 地址' : '默认自动填充'}
          />

          {/* 模型选择 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              模型
            </label>
            {vendorModels.length > 0 && !isCustomVendor ? (
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {vendorModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={localModel}
                onChange={setLocalModel}
                placeholder="请输入模型名称"
              />
            )}
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
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
            <div className="flex justify-between text-xs text-gray-400">
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

          <div className="text-sm text-gray-500">
            <p>支持 OpenAI、DeepSeek、Claude 等主流 AI 服务提供商。</p>
            <p>请确保您的 API Key 具有足够的权限和额度。</p>
          </div>

          <Button onClick={handleSave}>
            {saved ? '已保存' : '保存设置'}
          </Button>
        </div>
      </Card>

      <Card title="使用说明">
        <div className="space-y-3 text-gray-600">
          <p>1. 选择您的 AI 供应商并填写对应的 API Key</p>
          <p>2. 选择您想使用的 AI 模型</p>
          <p>3. 调整温度参数：越低越精确，越高越有创意</p>
          <p>4. 返回首页，开始对话式创作</p>
          <p>5. AI 会引导您回忆和记录人生故事</p>
          <p>6. 在对话中输入 <code className="bg-gray-100 px-1 rounded">/compact</code> 可压缩上下文</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
