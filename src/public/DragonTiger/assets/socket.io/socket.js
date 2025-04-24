const db = require('../../../../config/connectDB');
const { reduceWallet, addWinnings } = require('../../../../controllers/dragonController');
const { updateGameState,generateCardsForResult,getCardResult } = require('../gameState'); 

const adminDeclaredResults = new Map();

async function determineWinnerByBets(roundId) {
  console.log(`[Strategy] Determining winner based on bet totals for Round ID: ${roundId}`);
  try {
      const [bets] = await db.execute(
          `SELECT card, amount FROM dragon_tiger WHERE roundId = ? AND result = 'pending'`,
          [roundId]
      );

      if (!bets || bets.length === 0) {
          console.log(`[Strategy] No bets found for round ${roundId}. Falling back to random winner.`);
          const randomResult = getCardResult();
          return randomResult.winner; 
      }

      const totals = { Dragon: 0, Tie: 0, Tiger: 0 };
      bets.forEach(bet => {
          if (totals.hasOwnProperty(bet.card)) {
              const amount = Number(bet.amount); 
              if (!isNaN(amount)) {
                  totals[bet.card] += amount;
              }
          }
      });
      console.log(`[Strategy] Bet Totals for Round ${roundId}:`, totals);

      let outcomeToLose = null;
      let maxBet = -1;

      if (totals.Dragon >= maxBet) {
           maxBet = totals.Dragon;
           outcomeToLose = 'Dragon';
      }
       if (totals.Tiger >= maxBet) {
          maxBet = totals.Tiger;
          outcomeToLose = 'Tiger';
      }
       if (totals.Tie >= maxBet) {
          maxBet = totals.Tie;
          outcomeToLose = 'Tie';
      }

      if (!outcomeToLose && maxBet <= 0) {
           console.log(`[Strategy] Max bet is ${maxBet}. No clear outcome to lose based on positive bets. Falling back to random winner.`);
            const randomResult = getCardResult();
            return randomResult.winner;
      }

      console.log(`[Strategy] Outcome with highest bet (potential loser): ${outcomeToLose} (Total: ${maxBet})`);

      let finalWinner;

      if (outcomeToLose === 'Dragon') {
          if (totals.Tiger <= totals.Tie) {
              finalWinner = 'Tiger';
          } else {
              finalWinner = 'Tie'; 
          }
      } else if (outcomeToLose === 'Tiger') {
          if (totals.Dragon <= totals.Tie) {
              finalWinner = 'Dragon';
          } else {
              finalWinner = 'Tie'; 
          }
      } else { 
       
          if (totals.Dragon <= totals.Tiger) {
              finalWinner = 'Dragon';
          } else {
              finalWinner = 'Tiger';
          }
      }

      console.log(`[Strategy] Determined Winner for Round ${roundId}: ${finalWinner}`);
      return finalWinner;

  } catch (error) {
      console.error(`[Strategy] Error determining winner by bets for round ${roundId}:`, error);
      console.log(`[Strategy] Falling back to random winner due to error.`);
      const randomResult = getCardResult(); 
      return randomResult.winner;
  }
}


