const axios = require('axios');
const logger = require('../utils/logger');
const { processMessage } = require('./botService');
const { saveInteraction } = require('./airtableService');

class WhatsAppService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v17.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          ...message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendTextMessage(to, text) {
    return this.sendMessage(to, {
      type: 'text',
      text: { body: text }
    });
  }

  async sendInteractiveButtons(to, text, buttons) {
    return this.sendMessage(to, {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    });
  }

  async sendListMessage(to, text, sections) {
    return this.sendMessage(to, {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text },
        action: {
          button: 'Select an option',
          sections
        }
      }
    });
  }

  async sendMediaMessage(to, type, url, caption = '') {
    return this.sendMessage(to, {
      type,
      [type]: {
        link: url,
        caption
      }
    });
  }
}

const whatsappService = new WhatsAppService();

function setupWhatsAppWebhook(app) {
  // Webhook verification
  app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        logger.info('Webhook verified');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  // Webhook for receiving messages
  app.post('/webhook', async (req, res) => {
    try {
      const { body } = req;

      if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
          const change = body.entry[0].changes[0];
          
          if (change.value.messages && change.value.messages[0]) {
            const message = change.value.messages[0];
            const from = message.from;
            const messageBody = message.text?.body || '';

            // Save interaction to Airtable
            await saveInteraction({
              phoneNumber: from,
              message: messageBody,
              messageType: 'received',
              timestamp: new Date().toISOString()
            });

            // Process message and generate response
            const response = await processMessage(from, messageBody);
            
            // Send response back to user
            if (response.type === 'text') {
              await whatsappService.sendTextMessage(from, response.content);
            } else if (response.type === 'buttons') {
              await whatsappService.sendInteractiveButtons(from, response.content, response.buttons);
            } else if (response.type === 'list') {
              await whatsappService.sendListMessage(from, response.content, response.sections);
            }
          }
        }
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.sendStatus(500);
    }
  });
}

module.exports = {
  whatsappService,
  setupWhatsAppWebhook
}; 