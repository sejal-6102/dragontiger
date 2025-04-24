
// let resultCoin = 0;
// let userPhone = null;
// const placeFinalBetBtn = document.getElementById('place-final-bet-button');

// const apiUrl = 'http://localhost:3000/api/webapi/GetUserInfo';

// async function fetchUserInfo() {
//   try {
//     const response = await fetch(apiUrl, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     if (response.ok) {
//       const result = await response.json();
//       // console.log('API Response:', result); // DEBUG

//       if (result && result.data && result.data.win_wallet !== undefined) {
//         document.getElementById('coins').textContent = result.data.win_wallet;
//         resultCoin = result?.data?.win_wallet;
//         userPhone=result?.data?.phone_user        
//                 initGame(resultCoin,userPhone); 
//       } else {
//         console.warn('win_wallet not found in response. Initializing with 0.');
//         initGame(0, null);
//       }
//     } else {
//       console.error('API Error fetching user info:', response.status);
//       initGame(0, null);
//     }
//   } catch (error) {
//     console.error('Fetch User Info Error:', error);
//     initGame(0, null);
//   }
// }

// window.onload = fetchUserInfo;

// function initGame(startingCoins, userPhone) {
//   const suits = ["hearts", "spades", "clubs", "diamonds"];
//   const values = [
//       { name: "2", value: 2 }, { name: "3", value: 3 }, { name: "4", value: 4 },
//       { name: "5", value: 5 }, { name: "6", value: 6 }, { name: "7", value: 7 },
//       { name: "8", value: 8 }, { name: "9", value: 9 }, { name: "10", value: 10 },
//       { name: "J", value: 11 }, { name: "Q", value: 12 }, { name: "K", value: 13 },
//       { name: "A", value: 14 },
//   ];

//   const fullDeck = [];
//   suits.forEach((suit) => {
//       values.forEach((val) => {
//           fullDeck.push({ ...val, suit });
//       });
//   });

//   const socket = io("http://localhost:3000");

//   let bets = { Dragon: 0, Tie: 0, Tiger: 0 };
//   let selectedBetTarget = null;
//   let betsPlacedOn = {};
//   let dragonCard = null;
//   let tigerCard = null;
//   let countdown = 30;
//   let coins = startingCoins || 0;
//   let gstatus = "0";
//   let calculationInProgress = false; // Tracks if reveal/calculation is ongoing
//   let currentRoundId = null;
//   let currentMatchId = null;
//   let userPhoneNo = userPhone;

//   const coinsElement = document.getElementById("coins");
//   const resultElement = document.getElementById("result");
//   const countdownElement = document.getElementById("countdown");
//   const countdownCircle = document.getElementById("countdown-circle");
//   const dragonCardContainer = document.getElementById("dragon-card-container");
//   const tigerCardContainer = document.getElementById("tiger-card-container");
//   const dragonCardFront = document.getElementById("dragon-card-front");
//   const tigerCardFront = document.getElementById("tiger-card-front");
//   const betButtonsContainer = document.getElementById("bet-buttons-container");
//   const coinButtonsContainer = document.getElementById("coin-buttons-container");
//   const confettiContainer = document.getElementById("confetti-container");
//   const gameContainer = document.querySelector(".game-card") || document.body;
//   const notEnoughCoinsElement = document.getElementById("not-enough-coins");
//   const dragonBetAmountElement = document.getElementById("dragon-bet-amount");
//   const tieBetAmountElement = document.getElementById("tie-bet-amount");
//   const tigerBetAmountElement = document.getElementById("tiger-bet-amount");
//   const totalPendingBetElement = document.getElementById("total-pending-bet");

//   function createConfetti() {
//       const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#fff", "#f90"];
//       if (!confettiContainer) return;
//       confettiContainer.innerHTML = '';
//       for (let i = 0; i < 100; i++) {
//           const confetti = document.createElement("div");
//           confetti.classList.add("confetti");
//           confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
//           confetti.style.left = `${Math.random() * 100}vw`;
//           confetti.style.top = `${-10 - Math.random() * 20}px`;
//           confetti.style.animationDelay = `${Math.random() * 0.5}s`;
//           confetti.style.animationDuration = `${Math.random() * 3 + 3}s`;
//           confettiContainer.appendChild(confetti);
//       }
//       setTimeout(() => {
//            if (confettiContainer && confettiContainer.children.length > 0) {
//                confettiContainer.innerHTML = '';
//            }
//       }, 7000);
//   }

//   function updateSpecificBetAmountDisplay(cardName, amount) {
//       const element = document.getElementById(`${cardName.toLowerCase()}-bet-amount`);
//       if (element) {
//           element.textContent = amount;
//       }
//   }

//   function updateCoinsDisplay() {
//        if (coinsElement) {
//            coinsElement.textContent = Math.floor(coins);
//        }
//   }

//   function updateResultDisplay(text) {
//        if (resultElement) {
//            resultElement.textContent = text;
//        }
//   }

//   function updateCountdownDisplay() {
//       // Display might show reveal phase timer or betting timer based on server logic
//       if (countdownElement) {
//          countdownElement.textContent = countdown >= 0 ? countdown : "⏱"; // Show clock at end
//       }
//       if (countdownCircle) {
//           const circumference = 2 * Math.PI * 15.9155;
//           // Adjust offset calculation if timer duration changes (e.g., 5s reveal phase)
//           // This assumes a 30s max for the main betting visual. Reveal phase visual might need adjustment.
//           const maxTime = 30; // Adjust if visual needs to reflect 5s differently
//           const offset = ((maxTime - Math.max(0, countdown)) / maxTime) * circumference;
//           countdownCircle.style.strokeDashoffset = offset;

//           if (gstatus === "1" && countdown <= 5 && countdown > 0) { // Red only in last betting seconds
//               countdownCircle.style.stroke = "url(#redGradient)";
//           } else if (gstatus === "1") {
//               countdownCircle.style.stroke = "url(#greenGradient)";
//           } else { // gstatus is "0" (betting locked OR reveal phase)
//               countdownCircle.style.stroke = "url(#greyGradient)"; // Grey when betting closed/revealing
//           }
//       }
//   }

//   function getCardImagePath(card) {
//       const defaultPath = "../img/cards/patti_back.png";
//       if (!card || !card.suit || !card.name) return defaultPath;
//       const suitMap = { clubs: "CC", diamonds: "DD", hearts: "HH", spades: "SS" };
//       const cardName = card.name;
//       const cardSuit = suitMap[card.suit];
//       if (!cardSuit) return defaultPath;
//       return `../img/cards/${cardName}${cardSuit}.png`;
//   }

//   function resetCardsVisual() {
//     dragonCardFront.src = getCardImagePath(null);
//     tigerCardFront.src = getCardImagePath(null);
//     dragonCardContainer.classList.remove("flipped");
//     tigerCardContainer.classList.remove("flipped");
//   }

//   function resetBets() {
//       bets = { Dragon: 0, Tie: 0, Tiger: 0 };
//       selectedBetTarget = null;
//       betsPlacedOn = {};
//       if(dragonBetAmountElement) dragonBetAmountElement.textContent = '0';
//       if(tieBetAmountElement) tieBetAmountElement.textContent = '0';
//       if(tigerBetAmountElement) tigerBetAmountElement.textContent = '0';
//       if(totalPendingBetElement) totalPendingBetElement.textContent = 'Total Bet: 0';
//       removeBetTargetHighlight();
//       updateOutcomeButtonStates();
//       checkBettingStatus();
//   }

//   function updateOutcomeButtonStates() {
//        if (!betButtonsContainer) return;
//        betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
//            const betTarget = button.dataset.bet;
//            if (betsPlacedOn[betTarget]) {
//                button.classList.add("bet-placed-indicator");
//            } else {
//                button.classList.remove("bet-placed-indicator");
//            }
//        });
//   }

