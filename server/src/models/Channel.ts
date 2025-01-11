import mongoose from 'mongoose';

export interface IChannel extends mongoose.Document {
  name: string;
  type: 'text' | 'voice' | 'video';
  server: mongoose.Types.ObjectId;
  topic?: string;
  position: number;
  messages: Array<{
    author: mongoose.Types.ObjectId;
    content: string;
    attachments?: Array<{
      url: string;
      type: string;
      name: string;
      size: number;
    }>;
    reactions?: Array<{
      emoji: string;
      users: mongoose.Types.ObjectId[];
    }>;
    mentions?: mongoose.Types.ObjectId[];
    editedAt?: Date;
    createdAt: Date;
  }>;
  permissions?: Array<{
    role: string;
    allow: string[];
    deny: string[];
  }>;
  createdAt: Date;
}

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'video'],
    default: 'text',
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
  },
  topic: {
    type: String,
    maxlength: 1024,
  },
  position: {
    type: Number,
    default: 0,
  },
  messages: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    attachments: [{
      url: String,
      type: String,
      name: String,
      size: Number,
    }],
    reactions: [{
      emoji: String,
      users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    editedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  permissions: [{
    role: {
      type: String,
      required: true,
    },
    allow: [{
      type: String,
      enum: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'USE_EXTERNAL_EMOJIS',
        'MANAGE_MESSAGES',
        'CONNECT',
        'SPEAK',
        'VIDEO',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
      ],
    }],
    deny: [{
      type: String,
      enum: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'USE_EXTERNAL_EMOJIS',
        'MANAGE_MESSAGES',
        'CONNECT',
        'SPEAK',
        'VIDEO',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
      ],
    }],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster message queries
channelSchema.index({ 'messages.createdAt': -1 });

export const Channel = mongoose.model<IChannel>('Channel', channelSchema);
