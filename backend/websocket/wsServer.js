'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const { getBinancePrice, getGoldPrice } = require('../services/marketDataService');

const PRICE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XAUUSD'];
const connectedUsers = new Map();

const initWebSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback_secret_change_in_production'
        );
        const user = await User.findById(decoded.id);
        if (user && user.isActive && !user.isBanned) {
          socket.userId = user._id.toString();
          socket.user = user;
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId || 'guest'})`);

    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
      connectedUsers.set(socket.userId, socket.id);
    }

    socket.on('authenticate', async ({ token }) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback_secret_change_in_production'
        );
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          socket.userId = user._id.toString();
          socket.user = user;
          socket.join(`user_${socket.userId}`);
          connectedUsers.set(socket.userId, socket.id);
          socket.emit('authenticated', { success: true, userId: socket.userId });
        }
      } catch (err) {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    socket.on('subscribe_prices', (symbols) => {
      const validSymbols = Array.isArray(symbols) ? symbols : PRICE_SYMBOLS;
      socket.join('price_updates');
      socket.emit('subscribed', { channel: 'prices', symbols: validSymbols });
    });

    socket.on('subscribe_trades', () => {
      if (socket.userId) {
        socket.join(`trades_${socket.userId}`);
        socket.emit('subscribed', { channel: 'trades' });
      }
    });

    socket.on('subscribe_notifications', () => {
      if (socket.userId) {
        socket.join(`notifications_${socket.userId}`);
        socket.emit('subscribed', { channel: 'notifications' });
      }
    });

    socket.on('chat_message', ({ message, room }) => {
      if (socket.userId && message && room) {
        io.to(room).emit('chat_message', {
          userId: socket.userId,
          message: message.substring(0, 500),
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Broadcast price updates every 5 seconds
  setInterval(async () => {
    if (io.sockets.adapter.rooms.get('price_updates')?.size > 0) {
      try {
        const prices = {};
        for (const symbol of PRICE_SYMBOLS) {
          if (symbol === 'XAUUSD') {
            prices[symbol] = await getGoldPrice();
          } else {
            prices[symbol] = await getBinancePrice(symbol);
          }
        }
        io.to('price_updates').emit('price_update', {
          prices,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error(`Price broadcast error: ${err.message}`);
      }
    }
  }, 5000);

  logger.info('WebSocket server initialized');
};

const emitToUser = (io, userId, event, data) => {
  if (io && userId) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

const emitNotificationToUser = (io, userId, notification) => {
  emitToUser(io, userId, 'new_notification', notification);
};

const emitTradeUpdate = (io, userId, trade) => {
  emitToUser(io, userId, 'trade_update', trade);
};

module.exports = { initWebSocket, emitToUser, emitNotificationToUser, emitTradeUpdate };