async function processRoundResultsInBackground(roundId, matchId, declaredWinner) {
  console.log(`[DB Update] Starting background processing for Round ID: ${roundId}, Winner: ${declaredWinner}`);

  try {
      const [betsForRound] = await db.execute(
          `SELECT id, userId, card, amount, phone,win_amount FROM dragon_tiger WHERE roundId = ? AND result = 'pending'`,
          [roundId]
      );

      if (betsForRound.length === 0) {
          console.log(`[DB Update] No pending bets found for round ${roundId}.`);
          return;
      }

      console.log(`[DB Update] Found ${betsForRound.length} pending bets for round ${roundId}`);

      const updatePromises = [];
      const winningPromises = [];

      for (const bet of betsForRound) {
          let amountToCredit = 0;
          let finalBetResult = 'loss';

          if (bet.card === declaredWinner) {
              let profitMultiplier = 0;
              if (declaredWinner === "Tie") {
                  profitMultiplier = 3; 
              } else {
                  profitMultiplier = 1; 
              }

              const profit = bet.amount * profitMultiplier;
              amountToCredit = bet.amount + profit;
              finalBetResult = 'win';
              console.log(`   Bet ID ${bet.id} (User ${bet.phone}) WON! Bet: ${bet.card}, Winner: ${declaredWinner}, Amount: ${bet.amount}, Crediting: ${amountToCredit}`);
              winningPromises.push(addWinnings(amountToCredit, bet.phone).catch(err => console.error(`[DB Update] Failed to add winnings for bet ${bet.id} (User: ${bet.phone}):`, err)));
          } else {
               console.log(`   Bet ID ${bet.id} (User ${bet.phone}) LOST. Bet: ${bet.card}, Winner: ${declaredWinner}, Amount: ${bet.amount}`);
               amountToCredit = 0;
          }

          if (finalBetResult === "win") {
            updatePromises.push(
              db.execute(
                'UPDATE dragon_tiger SET result = ?, win_amount = ? WHERE id = ?',
                [finalBetResult, amountToCredit, bet.id]
              ).catch(err => console.error(`[DB Update] Failed to update DB for bet ${bet.id}:`, err))
            );
          } else {
            updatePromises.push(
              db.execute(
                'UPDATE dragon_tiger SET result = ? WHERE id = ?',
                [finalBetResult, bet.id]
              ).catch(err => console.error(`[DB Update] Failed to update DB for bet ${bet.id}:`, err))
            );
          }
          
        
      }
      

      await Promise.all([...updatePromises, ...winningPromises]);
      console.log(`[DB Update] Finished updates & winnings processing for Round ID: ${roundId}`);

  } catch (error) {
      console.error(`[DB Update] Error processing results for round ${roundId}:`, error);
      
  }
}



function socketHandler(io) {
  let lastPhase = "new_round";
  let roundIdAtBettingEnd = null;

  console.log("Socket handler initialized. Waiting for connections...");

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    try {
        const initialState = updateGameState();
        socket.emit('game_update', initialState);
        console.log(`Sent initial game_update to ${socket.id}`);
    } catch (error) {
        console.error("Error sending initial state:", error);
    }

    socket.on('admin_declare_result', async (data) => {
        const { matchId, roundId, winner } = data;
        if (!matchId || !roundId || !['Dragon', 'Tiger', 'Tie'].includes(winner)) {
            console.error("[Admin Action] Invalid data received:", data);
            socket.emit('admin_action_status', { success: false, message: "Invalid matchId, roundId, or winner ('Dragon', 'Tiger', 'Tie')." });
            return;
        }
        adminDeclaredResults.set(roundId.toString(), winner);
        console.log(`[Admin Action] Stored declared winner for Round ${roundId}: ${winner}`);
        socket.emit('admin_action_status', { success: true, message: `Winner for round ${roundId} set to ${winner}. Result will be applied.` });
    });

    socket.on("place_final_bets", async (data) => {
      const { userId = null, bets = null, matchId = null, roundId = null, userPhoneID = null } = data;
      console.log("📞 User placing bet:", userPhoneID, "Round:", roundId);
      if (!userId || !bets || typeof bets !== 'object' || !matchId || !roundId) {
        console.error("❌ Missing or invalid data in 'place_final_bets':", data);
        socket.emit("bet_rejected", { reason: "Incomplete or invalid bet data.", roundId: roundId });
        return;
      }
      try {
        let totalBetAmount = 0;
        for (const [card, amount] of Object.entries(bets)) {
          if (typeof amount === 'number' && amount > 0) { totalBetAmount += amount; }
        }
        if (totalBetAmount <= 0) {
            console.warn("⚠️ Skipping final bets submission as total amount is zero or less.");
            socket.emit("bet_rejected", { reason: "No valid bet amount submitted.", roundId: roundId }); return;
        }
        console.log(`💰 Total bet amount to deduct for ${userPhoneID}: ${totalBetAmount}`);
        const walletResult = await reduceWallet(totalBetAmount, userPhoneID, totalBetAmount);
        if (!walletResult.status) {
          console.warn(`❌ Insufficient balance for user: ${userPhoneID}. Needed: ${totalBetAmount}, Has: ${walletResult.wallet}`);
          socket.emit("bet_rejected", { reason: "Insufficient balance for final bets.", currentBalance: walletResult.wallet, roundId: roundId }); return;
        }
        const insertPromises = [];
        for (const [card, amount] of Object.entries(bets)) {
          if (typeof amount === 'number' && amount > 0 && ['Dragon', 'Tiger', 'Tie'].includes(card)) {
            insertPromises.push( db.execute( `INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId, phone, result,win_amount) VALUES (?, ?, ?, ?, ?, ?, 'pending',?)`, [userId, card, amount, matchId, roundId, userPhoneID,-(amount)] ) );
          } else { console.warn("⚠️ Skipping invalid bet entry:", { card, amount }); }
        }
        await Promise.all(insertPromises);
        console.log(`✅ Bets saved for User: ${userId}, Phone: ${userPhoneID}, Round: ${roundId}`);
        socket.emit("bet_accepted", { message: "Final bets placed successfully.", wallet: walletResult.wallet, roundId: roundId });
      } catch (err) {
        console.error(`❌ Error in 'place_final_bets' for User: ${userPhoneID}, Round: ${roundId}:`, err);
        socket.emit("bet_rejected", { reason: "Server error while saving bets.", roundId: roundId });
      }
    });



    socket.on('disconnect', () => { console.log('Client disconnected:', socket.id); });
  });

