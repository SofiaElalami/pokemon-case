const typeColors = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD"
};

const statLabels = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Special Attack",
    "special-defense": "Special Defense",
    speed: "Speed"
};

function displayName(name) {
    return name
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getStats(pokemon) {
    return Object.fromEntries(
        pokemon.stats.map(stat => [
            stat.stat.name,
            stat.base_stat
        ])
    );
}

function getTotal(stats) {
    return Object.keys(statLabels).reduce(
        (total, key) => total + stats[key],
        0
    );
}

async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            response.status === 404
                ? "Pokémon not found. Please check the name."
                : "Could not load Pokémon data. Please try again."
        );
    }

    return response.json();
}

// Find all immediate evolutions, including branching evolutions.
function findNextEvolutions(chain, speciesName) {
    if (chain.species.name === speciesName) {
        return chain.evolves_to.map(
            evolution => evolution.species
        );
    }

    for (const branch of chain.evolves_to) {
        const found = findNextEvolutions(branch, speciesName);

        if (found !== null) {
            return found;
        }
    }

    return null;
}

function addElement(parent, tag, text) {
    const element = document.createElement(tag);

    if (text !== undefined) {
        element.textContent = text;
    }

    parent.appendChild(element);
    return element;
}

function setPokemonImage(image, pokemon) {
    const artwork =
        pokemon.sprites.other?.["official-artwork"]?.front_default;

    const fallback = pokemon.sprites.front_default;

    image.alt = displayName(pokemon.name);
    image.style.display = "";

    if (!artwork && !fallback) {
        image.removeAttribute("src");
        image.style.display = "none";
        return;
    }

    image.onerror = () => {
        image.onerror = () => {
            image.style.display = "none";
        };

        if (fallback && image.src !== fallback) {
            image.src = fallback;
        } else {
            image.style.display = "none";
        }
    };

    image.src = artwork || fallback;
}

