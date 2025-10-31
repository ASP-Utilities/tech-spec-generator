import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import logger from '../src/config/logger';

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
        // Fallback for non-secure contexts
        logger.error('Clipboard API not available');
        return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      logger.error({ context: { error: err instanceof Error ? err.message : 'Unknown error' } }, 'Failed to copy text');
      alert('Failed to copy text.');
    }
  };

  return (
    <div className="flex justify-end mt-3 border-t border-slate-200 pt-2">
      <button
        onClick={handleCopy}
        type="button"
        aria-label="Copy summary to clipboard"
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500"
      >
        <CopyIcon className="w-4 h-4" />
        {isCopied ? 'Copied!' : 'Copy Summary'}
      </button>
    </div>
  );
};