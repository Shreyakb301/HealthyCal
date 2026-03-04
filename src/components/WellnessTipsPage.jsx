import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { wellnessAPI } from '../services/api';
import './FeaturePages.css';

const WellnessTipsPage = () => {
    const [tips, setTips] = useState([]);
    const [dailyTipId, setDailyTipId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTips = async () => {
            try {
                const data = await wellnessAPI.getTips();
                setTips(data.tips || []);
                setDailyTipId(data.dailyTipId || '');
            } catch (err) {
                if (!String(err.message).toLowerCase().includes('token')) {
                    setError(err.message || 'Failed to load wellness tips');
                }
            }
        };

        loadTips();
    }, []);

    return (
        <AppShell
            title="Wellness Tips"
            subtitle="Daily guidance for better eating and wellness habits"
        >
            <section className="feature-layout single-column">
                {error && <p className="inline-error">{error}</p>}
                <article className="feature-card">
                    <h2>Tip Library</h2>
                    <div className="tips-grid">
                        {tips.map((tip) => (
                            <article key={tip.id} className={`tip-panel ${tip.id === dailyTipId ? 'today' : ''}`}>
                                <h3>{tip.title}</h3>
                                <p>{tip.message}</p>
                                <small>{tip.category}</small>
                                <a href={tip.learnMoreUrl} target="_blank" rel="noopener noreferrer">Learn more</a>
                            </article>
                        ))}
                    </div>
                </article>
            </section>
        </AppShell>
    );
};

export default WellnessTipsPage;
