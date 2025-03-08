import { useState, useCallback, useEffect } from 'react'
import { RTCPeerConnection } from 'react-native-webrtc-web-shim'
import { Audio } from 'expo-av'
import api from '../index'
import { OpenAIConnectionResponse } from '../types'

const BASE_URL = 'https://api.openai.com/v1/realtime'
const MODEL = 'gpt-4o-realtime-preview-2024-12-17'

export const useOpenAI = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: null as Error | null,
    ephemeralKey: null as string | null,
    peerConnection: null as RTCPeerConnection | null,
  })

  const setError = (error: Error) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }

  const getEphemeralKey = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await api.openai.connect()
      setState((prev) => ({
        ...prev,
        ephemeralKey: response.data['client_secret']['value'],
        isLoading: false,
      }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    }
  }

  const initializeWebRTC = useCallback(async () => {
    try {
      const pc = new RTCPeerConnection()
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })

      pc.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', pc.connectionState)
      })

      setState((prev) => ({ ...prev, peerConnection: pc }))
      await getEphemeralKey()
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to initialize WebRTC'),
      )
    }
  }, [])

  const initializeCommsWithOpenAI = useCallback(
    async (sdp: string) => {
      const { ephemeralKey, peerConnection } = state
      if (!ephemeralKey || !peerConnection) return

      try {
        console.log('Sending SDP offer:', sdp)
        const sdpResponse = await fetch(`${BASE_URL}?model=${MODEL}`, {
          method: 'POST',
          body: sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
        })

        if (!sdpResponse.ok) {
          const errorData = await sdpResponse.json()
          throw new Error(errorData.message || 'Failed to connect to OpenAI')
        }

        const answerSdp = await sdpResponse.text()
        console.log('Received SDP answer:', answerSdp)

        await peerConnection.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp,
        })
        console.log('Remote description set successfully')
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to connect to OpenAI'),
        )
      }
    },
    [state.ephemeralKey, state.peerConnection],
  )

  useEffect(() => {
    return () => {
      state.peerConnection?.close()
    }
  }, [])

  return {
    ...state,
    initializeWebRTC,
    initializeCommsWithOpenAI,
  }
}
