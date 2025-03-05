import { ENDPOINTS } from './endpoints';
import { ApiResponse } from './types';

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Generic fetch function with error handling
async function fetchApi<T>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      ...options,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return {
      data,
      status: response.status,
      message: 'Success',
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API methods
export const api = {
  // OpenAI related endpoints
  openai: {
    connect: () => fetchApi(ENDPOINTS.OPENAI.CONNECT, { method: 'GET' }),
  },
  
  // Add more API categories as needed
};

export default api; 