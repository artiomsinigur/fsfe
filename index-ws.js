const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

// Define WebSocket behavior
const WebSocket = require('ws').Server;
const wss = new WebSocket({ server: server });

wss.on('connection', (ws) => {
    const numClients = wss.clients.size;
    wss.broadcast(`Current visitors: ${numClients}`);
    console.log('New client connected: ', numClients);

    if (ws.readyState === ws.OPEN) {
        ws.send('Welcome to the WebSocket server!');
    }

    ws.on('close', () => {
        const numClients = wss.clients.size;
        wss.broadcast(`Current visitors: ${numClients}`);
        console.log('Client disconnected: ', numClients);
    });
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};