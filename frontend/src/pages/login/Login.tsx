import { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import './login.css';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
    setLoginError('');
  };

  const validate = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!formData.username) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      //   newErrors.password = 'Password must be at least 6 characters';
      //   isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    try {

      const res = await fetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);


      const userRes = await fetch('/api/users/me/', {
        headers: {
          Authorization: `Bearer ${data.access}`,
        },
      });

      if (!userRes.ok) throw new Error('Failed to fetch user info');

      const user = await userRes.json();
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username);
      localStorage.setItem('user_id', user.id.toString());
      // 3. Redirect based on role
      if (user.role === 'super_admin') {
        navigate('/dashboard');
      } else if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/devices');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  return (
    <div className='login-page'>
      <div className="form-wrapper">
        <Box
          className="login-form-container"
          component="form"
          noValidate
          onSubmit={handleSubmit}
          autoComplete="on"
        >
          <div className="login-form-container">
            <TextField
              id="filled-username-input"
              name="username"
              label="Username"
              className="input-field"
              variant="filled"
              value={formData.username}
              onChange={handleChange}
              error={Boolean(errors.username)}
              helperText={errors.username}
              fullWidth
            />

            <TextField
              id="filled-password-input"
              label="Password"
              name="password"
              type="password"
              className="input-field"
              autoComplete="current-password"
              variant="filled"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
            />

            {loginError && <Alert severity="error">{loginError}</Alert>}

            <Button className="default-button" variant="contained" type="submit">
              Login
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
}

export default Login;
