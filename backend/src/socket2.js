// const { updateGameState, getCardResult } = require('./gameState');

// function socketHandler(io) {
//   let lastPhase = "betting";

//   io.on('connection', (socket) => {
//     console.log('Client connected:xfgchvjbnk', socket.id);
//     socket.emit('game_update', updateGameState()); // Initial emit
//     socket.on("place_bet", (data) => {
//       console.log("Bet placed:", data);
//       // Store in DB or use in logic
//       // data = { userId, card, amount, matchId, roundId }
//     });
   
//   });
// //   io.on("connection", (socket) => {
    
// // });

// socket.on("place_bet", (data) => {
//   console.log("Bet placed:", data);
//   // Store in DB or use in logic
//   // data = { userId, card, amount, matchId, roundId }
// });

//   setInterval(() => {
//     const updatedData = updateGameState();
//     io.emit('game_update', updatedData);

//     // Detect transition to card_reveal phase to emit once
//     if (updatedData.phase === "card_reveal" && lastPhase !== "card_reveal") {
//       const result = getCardResult();
//       console.log("Card Reveal:", result);
//       io.emit("card_reveal", result);
//     }

//     lastPhase = updatedData.phase;
//   }, 1000);
// }

// module.exports = socketHandler;


// server-side file (e.g., server.js or socketHandler.js)


const db = require('../../src/config/connectDB'); // ✅ adjust path if needed


const { updateGameState, getCardResult } = require('./gameState'); // Ensure this path is correct

function socketHandler(io) {
  let lastPhase = "betting"; // Tracks game phase for card reveal trigger

  console.log("Socket handler initialized. Waiting for connections...");

  // This runs ONCE FOR EACH NEW CLIENT CONNECTION
  io.on('connection', (socket) => {
    // 'socket' represents the connection to THIS specific client
    console.log('Client connected:', socket.id); // Log connection with client ID

    // Send initial game state to the newly connected client
    try {
        const initialState = updateGameState();
        socket.emit('game_update', initialState);
        console.log(`Sent initial game_update to ${socket.id}`);
    } catch (error) {
        console.error("Error sending initial state:", error);
    }


    // --- REGISTER LISTENERS FOR THIS SPECIFIC CLIENT (socket) ---

    // THIS LISTENER IS CORRECTLY PLACED
    console.log("here----------");


    socket.on("place_bet", async (data) => {
      const { userId, card, amount, matchId, roundId } = data;
    
      try {
        const query = `
          INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId)
          VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [userId, card, amount, matchId, roundId]);
    
        console.log(`✅ Bet stored. Insert ID: ${result.insertId}`);
        socket.emit("bet_accepted", { id: result.insertId });
    
      } catch (err) {
        console.error("❌ Failed to insert bet:", err.message);
        socket.emit("bet_rejected", { error: "Database error." });
      }
    });
    
    // socket.on("place_bet", (data) => {
    //   // This console log should now appear in your SERVER terminal
    //   // whenever THIS specific client (represented by 'socket') emits 'place_bet'
    //   console.log(`Received "place_bet" event from client ${socket.id}:`, data);

    //   // TODO: Add server-side validation (is betting open? sufficient funds? etc.)
    //   // TODO: Store the bet in your database or game logic
    //   // Example: saveBetToDatabase(socket.id, data);

    //   // Optional: Send confirmation/rejection back to client
    //   // socket.emit("bet_accepted", { card: data.card, amount: data.betAmount });
    //   // or
    //   // socket.emit("bet_rejected", { reason: "Betting closed." });
    // });

    // Listen for the NEW event if using the "Place Final Bet" button logic
    // socket.on("place_final_bets", (data) => {
    //     console.log(`Received "place_final_bets" event from client ${socket.id}:`, data);
    //     // data should contain: { userId, bets: { Dragon: x, Tie: y, Tiger: z }, matchId, roundId }

    //     // TODO: Add server-side validation (is betting open? sufficient funds for total? etc.)
    //     // TODO: Store the final bets object in DB or game logic
    //     // Example: saveFinalBets(socket.id, data.bets, data.matchId, data.roundId);

    //     // Optional: Send confirmation/rejection back
    //     // socket.emit("bet_accepted", { message: "Bets placed successfully" });
    //     // or
    //     // socket.emit("bet_rejected", { reason: "Insufficient funds for total bet." });
    // });
    socket.on("place_final_bets", async (data) => {
      const { userId, bets, matchId, roundId } = data;
    
      try {
        const betEntries = Object.entries(bets); // [["Dragon", 100], ["Tiger", 50], ...]
    
        for (const [card, amount] of betEntries) {
          if (amount > 0) {
            await db.execute(
              `INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId)
               VALUES (?, ?, ?, ?, ?)`,
              [userId, card, amount, matchId, roundId]
            );
          }
        }
    
        console.log("✅ Final bets saved for:", userId);
        socket.emit("bet_accepted", { message: "Bets placed successfully" });
    
      } catch (err) {
        console.error("❌ Error saving final bets:", err.message);
        socket.emit("bet_rejected", { error: "Database error." });
      }
    });
    


    // Listener for when this client disconnects
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Add other client-specific listeners here...

  }); // --- END of io.on('connection', ...) ---


  // --- REMOVED INCORRECTLY PLACED LISTENER ---
  /*
  socket.on("place_bet", (data) => { // <<< THIS WAS THE PROBLEM
    console.log("Bet placed:", data);
    // Store in DB or use in logic
    // data = { userId, card, amount, matchId, roundId }
  });
  */
  // --- END REMOVAL ---


  // --- Global Server Logic (Game Timer & Updates) ---
  // This runs independently of client connections
  setInterval(() => {
    try {
      const updatedData = updateGameState();
      // Emit game updates to ALL connected clients
      io.emit('game_update', updatedData);
      // console.log("Emitted game_update to all clients:", updatedData.timer, updatedData.gstatus); // Optional: for less noise

      // Detect transition to card_reveal phase to emit result once
      if (updatedData.phase === "card_reveal" && lastPhase !== "card_reveal") {
        const result = getCardResult();
        console.log("Server emitting card_reveal:", result);
        io.emit("card_reveal", result); // Emit result to ALL clients
      }
      lastPhase = updatedData.phase; // Update phase tracking

    } catch (error) {
      console.error("Error in server interval:", error);
    }
  }, 1000);

} // End of socketHandler function

module.exports = socketHandler;