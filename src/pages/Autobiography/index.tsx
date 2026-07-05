import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '../../components';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../../services';
import { generateId } from '../../utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Autobiography {
  id: string;
  title: string;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

const AutobiographyPage: React.FC = () => {
  const navigate = useNavigate();
  const [autobiography, setAutobiography] = useState<Autobiography | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const storageService = StorageService.getInstance();

  useEffect(() => {
    loadAutobiography();
  }, []);

  const loadAutobiography = async () => {
    try {
      const data = await storageService.loadData<Autobiography>('autobiography');
      if (data) {
        setAutobiography(data);
      }
    } catch (error) {
      console.error('加载自传失败:', error);
    }
  };

  const saveAutobiography = async (data: Autobiography) => {
    try {
      await storageService.saveData('autobiography', data);
      setAutobiography(data);
    } catch (error) {
      console.error('保存自传失败:', error);
    }
  };

  const createNewAutobiography = () => {
    const newAutobiography: Autobiography = {
      id: generateId(),
      title: '我的自传',
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    saveAutobiography(newAutobiography);
  };

  const addChapter = () => {
    if (!newChapterTitle.trim() || !autobiography) return;

    const newChapter: Chapter = {
      id: generateId(),
      title: newChapterTitle,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAutobiography = {
      ...autobiography,
      chapters: [...autobiography.chapters, newChapter],
      updatedAt: new Date(),
    };

    saveAutobiography(updatedAutobiography);
    setNewChapterTitle('');
    setIsModalOpen(false);
  };

  const deleteChapter = (chapterId: string) => {
    if (!autobiography) return;

    const updatedAutobiography = {
      ...autobiography,
      chapters: autobiography.chapters.filter((chapter) => chapter.id !== chapterId),
      updatedAt: new Date(),
    };

    saveAutobiography(updatedAutobiography);
  };

  if (!autobiography) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          我的自传
        </h2>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              您还没有开始创建自传
            </p>
            <Button onClick={createNewAutobiography}>
              开始创建自传
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {autobiography.title}
        </h2>
        <Button onClick={() => setIsModalOpen(true)}>
          添加章节
        </Button>
      </div>

      {autobiography.chapters.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              还没有章节，点击上方按钮添加第一章
            </p>
            <Button onClick={() => navigate('/dialogue')}>
              开始对话创作
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {autobiography.chapters.map((chapter, index) => (
            <Card key={chapter.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    第{index + 1}章: {chapter.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    创建于: {new Date(chapter.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dialogue?chapter=${chapter.id}`)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteChapter(chapter.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    删除
                  </Button>
                </div>
              </div>
              {chapter.content && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700 line-clamp-3">
                    {chapter.content}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="添加新章节"
      >
        <div className="space-y-4">
          <Input
            label="章节标题"
            value={newChapterTitle}
            onChange={setNewChapterTitle}
            placeholder="请输入章节标题"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={addChapter}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AutobiographyPage;