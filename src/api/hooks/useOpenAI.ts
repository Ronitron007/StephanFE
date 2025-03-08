import { useState, useCallback, useEffect } from 'react'
import { RTCPeerConnection } from 'react-native-webrtc-web-shim'
import api from '../index'
import { OpenAIConnectionResponse } from '../types'
import WebRTCService from '../../services/WebRTCService'

const BASE_URL = 'https://api.openai.com/v1/realtime'
const model = 'gpt-4o-realtime-preview-2024-12-17'

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [ephemeralKey, setEphemeralKey] =
    useState<OpenAIConnectionResponse | null>(null)
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null)

  const getEphemeralKeyAndConnectToOpenAI = async () => {
    setIsLoading(true)
    setError(null)
    try {
      api.openai.connect().then((response) => {
        console.log('response', response)
        setEphemeralKey(response.data['client_secret']['value'])
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const initializeWebRTC = useCallback(async () => {
    try {
      const pc = await WebRTCService.initializePeerConnection()
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
  }, [ephemeralKey])

  const initializeCommsWithOpenAI = useCallback(
    async (sdp) => {
      const sdpResponse = await fetch(`${BASE_URL}?model=${model}`, {
        method: 'POST',
        body: sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      })
      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      }
      await peerConnection?.setRemoteDescription(answer)
    },
    [ephemeralKey],
  )

  useEffect(() => {
    return () => {
      WebRTCService.cleanup()
    }
  }, [])

  return {
    ephemeralKey,
    isLoading,
    error,
    initializeWebRTC,
    peerConnection,
    initializeCommsWithOpenAI,
  }
}