//    function revealCardsAndCalculateResult() {
//       if (calculationInProgress) {
//           console.warn("Calculation/Reveal already in progress.");
//           return;
//       }
//       calculationInProgress = true;
//       console.log("Starting card reveal and result calculation (triggered by reveal phase).");

//       // *** ASSUME server sends cards during reveal phase. Remove client simulation. ***
//       if (!dragonCard || !tigerCard) {
//            console.error("Card data missing from server at reveal phase! Cannot show result.");
//            // Optionally simulate as fallback, but ideally server guarantees cards here
//            // updateResultDisplay("Error: Missing card data from server.");
//            // calculationInProgress = false;
//            // return;
//             console.warn("DEBUG: Simulating card draw as fallback (server missing data).");
//             const shuffled = [...fullDeck];
//             for (let i = shuffled.length - 1; i > 0; i--) {
//                 const j = Math.floor(Math.random() * (i + 1));
//                 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//             }
//             dragonCard = shuffled.pop();
//             tigerCard = shuffled.pop();
//       }

//       console.log("Cards for reveal:", dragonCard, tigerCard);

//       // Reveal Animation - Starts when this function is called (reveal phase)
//       setTimeout(() => {
//             if (dragonCard && dragonCardFront && dragonCardContainer) {
//                 dragonCardFront.src = getCardImagePath(dragonCard);
//                 dragonCardContainer.classList.add("flipped");
//             }
//         }, 200); // Short delay for visual start
//       setTimeout(() => {
//             if (tigerCard && tigerCardFront && tigerCardContainer) {
//                 tigerCardFront.src = getCardImagePath(tigerCard);
//                 tigerCardContainer.classList.add("flipped");
//             }
//         }, 1000); // Reveal second card slightly later

//       // Calculate Winner and Payout - After animations have time to play
//       setTimeout(() => {
//           console.log("Calculating results based on submitted bets:", bets);
//           if (!dragonCard || !tigerCard) { // Check again in case simulation failed
//               updateResultDisplay("Error determining result.");
//               calculationInProgress = false; return;
//           }

//           let winner = null;
//           if (dragonCard.value > tigerCard.value) winner = "Dragon";
//           else if (tigerCard.value > dragonCard.value) winner = "Tiger";
//           else winner = "Tie";

//           let totalWinnings = 0;
//           let totalLosses = 0;
//           let netGain = 0;
//           let resultText = `Result: ${winner}! `;
//           const anyBetsWerePlaced = Object.values(bets).some(amount => amount > 0);

//           for (const [outcome, amount] of Object.entries(bets)) {
//                if (amount > 0) {
//                    if (outcome === winner) {
//                        const payoutMultiplier = (winner === "Tie") ? 8 : 1;
//                        const profit = amount * payoutMultiplier;
//                        totalWinnings += amount + profit;
//                        resultText += ` Won ${amount + profit} on ${outcome}.`;
//                    } else {
//                        totalLosses += amount;
//                        resultText += ` Lost ${amount} on ${outcome}.`;
//                    }
//                }
//            }

//            if (totalWinnings > 0) {
//                coins += totalWinnings;
//            }

//            if (anyBetsWerePlaced) {
//                updateCoinsDisplay();
//                netGain = totalWinnings - totalLosses;
//                if (netGain > 0) {
//                 updateResultDisplay(`🎉 You Win! ${resultText}`);
//                 createConfetti();
//             } else if (netGain < 0) {
//                 updateResultDisplay(`❌ You Lose. ${resultText}`);
//                 gameContainer.classList.add("animate-shake");
//                 setTimeout(() => gameContainer.classList.remove("animate-shake"), 1000);
//             } else {
//                 updateResultDisplay(`🏁 Break Even! ${resultText}`);
//             }
//         } else {
//              updateResultDisplay(`Result: ${winner}. No bets placed.`);
//         }
//        console.log("DEBUG: Result calculation finished.");
//        roundInProgress = false;
//    }, 3000);// Total time for reveal animations + result display pause (adjust as needed)
//   }

