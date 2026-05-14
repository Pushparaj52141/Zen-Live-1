// Reviews Controller
// Handles manual reviews and free/manual Google review management

const pool = require('../../config/db');

// Helper to handle async errors
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Get all reviews (both manual and Google)
 * @route GET /api/reviews/all
 */
exports.getAllReviews = async (req, res) => {
    try {
        const query = `
      SELECT 
        id, 
        customer_name as author_name,
        course_name,
        rating,
        review_text,
        review_date as review_time,
        source,
        NULL as profile_photo_url,
        created_at
      FROM reviews
      WHERE source = 'manual'
      
      UNION ALL
      
      SELECT 
        id,
        author_name,
        NULL as course_name,
        rating,
        review_text,
        review_time,
        source,
        profile_photo_url,
        created_at
      FROM google_reviews
      
      ORDER BY review_time DESC
    `;

        const result = await pool.query(query);

        res.json({
            success: true,
            count: result.rows.length,
            reviews: result.rows
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews',
            message: error.message
        });
    }
};

/**
 * Get only manual reviews
 * @route GET /api/reviews
 */
exports.getManualReviews = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM reviews ORDER BY review_date DESC'
        );

        res.json({
            success: true,
            count: result.rows.length,
            reviews: result.rows
        });
    } catch (error) {
        console.error('Error fetching manual reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch manual reviews',
            message: error.message
        });
    }
};

/**
 * Get only Google reviews
 * @route GET /api/reviews/google
 */
exports.getGoogleReviews = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM google_reviews ORDER BY review_time DESC'
        );

        res.json({
            success: true,
            count: result.rows.length,
            reviews: result.rows
        });
    } catch (error) {
        console.error('Error fetching Google reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Google reviews',
            message: error.message
        });
    }
};

/**
 * Get a single review by ID and source
 * @route GET /api/reviews/:id
 */
exports.getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const { source = 'manual' } = req.query;

        const table = source === 'google' ? 'google_reviews' : 'reviews';
        const result = await pool.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review',
            message: error.message
        });
    }
};

/**
 * Create a new manual review
 * @route POST /api/reviews
 */
exports.createReview = async (req, res) => {
    try {
        const { customer_name, course_name, rating, review_text, review_date } = req.body;

        // Validation
        if (!customer_name || !course_name || !rating || !review_date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customer_name, course_name, rating, review_date'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const result = await pool.query(
            `INSERT INTO reviews 
       (customer_name, course_name, rating, review_text, review_date, source)
       VALUES ($1, $2, $3, $4, $5, 'manual')
       RETURNING *`,
            [customer_name, course_name, rating, review_text || '', review_date]
        );

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create review',
            message: error.message
        });
    }
};

/**
 * Update a manual review
 * @route PUT /api/reviews/:id
 */
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, course_name, rating, review_text, review_date } = req.body;

        const checkResult = await pool.query(
            'SELECT * FROM reviews WHERE id = $1 AND source = $2',
            [id, 'manual']
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Manual review not found or cannot be edited'
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const result = await pool.query(
            `UPDATE reviews 
       SET customer_name = COALESCE($1, customer_name),
           course_name = COALESCE($2, course_name),
           rating = COALESCE($3, rating),
           review_text = COALESCE($4, review_text),
           review_date = COALESCE($5, review_date),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
            [customer_name, course_name, rating, review_text, review_date, id]
        );

        res.json({
            success: true,
            message: 'Review updated successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update review',
            message: error.message
        });
    }
};

/**
 * Delete a manual review
 * @route DELETE /api/reviews/:id
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await pool.query(
            'SELECT * FROM reviews WHERE id = $1 AND source = $2',
            [id, 'manual']
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Manual review not found or cannot be deleted'
            });
        }

        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review',
            message: error.message
        });
    }
};

/**
 * Manually trigger Google Reviews sync (Placeholder for Free Version)
 * @route POST /api/reviews/sync-google
 */
exports.syncGoogleReviews = async (req, res) => {
    try {
        console.log('📥 Manual sync triggered by user:', req.user?.email || 'Unknown');

        // Return a success message indicating this is the free version mode
        res.json({
            success: true,
            message: 'Free Sync: Please use the Manual Import feature to add Google Reviews.',
            data: {
                fetched: 0,
                saved: 0,
                status: 'skipped'
            }
        });

    } catch (error) {
        console.error('Error during manual sync:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync Google reviews',
            message: error.message
        });
    }
};

/**
 * Get last sync status
 * @route GET /api/reviews/sync-status
 */
exports.getSyncStatus = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM review_sync_log 
       ORDER BY sync_date DESC 
       LIMIT 1`
        );

        res.json({
            success: true,
            lastSync: result.rows[0] || { status: 'none', message: 'No sync history found' }
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sync status',
            message: error.message
        });
    }
};

/**
 * Get review statistics
 * @route GET /api/reviews/stats
 */
exports.getReviewStats = async (req, res) => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::numeric(10,2) as average_rating,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_reviews,
        COUNT(CASE WHEN source = 'google' THEN 1 END) as google_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM (
        SELECT rating, source FROM reviews
        UNION ALL
        SELECT rating, source FROM google_reviews
      ) all_reviews
    `;

        const result = await pool.query(statsQuery);

        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        console.error('Error getting review stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get review statistics',
            message: error.message
        });
    }
};
