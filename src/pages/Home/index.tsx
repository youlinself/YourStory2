import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="mb-10">
        <h2 className="text-apple-display-md text-apple-ink mb-3">
          欢迎使用个人自传创作工具
        </h2>
        <p className="text-apple-body text-apple-ink-muted-80 max-w-2xl">
          通过AI辅助，轻松记录您的人生故事。选择对话模式，让AI引导您回忆和整理人生的重要时刻。
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card
          title="对话式创作"
          onClick={() => navigate('/dialogue')}
        >
          <p className="text-apple-body text-apple-ink-muted-80 mb-6">
            通过与AI对话，逐步构建您的自传。AI会提出问题，引导您回忆人生的重要时刻。
          </p>
          <Button variant="primary">
            开始对话创作
          </Button>
        </Card>

        <Card
          title="我的自传"
          onClick={() => navigate('/autobiography')}
        >
          <p className="text-apple-body text-apple-ink-muted-80 mb-6">
            查看和管理您的自传内容，编辑章节，导出最终作品。
          </p>
          <Button variant="primary">
            查看自传
          </Button>
        </Card>
      </div>

      {/* Quick Start Section */}
      <div>
        <h3 className="text-apple-tagline text-apple-ink mb-5">
          快速开始
        </h3>
        <Card>
          <ol className="space-y-3 text-apple-body text-apple-ink-muted-80 list-none">
            {[
              '在设置页面配置您的AI API Key',
              '选择对话式创作模式',
              '跟随AI的引导，回忆和记录您的人生故事',
              '编辑和完善生成的自传内容',
              '导出您的个人自传',
            ].map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-apple-primary text-white text-apple-fine-print font-medium shrink-0 mt-[2px]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
};

export default Home;
