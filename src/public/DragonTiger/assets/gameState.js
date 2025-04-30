let currentSecond = 20;
let inRevealPhase = false;
let currentPhaseName = "betting";
let currentRoundId = generate10DigitId(); // Initial round ID

function generate10DigitId() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Initial game data structure
let gameData = {
    gstatus: "1", // Start in betting state
    timer: 20,
    match_id: "D/TId", // Or generate dynamically if needed
    roundId: currentRoundId,
    title: "20-20 Dragon Tiger 2",
    market: [
        { MarketName: "Dragon", Runners: [{ rate: "2.00", runnerName: "Dragon" }] },
        { MarketName: "Tie", Runners: [{ rate: "8.00", runnerName: "Tie" }] },
        { MarketName: "Tiger", Runners: [{ rate: "2.00", runnerName: "Tiger" }] }
    ]
};

const suits = ["H", "S", "C", "D"];
const values = [
    { name: "2", value: 2 }, { name: "3", value: 3 }, { name: "4", value: 4 },
    { name: "5", value: 5 }, { name: "6", value: 6 }, { name: "7", value: 7 },
    { name: "8", value: 8 }, { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "J", value: 11 }, { name: "Q", value: 12 }, { name: "K", value: 13 },
    { name: "A", value: 14 },
];

function getRandomElement(arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}


function resetGameState() {
    console.log(`[GameState] Resetting state. Previous Round ID: ${currentRoundId}`);
    currentSecond = 20; // Reset betting timer
    inRevealPhase = false;
    currentPhaseName = "betting";
    currentRoundId = generate10DigitId(); // Generate NEW round ID for the new game

    // Update the gameData object with the new state
    gameData = {
        ...gameData, // Keep existing static data like title, market, match_id
        gstatus: "1", // Set status back to betting
        timer: 20,
        roundId: currentRoundId // Assign the new round ID
    };
    console.log(`[GameState] New Round Started. Round ID: ${currentRoundId}`);
}

function updateGameState() {
    // Check if we need to reset first (after processing results)
    if (currentPhaseName === "processing_results") {
        resetGameState();
        // Return the newly reset gameData state along with a phase indicator
        return { ...gameData, phase: "new_round" }; // Use the updated gameData
    }

    // Handle reveal phase timing
    if (inRevealPhase) {
        currentPhaseName = "card_reveal";
        gameData.gstatus = "0"; // Betting closed during reveal
        gameData.timer = currentSecond; // Show reveal countdown
        currentSecond--;

        if (currentSecond < 0) {
            // Reveal phase ended, move to processing results
            currentPhaseName = "processing_results";
            // No need to update gameData timer/gstatus here, resetGameState will handle it next tick
        }
    }
    // Handle betting phase timing
    else {
        if (currentSecond <= 5) {
            // Last 5 seconds of betting
            gameData.gstatus = "0"; // Close betting
            currentPhaseName = "betting_closing";
        } else {
            // Normal betting time
            gameData.gstatus = "1"; // Betting open
            currentPhaseName = "betting";
        }
        gameData.timer = currentSecond; // Update timer display
        currentSecond--;

        if (currentSecond < 0) {
            // Betting timer finished, transition to reveal phase
            inRevealPhase = true;
            currentSecond = 5; // Set reveal phase duration (e.g., 5 seconds)
            currentPhaseName = "card_reveal";
            gameData.gstatus = "0"; // Betting definitely closed
            gameData.timer = currentSecond; // Show initial reveal timer
        }
    }

    // Always return the current gameData state and the calculated phase name
    // Ensure roundId in gameData is always the current one being processed
    gameData.roundId = currentRoundId;
    return { ...gameData, phase: currentPhaseName };
}

// --- Card Generation Logic (Keep as is) ---
function generateCardsForResult(winner) {
    let dragonCard, tigerCard;
    let dragonValueObj, tigerValueObj;
    let dragonSuit, tigerSuit;

    if (!['Dragon', 'Tiger', 'Tie'].includes(winner)) {
        console.error("[Card Generation] Invalid winner specified:", winner);
        return { dragonCard: null, tigerCard: null };
    }

    while (true) {
        dragonValueObj = getRandomElement(values);
        tigerValueObj = getRandomElement(values);
        dragonSuit = getRandomElement(suits);
        tigerSuit = getRandomElement(suits);

        if (!dragonValueObj || !tigerValueObj || !dragonSuit || !tigerSuit) {
            console.error("[Card Generation] Failed to get random elements. Retrying...");
            continue; // Retry generation
        }

        // Ensure dragon and tiger cards are not exactly the same if deck size allows
        if (dragonValueObj.value === tigerValueObj.value && dragonSuit === tigerSuit && suits.length > 1) {
             let possibleSuits = suits.filter(s => s !== dragonSuit);
             if (possibleSuits.length > 0) {
                tigerSuit = getRandomElement(possibleSuits);
             } // If only one suit defined, allow identical cards
        }

        const dragonValue = dragonValueObj.value;
        const tigerValue = tigerValueObj.value;

        let conditionMet = false;
        if (winner === 'Dragon' && dragonValue > tigerValue) {
            conditionMet = true;
        } else if (winner === 'Tiger' && tigerValue > dragonValue) {
            conditionMet = true;
        } else if (winner === 'Tie' && dragonValue === tigerValue) {
             // Ensure suits are different for a Tie if possible (already handled above potentially)
             if (dragonSuit === tigerSuit && suits.length > 1) {
                // This case might be redundant if handled above, but double-check logic
                console.warn("[Card Generation] Forcing different suits for Tie");
                 let possibleSuits = suits.filter(s => s !== dragonSuit);
                 if (possibleSuits.length > 0) {
                    tigerSuit = getRandomElement(possibleSuits);
                 }
             }
            conditionMet = true;
        }

        if (conditionMet) {
            break; // Found suitable cards
        }
    }

    dragonCard = { suit: dragonSuit, value: dragonValueObj.value, name: dragonValueObj.name };
    tigerCard = { suit: tigerSuit, value: tigerValueObj.value, name: tigerValueObj.name };

    console.log(`[Card Generation] Required Winner: ${winner}. Generated D: ${dragonCard.name}${dragonCard.suit} (v${dragonCard.value}), T: ${tigerCard.name}${tigerCard.suit} (v${tigerCard.value})`);
    return { dragonCard, tigerCard };
}

// Simplified random result (Not used if generateCardsForResult is used based on winner)
function getCardResult() {
  const dragonVal = getRandomElement(values);
  const tigerVal = getRandomElement(values);
  let winner = "Tie";
  if (dragonVal.value > tigerVal.value) winner = "Dragon";
  else if (tigerVal.value > dragonVal.value) winner = "Tiger";
  // Note: This doesn't return card objects, just values and winner
  return { dragon: dragonVal.value, tiger: tigerVal.value, winner };
}


// *** ADD THIS FUNCTION ***
/**
 * Returns the current essential round details needed by the admin API.
 */
function getCurrentRoundDetails() {
    return {
        roundId: currentRoundId,        // The currently active round ID
        matchId: gameData.match_id,   // The match ID
        gStatus: gameData.gstatus,    // Current game status ('1' for betting, '0' otherwise)
        phase: currentPhaseName       // Current detailed phase name
    };
}
// *** END ADDED FUNCTION ***


module.exports = {
    updateGameState,
    generateCardsForResult,
    getCardResult,
    getCurrentRoundDetails // <<< EXPORT the new function
};