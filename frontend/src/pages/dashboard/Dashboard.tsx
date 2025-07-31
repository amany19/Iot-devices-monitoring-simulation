import { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import './dashboard.css';   
 
interface UserType {
  first_name: string;
  role: 'super_admin' | 'admin' | 'user';
}

interface StatsType {
  devices: number;
  alarms: number;
  readings: number;
}

function Dashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<StatsType>({ devices: 0, alarms: 0, readings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      console.error("No access token found");
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/users/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!userRes.ok) throw new Error('Failed to fetch user profile');
        const userData = await userRes.json();
        setUser(userData);

        const statsRes = await fetch('/api/dashboard/stats/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={4}>
        <Typography variant="h6" color="error">
          Failed to load user data. Please check your token or login again.
        </Typography>
      </Box>
    );
  }

  return (
   <Box className="dashboard-container">
  <Typography variant="h4" mb={4}>
    Welcome, {user.first_name}
  </Typography>

  <Box
    display="flex"
    flexWrap="wrap"
    gap={3}
    justifyContent="space-between"
    alignItems="stretch"
  >
    <Box flex="1 1 300px" minWidth="250px">
      <Paper className="dashboard-card" sx={{ height: '100%' }}>
        <Typography variant="h6">Devices</Typography>
        <Typography variant="h4">{stats.devices}</Typography>
      </Paper>
    </Box>

    <Box flex="1 1 300px" minWidth="250px">
      <Paper className="dashboard-card" sx={{ height: '100%' }}>
        <Typography variant="h6">Active Alarms</Typography>
        <Typography variant="h4">{stats.alarms}</Typography>
      </Paper>
    </Box>

    <Box flex="1 1 300px" minWidth="250px">
      <Paper className="dashboard-card" sx={{ height: '100%' }}>
        <Typography variant="h6">Total Readings</Typography>
        <Typography variant="h4">{stats.readings}</Typography>
      </Paper>
    </Box>
  </Box>

  {/* {user.role === 'super_admin' && (
    <Box mt={5}>
      <Typography variant="h5" gutterBottom>
        Admin Features
      </Typography>
      <ul>
        <li>Manage users</li>
        <li>Manage manufacturers</li>
        <li>View full system logs</li>
      </ul>
    </Box>
  )} */}
</Box>

  );
}

export default Dashboard;
