import { useState, useCallback } from 'react';
import api from '../index';
import { OpenAIConnectionResponse } from '../types';

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionData, setConnectionData] = useState<OpenAIConnectionResponse | null>(null);

  const connectToOpenAI = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.openai.connect();
      setConnectionData(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    connectToOpenAI,
    connectionData,
    isLoading,
    error,
  };
}; 