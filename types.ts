
export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  sender: Sender;
  text: string;
}
