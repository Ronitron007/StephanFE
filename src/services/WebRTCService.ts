import {
	ScreenCapturePickerView,
	RTCPeerConnection,
	RTCIceCandidate,
	RTCSessionDescription,
	RTCView,
	MediaStream,
	MediaStreamTrack,
	mediaDevices,
	registerGlobals
} from 'react-native-webrtc';
import { Audio } from 'react-native-webrtc';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
  };

  initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection();
    // this.peerConnection = new RTCPeerConnection(this.configuration);
    // TODO: Need to see how does the Audio track works and where to add it
    this.peerConnection.addEventListener(
        "connectionstatechange",(e)=>{
            console.log("connectionstatechange", e);
        }
    );
    this.peerConnection.onicecandidate = this.handleIceCandidate;
    this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange;
    this.peerConnection.ondatachannel = this.handleDataChannel;
    
    return this.peerConnection;
  }

  private handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      // Send the ICE candidate to OpenAI's server
      // You'll need to implement this based on OpenAI's WebRTC API
    }
  };

  private handleConnectionStateChange = () => {
    if (this.peerConnection) {
      console.log('Connection state:', this.peerConnection.connectionState);
    }
  };

  private handleDataChannel = (event: RTCDataChannelEvent) => {
    const dataChannel = event.channel;
    dataChannel.onmessage = (event) => {
      console.log('Received message:', event.data);
    };
  };

  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export default new WebRTCService(); 