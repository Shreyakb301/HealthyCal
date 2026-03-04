import FoodTable from './FoodTable';
import './About.css';

const About = () => {
    const foodData = [
        { food: 'Banana', portion: '1 medium', calories: 105 },
        { food: 'Chicken Breast', portion: '3 oz', calories: 165 },
        { food: 'Broccoli', portion: '1 cup', calories: 55 },
        { food: 'Olive Oil', portion: '1 tbsp', calories: 120 }
    ];

    return (
        <main className="about-page fade-in">
            <section>
                <h2>Our Goal</h2>
                <p>
                    HealthyCal was created to remind people that even healthy food contributes to calorie intake.
                    Tracking portions helps maintain balance between nutrition and energy needs.
                </p>
            </section>

            <section>
                <h2>Calories in Common Foods</h2>
                <FoodTable foodData={foodData} />
            </section>
        </main>
    );
};

export default About;