setInterval(async () => { 
  let updatedData;
  try {
      updatedData = updateGameState();
      const currentPhase = updatedData.phase;
      const currentRoundIdStr = updatedData.roundId.toString();
      const currentMatchId = updatedData.match_id;

      io.emit('game_update', updatedData);

    
      if (currentPhase === "card_reveal" && (lastPhase === "betting" || lastPhase === "betting_closing")) {

          if (roundIdAtBettingEnd !== currentRoundIdStr) { 

              roundIdAtBettingEnd = currentRoundIdStr; 
              console.log(`[Phase Transition] Betting ended for Round: ${roundIdAtBettingEnd}. Entering 5s reveal phase.`);

              let finalWinner = null;

              if (adminDeclaredResults.has(roundIdAtBettingEnd)) {
                  finalWinner = adminDeclaredResults.get(roundIdAtBettingEnd);
                  console.log(`[Result] Using ADMIN DECLARED winner for Round ${roundIdAtBettingEnd}: ${finalWinner}`);
                  adminDeclaredResults.delete(roundIdAtBettingEnd); 
              } else {
                  console.log(`[Result] Determining winner by bets for Round ${roundIdAtBettingEnd}`);
                  finalWinner = await determineWinnerByBets(roundIdAtBettingEnd);
              }

              if (!finalWinner) {
                  console.error(`❌ Cannot determine final winner for round ${roundIdAtBettingEnd}. Skipping result processing.`);
              } else {
                  console.log(`[Result] Generating cards for winner: ${finalWinner}`);
                  const { dragonCard, tigerCard } = generateCardsForResult(finalWinner);

                  console.log(`[Socket Emit Prep] Winner: ${finalWinner}, D Card:`, dragonCard, "T Card:", tigerCard);

                  if (!dragonCard || !tigerCard) {
                       console.error(`❌ Failed to generate cards for winner ${finalWinner}, round ${roundIdAtBettingEnd}. Sending result without cards.`);
                       const finalResultDataFallback = {
                          roundId: roundIdAtBettingEnd,
                          winner: finalWinner,
                      };
                      io.emit('final_round_result', finalResultDataFallback);
                      console.log(`📢 Emitted 'final_round_result' (fallback - no cards) for Round ${roundIdAtBettingEnd}. Winner: ${finalWinner}`);
                  } else {
                      const finalResultData = {
                          roundId: roundIdAtBettingEnd,
                          winner: finalWinner,
                          dragonCard: dragonCard, 
                          tigerCard: tigerCard    
                      };

                      console.log(`[Socket Emit] Emitting final_round_result with data:`, JSON.stringify(finalResultData));

                      io.emit('final_round_result', finalResultData);
                      console.log(`📢 Emitted 'final_round_result' for Round ${roundIdAtBettingEnd}. Winner: ${finalWinner}`);
                  }

                  processRoundResultsInBackground(roundIdAtBettingEnd, currentMatchId, finalWinner)
                      .catch(err => console.error(`Error during background processing trigger for ${roundIdAtBettingEnd}:`, err));
              }
           } else {
           }
      } else if (currentPhase !== "card_reveal"){
           if(roundIdAtBettingEnd === currentRoundIdStr) {
              roundIdAtBettingEnd = null; 
           }
      }

      lastPhase = currentPhase;

  } catch (error) {
      console.error("❌ Error in server interval:", error);
      lastPhase = updatedData ? updatedData.phase : "unknown";
      roundIdAtBettingEnd = null; 
  }
}, 1000);
}

module.exports = socketHandler;



