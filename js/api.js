class FoodItem {
    constructor(name, calories, serving_size_g) {
        this.name = name;
        this.calories = calories;
        this.serving_size_g = serving_size_g;
    }
}

let foodItems = [];
let lastRequestTime = 0;
const REQUEST_DELAY = 5000; // 5 seconds between requests

document.getElementById("fetchApiBtn").addEventListener("click", async () => {
    const query = document.getElementById("foodSearch").value.trim();
    const resultDiv = document.getElementById("foodList");
    resultDiv.innerHTML = "";

    if (!query) {
        resultDiv.textContent = "Please enter a food name.";
        return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < REQUEST_DELAY) {
        const waitTime = REQUEST_DELAY - timeSinceLastRequest;
        resultDiv.innerHTML = `<div style="color: orange;">Please wait ${Math.ceil(waitTime/1000)} seconds before searching again...</div>`;
        return;
    }
    
    lastRequestTime = now;

    const url = `https://dietagram.p.rapidapi.com/apiFood.php?name=${encodeURIComponent(query)}&lang=en`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '8f33dda4aemsh7011d0520c4f007p115f1bjsn4a18df6bc3a5',
                'x-rapidapi-host': 'dietagram.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.text();
        console.log(result); // Debug: see what the API returns

        try {
            const data = JSON.parse(result);
            
            if (Array.isArray(data) && data.length === 0) {
                resultDiv.textContent = "No results found.";
                return;
            }

            // Handle array of items
            if (Array.isArray(data)) {
                data.forEach(item => {
                    const food = new FoodItem(item.name || item.product_name || 'Unknown', 
                                            item.calories || item.energy || 0, 
                                            item.serving_size_g || item.weight || 100);
                    foodItems.push(food);

                    const div = document.createElement("div");
                    div.classList.add("food-item");
                    div.innerHTML = `
                        <h3>${food.name}</h3>
                        <p><strong>Calories:</strong> ${food.calories}</p>
                        <p><strong>Serving Size:</strong> ${food.serving_size_g} g</p>
                    `;
                    resultDiv.appendChild(div);
                });
            } else {
                const food = new FoodItem(data.name || data.product_name || 'Unknown', 
                                        data.calories || data.energy || 0, 
                                        data.serving_size_g || data.weight || 100);
                foodItems.push(food);

                const div = document.createElement("div");
                div.classList.add("food-item");
                div.innerHTML = `
                    <h3>${food.name}</h3>
                    <p><strong>Calories:</strong> ${food.calories}</p>
                    <p><strong>Serving Size:</strong> ${food.serving_size_g} g</p>
                `;
                resultDiv.appendChild(div);
            }
        } catch (parseError) {
            // If not JSON, display raw text
            resultDiv.innerHTML = `<div style="color: blue;">API Response: ${result}</div>`;
        }

    } catch (error) {
        console.error("Error fetching data:", error);
        resultDiv.textContent = "Error fetching data. Please try again.";
    }
});

// function to check if a food already exists
function searchFood(name) {
    return foodItems.some(item => item.name.toLowerCase() === name.toLowerCase());
}
