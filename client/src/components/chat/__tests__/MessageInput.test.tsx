import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import MessageInput from '../MessageInput';
import { theme } from '../../../theme/theme';
import { SocketProvider } from '../../../contexts/SocketContext';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: () => ({
    connect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

describe('MessageInput', () => {
  const mockChannelId = 'test-channel-id';

  const renderMessageInput = () => {
    return render(
      <ThemeProvider theme={theme}>
        <SocketProvider>
          <MessageInput channelId={mockChannelId} />
        </SocketProvider>
      </ThemeProvider>
    );
  };

  it('renders message input field', () => {
    renderMessageInput();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('handles text input', () => {
    renderMessageInput();
    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello, world!' } });
    expect(input.value).toBe('Hello, world!');
  });

  it('clears input after sending message', () => {
    renderMessageInput();
    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(input.value).toBe('');
  });

  it('shows emoji picker when emoji button is clicked', () => {
    renderMessageInput();
    const emojiButton = screen.getByRole('button', { name: /emoji/i });
    fireEvent.click(emojiButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
