import create from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { Server } from '../types/server';
import { Channel } from '../types/channel';
import { Message } from '../types/message';
import { User } from '../types/user';

interface AppState {
  // Servers
  servers: Server[];
  currentServer: Server | null;
  fetchServers: () => Promise<void>;
  setCurrentServer: (server: Server | null) => void;
  addServer: (server: Server) => void;
  updateServer: (serverId: string, updates: Partial<Server>) => void;
  deleteServer: (serverId: string) => void;

  // Channels
  channels: Channel[];
  currentChannel: Channel | null;
  fetchChannels: (serverId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  deleteChannel: (channelId: string) => void;

  // Messages
  messages: Record<string, Message[]>;
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (channelId: string, message: Message) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (channelId: string, messageId: string) => void;

  // Members
  members: Record<string, User[]>;
  fetchMembers: (serverId: string) => Promise<void>;
  updateMemberStatus: (userId: string, status: string) => void;

  // UI State
  isSidebarOpen: boolean;
  isUserListOpen: boolean;
  toggleSidebar: () => void;
  toggleUserList: () => void;
}

const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Servers
      servers: [],
      currentServer: null,
      fetchServers: async () => {
        try {
          const response = await axios.get('/api/servers');
          set({ servers: response.data });
        } catch (error) {
          console.error('Error fetching servers:', error);
        }
      },
      setCurrentServer: (server) => set({ currentServer: server }),
      addServer: (server) => set((state) => ({ 
        servers: [...state.servers, server] 
      })),
      updateServer: (serverId, updates) => set((state) => ({
        servers: state.servers.map((server) =>
          server.id === serverId ? { ...server, ...updates } : server
        ),
      })),
      deleteServer: (serverId) => set((state) => ({
        servers: state.servers.filter((server) => server.id !== serverId),
        currentServer: state.currentServer?.id === serverId ? null : state.currentServer,
      })),

      // Channels
      channels: [],
      currentChannel: null,
      fetchChannels: async (serverId) => {
        try {
          const response = await axios.get(`/api/servers/${serverId}/channels`);
          set({ channels: response.data });
        } catch (error) {
          console.error('Error fetching channels:', error);
        }
      },
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      addChannel: (channel) => set((state) => ({ 
        channels: [...state.channels, channel] 
      })),
      updateChannel: (channelId, updates) => set((state) => ({
        channels: state.channels.map((channel) =>
          channel.id === channelId ? { ...channel, ...updates } : channel
        ),
      })),
      deleteChannel: (channelId) => set((state) => ({
        channels: state.channels.filter((channel) => channel.id !== channelId),
        currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
      })),

      // Messages
      messages: {},
      fetchMessages: async (channelId) => {
        try {
          const response = await axios.get(`/api/channels/${channelId}/messages`);
          set((state) => ({
            messages: {
              ...state.messages,
              [channelId]: response.data,
            },
          }));
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      },
      addMessage: (channelId, message) => set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: [...(state.messages[channelId] || []), message],
        },
      })),
      updateMessage: (channelId, messageId, updates) => set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: state.messages[channelId]?.map((message) =>
            message.id === messageId ? { ...message, ...updates } : message
          ) || [],
        },
      })),
      deleteMessage: (channelId, messageId) => set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: state.messages[channelId]?.filter(
            (message) => message.id !== messageId
          ) || [],
        },
      })),

      // Members
      members: {},
      fetchMembers: async (serverId) => {
        try {
          const response = await axios.get(`/api/servers/${serverId}/members`);
          set((state) => ({
            members: {
              ...state.members,
              [serverId]: response.data,
            },
          }));
        } catch (error) {
          console.error('Error fetching members:', error);
        }
      },
      updateMemberStatus: (userId, status) => set((state) => ({
        members: Object.fromEntries(
          Object.entries(state.members).map(([serverId, members]) => [
            serverId,
            members.map((member) =>
              member.id === userId ? { ...member, status } : member
            ),
          ])
        ),
      })),

      // UI State
      isSidebarOpen: true,
      isUserListOpen: true,
      toggleSidebar: () => set((state) => ({ 
        isSidebarOpen: !state.isSidebarOpen 
      })),
      toggleUserList: () => set((state) => ({ 
        isUserListOpen: !state.isUserListOpen 
      })),
    })
  )
);

export default useStore;
