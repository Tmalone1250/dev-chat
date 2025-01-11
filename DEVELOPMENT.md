# Nature Chat Development Guide

## Project Overview

Nature Chat is a real-time chat application inspired by Discord, featuring a nature-themed design. The application is built using modern web technologies and follows best practices for scalability, security, and maintainability.

## Technology Stack

### Frontend
- React 18 with TypeScript
- Material-UI for components
- Socket.IO for real-time communication
- Zustand for state management
- React Router for navigation
- Twilio for video/voice calls
- Emoji Mart for emoji support

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Socket.IO for WebSocket support
- JWT for authentication
- AWS S3 for file storage
- Twilio SDK for video/voice

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/nature-chat.git
cd nature-chat
```

2. Install dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp .env.example .env
cd client && cp .env.example .env
cd ../server && cp .env.example .env
```

4. Start development servers:
```bash
# Root directory
npm run dev
```

## Project Structure

```
nature-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── styles/       # Theme and styles
│   │   └── types/        # TypeScript types
│   ├── cypress/          # E2E tests
│   └── __tests__/        # Unit tests
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Mongoose models
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   └── __tests__/        # Server tests
├── shared/                # Shared code
└── performance/          # Performance tests
```

## Development Workflow

### Git Workflow

1. Create a new branch for each feature/fix:
```bash
git checkout -b feature/your-feature
```

2. Make commits with descriptive messages:
```bash
git commit -m "feat: add video call functionality"
```

3. Push changes and create a pull request:
```bash
git push origin feature/your-feature
```

### Testing

1. Run unit tests:
```bash
# Client tests
cd client && npm test

# Server tests
cd server && npm test
```

2. Run E2E tests:
```bash
# Start application
npm run dev

# Run Cypress tests
cd client && npm run cypress:run
```

3. Run performance tests:
```bash
cd performance
k6 run chat-load-test.js
```

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Follow component composition patterns
- Write meaningful comments and documentation

## Common Development Tasks

### Adding a New Feature

1. Plan the feature
   - Define requirements
   - Design component structure
   - Plan database schema changes

2. Implementation
   - Create/modify components
   - Add/update API endpoints
   - Write tests
   - Update documentation

3. Testing
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing

### Debugging

1. Client-side debugging:
   - Use React Developer Tools
   - Check browser console
   - Use debugger statements

2. Server-side debugging:
   - Use logging
   - Check server logs
   - Use Node.js debugger

### Performance Optimization

1. Frontend:
   - Use React.memo for expensive components
   - Implement virtualization for long lists
   - Optimize images and assets
   - Use code splitting

2. Backend:
   - Implement caching
   - Optimize database queries
   - Use connection pooling
   - Monitor memory usage

## API Documentation

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Servers
- GET /api/servers
- POST /api/servers
- GET /api/servers/:id
- PUT /api/servers/:id
- DELETE /api/servers/:id

### Channels
- GET /api/channels
- POST /api/channels
- GET /api/channels/:id
- PUT /api/channels/:id
- DELETE /api/channels/:id

### Messages
- GET /api/messages
- POST /api/messages
- PUT /api/messages/:id
- DELETE /api/messages/:id

## WebSocket Events

### Client to Server
- join-channel
- leave-channel
- message
- typing-start
- typing-stop
- voice-state-update

### Server to Client
- message
- user-typing
- user-stop-typing
- voice-state-update
- user-status-update

## Security Guidelines

1. Input Validation
   - Validate all user input
   - Sanitize data before storage
   - Use parameterized queries

2. Authentication
   - Use JWT for authentication
   - Implement rate limiting
   - Use secure password hashing

3. Authorization
   - Implement role-based access
   - Validate permissions
   - Check ownership

4. Data Protection
   - Use HTTPS
   - Encrypt sensitive data
   - Implement CORS properly

## Monitoring and Debugging

1. Application Monitoring
   - Check logs in /logs directory
   - Monitor performance metrics
   - Track error rates

2. Development Tools
   - React Developer Tools
   - Redux DevTools
   - Chrome DevTools
   - Postman for API testing

## Contributing

1. Code Review Process
   - Follow pull request template
   - Request reviews from team members
   - Address feedback promptly

2. Documentation
   - Update README.md
   - Document new features
   - Keep API docs current

3. Testing
   - Write unit tests
   - Add integration tests
   - Update E2E tests
