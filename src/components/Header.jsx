import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header>
            <h1>HealthyCal</h1>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <a href="https://www.choosemyplate.gov/" target="_blank" rel="noopener noreferrer">
                    Nutrition Guide
                </a>
                {isAuthenticated ? (
                    <>
                        <span className="user-info">Welcome, {user?.username}</span>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                ) : (
                    <Link to="/auth">Login</Link>
                )}
            </nav>
        </header>
    );
};

export default Header;
