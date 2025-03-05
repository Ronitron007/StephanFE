import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { useOpenAI } from '../api/hooks/useOpenAI';

const OpenAIConnector: React.FC = () => {
  const { connectToOpenAI, connectionData, isLoading, error } = useOpenAI();

  useEffect(() => {
    // Optionally connect on component mount
    // connectToOpenAI();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpenAI Connection</Text>
      
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}
      
      {connectionData && (
        <View style={styles.resultContainer}>
          <Text>Status: {connectionData.connected ? 'Connected' : 'Disconnected'}</Text>
          <Text>Message: {connectionData.message}</Text>
          {connectionData.version && <Text>Version: {connectionData.version}</Text>}
        </View>
      )}
      
      <Button 
        title={isLoading ? "Connecting..." : "Connect to OpenAI"} 
        onPress={connectToOpenAI}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  errorText: {
    color: 'red',
  },
  resultContainer: {
    backgroundColor: '#eeffee',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
  },
});

export default OpenAIConnector; 