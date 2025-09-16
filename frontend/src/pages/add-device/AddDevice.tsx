import { useEffect, useState } from 'react';
import {
  Button,
  Box,
  TextField,
  MenuItem,
  FormLabel,
  Stack,
  FormGroup,
  Select,
  FormControlLabel,
  Switch,

  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './addDevice.css';
import type Device from '../../types/device';
import type { ManufacturerType } from '../../types/index ';

interface DeviceFormData extends Omit<Device, 'id' | 'readings'> {
  started_at?: Date;
}

function AddDevice() {
  const initialDevice: DeviceFormData = {
    number: NaN,
    code: '',
    location: '',
    status: 'off',
    humidity_min: 0,
    humidity_max: 0,
    temperature_min: 0,
    temperature_max: 0,
    model: '',
    manufacturer: '',
    serial_number: '',
    firmware_version: '',
    alert_temp_min: null,
    alert_temp_max: null,
    alert_humidity_min: null,
    alert_humidity_max: null,
    logging_interval_minutes: 15,
    button_stop_enabled: false,
    mute_button_enabled: false,
    alarm_tone_enabled: false,
    storage_mode: 'Loop',
    started_at: undefined,
  };

  const [formData, setFormData] = useState<DeviceFormData>(initialDevice);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const role = (localStorage.getItem('role') ?? 'guest').toLocaleLowerCase();
  //  console.log(role)
const accessToken = localStorage.getItem('access');

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof DeviceFormData, string>> = {};
    let isValid = true;

    if (!formData.number || isNaN(formData.number)) {
      newErrors.number = 'Name is required';
      isValid = false;
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
      isValid = false;
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    if (formData.temperature_min >= formData.temperature_max) {
      newErrors.temperature_min = 'Temperature min must be less than max';
      isValid = false;
    }

    if (formData.humidity_min >= formData.humidity_max) {
      newErrors.humidity_min = 'Humidity min must be less than max';
      isValid = false;
    }

    if (formData.temperature_min < -273 || formData.temperature_max < -273) {
      newErrors.temperature_min = 'Temperature cannot be below absolute zero';
      isValid = false;
    }

    if (formData.humidity_min < 0 || formData.humidity_max < 0) {
      newErrors.humidity_min = 'Humidity cannot be negative';
      isValid = false;
    }

    if (formData.humidity_max > 100) {
      newErrors.humidity_max = 'Humidity cannot exceed 100%';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validate()) return;

    try {
      // Combine user-selected date with current time
      const started_at = startDate
        ? new Date(startDate)
        : new Date();
      const response = await fetch('http://localhost:8000/api/devices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, 
        },
        body: JSON.stringify({
          ...formData,
          started_at: started_at.toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          Object.values(data).join(', ') ||
          'Failed to add device'
        );
      }

      // Reset form on success
      setFormData(initialDevice);
      setStartDate(null);
      setSubmitSuccess(true);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Submission error:', error);
    }
  };
  const [manufacturers, setManufacturers] = useState<ManufacturerType[]>([]);

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const res = await fetch('/api/manufacturers/',{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, 
        }},)
        const data = await res.json();
        setManufacturers(data);
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
      }
    };

    fetchManufacturers();
  }, []);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_min') || name.includes('_max') || name === 'number' || name === 'logging_interval_minutes'
        ? Number(value)
        : value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };


  return (
    <div className="add-form-wrapper">
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box component="form" noValidate onSubmit={handleSubmit} autoComplete="on">
          <div className="login-form-container">
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Device added successfully!
              </Alert>
            )}

            <FormGroup>
              <FormLabel required htmlFor="number" sx={{ mb: 0.5 }}>
                Device number
              </FormLabel>
              <TextField
                id="number"
                name="number"
                value={formData.number ? formData.number : 0}
                onChange={handleChange}
                error={Boolean(errors.number)}
                helperText={errors.number}
                variant="filled"
                fullWidth
                className="input-field"
              />
            </FormGroup>

            <FormLabel required htmlFor="code" sx={{ mb: 0.5 }}>
              Device Code
            </FormLabel>
            <TextField
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={Boolean(errors.code)}
              helperText={errors.code}
              variant="filled"
              fullWidth
              className="input-field"
            />

            <FormLabel required htmlFor="location" sx={{ mb: 0.5 }}>
              Location
            </FormLabel>
            <TextField
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={Boolean(errors.location)}
              helperText={errors.location}
              variant="filled"
              fullWidth
              className="input-field"
            />

            <FormLabel htmlFor="model" sx={{ mb: 0.5 }}>
              Model
            </FormLabel>
            <TextField
              variant="filled"
              className="input-field"
              name="model"
              id="model"
              value={formData.model ?? ''}
              onChange={handleChange}
            />

            <FormGroup>
              <FormLabel required htmlFor="manufacturer" sx={{ mb: 0.5 }}>
                Manufacturer
              </FormLabel>
              <Select
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer ?? ''}
                onChange={handleChange}
                variant="filled"
                className="input-field"
                fullWidth
              >
                {manufacturers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormGroup>

            <FormLabel htmlFor="serial_number" sx={{ mb: 0.5 }}>
              Serial number
            </FormLabel>
            <TextField
              variant="filled"
              className="input-field"
              name="serial_number"
              id="serial_number"
              value={formData.serial_number ?? ''}
              onChange={handleChange}
            />

            <FormLabel htmlFor="firmware_version" sx={{ mb: 0.5 }}>
              Firmware version
            </FormLabel>
            <TextField
              variant="filled"
              className="input-field"
              name="firmware_version"
              id="firmware_version"
              value={formData.firmware_version ?? ''}
              onChange={handleChange}
            />

            <FormLabel htmlFor="status" sx={{ mb: 0.5 }}>
              Status
            </FormLabel>
            <TextField
              id="status"
              select
              name="status"
              value={formData.status}
              onChange={handleChange}
              variant="filled"
              fullWidth
              className="input-field"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root[data-value="on"]': { color: 'green', fontWeight: 'bold' },
                      '& .MuiMenuItem-root[data-value="off"]': { color: 'red', fontWeight: 'bold' },
                    },
                  },
                },
                sx: {
                  color: formData.status === 'on' ? 'green' : 'red',
                  fontWeight: 'bold',
                },
              }}
            >
              <MenuItem value="on" sx={{ fontWeight: 'bold', color: 'green' }}>
                <strong>On</strong>
              </MenuItem>
              <MenuItem value="off" sx={{ fontWeight: 'bold', color: 'red' }}>
                <strong>Off</strong>
              </MenuItem>
            </TextField>

    {        ['super_admin'].includes(role)&&(
            <>
              <FormLabel sx={{ mt: 2 }}>Normal Temperature Range (°C)</FormLabel>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="temperature_min"
                  label="Min"
                  type="number"
                  value={formData.temperature_min}
                  onChange={handleChange}
                  error={Boolean(errors.temperature_min)}
                  helperText={errors.temperature_min}
                  variant="filled"
                  fullWidth
                />
                <TextField
                  name="temperature_max"
                  label="Max"
                  type="number"
                  value={formData.temperature_max}
                  onChange={handleChange}
                  variant="filled"
                  fullWidth
                />
              </Stack>

              <FormLabel sx={{ mt: 2 }}>Normal Humidity Range (%)</FormLabel>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="humidity_min"
                  label="Min"
                  type="number"
                  value={formData.humidity_min}
                  onChange={handleChange}
                  error={Boolean(errors.humidity_min)}
                  helperText={errors.humidity_min}
                  variant="filled"
                  fullWidth
                />
                <TextField
                  name="humidity_max"
                  label="Max"
                  type="number"
                  value={formData.humidity_max}
                  onChange={handleChange}
                  variant="filled"
                  fullWidth
                />
              </Stack></>
            )}
            <FormLabel htmlFor="temperature_range" sx={{ mt: 2 }}>
              Alert Temperature Range (°C)
            </FormLabel>
            <Stack direction="row" id="temperature_range" spacing={2}>
              <TextField
                variant="filled"
                className="input-field"
                label="Min"
                name="alert_temp_min"
                type="number"
                value={formData.alert_temp_min ?? ''}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                variant="filled"
                className="input-field"
                label="Max"
                name="alert_temp_max"
                type="number"
                value={formData.alert_temp_max ?? ''}
                onChange={handleChange}
                fullWidth
              />
            </Stack>

            <FormLabel htmlFor="humidity_range" sx={{ mt: 2 }}>
              Alert Humidity Range (%)
            </FormLabel>
            <Stack direction="row" spacing={2}>
              <TextField
                variant="filled"
                className="input-field"
                label="Min"
                name="alert_humidity_min"
                type="number"
                value={formData.alert_humidity_min ?? ''}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                variant="filled"
                className="input-field"
                label="Max"
                name="alert_humidity_max"
                type="number"
                value={formData.alert_humidity_max ?? ''}
                onChange={handleChange}
                fullWidth
              />
            </Stack>
            <FormLabel htmlFor="logging_interval_minutes" sx={{ mb: 0.5 }}>
              Logging Interval (minutes)
            </FormLabel>
            <TextField
              InputProps={{
                readOnly: true
              }}
              variant="filled"
              className="input-field"
              id="logging_interval_minutes"
              name="logging_interval_minutes"
              type="number"
              value={formData.logging_interval_minutes}
              onChange={handleChange}
            />
            <FormLabel htmlFor="storage_mode" sx={{ mb: 0.5 }}>
              Storage Mode
            </FormLabel>
            <TextField
              variant="filled"
              className="input-field"
              InputProps={{
                readOnly: true
              }}
              name="storage_mode"
              id="storage_mode"
              value={formData.storage_mode ?? 'Loop'}
              onChange={handleChange}
            />
    {        ['super_admin'].includes(role)&&(
           <><FormLabel htmlFor="started_at" sx={{ mb: 0.5 }}>
              Start Date (optional)
            </FormLabel>
            <DateTimePicker
              disableFuture

              value={startDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  variant: 'filled',
                  fullWidth: true,
                  className: 'input-field'
                }
              }}
            /></> )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.button_stop_enabled}
                  onChange={handleToggle}
                  name="button_stop_enabled"
                />
              }
              label="Button Stop Enabled"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.mute_button_enabled}
                  onChange={handleToggle}
                  name="mute_button_enabled"
                />
              }
              label="Mute Button Enabled"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.alarm_tone_enabled}
                  onChange={handleToggle}
                  name="alarm_tone_enabled"
                />
              }
              label="Alarm Tone Enabled"
            />

            <Button
              variant="contained"
              type="submit"
              className='default-button'
              fullWidth
              sx={{ mt: 3 }}
            >
              Add Device
            </Button>
          </div>
        </Box>
      </LocalizationProvider>
    </div>
  );
}

export default AddDevice;