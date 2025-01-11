import { Request, Response } from 'express';
import { Channel } from '../models/Channel';
import { Server } from '../models/Server';
import { validateChannel } from '../utils/validation';
import { checkPermission } from '../utils/permissions';

export const createChannel = async (req: Request, res: Response) => {
  try {
    const { error } = validateChannel(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, type, topic } = req.body;
    const { serverId } = req.params;

    // Check if user has permission to create channels
    const hasPermission = await checkPermission(req.user.id, serverId, 'MANAGE_CHANNELS');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const channel = new Channel({
      name,
      type,
      topic,
      server: serverId,
    });

    await channel.save();

    // Add channel to server
    await Server.findByIdAndUpdate(serverId, {
      $push: { channels: channel._id },
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getChannel = async (req: Request, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId)
      .populate('messages.author', 'username avatar')
      .populate('messages.mentions', 'username avatar');

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has permission to view channel
    const hasPermission = await checkPermission(req.user.id, channel.server.toString(), 'VIEW_CHANNEL');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { name, topic } = req.body;
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has permission to manage channels
    const hasPermission = await checkPermission(req.user.id, channel.server.toString(), 'MANAGE_CHANNELS');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    channel.name = name || channel.name;
    channel.topic = topic || channel.topic;

    await channel.save();
    res.json(channel);
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has permission to manage channels
    const hasPermission = await checkPermission(req.user.id, channel.server.toString(), 'MANAGE_CHANNELS');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Remove channel from server
    await Server.findByIdAndUpdate(channel.server, {
      $pull: { channels: channel._id },
    });

    // Delete the channel
    await channel.remove();

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { before, limit = 50 } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has permission to view channel
    const hasPermission = await checkPermission(req.user.id, channel.server.toString(), 'VIEW_CHANNEL');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const query = before
      ? { 'messages.createdAt': { $lt: new Date(before as string) } }
      : {};

    const messages = await Channel.aggregate([
      { $match: { _id: channel._id } },
      { $unwind: '$messages' },
      { $match: query },
      { $sort: { 'messages.createdAt': -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.author',
          foreignField: '_id',
          as: 'messages.author',
        },
      },
      {
        $project: {
          'messages.author.password': 0,
        },
      },
    ]);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
