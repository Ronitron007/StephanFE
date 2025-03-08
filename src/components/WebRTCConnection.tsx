import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { useOpenAI } from '../api/hooks/useOpenAI'
import { mediaDevices, MediaStream, DataChannel, RTCPeerConnection } from 'react-native-webrtc-web-shim'

export const WebRTCConnection: React.FC = () => {
  const { initializeWebRTC, error, isLoading, peerConnection, initializeCommsWithOpenAI } = useOpenAI()
  const remoteMediaStream = useRef<MediaStream>(new MediaStream())
  const [dataChannel, setDataChannel] =
    useState < null | ReturnType<RTCPeerConnection['createDataChannel']>>(null)
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(
    null,
  )
  const isVoiceOnly = true
  // useEffect(() => {
  //   initializeWebRTC()
  //   // You might want to initialize WebRTC when the component mounts
  //   // or wait for user interaction
  // }, [])
 
  useEffect(() => {
    console.log('peerConnection', peerConnection)
    if (peerConnection)
    startSession()

  }, [peerConnection])

  


  async function startSession() {
    if (!peerConnection) return
    else{
      console.log(peerConnection, "aaaa")
    }
    peerConnection.addEventListener('track', (event) => {
      if (event?.track) {
        remoteMediaStream.current.addTrack(event.track)
      }else{
        console.log("cant find a track!!")
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

    initializeCommsWithOpenAI(offer.sdp!)
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
