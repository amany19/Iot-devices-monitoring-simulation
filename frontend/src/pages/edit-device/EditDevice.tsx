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
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import type Device from '../../types/device';
import type { ManufacturerType } from '../../types/index ';

interface DeviceFormData extends Omit<Device, 'id' | 'readings'> {
  started_at?: Date | null;
}

const initialDevice: DeviceFormData = {
  number: 0,
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
  started_at: null,
};

function EditDevice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DeviceFormData>(initialDevice);
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [manufacturers, setManufacturers] = useState<ManufacturerType[]>([]);
  const role = (localStorage.getItem('role') ?? 'guest').toLocaleLowerCase();
  const accessToken = localStorage.getItem('access');

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await fetch(`/api/devices/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          }
        },);
        const data = await res.json();
        setFormData({
          ...data,
          number: data.number != null ? String(data.number) : '',
          humidity_min: data.humidity_min != null ? String(data.humidity_min) : '',
          humidity_max: data.humidity_max != null ? String(data.humidity_max) : '',
          temperature_min: data.temperature_min != null ? String(data.temperature_min) : '',
          temperature_max: data.temperature_max != null ? String(data.temperature_max) : '',
          logging_interval_minutes: data.logging_interval_minutes != null ? String(data.logging_interval_minutes) : '',
          alert_temp_min: data.alert_temp_min != null ? String(data.alert_temp_min) : '',
          alert_temp_max: data.alert_temp_max != null ? String(data.alert_temp_max) : '',
          alert_humidity_min: data.alert_humidity_min != null ? String(data.alert_humidity_min) : '',
          alert_humidity_max: data.alert_humidity_max != null ? String(data.alert_humidity_max) : '',
          manufacturer: data.manufacturer?.id ?? '',
          started_at: data.started_at ? new Date(data.started_at) : null,
        });

      } catch (error) {
        console.error('Error loading device:', error);
      }
    };

    const fetchManufacturers = async () => {
      try {
        const res = await fetch('/api/manufacturers/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access')}`,
          },
        });
        const data = await res.json();
        setManufacturers(data);
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
      }
    };

    fetchDevice();
    fetchManufacturers();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | import('@mui/material').SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if (!name) return;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_min') || name.includes('_max') || name === 'number' || name === 'logging_interval_minutes'
        ? Number(value)
        : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (date: any) => {
    setFormData((prev) => ({ ...prev, started_at: date }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof DeviceFormData, string>> = {};
    let isValid = true;

    if (!formData.number || isNaN(formData.number)) {
      newErrors.number = 'Device number is required';
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
    const username = localStorage.getItem('username');
    try {
      const updatedDevice = {
        ...formData,
        number: formData.number ? Number(formData.number) : null,
        humidity_min: formData.humidity_min ? Number(formData.humidity_min) : null,
        humidity_max: formData.humidity_max ? Number(formData.humidity_max) : null,
        temperature_min: formData.temperature_min ? Number(formData.temperature_min) : null,
        temperature_max: formData.temperature_max ? Number(formData.temperature_max) : null,
        logging_interval_minutes: formData.logging_interval_minutes ? Number(formData.logging_interval_minutes) : null,
        alert_temp_min: formData.alert_temp_min ? Number(formData.alert_temp_min) : null,
        alert_temp_max: formData.alert_temp_max ? Number(formData.alert_temp_max) : null,
        alert_humidity_min: formData.alert_humidity_min ? Number(formData.alert_humidity_min) : null,
        alert_humidity_max: formData.alert_humidity_max ? Number(formData.alert_humidity_max) : null,
        started_at: formData.started_at ? formData.started_at.toISOString() : null,
        user: username,
      };

      const res = await fetch(`/api/devices/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedDevice),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          Object.values(data).join(', ') ||
          'Failed to update device'
        );
      }

      setSubmitSuccess(true);
      setTimeout(() => navigate('/devices'), 2000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="add-device-form-wrapper">
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <div className="login-form-container">
            {submitError && <Alert severity="error">{submitError}</Alert>}
            {submitSuccess && <Alert severity="success">Device updated successfully!</Alert>}

            <FormGroup>
              <FormLabel required htmlFor="number">Device number</FormLabel>
              <TextField
                id="number"
                name="number"
                value={formData.number ?? ''}
                onChange={handleChange}
                error={Boolean(errors.number)}
                helperText={errors.number}
                variant="filled"
                fullWidth
              />
            </FormGroup>

            <FormLabel required htmlFor="code">Device Code</FormLabel>
            <TextField
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={Boolean(errors.code)}
              helperText={errors.code}
              variant="filled"
              fullWidth
            />

            <FormLabel required htmlFor="location">Location</FormLabel>
            <TextField
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={Boolean(errors.location)}
              helperText={errors.location}
              variant="filled"
              fullWidth
            />

            <FormLabel htmlFor="model">Model</FormLabel>
            <TextField
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />

            <FormLabel htmlFor="manufacturer">Manufacturer</FormLabel>
            <Select
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer?.toString() ?? ''}
              onChange={handleChange}
              variant="filled"
              fullWidth
            >
              {manufacturers.map((m, index) => (
                <MenuItem key={m.id ?? `manufacturer-${index}`} value={m.id ?? ''}>
                  {m.name}
                </MenuItem>
              ))}
            </Select>

            <FormLabel htmlFor="serial_number">Serial Number</FormLabel>
            <TextField
              id="serial_number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />

            <FormLabel htmlFor="firmware_version">Firmware Version</FormLabel>
            <TextField
              id="firmware_version"
              name="firmware_version"
              value={formData.firmware_version}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />

            <FormLabel htmlFor="status">Status</FormLabel>
            <TextField
              id="status"
              select
              name="status"
              value={formData.status}
              onChange={handleChange}
              variant="filled"
              fullWidth
            >
              <MenuItem value="on">On</MenuItem>
              <MenuItem value="off">Off</MenuItem>
            </TextField>

            {['super_admin', 'admin'].includes(role) && (
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
                </Stack>
              </>
            )}

            <FormLabel sx={{ mt: 2 }}>Alert Temperature Range (°C)</FormLabel>
            <Stack direction="row" spacing={2}>
              <TextField
                name="alert_temp_min"
                label="Min"
                type="number"
                value={formData.alert_temp_min ?? ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
              />
              <TextField
                name="alert_temp_max"
                label="Max"
                type="number"
                value={formData.alert_temp_max ?? ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
              />
            </Stack>

            <FormLabel sx={{ mt: 2 }}>Alert Humidity Range (%)</FormLabel>
            <Stack direction="row" spacing={2}>
              <TextField
                name="alert_humidity_min"
                label="Min"
                type="number"
                value={formData.alert_humidity_min ?? ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
              />
              <TextField
                name="alert_humidity_max"
                label="Max"
                type="number"
                value={formData.alert_humidity_max ?? ''}
                onChange={handleChange}
                variant="filled"
                fullWidth
              />
            </Stack>

            {['super_admin', 'admin'].includes(role) && (
              <>
                <FormLabel htmlFor="started_at">Start Date</FormLabel>
                <DateTimePicker
                  disableFuture
                  value={formData.started_at}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      variant: 'filled',
                      fullWidth: true,
                    },
                  }}
                />
              </>
            )}

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
              className="default-button"
              fullWidth
              sx={{ mt: 3 }}
            >
              Save Changes
            </Button>
          </div>
        </Box>
      </LocalizationProvider>
    </div>
  );
}

export default EditDevice;
