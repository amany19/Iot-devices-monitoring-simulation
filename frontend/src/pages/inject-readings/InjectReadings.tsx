import { useState, useEffect } from 'react';
import {
  Box, Button, TextField, MenuItem, FormLabel, Stack, Alert
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { DeviceType } from '../../types/index ';


export default function InjectReading() {
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [deviceMode, setDeviceMode] = useState<'single' | 'all' | 'multiple'>('single');

  // Separate states for single vs multiple
  const [singleDeviceId, setSingleDeviceId] = useState<string>('');
  const [multiDeviceIds, setMultiDeviceIds] = useState<number[]>([]);

  const [start, setStart] = useState(dayjs());
  const [end, setEnd] = useState(dayjs());
  const [tempMin, setTempMin] = useState('');
  const [tempMax, setTempMax] = useState('');
  const [humMin, setHumMin] = useState('');
  const [humMax, setHumMax] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load devices on mount
  useEffect(() => {
    fetch('/api/devices/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
    })
      .then(res => res.json())
      .then(data => setDevices(data))
      .catch(() => setError('Failed to load devices'));
  }, []);

  const handleSubmit = () => {
    setError('');
    setMessage('');

    if (!start || !end || tempMin === '' || tempMax === '' || humMin === '' || humMax === '') {
      setError('Please fill in all fields');
      return;
    }

    // Validate device selection
    if (deviceMode === 'single' && !singleDeviceId) {
      setError('Please select a single device');
      return;
    }
    if (deviceMode === 'multiple' && multiDeviceIds.length < 1) {
      setError('Please select at least one device');
      return;
    }

    // Prepare device_ids array for backend
    let deviceIds: number[] = [];
    if (deviceMode === 'single') deviceIds = [parseInt(singleDeviceId)];
    if (deviceMode === 'multiple') deviceIds = multiDeviceIds;

    fetch('/api/readings/inject/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access')}`
      },
      body: JSON.stringify({
        device_mode: deviceMode,
        device_ids: deviceIds,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        temp_min: tempMin,
        temp_max: tempMax,
        hum_min: humMin,
        hum_max: humMax
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) setMessage(data.message);
        else setError('Injection failed');
      })
      .catch(() => setError('Failed to inject readings'));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <FormLabel sx={{ fontSize: 20, mb: 2 }}>Inject Readings</FormLabel>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack spacing={2}>
        {/* Mode Selection */}
        <TextField
          select
          label="Mode"
          value={deviceMode}
          onChange={(e) => {
            const mode = e.target.value as 'single' | 'all' | 'multiple';
            setDeviceMode(mode);
            setTimeout(() => {
              setSingleDeviceId('');
              setMultiDeviceIds([]);
            }, 0);
          }}
          fullWidth
        >
          <MenuItem value="single">Single Device</MenuItem>
          <MenuItem value="all">All Devices</MenuItem>
          <MenuItem value="multiple">Multiple Devices</MenuItem>
        </TextField>

        {/* Device Select */}
        {deviceMode === 'single' && (
          <TextField
            select
            label="Device"
            value={singleDeviceId}
            onChange={(e) => setSingleDeviceId(e.target.value)}
            fullWidth
          >
            {devices.map(dev => (
              <MenuItem key={dev.id} value={String(dev.id)}>
                {dev.code}
              </MenuItem>
            ))}
          </TextField>
        )}

        {deviceMode === 'multiple' && (
          <TextField
            select
            label="Devices"
            value={multiDeviceIds}
            onChange={(e) => {
              const value = e.target.value;
              setMultiDeviceIds(typeof value === 'string' ? [parseInt(value)] : value);
            }}
            SelectProps={{ multiple: true }}
            fullWidth
          >
            {devices.map(dev => (
              <MenuItem key={dev.id} value={dev.id}>
                {dev.number}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Time Range */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Start Time"
            value={start}
            onChange={(val:any) => setStart(val!)}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DateTimePicker
            label="End Time"
            value={end}
            onChange={(val:any) => setEnd(val!)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>

        {/* Ranges */}
        <TextField label="Temperature Min" type="number" value={tempMin} onChange={(e) => setTempMin(e.target.value)} fullWidth />
        <TextField label="Temperature Max" type="number" value={tempMax} onChange={(e) => setTempMax(e.target.value)} fullWidth />
        <TextField label="Humidity Min" type="number" value={humMin} onChange={(e) => setHumMin(e.target.value)} fullWidth />
        <TextField label="Humidity Max" type="number" value={humMax} onChange={(e) => setHumMax(e.target.value)} fullWidth />

        <Button variant="contained" onClick={handleSubmit}>
          Inject
        </Button>
      </Stack>
    </Box>
  );
}
