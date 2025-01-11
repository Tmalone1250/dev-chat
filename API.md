# Nature Chat API Documentation

## Base URL
```
Production: https://api.naturechat.com
Development: http://localhost:5000
```

## Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string"
  }
}
```

## Servers

### Create Server
```http
POST /api/servers
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "icon": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "icon": "string",
  "ownerId": "string",
  "inviteCode": "string",
  "createdAt": "string"
}
```

### Get Servers
```http
GET /api/servers
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "servers": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "ownerId": "string",
      "memberCount": "number"
    }
  ]
}
```

### Join Server
```http
POST /api/servers/join
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "inviteCode": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "icon": "string",
  "ownerId": "string"
}
```

## Channels

### Create Channel
```http
POST /api/servers/{serverId}/channels
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string",
  "type": "text | voice",
  "description": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "description": "string",
  "serverId": "string",
  "createdAt": "string"
}
```

### Get Channels
```http
GET /api/servers/{serverId}/channels
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "channels": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "description": "string",
      "serverId": "string"
    }
  ]
}
```

## Messages

### Send Message
```http
POST /api/channels/{channelId}/messages
```

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
content: string
attachments: File[] (optional)
```

**Response:**
```json
{
  "id": "string",
  "content": "string",
  "attachments": [
    {
      "id": "string",
      "url": "string",
      "type": "string"
    }
  ],
  "author": {
    "id": "string",
    "username": "string",
    "avatar": "string"
  },
  "channelId": "string",
  "createdAt": "string"
}
```

### Get Messages
```http
GET /api/channels/{channelId}/messages
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
limit: number (default: 50)
before: string (message id for pagination)
```

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "content": "string",
      "attachments": [
        {
          "id": "string",
          "url": "string",
          "type": "string"
        }
      ],
      "author": {
        "id": "string",
        "username": "string",
        "avatar": "string"
      },
      "channelId": "string",
      "createdAt": "string"
    }
  ]
}
```

## Voice/Video

### Get Video Token
```http
POST /api/channels/{channelId}/video-token
```

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "string",
  "roomName": "string"
}
```

## WebSocket Events

### Connection
```javascript
// Connect with authentication
socket.connect({
  auth: {
    token: "Bearer token"
  }
});
```

### Client to Server Events

#### Join Channel
```javascript
socket.emit('join-channel', {
  channelId: "string"
});
```

#### Leave Channel
```javascript
socket.emit('leave-channel', {
  channelId: "string"
});
```

#### Send Message
```javascript
socket.emit('message', {
  channelId: "string",
  content: "string"
});
```

#### Start Typing
```javascript
socket.emit('typing-start', {
  channelId: "string"
});
```

#### Stop Typing
```javascript
socket.emit('typing-stop', {
  channelId: "string"
});
```

### Server to Client Events

#### Message Received
```javascript
socket.on('message', (data) => {
  // data: {
  //   id: "string",
  //   content: "string",
  //   author: {
  //     id: "string",
  //     username: "string"
  //   },
  //   channelId: "string",
  //   createdAt: "string"
  // }
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  // data: {
  //   userId: "string",
  //   username: "string",
  //   channelId: "string"
  // }
});
```

#### User Joined Channel
```javascript
socket.on('user-joined', (data) => {
  // data: {
  //   userId: "string",
  //   username: "string",
  //   channelId: "string"
  // }
});
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "string",
  "message": "string"
}
```

### 401 Unauthorized
```json
{
  "error": "string",
  "message": "string"
}
```

### 403 Forbidden
```json
{
  "error": "string",
  "message": "string"
}
```

### 404 Not Found
```json
{
  "error": "string",
  "message": "string"
}
```

### 429 Too Many Requests
```json
{
  "error": "string",
  "message": "string",
  "retryAfter": "number"
}
```

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| Authentication | 5 requests per minute |
| Messages | 30 messages per minute |
| File Uploads | 10 uploads per minute |
| WebSocket Connection | 5 connections per minute |
| WebSocket Messages | 30 messages per minute |

## WebSocket Rate Limiting

The WebSocket connection implements rate limiting for various events:

| Event | Limit | Block Duration |
|-------|-------|----------------|
| Connection | 5 per minute | 10 minutes |
| Messages | 30 per minute | 5 minutes |
| Typing | 20 per minute | 2 minutes |

When a rate limit is exceeded, the client will receive a `rate_limit_exceeded` event:

```javascript
socket.on('rate_limit_exceeded', (data) => {
  // data: {
  //   action: "string",
  //   message: "string"
  // }
});
```
