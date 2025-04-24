// gameState.js

// --- State Variables ---
let currentSecond = 30; // Timer for the current phase
let inRevealPhase = false; // Flag to indicate if we are in the 5-second reveal phase
let currentRoundId = generate10DigitId(); // Initialize the first round ID

// --- Helper Function ---
function generate10DigitId() {
    // Generates a 10-digit random number as a string
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// --- Initial Game Data Structure ---
const gameData = {
    gstatus: "1", // "1" = betting, "0" = betting closed / reveal
    timer: 30,
    match_id: "D/TId", // You might want to make this dynamic or configurable
    roundId: currentRoundId, // Assign the initial round ID
    title: "20-20 Dragon Tiger 2",
    // Market data (consider if rates should be dynamic later)
    market: [
        { MarketName: "Dragon", Runners: [{ rate: "2.00", runnerName: "Dragon" }] },
        // Note: Tie rate is often higher, e.g., 8.00 or 10.00
        { MarketName: "Tie", Runners: [{ rate: "8.00", runnerName: "Tie" }] },
        { MarketName: "Tiger", Runners: [{ rate: "2.00", runnerName: "Tiger" }] }
    ]
};

// --- Card Definitions (Moved from script.js) ---
const suits = ["H", "S", "C", "D"]; // Suit initials for image names (Hearts, Spades, Clubs, Diamonds)
const values = [
    { name: "2", value: 2 }, { name: "3", value: 3 }, { name: "4", value: 4 },
    { name: "5", value: 5 }, { name: "6", value: 6 }, { name: "7", value: 7 },
    { name: "8", value: 8 }, { name: "9", value: 9 },
    // Use '10' if your images are like 10H.png, 10S.png etc.
    // Use 'T' if your images are like TH.png, TS.png etc. - Adjust if needed
    { name: "10", value: 10 },
    { name: "J", value: 11 }, { name: "Q", value: 12 }, { name: "K", value: 13 },
    { name: "A", value: 14 }, // Ace is typically high (14) in Dragon Tiger
];

// --- Helper Function for Random Selection ---
function getRandomElement(arr) {
    // Returns a random element from an array
    if (!arr || arr.length === 0) return undefined; // Safety check
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Core Game Logic Functions ---

function resetGameState() {
    // Resets the state for a new round
    console.log(`[Game State] Resetting state. Previous Round ID: ${currentRoundId}`);
    currentSecond = 30; // Reset betting timer
    inRevealPhase = false; // Exit reveal phase
    gameData.gstatus = "1"; // Open betting for the new round
    gameData.timer = 30; // Set timer display to 30
    currentRoundId = generate10DigitId(); // Generate a *new* ID for the next round
    gameData.roundId = currentRoundId; // Update the gameData object with the new round ID
    console.log(`[Game State] New Round Started. Round ID: ${currentRoundId}`);
}

function updateGameState() {
    // Updates the game timer and status (gstatus) each second
    let currentPhase = "unknown"; // Track the phase for socket.js logic

    if (inRevealPhase) {
        // --- Reveal Phase (5 seconds) ---
        currentPhase = "card_reveal";
        gameData.gstatus = "0"; // Betting remains closed
        gameData.timer = currentSecond; // Show the reveal countdown (5, 4, 3, 2, 1)
        currentSecond--;

        if (currentSecond < 0) { // Reveal phase ends
            resetGameState(); // Prepare for the next round
            // After reset, the state is immediately ready for betting
            currentPhase = "new_round"; // Signal that a reset happened (socket.js might use this)
            gameData.gstatus = "1"; // Ensure betting is open right after reset
            gameData.timer = currentSecond; // Timer is now 30 after reset
        }
    } else {
        // --- Betting Phase (includes last 5 seconds where betting is closed) ---
        if (currentSecond <= 5) {
             // Last 5 seconds: Visually show timer, but betting is closed
             gameData.gstatus = "0";
             currentPhase = "betting_closing";
        } else {
             // Normal betting time
             gameData.gstatus = "1";
             currentPhase = "betting";
        }
        gameData.timer = currentSecond; // Show the betting countdown (30 down to 1)
        currentSecond--;

        if (currentSecond < 0) { // Betting time ends
            // Transition to the reveal phase
            inRevealPhase = true;
            currentSecond = 5; // Set duration for the reveal phase (counts 5 down to 1)
            currentPhase = "card_reveal"; // Now entering reveal phase
            gameData.gstatus = "0"; // Ensure betting is closed
            gameData.timer = currentSecond; // Show 5 initially for reveal phase
        }
    }

    // Return a copy of the gameData along with the current phase
    // The 'phase' helps socket.js decide when to trigger result calculation/emission
    return { ...gameData, phase: currentPhase };
}

// --- Card Generation Logic (Moved here) ---
// Function to generate specific cards based on the required winner outcome
function generateCardsForResult(winner) {
    let dragonCard, tigerCard;
    let dragonValueObj, tigerValueObj;
    let dragonSuit, tigerSuit;

    // Validate the winner input
    if (!['Dragon', 'Tiger', 'Tie'].includes(winner)) {
        console.error("[Card Generation] Invalid winner specified:", winner);
        // Fallback: maybe return null or default cards? Let's return null for clarity.
        return { dragonCard: null, tigerCard: null };
    }

    // Loop until cards matching the winner condition are found
    while (true) {
        // Pick random values and suits using the helper
        dragonValueObj = getRandomElement(values);
        tigerValueObj = getRandomElement(values);
        dragonSuit = getRandomElement(suits);
        tigerSuit = getRandomElement(suits);

        // Basic check if random elements were successfully picked
        if (!dragonValueObj || !tigerValueObj || !dragonSuit || !tigerSuit) {
            console.error("[Card Generation] Failed to get random elements for cards. Retrying...");
            continue; // Skip this iteration and try again
        }

        const dragonValue = dragonValueObj.value;
        const tigerValue = tigerValueObj.value;

        // Check if the generated card values match the required outcome
        let conditionMet = false;
        if (winner === 'Dragon' && dragonValue > tigerValue) {
            conditionMet = true;
        } else if (winner === 'Tiger' && tigerValue > dragonValue) {
            conditionMet = true;
        } else if (winner === 'Tie' && dragonValue === tigerValue) {
            // Optional: Ensure suits are different for a tie, if possible
            if (dragonSuit === tigerSuit && suits.length > 1) {
                let possibleSuits = suits.filter(s => s !== dragonSuit);
                tigerSuit = getRandomElement(possibleSuits);
                // Extremely unlikely fallback if filtering failed unexpectedly
                if (!tigerSuit) tigerSuit = getRandomElement(suits);
            }
            // Prevent identical cards (e.g., two Aces of Spades) - this is implicitly handled
            // by potentially different suits, but we ensure they *can* be different.
            conditionMet = true;
        }

        // If the condition is met, break the loop
        if (conditionMet) {
            break;
        }
        // Otherwise, the loop continues to generate new cards
    }

    // Construct the card objects to return
    dragonCard = { suit: dragonSuit, value: dragonValueObj.value, name: dragonValueObj.name };
    tigerCard = { suit: tigerSuit, value: tigerValueObj.value, name: tigerValueObj.name };

    console.log(`[Card Generation] Required Winner: ${winner}. Generated D: ${dragonCard.name}${dragonCard.suit} (v${dragonCard.value}), T: ${tigerCard.name}${tigerCard.suit} (v${tigerCard.value})`);
    return { dragonCard, tigerCard };
}


// --- Exports ---
module.exports = {
    updateGameState,        // Function to update timer/status each second
    generateCardsForResult  // Function to create cards based on a winner
    // getCardResult // Removed - we now use generateCardsForResult after determining the winner
};


// let currentSecond = 30;
// let inRevealPhase = false;

// function generate10DigitId() {
//   return Math.floor(1000000000 + Math.random() * 9000000000).toString();
// }
// const randomId = generate10DigitId();

// const gameData = {
//   gstatus: "1", // "1" = betting, "0" = paused (card reveal)
//   timer: 30,
//   match_id: "D/TId",
//   roundId:randomId,
//   title: "20-20 Dragon Tiger 2",
//   market: [
//     {
//       MarketName: "Dragon",
//       Runners: [{ rate: "2.00", runnerName: "Dragon" }]
//     },
//     {
//       MarketName: "Tie",
//       Runners: [{ rate: "50.00", runnerName: "Tie" }]
//     },
//     {
//       MarketName: "Tiger",
//       Runners: [{ rate: "2.00", runnerName: "Tiger" }]
//     }
//   ]
// };

// function resetGameState() {
//   currentSecond = 30;
//   inRevealPhase = false;
//   gameData.gstatus = "1";
//   gameData.timer = 30;
//   const randomId = generate10DigitId();
// }

// function updateGameState() {
//   if (inRevealPhase) {
//     // During 5 sec pause
//     gameData.gstatus = "0"; // Betting closed
//     gameData.timer = currentSecond;
//     currentSecond--;

//     if (currentSecond < 0) {
//       resetGameState();
//     }

//     return { ...gameData, phase: "card_reveal" };
//   } else {
//     // Betting phase
//     gameData.gstatus = currentSecond > 5 ? "1" : "0";
//     gameData.timer = currentSecond;
//     currentSecond--;

//     if (currentSecond < 0) {
//       // Switch to reveal phase
//       inRevealPhase = true;
//       currentSecond = 5;
//     }

//     return { ...gameData, phase: "betting" };
//   }
// }

// // Simulated card flip (can be replaced with actual logic)
// function getCardResult() {
//   const dragon = Math.floor(Math.random() * 13) + 1;
//   const tiger = Math.floor(Math.random() * 13) + 1;
//   let winner = "Tie";
//   if (dragon > tiger) winner = "Dragon";
//   else if (tiger > dragon) winner = "Tiger";
//   return { dragon, tiger, winner };
// }

// module.exports = { updateGameState, getCardResult };
