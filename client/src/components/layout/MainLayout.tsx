import { Box, styled } from '@mui/material';
import ServerList from '../servers/ServerList';
import ChannelList from '../channels/ChannelList';
import ChatArea from '../chat/ChatArea';

const LayoutContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
});

const MainLayout = () => {
  return (
    <LayoutContainer>
      <ServerList />
      <ChannelList />
      <ChatArea />
    </LayoutContainer>
  );
};

export default MainLayout;
