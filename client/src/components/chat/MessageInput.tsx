import { useState, useRef } from 'react';
import { Box, IconButton, TextField, styled } from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useDropzone } from 'react-dropzone';
import { useSocket } from '../../contexts/SocketContext';
import { useUpload } from '../../hooks/useUpload';

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '100%',
  right: 0,
  zIndex: 1000,
}));

interface MessageInputProps {
  channelId: string;
}

const MessageInput = ({ channelId }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { socket } = useSocket();
  const { uploadFiles } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      try {
        const urls = await uploadFiles(acceptedFiles);
        urls.forEach(url => {
          sendMessage('', url);
        });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    },
    noClick: true,
  });

  const sendMessage = async (text: string, attachment?: string) => {
    if ((!text && !attachment) || !socket) return;

    const messageData = {
      channelId,
      content: text,
      attachment,
      timestamp: new Date().toISOString(),
    };

    socket.emit('message', messageData);
    setMessage('');
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  return (
    <div {...getRootProps()}>
      <InputContainer>
        <input {...getInputProps()} />
        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <EmojiEmotionsIcon />
        </IconButton>
        <IconButton component="label">
          <AttachFileIcon />
          <input type="file" hidden multiple onChange={(e) => {
            if (e.target.files) {
              uploadFiles(Array.from(e.target.files));
            }
          }} />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          inputRef={inputRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
          }}
        />
        <IconButton 
          color="primary"
          onClick={() => sendMessage(message)}
          disabled={!message.trim()}
        >
          <SendIcon />
        </IconButton>
        {showEmojiPicker && (
          <EmojiPickerContainer>
            <Picker 
              data={data} 
              onEmojiSelect={handleEmojiSelect}
              theme="light"
            />
          </EmojiPickerContainer>
        )}
      </InputContainer>
    </div>
  );
};

export default MessageInput;
