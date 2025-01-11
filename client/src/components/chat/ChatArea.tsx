import { useRef, useEffect } from 'react';
import { Box, Paper, styled } from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../contexts/SocketContext';
import { useChannels } from '../../hooks/useChannels';

const ChatContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.default,
}));

const MessagesContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  margin: theme.spacing(0, 2, 2, 2),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
}));

const ChatArea = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage } = useMessages();
  const { socket } = useSocket();
  const { activeChannel } = useChannels();

  useEffect(() => {
    if (socket && activeChannel) {
      socket.on('message', (message) => {
        if (message.channelId === activeChannel.id) {
          addMessage(message);
        }
      });

      return () => {
        socket.off('message');
      };
    }
  }, [socket, activeChannel, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChannel) {
    return (
      <ChatContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Select a channel to start chatting
        </Box>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader channel={activeChannel} />
      <MessagesContainer elevation={0}>
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <MessageInput channelId={activeChannel.id} />
    </ChatContainer>
  );
};

export default ChatArea;
