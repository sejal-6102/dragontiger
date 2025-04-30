

let resultCoin = 0;
let userPhone = null;
let gameInitialized = false;
let updateGameCoins = null;

const placeFinalBetBtn = document.getElementById('place-final-bet-button');
// const apiUrl = 'https://bluedoller.online/api/webapi/GetUserInfo';
const apiUrl = 'https://bluedoller.online/api/webapi/GetUserInfo';

let historyCurrentPage = 1;
const historyItemsPerPage = 10;
let historyIsLoading = false;
let historyTotalPages = 1;
let historyUserPhone = null;
let historyRefreshIntervalId = null; 
const HISTORY_REFRESH_INTERVAL = 3000; 

let historyTableBody = null;
let historyLoadingMessage = null;
let historyErrorMessage = null;
let historyNoHistoryMessage = null;
let historyTable = null;
let historyPaginationControls = null;
let historyPrevButton = null;
let historyNextButton = null;
let historyPageInfo = null;

function setupHistoryDOMElements() {
    // Select elements and check if they exist afterwards
    if (!historyTableBody) historyTableBody = document.getElementById("history-table-body");
    if (!historyLoadingMessage) historyLoadingMessage = document.getElementById("history-loading-message");
    if (!historyErrorMessage) historyErrorMessage = document.getElementById("history-error-message");
    if (!historyNoHistoryMessage) historyNoHistoryMessage = document.getElementById("history-no-history-message");
    if (!historyTable) historyTable = document.getElementById("history-table");
    if (!historyPaginationControls) historyPaginationControls = document.getElementById("history-pagination-controls");
    if (!historyPrevButton) historyPrevButton = document.getElementById("history-prev-button");
    if (!historyNextButton) historyNextButton = document.getElementById("history-next-button");
    if (!historyPageInfo) historyPageInfo = document.getElementById("history-page-info");

    // Log missing elements for debugging (helps identify HTML issues)
    if (!historyTableBody) console.error("setupHistoryDOMElements: history-table-body NOT FOUND!");
    if (!historyLoadingMessage) console.error("setupHistoryDOMElements: history-loading-message NOT FOUND!");
    if (!historyErrorMessage) console.error("setupHistoryDOMElements: history-error-message NOT FOUND!");
    if (!historyNoHistoryMessage) console.error("setupHistoryDOMElements: history-no-history-message NOT FOUND!");
    if (!historyTable) console.error("setupHistoryDOMElements: history-table NOT FOUND!");
    if (!historyPaginationControls) console.error("setupHistoryDOMElements: history-pagination-controls NOT FOUND!");
    if (!historyPrevButton) console.warn("setupHistoryDOMElements: history-prev-button not found yet.");
    if (!historyNextButton) console.warn("setupHistoryDOMElements: history-next-button not found yet.");
    if (!historyPageInfo) console.error("setupHistoryDOMElements: history-page-info NOT FOUND!");


    // Attach listeners only ONCE and only if buttons exist
    if (historyPrevButton && historyNextButton && !historyListenersAttached) {
        console.log("Attaching history pagination listeners.");

        historyPrevButton.addEventListener('click', () => {
            // Check state BEFORE calling fetch
            if (!historyPrevButton.disabled && historyCurrentPage > 1 && !historyIsLoading) {
                console.log("Prev button clicked, fetching page:", historyCurrentPage - 1);
                fetchBetHistory(historyUserPhone, historyCurrentPage - 1); // Use historyUserPhone
            } else {
                 console.log("Prev button click ignored. State:", {
                    disabled: historyPrevButton.disabled,
                    page: historyCurrentPage,
                    loading: historyIsLoading
                 });
            }
        });

        historyNextButton.addEventListener('click', () => {
            // Check state BEFORE calling fetch
            if (!historyNextButton.disabled && historyCurrentPage < historyTotalPages && !historyIsLoading) {
                console.log("Next button clicked, fetching page:", historyCurrentPage + 1);
                fetchBetHistory(historyUserPhone, historyCurrentPage + 1); // Use historyUserPhone
            } else {
                 console.log("Next button click ignored. State:", {
                    disabled: historyNextButton.disabled,
                    page: historyCurrentPage,
                    totalPages: historyTotalPages,
                    loading: historyIsLoading
                 });
            }
        });

        historyListenersAttached = true; // Mark as attached
    } else if (historyListenersAttached) {
        // console.log("History listeners already attached."); // Optional log
    } else if (!historyListenersAttached && (!historyPrevButton || !historyNextButton)) {
         // Log a warning if buttons weren't found yet
         console.warn("Could not attach history listeners - Prev/Next button not found yet. Will retry on next setup call.");
    }
}

