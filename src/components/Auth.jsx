import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './Login.css';

const DEMO_CREDENTIALS = {
    email: 'shreya@healthycal.com',
    password: 'HealthyCal2026'
};

const DemoEnvelope = ({ credentials, onUseCredentials }) => {
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
                    <code>{credentials.email}</code>
                </div>
                <div className="credential">
                    <span>Password:</span>
                    <code>{credentials.password}</code>
                </div>
                <button
                    type="button"
                    className="demo-envelope-action"
                    onClick={(event) => {
                        event.stopPropagation();
                        onUseCredentials();
                        setIsOpen(false);
                    }}
                >
                    Use This!
                </button>
                <p className="hint">Click to close</p>
            </div>
        </div>
    );
};

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [demoFillNonce, setDemoFillNonce] = useState(0);

    const handleUseDemoCredentials = () => {
        setIsLogin(true);
        setDemoFillNonce((current) => current + 1);
    };

    return (
        <div className="auth-container">
            <DemoEnvelope
                credentials={DEMO_CREDENTIALS}
                onUseCredentials={handleUseDemoCredentials}
            />
            {isLogin ? (
                <Login
                    demoCredentials={DEMO_CREDENTIALS}
                    demoFillNonce={demoFillNonce}
                    onToggle={() => setIsLogin(false)}
                />
            ) : (
                <Register onToggle={() => setIsLogin(true)} />
            )}
        </div>
    );
};

export default Auth;
