import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Grid, Paper, styled } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { connect, createLocalVideoTrack, Room, LocalTrack, RemoteParticipant } from 'twilio-video';
import { useAuth } from '../../contexts/AuthContext';

const CallContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
}));

const VideoGrid = styled(Grid)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(2),
}));

const ParticipantContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}));

interface VideoCallProps {
  channelId: string;
  onClose: () => void;
}

const VideoCall = ({ channelId, onClose }: VideoCallProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const startCall = async () => {
      try {
        // Get token from your backend
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId }),
        });
        const { token } = await response.json();

        // Connect to the room
        const room = await connect(token, {
          name: channelId,
          audio: true,
          video: { width: 640, height: 480 },
        });

        setRoom(room);
        setParticipants(Array.from(room.participants.values()));

        // Handle participants joining
        room.on('participantConnected', participant => {
          setParticipants(prevParticipants => [...prevParticipants, participant]);
        });

        // Handle participants leaving
        room.on('participantDisconnected', participant => {
          setParticipants(prevParticipants => 
            prevParticipants.filter(p => p !== participant)
          );
        });

        // Set up local video
        const localTrack = await createLocalVideoTrack();
        if (localVideoRef.current) {
          localTrack.attach(localVideoRef.current);
        }
      } catch (error) {
        console.error('Error connecting to video room:', error);
      }
    };

    startCall();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [channelId]);

  const toggleAudio = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach(track => {
        if (track.isEnabled) {
          track.disable();
        } else {
          track.enable();
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach(track => {
        if (track.isEnabled) {
          track.disable();
        } else {
          track.enable();
        }
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = () => {
    if (room) {
      room.disconnect();
    }
    onClose();
  };

  return (
    <CallContainer>
      <VideoGrid container spacing={2}>
        <Grid item xs={6}>
          <ParticipantContainer>
            <video ref={localVideoRef} autoPlay muted />
          </ParticipantContainer>
        </Grid>
        {participants.map(participant => (
          <Grid item xs={6} key={participant.sid}>
            <ParticipantContainer>
              <video ref={el => {
                if (el) {
                  participant.videoTracks.forEach(track => track.attach(el));
                }
              }} autoPlay />
            </ParticipantContainer>
          </Grid>
        ))}
      </VideoGrid>

      <Controls>
        <IconButton onClick={toggleAudio} color="primary">
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <IconButton onClick={toggleVideo} color="primary">
          {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton onClick={endCall} color="error">
          <CallEndIcon />
        </IconButton>
      </Controls>
    </CallContainer>
  );
};

export default VideoCall;
