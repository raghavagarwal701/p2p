const WebSocket = require('ws');
const serverIp = '192.168.0.138';
const wss = new WebSocket.Server({host: serverIp , port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    // Broadcast the message to all other clients
    const messageStr = message.toString();
    console.log(messageStr);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

//   ws.send('Welcome to the WebSocket server!');
});
