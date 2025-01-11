import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Channel } from '../models/Channel';
import { checkPermission } from '../utils/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface SocketUser {
  id: string;
  username: string;
}

export const setupSocketEvents = (io: SocketServer) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.user.id;

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: 'online' });
    
    // Join user's server rooms
    const user = await User.findById(userId).populate('servers');
    user.servers.forEach((server) => {
      socket.join(`server:${server._id}`);
    });

    // Handle joining channels
    socket.on('join-channel', async (channelId: string) => {
      try {
        const channel = await Channel.findById(channelId);
        if (!channel) return;

        const hasPermission = await checkPermission(userId, channel.server.toString(), 'VIEW_CHANNEL');
        if (!hasPermission) return;

        socket.join(`channel:${channelId}`);
      } catch (error) {
        console.error('Join channel error:', error);
      }
    });

    // Handle leaving channels
    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    // Handle new messages
    socket.on('message', async (data: {
      channelId: string;
      content: string;
      attachments?: Array<{ url: string; type: string; name: string; size: number; }>;
    }) => {
      try {
        const channel = await Channel.findById(data.channelId);
        if (!channel) return;

        const hasPermission = await checkPermission(userId, channel.server.toString(), 'SEND_MESSAGES');
        if (!hasPermission) return;

        const message = {
          author: userId,
          content: data.content,
          attachments: data.attachments,
          createdAt: new Date(),
        };

        // Add message to channel
        await Channel.findByIdAndUpdate(data.channelId, {
          $push: { messages: message },
        });

        // Emit message to channel
        io.to(`channel:${data.channelId}`).emit('message', {
          ...message,
          author: {
            id: socket.data.user.id,
            username: socket.data.user.username,
          },
        });
      } catch (error) {
        console.error('Message error:', error);
      }
    });

    // Handle typing status
    socket.on('typing-start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-typing', {
        userId: socket.data.user.id,
        username: socket.data.user.username,
      });
    });

    socket.on('typing-stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('user-stop-typing', {
        userId: socket.data.user.id,
      });
    });

    // Handle voice/video state
    socket.on('voice-state-update', async (data: {
      channelId: string;
      speaking: boolean;
    }) => {
      try {
        const channel = await Channel.findById(data.channelId);
        if (!channel) return;

        const hasPermission = await checkPermission(userId, channel.server.toString(), 'SPEAK');
        if (!hasPermission) return;

        socket.to(`channel:${data.channelId}`).emit('voice-state-update', {
          userId: socket.data.user.id,
          speaking: data.speaking,
        });
      } catch (error) {
        console.error('Voice state update error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(userId, { status: 'offline' });
        
        // Notify other users about status change
        user.servers.forEach((server) => {
          io.to(`server:${server._id}`).emit('user-status-update', {
            userId,
            status: 'offline',
          });
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};
