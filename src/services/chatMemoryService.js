const Redis = require('ioredis');
const logger = require('../utils/logger');

class ChatMemoryService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    // Session expiration time (24 hours)
    this.SESSION_EXPIRY = 86400;
  }

  async getSession(phoneNumber) {
    try {
      const sessionKey = `session:${phoneNumber}`;
      const sessionData = await this.redis.get(sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      throw error;
    }
  }

  async setSession(phoneNumber, sessionData) {
    try {
      const sessionKey = `session:${phoneNumber}`;
      await this.redis.set(
        sessionKey,
        JSON.stringify(sessionData),
        'EX',
        this.SESSION_EXPIRY
      );
    } catch (error) {
      logger.error('Error setting session:', error);
      throw error;
    }
  }

  async updateSessionState(phoneNumber, newState) {
    try {
      const session = await this.getSession(phoneNumber) || {};
      session.state = newState;
      await this.setSession(phoneNumber, session);
    } catch (error) {
      logger.error('Error updating session state:', error);
      throw error;
    }
  }

  async addToHistory(phoneNumber, message) {
    try {
      const historyKey = `history:${phoneNumber}`;
      await this.redis.lpush(historyKey, JSON.stringify(message));
      await this.redis.ltrim(historyKey, 0, 49); // Keep last 50 messages
    } catch (error) {
      logger.error('Error adding to history:', error);
      throw error;
    }
  }

  async getHistory(phoneNumber, limit = 50) {
    try {
      const historyKey = `history:${phoneNumber}`;
      const history = await this.redis.lrange(historyKey, 0, limit - 1);
      return history.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('Error getting history:', error);
      throw error;
    }
  }

  async clearSession(phoneNumber) {
    try {
      const sessionKey = `session:${phoneNumber}`;
      const historyKey = `history:${phoneNumber}`;
      await this.redis.del(sessionKey, historyKey);
    } catch (error) {
      logger.error('Error clearing session:', error);
      throw error;
    }
  }

  async setContext(phoneNumber, context) {
    try {
      const session = await this.getSession(phoneNumber) || {};
      session.context = context;
      await this.setSession(phoneNumber, session);
    } catch (error) {
      logger.error('Error setting context:', error);
      throw error;
    }
  }

  async getContext(phoneNumber) {
    try {
      const session = await this.getSession(phoneNumber);
      return session?.context || {};
    } catch (error) {
      logger.error('Error getting context:', error);
      throw error;
    }
  }
}

const chatMemoryService = new ChatMemoryService();

module.exports = {
  chatMemoryService,
  getSession: (phoneNumber) => chatMemoryService.getSession(phoneNumber),
  setSession: (phoneNumber, sessionData) => chatMemoryService.setSession(phoneNumber, sessionData),
  updateSessionState: (phoneNumber, newState) => chatMemoryService.updateSessionState(phoneNumber, newState),
  addToHistory: (phoneNumber, message) => chatMemoryService.addToHistory(phoneNumber, message),
  getHistory: (phoneNumber, limit) => chatMemoryService.getHistory(phoneNumber, limit),
  clearSession: (phoneNumber) => chatMemoryService.clearSession(phoneNumber),
  setContext: (phoneNumber, context) => chatMemoryService.setContext(phoneNumber, context),
  getContext: (phoneNumber) => chatMemoryService.getContext(phoneNumber)
}; 