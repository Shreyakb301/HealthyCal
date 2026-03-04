import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './Login.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            {isLogin ? (
                <Login onToggle={() => setIsLogin(false)} />
            ) : (
                <Register onToggle={() => setIsLogin(true)} />
            )}
        </div>
    );
};

export default Auth;
