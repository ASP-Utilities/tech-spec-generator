import React from 'react';
import { AnimoSanoLogoIcon } from './icons/AnimoSanoLogoIcon';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderProps {
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewChat }) => {
  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center">
        <AnimoSanoLogoIcon className="w-8 h-8 mr-4" />
        <span className="text-xl font-bold text-slate-800">
          Tech Spec Generator
        </span>
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500"
        aria-label="Start a new chat"
      >
        <PlusIcon className="w-4 h-4" />
        New Chat
      </button>
    </header>
  );
};