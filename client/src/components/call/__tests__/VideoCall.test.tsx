import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import VideoCall from '../VideoCall';
import { useStore } from '../../../stores/useStore';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../theme/theme';

// Mock Twilio Video
jest.mock('twilio-video', () => ({
  connect: jest.fn(),
  createLocalVideoTrack: jest.fn(),
  createLocalAudioTrack: jest.fn(),
}));

// Mock the store
jest.mock('../../../stores/useStore');

describe('VideoCall Component', () => {
  const mockRoom = {
    localParticipant: {
      videoTracks: new Map(),
      audioTracks: new Map(),
      on: jest.fn(),
    },
    participants: new Map(),
    on: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockToken = 'mock-token';

  beforeEach(() => {
    (useStore as jest.Mock).mockImplementation(() => ({
      currentChannel: { id: '1', name: 'Test Channel' },
      getVideoToken: jest.fn().mockResolvedValue(mockToken),
    }));
  });

  const renderVideoCall = () => {
    return render(
      <ThemeProvider theme={theme}>
        <VideoCall channelId="1" />
      </ThemeProvider>
    );
  };

  it('initializes video call correctly', async () => {
    renderVideoCall();
    
    await waitFor(() => {
      expect(screen.getByTestId('video-call-container')).toBeInTheDocument();
      expect(screen.getByTestId('camera-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('mic-toggle')).toBeInTheDocument();
    });
  });

  it('handles camera toggle', async () => {
    const mockVideoTrack = {
      stop: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
    };

    (require('twilio-video').createLocalVideoTrack as jest.Mock).mockResolvedValue(mockVideoTrack);

    renderVideoCall();
    const cameraButton = screen.getByTestId('camera-toggle');
    
    await act(async () => {
      fireEvent.click(cameraButton);
    });

    expect(mockVideoTrack.disable).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(cameraButton);
    });

    expect(mockVideoTrack.enable).toHaveBeenCalled();
  });

  it('handles microphone toggle', async () => {
    const mockAudioTrack = {
      stop: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
    };

    (require('twilio-video').createLocalAudioTrack as jest.Mock).mockResolvedValue(mockAudioTrack);

    renderVideoCall();
    const micButton = screen.getByTestId('mic-toggle');
    
    await act(async () => {
      fireEvent.click(micButton);
    });

    expect(mockAudioTrack.disable).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(micButton);
    });

    expect(mockAudioTrack.enable).toHaveBeenCalled();
  });

  it('handles participant connection', async () => {
    const mockParticipant = {
      identity: 'Test User',
      videoTracks: new Map(),
      audioTracks: new Map(),
      on: jest.fn(),
    };

    (require('twilio-video').connect as jest.Mock).mockResolvedValue({
      ...mockRoom,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'participantConnected') {
          callback(mockParticipant);
        }
      }),
    });

    renderVideoCall();

    await waitFor(() => {
      expect(screen.getByTestId('participant-Test User')).toBeInTheDocument();
    });
  });

  it('handles participant disconnection', async () => {
    const mockParticipant = {
      identity: 'Test User',
      videoTracks: new Map(),
      audioTracks: new Map(),
      on: jest.fn(),
    };

    (require('twilio-video').connect as jest.Mock).mockResolvedValue({
      ...mockRoom,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'participantDisconnected') {
          callback(mockParticipant);
        }
      }),
    });

    renderVideoCall();

    await waitFor(() => {
      expect(screen.queryByTestId('participant-Test User')).not.toBeInTheDocument();
    });
  });

  it('handles screen sharing', async () => {
    const mockScreenTrack = {
      stop: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
    };

    global.navigator.mediaDevices = {
      getDisplayMedia: jest.fn().mockResolvedValue({
        getTracks: () => [mockScreenTrack],
      }),
    } as unknown as MediaDevices;

    renderVideoCall();
    const shareButton = screen.getByTestId('screen-share');
    
    await act(async () => {
      fireEvent.click(shareButton);
    });

    expect(global.navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
  });

  it('handles call disconnection', async () => {
    renderVideoCall();
    const disconnectButton = screen.getByTestId('leave-call');
    
    await act(async () => {
      fireEvent.click(disconnectButton);
    });

    expect(mockRoom.disconnect).toHaveBeenCalled();
  });

  it('shows error message on connection failure', async () => {
    const mockError = new Error('Failed to connect');
    (require('twilio-video').connect as jest.Mock).mockRejectedValue(mockError);

    renderVideoCall();

    await waitFor(() => {
      expect(screen.getByTestId('connection-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to video call')).toBeInTheDocument();
    });
  });

  it('handles device selection', async () => {
    const mockDevices = [
      { deviceId: '1', label: 'Camera 1', kind: 'videoinput' },
      { deviceId: '2', label: 'Microphone 1', kind: 'audioinput' },
    ];

    global.navigator.mediaDevices.enumerateDevices = jest.fn().mockResolvedValue(mockDevices);

    renderVideoCall();
    const deviceButton = screen.getByTestId('device-settings');
    
    await act(async () => {
      fireEvent.click(deviceButton);
    });

    expect(screen.getByText('Camera 1')).toBeInTheDocument();
    expect(screen.getByText('Microphone 1')).toBeInTheDocument();
  });
});
