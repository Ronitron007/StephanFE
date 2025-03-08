import { Audio } from 'expo-av'
import { RTCPeerConnection } from 'react-native-webrtc-web-shim'

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null

  async initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection()
    // this.peerConnection = new RTCPeerConnection(this.configuration);
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    this.peerConnection.addEventListener('connectionstatechange', (e) => {
      console.log('connectionstatechange', e)
    })

    return this.peerConnection
  }

  private handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      // Send the ICE candidate to OpenAI's server
      // You'll need to implement this based on OpenAI's WebRTC API
    }
  }

  private handleConnectionStateChange = () => {
    if (this.peerConnection) {
      console.log('Connection state:', this.peerConnection.connectionState)
    }
  }

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    const dataChannel = event.channel
    dataChannel.onmessage = (event) => {
      console.log('Received message:', event.data)
    }
  }

  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }
}

export default new WebRTCService()
