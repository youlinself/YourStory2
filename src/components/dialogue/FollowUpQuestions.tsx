import React from 'react';
import { MessageCircleQuestion, ChevronRight, Sparkles } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  title?: string;
  variant?: 'inline' | 'card';
}

export const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  questions,
  onQuestionClick,
  title = '继续深入',
  variant = 'inline',
}) => {
  if (!questions || questions.length === 0) return null;

  if (variant === 'card') {
    return (
      <div className="followup-card">
        <div className="followup-card-header">
          <Sparkles size={14} className="text-gold" />
          <span className="followup-card-title">{title}</span>
        </div>
        <div className="followup-card-list">
          {questions.map((question, index) => (
            <button
              key={index}
              className="followup-card-item"
              onClick={() => onQuestionClick(question)}
            >
              <span className="followup-card-index">{index + 1}</span>
              <span className="followup-card-text">{question}</span>
              <ChevronRight size={14} className="followup-card-arrow" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="followup-inline">
      <div className="followup-inline-header">
        <MessageCircleQuestion size={14} className="text-brand" />
        <span className="followup-inline-title">{title}</span>
      </div>
      <div className="followup-inline-list">
        {questions.map((question, index) => (
          <button
            key={index}
            className="followup-inline-item"
            onClick={() => onQuestionClick(question)}
          >
            <span className="followup-inline-mark">✦</span>
            <span className="followup-inline-text">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpQuestions;
