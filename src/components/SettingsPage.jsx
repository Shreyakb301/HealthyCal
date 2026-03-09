import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { settingsAPI, authAPI } from '../services/api';
import './FeaturePages.css';

const SettingsPage = () => {
    const [user, setUser] = useState({ username: '', email: '' });
    const [settings, setSettings] = useState({
        dailyCalorieGoal: 2000,
        carbGoal: 250,
        proteinGoal: 120,
        fatGoal: 65,
        notificationsEnabled: true,
        mealRemindersEnabled: false,
        waterRemindersEnabled: true
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [settingsData, userData] = await Promise.all([
                    settingsAPI.get(),
                    authAPI.getCurrentUser()
                ]);

                const s = settingsData.settings;
                setSettings({
                    dailyCalorieGoal: s.dailyCalorieGoal || 2000,
                    carbGoal: s.carbGoal || 250,
                    proteinGoal: s.proteinGoal || 120,
                    fatGoal: s.fatGoal || 65,
                    notificationsEnabled: s.notificationsEnabled ?? true,
                    mealRemindersEnabled: s.mealRemindersEnabled ?? false,
                    waterRemindersEnabled: s.waterRemindersEnabled ?? true
                });

                if (userData.user) {
                    setUser({
                        username: userData.user.username,
                        email: userData.user.email
                    });
                }
            } catch (err) {
                if (!String(err.message).toLowerCase().includes('token')) {
                    setStatus(err.message || 'Failed to load settings');
                }
            }
        };

        load();
    }, []);

    const handleChange = (name, value) => {
        setSettings((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const data = await settingsAPI.update(settings);
            const s = data.settings;
            setSettings({
                dailyCalorieGoal: s.dailyCalorieGoal,
                carbGoal: s.carbGoal,
                proteinGoal: s.proteinGoal,
                fatGoal: s.fatGoal,
                notificationsEnabled: s.notificationsEnabled,
                mealRemindersEnabled: s.mealRemindersEnabled,
                waterRemindersEnabled: s.waterRemindersEnabled
            });
            setStatus('Settings saved.');
            setTimeout(() => setStatus(''), 3000);
        } catch (err) {
            setStatus(err.message || 'Failed to save settings');
        }
    };

    const Switch = ({ checked, onChange }) => (
        <button
            type="button"
            className={`switch-btn ${checked ? 'active' : ''}`}
            onClick={() => onChange(!checked)}
        >
            <span className="switch-thumb" />
        </button>
    );

    return (
        <AppShell title="Settings" subtitle="Personalize your goals and preferences">
            <div className="settings-container">
                {/* Profile Section */}
                <article className="settings-card profile-section">
                    <div className="settings-section-title">
                        <div className="section-icon-wrap user-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <h3>Profile</h3>
                    </div>

                    <div className="profile-identity">
                        <div className="profile-avatar">
                            {user.username.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            <div className="user-name">{user.username}</div>
                            <div className="user-email">{user.email}</div>
                        </div>
                    </div>

                    <div className="settings-form-grid">
                        <div className="form-group">
                            <label>Name</label>
                            <input readOnly value={user.username} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input readOnly value={user.email} />
                        </div>
                    </div>
                </article>

                {/* Daily Goals Section */}
                <article className="settings-card goals-section">
                    <div className="settings-section-title">
                        <div className="section-icon-wrap goals-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                        </div>
                        <h3>Daily Goals</h3>
                    </div>

                    <div className="settings-form-stack">
                        <div className="form-group">
                            <label>Daily Calorie Goal (kcal)</label>
                            <input
                                type="number"
                                value={settings.dailyCalorieGoal}
                                onChange={(e) => handleChange('dailyCalorieGoal', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Carbohydrates Goal (g)</label>
                            <input
                                type="number"
                                value={settings.carbGoal}
                                onChange={(e) => handleChange('carbGoal', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Protein Goal (g)</label>
                            <input
                                type="number"
                                value={settings.proteinGoal}
                                onChange={(e) => handleChange('proteinGoal', Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Fat Goal (g)</label>
                            <input
                                type="number"
                                value={settings.fatGoal}
                                onChange={(e) => handleChange('fatGoal', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </article>

                {/* Notifications Section */}
                <article className="settings-card notifications-section">
                    <div className="settings-section-title">
                        <div className="section-icon-wrap bell-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </div>
                        <h3>Notifications</h3>
                    </div>

                    <div className="notification-list">
                        <div className="notification-item">
                            <div className="notification-text">
                                <div className="notif-label">Enable notifications</div>
                                <div className="notif-desc">Get reminders and daily tips</div>
                            </div>
                            <Switch
                                checked={settings.notificationsEnabled}
                                onChange={(val) => handleChange('notificationsEnabled', val)}
                            />
                        </div>
                        <div className="notification-item">
                            <div className="notification-text">
                                <div className="notif-label">Meal reminders</div>
                                <div className="notif-desc">Remind me to log meals throughout the day</div>
                            </div>
                            <Switch
                                checked={settings.mealRemindersEnabled}
                                onChange={(val) => handleChange('mealRemindersEnabled', val)}
                            />
                        </div>
                        <div className="notification-item">
                            <div className="notification-text">
                                <div className="notif-label">Water reminders</div>
                                <div className="notif-desc">Remind me to drink water regularly</div>
                            </div>
                            <Switch
                                checked={settings.waterRemindersEnabled}
                                onChange={(val) => handleChange('waterRemindersEnabled', val)}
                            />
                        </div>
                    </div>
                </article>

                <div className="settings-actions">
                    <button type="button" className="save-btn" onClick={handleSave}>
                        {status || 'Save Settings'}
                    </button>
                </div>
            </div>
        </AppShell>
    );
};

export default SettingsPage;
