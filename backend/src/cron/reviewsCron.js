// Cron Job for Google Reviews Sync
// Automatically syncs Google reviews daily


const cron = require('node-cron');
// const googlePlacesService = require('../services/googlePlacesService'); // Removed for Free Mode

/**
 * Schedule Google Reviews sync
 * Default: Every day at midnight (00:00)
 * Can be configured via GOOGLE_REVIEWS_CRON_SCHEDULE env variable
 */
function scheduleReviewsSync() {
    // Check if sync is enabled
    const syncEnabled = process.env.GOOGLE_REVIEWS_SYNC_ENABLED === 'true';

    if (!syncEnabled) {
        return;
    }

    // Get cron schedule from env or use default (midnight daily)
    const schedule = process.env.GOOGLE_REVIEWS_CRON_SCHEDULE || '0 0 * * *';



    // Schedule the cron job
    cron.schedule(schedule, async () => {
        try {
            // const result = await googlePlacesService.syncGoogleReviews(); 
            console.log('ℹ️ Free Mode: Auto-sync is currently disabled. Use Manual Import.');

            // Placeholder result
            const result = { success: true, fetched: 0, saved: 0 };

            if (result.success) {

            } else {


                // TODO: Send notification to admin (email, Slack, etc.)
                // await notifyAdmin('Google Reviews sync failed', result.error);
            }
        } catch (error) {
            console.error('❌ CRON JOB: Fatal error during sync');
            console.error('   Error:', error.message);
            console.error(error.stack);
        }

        console.log('='.repeat(60) + '\n');
    }, {
        timezone: process.env.TZ || 'Asia/Kolkata' // Set timezone
    });

    console.log('✓ Google Reviews cron job scheduled successfully');
}

/**
 * Run manual sync (for testing)
 */
async function runManualSync() {
    console.log('🔄 Running manual Google Reviews sync...');

    try {
        // const result = await googlePlacesService.syncGoogleReviews();
        console.log('Skipping manual sync in Free Mode');
        const result = { success: true, message: 'Skipped' };
        return result;
    } catch (error) {
        console.error('Manual sync failed:', error);
        throw error;
    }
}

module.exports = {
    scheduleReviewsSync,
    runManualSync
};
