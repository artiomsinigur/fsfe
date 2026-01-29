const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ---------- DATABASE ----------
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
});

// ---------- HTTP ----------
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

// ---------- WEBSOCKETS ----------
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    const count = wss.clients.size;

    console.log('New client connected:', count);
    broadcast(`Current visitors: ${count}`);

    ws.send('Welcome to the WebSocket server!');

    db.run(
        `INSERT INTO visitors (count, time) VALUES (?, datetime('now'))`,
        [count]
    );

    ws.on('close', () => {
        const count = wss.clients.size;
        console.log('Client disconnected:', count);
        broadcast(`Current visitors: ${count}`);
    });
});

// ---------- CLEAN SHUTDOWN ----------
let shuttingDown = false;

process.on('SIGINT', async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\nReceived SIGINT. Shutting down server.');

    // Close websocket clients
    wss.clients.forEach(client => client.close());

    server.close(async () => {
        await dumpAndCloseDB();
        process.exit(0);
    });
});

function dumpAndCloseDB() {
    return new Promise((resolve, reject) => {
        console.log('Dumping visitor counts:');

        db.each(
            'SELECT * FROM visitors',
            (err, row) => {
                if (err) return reject(err);
                console.log(row);
            },
            () => {
                console.log('Shutting down database.');
                db.close(resolve);
            }
        );
    });
}
