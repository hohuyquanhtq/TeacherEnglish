import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { PageHeader } from '@/src/components/common/StateViews';
import { useAuth } from '@/src/hooks/useAuth';
import { getStageLabel, getSubjectLabel } from '@/src/utils/formatters';

interface CoachMessage {
  id: string;
  sender: 'teacher' | 'coach';
  content: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  'Gợi ý 3 câu tiếng Anh mở đầu tiết học cho lớp 10 không bị căng thẳng',
  'Cách giải thích khái niệm trọng tâm bằng câu ngắn trình độ B1',
  'Mẫu câu nhận xét bài làm nhóm tích cực cho học sinh',
];

export const AiCoachPage: React.FC = () => {
  const { profile } = useAuth();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'msg-1',
      sender: 'coach',
      content: `Chào cô/thầy ${profile.fullName}. Hiện tại mô-đun đang ở giao diện Giai đoạn 1 (chưa kết nối Gemini API). Cô/thầy có thể chọn các tình huống gợi ý bên dưới để xem trước cấu trúc phản hồi sư phạm mẫu cho môn ${getSubjectLabel(
        profile.preferences.primarySubject
      )} (${getStageLabel(profile.preferences.schoolStage)}).`,
      timestamp: 'Vừa xong',
    },
  ]);

  const handleSend = (promptText?: string) => {
    const text = (promptText ?? inputText).trim();
    if (!text) return;

    const teacherMsg: CoachMessage = {
      id: `t-${Date.now()}`,
      sender: 'teacher',
      content: text,
      timestamp: 'Vừa xong',
    };

    const previewCoachReply: CoachMessage = {
      id: `c-${Date.now() + 1}`,
      sender: 'coach',
      content:
        'Bản xem trước giao diện Giai đoạn 1: Gợi ý mẫu câu ngắn gọn — “Let’s start with a quick real-life question before opening your textbook.” (Khi tích hợp Gemini ở giai đoạn tiếp theo, trợ lý sẽ phân tích giáo án và phản hồi theo thời gian thực).',
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, teacherMsg, previewCoachReply]);
    if (!promptText) setInputText('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Teacher Coach"
        description="Không gian cố vấn ngôn ngữ sư phạm và biên tập lời giảng tiếng Anh. Kết nối Gemini sẽ được triển khai ở giai đoạn tiếp theo."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Tình huống gợi ý nhanh</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chọn nhanh một yêu cầu phổ biến để kiểm tra luồng hội thoại trong giao diện Giai đoạn 1.
          </p>
          <div className="space-y-2">
            {SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-800 border border-slate-200 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[460px]">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Cố vấn giảng dạy song ngữ</p>
              <p className="text-xs text-slate-500">Chế độ giao diện mẫu Giai đoạn 1</p>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[380px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'teacher'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-slate-200 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu giảng hoặc tình huống lớp học cần tham khảo..."
              className="flex-1 min-h-11 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
            />
            <button
              type="submit"
              className="min-h-11 px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