function initializePokemonApp() {
    const form = document.getElementById("pokemonForm");

    if (!form) return;

    // Hide and disable the old candy field.
    const candyInput = document.getElementById("candyInput");

    if (candyInput) {
        candyInput.required = false;
        candyInput.disabled = true;
        candyInput.style.display = "none";

        document
            .querySelectorAll('label[for="candyInput"]')
            .forEach(label => {
                label.style.display = "none";
            });

        const previous = candyInput.previousElementSibling;

        if (previous && previous.tagName === "LABEL") {
            previous.style.display = "none";
        }
    }

    // Styles for the comparison, without changing your CSS file.
    const style = document.createElement("style");

    style.textContent = `
        #evolutionDetails {
            white-space: normal;
        }

        .evolution-comparison {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #ddd;
            color: #222;
            text-align: left;
        }

        .evolution-comparison img {
            display: block;
            width: 130px;
            height: 130px;
            object-fit: contain;
            margin: 0 auto;
        }

        .evolution-comparison h3 {
            text-align: center;
            margin: 10px 0;
        }

        .comparison-scroll {
            overflow-x: auto;
        }

        .evolution-comparison table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .evolution-comparison th,
        .evolution-comparison td {
            padding: 8px 4px;
            border-bottom: 1px solid #ddd;
            text-align: right;
        }

        .evolution-comparison th:first-child {
            text-align: left;
        }

        .evolution-comparison p,
        .comparison-method {
            font-size: 14px;
            line-height: 1.6;
        }
    `;

    document.head.appendChild(style);

    // Prevent older requests from overwriting newer results.
    let requestNumber = 0;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const thisRequest = ++requestNumber;

        const pokemonName = document
            .getElementById("pokemonInput")
            .value.trim()
            .toLowerCase()
            .replace(/♀/g, "-f")
            .replace(/♂/g, "-m")
            .replace(/[.’']/g, "")
            .replace(/\s+/g, "-");

        const result = document.getElementById("resultCard");
        const errorMessage = document.getElementById("errorMsg");
        const loader = document.getElementById("loader");

        errorMessage.textContent = "";
        errorMessage.style.display = "none";
        result.style.display = "none";

        if (loader) loader.style.display = "none";

        if (!pokemonName) {
            errorMessage.textContent = "Please enter a Pokémon name.";
            errorMessage.style.display = "block";
            return;
        }

        if (loader) loader.style.display = "block";

        try {
            const pokemon = await fetchJSON(
                `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`
            );

            const species = await fetchJSON(pokemon.species.url);

            if (!species.evolution_chain?.url) {
                throw new Error(
                    "Evolution data is unavailable for this Pokémon."
                );
            }

            const chain = await fetchJSON(species.evolution_chain.url);

            const nextSpecies = findNextEvolutions(
                chain.chain,
                species.name
            );

            if (nextSpecies === null) {
                throw new Error(
                    "This Pokémon could not be located in its evolution chain."
                );
            }

            // Resolve each species to its default Pokémon variety.
            const evolutions = await Promise.all(
                nextSpecies.map(async next => {
                    const nextSpeciesData = await fetchJSON(next.url);

                    const defaultVariety = nextSpeciesData.varieties.find(
                        variety => variety.is_default
                    );

                    if (!defaultVariety) {
                        throw new Error(
                            "Evolution comparison data is unavailable."
                        );
                    }

                    return fetchJSON(defaultVariety.pokemon.url);
                })
            );

            if (thisRequest !== requestNumber) return;

            const primaryType = pokemon.types[0].type.name;
            const color = typeColors[primaryType] || "#333333";

            result.style.setProperty("--type-color", color);
            result.style.setProperty("--type-shadow", `${color}80`);

            setPokemonImage(
                document.getElementById("pokemonImage"),
                pokemon
            );

            document.getElementById("pokemonName").textContent =
                displayName(pokemon.name);

            document.getElementById("pokemonType").textContent =
                pokemon.types
                    .map(type => displayName(type.type.name))
                    .join(" / ");

            const details = document.getElementById("evolutionDetails");
            details.replaceChildren();

            const currentStats = getStats(pokemon);
            const currentTotal = getTotal(currentStats);

            const comparisons = evolutions.map(evolution => {
                const stats = getStats(evolution);
                const total = getTotal(stats);

                return {
                    pokemon: evolution,
                    stats,
                    total,
                    change: total - currentTotal,
                    percentage: (
                        (total - currentTotal) / currentTotal * 100
                    ).toFixed(1),
                    lowerStats: Object.keys(statLabels).filter(
                        key => stats[key] < currentStats[key]
                    )
                };
            });

            addElement(
                details,
                "p",
                comparisons.length
                    ? "Compare the next evolutions:"
                    : "No further evolution is listed."
            );

            for (const comparison of comparisons) {
                const section = addElement(details, "section");
                section.className = "evolution-comparison";

                const image = addElement(section, "img");
                setPokemonImage(image, comparison.pokemon);

                addElement(
                    section,
                    "h3",
                    displayName(comparison.pokemon.name)
                );

                const scroll = addElement(section, "div");
                scroll.className = "comparison-scroll";

                const table = addElement(scroll, "table");
                const header = addElement(
                    addElement(table, "thead"),
                    "tr"
                );

                ["Stat", "Current", "Evolved", "Change"].forEach(label => {
                    const cell = addElement(header, "th", label);
                    cell.scope = "col";
                });

                const body = addElement(table, "tbody");

                for (const key of [...Object.keys(statLabels), "total"]) {
                    const before =
                        key === "total" ? currentTotal : currentStats[key];

                    const after =
                        key === "total"
                            ? comparison.total
                            : comparison.stats[key];

                    const difference = after - before;
                    const row = addElement(body, "tr");

                    const label = addElement(
                        row,
                        "th",
                        key === "total" ? "Total" : statLabels[key]
                    );

                    label.scope = "row";

                    addElement(row, "td", String(before));
                    addElement(row, "td", String(after));
                    addElement(
                        row,
                        "td",
                        `${difference > 0 ? "+" : ""}${difference}`
                    );
                }

                addElement(
                    section,
                    "p",
                    `Total base stats: ${
                        comparison.change > 0 ? "+" : ""
                    }${comparison.percentage}%.`
                );

                if (comparison.lowerStats.length) {
                    addElement(
                        section,
                        "p",
                        "Stats that decrease: " +
                        comparison.lowerStats
                            .map(key => statLabels[key])
                            .join(", ") +
                        "."
                    );
                }
            }

            const method = addElement(
                details,
                "p",
                "Source: PokéAPI. This recommendation compares the sum " +
                "of six base stats, giving each equal weight. " +
                "It does not assess moves, abilities, battle strategy " +
                "or evolution requirements. Evolution targets use their " +
                "default forms; special forms may differ."
            );

            method.className = "comparison-method";

            const title = document.getElementById("recommendationTitle");
            const text = document.getElementById("recommendationText");
            const box = document.getElementById("recommendation");

            box.style.color = "#ffffff";

            if (!comparisons.length) {
                title.textContent = "NO FURTHER EVOLUTION";
                text.textContent =
                    "There is no next evolution to compare.";
                box.style.backgroundColor = "#222224";
            } else {
                const bestTotal = Math.max(
                    ...comparisons.map(item => item.total)
                );

                const bestOptions = comparisons.filter(
                    item => item.total === bestTotal
                );

                const names = bestOptions
                    .map(item => displayName(item.pokemon.name))
                    .join(", ");

                if (bestTotal > currentTotal) {
                    title.textContent = "EVOLUTION FAVORED BY BASE STATS";

                    text.textContent =
                        `${names}: ${currentTotal} → ${bestTotal} ` +
                        `total base stats (+${bestOptions[0].percentage}%).` +
                        (
                            bestOptions.length > 1
                                ? " These options tie on total; compare their individual stats."
                                : ""
                        ) +
                        (
                            bestOptions.some(item => item.lowerStats.length)
                                ? " Some stats decrease: check the comparison."
                                : ""
                        );

                    box.style.backgroundColor = "#24693B";
                } else {
                    title.textContent = "COMPARE THE TRADE-OFFS";

                    text.textContent =
                        "Evolution does not increase the total base stats. " +
                        "Compare individual stats before deciding.";

                    box.style.backgroundColor = "#79520A";
                }
            }

            result.style.display = "block";

        } catch (error) {
            if (thisRequest !== requestNumber) return;

            errorMessage.textContent =
                error instanceof TypeError
                    ? "Could not connect. Check your connection and try again."
                    : error.message;

            errorMessage.style.display = "block";

        } finally {
            if (thisRequest === requestNumber && loader) {
                loader.style.display = "none";
            }
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePokemonApp);
} else {
    initializePokemonApp();
}
