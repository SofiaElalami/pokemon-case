const form = document.getElementById("pokemonForm");

// Mappatura professionale dei colori per ogni tipo di Pokémon
const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD'
};

form.addEventListener("submit", function(event) {
    event.preventDefault(); 
    checkPokemon();
});

async function checkPokemon() {
    const pokemonName = document.getElementById("pokemonInput").value.trim().toLowerCase();
    const candy = Number(document.getElementById("candyInput").value);

    const result = document.getElementById("resultCard");
    const errorMessage = document.getElementById("errorMsg");
    const loader = document.getElementById("loader");

    // Reset interfaccia prima di una nuova ricerca
    errorMessage.innerHTML = "";
    result.style.display = "none";

    if (!pokemonName || candy < 0) {
        errorMessage.innerHTML = "<p>Please fill in all the fields correctly.</p>";
        return;
    }

    // Mostra l'animazione di caricamento
    loader.style.display = "block";

    try {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!pokemonResponse.ok) throw new Error("Pokémon not found");
        const pokemonData = await pokemonResponse.json();

        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();
        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();

        const currentName = pokemonData.name;
        let nextEvolution = "No further evolution";

        function findNextEvolution(chain) {
            if (chain.species.name === currentName) {
                if (chain.evolves_to.length > 0) return chain.evolves_to[0].species.name;
                return null;
            }
            for (const evolution of chain.evolves_to) {
                const result = findNextEvolution(evolution);
                if (result) return result;
            }
            return null;
        }

        const foundEvolution = findNextEvolution(evolutionData.chain);
        if (foundEvolution) nextEvolution = foundEvolution;

        // Recupera il tipo primario per applicare dinamicamente il colore CSS
        const primaryType = pokemonData.types[0].type.name;
        const themeColor = typeColors[primaryType] || '#333';
        
        // Applica le variabili CSS per bordo e ombra personalizzati sulla Card
        result.style.setProperty('--type-color', themeColor);
        result.style.setProperty('--type-shadow', `${themeColor}80`); // Aggiunge trasparenza

        const image = pokemonData.sprites.other["official-artwork"].front_default || pokemonData.sprites.front_default;
        document.getElementById("pokemonImage").src = image;
        document.getElementById("pokemonName").textContent = pokemonData.name;
        document.getElementById("pokemonType").textContent = pokemonData.types.map(t => t.type.name).join(" / ");

        document.getElementById("evolutionDetails").textContent = nextEvolution !== "No further evolution" 
            ? `Evolves into: ${nextEvolution}` 
            : "Does not evolve";

        const recommendationTitle = document.getElementById("recommendationTitle");
        const recommendationText = document.getElementById("recommendationText");
        const recommendationBox = document.getElementById("recommendation");

        if (nextEvolution === "No further evolution") {
            recommendationTitle.textContent = "🛑 MAX LEVEL";
            recommendationText.textContent = `${pokemonData.name.toUpperCase()} cannot evolve any further.`;
            recommendationBox.style.backgroundColor = "#222224"; 
        } else if (candy >= 50) { 
            recommendationTitle.textContent = "🟢 YES — EVOLVE!";
            recommendationText.textContent = `You have enough candy (${candy}) to evolve into ${nextEvolution.toUpperCase()}!`;
            recommendationBox.style.backgroundColor = "#4CAF50"; 
        } else {
            recommendationTitle.textContent = "🔴 WAIT";
            recommendationText.textContent = `You only have ${candy} candies. You need more to evolve it.`;
            recommendationBox.style.backgroundColor = "#EE1515"; 
        }

        // Spegni caricamento, accendi Card
        loader.style.display = "none";
        result.style.display = "block";

    } catch (error) {
        loader.style.display = "none";
        // Iniezione HTML per l'errore creativo con Psyduck
        errorMessage.innerHTML = `
            <p>Mhm... la nostra enciclopedia non trova questo Pokémon! Sei sicuro di averlo scritto bene?</p>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png" alt="Psyduck Confused" class="error-img">
        `;
    }
}
