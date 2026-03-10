import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './Login.css';

const DemoEnvelope = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`demo-envelope-box ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="envelope-icon">
                <span className="icon">✉️</span>
                <span className="label">Demo Access</span>
            </div>
            <div className="envelope-content">
                <h3>Test Credentials</h3>
                <div className="credential">
                    <span>Email:</span>
                    <code>shreya@healthycal.com</code>
                </div>
                <div className="credential">
                    <span>Password:</span>
                    <code>HealthyCal2026</code>
                </div>
                <p className="hint">Click to close</p>
            </div>
        </div>
    );
};

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            <DemoEnvelope />
            {isLogin ? (
                <Login onToggle={() => setIsLogin(false)} />
            ) : (
                <Register onToggle={() => setIsLogin(true)} />
            )}
        </div>
    );
};

export default Auth;
