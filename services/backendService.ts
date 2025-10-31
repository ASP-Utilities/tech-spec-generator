import type { Message } from '../types';
import logger from '../src/config/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second, will use exponential backoff

/**
 * Utility function to wait for a specified duration
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends the chat history to the backend server for storage.
 * 
 * Features:
 * - Automatic retry with exponential backoff for network errors
 * - User notifications for success/failure
 * - Backend generates sessionId
 * 
 * @param messages The array of messages from the completed chat session.
 */
export const saveChatHistoryToBackend = async (messages: Message[]): Promise<void> => {
  const chatSession = {
    messages: messages,
    timestamp: new Date().toISOString(),
  };

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info({ context: { attempt, maxRetries: MAX_RETRIES } }, 'Attempting to save chat history');

      const response = await fetch(`${API_BASE_URL}/api/chat/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatSession),
      });

      if (!response.ok) {
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Failed to save chat: ${errorData.message || response.statusText}`);
        }

        // Retry on 5xx errors (server errors)
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info({ context: { sessionId: result.sessionId } }, 'Chat history saved successfully');
      
      // Show success notification
      showNotification('Chat saved successfully!', 'success');
      return; // Success! Exit the function

    } catch (error) {
      lastError = error as Error;
      logger.error({ context: { attempt, error: (error as Error).message } }, 'Save attempt failed');

      // If this is a client error (4xx) or we're out of retries, throw immediately
      if (error instanceof Error && error.message.includes('Failed to save chat')) {
        showNotification(`Error: ${error.message}`, 'error');
        throw error;
      }

      // If we have retries left, wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1);
        logger.warn({ context: { waitTime, attempt, maxRetries: MAX_RETRIES } }, 'Retrying save operation');
        showNotification(`Save failed. Retrying (${attempt}/${MAX_RETRIES})...`, 'warning');
        await delay(waitTime);
      }
    }
  }

  // All retries exhausted
  logger.error('Failed to save chat history after all retries');
  showNotification('Failed to save chat after multiple attempts. Please try again later.', 'error');
  throw lastError || new Error('Failed to save chat history');
};

/**
 * Simple notification system
 * In a production app, you'd use a proper toast library like react-toastify
 */
function showNotification(message: string, type: 'success' | 'error' | 'warning') {
  // Log the notification
  if (type === 'error') {
    logger.error({ context: { message, type } }, 'User notification');
  } else if (type === 'warning') {
    logger.warn({ context: { message, type } }, 'User notification');
  } else {
    logger.info({ context: { message, type } }, 'User notification');
  }

  // Also show a browser alert for important messages
  if (type === 'success' || type === 'error') {
    // Use a simple alert for now - in production, replace with a toast library
    const icon = type === 'success' ? '✅' : '❌';
    alert(`${icon} ${message}`);
  }
}
