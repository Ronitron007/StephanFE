import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { useOpenAI } from '../api/hooks/useOpenAI'
import { mediaDevices, MediaStream, DataChannel } from 'react-native-webrtc'
export const WebRTCConnection: React.FC = () => {
  const { initializeWebRTC, error, isLoading, peerConnection } = useOpenAI()
  const remoteMediaStream = useRef<MediaStream>(new MediaStream())
  const [dataChannel, setDataChannel] =
    useState < ReturnType<RTCPeerConnection['createDataChannel'] | null>(null)
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(
    null,
  )
  const isVoiceOnly = true
  useEffect(() => {
    initializeWebRTC()
    // You might want to initialize WebRTC when the component mounts
    // or wait for user interaction
  }, [])
  useEffect(() => {
    startSession()
  }, [peerConnection])

  async function startSession() {
    if (!peerConnection) return
    peerConnection.addEventListener('track', (event) => {
      if (event?.track) {
        remoteMediaStream.current.addTrack(event.track)
      }
    })
    const ms = await mediaDevices.getUserMedia({
      audio: true,
      video: isVoiceOnly ? false : true,
    })
    setLocalMediaStream(ms!)
    const dc = peerConnection.createDataChannel('test')
    setDataChannel(dc)

    const offer = await peerConnection.createOffer({})
    await peerConnection.setLocalDescription(offer)
  }

  return (
    <View>
      <Button
        title="Initialize WebRTC Connection"
        onPress={initializeWebRTC}
        disabled={isLoading}
      />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
      <Text>
        Connection Status: {peerConnection?.connectionState || 'Not connected'}
      </Text>
    </View>
  )
}
