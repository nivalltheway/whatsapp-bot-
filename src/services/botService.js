const { airtableService } = require('./airtableService');
const { chatMemoryService } = require('./chatMemoryService');
const logger = require('../utils/logger');

// Conversation states
const STATES = {
  IDLE: 'IDLE',
  AWAITING_PRODUCT_SEARCH: 'AWAITING_PRODUCT_SEARCH',
  SHOWING_PRODUCTS: 'SHOWING_PRODUCTS',
  COLLECTING_FEEDBACK: 'COLLECTING_FEEDBACK',
  FAQ_BROWSING: 'FAQ_BROWSING'
};

// Command handlers
const commandHandlers = {
  start: async (phoneNumber) => {
    await chatMemoryService.clearSession(phoneNumber);
    return {
      type: 'buttons',
      content: 'Welcome! How can I help you today?',
      buttons: [
        { id: 'products', title: 'Browse Products' },
        { id: 'faq', title: 'FAQs' },
        { id: 'support', title: 'Contact Support' }
      ]
    };
  },

  products: async (phoneNumber) => {
    await chatMemoryService.updateSessionState(phoneNumber, STATES.AWAITING_PRODUCT_SEARCH);
    return {
      type: 'text',
      content: 'What product are you looking for? You can search by name, category, or description.'
    };
  },

  faq: async (phoneNumber) => {
    const faqs = await airtableService.getFAQs();
    const sections = [{
      title: 'Frequently Asked Questions',
      rows: faqs.map(faq => ({
        id: faq.id,
        title: faq.question
      }))
    }];

    await chatMemoryService.updateSessionState(phoneNumber, STATES.FAQ_BROWSING);
    return {
      type: 'list',
      content: 'Select a question to view the answer:',
      sections
    };
  },

  support: async () => {
    return {
      type: 'text',
      content: 'Our support team is available Monday to Friday, 9 AM to 6 PM. You can reach us at support@yourbusiness.com or call +1-234-567-8900.'
    };
  }
};

async function processMessage(phoneNumber, message) {
  try {
    const session = await chatMemoryService.getSession(phoneNumber);
    const state = session?.state || STATES.IDLE;
    const context = session?.context || {};

    // Add message to history
    await chatMemoryService.addToHistory(phoneNumber, {
      type: 'received',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Handle commands
    const lowerMessage = message.toLowerCase();
    if (commandHandlers[lowerMessage]) {
      return await commandHandlers[lowerMessage](phoneNumber);
    }

    // Handle state-based responses
    switch (state) {
      case STATES.AWAITING_PRODUCT_SEARCH:
        const products = await airtableService.searchProducts(message);
        if (products.length === 0) {
          return {
            type: 'text',
            content: 'No products found matching your search. Please try different keywords.'
          };
        }

        await chatMemoryService.updateSessionState(phoneNumber, STATES.SHOWING_PRODUCTS);
        await chatMemoryService.setContext(phoneNumber, { products });

        const sections = [{
          title: 'Search Results',
          rows: products.map(product => ({
            id: product.id,
            title: `${product.name} - $${product.price}`,
            description: product.description
          }))
        }];

        return {
          type: 'list',
          content: 'Here are the products matching your search:',
          sections
        };

      case STATES.SHOWING_PRODUCTS:
        const selectedProduct = context.products.find(p => p.id === message);
        if (selectedProduct) {
          await chatMemoryService.updateSessionState(phoneNumber, STATES.COLLECTING_FEEDBACK);
          return {
            type: 'buttons',
            content: `Product: ${selectedProduct.name}\nPrice: $${selectedProduct.price}\nDescription: ${selectedProduct.description}\n\nWould you like to know more about this product?`,
            buttons: [
              { id: 'yes', title: 'Yes, tell me more' },
              { id: 'no', title: 'No, thanks' }
            ]
          };
        }
        break;

      case STATES.COLLECTING_FEEDBACK:
        await airtableService.saveFeedback({
          phoneNumber,
          feedback: message,
          timestamp: new Date().toISOString()
        });
        await chatMemoryService.updateSessionState(phoneNumber, STATES.IDLE);
        return {
          type: 'text',
          content: 'Thank you for your feedback! Is there anything else I can help you with?'
        };

      case STATES.FAQ_BROWSING:
        const faq = await airtableService.getFAQs().then(faqs => 
          faqs.find(f => f.id === message)
        );
        if (faq) {
          await chatMemoryService.updateSessionState(phoneNumber, STATES.IDLE);
          return {
            type: 'text',
            content: `Q: ${faq.question}\n\nA: ${faq.answer}`
          };
        }
        break;

      default:
        return {
          type: 'buttons',
          content: 'I\'m not sure how to help with that. Please select an option:',
          buttons: [
            { id: 'products', title: 'Browse Products' },
            { id: 'faq', title: 'FAQs' },
            { id: 'support', title: 'Contact Support' }
          ]
        };
    }

    // Default response for unrecognized input
    return {
      type: 'text',
      content: 'I didn\'t understand that. Please try again or select an option from the menu.'
    };
  } catch (error) {
    logger.error('Error processing message:', error);
    return {
      type: 'text',
      content: 'Sorry, I encountered an error. Please try again later.'
    };
  }
}

module.exports = {
  processMessage,
  STATES
}; 