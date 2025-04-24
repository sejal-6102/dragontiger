// routes/historyApi.js (or similar file)
const express = require('express');
const router = express.Router();
const db = require('../.././../../config/connectDB'); // Adjust path if needed
const { getCurrentRoundDetails } = require('../gameState'); // Adjust path if needed

// GET /api/admin/current-round-summary
router.get('/current-round-summary', async (req, res) => {
    const { roundId, gStatus } = getCurrentRoundDetails(); // Get live round ID and status

    // Simplified check: only return message if no roundId is available at all.
    // We want data even if gStatus is 0 (round just finished).
    if (!roundId) {
        return res.status(200).json({ message: 'No active or recent round found.' });
    }

    // Optional logging based on status
    if (gStatus === '0') {
        console.log(`Fetching summary & bets for potentially finished round: ${roundId}`);
    } else {
        console.log(`Fetching admin summary & bets for active round: ${roundId}`);
    }

    try {
        // Query for summary statistics
        const summaryQuery = `
            SELECT
                COUNT(DISTINCT phone) as uniqueUsers,
                COALESCE(SUM(amount), 0) as totalAmount,
                COALESCE(SUM(CASE WHEN card = 'Dragon' THEN amount ELSE 0 END), 0) as dragonAmount,
                COALESCE(SUM(CASE WHEN card = 'Tiger' THEN amount ELSE 0 END), 0) as tigerAmount,
                COALESCE(SUM(CASE WHEN card = 'Tie' THEN amount ELSE 0 END), 0) as tieAmount
            FROM dragon_tiger
            WHERE roundId = ?
        `;

        // Query for individual bets (select specific columns you need)
        // Renamed variable from 'user' to 'betsQuery' for clarity
        // Added ORDER BY time DESC to get newest bets first
        const betsQuery = `
            SELECT id, phone, amount, card, created_at
            FROM dragon_tiger
            WHERE roundId = ?
            ORDER BY created_at DESC
        `; // Adjust columns (id, phone, amount, card, time) as needed

        // Execute both queries
        const [summaryResults] = await db.execute(summaryQuery, [roundId]);
        // Renamed variable from 'userID' to 'betsResults' for clarity
        const [betsResults] = await db.execute(betsQuery, [roundId]);

        // Prepare the summary data
        // Use || {} as a fallback in case the summary query returns empty (though unlikely with COALESCE)
        const summaryData = summaryResults[0] || {
             uniqueUsers: 0,
             totalAmount: 0,
             dragonAmount: 0,
             tigerAmount: 0,
             tieAmount: 0
        };
        summaryData.roundId = roundId; // Add the roundId

        // The bets data is already an array
        const betsData = betsResults;

        // ***Combine summary and bets into a single response object***
        const responseData = {
            summary: summaryData,
            bets: betsData // The array of individual bet objects
        };

        // Send the combined data
        res.status(200).json(responseData);

        // Optional: Log the data being sent for debugging
        // console.log("Combined response data:", JSON.stringify(responseData, null, 2));


    } catch (error) {
        console.error(`Error fetching admin round summary/bets for round ${roundId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve round data.' });
    }
});

module.exports = router;