//   function resetRound() {
//       console.log("Resetting round.");
//       updateResultDisplay("Place Your Bet!");
//       // Countdown reset is handled by server game_update
//       resetBets();
//       resetCardsVisual();
//       calculationInProgress = false; // Ensure lock is released for new round
//       console.log("Round reset complete.");
//   }

//   function selectBetTargetHandler(event) {
//       if (gstatus === "0") return;
//       selectedBetTarget = event.currentTarget.dataset.bet;
//       highlightSelectedBetTarget();
//       checkBettingStatus();
//   }

//   function handleCoinButtonClick(event) {
//     const amount = parseInt(event.currentTarget.dataset.amount, 10);
//     if (isNaN(amount) || amount <= 0) return;

//     if (gstatus === "0") {
//       console.log("Betting closed.");
//       return;
//     }
//     // Add the time check separately:
//     if (countdown <= 5) {
//        console.log("Betting closing soon, cannot add more coins.");
//        // alert("Betting closing soon!"); // Optional user message
//        return;
//     }

// // // ... rest of the function
// //     if (finalBetSubmittedThisRound) {
// //       console.log("Final bet already submitted.");
// //       return;
// //     }
//     if (!selectedBetTarget) {
//       alert("Please select Dragon, Tie, or Tiger first!");
//       return;
//     }
//     if (coins < amount) {
//       console.log("Not enough coins:", amount);
//       if(notEnoughCoinsElement) notEnoughCoinsElement.classList.remove("hidden");
//       setTimeout(() => { if(notEnoughCoinsElement) notEnoughCoinsElement.classList.add("hidden"); }, 2000);
//       return;
//     }

//     coins -= amount;
//     bets[selectedBetTarget] = (bets[selectedBetTarget] || 0) + amount;
//     betsPlacedOn[selectedBetTarget] = true;

//     updateCoinsDisplay();
//     updateSpecificBetAmountDisplay(selectedBetTarget, bets[selectedBetTarget]);
//     updateOutcomeButtonStates();
//     checkBettingStatus();
//   }

//   function handlePlaceFinalBetsClick() {
//     const totalStagedBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);

//     if (gstatus === "0") {
//       alert("Betting for this round is closed.");
//       return;
//     }
//     // if (finalBetSubmittedThisRound) {
//     //   console.log("Final bet already submitted.");
//     //   return;
//     // }
//     if (totalStagedBet <= 0) {
//       alert("Please place some bets before finalizing.");
//       return;
//     }
//     if (countdown <= 5) {
//       alert("Betting is closing soon, cannot place new bets now.");
//       return;
//    }
//     if (!currentMatchId || !currentRoundId) {
//       alert("Game data is initializing, please wait.");
//       return;
//     }

//     checkBettingStatus();

//     const userId = socket.id || "guest_" + Math.random().toString(16).slice(2);
//     const finalBetData = {
//       userId: userId,
//       bets: { ...bets },
//       matchId: currentMatchId,
//       roundId: currentRoundId,
//       userPhoneID: userPhoneNo
//     };

//     console.log("Emitting place_final_bets:", JSON.stringify(finalBetData, null, 2));
//     socket.emit("place_final_bets", finalBetData);
//     // updateResultDisplay("Bets submitted. Waiting for round end...");
//     bets = { Dragon: 0, Tie: 0, Tiger: 0 };
// betsPlacedOn = {}; // Clear which outcomes had bets placed in this stage
// // Update the display for staged bets
// if(dragonBetAmountElement) dragonBetAmountElement.textContent = '0';
// if(tieBetAmountElement) tieBetAmountElement.textContent = '0';
// if(tigerBetAmountElement) tigerBetAmountElement.textContent = '0';
// if(totalPendingBetElement) totalPendingBetElement.textContent = 'Total Bet: 0';
// updateOutcomeButtonStates(); // Remove indicators if needed
// removeBetTargetHighlight(); // Optional: Clear selection after submit
// selectedBetTarget = null;   // Optional: Clear selection after submit

