class FoodItem {
    constructor(id, name, calories, serving, macros) {
        this.id = id;
        this.name = name;
        this.calories = calories;
        this.serving = serving;
        this.macros = macros;
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
        resultDiv.innerHTML = `<div style="color: orange;">Please wait ${Math.ceil(waitTime / 1000)} seconds before searching again...</div>`;
        return;
    }

    lastRequestTime = now;

    const url = `/api/nutrition/search?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || `HTTP error! Status: ${response.status}`);
        }

        const payload = await response.json();
        const results = Array.isArray(payload.results) ? payload.results : [];

        if (results.length === 0) {
            resultDiv.textContent = "No results found.";
            return;
        }

        results.forEach(item => {
            const food = new FoodItem(
                item.id,
                item.name || 'Unknown',
                item.calories || 0,
                item.serving || 'Serving size unavailable',
                item.macros || { carbs: 0, protein: 0, fat: 0 }
            );

            if (!searchFood(food.name)) {
                foodItems.push(food);
            }

            const div = document.createElement("div");
            div.classList.add("food-item");
            div.innerHTML = `
                <h3>${food.name}</h3>
                <p><strong>Calories:</strong> ${food.calories}</p>
                <p><strong>Serving:</strong> ${food.serving}</p>
                <p><strong>Macros:</strong> ${food.macros.carbs}g carbs / ${food.macros.protein}g protein / ${food.macros.fat}g fat</p>
            `;
            resultDiv.appendChild(div);
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        resultDiv.textContent = error.message || "Error fetching data. Please try again.";
    }
});

// function to check if a food already exists
function searchFood(name) {
    return foodItems.some(item => item.name.toLowerCase() === name.toLowerCase());
}
