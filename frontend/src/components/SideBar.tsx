import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DevicesIcon from '@mui/icons-material/Devices';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useLocation } from 'react-router-dom';
import AssessmentOutlined from'@mui/icons-material/AssessmentOutlined'
import NotificationsIcon from '@mui/icons-material/Notifications';
import FactoryIcon from '@mui/icons-material/Factory';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Manufacturer', icon: <FactoryIcon />, path: '/manufacturer' },
   
    { text: 'Reports', icon: <AssessmentOutlined />, path: '/reports' },
    { text: 'Alarms', icon: <NotificationsIcon />, path: '/alarms' },
    { text: 'Logout', icon: <LogoutIcon />, path: '/logout' },
  ];

  const drawerContent = (
    <div style={{ backgroundColor: '#111827', height: '100%', color: '#E5E7EB' ,marginTop: '50px'}}>
      <Toolbar />
      <List>
        {navItems.map((item) => {
          const currentRootPath = '/' + location.pathname.split('/')[1];
          const isActive = currentRootPath === item.path;

          return (
            <ListItemButton
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                backgroundColor: isActive ? '#14B8A6' : 'transparent',
                color: isActive ? '#ffffff' : '#E5E7EB',
                '&:hover': {
                  backgroundColor: isActive ? '#0D9488' : '#1F2937',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? '#ffffff' : '#E5E7EB' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#111827',
            color: '#E5E7EB',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#111827',
            color: '#E5E7EB',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
