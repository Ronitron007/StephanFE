import { useState, useCallback, useEffect } from 'react'
import { RTCPeerConnection } from 'react-native-webrtc'
import api from '../index'
import { OpenAIConnectionResponse } from '../types'
import WebRTCService from '../../services/WebRTCService'

const BASE_URL = 'https://api.openai.com/v1/realtime'
const model = 'gpt-4o-realtime-preview-2024-12-17'

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [ephmeralKey, setEphmeralKey] =
    useState<OpenAIConnectionResponse | null>(null)
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null)

  const getEphemeralKeyAndConnectToOpenAI = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.openai.connect()
      console.log('response', response)
      setEphmeralKey(response.data.clientSecret.value)
      return response.data.clientSecret.value
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const initializeWebRTC = useCallback(async () => {
    try {
      const pc = WebRTCService.initializePeerConnection()
      setPeerConnection(pc)

      // After establishing connection with OpenAI, set up WebRTC
      const response = await getEphemeralKeyAndConnectToOpenAI()
      if (response) {
        // Here you would handle the WebRTC signaling with OpenAI
        // This depends on OpenAI's specific WebRTC API
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to initialize WebRTC'),
      )
    }
  }, [ephmeralKey])

  

  useEffect(() => {
    return () => {
      WebRTCService.cleanup()
    }
  }, [])

  return {
    ephmeralKey,
    isLoading,
    error,
    initializeWebRTC,
    peerConnection,
  }
}
