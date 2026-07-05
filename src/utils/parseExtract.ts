import type { ExtractedContent } from '../types';

/**
 * 从 AI 回复中解析 [EXTRACT]...[END_EXTRACT] 标记
 * 返回纯文本和提取的结构化内容
 */
export function parseExtract(response: string): {
  text: string;
  extract: ExtractedContent | null;
} {
  const regex = /\[EXTRACT\](.*?)\[END_EXTRACT\]/s;
  const match = response.match(regex);
  if (!match) return { text: response, extract: null };

  const text = response.replace(regex, '').trim();
  try {
    const parsed = JSON.parse(match[1]);
    const extract: ExtractedContent = {
      paragraphs: parsed.paragraphs || [],
      timeTag: parsed.timeTag,
      emotionTags: parsed.emotionTags,
      people: parsed.people,
      status: 'pending',
    };
    return { text, extract };
  } catch {
    return { text: response, extract: null };
  }
}
