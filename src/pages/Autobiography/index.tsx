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
        <h2 className="text-apple-display-md text-apple-ink mb-6">
          我的自传
        </h2>
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-apple-parchment flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-apple-ink-muted-48" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-apple-body text-apple-ink-muted-80 mb-6">
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
        <h2 className="text-apple-display-md text-apple-ink">
          {autobiography.title}
        </h2>
        <Button onClick={() => setIsModalOpen(true)}>
          添加章节
        </Button>
      </div>

      {autobiography.chapters.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-apple-body text-apple-ink-muted-80 mb-6">
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
                  <h3 className="text-apple-body-strong text-apple-ink">
                    第{index + 1}章: {chapter.title}
                  </h3>
                  <p className="text-apple-caption text-apple-ink-muted-48 mt-1">
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
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    删除
                  </Button>
                </div>
              </div>
              {chapter.content && (
                <div className="mt-4 p-4 bg-apple-parchment rounded-[11px]">
                  <p className="text-apple-body text-apple-ink-muted-80 line-clamp-3">
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
        <div className="space-y-5">
          <Input
            label="章节标题"
            value={newChapterTitle}
            onChange={setNewChapterTitle}
            placeholder="请输入章节标题"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
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