// =====================================================
async function fetchBetHistory(phone, page = 1) {
    setupHistoryDOMElements(); // Ensure elements are selected/attempted

    // --- Pre-fetch Checks ---
    // Check if essential elements for this function are available NOW
    if (!historyLoadingMessage || !historyErrorMessage || !historyNoHistoryMessage || !historyTableBody || !historyTable) {
         console.error("fetchBetHistory cannot run: Critical DOM elements for UI update are missing.");
         // Attempting to update pagination state even if table elements are missing
         if(historyPaginationControls) updateHistoryPagination({ currentPage: historyCurrentPage, totalPages: historyTotalPages });
         return; // Stop if critical elements aren't ready
    }
     // Check if phone number is valid
     if (!phone) {
        console.warn("fetchBetHistory called without a valid phone number.");
        if (historyTableBody) historyTableBody.innerHTML = ''; // Clear table
        if (historyTable) historyTable.style.display = 'none'; // Hide table
        if (historyLoadingMessage) historyLoadingMessage.style.display = 'none';
        if (historyErrorMessage) historyErrorMessage.style.display = 'none';
        if (historyNoHistoryMessage) {
            historyNoHistoryMessage.textContent = "User information needed to load history."; // More specific message
            historyNoHistoryMessage.style.display = 'block';
        }
        historyUserPhone = null;
        updateHistoryPagination({ currentPage: 1, totalPages: 0 }); // Reset pagination UI
        return; // Stop execution
    }
    // Prevent concurrent fetches
    if (historyIsLoading) {
        console.log(`Bet history fetch skipped for page ${page}. Already loading.`);
        return;
    }
    // --- End Pre-fetch Checks ---


    console.log(`Attempting to fetch history for phone ${phone}, page: ${page}`);
    historyIsLoading = true;
    historyUserPhone = phone; // Track phone used

    // --- Update UI for Loading State ---
    updateHistoryPagination(null); // Disable pagination buttons immediately
    if (historyLoadingMessage) historyLoadingMessage.style.display = 'block';
    if (historyErrorMessage) historyErrorMessage.style.display = 'none';
    if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'none';
    // Optionally hide the table during load to prevent seeing old data briefly
    // if (historyTable) historyTable.style.display = 'none';


    // --- API Call ---
    // const historyApiUrl = `https://bluedoller.online/api/betting-history/${phone}?page=${page}&limit=${historyItemsPerPage}`; // Production
    const historyApiUrl = `http://localhost:3000/api/betting-history/${phone}?page=${page}&limit=${historyItemsPerPage}`; // Local
    let fetchedPaginationData = null; // Store successful pagination data

    try {
        const response = await fetch(historyApiUrl);
        const result = await response.json(); // Parse JSON

        console.log("Raw History API Response:", { status: response.status, body: result });

        // --- Handle Response ---
        if (response.ok && result && result.pagination && typeof result.pagination.currentPage === 'number' && typeof result.pagination.totalPages === 'number' && Array.isArray(result.data)) {
            // --- Success Case ---
            console.log(`History fetch successful for page: ${result.pagination.currentPage}, Total Pages: ${result.pagination.totalPages}`);

            // Update state variables from successful response
            historyCurrentPage = result.pagination.currentPage;
            historyTotalPages = result.pagination.totalPages > 0 ? result.pagination.totalPages : 1;
            fetchedPaginationData = result.pagination; // Store for finally block

            // Display data or "No History" message
            if (result.data.length > 0) {
                displayHistoryPage(result.data); // Assumes this function exists and works
                if (historyTable) historyTable.style.display = 'table';
                if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'none';
            } else {
                // Success, but no data for this page
                if (historyTableBody) historyTableBody.innerHTML = '';
                if (historyTable) historyTable.style.display = 'none';
                if (historyNoHistoryMessage) {
                    historyNoHistoryMessage.textContent = page === 1 ? "No recent bets found." : "No more bets found.";
                    historyNoHistoryMessage.style.display = 'block';
                }
            }
            // Ensure error message is hidden on success
            if (historyErrorMessage) historyErrorMessage.style.display = 'none';

        } else {
            // --- API Error or Invalid Data Structure ---
            console.error('Invalid history API response or non-OK status:', { status: response.status, result });
            if (historyErrorMessage) { // Check if element exists before using
                historyErrorMessage.textContent = `Error: ${result.message || `Failed to load history (${response.status})`}`;
                historyErrorMessage.style.display = 'block';
            }
            if (historyTable) historyTable.style.display = 'none';
            if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'none';
            // Keep previous pagination state on error
            fetchedPaginationData = { currentPage: historyCurrentPage, totalPages: historyTotalPages };
        }
    } catch (error) {
        // --- Network or Fetch Exception ---
        console.error('Fetch Bet History Exception:', error);
        if (historyErrorMessage) { // Check if element exists before using
            historyErrorMessage.textContent = 'Network error connecting to history service.';
            historyErrorMessage.style.display = 'block';
        }
        if (historyTable) historyTable.style.display = 'none';
        if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'none';
        // Reset pagination state completely on network error
        historyCurrentPage = 1;
        historyTotalPages = 0;
        fetchedPaginationData = { currentPage: historyCurrentPage, totalPages: historyTotalPages };
    } finally {
        // --- Cleanup and Final UI Update ---
        historyIsLoading = false; // <<< Release loading flag
        if(historyLoadingMessage) historyLoadingMessage.style.display = 'none'; // Hide loading indicator

        // Update pagination controls based on the final state
        // Use fetchedPaginationData if available (from success or kept state on API error),
        // otherwise use the potentially reset state from catch block.
        updateHistoryPagination(fetchedPaginationData || { currentPage: historyCurrentPage, totalPages: historyTotalPages });
        console.log("History fetch finished. State:", { loading: historyIsLoading, page: historyCurrentPage, total: historyTotalPages });
    }
}

