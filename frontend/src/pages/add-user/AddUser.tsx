import { useState } from 'react';
import {
  Box,
  TextField,
  FormGroup,
  FormLabel,
  Select,
  MenuItem,
  Alert,
  Button,
  Typography
} from '@mui/material';
import './addUser.css'; // Assuming similar styles to AddDevice

export default function AddUser() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    const newErrors = {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
    };
    let valid = true;

    if (!formData.username) {
      newErrors.username = 'Username is required';
      valid = false;
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    }
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
      valid = false;
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const access = localStorage.getItem('access');

    try {
      const res = await fetch('/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error adding user');
      setSuccess(true);
      setError('');
    } catch (err: any) {
      setSuccess(false);
      setError(err.message || 'Failed to add user');
    }
  };

  return (
    <div className="add-device-form-wrapper">
      <Box component="form" noValidate autoComplete="off" onSubmit={handleAdd}>
        <div className="login-form-container">
          <Typography variant="h5">Add New User</Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">User added successfully!</Alert>}

          <FormGroup>
            <FormLabel htmlFor="username" sx={{ mb: 0.5 }}>Username</FormLabel>
            <TextField
              id="username"
              name="username"
              variant="filled"
              className="input-field"
              value={formData.username}
              onChange={handleChange}
              error={Boolean(errors.username)}
              helperText={errors.username}
              fullWidth
            />
          </FormGroup>

          <FormLabel htmlFor="email" sx={{ mb: 0.5 }}>Email</FormLabel>
          <TextField
            id="email"
            name="email"
            variant="filled"
            className="input-field"
            value={formData.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
          />

          <FormLabel htmlFor="first_name" sx={{ mb: 0.5 }}>First Name</FormLabel>
          <TextField
            id="first_name"
            name="first_name"
            variant="filled"
            className="input-field"
            value={formData.first_name}
            onChange={handleChange}
            error={Boolean(errors.first_name)}
            helperText={errors.first_name}
            fullWidth
          />

          <FormLabel htmlFor="last_name" sx={{ mb: 0.5 }}>Last Name</FormLabel>
          <TextField
            id="last_name"
            name="last_name"
            variant="filled"
            className="input-field"
            value={formData.last_name}
            onChange={handleChange}
            error={Boolean(errors.last_name)}
            helperText={errors.last_name}
            fullWidth
          />

          <FormLabel htmlFor="role" sx={{ mb: 0.5 }}>Role</FormLabel>
          <Select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            variant="filled"
            className="input-field"
            fullWidth
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>

          <Button
            variant="contained"
            type="submit"
            className="default-button"
            fullWidth
            sx={{ mt: 3 }}
          >
            Add User
          </Button>
        </div>
      </Box>
    </div>
  );
}
