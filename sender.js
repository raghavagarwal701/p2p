
    'use strict';

    const startButton = document.getElementById('startButton');
    const callButton = document.getElementById('callButton');
    const hangupButton = document.getElementById('hangupButton');
    callButton.disabled = true;
    hangupButton.disabled = true;
    startButton.addEventListener('click', start);
    callButton.addEventListener('click', call);
    hangupButton.addEventListener('click', hangup);

    let localStream;
    let pc1;
    let ws;

    const localVideo = document.getElementById('localVideo');
    const offerOptions = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    };

    async function start() {
      console.log('Requesting local stream');
      startButton.disabled = true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        console.log('Received local stream');
        localVideo.srcObject = stream;
        localStream = stream;
        callButton.disabled = false;

        // Initialize WebSocket connection
        ws = new WebSocket('ws://192.168.0.138:8080');
        ws.onmessage = handleMessage;
      } catch (e) {
        alert(`getUserMedia() error: ${e.name}`);
      }
    }

    async function call() {
      callButton.disabled = true;
      hangupButton.disabled = false;
      console.log('Starting call');

      const configuration = {};
      pc1 = new RTCPeerConnection(configuration);
      pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));

      localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
      console.log('Added local stream to pc1');

      try {
        const offer = await pc1.createOffer(offerOptions);
        await pc1.setLocalDescription(offer);
        console.log(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
        ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }));
      } catch (e) {
        console.error('Failed to create session description:', e);
      }
    }

    async function handleMessage(event) {
      // console.log(event)
      // if(JSON.parse(event.data))
      const messageStr = await event.data.text();
      console.log(messageStr);
      // Parse the JSON
      const message = JSON.parse(messageStr);
      if (message.type === 'answer') {
        const desc = new RTCSessionDescription({ type: 'answer', sdp: message.sdp });
        await pc1.setRemoteDescription(desc);
      } else if (message.type === 'ice-candidate') {
        const candidate = new RTCIceCandidate(message.candidate);
        await pc1.addIceCandidate(candidate);
      }
    }

    async function onIceCandidate(pc, event) {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    }

    function hangup() {
      console.log('Ending call');
      pc1.close();
      pc1 = null;
      hangupButton.disabled = true;
      callButton.disabled = false;
    }
