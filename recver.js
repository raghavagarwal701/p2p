

    const remoteVideo = document.getElementById('remoteVideo');
    let pc2;
    let ws;

    window.onload = () => {
      // Initialize WebSocket connection
      ws = new WebSocket('ws://192.168.0.138:8080');
      ws.onmessage = handleMessage;

      const configuration = {};
      pc2 = new RTCPeerConnection(configuration);
      pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
      pc2.addEventListener('track', event => {
        console.log(event)
        if (remoteVideo.srcObject !== event.streams[0]) {
          remoteVideo.srcObject = event.streams[0];
          console.log('Received remote stream');
        }
      });
    };

    async function handleMessage(event) {
        // Convert the Blob to text
        const messageStr = await event.data.text();
        console.log(messageStr);
      
        // Parse the JSON
        const message = JSON.parse(messageStr);
        
        if (message.type === 'offer') {
            const desc = new RTCSessionDescription({ type: 'offer', sdp: message.sdp });
            await pc2.setRemoteDescription(desc);
    
            const answer = await pc2.createAnswer();
            await pc2.setLocalDescription(answer);
            console.log(JSON.stringify({ type: 'answer', sdp: answer.sdp }))
            ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
        } else if (message.type === 'ice-candidate') {
            const candidate = new RTCIceCandidate(message.candidate);
            await pc2.addIceCandidate(candidate);
        }
    }
    

    async function onIceCandidate(pc, event) {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    }