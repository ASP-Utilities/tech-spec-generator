import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import logger from '../src/config/logger';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function startChat(history?: Content[]): Chat {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: SYSTEM_PROMPT,
    },
  });
}

export async function sendMessageToAI(chat: Chat, message: string): Promise<string> {
    try {
        const response: GenerateContentResponse = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        logger.error({ context: { error: error instanceof Error ? error.message : 'Unknown error' } }, 'Error sending message to Gemini');
        if (error instanceof Error) {
            return `Error communicating with AI: ${error.message}`;
        }
        return "An unknown error occurred while communicating with the AI.";
    }
}