function displayHistoryPage(historyData) {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = ''; 

    historyData.forEach(bet => {
        const row = historyTableBody.insertRow();

        let resultClass = '';
        let winLossText = '';
        let winAmount = Number(bet.win_amount);

        if (bet.result === 'win') {
            resultClass = 'history-result-win';
            winLossText = `+${!isNaN(winAmount) ? winAmount : 'N/A'}`; 
        } else if (bet.result === 'loss') {
            resultClass = 'history-result-loss';
             winLossText = `${!isNaN(winAmount) ? winAmount : '-'}`;
        } else if (bet.result === 'pending') {
            resultClass = 'history-result-pending';
            winLossText = '-'; 
        } else {
             winLossText = !isNaN(winAmount) ? winAmount : '-';
        }

        row.innerHTML = `
            <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;">${bet.roundId || 'N/A'}</td>
            <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;">${bet.card || 'N/A'}</td>
            <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;">${Math.floor(bet.amount) || '0'}</td>
            <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;" class="${resultClass}">${bet.result || 'N/A'}</td>
            <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;" class="${resultClass}">${winLossText}</td>
            <!-- <td style="border: 1px solid #4b5563; padding: 6px 8px; text-align: center;">${bet.created_at ? new Date(bet.created_at).toLocaleTimeString() : 'N/A'}</td> -->
        `;
    });
}

function updateHistoryPagination(pagination) {
    setupHistoryDOMElements(); // Ensure elements are available
    if (!historyPageInfo || !historyPrevButton || !historyNextButton || !historyPaginationControls) {
        return; // Exit if elements aren't ready
    }

    let currentPageToShow = historyCurrentPage;
    let totalPagesToShow = historyTotalPages;
    let isLoading = historyIsLoading || (pagination === null); // Consider null as loading

    // Use data from argument if valid pagination object is passed
    if (pagination && typeof pagination.currentPage === 'number' && typeof pagination.totalPages === 'number') {
        currentPageToShow = pagination.currentPage;
        totalPagesToShow = pagination.totalPages;
    }

    // console.log(`Updating pagination display: Page=${currentPageToShow}, Total=${totalPagesToShow}, Loading=${isLoading}`); // Debug log

    if (totalPagesToShow > 0) {
        historyPageInfo.textContent = `Page ${currentPageToShow} of ${totalPagesToShow}`;
        // Disable logic: Disable if loading OR at boundary
        historyPrevButton.disabled = isLoading || currentPageToShow <= 1;
        historyNextButton.disabled = isLoading || currentPageToShow >= totalPagesToShow;

        // Show controls only if more than one page exists
        historyPaginationControls.style.display = totalPagesToShow > 1 ? 'block' : 'none';
    } else {
        // No pages or error state
        historyPageInfo.textContent = 'Page 0 of 0';
        historyPrevButton.disabled = true;
        historyNextButton.disabled = true;
        historyPaginationControls.style.display = 'none';
    }
}


function startHistoryRefreshInterval() {
    stopHistoryRefreshInterval();

    if (userPhone) { 
        console.log(`Starting history refresh interval (${HISTORY_REFRESH_INTERVAL}ms)`);
        historyRefreshIntervalId = setInterval(() => {
           
            if (userPhone && !historyIsLoading) {
                 fetchBetHistory(userPhone, 1);
            }
        }, HISTORY_REFRESH_INTERVAL);
    } else {
         console.log("Skipping history refresh interval start: userPhone not set.");
    }
}

