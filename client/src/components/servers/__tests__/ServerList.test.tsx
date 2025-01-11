import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import ServerList from '../ServerList';
import { useStore } from '../../../stores/useStore';
import { theme } from '../../../theme/theme';

// Mock the store
jest.mock('../../../stores/useStore');

describe('ServerList Component', () => {
  const mockServers = [
    { id: '1', name: 'Server 1', icon: 'icon1.png' },
    { id: '2', name: 'Server 2', icon: 'icon2.png' },
  ];

  const mockSetCurrentServer = jest.fn();

  beforeEach(() => {
    (useStore as jest.Mock).mockImplementation(() => ({
      servers: mockServers,
      currentServer: null,
      setCurrentServer: mockSetCurrentServer,
      fetchServers: jest.fn(),
    }));
  });

  const renderServerList = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <ServerList />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders server list correctly', () => {
    renderServerList();
    expect(screen.getByText('Server 1')).toBeInTheDocument();
    expect(screen.getByText('Server 2')).toBeInTheDocument();
  });

  it('handles server selection', async () => {
    renderServerList();
    const server1 = screen.getByText('Server 1');
    fireEvent.click(server1);
    
    await waitFor(() => {
      expect(mockSetCurrentServer).toHaveBeenCalledWith(mockServers[0]);
    });
  });

  it('shows create server dialog when add button is clicked', () => {
    renderServerList();
    const addButton = screen.getByRole('button', { name: /create server/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Create New Server')).toBeInTheDocument();
  });

  it('handles server creation', async () => {
    const mockCreateServer = jest.fn();
    (useStore as jest.Mock).mockImplementation(() => ({
      ...useStore(),
      createServer: mockCreateServer,
    }));

    renderServerList();
    const addButton = screen.getByRole('button', { name: /create server/i });
    fireEvent.click(addButton);
    
    const nameInput = screen.getByLabelText('Server Name');
    fireEvent.change(nameInput, { target: { value: 'New Server' } });
    
    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateServer).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Server',
      }));
    });
  });

  it('shows server settings when context menu is opened', async () => {
    renderServerList();
    const server1 = screen.getByText('Server 1');
    fireEvent.contextMenu(server1);
    
    expect(screen.getByText('Server Settings')).toBeInTheDocument();
    expect(screen.getByText('Delete Server')).toBeInTheDocument();
  });

  it('handles server deletion', async () => {
    const mockDeleteServer = jest.fn();
    (useStore as jest.Mock).mockImplementation(() => ({
      ...useStore(),
      deleteServer: mockDeleteServer,
    }));

    renderServerList();
    const server1 = screen.getByText('Server 1');
    fireEvent.contextMenu(server1);
    
    const deleteButton = screen.getByText('Delete Server');
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteServer).toHaveBeenCalledWith('1');
    });
  });

  it('shows server members when info button is clicked', async () => {
    const mockMembers = [
      { id: '1', username: 'User 1' },
      { id: '2', username: 'User 2' },
    ];

    (useStore as jest.Mock).mockImplementation(() => ({
      ...useStore(),
      getServerMembers: jest.fn().mockResolvedValue(mockMembers),
    }));

    renderServerList();
    const infoButton = screen.getByRole('button', { name: /server info/i });
    fireEvent.click(infoButton);
    
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
    });
  });

  it('handles server join through invite', async () => {
    const mockJoinServer = jest.fn();
    (useStore as jest.Mock).mockImplementation(() => ({
      ...useStore(),
      joinServer: mockJoinServer,
    }));

    renderServerList();
    const joinButton = screen.getByRole('button', { name: /join server/i });
    fireEvent.click(joinButton);
    
    const inviteInput = screen.getByLabelText('Invite Code');
    fireEvent.change(inviteInput, { target: { value: 'ABC123' } });
    
    const submitButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockJoinServer).toHaveBeenCalledWith('ABC123');
    });
  });

  it('shows error message for invalid invite code', async () => {
    const mockJoinServer = jest.fn().mockRejectedValue(new Error('Invalid invite code'));
    (useStore as jest.Mock).mockImplementation(() => ({
      ...useStore(),
      joinServer: mockJoinServer,
    }));

    renderServerList();
    const joinButton = screen.getByRole('button', { name: /join server/i });
    fireEvent.click(joinButton);
    
    const inviteInput = screen.getByLabelText('Invite Code');
    fireEvent.change(inviteInput, { target: { value: 'INVALID' } });
    
    const submitButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid invite code')).toBeInTheDocument();
    });
  });
});
