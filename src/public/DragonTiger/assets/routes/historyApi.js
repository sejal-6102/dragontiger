const express = require('express');
const router = express.Router();
const db = require('../.././../../config/connectDB'); 

router.get('/betting-history/:phone', async (req, res) => {
    const { phone } = req.params;
    const page = parseInt(req.query.page, 10) || 1; 
    const limit = parseInt(req.query.limit, 10) || 10; 
    const offset = (page - 1) * limit;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number parameter is required.' });
    }

    try {
        const [history] = await db.execute(
            `SELECT id, roundId,matchId, card, amount, result, win_amount, created_at
             FROM dragon_tiger
             WHERE phone = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [phone, limit, offset]
        );

        const [[{ totalCount }]] = await db.execute(
            `SELECT COUNT(*) as totalCount FROM dragon_tiger WHERE phone = ?`,
            [phone]
        );

        const formattedHistory = history.map(bet => ({
            ...bet,
            win_amount: bet.result === 'pending' ? '-' : Number(bet.win_amount) || 0,
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


// Aviator Betting History Endpoint
router.get('/aviator-history/:phone', async (req, res) => {
    const { phone } = req.params;
    const page = parseInt(req.query.page, 10) || 1; 
    const limit = parseInt(req.query.limit, 10) || 10; 
    const offset = (page - 1) * limit;

    if (!phone) {
        return res.status(400).json({
            status: false,
            message: 'Phone number parameter is required.',
            data: null,
            pagination: null
        });
    }
     if (page <= 0 || limit <= 0) {
        return res.status(400).json({
            status: false,
            message: 'Page and limit query parameters must be positive integers.',
            data: null,
            pagination: null
        });
    }

    try {
        const [aviatorHistory] = await db.execute(
            `SELECT id, phone, amount, type, period, crash, status, 
                    DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS timeFormatted 
             FROM aviator_result 
             WHERE phone = ? 
             ORDER BY time DESC 
             LIMIT ? OFFSET ?`,
            [phone, limit, offset]
        );

        const [[{ totalCount }]] = await db.execute(
            `SELECT COUNT(*) as totalCount FROM aviator_result WHERE phone = ?`,
            [phone]
        );


        res.status(200).json({
            status: true,
            message: 'Aviator history fetched successfully.',
            data: aviatorHistory, 
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error(`Error fetching Aviator history for phone ${phone}:`, error);
        res.status(500).json({
            status: false,
            message: 'Failed to retrieve Aviator betting history.',
            error: error.message,
            data: null,
            pagination: null
        });
    }
});


module.exports = router;