import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { wellnessAPI } from '../services/api';
import './FeaturePages.css';

const WellnessTipsPage = () => {
    const [tips, setTips] = useState([]);
    const [dailyTipId, setDailyTipId] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [error, setError] = useState('');

    const filters = ['All', 'Mindful Eating', 'Meal Balance', 'Hydration', 'Nutrition'];

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

    const filteredTips = tips.filter(tip =>
        activeFilter === 'All' || tip.category === activeFilter
    );

    return (
        <AppShell
            title="Wellness Tips"
            subtitle="Daily guidance for better eating and wellness habits"
        >
            <div className="wellness-tips-container">
                <div className="filter-chip-row">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {error && <p className="inline-error">{error}</p>}

                <div className="wellness-tips-grid">
                    {filteredTips.map((tip) => (
                        <article
                            key={tip.id}
                            className={`well-tip-card ${tip.id === dailyTipId ? 'featured-card' : ''}`}
                        >
                            <div className="well-card-content">
                                {tip.id === dailyTipId && (
                                    <div className="featured-badge">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        <span>Featured</span>
                                    </div>
                                )}
                                <h3 className="tip-title">{tip.title}</h3>
                                <p className="tip-message">{tip.message}</p>
                            </div>

                            <div className="well-card-footer">
                                <span className={`category-tag ${tip.category.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {tip.category}
                                </span>
                                <a
                                    href={tip.learnMoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="learn-more-link"
                                >
                                    Learn more
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </AppShell>
    );
};

export default WellnessTipsPage;
