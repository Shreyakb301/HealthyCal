import './FoodTable.css';

const FoodTable = ({ foodData }) => {
    if (!foodData || foodData.length === 0) {
        return <p>No food data available.</p>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Food</th>
                    <th>Portion</th>
                    <th>Calories</th>
                </tr>
            </thead>
            <tbody>
                {foodData.map((item, index) => (
                    <tr key={index}>
                        <td>{item.food}</td>
                        <td>{item.portion}</td>
                        <td>{item.calories}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default FoodTable;
