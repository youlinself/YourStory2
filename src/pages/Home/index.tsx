import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        欢迎使用个人自传创作工具
      </h2>
      <p className="text-gray-600 mb-8">
        通过AI辅助，轻松记录您的人生故事。选择对话模式，让AI引导您回忆和整理人生的重要时刻。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="对话式创作"
          onClick={() => navigate('/dialogue')}
          className="hover:shadow-lg transition-shadow"
        >
          <p className="text-gray-600 mb-4">
            通过与AI对话，逐步构建您的自传。AI会提出问题，引导您回忆人生的重要时刻。
          </p>
          <Button variant="primary">
            开始对话创作
          </Button>
        </Card>

        <Card
          title="我的自传"
          onClick={() => navigate('/autobiography')}
          className="hover:shadow-lg transition-shadow"
        >
          <p className="text-gray-600 mb-4">
            查看和管理您的自传内容，编辑章节，导出最终作品。
          </p>
          <Button variant="primary">
            查看自传
          </Button>
        </Card>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          快速开始
        </h3>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ol className="list-decimal list-inside space-y-3 text-gray-600">
            <li>在设置页面配置您的AI API Key</li>
            <li>选择对话式创作模式</li>
            <li>跟随AI的引导，回忆和记录您的人生故事</li>
            <li>编辑和完善生成的自传内容</li>
            <li>导出您的个人自传</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;