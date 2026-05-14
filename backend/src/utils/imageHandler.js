const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageHandler {
    constructor() {
        // Base upload directory
        this.uploadDir = path.join(__dirname, '../../uploads/attendance');
        this.ensureUploadDir();
    }

    // Ensure upload directory exists
    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    // Generate organized folder path (year/month/day)
    getDateFolder() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const folderPath = path.join(this.uploadDir, String(year), month, day);

        // Create folder if it doesn't exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        return { folderPath, relativePath: `${year}/${month}/${day}` };
    }

    // Generate unique filename
    generateFilename(userId, type = 'checkin') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return `${userId}_${type}_${timestamp}_${random}.jpg`;
    }

    // Save base64 image to file system with compression
    async saveImage(base64Image, userId, type = 'checkin') {
        try {
            // Remove data:image/png;base64, or data:image/jpeg;base64, prefix
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const { folderPath, relativePath } = this.getDateFolder();
            const filename = this.generateFilename(userId, type);
            const fullPath = path.join(folderPath, filename);
            const dbPath = `${relativePath}/${filename}`;

            // Compress and save image using sharp
            await sharp(imageBuffer)
                .resize(800, 600, { // Resize to max 800x600
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
                .toFile(fullPath);

            return {
                success: true,
                path: dbPath,
                fullPath: fullPath
            };
        } catch (error) {
            console.error('Error saving image:', error);
            throw new Error('Failed to save image');
        }
    }

    // Get image from file system
    getImage(imagePath) {
        try {
            const fullPath = path.join(this.uploadDir, imagePath);

            if (!fs.existsSync(fullPath)) {
                return null;
            }

            return fs.readFileSync(fullPath);
        } catch (error) {
            console.error('Error reading image:', error);
            return null;
        }
    }

    // Delete image from file system
    deleteImage(imagePath) {
        try {
            const fullPath = path.join(this.uploadDir, imagePath);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }

    // Clean up old images (older than X days)
    async cleanupOldImages(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const years = fs.readdirSync(this.uploadDir).filter(item => {
                return fs.statSync(path.join(this.uploadDir, item)).isDirectory();
            });

            let deletedCount = 0;

            for (const year of years) {
                const yearPath = path.join(this.uploadDir, year);
                const months = fs.readdirSync(yearPath);

                for (const month of months) {
                    const monthPath = path.join(yearPath, month);
                    const days = fs.readdirSync(monthPath);

                    for (const day of days) {
                        const dayPath = path.join(monthPath, day);
                        const folderDate = new Date(`${year}-${month}-${day}`);

                        if (folderDate < cutoffDate) {
                            const files = fs.readdirSync(dayPath);
                            files.forEach(file => {
                                fs.unlinkSync(path.join(dayPath, file));
                                deletedCount++;
                            });
                            fs.rmdirSync(dayPath);
                        }
                    }
                }
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up images:', error);
            return 0;
        }
    }

    // Get base64 image (for backward compatibility with frontend)
    getImageAsBase64(imagePath) {
        try {
            const imageBuffer = this.getImage(imagePath);
            if (!imageBuffer) return null;

            return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Error converting image to base64:', error);
            return null;
        }
    }
}

module.exports = new ImageHandler();
