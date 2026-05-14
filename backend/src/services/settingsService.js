const pool = require('../config/db');

class SettingsService {
    // Get all settings
    async getAllSettings() {
        const result = await pool.query('SELECT * FROM system_settings');
        // Convert array to object map for easier consumption
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key_name] = row.value;
        });
        return settings;
    }

    // Get specific setting
    async getSetting(key) {
        const result = await pool.query('SELECT value FROM system_settings WHERE key_name = $1', [key]);
        return result.rows[0]?.value;
    }

    // Update or Create setting
    async updateSetting(key, value) {
        // Ensure value is stringified JSON if it's an object/array, but pg handles jsonb objects directly if passed correctly.
        // However, for consistency, we assume 'value' is an object that matches the JSONB column.

        const query = `
      INSERT INTO system_settings (key_name, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key_name) 
      DO UPDATE SET value = $2, updated_at = NOW()
      RETURNING *
    `;
        // Ensure that arrays/objects are correctly handled as JSON strings for the JSONB column
        const finalValue = (typeof value === 'object') ? JSON.stringify(value) : value;
        const result = await pool.query(query, [key, finalValue]);
        return result.rows[0];
    }

    // Bulk update
    async updateSettingsBulk(settingsObj) {
        const promises = Object.entries(settingsObj).map(([key, value]) =>
            this.updateSetting(key, value)
        );
        return Promise.all(promises);
    }
}

module.exports = new SettingsService();