function stopHistoryRefreshInterval() {
    if (historyRefreshIntervalId !== null) {
        console.log("Stopping history refresh interval.");
        clearInterval(historyRefreshIntervalId);
        historyRefreshIntervalId = null;
    }
}


async function fetchUserInfo() {
    try {
        setupHistoryDOMElements();

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        let fetchedCoins = 0;
        let fetchedPhone = null;
        let dataSuccessfullyFetched = false;

        if (response.ok) {
            const result = await response.json();
            console.log(result,"rtyugioptfguhij")
            if (result && result.data && result.data.win_wallet !== undefined) {
                dataSuccessfullyFetched = true;
                fetchedCoins = result.data.win_wallet + result.data.money_user;
                fetchedPhone = result.data.phone_user || null;

                document.getElementById('coins').textContent = Math.floor(fetchedCoins);
                resultCoin = fetchedCoins;
                userPhone = fetchedPhone; // Update global userPhone

                // Inside fetchUserInfo, after getting fetchedPhone successfully:
if (userPhone !== fetchedPhone) { // Check if phone has changed or is set initially
    console.log(`User phone changed/set: New='${fetchedPhone}', Old='${userPhone}'`);
    userPhone = fetchedPhone; // Update global phone

    if (userPhone) {
        // New valid phone number
        historyCurrentPage = 1; // <<< RESET page for new user
        historyTotalPages = 1; // <<< RESET total pages
        historyUserPhone = userPhone; // Update history phone tracker
        fetchBetHistory(userPhone, 1); // <<< Fetch initial history
    } else {
        // Phone became null
        // ... (clear history display code) ...
         historyUserPhone = null;
         updateHistoryPagination({ currentPage: 1, totalPages: 0 }); // Reset pagination UI
    }
}
            } else {
                console.warn('win_wallet not found in successful API response.');
                stopHistoryRefreshInterval(); // Stop interval if data invalid
                if (historyTableBody) historyTableBody.innerHTML = '';
                if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'block';
                if (historyTable) historyTable.style.display = 'none';
                if (historyPaginationControls) historyPaginationControls.style.display = 'none';
                historyUserPhone = null;
            }
        } else {
            console.error('API Error fetching user info:', response.status);
            stopHistoryRefreshInterval(); // Stop interval on API error
             if (historyTableBody) historyTableBody.innerHTML = '';
             if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'block';
             if (historyTable) historyTable.style.display = 'none';
             if (historyPaginationControls) historyPaginationControls.style.display = 'none';
             historyUserPhone = null;
        }

        if (!gameInitialized) {
            console.log(`Initializing game. Data found: ${dataSuccessfullyFetched}. Using Coins: ${fetchedCoins}, Phone: ${fetchedPhone}`);
            initGame(fetchedCoins, fetchedPhone);
            gameInitialized = true;
        } else if (dataSuccessfullyFetched && updateGameCoins) {
            console.log("Game already initialized. Updating game coins with fetched value:", fetchedCoins);
            updateGameCoins(fetchedCoins);
        } else {
            console.log("Game already initialized, but no new valid data found in this fetch. No coin update triggered.");
        }

    } catch (error) {
        console.error('Fetch User Info Error (catch block):', error);
        stopHistoryRefreshInterval(); // Stop interval on fetch error
         if (historyTableBody) historyTableBody.innerHTML = '';
         if (historyNoHistoryMessage) historyNoHistoryMessage.style.display = 'block';
         if (historyTable) historyTable.style.display = 'none';
         if (historyPaginationControls) historyPaginationControls.style.display = 'none';
         historyUserPhone = null;

        if (!gameInitialized) {
            console.log("Initializing game with defaults due to fetch/processing error.");
            initGame(0, null);
            gameInitialized = true;
        }
    }
}


