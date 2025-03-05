import { API_BASE_URL } from '@env';
import { Platform } from 'react-native';

// Use proxy for web development, direct URL for native
const baseUrl = API_BASE_URL;

// Define all API endpoints in one place
export const ENDPOINTS = {
  OPENAI: {
    CONNECT: `${baseUrl}/connectToOpenAI`,
  },
  // Add more endpoint categories as needed
};
