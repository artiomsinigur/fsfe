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

// This ensures that the database is properly closed when the server is terminated
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server.');
    wss.clients.forEach((client) => {
        client.close();
    });
    server.close(() => {
        shutdownDB();
    });
});

// Begin WebSocket behavior
const WebSocket = require('ws').Server;
const wss = new WebSocket({ server: server });

wss.on('connection', (ws) => {
    const numClients = wss.clients.size;
    wss.broadcast(`Current visitors: ${numClients}`);
    console.log('New client connected: ', numClients);

    if (ws.readyState === ws.OPEN) {
        ws.send('Welcome to the WebSocket server!');
    }

    db.run(`
        INSERT INTO visitors (count, time)
        VALUES (${numClients}, datetime('now'))
    `)

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
// End websockets

// Begin Database setup
const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

// Serialize to ensure that the table is created before any operations
db.serialize(() => {
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
})
 
function getCounts(callback) {
    db.each('SELECT * FROM visitors', (err, row) => {
        console.log(row);
    });
}

function shutdownDB() {
    getCounts();
    console.log('Shutting down database.');
    db.close();
}