# Nature Chat Deployment Guide

## Prerequisites

- Node.js (v16.x or later)
- Docker and Docker Compose
- AWS Account with configured credentials
- MongoDB instance
- Twilio Account (for video/voice features)

## Environment Variables

Create `.env` files for both client and server:

### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nature-chat
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=nature-chat-uploads
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_API_KEY=your-twilio-api-key
TWILIO_API_SECRET=your-twilio-api-secret
```

## Local Development

1. Install dependencies:
```bash
# Root directory
npm install

# Client
cd client
npm install

# Server
cd ../server
npm install
```

2. Start development servers:
```bash
# Root directory
npm run dev
```

## Production Deployment

### Docker Deployment

1. Build Docker images:
```bash
# Build client
docker build -t nature-chat-client ./client

# Build server
docker build -t nature-chat-server ./server
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### AWS Deployment

1. Create ECR repositories:
```bash
aws ecr create-repository --repository-name nature-chat-client
aws ecr create-repository --repository-name nature-chat-server
```

2. Push images to ECR:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag nature-chat-client:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nature-chat-client:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nature-chat-client:latest

docker tag nature-chat-server:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nature-chat-server:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/nature-chat-server:latest
```

3. Create ECS cluster:
```bash
aws ecs create-cluster --cluster-name nature-chat
```

4. Create task definitions and services using the AWS Console or CLI.

### Required AWS Services

- ECS for container orchestration
- ECR for container registry
- S3 for file storage
- CloudFront for content delivery
- Route 53 for DNS management
- ACM for SSL certificates
- RDS or DocumentDB for MongoDB (optional)
- ElastiCache for Redis (optional)

## Monitoring and Logging

### AWS CloudWatch

1. Enable CloudWatch logging in ECS task definitions
2. Create CloudWatch dashboards for monitoring
3. Set up CloudWatch alarms for critical metrics

### Application Monitoring

1. Access logs are available at:
   - `/logs/application-%DATE%.log`
   - `/logs/error-%DATE%.log`

2. Monitor health endpoint:
   - `GET /api/health`

### Performance Monitoring

1. Key metrics to monitor:
   - Response times
   - Memory usage
   - Active connections
   - Error rates
   - CPU usage
   - Database connections

## Security Considerations

1. Enable AWS WAF for web application firewall
2. Use security groups to control access
3. Enable VPC flow logs
4. Regularly rotate credentials
5. Enable AWS Shield for DDoS protection
6. Use AWS Secrets Manager for sensitive data

## Backup and Recovery

1. Set up automated MongoDB backups
2. Configure S3 versioning for file storage
3. Create AMIs of EC2 instances
4. Document recovery procedures

## Scaling

1. Configure auto-scaling groups
2. Use ECS service auto-scaling
3. Implement database read replicas
4. Use ElastiCache for session management
5. Configure CloudFront for static assets

## Troubleshooting

1. Check application logs:
```bash
docker logs nature-chat-client
docker logs nature-chat-server
```

2. Monitor ECS service events:
```bash
aws ecs describe-services --cluster nature-chat --services nature-chat-client nature-chat-server
```

3. Check CloudWatch logs:
```bash
aws logs get-log-events --log-group-name /ecs/nature-chat --log-stream-name your-log-stream
```
