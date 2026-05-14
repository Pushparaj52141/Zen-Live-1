/**
 * Location Service - GPS Distance Calculation and Office Validation
 * Uses Haversine formula to calculate distance between two GPS coordinates
 */

// Define office locations with geofence
const OFFICE_LOCATIONS = [
    {
        name: 'Pallikaranai',
        latitude: 12.94198577,
        longitude: 80.21012198,
        radiusMeters: 100
    },
    {
        name: 'Velachery',
        latitude: 12.9912597,
        longitude: 80.2201616,
        radiusMeters: 100
    }
];

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Validate if user location is within any office geofence
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Object} { isInOffice: boolean, officeName: string, distance: number }
 */
function validateLocation(userLat, userLon) {
    if (!userLat || !userLon) {
        return {
            isInOffice: false,
            officeName: 'Location not provided',
            distance: null
        };
    }

    let closestOffice = null;
    let minDistance = Infinity;

    // Check all office locations
    for (const office of OFFICE_LOCATIONS) {
        const distance = calculateDistance(
            userLat,
            userLon,
            office.latitude,
            office.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestOffice = office;
        }
    }

    // Check if within radius of closest office
    if (closestOffice && minDistance <= closestOffice.radiusMeters) {
        return {
            isInOffice: true,
            officeName: closestOffice.name,
            distance: Math.round(minDistance)
        };
    }

    return {
        isInOffice: false,
        officeName: closestOffice ? `${closestOffice.name} (${Math.round(minDistance)}m away)` : 'Unknown location',
        distance: Math.round(minDistance)
    };
}

/**
 * Get all configured office locations
 * @returns {Array} Array of office location objects
 */
function getOfficeLocations() {
    return OFFICE_LOCATIONS;
}

module.exports = {
    calculateDistance,
    validateLocation,
    getOfficeLocations
};
