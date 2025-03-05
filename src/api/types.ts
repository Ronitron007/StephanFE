// Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// OpenAI specific types
export interface OpenAIConnectionResponse {
  connected: boolean;
  message: string;
  version?: string;
}

// Add more types as needed for different API responses 