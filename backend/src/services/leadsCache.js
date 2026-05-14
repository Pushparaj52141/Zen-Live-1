/**
 * Simple in-memory cache for leads data
 * Reduces database queries for frequently accessed data
 */

class LeadsCache {
    constructor(ttl = 60000) {
        // Default TTL: 60 seconds
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Generate cache key from query parameters
     */
    generateKey(params) {
        const {
            courseType,
            course,
            status,
            trainer,
            batch,
            feeStatus,
            source,
            role,
            user_id,
            unit,
            cardType,
            referred_by,
            meta_campaign_id,
            priority,
            limit,
            offset,
        } = params;

        return JSON.stringify({
            courseType,
            course,
            status,
            trainer,
            batch,
            feeStatus,
            source,
            role,
            user_id,
            unit,
            cardType,
            referred_by,
            meta_campaign_id,
            priority: priority || "all",
            limit: limit || "all",
            offset: offset || "0",
        });
    }

    /**
     * Get cached data
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
            // Cache expired
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cache data
     */
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });

        // Limit cache size to prevent memory issues
        if (this.cache.size > 100) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Invalidate cache (call when data changes)
     */
    invalidate() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            ttl: this.ttl,
        };
    }
}

// Create singleton instance with 30-second TTL for leads data
const leadsCache = new LeadsCache(30000);

module.exports = leadsCache;
