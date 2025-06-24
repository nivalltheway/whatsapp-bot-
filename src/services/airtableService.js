const Airtable = require('airtable');
const logger = require('../utils/logger');

class AirtableService {
  constructor() {
    this.base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);

    this.tables = {
      products: process.env.AIRTABLE_PRODUCTS_TABLE,
      faqs: process.env.AIRTABLE_FAQS_TABLE,
      interactions: process.env.AIRTABLE_INTERACTIONS_TABLE,
      feedback: process.env.AIRTABLE_FEEDBACK_TABLE
    };
  }

  async getProducts(query = '') {
    try {
      const records = await this.base(this.tables.products)
        .select({
          filterByFormula: query ? `SEARCH("${query}", {Product Name})` : '',
          sort: [{ field: 'Product Name', direction: 'asc' }]
        })
        .all();

      return records.map(record => ({
        id: record.id,
        name: record.get('Product Name'),
        description: record.get('Description'),
        price: record.get('Price'),
        category: record.get('Category'),
        imageUrl: record.get('Image URL')
      }));
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  async getFAQs(category = '') {
    try {
      const records = await this.base(this.tables.faqs)
        .select({
          filterByFormula: category ? `{Category} = "${category}"` : '',
          sort: [{ field: 'Question', direction: 'asc' }]
        })
        .all();

      return records.map(record => ({
        id: record.id,
        question: record.get('Question'),
        answer: record.get('Answer'),
        category: record.get('Category')
      }));
    } catch (error) {
      logger.error('Error fetching FAQs:', error);
      throw error;
    }
  }

  async saveInteraction(data) {
    try {
      const record = await this.base(this.tables.interactions).create({
        'Phone Number': data.phoneNumber,
        'Message': data.message,
        'Message Type': data.messageType,
        'Timestamp': data.timestamp,
        'Session ID': data.sessionId || ''
      });
      return record;
    } catch (error) {
      logger.error('Error saving interaction:', error);
      throw error;
    }
  }

  async saveFeedback(data) {
    try {
      const record = await this.base(this.tables.feedback).create({
        'Phone Number': data.phoneNumber,
        'Feedback': data.feedback,
        'Timestamp': data.timestamp,
        'Status': 'New'
      });
      return record;
    } catch (error) {
      logger.error('Error saving feedback:', error);
      throw error;
    }
  }

  async getInteractions(phoneNumber, limit = 50) {
    try {
      const records = await this.base(this.tables.interactions)
        .select({
          filterByFormula: `{Phone Number} = "${phoneNumber}"`,
          sort: [{ field: 'Timestamp', direction: 'desc' }],
          maxRecords: limit
        })
        .all();

      return records.map(record => ({
        id: record.id,
        phoneNumber: record.get('Phone Number'),
        message: record.get('Message'),
        messageType: record.get('Message Type'),
        timestamp: record.get('Timestamp'),
        sessionId: record.get('Session ID')
      }));
    } catch (error) {
      logger.error('Error fetching interactions:', error);
      throw error;
    }
  }

  async searchProducts(query) {
    try {
      const records = await this.base(this.tables.products)
        .select({
          filterByFormula: `OR(
            SEARCH("${query}", {Product Name}),
            SEARCH("${query}", {Description}),
            SEARCH("${query}", {Category})
          )`,
          sort: [{ field: 'Product Name', direction: 'asc' }]
        })
        .all();

      return records.map(record => ({
        id: record.id,
        name: record.get('Product Name'),
        description: record.get('Description'),
        price: record.get('Price'),
        category: record.get('Category'),
        imageUrl: record.get('Image URL')
      }));
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }
}

const airtableService = new AirtableService();

module.exports = {
  airtableService,
  saveInteraction: (data) => airtableService.saveInteraction(data),
  getProducts: (query) => airtableService.getProducts(query),
  getFAQs: (category) => airtableService.getFAQs(category),
  saveFeedback: (data) => airtableService.saveFeedback(data),
  getInteractions: (phoneNumber, limit) => airtableService.getInteractions(phoneNumber, limit),
  searchProducts: (query) => airtableService.searchProducts(query)
}; 