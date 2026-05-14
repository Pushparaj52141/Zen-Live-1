const holidayService = require('../services/holidayService');

class HolidayController {
    async getHolidays(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let holidays;
            if (startDate && endDate) {
                holidays = await holidayService.getHolidays(startDate, endDate);
            } else {
                holidays = await holidayService.getAllHolidays();
            }
            res.json({ success: true, data: holidays });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createHoliday(req, res) {
        try {
            const holiday = await holidayService.createHoliday(req.body);
            res.json({ success: true, data: holiday });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateHoliday(req, res) {
        try {
            const { id } = req.params;
            const holiday = await holidayService.updateHoliday(id, req.body);
            res.json({ success: true, data: holiday });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteHoliday(req, res) {
        try {
            const { id } = req.params;
            await holidayService.deleteHoliday(id);
            res.json({ success: true, message: 'Holiday deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new HolidayController();
