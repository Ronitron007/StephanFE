import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Button, Animated, StyleSheet } from 'react-native'
import {
  mediaDevices,
  MediaStream,
  RTCView,
} from 'react-native-webrtc-web-shim'
import { useOpenAI } from '../api/hooks/useOpenAI'
import { Audio } from 'expo-av'

type DataChannelMessage = {
  type: string
  [key: string]: any
}

export const WebRTCConnection: React.FC = () => {
  const {
    initializeWebRTC,
    error,
    isLoading,
    peerConnection,
    initializeCommsWithOpenAI,
  } = useOpenAI()

  const [state, setState] = useState({
    transcript: '',
    localMediaStream: null as MediaStream | null,
    dataChannel: null as RTCDataChannel | null,
  })

  const remoteMediaStream = useRef<MediaStream>(new MediaStream())

  // Audio visualization state
  const [audioLevel, setAudioLevel] = useState(0)
  const audioAnimation = useRef(new Animated.Value(0)).current
  const audioAnalyzerInterval = useRef<NodeJS.Timeout | null>(null)

  // Analyze audio levels
  const startAudioAnalysis = () => {
    if (!state.localMediaStream) return

    // Create analyzer if supported
    try {
      // Just simulate audio levels for demo purposes
      // In a real app, you'd use AudioContext and AnalyserNode on web
      // or a native module on mobile

      console.log('Starting audio visualization')

      // Clean up any existing interval
      if (audioAnalyzerInterval.current) {
        clearInterval(audioAnalyzerInterval.current)
      }

      // For simulation, create random audio levels
      audioAnalyzerInterval.current = setInterval(() => {
        // In reality, this would analyze actual audio data
        // For now, generate random values, but biased toward lower levels
        const newLevel = Math.pow(Math.random(), 2) * 100
        setAudioLevel(newLevel)

        // Animate the bar
        Animated.timing(audioAnimation, {
          toValue: newLevel,
          duration: 100,
          useNativeDriver: false,
        }).start()
      }, 100)
    } catch (error) {
      console.error('Error setting up audio visualization:', error)
    }
  }

  // Stop audio analysis
  const stopAudioAnalysis = () => {
    if (audioAnalyzerInterval.current) {
      clearInterval(audioAnalyzerInterval.current)
      audioAnalyzerInterval.current = null
    }

    setAudioLevel(0)
    audioAnimation.setValue(0)
  }

  // Toggle audio visualization
  const [isVisualizing, setIsVisualizing] = useState(false)

  const toggleAudioVisualization = () => {
    if (isVisualizing) {
      stopAudioAnalysis()
      setIsVisualizing(false)
    } else {
      startAudioAnalysis()
      setIsVisualizing(true)
    }
  }

  // Initialize audio
  const setupAudio = async () => {
    try {
      // Request audio permissions
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        throw new Error('Audio permission not granted')
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      })

      console.log('Audio setup completed')
    } catch (error) {
      console.error('Error setting up audio:', error)
    }
  }

  // Setup media stream
  const setupMediaStream = async (pc: RTCPeerConnection) => {
    try {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })

      mediaStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, mediaStream)
      })

      setState((prev) => ({ ...prev, localMediaStream: mediaStream }))

      // Start visualization if enabled
      if (isVisualizing) {
        startAudioAnalysis()
      }
    } catch (error) {
      console.error('Error setting up media stream:', error)
    }
  }

  // Clean up
  useEffect(() => {
    return () => {
      // Stop audio analysis
      stopAudioAnalysis()

      // Stop local media stream
      if (state.localMediaStream) {
        state.localMediaStream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [])

  useEffect(() => {
    if (peerConnection) startSession()
  }, [peerConnection])

  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as DataChannelMessage
      console.log('Received message:', data)

      switch (data.type) {
        case 'response.audio_transcript.done':
          setState((prev) => ({ ...prev, transcript: data.transcript }))
          break
        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (e) {
      console.log('Raw message received:', event.data)
    }
  }

  const setupDataChannel = (pc: RTCPeerConnection) => {
    const dc = pc.createDataChannel('oai-events')

    dc.onopen = () => {
      console.log('Data channel opened!')
      // Configure session when data channel opens
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: 'You are a helpful assistant',
        },
      }
      dc.send(JSON.stringify(sessionConfig))
    }

    dc.onmessage = handleDataChannelMessage
    setState((prev) => ({ ...prev, dataChannel: dc }))
  }

  const startSession = async () => {
    if (!peerConnection) return

    try {
      // Setup audio first
      await setupAudio()

      // Setup event listeners for remote audio
      peerConnection.addEventListener('track', async (event) => {
        console.log('Received remote track:', event.track.kind)
        if (event?.track) {
          remoteMediaStream.current.addTrack(event.track)

          // If it's an audio track, ensure it's playing
          if (event.track.kind === 'audio') {
            try {
              await Audio.setIsEnabledAsync(true)
            } catch (error) {
              console.error('Error enabling audio playback:', error)
            }
          }
        }
      })

      // Setup data channel and media stream
      setupDataChannel(peerConnection)
      await setupMediaStream(peerConnection)

      // Create and set local description
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })
      await peerConnection.setLocalDescription(offer)

      // Wait for ICE gathering
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Initialize communication with OpenAI
      if (peerConnection.localDescription?.sdp) {
        await initializeCommsWithOpenAI(peerConnection.localDescription.sdp)
      }

      // Add this to startSession
      peerConnection.addEventListener('negotiationneeded', () => {
        console.log('Negotiation needed')
      })

      peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log('ICE gathering state:', peerConnection.iceGatheringState)
      })

      peerConnection.addEventListener('signalingstatechange', () => {
        console.log('Signaling state:', peerConnection.signalingState)
      })
    } catch (error) {
      console.error('Error in startSession:', error)
    }
  }

  const sendTestMessage = () => {
    const message = {
      type: 'message.create',
      message: {
        content: 'Write a haiku about code',
        role: 'user',
      },
    }
    state.dataChannel?.send(JSON.stringify(message))
  }

  return (
    <View style={styles.container}>
      <Button
        title="Initialize WebRTC Connection"
        onPress={initializeWebRTC}
        disabled={isLoading}
      />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
      <Text>
        Connection Status:{' '}
        <Text>{peerConnection?.connectionState || 'Not connected'}</Text>
      </Text>
      {state.transcript && (
        <Text>
          Transcript: <Text>{state.transcript}</Text>
        </Text>
      )}
      <RTCView stream={remoteMediaStream.current} style={styles.remoteStream} />
      <Button
        title="Send Test Message"
        disabled={!state.dataChannel}
        onPress={sendTestMessage}
      />

      {/* Audio controls */}
      <Button
        title={isVisualizing ? 'Stop Visualization' : 'Start Visualization'}
        onPress={toggleAudioVisualization}
        disabled={!state.localMediaStream}
      />

      {/* Audio level visualization */}
      {isVisualizing && (
        <View style={styles.visualizerContainer}>
          <Text>
            Audio Level: <Text>{Math.round(audioLevel)}%</Text>
          </Text>
          <View style={styles.barContainer}>
            <Animated.View
              style={[
                styles.bar,
                {
                  width: audioAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: audioAnimation.interpolate({
                    inputRange: [0, 50, 100],
                    outputRange: ['#00ff00', '#ffff00', '#ff0000'],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  remoteStream: {
    width: '100%',
    height: 200,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  visualizerContainer: {
    marginTop: 20,
  },
  barContainer: {
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 5,
  },
  bar: {
    height: '100%',
  },
})
