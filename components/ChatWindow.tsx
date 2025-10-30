import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { AnimoSanoLogoIcon } from './icons/AnimoSanoLogoIcon';


interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#08376b]">
      <div className="max-w-4xl mx-auto">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <AnimoSanoLogoIcon className="w-8 h-8 text-slate-600" />
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm rounded-bl-none">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                    <span className="text-slate-500 italic">Assistant is writing...</span>
                </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};
