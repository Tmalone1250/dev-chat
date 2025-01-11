import { Request, Response } from 'express';
import { register, login } from '../authController';
import { User } from '../../models/User';
import jwt from 'jsonwebtoken';

// Mock User model
jest.mock('../../models/User');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockUser = {
    _id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    comparePassword: jest.fn(),
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('register', () => {
    it('successfully registers a new user', async () => {
      // Mock User.findOne to return null (no existing user)
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock User constructor and save
      (User as any).mockImplementation(() => ({
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      }));

      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: 'mock-token',
        user: expect.objectContaining({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
        }),
      });
    });

    it('returns error if user already exists', async () => {
      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User with this email or username already exists',
      });
    });
  });

  describe('login', () => {
    it('successfully logs in a user', async () => {
      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      });

      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        token: 'mock-token',
        user: expect.objectContaining({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
        }),
      });
    });

    it('returns error for invalid credentials', async () => {
      // Mock User.findOne to return a user with invalid password
      (User.findOne as jest.Mock).mockResolvedValue({
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });
  });
});