function initGame(startingCoins, userPhoneNoParam) {

    const suits = ["hearts", "spades", "clubs", "diamonds"];
    const values = [ { name: "2", value: 2 }, { name: "3", value: 3 }, { name: "4", value: 4 }, { name: "5", value: 5 }, { name: "6", value: 6 }, { name: "7", value: 7 }, { name: "8", value: 8 }, { name: "9", value: 9 }, { name: "10", value: 10 }, { name: "J", value: 11 }, { name: "Q", value: 12 }, { name: "K", value: 13 }, { name: "A", value: 14 }, ];
    const fullDeck = [];
    suits.forEach((suit) => { values.forEach((val) => { fullDeck.push({ ...val, suit }); }); });
    const socket = io("https://bluedoller.online");
    // const socket = io("https://bluedoller.online");

    let stagedBets = { Dragon: 0, Tie: 0, Tiger: 0 };
    let confirmedBets = {};
    let selectedBetTarget = null;
    let countdown = 30;
    let coins = startingCoins;
    let gstatus = "0";
    let calculationInProgress = false;
    let currentRoundId = null;
    let currentMatchId = null;
    let userPhoneNo = userPhoneNoParam; // Local game instance phone number
    let lastDisplayedRoundResult = null;

    const coinsElement = document.getElementById("coins");
    const resultElement = document.getElementById("result");
    const countdownElement = document.getElementById("countdown");
    const countdownCircle = document.getElementById("countdown-circle");
    const dragonCardContainer = document.getElementById("dragon-card-container");
    const tigerCardContainer = document.getElementById("tiger-card-container");
    const dragonCardFront = document.getElementById("dragon-card-front");
    const tigerCardFront = document.getElementById("tiger-card-front");
    const betButtonsContainer = document.getElementById("bet-buttons-container");
    const coinButtonsContainer = document.getElementById("coin-buttons-container");
    const confettiContainer = document.getElementById("confetti-container");
    const gameContainer = document.querySelector(".game-card") || document.body;
    const notEnoughCoinsElement = document.getElementById("not-enough-coins");
    const dragonBetAmountElement = document.getElementById("dragon-bet-amount");
    const tieBetAmountElement = document.getElementById("tie-bet-amount");
    const tigerBetAmountElement = document.getElementById("tiger-bet-amount");
    const totalPendingBetElement = document.getElementById("total-pending-bet");


    function createConfetti() {
        const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#fff", "#f90"];
        if (!confettiContainer) return;
        confettiContainer.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement("div");
            confetti.classList.add("confetti");
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = `${-10 - Math.random() * 20}px`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${Math.random() * 3 + 3}s`;
            confettiContainer.appendChild(confetti);
        }
        setTimeout(() => {
            if (confettiContainer && confettiContainer.children.length > 0) {
                confettiContainer.innerHTML = '';
            }
        }, 7000);
    }

    function updateSpecificBetAmountDisplay(cardName, amount) {
        const element = document.getElementById(`${cardName.toLowerCase()}-bet-amount`);
        if (element) {
            element.textContent = Math.floor(amount);
        }
    }

    function updateCoinsDisplay() {
        if (coinsElement) {
            coinsElement.textContent = Math.floor(coins);
        }
    }

    function updateResultDisplay(text) {
        if (resultElement) {
            resultElement.textContent = text;
        }
    }

    function updateCountdownDisplay() {
        if (countdownElement) {
            countdownElement.textContent = countdown >= 0 ? countdown : "⏱";
        }
        if (countdownCircle) {
            const circumference = 100; // Adjusted if using r=15.9155
            const maxTime = 20;
            const offset = ((maxTime - Math.max(0, countdown)) / maxTime) * circumference;
            // Correct application for SVG stroke-dashoffset (starts full, goes to 0)
            countdownCircle.style.strokeDashoffset = circumference - offset;


            if (gstatus === "1" && countdown <= 5 && countdown > 0) {
                countdownCircle.style.stroke = "url(#redGradient)";
            } else if (gstatus === "1") {
                countdownCircle.style.stroke = "url(#greenGradient)";
            } else {
                countdownCircle.style.stroke = "url(#greyGradient)";
            }
        }
    }

    function getCardImagePath(card) {
        const basePath = "/DragonTiger/assets/img/cards/";
        const defaultPath = basePath + "patti_back.png";

        if (!card || card === null) return defaultPath;
        if (typeof card !== 'object' || !card.name || !card.suit) {
            console.warn("getCardImagePath: Invalid card object structure", card); return defaultPath;
        }
        const suitInitial = card.suit.charAt(0).toUpperCase();
        let cardName = card.name.toUpperCase();
        const imageFileName = `${cardName}${suitInitial}${suitInitial}.png`;

        if (cardName && suitInitial) return basePath + imageFileName;
        else { console.warn("getCardImagePath: Invalid filename parts", card); return defaultPath; }
    }

    function resetCardsVisual() {
        if(dragonCardFront) dragonCardFront.src = getCardImagePath(null);
        if(tigerCardFront) tigerCardFront.src = getCardImagePath(null);
        if(dragonCardContainer) dragonCardContainer.classList.remove("flipped");
        if(tigerCardContainer) tigerCardContainer.classList.remove("flipped");
    }

    function resetStagedBetsUI() {
        stagedBets = { Dragon: 0, Tie: 0, Tiger: 0 };
        if (dragonBetAmountElement) dragonBetAmountElement.textContent = '0';
        if (tieBetAmountElement) tieBetAmountElement.textContent = '0';
        if (tigerBetAmountElement) tigerBetAmountElement.textContent = '0';
        if (totalPendingBetElement) totalPendingBetElement.textContent = 'Total Bet: 0';
        removeBetTargetHighlight();
    }

    function highlightSelectedBetTarget() {
        if (!betButtonsContainer) return;
        betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
            button.classList.toggle("selected-bet-target", button.dataset.bet === selectedBetTarget);
        });
    }

    function removeBetTargetHighlight() {
        if (!betButtonsContainer) return;
        betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
            button.classList.remove("selected-bet-target");
        });
        selectedBetTarget = null;
    }

    function resetRoundUI() {
        console.log(`Resetting UI for new round (ID starting/is: ${currentRoundId})`);
        updateResultDisplay("Place Your Bet!");
        resetStagedBetsUI();
        resetCardsVisual();
        checkBettingStatus();
    }

    function selectBetTargetHandler(event) {
        if (gstatus !== "1") return;
        selectedBetTarget = event.currentTarget.dataset.bet;
        highlightSelectedBetTarget();
        checkBettingStatus();
    }

    function handleCoinButtonClick(event) {
        const amount = parseInt(event.currentTarget.dataset.amount, 10);
        if (isNaN(amount) || amount <= 0) return;
        if (gstatus !== "1" || countdown <= 5) { console.log("Betting closed."); return; }
        if (!selectedBetTarget) { alert("Select Dragon, Tie, or Tiger first!"); return; }
        if (coins < amount) {
            if (notEnoughCoinsElement) notEnoughCoinsElement.classList.remove("hidden");
            setTimeout(() => { if (notEnoughCoinsElement) notEnoughCoinsElement.classList.add("hidden"); }, 2000);
            return;
        }
        coins -= amount;
        stagedBets[selectedBetTarget] = (stagedBets[selectedBetTarget] || 0) + amount;
        updateCoinsDisplay();
        updateSpecificBetAmountDisplay(selectedBetTarget, stagedBets[selectedBetTarget]);
        const totalStaged = Object.values(stagedBets).reduce((sum, val) => sum + val, 0);
        if (totalPendingBetElement) totalPendingBetElement.textContent = `Total Bet: ${totalStaged}`;
        checkBettingStatus();
    }

    function handlePlaceFinalBetsClick() {
        const totalStagedBet = Object.values(stagedBets).reduce((sum, amount) => sum + amount, 0);
        if (gstatus !== "1" || countdown <= 5) { alert("Betting closed."); return; }
        if (totalStagedBet <= 0) { alert("Stage some bets first."); return; }
        if (!currentMatchId || !currentRoundId) { alert("Game initializing."); return; }
        if (!userPhoneNo) { alert("User info unavailable."); console.error("Missing userPhoneNo."); return; }

        const userId = socket.id;
        const finalBetData = { userId, bets: { ...stagedBets }, matchId: currentMatchId, roundId: currentRoundId, userPhoneID: userPhoneNo };
        console.log(`Emitting place_final_bets for Round ${currentRoundId}:`, JSON.stringify(finalBetData, null, 2));
        socket.emit("place_final_bets", finalBetData);

        if (!confirmedBets[currentRoundId]) confirmedBets[currentRoundId] = { Dragon: 0, Tie: 0, Tiger: 0 };
        for (const outcome in stagedBets) {
            if (stagedBets[outcome] > 0) confirmedBets[currentRoundId][outcome] += stagedBets[outcome];
        }
        console.log(`Locally Confirmed Bets for Round ${currentRoundId}:`, confirmedBets[currentRoundId]);
        resetStagedBetsUI();
        updateResultDisplay("Bet Submitted.");
        checkBettingStatus();
    }

    function checkBettingStatus() {
        const canBet = gstatus === "1" && countdown > 5;
        const totalStagedBet = Object.values(stagedBets).reduce((sum, amount) => sum + amount, 0);
        if(totalPendingBetElement) totalPendingBetElement.textContent = `Total Bet: ${totalStagedBet}`;
        if(placeFinalBetBtn) placeFinalBetBtn.disabled = !(canBet && totalStagedBet > 0);

        if (betButtonsContainer) {
            betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
                button.disabled = !canBet;
                const lock = document.getElementById(`${button.dataset.bet.toLowerCase()}-lock`);
                if (lock) lock.classList.toggle('hidden', canBet);
            });
        }
        if (coinButtonsContainer) {
            coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
                const amount = parseInt(button.dataset.amount, 10);
                const canAfford = coins >= amount;
                const isDisabled = !canBet || !selectedBetTarget || !canAfford;
                button.disabled = isDisabled;
                const lock = button.nextElementSibling;
                if (lock && lock.classList.contains('lock-overlay')) lock.classList.toggle('hidden', !isDisabled);
            });
        }
        if (canBet && selectedBetTarget) {
            const minCoinButtonAmount = 10;
            if (coins < minCoinButtonAmount && notEnoughCoinsElement) notEnoughCoinsElement.classList.remove("hidden");
            else if (notEnoughCoinsElement) notEnoughCoinsElement.classList.add("hidden");
        } else if (notEnoughCoinsElement) {
            notEnoughCoinsElement.classList.add("hidden");
        }
        if (!canBet && selectedBetTarget) removeBetTargetHighlight();
    }


    function showFinalResult(resultData) {
        const roundIdForResult = resultData.roundId.toString();
        const actualWinner = resultData.winner;
        const dragonCardFromServer = resultData.dragonCard;
        const tigerCardFromServer = resultData.tigerCard;

        if (calculationInProgress || lastDisplayedRoundResult === roundIdForResult) {
            console.log(`Skipping result display for ${roundIdForResult}. In progress: ${calculationInProgress}, Already displayed: ${lastDisplayedRoundResult === roundIdForResult}`);
            return;
        }

        calculationInProgress = true;
        lastDisplayedRoundResult = roundIdForResult;

        stopHistoryRefreshInterval();

        console.log(`Showing final result for Round ${roundIdForResult}: Winner ${actualWinner}`);
        console.log(`  Dragon Card:`, dragonCardFromServer);
        console.log(`  Tiger Card:`, tigerCardFromServer);

        const roundBets = confirmedBets[roundIdForResult] || { Dragon: 0, Tie: 0, Tiger: 0 };
        let totalWinnings = 0;
        let totalLosses = 0;
        let resultText = `Winner: ${actualWinner}! `;
        const anyBetsWerePlaced = Object.values(roundBets).some(amount => amount > 0);

        console.log(`Calculating payout based on CONFIRMED bets for Round ${roundIdForResult}:`, roundBets);

        for (const [outcome, amount] of Object.entries(roundBets)) {
            if (amount > 0) {
                if (outcome === actualWinner) {
                    let profitMultiplier = (actualWinner === "Tie") ? 3 : 1;
                    const profit = amount * profitMultiplier;
                    totalWinnings += amount + profit;
                    resultText += ` Won ${Math.floor(amount + profit)} on ${outcome}.`;
                } else {
                    totalLosses += amount;
                    resultText += ` Lost ${Math.floor(amount)} on ${outcome}.`;
                }
            }
        }

        if (anyBetsWerePlaced) {
            let netGain = totalWinnings - totalLosses;
            if (netGain > 0) {
                updateResultDisplay(`🎉 You Win! ${resultText}`);
                createConfetti();
            } else if (netGain < 0) {
                updateResultDisplay(`❌ You Lose. ${resultText}`);
                if (gameContainer) gameContainer.classList.add("animate-shake");
                setTimeout(() => { if (gameContainer) gameContainer.classList.remove("animate-shake"); }, 1000);
            } else {
                 updateResultDisplay(`🏁 ${resultText}`);
            }
            console.log("Attempting to fetch updated user info from server after result display...");
            setTimeout(fetchUserInfo, 5000); // Fetch updated balance after server processing time
        } else {
            updateResultDisplay(`Result: ${actualWinner}. No bets placed.`);
        }

        resetCardsVisual();
        setTimeout(() => {
            if(dragonCardFront) {
                dragonCardFront.src = getCardImagePath(dragonCardFromServer);
                dragonCardFront.onerror = () => { dragonCardFront.src = getCardImagePath(null); console.error("Error loading Dragon card image:", dragonCardFront.src); };
            }
            if(tigerCardFront) {
                tigerCardFront.src = getCardImagePath(tigerCardFromServer);
                tigerCardFront.onerror = () => { tigerCardFront.src = getCardImagePath(null); console.error("Error loading Tiger card image:", tigerCardFront.src); };
            }
             if(dragonCardContainer) dragonCardContainer.classList.add("flipped");
             if(tigerCardContainer) tigerCardContainer.classList.add("flipped");
        }, 200);

        setTimeout(() => {
            calculationInProgress = false;
            console.log(`Calculation lock released after displaying Round ${roundIdForResult}.`);
        }, 4000);
    }


    // --- Socket Event Handlers ---
    socket.on("connect", () => {
        console.log("Connected to server", socket.id);
        updateResultDisplay("Connecting...");
        lastDisplayedRoundResult = null;
        confirmedBets = {};
        stopHistoryRefreshInterval(); // Stop interval on disconnect/reconnect
        fetchUserInfo(); // Fetch fresh info
    });

    socket.on("game_update", (data) => {
        const previousGstatus = gstatus; // Store previous status
        const previousRoundId = currentRoundId;

        // Update state from server
        if (data.timer !== undefined) countdown = data.timer;
        if (data.gstatus !== undefined) gstatus = data.gstatus.toString();
        if (data.match_id !== undefined) currentMatchId = data.match_id;
        if (data.roundId !== undefined) currentRoundId = data.roundId.toString();

        updateCountdownDisplay();

        // --- Manage History Refresh Interval based on game status ---
        if (gstatus === '1' && previousGstatus !== '1') {
            // Starting betting phase
            startHistoryRefreshInterval();
        } else if (gstatus !== '1' && previousGstatus === '1') {
            // Ending betting phase
            stopHistoryRefreshInterval();
        }
        // --- End Interval Management ---


        if (currentRoundId !== previousRoundId && previousRoundId !== null) {
            console.log(`Client detected new round: ${currentRoundId} (Previous: ${previousRoundId})`);
            resetRoundUI(); // This now also implicitly starts the interval if gstatus is '1'
        }

        if (gstatus === "0" && countdown > 0) {
            if (!calculationInProgress && lastDisplayedRoundResult !== currentRoundId) {
                updateResultDisplay("Waiting for result...");
            }
        } else if (gstatus === "1") {
            if (!calculationInProgress) {
                updateResultDisplay("Place Your Bet!");
            }
        }

        checkBettingStatus();
    });

    socket.on("final_round_result", (data) => {
        console.log("Received final_round_result:", data);
         stopHistoryRefreshInterval();

        if (data.roundId && data.winner && data.dragonCard && data.tigerCard) {
            showFinalResult(data);

            setTimeout(() => {
                if (userPhoneNo && !historyIsLoading) {
                    console.log("Refreshing bet history once after round result...");
                    fetchBetHistory(userPhoneNo, 1); // Fetch page 1 again
                }
            }, 6000); // Delay matches the fetchUserInfo delay roughly

        } else {
             console.warn("Received final_round_result with missing data:", data);
             if (data.roundId && data.winner) {
                 updateResultDisplay(`Result for ${data.roundId}: ${data.winner} (Card details missing)`);
             }
        }
    });

    socket.on("bet_accepted", (data) => {
        console.log(`Bet accepted by server for round ${data.roundId}. Server Balance: ${data.wallet}`);
         if (userPhoneNo && !historyIsLoading && historyRefreshIntervalId !== null) { // Check if interval is active
         }
    });

     socket.on("bet_rejected", (data) => {
        console.error(`Client: Bets REJECTED for round ${data.roundId}. Reason: ${data.reason}`);
        alert(`Bets rejected: ${data.reason || 'Unknown error'}`);
        console.log("Fetching user info to correct balance after rejection...");
        setTimeout(fetchUserInfo, 1000);
        resetStagedBetsUI();
        checkBettingStatus();
        updateResultDisplay("Bets rejected. Please try again.");
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from server:", reason);
        updateResultDisplay("Disconnected");
        gstatus = "0";
        calculationInProgress = false;
        stopHistoryRefreshInterval(); // Stop interval on disconnect
        checkBettingStatus();
        lastDisplayedRoundResult = null;
        confirmedBets = {};
    });

    socket.on("connect_error", (error) => {
        console.error("Connection Error:", error);
        updateResultDisplay("Connection Failed");
        gstatus = "0";
        calculationInProgress = false;
        stopHistoryRefreshInterval(); // Stop interval on connection error
        checkBettingStatus();
        lastDisplayedRoundResult = null;
        confirmedBets = {};
    });

    if (betButtonsContainer) { betButtonsContainer.querySelectorAll('.bet-button').forEach(button => button.addEventListener('click', selectBetTargetHandler)); }
    if (coinButtonsContainer) { coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => button.addEventListener('click', handleCoinButtonClick)); }
    if (placeFinalBetBtn) { placeFinalBetBtn.addEventListener('click', handlePlaceFinalBetsClick); }

    console.log("Initializing Game UI...");
    updateCoinsDisplay();
    updateResultDisplay("Connecting...");
    resetCardsVisual();
    updateCountdownDisplay();
    checkBettingStatus();
     stopHistoryRefreshInterval();

    updateGameCoins = (newAmount) => {
        if (coins !== newAmount) {
            console.log(`Updating game coins from ${coins} to ${newAmount}`);
            coins = newAmount;
            updateCoinsDisplay();
            checkBettingStatus();
        }
    };

} 


window.onload = fetchUserInfo;
