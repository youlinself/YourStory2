import React, { useState } from 'react';
import { Card, Input, Button } from '../../components';
import { useAIStore } from '../../stores';

const Settings: React.FC = () => {
  const { apiKey, model, setApiKey, setModel } = useAIStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    alert('设置已保存');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        设置
      </h2>

      <Card title="AI配置" className="mb-6">
        <div className="space-y-4">
          <Input
            label="API Key"
            value={localApiKey}
            onChange={setLocalApiKey}
            placeholder="请输入您的AI API Key"
            type="password"
          />
          <Input
            label="模型"
            value={localModel}
            onChange={setLocalModel}
            placeholder="请输入模型名称，例如：gpt-3.5-turbo"
          />
          <div className="text-sm text-gray-500">
            <p>支持OpenAI、Claude等主流AI服务提供商。</p>
            <p>请确保您的API Key具有足够的权限和额度。</p>
          </div>
          <Button onClick={handleSave}>
            保存设置
          </Button>
        </div>
      </Card>

      <Card title="使用说明">
        <div className="space-y-3 text-gray-600">
          <p>1. 在上方输入您的AI API Key</p>
          <p>2. 选择您想使用的AI模型</p>
          <p>3. 返回首页，开始对话式创作</p>
          <p>4. AI会引导您回忆和记录人生故事</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;