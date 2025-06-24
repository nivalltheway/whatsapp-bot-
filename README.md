# WhatsApp Bot with Airtable Integration

A comprehensive WhatsApp bot solution that automates customer conversations, maintains session history, and integrates seamlessly with Airtable for dynamic data handling.

## 🚀 Features

### WhatsApp Integration
- ✅ Send/receive text messages
- ✅ Interactive buttons (Quick Reply & Call-to-Action)
- ✅ List messages for product catalogs
- ✅ Media message support (images, videos, documents)
- ✅ Message status tracking

### Airtable Integration
- ✅ Dynamic data fetching (products, FAQs)
- ✅ User interaction logging
- ✅ Product search functionality
- ✅ Feedback collection and storage
- ✅ Session tracking

### Chat Memory & Context
- ✅ Redis-based session storage
- ✅ Persistent chat history across sessions
- ✅ Context-aware responses
- ✅ State management for conversation flow

### Admin Features
- ✅ Chat history API endpoints
- ✅ Session data monitoring
- ✅ Health check endpoints
- ✅ Real-time interaction logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- Redis server
- WhatsApp Business API account
- Airtable account with API access

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourcompany/whatsapp-bot-airtable.git
   cd whatsapp-bot-airtable
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration values
   ```

4. **Start Redis server**
   ```bash
   # On macOS with Homebrew
   brew services start redis
   
   # On Ubuntu/Debian
   sudo systemctl start redis-server
   
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

### WhatsApp Business API Setup

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app and add WhatsApp Business API

2. **Get Required Credentials**
   - Phone Number ID
   - Access Token
   - Verify Token (create your own)

3. **Set up Webhook**
   - URL: `https://yourdomain.com/webhook`
   - Verify Token: Use the same token in your .env file
   - Subscribe to messages and message_status events

### Airtable Setup

1. **Create Airtable Base**
   Create tables with the following structure:

   **Products Table:**
   - Product Name (Single line text)
   - Description (Long text)
   - Price (Currency)
   - Category (Single select)
   - Image URL (URL)

   **FAQs Table:**
   - Question (Single line text)
   - Answer (Long text)
   - Category (Single select)

   **Interactions Table:**
   - Phone Number (Phone number)
   - Message (Long text)
   - Message Type (Single select)
   - Timestamp (Date & time)
   - Session ID (Single line text)

   **Feedback Table:**
   - Phone Number (Phone number)
   - Feedback (Long text)
   - Timestamp (Date & time)
   - Status (Single select: New, Reviewed, Resolved)

2. **Get API Credentials**
   - Base ID: Found in Airtable API documentation
   - API Key: Generate from your Airtable account settings

## 🚀 Usage

### Basic Commands

The bot responds to various user inputs:

- **Greetings**: "hi", "hello", "hey", "start"
- **Product Search**: "product", "search", "find"
- **Help/FAQs**: "faq", "help", "question"
- **Support**: "support", "contact"

### Interactive Features

1. **Main Menu**: Shows primary options with buttons
2. **Product Search**: Natural language product search
3. **FAQ Browser**: Displays frequently asked questions
4. **Contact Information**: Business contact details

### Admin Endpoints

- **Health Check**: `GET /health`
- **Chat History**: `GET /admin/history/:phoneNumber`
- **Session Data**: `GET /admin/session/:phoneNumber`

## 🔧 API Reference

### Webhook Endpoints

#### Verify Webhook
```
GET /webhook
Query Parameters:
- hub.mode: subscribe
- hub.verify_token: your_verify_token
- hub.challenge: verification_challenge
```

#### Receive Messages
```
POST /webhook
Body: WhatsApp webhook payload
```

### Admin Endpoints

#### Get Chat History
```
GET /admin/history/:phoneNumber?limit=50
Response: Array of chat messages with timestamps
```

#### Get Session Data
```
GET /admin/session/:phoneNumber
Response: Current session state and data
```

## 🏗️ Architecture

### Core Components

1. **WhatsAppService**: Handles all WhatsApp API interactions
2. **AirtableService**: Manages Airtable data operations
3. **ChatMemoryService**: Redis-based session and history management
4. **BotService**: Main conversation logic and state management

### Conversation Flow

```
User Message → State Detection → Process Logic → Airtable Query → Response Generation → WhatsApp API
                    ↓
              Session Update → Redis Storage → History Logging
```

### State Management

The bot uses a finite state machine with the following states:
- `IDLE`: Default state, waiting for user input
- `AWAITING_PRODUCT_SEARCH`: Waiting for search query
- `SHOWING_PRODUCTS`: Displaying search results
- `COLLECTING_FEEDBACK`: Gathering user feedback
- `FAQ_BROWSING`: User browsing FAQ content

## 🔒 Security

- Environment variables for sensitive data
- Rate limiting on API endpoints
- Input validation and sanitization
- Redis session expiration
- Webhook verification

## 📊 Monitoring

### Metrics Tracked
- Message response times
- Airtable API success rates
- User session duration
- Popular search queries
- Error rates and types

### Logging
- All interactions logged to Airtable
- Application logs with Winston
- Error tracking and alerting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=bot.test.js
```

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "whatsapp-bot"
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build image
docker build -t whatsapp-bot .

# Run container
docker run -d -p 3000:3000 --env-file .env whatsapp-bot
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong Redis password
- Enable SSL/TLS for webhook endpoint
- Set up proper logging and monitoring

## 🔄 Scaling Considerations

### Horizontal Scaling
- Use Redis Cluster for session storage
- Load balancer for multiple app instances
- Separate webhook and admin endpoints

### Performance Optimization
- Implement response caching
- Use connection pooling for Airtable API
- Optimize Redis key expiration
- Implement request queuing for high volume

## 🛠️ Customization

### Adding New Commands
1. Add command detection in `handleDefaultInput()`
2. Create new state if needed
3. Implement command handler function
4. Update conversation flow

### Custom Airtable Tables
1. Create new service methods in `AirtableService`
2. Add corresponding bot logic
3. Update conversation states if needed

### Integration Extensions
- CRM integration (HubSpot, Salesforce)
- Payment processing
- Appointment scheduling
- Multi-language support

## 📈 Success Metrics

Based on PRD requirements:
- ✅ 80%+ reduction in manual responses
- ✅ <2 second average response time
- ✅ 95%+ Airtable operation success rate

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Ensure HTTPS for production

2. **Redis connection errors**
   - Verify Redis server is running
   - Check connection string format
   - Ensure firewall allows connection

3. **Airtable API errors**
   - Verify API key and base ID
   - Check table and field names
   - Monitor API rate limits

4. **WhatsApp API errors**
   - Verify access token validity
   - Check phone number ID
   - Review API rate limits

### Debug Mode
Set `LOG_LEVEL=debug` in environment variables for detailed logging.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to the branch
5. Create Pull Request

## 📞 Support

- Email: support@yourbusiness.com
- Documentation: [Project Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)

---

**Built with ❤️ for automated customer engagement** 

# Airtable Configuration
AIRTABLE_API_KEY=patGqLjFYE2PIMRBW.3c005df1a1ece3eb780c0077eeb90d1ec9bcf907f78e997c92a3dc1c8db7095f
AIRTABLE_BASE_ID=appsSZ7xJwqhzGzOw
AIRTABLE_PRODUCTS_TABLE=Products      # Ensure these table names match exactly
AIRTABLE_FAQS_TABLE=FAQs
AIRTABLE_INTERACTIONS_TABLE=Interactions
AIRTABLE_FEEDTABLE=Feedback 