import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './About.css';

const featureCards = [
    {
        label: '01',
        title: 'Meal Logging',
        description: 'Meal logging for daily food tracking'
    },
    {
        label: '02',
        title: 'Nutrition Breakdown',
        description: 'Nutritional breakdown including calories, protein, carbohydrates, and fat'
    },
    {
        label: '03',
        title: 'Simple by Design',
        description: 'Simple interface designed for quick and consistent use'
    },
    {
        label: '04',
        title: 'Available Anywhere',
        description: 'Lightweight web platform accessible from any device'
    }
];

const heroHighlights = [
    'Log meals with clarity instead of clutter',
    'See calories and macros in one streamlined view',
    'Build healthier habits through consistent daily tracking'
];

const supportCards = [
    {
        title: 'Balanced overview',
        description: 'Calories, protein, carbohydrates, and fat stay visible in one clear snapshot.'
    },
    {
        title: 'Designed for consistency',
        description: 'A focused interface keeps daily tracking approachable instead of overwhelming.'
    }
];

const About = () => {
    const { isAuthenticated } = useAuth();
    const appLink = isAuthenticated ? '/' : '/auth';
    const appLabel = isAuthenticated ? 'Open Dashboard' : 'Open HealthyCal';

    return (
        <main className="about-page">
            <div className="about-shell">
                <header className="about-topbar">
                    <Link to={appLink} className="about-brand">
                        <img src="/logo.png" alt="HealthyCal logo" className="about-brand-logo" />
                        <div>
                            <span className="about-brand-name">HealthyCal</span>
                            <span className="about-brand-tagline">Mindful nutrition tracking</span>
                        </div>
                    </Link>

                    <div className="about-topbar-actions">
                        <Link to={appLink} className="about-ghost-link">
                            {appLabel}
                        </Link>
                    </div>
                </header>

                <section className="about-hero">
                    <article className="about-hero-card">
                        <h1>About HealthyCal</h1>
                        <p className="about-hero-copy">
                            HealthyCal is a web-based calorie and nutrition tracking application designed to help users become more mindful of their daily food consumption. The platform allows users to log meals and view key nutritional information such as calories, carbohydrates, protein, and fat. By providing a clear view of nutritional intake, HealthyCal helps users build healthier eating habits and maintain better control over their daily energy balance.
                        </p>

                        <div className="about-hero-actions">
                            <Link to={appLink} className="about-primary-link">
                                {appLabel}
                            </Link>
                            <a
                                href="https://shreyakb.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="about-secondary-link"
                            >
                                Developer Website
                            </a>
                        </div>
                    </article>

                    <aside className="about-hero-sidebar">
                        <article className="about-insight-card">
                            <h2>Healthy habits start with visibility.</h2>
                            <ul className="about-highlight-list">
                                {heroHighlights.map((highlight) => (
                                    <li key={highlight}>{highlight}</li>
                                ))}
                            </ul>
                        </article>

                        <div className="about-support-grid">
                            {supportCards.map((card) => (
                                <article key={card.title} className="about-support-card">
                                    <h3 className="about-support-title">{card.title}</h3>
                                    <p className="about-support-copy">{card.description}</p>
                                </article>
                            ))}
                        </div>
                    </aside>
                </section>

                <section className="about-story-grid">
                    <article className="about-section-card">
                        <h2>Problem Statement</h2>
                        <p>
                            Many people assume that eating healthy foods automatically means they are maintaining a balanced diet. However, even nutritious foods contribute to total calorie intake, and without tracking portions, it is easy to unknowingly consume more calories than intended. Existing calorie tracking tools can often be complex, cluttered, or time-consuming, which discourages users from consistently logging their meals.
                        </p>
                    </article>

                    <article className="about-section-card about-section-card-accent">
                        <h2>Solution</h2>
                        <p>
                            HealthyCal provides a simple and intuitive platform where users can log meals and instantly view important nutritional values such as calories, protein, carbohydrates, and fats. By focusing on a clean and minimal interface, the platform removes unnecessary complexity and encourages consistent daily tracking.
                        </p>
                    </article>
                </section>

                <section className="about-features-card">
                    <div className="about-section-heading">
                        <h2>Built to keep nutrition tracking simple and consistent.</h2>
                        <p>
                            HealthyCal focuses on the essentials users need to understand daily intake quickly, without the friction of a cluttered experience.
                        </p>
                    </div>

                    <div className="about-feature-grid">
                        {featureCards.map((feature) => (
                            <article key={feature.label} className="about-feature-card">
                                <span className="about-feature-label">{feature.label}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="about-developer-card">
                    <div className="about-developer-copy">
                        <h2>About the Developer</h2>
                        <p>
                            I’m Shreya Komarabattini, developed HealthyCal as a computer science student passionate about building practical applications that solve real-world problems. My work focuses on creating user-friendly web platforms that connect technology with everyday needs, including health tracking and decision support tools.
                        </p>
                        <div className="about-developer-actions">
                            <a
                                href="https://shreyakb.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="about-developer-link"
                            >
                                Visit My Website
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default About;
