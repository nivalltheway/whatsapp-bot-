const express = require('express');
const { airtableService } = require('../services/airtableService');
const { chatMemoryService } = require('../services/chatMemoryService');
const logger = require('../utils/logger');

function setupAdminRoutes(app) {
  const router = express.Router();

  // Middleware to check admin authentication
  const authenticateAdmin = (req, res, next) => {
    // TODO: Implement proper authentication
    // For now, we'll just check for a basic API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Get chat history for a phone number
  router.get('/history/:phoneNumber', authenticateAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const history = await chatMemoryService.getHistory(phoneNumber, limit);
      res.json(history);
    } catch (error) {
      logger.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get session data for a phone number
  router.get('/session/:phoneNumber', authenticateAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const session = await chatMemoryService.getSession(phoneNumber);
      res.json(session || {});
    } catch (error) {
      logger.error('Error fetching session data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all interactions from Airtable
  router.get('/interactions', authenticateAdmin, async (req, res) => {
    try {
      const { phoneNumber, limit = 50 } = req.query;
      const interactions = await airtableService.getInteractions(phoneNumber, limit);
      res.json(interactions);
    } catch (error) {
      logger.error('Error fetching interactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get feedback entries from Airtable
  router.get('/feedback', authenticateAdmin, async (req, res) => {
    try {
      const { status, limit = 50 } = req.query;
      // TODO: Implement feedback filtering by status
      res.json({ message: 'Not implemented yet' });
    } catch (error) {
      logger.error('Error fetching feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Clear session for a phone number
  router.delete('/session/:phoneNumber', authenticateAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      await chatMemoryService.clearSession(phoneNumber);
      res.json({ message: 'Session cleared successfully' });
    } catch (error) {
      logger.error('Error clearing session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Health check endpoint with detailed status
  router.get('/status', authenticateAdmin, async (req, res) => {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        services: {
          redis: 'connected', // TODO: Implement actual Redis health check
          airtable: 'connected', // TODO: Implement actual Airtable health check
          whatsapp: 'connected' // TODO: Implement actual WhatsApp API health check
        },
        metrics: {
          activeSessions: 0, // TODO: Implement actual session count
          totalInteractions: 0, // TODO: Implement actual interaction count
          averageResponseTime: 0 // TODO: Implement actual response time calculation
        }
      };
      res.json(status);
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use('/admin', router);
}

module.exports = {
  setupAdminRoutes
}; 