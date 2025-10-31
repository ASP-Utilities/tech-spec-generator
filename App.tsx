import React, { useState, useEffect, useRef } from 'react';
import type { Chat, Content } from '@google/genai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import type { Message } from './types';
import { Sender } from './types';
import { startChat, sendMessageToAI } from './services/geminiService';
import { saveChatHistoryToBackend } from './services/backendService';
import logger from './src/config/logger';

const initialMessage: Message = {
  sender: Sender.AI,
  text: "Hello! I'm your Tech Request Assistant. I'm here to help you think through your project, solution or initiative. To start, could you tell me a bit about what it is you have in mind? What is the main goal or problem you are trying to solve?",
};

const convertMessagesToHistory = (messages: Message[]): Content[] => {
  // The first message is the initial greeting from the UI, not part of the model's conversational history.
  // We only include messages after the first one to build the history for the chat session.
  const historyMessages = messages.length > 1 ? messages.slice(1) : [];
  return historyMessages.map(message => ({
    role: message.sender === Sender.USER ? 'user' : 'model',
    parts: [{ text: message.text }],
  }));
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      logger.error({ context: { error: error instanceof Error ? error.message : 'Unknown error' } }, 'Failed to parse chat history from localStorage');
    }
    return [initialMessage];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    // Initialize the chat session when the component mounts, using history if it exists
    try {
      const history = convertMessagesToHistory(messages);
      chatRef.current = startChat(history);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during chat initialization.';
      setError(`Failed to initialize chat: ${errorMessage}`);
      setMessages(prev => [...prev, { sender: Sender.AI, text: `Error: Failed to initialize. Please check your API key setup. Details: ${errorMessage}` }]);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    // Save conversation to localStorage whenever it changes, but only if there's more than the initial message.
    if (messages.length > 1) {
      try {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
      } catch (error) {
        logger.error({ context: { error: error instanceof Error ? error.message : 'Unknown error' } }, 'Failed to save chat history to localStorage');
      }
    } else {
      // This handles the case where a new chat is started, ensuring the old one is gone.
      localStorage.removeItem('chatHistory');
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newUserMessage: Message = { sender: Sender.USER, text };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      if (!chatRef.current) {
        throw new Error("Chat session is not initialized.");
      }
      const aiResponseText = await sendMessageToAI(chatRef.current, text);
      const newAiMessage: Message = { sender: Sender.AI, text: aiResponseText };
      setMessages(prevMessages => [...prevMessages, newAiMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      const errorAiMessage: Message = { sender: Sender.AI, text: `Sorry, I encountered an error: ${errorMessage}` };
      setMessages(prevMessages => [...prevMessages, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (window.confirm("Are you sure you want to start a new chat? Your current conversation will be lost.")) {
      try {
        // Before clearing the chat, send the history to the backend if it's not just the initial message.
        if (messages.length > 1) {
          saveChatHistoryToBackend(messages);
        }
        
        setMessages([initialMessage]);
        chatRef.current = startChat(); // Re-initialize with no history
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while starting a new chat.';
        setError(`Failed to start new chat: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800 font-['Poppins',_sans-serif]">
      <Header onNewChat={handleNewChat} />
      <ChatWindow messages={messages} isLoading={isLoading} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;