// Collega i nuovi ID dell'HTML
const form = document.getElementById("pokemonForm");

// Previene il ricaricamento della pagina quando si preme Invio o il pulsante
form.addEventListener("submit", function(event) {
    event.preventDefault(); 
    checkPokemon();
});

async function checkPokemon() {
    // Recupera i valori dai nuovi ID
    const pokemonName = document.getElementById("pokemonInput").value.trim().toLowerCase();
    const candy = Number(document.getElementById("candyInput").value);

    const result = document.getElementById("resultCard");
    const errorMessage = document.getElementById("errorMsg");

    errorMessage.textContent = "";

    // Validazione dei campi aggiornata
    if (!pokemonName || candy < 0) {
        errorMessage.textContent = "Please fill in all the fields correctly.";
        result.style.display = "none";
        return;
    }

    try {
        // Fetch dei dati principali
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!pokemonResponse.ok) {
            throw new Error("Pokémon not found");
        }
        const pokemonData = await pokemonResponse.json();

        // Fetch per l'evoluzione
        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();
        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();

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

        const foundEvolution = findNextEvolution(evolutionData.chain);
        if (foundEvolution) {
            nextEvolution = foundEvolution;
        }

        // Mostra l'immagine 
        const image = pokemonData.sprites.other["official-artwork"].front_default || pokemonData.sprites.front_default;
        document.getElementById("pokemonImage").src = image;
        document.getElementById("pokemonName").textContent = pokemonData.name;

        // Mostra il tipo
        const types = pokemonData.types.map(type => type.type.name).join(" / ");
        document.getElementById("pokemonType").textContent = types;

        // Mostra a schermo in cosa si evolve
        document.getElementById("evolutionDetails").textContent = nextEvolution !== "No further evolution" 
            ? `Evolves into: ${nextEvolution}` 
            : "Does not evolve";

        // Logica del consiglio basata sulle Caramelle (Candy)
        const recommendationTitle = document.getElementById("recommendationTitle");
        const recommendationText = document.getElementById("recommendationText");
        const recommendationBox = document.getElementById("recommendation");

        if (nextEvolution === "No further evolution") {
            recommendationTitle.textContent = "🛑 MAX LEVEL";
            recommendationText.textContent = `${pokemonData.name.toUpperCase()} cannot evolve any further.`;
            recommendationBox.style.backgroundColor = "#222224"; 
        } else if (candy >= 50) { 
            // Usiamo 50 come soglia simulata standard
            recommendationTitle.textContent = "🟢 YES — EVOLVE!";
            recommendationText.textContent = `You have enough candy (${candy}) to evolve into ${nextEvolution.toUpperCase()}!`;
            recommendationBox.style.backgroundColor = "#4CAF50"; 
        } else {
            recommendationTitle.textContent = "🔴 WAIT";
            recommendationText.textContent = `You only have ${candy} candies. You need more to evolve it.`;
            recommendationBox.style.backgroundColor = "#EE1515"; 
        }

        result.style.display = "block";

    } catch (error) {
        result.style.display = "none";
        errorMessage.textContent = "Pokémon not found. Please check the name and try again.";
    }
}
