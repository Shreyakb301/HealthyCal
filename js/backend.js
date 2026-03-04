// --- DOM Manipulation: Show/Hide Daily Tip ---
const tips = [
    "Drink a glass of water before meals to aid digestion.",
    "Portion your snacks instead of eating straight from the bag.",
    "Add more color to your plate with fruits and vegetables!",
    "Track your calories to stay mindful of energy balance.",
    "Even healthy food contributes to calories — stay aware!"
];

document.addEventListener("DOMContentLoaded", () => {
    const tipBtn = document.getElementById("tipBtn");
    const tipText = document.getElementById("tipText");

    if (tipBtn && tipText) {
        tipBtn.addEventListener("click", () => {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            tipText.textContent = randomTip;
            tipText.style.display = (tipText.style.display === "none" || !tipText.style.display)
                ? "block"
                : "none";
        });
    }

    const searchBtn = document.getElementById("searchBtn");
    const resultDiv = document.getElementById("nutritionResult");
    const foodInput = document.getElementById("foodInput");

    if (searchBtn && foodInput) {
        searchBtn.addEventListener("click", async () => {
            const food = foodInput.value.trim();
            if (!food) {
                resultDiv.textContent = "Please enter a food name.";
                return;
            }

            localStorage.setItem("lastSearch", food); // save last search
            const url = `https://chomp.p.rapidapi.com/product-search.php?query=${encodeURIComponent(food)}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-key': '8f33dda4aemsh7011d0520c4f007p115f1bjsn4a18df6bc3a5',
                        'x-rapidapi-host': 'chomp-food-nutrition-database.p.rapidapi.com'
                    }
                });

                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();
                if (data.length === 0) {
                    resultDiv.textContent = "No data found for that food.";
                    return;
                }

                const item = data[0];
                resultDiv.innerHTML = `
                    <p><strong>${item.name.toUpperCase()}</strong> - ${item.calories} calories per ${item.serving_size_g}g</p>
                `;
            } catch (error) {
                resultDiv.textContent = "Error fetching data. Try again.";
                console.error(error);
            }
        });
    }

    // --- Form Validation ---
    const form = document.getElementById("contactForm");
    const messageDiv = document.getElementById("formMessage");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !message) {
                messageDiv.textContent = "Please fill in all fields.";
                messageDiv.style.color = "red";
                return;
            }

            messageDiv.textContent = "Thank you for your message!";
            messageDiv.style.color = "green";
            form.reset();
        });
    }
});
