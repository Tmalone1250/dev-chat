import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  points: number;      // Number of points
  duration: number;    // Per duration in seconds
  blockDuration: number; // Block duration in seconds
}

type RateLimitAction = 'connection' | 'message' | 'typing';

const rateLimiters: Record<RateLimitAction, RateLimiterMemory> = {
  connection: new RateLimiterMemory({
    points: 5,           // 5 connections
    duration: 60,        // per 60 seconds
    blockDuration: 600,  // Block for 10 minutes
  }),
  message: new RateLimiterMemory({
    points: 30,          // 30 messages
    duration: 60,        // per 60 seconds
    blockDuration: 300,  // Block for 5 minutes
  }),
  typing: new RateLimiterMemory({
    points: 20,          // 20 typing events
    duration: 60,        // per 60 seconds
    blockDuration: 120,  // Block for 2 minutes
  }),
};

export class WebSocketRateLimiter {
  private static readonly RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded';
  private static readonly blockedSockets: Set<string> = new Set();

  static async checkRateLimit(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    action: RateLimitAction,
    userId: string
  ): Promise<boolean> {
    try {
      if (this.blockedSockets.has(socket.id)) {
        return false;
      }

      await rateLimiters[action].consume(userId);
      return true;
    } catch (error) {
      this.handleRateLimitExceeded(socket, action, userId);
      return false;
    }
  }

  private static handleRateLimitExceeded(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    action: RateLimitAction,
    userId: string
  ): void {
    logger.warn('Rate limit exceeded', {
      action,
      userId,
      socketId: socket.id,
    });

    this.blockedSockets.add(socket.id);
    socket.emit(this.RATE_LIMIT_EXCEEDED, {
      action,
      message: `Rate limit exceeded for ${action}`,
    });

    // Remove from blocked set after block duration
    setTimeout(() => {
      this.blockedSockets.delete(socket.id);
    }, rateLimiters[action].blockDuration * 1000);
  }

  static async applyMiddleware(
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    next: (err?: Error) => void
  ): Promise<void> {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      const error = new Error('Authentication failed');
      logger.error('WebSocket authentication failed', { socketId: socket.id });
      return next(error);
    }

    try {
      const allowed = await this.checkRateLimit(socket, 'connection', userId);
      if (!allowed) {
        const error = new Error('Rate limit exceeded');
        logger.error('WebSocket connection rate limit exceeded', {
          userId,
          socketId: socket.id,
        });
        return next(error);
      }
      next();
    } catch (error) {
      logger.error('WebSocket rate limit error', {
        error,
        userId,
        socketId: socket.id,
      });
      next(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  static createEventHandler<T>(
    action: RateLimitAction,
    handler: (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, ...args: T[]) => void
  ) {
    return async (
      socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
      ...args: T[]
    ): Promise<void> => {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      if (await this.checkRateLimit(socket, action, userId)) {
        try {
          await handler(socket, ...args);
        } catch (error) {
          logger.error('Error in event handler', {
            error,
            action,
            userId,
            socketId: socket.id,
          });
          socket.emit('error', { message: 'Internal server error' });
        }
      }
    };
  }
}

// Example usage:
/*
io.use(WebSocketRateLimiter.applyMiddleware);

io.on('connection', (socket) => {
  socket.on(
    'message',
    WebSocketRateLimiter.createEventHandler<[{ content: string }]>('message', 
      async (socket, { content }) => {
        // Handle message
      }
    )
  );

  socket.on(
    'typing',
    WebSocketRateLimiter.createEventHandler<[]>('typing',
      async (socket) => {
        // Handle typing event
      }
    )
  );
});
*/
