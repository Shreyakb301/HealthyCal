import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Meal Log', to: '/meal-log' },
    { label: 'Nutrition', to: '/nutrition' },
    { label: 'Wellness Tips', to: '/wellness-tips' },
    { label: 'Settings', to: '/settings' }
];

const AppShell = ({ title, subtitle, children }) => {
    const { isAuthenticated, user, logout } = useAuth();

    const avatarLabel = (user?.username || user?.email || 'U').trim().charAt(0).toUpperCase();

    if (!isAuthenticated) {
        return (
            <main className="dashboard-shell guest-shell">
                <section className="guest-panel">
                    <h1>HealthyCal Dashboard</h1>
                    <p>Sign in to view your meal log, daily calories, macros, and personalized wellness tip.</p>
                    <Link to="/auth" className="primary-action">Login or Register</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="dashboard-shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-icon" aria-hidden="true">HC</span>
                    <span>HealthyCal</span>
                </div>

                <nav className="sidebar-nav" aria-label="Primary navigation">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/about" className="about-link">About</Link>
                    <button type="button" className="secondary-action" onClick={() => logout()}>
                        Logout
                    </button>
                </div>
            </aside>

            <section className="dashboard-content">
                <header className="top-header">
                    <div>
                        <h1>{title}</h1>
                        <p className="subtle-text">{subtitle || ''}</p>
                    </div>

                    <div className="header-actions">
                        <Link to="/profile" className="avatar" aria-label="Profile avatar">{avatarLabel}</Link>
                    </div>
                </header>

                {children}
            </section>
        </main>
    );
};

export default AppShell;
