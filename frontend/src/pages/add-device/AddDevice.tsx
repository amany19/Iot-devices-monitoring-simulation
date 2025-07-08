import { useState } from 'react';
import { Button, Box, TextField, MenuItem, FormLabel, Stack, FormGroup } from '@mui/material';
import './addDevice.css';
import type { DeviceType } from '../../types/index ';
import { Weight } from 'lucide-react';

function AddDevice() {
  const initialDevice: DeviceType = {
    name: '',
    code: '',
    location: '',
    status: 'off',
    normalTemperatureRange: {
      min: 0,
      max: 0,
    },
    normalHumidityRange: {
      min: 0,
      max: 0,
    },
  };

  const [formData, setFormData] = useState<DeviceType>(initialDevice);
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceType, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('normalTemperatureRange.') || name.startsWith('normalHumidityRange.')) {
      const [parentKey, childKey] = name.split('.') as ['normalTemperatureRange' | 'normalHumidityRange', 'min' | 'max'];
      setFormData((prev: DeviceType) => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: Number(value),
        },
      }));
    } else {
      setFormData((prev: DeviceType) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof DeviceType, string>> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

    if (formData.normalTemperatureRange.min >= formData.normalTemperatureRange.max) {
      newErrors.normalTemperatureRange = 'Temperature min must be less than max';
      isValid = false;
    }

    if (formData.normalHumidityRange.min >= formData.normalHumidityRange.max) {
      newErrors.normalHumidityRange = 'Humidity min must be less than max';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validate()) {
      console.log('Device:', formData);
    }
  };

  return (
    <div className="add-device-form-wrapper">
      <Box component="form" noValidate onSubmit={handleSubmit} autoComplete="on">
        <div className="login-form-container">
          <FormGroup>
            <FormLabel htmlFor="name" sx={{ mb: 0.5 }}>Device Name</FormLabel>
            <TextField
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              variant="filled"
              fullWidth
              className="input-field"
            />
          </FormGroup>
          <FormLabel htmlFor="code" sx={{ mb: 0.5 }}>Device Code</FormLabel>
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

          <FormLabel htmlFor="location" sx={{ mb: 0.5 }}>Location</FormLabel>
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

            <FormLabel htmlFor="status" sx={{ mb: 0.5 }}>Status</FormLabel>
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

          <FormLabel sx={{ mt: 2 }}>Normal Temperature Range (°C)</FormLabel>
          <Stack direction="row" spacing={2}>
            <TextField
              name="normalTemperatureRange.min"
              label="Min"
              type="number"
              value={formData.normalTemperatureRange.min}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />
            <TextField
              name="normalTemperatureRange.max"
              label="Max"
              type="number"
              value={formData.normalTemperatureRange.max}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />
          </Stack>
          {errors.normalTemperatureRange && (
            <span className="error-text">{errors.normalTemperatureRange}</span>
          )}

          <FormLabel sx={{ mt: 2 }}>Normal Humidity Range (%)</FormLabel>
          <Stack direction="row" spacing={2}>
            <TextField
              name="normalHumidityRange.min"
              label="Min"
              type="number"
              value={formData.normalHumidityRange.min}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />
            <TextField
              name="normalHumidityRange.max"
              label="Max"
              type="number"
              value={formData.normalHumidityRange.max}
              onChange={handleChange}
              variant="filled"
              fullWidth
            />
          </Stack>
          {errors.normalHumidityRange && (
            <span className="error-text">{errors.normalHumidityRange}</span>
          )}

          <Button variant="contained" type="submit" fullWidth sx={{ mt: 3 }}>
            Add Device
          </Button>
        </div>
      </Box>
    </div>
  );
}

export default AddDevice;
