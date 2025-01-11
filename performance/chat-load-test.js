import http from 'k6/http';
import { sleep, check } from 'k6';
import { WebSocket } from 'k6/ws';
import { Counter } from 'k6/metrics';

// Custom metrics
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    messages_sent: ['count>1000'],    // Should send at least 1000 messages
    messages_received: ['count>1000'], // Should receive at least 1000 messages
  },
};

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000';

export function setup() {
  // Create test user and get token
  const res = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123',
  });

  check(res, {
    'login successful': (r) => r.status === 200,
  });

  return { token: res.json('token') };
}

export default function(data) {
  const token = data.token;

  // REST API Tests
  const channelsRes = http.get(`${BASE_URL}/api/channels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(channelsRes, {
    'get channels successful': (r) => r.status === 200,
  });

  // WebSocket Tests
  const ws = new WebSocket(`${WS_URL}?token=${token}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (e) => {
    messagesReceived.add(1);
  };

  // Send messages
  for (let i = 0; i < 10; i++) {
    ws.send(JSON.stringify({
      type: 'message',
      channelId: '123',
      content: `Load test message ${i}`,
    }));
    messagesSent.add(1);
    sleep(1);
  }

  sleep(5);
  ws.close();
}

export function teardown(data) {
  // Cleanup if necessary
}
