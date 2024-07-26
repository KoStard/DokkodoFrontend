export interface Thread {
  id: string;
  name: string;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
}

export interface MediaFile {
  filename: string;
  content_type: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  media_files?: MediaFile[];
  visible: boolean;
}

export interface ChatError {
  message: string;
}