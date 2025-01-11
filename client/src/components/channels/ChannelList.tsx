import { useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, IconButton, styled } from '@mui/material';
import TagIcon from '@mui/icons-material/Tag';
import AddIcon from '@mui/icons-material/Add';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VideocamIcon from '@mui/icons-material/Videocam';
import CreateChannelDialog from './CreateChannelDialog';
import { useChannels } from '../../hooks/useChannels';
import { usePermissions } from '../../hooks/usePermissions';

const ChannelListContainer = styled(Box)(({ theme }) => ({
  width: '240px',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const ChannelHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ChannelItem = styled(ListItem)<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '2px 8px',
  padding: '8px 12px',
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ChannelList = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { channels, activeChannel, setActiveChannel } = useChannels();
  const { canCreateChannel } = usePermissions();

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <VolumeUpIcon />;
      case 'video':
        return <VideocamIcon />;
      default:
        return <TagIcon />;
    }
  };

  return (
    <ChannelListContainer>
      <ChannelHeader>
        <Typography variant="subtitle1" fontWeight="bold">
          Channels
        </Typography>
        {canCreateChannel && (
          <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
            <AddIcon />
          </IconButton>
        )}
      </ChannelHeader>

      <List>
        {channels.map((channel) => (
          <ChannelItem
            key={channel.id}
            active={channel.id === activeChannel?.id}
            onClick={() => setActiveChannel(channel)}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getChannelIcon(channel.type)}
            </ListItemIcon>
            <ListItemText primary={channel.name} />
          </ChannelItem>
        ))}
      </List>

      <CreateChannelDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </ChannelListContainer>
  );
};

export default ChannelList;
