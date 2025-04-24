// server-side file (socket.js)

// Assuming connectDB exports a promise-based pool connection (like mysql2/promise)
const db = require('../../src/config/connectDB'); // Adjust path if needed
const { updateGameState, getCardResult } = require('./gameState'); // Ensure this path is correct

function socketHandler(io) {
    let lastPhase = "betting"; // Tracks game phase for card reveal trigger

    console.log("Socket handler initialized. Waiting for connections...");

    // This runs ONCE FOR EACH NEW *AUTHENTICATED* CLIENT CONNECTION
    // (Thanks to the io.use() middleware in index.js)
    io.on('connection', (socket) => {

        // At this point, socket.user should be populated by the io.use() middleware
        if (!socket.user || !socket.user.userId) {
            console.error(`Connection Error (${socket.id}): Socket connected but missing user authentication data. Disconnecting.`);
            // Send an error message before disconnecting if possible
            socket.emit('auth_error', { message: "Authentication data missing. Please log in again." });
            return socket.disconnect(true); // Force disconnect
        }

        console.log(`Client connected: ${socket.id}, User ID: ${socket.user.userId}`);

        // Send initial game state to the newly connected client
        try {
            const initialState = updateGameState();
            socket.emit('game_update', initialState);
            console.log(`Sent initial game_update to ${socket.id}`);
        } catch (error) {
            console.error(`Error sending initial state to ${socket.id}:`, error);
        }

        // --- REGISTER LISTENERS FOR THIS SPECIFIC CLIENT (socket) ---

        /* --- Obsolete Listener (Commented Out) ---
           This listener seems redundant if the main betting flow uses the
           "Place Final Bet" button and the "place_final_bets" event.
           If you have another mechanism using "place_bet", uncomment and adapt it
           to use socket.user.userId and add necessary validation.

        socket.on("place_bet", async (data) => {
          console.log(`Received obsolete "place_bet" from ${socket.id}. Ignoring or handling differently.`);
          // If needed: Adapt this logic similar to place_final_bets (use socket.user.userId, validation, transaction)
          // const authenticatedUserId = socket.user.userId;
          // const { card, amount, matchId, roundId } = data;
          // ... validation ...
          // ... transaction ...
        });
        */

        // --- Listener for Final Bets (Triggered by "Place Final Bet" button) ---
        socket.on("place_final_bets", async (data) => {
            // ---- Get User ID from AUTHENTICATED socket ----
            if (!socket.user || !socket.user.userId) {
                console.error(`Bet rejected (${socket.id}): Missing user authentication on socket.`);
                return socket.emit("bet_rejected", { error: "Authentication error. Please reconnect." });
            }
            const authenticatedUserId = socket.user.userId;
            const userPhone = socket.user.phone || null; // Get phone if available in JWT payload
            // -----------------------------------------------

            console.log(`Received "place_final_bets" from User ID: ${authenticatedUserId} (${socket.id})`);

            const { bets, matchId, roundId } = data; // Don't trust userId from data

            // --- Server-Side Validation ---
            if (!bets || typeof bets !== 'object' || !matchId || !roundId) {
                 console.warn(`Bet rejected for User ${authenticatedUserId}: Invalid data format.`);
                return socket.emit("bet_rejected", { error: "Invalid bet data format." });
            }

            // 1. Check if betting phase is active on SERVER
            const currentServerState = updateGameState(); // Get *current* server state
            if (currentServerState.gstatus !== "1") {
                console.warn(`Bet rejected for User ${authenticatedUserId}: Server betting phase closed (gStatus: ${currentServerState.gstatus}).`);
                return socket.emit("bet_rejected", { error: "Betting is closed for this round." });
            }

            const betEntries = Object.entries(bets);
            const totalBetAmount = betEntries.reduce((sum, [, amount]) => sum + (Number(amount) || 0), 0);

            if (totalBetAmount <= 0) {
                console.warn(`Bet rejected for User ${authenticatedUserId}: Total bet amount is zero or negative.`);
                return socket.emit("bet_rejected", { error: "Bet amount must be positive." });
            }
            // --- End Server-Side Validation ---


            // --- Database Operations with Transaction ---
            let connection; // Declare connection outside try block for finally
            try {
                connection = await db.getConnection(); // Get connection from pool
                await connection.beginTransaction();
                console.log(`User ${authenticatedUserId}: Starting transaction for bet.`);

                // 2. Check Balance (Locking the row)
                const [userRows] = await connection.execute(
                    'SELECT money FROM users WHERE id = ? FOR UPDATE', // Lock row to prevent race conditions
                    [authenticatedUserId]
                );

                if (!userRows || userRows.length === 0 || userRows[0].money < totalBetAmount) {
                    await connection.rollback(); // Rollback transaction
                    console.warn(`Bet rejected for User ${authenticatedUserId}: Insufficient funds (Need: ${totalBetAmount}, Have: ${userRows[0]?.money ?? 'N/A'}).`);
                    return socket.emit("bet_rejected", { error: "Insufficient balance." });
                }
                 const currentBalance = userRows[0].money;
                 console.log(`User ${authenticatedUserId}: Balance check OK (Balance: ${currentBalance}, Bet: ${totalBetAmount}).`);

                // 3. Deduct Balance
                await connection.execute(
                    'UPDATE users SET money = money - ? WHERE id = ?',
                    [totalBetAmount, authenticatedUserId]
                );
                 console.log(`User ${authenticatedUserId}: Balance deducted.`);

                // 4. Insert Bet Records
                let betsInsertedCount = 0;
                for (const [card, amount] of betEntries) {
                    const betAmount = Number(amount) || 0;
                    if (betAmount > 0 && ['Dragon', 'Tie', 'Tiger'].includes(card)) { // Basic validation
                        await connection.execute(
                            `INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId, phone)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [authenticatedUserId, card, betAmount, matchId, roundId, userPhone] // Use authenticated ID and phone
                        );
                        betsInsertedCount++;
                    }
                }
                 console.log(`User ${authenticatedUserId}: Inserted ${betsInsertedCount} bet records.`);

                // 5. Commit Transaction
                await connection.commit();
                console.log(`✅ Transaction committed for User ${authenticatedUserId}. Final bets saved.`);
                socket.emit("bet_accepted", { message: "Bets placed successfully" }); // Notify client

            } catch (err) {
                console.error(`❌ Error during bet transaction for User ${authenticatedUserId}:`, err.message);
                if (connection) {
                    await connection.rollback(); // Rollback on error
                    console.error(`User ${authenticatedUserId}: Transaction rolled back.`);
                }
                socket.emit("bet_rejected", { error: "Database error during betting." });
            } finally {
                if (connection) {
                    connection.release(); // Always release connection back to pool
                    console.log(`User ${authenticatedUserId}: DB connection released.`);
                }
            }
            // --- End Database Operations ---
        });


        // Listener for when this client disconnects
        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id}, User ID: ${socket.user?.userId || 'N/A'}, Reason: ${reason}`);
        });

    }); // --- END of io.on('connection', ...) ---


    // --- Global Server Logic (Game Timer & Updates) ---
    // This runs independently of client connections
    console.log("Starting global game update interval...");
    // setInterval(() => {
    //     try {
    //         const updatedData = updateGameState();
    //         // Emit game updates to ALL connected clients
    //         io.emit('game_update', updatedData);

    //         // Detect transition to card_reveal phase to emit result once
    //         if (updatedData.phase === "card_reveal" && lastPhase !== "card_reveal") {
    //             const result = getCardResult(); // Get simulated card results
    //             console.log(`Server emitting card_reveal (Round ${updatedData.roundId}):`, result);
    //             io.emit("card_reveal", result); // Emit result to ALL clients

    //             // TODO: Add logic here to process the results after reveal
    //             // This involves fetching bets for the round, calculating winnings, and updating balances.
    //             // processBetResults(updatedData.roundId, result.winner); // Call your result processing function
    //         }
    //         lastPhase = updatedData.phase; // Update phase tracking

    //     } catch (error) {
    //         console.error("Error in server game loop interval:", error);
    //     }
    // }, 1000);
// **** MODIFIED SETINTERVAL ****
setInterval(async () => { // Added async here
    let updatedData;
    try {
        updatedData = updateGameState();
        const currentPhase = updatedData.phase;
        const currentRoundIdStr = updatedData.roundId.toString();
        const currentMatchId = updatedData.match_id;

        io.emit('game_update', updatedData);

        // --- Result Determination and Emission ---
        if (currentPhase === "card_reveal" && (lastPhase === "betting" || lastPhase === "betting_closing")) {

            roundIdAtBettingEnd = currentRoundIdStr;
            console.log(`[Phase Transition] Betting ended for Round: ${roundIdAtBettingEnd}. Entering 5s reveal phase.`);

            let finalWinner = null;

            // Check 1: Admin Override
            if (adminDeclaredResults.has(roundIdAtBettingEnd)) {
                finalWinner = adminDeclaredResults.get(roundIdAtBettingEnd);
                console.log(`[Result] Using ADMIN DECLARED winner for Round ${roundIdAtBettingEnd}: ${finalWinner}`);
                adminDeclaredResults.delete(roundIdAtBettingEnd);
            } else {
                // Check 2: DETERMINE WINNER BY BETS
                finalWinner = await determineWinnerByBets(roundIdAtBettingEnd);
                // NOTE: If determineWinnerByBets falls back to random, it uses the OLD getCardResult.
                // Ideally, determineWinnerByBets should return the winner string, and then we generate cards.
            }

            // Proceed if a winner was determined
            if (!finalWinner) {
                console.error(`❌ Cannot determine final winner for round ${roundIdAtBettingEnd}. Skipping result processing.`);
            } else {
                // **** NEW: Generate cards based on the final winner ****
                const { dragonCard, tigerCard } = generateCardsForResult(finalWinner);

                // Emit the final result WITH CARD DETAILS to clients NOW
                const finalResultData = {
                    roundId: roundIdAtBettingEnd,
                    winner: finalWinner,
                    dragonCard: dragonCard, // <<< ADDED
                    tigerCard: tigerCard    // <<< ADDED
                };
                io.emit('final_round_result', finalResultData);
                console.log(`📢 Emitted 'final_round_result' for Round ${roundIdAtBettingEnd}. Winner: ${finalWinner}, D: ${dragonCard.name}${dragonCard.suit}, T: ${tigerCard.name}${tigerCard.suit}`);

                // Trigger background processing for DB updates (doesn't need card details)
                 processRoundResultsInBackground(roundIdAtBettingEnd, currentMatchId, finalWinner)
                     .catch(err => console.error(`Error during background processing trigger for ${roundIdAtBettingEnd}:`, err));
            }
        }

        lastPhase = currentPhase;

    } catch (error) {
        console.error("❌ Error in server interval:", error);
        lastPhase = updatedData ? updatedData.phase : "unknown";
        roundIdAtBettingEnd = null; // Reset just in case
    }
}, 1000);
// **** END OF MODIFIED SETINTERVAL ****
} // End of socketHandler function


// --- TODO: Implement Bet Result Processing Function ---
async function processBetResults(roundId, winner) {
    console.log(`Processing results for round ${roundId}, Winner: ${winner}`);
    let connection;
    try {
        // Fetch all bets for this round
        const [bets] = await db.execute('SELECT id, userId, card, amount FROM dragon_tiger WHERE roundId = ?', [roundId]);

        if (!bets || bets.length === 0) {
            console.log(`No bets to process for round ${roundId}.`);
            return;
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Define payout rates (should ideally come from config or gameState)
        const payoutRates = { Dragon: 2.00, Tiger: 2.00, Tie: 8.00 }; // Example rates (Tie often higher)

        for (const bet of bets) {
            let payout = 0;
            let status = 'lost'; // Default status

            if (bet.card === winner) {
                 const rate = payoutRates[winner];
                 payout = bet.amount * rate; // Total amount returned (stake + profit)
                 status = 'won';
                 console.log(` -> User ${bet.userId} WON ${payout} on ${bet.card} (Bet ID: ${bet.id})`);
                 // Add winnings back to user balance
                 await connection.execute('UPDATE users SET money = money + ? WHERE id = ?', [payout, bet.userId]);
            } else {
                 console.log(` -> User ${bet.userId} lost ${bet.amount} on ${bet.card} (Bet ID: ${bet.id})`);
            }
             // Optional: Update the bet record itself with the result
             // await connection.execute('UPDATE dragon_tiger SET status = ?, payout = ? WHERE id = ?', [status, payout, bet.id]);
        }

        await connection.commit();
        console.log(`✅ Balances updated and results processed for round ${roundId}.`);

    } catch (error) {
        console.error(`Error processing results for round ${roundId}:`, error);
        if (connection) await connection.rollback();
    } finally {
        if (connection) connection.release();
    }
}


module.exports = socketHandler;