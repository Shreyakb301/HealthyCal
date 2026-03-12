import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeals } from '../context/MealContext';
import './Login.css';

const Login = ({ demoCredentials, demoFillNonce, onToggle }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { loadMeals } = useMeals();
    const navigate = useNavigate();

    useEffect(() => {
        if (!demoFillNonce) {
            return;
        }

        setEmail(demoCredentials.email);
        setPassword(demoCredentials.password);
        setError('');
    }, [demoCredentials, demoFillNonce]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await login(email, password);
            await loadMeals();
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="auth-form">
            <header className="auth-header">
                <img src="/logo.png" alt="HealthyCal Logo" className="auth-logo" />
                <h1>HealthyCal</h1>
            </header>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Login</button>
            </form>
            <p>
                Don't have an account?{' '}
                <button type="button" className="link-button" onClick={onToggle}>
                    Register
                </button>
            </p>
        </div>
    );
};

export default Login;
