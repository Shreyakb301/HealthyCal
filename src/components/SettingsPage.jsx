import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { settingsAPI } from '../services/api';
import './FeaturePages.css';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        dailyCalorieGoal: 2000,
        notificationsEnabled: true
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await settingsAPI.get();
                setSettings({
                    dailyCalorieGoal: data.settings.dailyCalorieGoal,
                    notificationsEnabled: data.settings.notificationsEnabled
                });
            } catch (err) {
                if (!String(err.message).toLowerCase().includes('token')) {
                    setStatus(err.message || 'Failed to load settings');
                }
            }
        };

        load();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setStatus('Saving...');

        try {
            const payload = {
                dailyCalorieGoal: Number(settings.dailyCalorieGoal),
                notificationsEnabled: Boolean(settings.notificationsEnabled)
            };
            const data = await settingsAPI.update(payload);
            setSettings({
                dailyCalorieGoal: data.settings.dailyCalorieGoal,
                notificationsEnabled: data.settings.notificationsEnabled
            });
            setStatus('Settings saved.');
        } catch (err) {
            setStatus(err.message || 'Failed to save settings');
        }
    };

    return (
        <AppShell title="Settings" subtitle="Personalize goals and preferences">
            <section className="feature-layout single-column">
                <article className="feature-card">
                    <h2>Preferences</h2>
                    <form className="feature-form" onSubmit={handleSave}>
                        <label htmlFor="dailyCalorieGoal">Daily calorie goal</label>
                        <input
                            id="dailyCalorieGoal"
                            name="dailyCalorieGoal"
                            type="number"
                            min="1000"
                            step="50"
                            value={settings.dailyCalorieGoal}
                            onChange={handleChange}
                        />

                        <label className="toggle-row">
                            <input
                                type="checkbox"
                                name="notificationsEnabled"
                                checked={settings.notificationsEnabled}
                                onChange={handleChange}
                            />
                            Enable notifications
                        </label>

                        <button type="submit">Save Settings</button>
                    </form>
                    {status && <p className="inline-note">{status}</p>}
                </article>
            </section>
        </AppShell>
    );
};

export default SettingsPage;
