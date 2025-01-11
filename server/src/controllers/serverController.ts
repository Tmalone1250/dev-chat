import { Request, Response } from 'express';
import { Server } from '../models/Server';
import { User } from '../models/User';
import { Channel } from '../models/Channel';
import { validateServer } from '../utils/validation';

export const createServer = async (req: Request, res: Response) => {
  try {
    const { error } = validateServer(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description, icon } = req.body;

    const server = new Server({
      name,
      description,
      icon,
      owner: req.user.id,
      members: [{ user: req.user.id, roles: ['Admin'] }],
    });

    await server.save();

    // Create default text channel
    const generalChannel = new Channel({
      name: 'general',
      server: server._id,
      type: 'text',
    });

    await generalChannel.save();

    // Update server with the new channel
    server.channels.push(generalChannel._id);
    await server.save();

    // Add server to user's servers
    await User.findByIdAndUpdate(req.user.id, {
      $push: { servers: server._id },
    });

    res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServer = async (req: Request, res: Response) => {
  try {
    const server = await Server.findById(req.params.serverId)
      .populate('channels')
      .populate('members.user', 'username avatar status');

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Check if user is a member of the server
    const isMember = server.members.some(
      member => member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    res.json(server);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateServer = async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    const server = await Server.findById(req.params.serverId);

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Check if user is the server owner
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only server owner can update server' });
    }

    server.name = name || server.name;
    server.description = description || server.description;
    server.icon = icon || server.icon;

    await server.save();
    res.json(server);
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteServer = async (req: Request, res: Response) => {
  try {
    const server = await Server.findById(req.params.serverId);

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Check if user is the server owner
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only server owner can delete server' });
    }

    // Delete all channels in the server
    await Channel.deleteMany({ server: server._id });

    // Remove server from all members' server lists
    await User.updateMany(
      { _id: { $in: server.members.map(member => member.user) } },
      { $pull: { servers: server._id } }
    );

    // Delete the server
    await server.remove();

    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const server = await Server.findById(req.params.serverId);

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Check if user is already a member
    if (server.members.some(member => member.user.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    server.members.push({
      user: userId,
      roles: ['@everyone'],
    });

    await server.save();

    // Add server to user's servers
    await User.findByIdAndUpdate(userId, {
      $push: { servers: server._id },
    });

    res.json(server);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
