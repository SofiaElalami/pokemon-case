const checkButton = document.getElementById("checkButton");

checkButton.addEventListener("click", checkPokemon);

async function checkPokemon() {

    const pokemonName = document
        .getElementById("pokemon")
        .value
        .trim()
        .toLowerCase();

    const cp = Number(document.getElementById("cp").value);
    const iv = Number(document.getElementById("iv").value);
    const candy = Number(document.getElementById("candy").value);

    const result = document.getElementById("result");
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    // Check that all fields are filled
    if (!pokemonName || !cp || !iv || candy < 0) {
        errorMessage.textContent =
            "Please fill in all the fields correctly.";
        result.style.display = "none";
        return;
    }

    // Check IV range
    if (iv < 0 || iv > 100) {
        errorMessage.textContent =
            "IV must be between 0 and 100.";
        result.style.display = "none";
        return;
    }

    try {

        // Get Pokémon information from PokéAPI
        const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
        );

        if (!response.ok) {
            throw new Error("Pokémon not found");
        }

        const data = await response.json();

        // Display Pokémon image
        document.getElementById("pokemonImage").src =
            data.sprites.other["official-artwork"].front_default ||
            data.sprites.front_default;

        // Display Pokémon name
        document.getElementById("pokemonName").textContent =
            data.name;

        // Display Pokémon type
        const types = data.types
            .map(type => type.type.name)
            .join(" / ");

        document.getElementById("pokemonType").textContent =
            types;

        // Display user's information
        document.getElementById("displayCP").textContent = cp;
        document.getElementById("displayIV").textContent = `${iv}%`;
        document.getElementById("displayCandy").textContent = candy;

        // Simple evolution recommendation
        const candyRequired = 50;

        document.getElementById("candyRequired").textContent =
            `${candyRequired} candy`;

        document.getElementById("evolutionName").textContent =
            "Next evolution";

        const recommendation =
            document.getElementById("recommendation");

        const recommendationTitle =
            document.getElementById("recommendationTitle");

        const recommendationText =
            document.getElementById("recommendationText");

        // Recommendation logic
        if (candy < candyRequired) {

            recommendationTitle.textContent =
                "🔴 DON'T EVOLVE YET";

            recommendationText.textContent =
                `You need ${candyRequired} candy, but you only have ${candy}. Get more candy before evolving.`;

        } else if (iv >= 80) {

            recommendationTitle.textContent =
                "🟢 YES — EVOLVE!";

            recommendationText.textContent =
                `This Pokémon has a high IV (${iv}%) and you have enough candy. Evolution is recommended.`;

        } else if (iv >= 50) {

            recommendationTitle.textContent =
                "🟡 MAYBE — WAIT";

            recommendationText.textContent =
                `You have enough candy, but the IV is moderate (${iv}%). Consider waiting for a stronger Pokémon.`;

        } else {

            recommendationTitle.textContent =
                "🔴 DON'T EVOLVE";

            recommendationText.textContent =
                `The IV is relatively low (${iv}%). It may be better to wait for a stronger Pokémon.`;
        }

        // Show recommendation
        recommendation.style.backgroundColor =
            "#f4f6f8";

        result.style.display = "block";

    } catch (error) {

        result.style.display = "none";

        errorMessage.textContent =
            "Pokémon not found. Please check the name and try again.";
    }
}
