const settingsService = require('../services/settingsService');

const getSettings = async (req, res) => {
    try {
        const settings = await settingsService.getAllSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Expecting { settings: { key: value, key2: value2 } }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid settings data' });
        }

        await settingsService.updateSettingsBulk(settings);

        // Return updated settings
        const updated = await settingsService.getAllSettings();
        res.json({ success: true, message: 'Settings updated successfully', data: updated });
    } catch (error) {
        console.error('Error updating settings ERROR DETAILS:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