// // Update message to indicate success but possibility of more bets
// updateResultDisplay("Bet Submitted. You can place more.");
// // Re-check status, mainly to disable the Place Bet button again as staged bets are now 0
// checkBettingStatus();
//   }

//   function highlightSelectedBetTarget() {
//     if (!betButtonsContainer) return;
//     betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
//       button.classList.toggle("selected-bet-target", button.dataset.bet === selectedBetTarget);
//     });
//   }

//   function removeBetTargetHighlight() {
//     if (!betButtonsContainer) return;
//     betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
//       button.classList.remove("selected-bet-target");
//     });
//     selectedBetTarget = null;
//   }

//   function checkBettingStatus() {
//       // Betting possible only if gstatus is 1 AND user hasn't submitted final bet
//       const bettingPhaseActive = gstatus === "1" && countdown > 0;
//       const canBet = gstatus === "1" && countdown > 5; ;
//       const totalStagedBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);

//       if(totalPendingBetElement) totalPendingBetElement.textContent = `Total Bet: ${totalStagedBet}`;

//       if(placeFinalBetBtn) {
//         placeFinalBetBtn.disabled = !(canBet && totalStagedBet > 0);
//       }

//       if (betButtonsContainer) {
//           betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
//               // Button enabled only if betting is generally possible
//               button.disabled = !canBet;
//               const lock = document.getElementById(`${button.dataset.bet.toLowerCase()}-lock`);
//               if (lock) { lock.classList.toggle('hidden', canBet); }
//           });
//       }

//       if (coinButtonsContainer) {
//           coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
//               const amount = parseInt(button.dataset.amount, 10);
//               const canAfford = coins >= amount;
//               // Coin button enabled only if general betting is possible, a target is selected, AND user can afford
//               const isDisabled = !canBet || !selectedBetTarget || !canAfford;
//               button.disabled = isDisabled;
//               const lock = button.nextElementSibling;
//               if (lock && lock.classList.contains('lock-overlay')) {
//                   lock.classList.toggle('hidden', !isDisabled);
//               }
//           });
//       }

//       if (canBet && selectedBetTarget) {
//             const minCoinButtonAmount = 10;
//             if (coins < minCoinButtonAmount && notEnoughCoinsElement) {
//                 notEnoughCoinsElement.classList.remove("hidden");
//             } else if (notEnoughCoinsElement) {
//                 notEnoughCoinsElement.classList.add("hidden");
//             }
//       } else if (notEnoughCoinsElement) {
//           notEnoughCoinsElement.classList.add("hidden");
//       }

//       // Clear selection if betting is no longer possible (gstatus=0 or final bet sent)
//       if (!canBet && selectedBetTarget) {
//           removeBetTargetHighlight();
//           selectedBetTarget = null;
//       }
//   }

//   if (betButtonsContainer) {
//       betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
//           button.addEventListener('click', selectBetTargetHandler);
//       });
//   }

//   if (coinButtonsContainer) {
//       coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
//           button.addEventListener('click', handleCoinButtonClick);
//       });
//   }

//   if (placeFinalBetBtn) {
//       placeFinalBetBtn.addEventListener('click', handlePlaceFinalBetsClick);
//   }

//   socket.on("connect", () => {
//       console.log("Connected to server", socket.id);
//       updateResultDisplay("Connecting...");
//   });

//   socket.on("game_update", (data) => {
//     // console.log("DEBUG game_update:", data); // Keep for debugging server data
//     const previousStatus = gstatus;
//     const previousPhase = gstatus === "0" && countdown <= 5; // Rough check if was in reveal

//     // Update core state from server
//     if (data.timer !== undefined) countdown = data.timer;
//     if (data.gstatus !== undefined) gstatus = data.gstatus.toString();
//     if (data.match_id !== undefined) currentMatchId = data.match_id;
//     if (data.roundId !== undefined) currentRoundId = data.roundId;

//     // Update cards ONLY if server sends them
//     if (data.dragonCard) dragonCard = data.dragonCard;
//     if (data.tigerCard) tigerCard = data.tigerCard;

