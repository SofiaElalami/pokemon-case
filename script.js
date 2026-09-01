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

    // Validate the input
    if (!pokemonName || cp < 0 || iv < 0 || iv > 100 || candy < 0) {
        errorMessage.textContent =
            "Please fill in all the fields correctly.";
        result.style.display = "none";
        return;
    }

    try {

        // Get Pokémon data
        const pokemonResponse = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
        );

        if (!pokemonResponse.ok) {
            throw new Error("Pokémon not found");
        }

        const pokemonData = await pokemonResponse.json();

        // Get species information
        const speciesResponse = await fetch(
            pokemonData.species.url
        );

        const speciesData = await speciesResponse.json();

        // Get evolution chain
        const evolutionResponse = await fetch(
            speciesData.evolution_chain.url
        );

        const evolutionData = await evolutionResponse.json();

        // Find the next evolution
        const currentName = pokemonData.name;

        let nextEvolution = "No further evolution";

        function findNextEvolution(chain) {

            if (chain.species.name === currentName) {

                if (chain.evolves_to.length > 0) {
                    return chain.evolves_to[0].species.name;
                }

                return null;
            }

            for (const evolution of chain.evolves_to) {

                const result = findNextEvolution(evolution);

                if (result) {
                    return result;
                }
            }

            return null;
        }

        const foundEvolution = findNextEvolution(
            evolutionData.chain
        );

        if (foundEvolution) {
            nextEvolution = foundEvolution;
        }

        // Display Pokémon image
        const image =
            pokemonData.sprites.other["official-artwork"].front_default ||
            pokemonData.sprites.front_default;

        document.getElementById("pokemonImage").src = image;

        // Display Pokémon name
        document.getElementById("pokemonName").textContent =
            pokemonData.name;

        // Display Pokémon type
        const types = pokemonData.types
            .map(type => type.type.name)
            .join(" / ");

        document.getElementById("pokemonType").textContent =
            types;

        // Display user's information
        document.getElementById("displayCP").textContent = cp;
        document.getElementById("displayIV").textContent = `${iv}%`;
        document.getElementById("displayCandy").textContent = candy;

        // Display evolution
        document.getElementById("evolutionName").textContent =
            nextEvolution;

        document.getElementById("candyRequired").textContent =
            "Check Pokémon GO";

        // Recommendation
        const recommendation =
            document.getElementById("recommendation");

        const recommendationTitle =
            document.getElementById("recommendationTitle");

        const recommendationText =
            document.getElementById("recommendationText");

        if (iv >= 80) {

            recommendationTitle.textContent =
                "🟢 YES — EVOLVE!";

            recommendationText.textContent =
                `This Pokémon has a high IV of ${iv}%. If you have enough candy for the evolution, it is a good candidate to evolve.`;

        } else if (iv >= 50) {

            recommendationTitle.textContent =
                "🟡 MAYBE — WAIT";

            recommendationText.textContent =
                `This Pokémon has a moderate IV of ${iv}%. You may want to wait for a stronger Pokémon before using your resources.`;

        } else {

            recommendationTitle.textContent =
                "🔴 DON'T EVOLVE";

            recommendationText.textContent =
                `This Pokémon has a relatively low IV of ${iv}%. It may be better to wait for a stronger Pokémon.`;
        }

        recommendation.style.backgroundColor = "#f4f6f8";

        result.style.display = "block";

    } catch (error) {

        result.style.display = "none";

        errorMessage.textContent =
            "Pokémon not found. Please check the name and try again.";
    }
}
