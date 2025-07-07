import { useState } from 'react'
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import './login.css'
import { Link } from 'react-router-dom';
function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const validate = () => {
        const newErrors = { email: '', password: '' };
        let isValid = true;

        if (!formData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e:React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (validate()) {

            console.log('Logging in Data:', formData);
        }
    };
    return (
        <div className='form-wrapper'>
            <Box
            className='login-form-container'
                component="form"
                noValidate
                onSubmit={handleSubmit}
                autoComplete="on"
            >

                <div className='login-form-container' >
                    <TextField
                        id="filled-email-input"
                        name='email'
                        label="email"
                        className='input-field'
                        variant="filled"
                        value={formData.email}
                        onChange={handleChange}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        fullWidth
                    />

                    <TextField
                        id="filled-password-input"
                        label="Password"
                        name='password'
                        type="password"
                        className='input-field'
                        autoComplete="current-password"
                        variant="filled"
                        value={formData.password}
                        onChange={handleChange}
                        error={Boolean(errors.password)}
                        helperText={errors.password}
                        fullWidth
                    />

                    <Button variant="contained" type="submit" >Login</Button>

                </div>
                <p>Don't have account? <Link to="/register">Register</Link></p>

            </Box>

        </div>
    )
}

export default Login