import { useState } from 'react';
import { Box, IconButton, Tooltip, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ServerIcon from './ServerIcon';
import CreateServerDialog from './CreateServerDialog';
import { useServers } from '../../hooks/useServers';

const ServerListContainer = styled(Box)(({ theme }) => ({
  width: '72px',
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const AddServerButton = styled(IconButton)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ServerList = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { servers, loading } = useServers();

  return (
    <ServerListContainer>
      {servers.map((server) => (
        <ServerIcon 
          key={server.id}
          server={server}
        />
      ))}
      
      <Tooltip title="Create Server" placement="right">
        <AddServerButton onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </AddServerButton>
      </Tooltip>

      <CreateServerDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </ServerListContainer>
  );
};

export default ServerList;
