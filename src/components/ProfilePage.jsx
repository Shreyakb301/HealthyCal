import { Link } from 'react-router-dom';
import AppShell from './AppShell';
import { useAuth } from '../context/AuthContext';
import './FeaturePages.css';

const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <AppShell title="Profile" subtitle="Your account details">
            <section className="feature-layout single-column">
                <article className="feature-card">
                    <h2>Account</h2>
                    <div className="list-grid">
                        <div className="list-row">
                            <strong>Username</strong>
                            <span>{user?.username || '-'}</span>
                        </div>
                        <div className="list-row">
                            <strong>Email</strong>
                            <span>{user?.email || '-'}</span>
                        </div>
                    </div>
                    <p className="inline-note" style={{ marginTop: '1rem' }}>
                        Need to adjust goals or preferences? <Link to="/settings">Open Settings</Link>
                    </p>
                </article>
            </section>
        </AppShell>
    );
};

export default ProfilePage;
