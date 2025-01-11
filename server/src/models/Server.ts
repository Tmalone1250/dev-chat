import mongoose from 'mongoose';

export interface IServer extends mongoose.Document {
  name: string;
  description?: string;
  icon?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    roles: string[];
    joinedAt: Date;
  }>;
  roles: Array<{
    name: string;
    color: string;
    permissions: string[];
    position: number;
  }>;
  channels: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  icon: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    roles: [{
      type: String,
    }],
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  roles: [{
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#99AAB5',
    },
    permissions: [{
      type: String,
      enum: [
        'ADMINISTRATOR',
        'MANAGE_SERVER',
        'MANAGE_CHANNELS',
        'MANAGE_ROLES',
        'MANAGE_MESSAGES',
        'CREATE_INSTANT_INVITE',
        'SEND_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'ADD_REACTIONS',
        'USE_EXTERNAL_EMOJIS',
        'CONNECT',
        'SPEAK',
        'VIDEO',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
      ],
    }],
    position: {
      type: Number,
      default: 0,
    },
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create default roles when creating a new server
serverSchema.pre('save', function(next) {
  if (this.isNew) {
    this.roles = [
      {
        name: '@everyone',
        color: '#99AAB5',
        permissions: [
          'SEND_MESSAGES',
          'EMBED_LINKS',
          'ATTACH_FILES',
          'ADD_REACTIONS',
          'CONNECT',
          'SPEAK',
        ],
        position: 0,
      },
      {
        name: 'Admin',
        color: '#FF0000',
        permissions: [
          'ADMINISTRATOR',
        ],
        position: 1,
      },
    ];
  }
  next();
});

export const Server = mongoose.model<IServer>('Server', serverSchema);
