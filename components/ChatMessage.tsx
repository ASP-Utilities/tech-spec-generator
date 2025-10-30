import React from 'react';
import type { Message } from '../types';
import { Sender } from '../types';
import { UserIcon } from './icons/UserIcon';
import { AnimoSanoLogoIcon } from './icons/AnimoSanoLogoIcon';
import { CopyButton } from './CopyButton';

interface ChatMessageProps {
  message: Message;
}

const renderFormattedText = (text: string) => {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let currentList: React.ReactNode[] = [];

    const flushList = () => {
        if (currentList.length > 0) {
        elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
            {currentList}
            </ul>
        );
        currentList = [];
        }
    };

    const parseLine = (line: string) => {
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const parts = line.split(boldRegex);
        return (
        <>
            {parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
            )}
        </>
        );
    };

    lines.forEach((line, index) => {
        if (line.trim() === '---') {
        flushList();
        elements.push(<hr key={index} className="my-4 border-slate-200" />);
        return;
        }
        
        const headingMatch = line.match(/^\s*\*\*(.*)\*\*\s*$/);
        if (headingMatch && headingMatch[1]) {
            flushList();
            elements.push(<h3 key={index} className="font-bold text-lg mt-4 mb-2 text-slate-800">{headingMatch[1]}</h3>);
            return;
        }

        const listItemMatch = line.match(/^\s*[\*-]\s(.*)/);
        if (listItemMatch) {
        currentList.push(<li key={index}>{parseLine(listItemMatch[1])}</li>);
        return;
        }

        flushList();
        if (line.trim()) {
        elements.push(<p key={index}>{parseLine(line)}</p>);
        }
    });

    flushList();

    return elements;
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === Sender.AI;
  const isSummary = isAI && message.text.includes('---');

  const wrapperClasses = `flex items-start gap-4 mb-6 ${isAI ? '' : 'justify-end'}`;
  const bubbleClasses = `max-w-2xl p-4 rounded-xl shadow-sm ${
    isAI ? 'bg-white text-slate-700 rounded-bl-none' : 'bg-[#35c0ed] text-[#08376b] rounded-br-none'
  }`;
  const contentClasses = "prose max-w-none prose-p:mb-2 prose-headings:mb-2 prose-ul:my-2";

  const Avatar = isAI ? 
    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
      <AnimoSanoLogoIcon className="w-8 h-8" />
    </div> : 
    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
      <UserIcon className="w-6 h-6 text-slate-600" />
    </div>;

  return (
    <div className={wrapperClasses}>
      {isAI && Avatar}
      <div className={bubbleClasses}>
        <div className={contentClasses}>
            {renderFormattedText(message.text)}
        </div>
        {isSummary && <CopyButton textToCopy={message.text} />}
      </div>
      {!isAI && Avatar}
    </div>
  );
};