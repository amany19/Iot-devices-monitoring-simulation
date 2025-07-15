import { useState } from 'react';
import { Button, Box, TextField, MenuItem, FormLabel, Stack, FormGroup } from '@mui/material';
import './addDevice.css';
import type Device from '../../types/device';
 
function AddDevice() {

  const initialDevice: Omit<Device, 'id' | 'readings'> = {
    name: '',
    code: '',
    location: '',
    status: 'off',
    humidity_min: 0,
    humidity_max: 0,
    temperature_min: 0,
    temperature_max: 0,
  };

  const [formData, setFormData] = useState<Omit<Device, 'id' | 'readings'>>(initialDevice);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Device, 'id' | 'readings'>, string>>>({});
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_min') || name.includes('_max') ? Number(value) : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof Omit<Device, 'id' | 'readings'>, string>> = {};
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

    if (formData.temperature_min >= formData.temperature_max) {
      newErrors.temperature_min = 'Temperature min must be less than max';
      isValid = false;
    }

    if (formData.humidity_min >= formData.humidity_max) {
      newErrors.humidity_min = 'Humidity min must be less than max';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validate()) {
      try {
        const response = await fetch('http://localhost:8000/api/devices/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Failed to add device');
        }
        console.log('Device added:', formData);
        // Optionally reset form or show success message
      } catch (error) {
        console.error(error);
        // Optionally set error state
      }
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

          <Button variant="contained" type="submit" className='default-button' fullWidth sx={{ mt: 3 }}>
            Add Device
          </Button>
        </div>
      </Box>
    </div>
  );
}

export default AddDevice;