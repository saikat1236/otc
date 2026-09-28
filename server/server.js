import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, DB } from './db.js';
import { TradingEngine } from './engine/tradingEngine.js';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Start trading engine
const engine = new TradingEngine(io);

// Socket.io Connection Handler
io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId || 'guest_' + socket.id.slice(0, 6);
  // Fetch user profile
  const user = await DB.getUser(userId);

  // Send initial state on connection
  socket.emit('INITIAL_STATE', {
    user,
    candles: engine.candles,
    currentCandle: engine.currentCandle,
    currentPrice: engine.currentPrice,
    round: engine.getRoundPublicState(),
    activeTrades: engine.activeTrades.filter(t => t.userId === userId)
  });

  // Handle Trade Placement
  socket.on('PLACE_TRADE', async (data) => {
    try {
      const { amount, direction, isDemo = true } = data;
      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount < 1) {
        socket.emit('TRADE_ERROR', { message: 'Minimum trade amount is $1.00' });
        return;
      }

      // Check balance
      const currentUser = await DB.getUser(userId);
      const balance = isDemo ? currentUser.demoBalance : currentUser.balance;

      if (balance < numAmount) {
        socket.emit('TRADE_ERROR', { message: 'Insufficient balance to place trade' });
        return;
      }

      // Deduct bet amount from user balance
      const updatedUser = await DB.updateUserBalance(userId, -numAmount, isDemo);

      // Submit to TradingEngine
      const result = engine.placeTrade({
        userId,
        direction,
        amount: numAmount,
        isDemo
      });

      if (!result.success) {
        // Refund if round was locked
        await DB.updateUserBalance(userId, numAmount, isDemo);
        socket.emit('TRADE_ERROR', { message: result.error });
        return;
      }

      socket.emit('TRADE_CONFIRMED', {
        trade: result.trade,
        newBalance: isDemo ? updatedUser.demoBalance : updatedUser.balance
      });

    } catch (err) {
      console.error('Error placing trade:', err);
      socket.emit('TRADE_ERROR', { message: 'Trade execution error: ' + err.message });
    }
  });

  socket.on('REQUEST_SYNC', async () => {
    const user = await DB.getUser(userId);
    socket.emit('SYNC_DATA', {
      user,
      round: engine.getRoundPublicState(),
      currentPrice: engine.currentPrice
    });
  });
});

// Serve frontend static build if it exists
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>OTC Trading MERN Backend</title></head>
        <body style="background:#0a0e17;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
          <h2>OTC MERN Server is Live!</h2>
          <p>API Endpoint: <code>/api/status</code></p>
          <p>WebSocket server active on port 5000.</p>
          <p>Run <code>npm run client:dev</code> or <code>npm run build</code> to serve the PWA client.</p>
        </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[OTC-MERN] Backend Server running on http://localhost:${PORT}`);
  });
}

start();
