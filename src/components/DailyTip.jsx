import { useState } from 'react';
import './DailyTip.css';

const DailyTip = () => {
    const [currentTip, setCurrentTip] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const tips = [
        "Drink a glass of water before meals to aid digestion.",
        "Portion your snacks instead of eating straight from the bag.",
        "Add more color to your plate with fruits and vegetables!",
        "Track your calories to stay mindful of energy balance.",
        "Even healthy food contributes to calories — stay aware!"
    ];

    const handleShowTip = () => {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setCurrentTip(randomTip);
        setIsVisible(!isVisible);
    };

    return (
        <section className="daily-tip">
            <button id="tipBtn" onClick={handleShowTip}>
                {isVisible ? 'Hide Daily Tip' : 'Show Daily Tip'}
            </button>
            {isVisible && <p id="tipText" className="tip-text">{currentTip}</p>}
        </section>
    );
};

export default DailyTip;
