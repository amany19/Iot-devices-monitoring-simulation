import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Button, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import './components.css';
import goveeLogo from '../assets/teal_logo.ico';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import type { AlarmType } from '../types/index ';
interface NavbarProps {
  onToggleDrawer: () => void;
}
import { useState, useEffect } from 'react';
import { useAlarmContext } from '../context/AlarmContext';
export default function Navbar({ onToggleDrawer }: NavbarProps) {
  const navigate = useNavigate();
  const [alarms, setAlarms] = useState<AlarmType[]>([]);
  const { unacknowledgedCount } = useAlarmContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const fetchAlarms = () => {
    fetch("http://localhost:8000/api/alarms/?active=true")
      .then((res) => res.json())
      .then((data) => {
        setAlarms(data)

      })
      .catch(() => setAlarms([]));
  };

  useEffect(() => {
    fetchAlarms();
    const intervalId = setInterval(fetchAlarms, 10000);  //Later will be replaced with web socket or SSE
    return () => clearInterval(intervalId);
  }, []);



  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onDeleteSuccess = () => {
    fetchAlarms();
  };

  return (
    <AppBar className="nav-conatiner" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>

      <Toolbar>

        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleDrawer}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>


        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={goveeLogo}
            alt="Govee"
            style={{ height: 40, marginRight: 10 }}
          />
          <Typography variant="h6" noWrap>

          </Typography>
        </Box>
      </Toolbar>
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{
          bgcolor:
            location.pathname.split('/')[1] === 'alarms'
              ? '#0D9488'
              : 'transparent',
        }}
      >
        <Badge badgeContent={unacknowledgedCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: '300px',
          },
        }}
      >
        {alarms.slice(0, 5).map((alarm) => (
          <MenuItem key={alarm.id} onClick={() => {
            handleClose();
            navigate('/alarms');
          }}>
            <Typography variant="body2">
              🔔 {alarm.alarm_type} – Device {alarm.device}
              <br />
              <small>{new Date(alarm.timestamp).toLocaleString()}</small>
            </Typography>
          </MenuItem>
        ))}

        {alarms.length > 5 && (
          <MenuItem
            onClick={() => {
              handleClose();
              navigate('/alarms');
            }}
          >
            <Button fullWidth variant="text" color="primary">
              View All
            </Button>
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
}