//     updateCountdownDisplay(); // Update visuals based on new state

//     // --- State Transitions ---

//     // 1. New Round Start: Previous was closed ("0"), current is betting ("1")
//     if (previousStatus === "0" && gstatus === "1") {
//       console.log("Client: New Round Start (gstatus 1). Round:", data.roundId);
//       resetRound(); // Resets flags, bets, visuals
//     }
//     // 2. Betting Ends: Previous was betting ("1"), current is closed ("0")
//     else if (previousStatus === "1" && gstatus === "0") {
//       console.log("Client: Betting Closed (gstatus 0). Timer:", countdown);
//       updateResultDisplay("Bets Closed. Waiting for reveal...");
//       removeBetTargetHighlight();
//       // finalBetSubmittedThisRound = true; // Lock betting definitively
//       checkBettingStatus(); // Disable controls
//       // *** DO NOT trigger reveal here, wait for reveal phase indication ***
//     }
//     // 3. Reveal Phase Starts: Current is closed ("0") AND server indicates reveal phase
//     //    (Using data.phase if server sends it, otherwise maybe timer starting from 5?)
//     else if (gstatus === "0" && data.phase === "card_reveal" && !calculationInProgress) {
//          console.log("Client: Card Reveal Phase Started. Timer:", countdown);
//          updateResultDisplay("Revealing cards...");
//          // Check if controls need disabling again (should already be disabled)
//          checkBettingStatus();
//          // Trigger the actual animation and calculation
//          revealCardsAndCalculateResult();
//     }
//     // 4. Ongoing Update: Status didn't change significantly for phase transitions
//     else {
//         checkBettingStatus(); // Keep UI controls state consistent
//     }
// });


//   socket.on("bet_accepted", (data) => {
//       console.log("Server accepted final bets:", data);
//       updateResultDisplay("Bets Accepted!");
//   });

//   socket.on("bet_rejected", (data) => {
//     console.error("Client: Bets REJECTED. Reason:", data?.reason);
//     alert(`Bets rejected: ${data?.reason || 'Unknown error'}`);

//     const totalRejectedAmount = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
//     if (totalRejectedAmount > 0) {
//         coins += totalRejectedAmount;
//         updateCoinsDisplay();
//         console.log(`Client: Reverted ${totalRejectedAmount} coins.`);
//     }

//     // Clear the rejected bets from the staging object
//     bets = { Dragon: 0, Tie: 0, Tiger: 0 };
//     betsPlacedOn = {};
//     updateSpecificBetAmountDisplay('Dragon', 0);
//     updateSpecificBetAmountDisplay('Tie', 0);
//     updateSpecificBetAmountDisplay('Tiger', 0);
//     if(totalPendingBetElement) totalPendingBetElement.textContent = 'Total Bet: 0';
//     updateOutcomeButtonStates();

//     // Allow user to bet again IF betting is still open server-side
//     // finalBetSubmittedThisRound = false;
//     calculationInProgress = false; // Should not be in progress anyway
//     checkBettingStatus(); // Re-enable buttons if gstatus is still "1"

//     updateResultDisplay("Bets rejected. Please adjust and try again.");
// });


//   socket.on("disconnect", (reason) => {
//       console.log("Disconnected from server:", reason);
//       updateResultDisplay("Disconnected");
//       gstatus = "0";
//       // finalBetSubmittedThisRound = true;
//       calculationInProgress = false;
//       checkBettingStatus();
//   });

//   socket.on("connect_error", (error) => {
//       console.error("Connection Error:", error);
//       updateResultDisplay("Connection Failed");
//       gstatus = "0";
//       // finalBetSubmittedThisRound = true;
//       calculationInProgress = false;
//       checkBettingStatus();
//   });


//   console.log("Initializing UI at end of initGame.");
//   updateCoinsDisplay();
//   updateResultDisplay("Connecting...");
//   resetCardsVisual();
//   updateOutcomeButtonStates();
//   updateCountdownDisplay();
//   checkBettingStatus();

// }