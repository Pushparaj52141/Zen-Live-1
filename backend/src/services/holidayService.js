const db = require('../config/db');

class HolidayService {
    // Get holidays between dates
    async getHolidays(startDate, endDate) {
        let query = `
            SELECT id, name, TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date, type, description, is_recurring, locations, created_at, updated_at 
            FROM holidays 
            WHERE holiday_date BETWEEN $1 AND $2 
            ORDER BY holiday_date`;
        const params = [startDate, endDate];
        const result = await db.query(query, params);
        return result.rows;
    }

    // Get all holidays
    async getAllHolidays() {
        let query = `
            SELECT id, name, TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date, type, description, is_recurring, locations, created_at, updated_at 
            FROM holidays 
            ORDER BY holiday_date`;
        const result = await db.query(query);
        return result.rows;
    }

    // Create a holiday
    async createHoliday(data) {
        const { name, holiday_date, type, description, is_recurring, locations } = data;
        const query = `
            INSERT INTO holidays (name, holiday_date, type, description, is_recurring, locations) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(query, [name, holiday_date, type, description, is_recurring, locations ? JSON.stringify(locations) : null]);
        return result.rows[0];
    }

    // Update holiday
    async updateHoliday(id, data) {
        const { name, holiday_date, type, description, is_recurring, locations } = data;
        const query = `
            UPDATE holidays 
            SET name=$1, holiday_date=$2, type=$3, description=$4, is_recurring=$5, locations=$6 
            WHERE id=$7
            RETURNING *
        `;
        const result = await db.query(query, [name, holiday_date, type, description, is_recurring, locations ? JSON.stringify(locations) : null, id]);
        return result.rows[0];
    }

    // Delete holiday
    async deleteHoliday(id) {
        await db.query(`DELETE FROM holidays WHERE id=$1`, [id]);
        return true;
    }
}

module.exports = new HolidayService();
