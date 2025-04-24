// routes/historyApi.js (or similar file)
const express = require('express');
const router = express.Router();
const db = require('../.././../../config/connectDB'); // Adjust the path to your DB connection

// GET /api/betting-history/:phone?page=1&limit=10
router.get('/betting-history/:phone', async (req, res) => {
    const { phone } = req.params;
    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
    const offset = (page - 1) * limit;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number parameter is required.' });
    }

    try {
        // Query for the current page of results
        const [history] = await db.execute(
            `SELECT id, roundId, card, amount, result, win_amount, created_at
             FROM dragon_tiger
             WHERE phone = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [phone, limit, offset]
        );

        // Query for the total count of records for this user for pagination
        const [[{ totalCount }]] = await db.execute(
            `SELECT COUNT(*) as totalCount FROM dragon_tiger WHERE phone = ?`,
            [phone]
        );

        // Format the data slightly if needed (optional)
        const formattedHistory = history.map(bet => ({
            ...bet,
            // Ensure win_amount is treated as a number
            win_amount: bet.result === 'pending' ? '-' : Number(bet.win_amount) || 0,
            // Format date (optional)
            // created_at: new Date(bet.created_at).toLocaleString()
        }));

        res.status(200).json({
            data: formattedHistory,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error(`Error fetching betting history for phone ${phone}:`, error);
        res.status(500).json({ error: 'Failed to retrieve betting history.' });
    }
});

module.exports = router;