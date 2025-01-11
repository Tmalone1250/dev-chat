import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  servers: mongoose.Types.ObjectId[];
  createdAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 32,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'offline'],
    default: 'online',
  },
  servers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
