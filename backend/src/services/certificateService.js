// Try to load canvas, but handle gracefully if not installed
let createCanvas, loadImage, registerFont;
let canvasAvailable = false;

try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
    registerFont = canvas.registerFont;
    canvasAvailable = true;
    console.log('✅ Canvas library loaded successfully');
} catch (error) {
    console.error('❌ Canvas library not available:', error.message);
    console.error('⚠️ Certificate generation will fail until canvas is installed.');
    console.error('💡 Install with: npm install canvas');
}

const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/db');

/**
 * Generate a personalized certificate for a student
 * @param {Object} leadData - Lead data including name, course, enrollment_id
 * @returns {Promise<Buffer>} - Certificate image buffer
 */
async function generateCertificate(leadData) {
    try {
        console.log('🔧 Starting certificate generation...');

        // Check if canvas is available
        if (!canvasAvailable) {
            throw new Error('Canvas library is not installed. Please run: npm install canvas');
        }

        console.log('📋 Lead data:', {
            name: leadData.name,
            course_name: leadData.course_name,
            enrollment_id: leadData.enrollment_id
        });

        const { name, course_name, enrollment_id, created_at } = leadData;

        // Validate required fields
        if (!name) throw new Error('Student name is required');
        if (!course_name) throw new Error('Course name is required');
        if (!enrollment_id) throw new Error('Enrollment ID is required');

        // Try multiple possible template locations
        const possiblePaths = [
            process.env.CERTIFICATE_TEMPLATE_PATH, // User defined path from .env
            path.join(process.cwd(), 'uploads/certificate-template.jpg'), // Top level uploads
            path.join(__dirname, '../../uploads/certificate-template.jpg'), // Relative to this file
            path.join(__dirname, '../assets/certificate-template.jpg'), // Relative to this file
            '/home/zen/backend/uploads/certificate-template.jpg', // Specific server path
            path.join(process.cwd(), 'Frontend/dist/certificate-template.jpg'),
            path.join(process.cwd(), '../Frontend/dist/certificate-template.jpg'),
            path.join(__dirname, '../../../Frontend/dist/certificate-template.jpg')
        ].filter(Boolean);

        let actualTemplatePath = null;
        for (const p of possiblePaths) {
            try {
                const absolutePath = path.isAbsolute(p) ? p : path.resolve(p);
                await fs.access(absolutePath);
                actualTemplatePath = absolutePath;
                console.log('✅ Certificate template found at:', absolutePath);
                break;
            } catch (err) {
                // Silently skip if not found
                continue;
            }
        }

        if (!actualTemplatePath) {
            const checkedPaths = possiblePaths.map(p => path.resolve(p)).join(', ');
            console.error('❌ Failed to find certificate template. Checked:', checkedPaths);
            throw new Error(`Certificate template not found. We checked: ${checkedPaths}. Please ensure the file exists in the backend 'uploads' folder.`);
        }

        console.log('📄 Loading image from:', actualTemplatePath);
        const image = await loadImage(actualTemplatePath);
        console.log(`✅ Image loaded successfully: ${image.width}x${image.height}px`);

        // Create canvas with same dimensions as template
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        console.log('✅ Canvas created');

        // Draw the template
        ctx.drawImage(image, 0, 0);

        // Calculate precise positioning
        const contentCenterX = image.width * 0.685;

        // Set text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Student Name (BOLD, large, matching template font) - positioned on template's underline
        ctx.font = 'bold 60px "Segoe UI", "Montserrat", "Poppins", sans-serif';
        ctx.fillStyle = '#2d3e50';
        const nameY = image.height * 0.445; // Moved down slightly to sit on the line
        ctx.fillText(name.toUpperCase(), contentCenterX, nameY);

        // Course Name (BOLD, large, positioned in "in [course]" area)
        ctx.font = 'bold 48px "Segoe UI", "Montserrat", "Poppins", sans-serif';
        ctx.fillStyle = '#2d3e50';
        const courseY = image.height * 0.57; // Moved down to clear "for successful completion of"
        ctx.fillText(course_name.toUpperCase(), contentCenterX, courseY);

        // Enrollment ID (positioned right after "UC:" on same line, same size)
        ctx.textAlign = 'left'; // Change alignment to left for enrollment ID
        ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline to align with "UC:" text
        ctx.font = 'bold 36px "Montserrat", "Poppins", "Segoe UI", sans-serif'; // Same size as "UC:" text
        ctx.fillStyle = '#757575'; // Lighter gray color to differentiate from name and course
        // "UC:" is in the template at bottom left, position enrollment ID right after it on the same line
        // Calculate position: UC starts at ~5% from left edge, measure "UC: " to find where ID should start
        const ucStartX = image.width * 0.05; // "UC:" X position - adjusted to match template position (5% from left)
        const enrollmentY = image.height * 0.92; // Y position - aligned with "UC:" baseline on same horizontal line
        // Measure "UC: " width to position enrollment ID right after it
        const ucTextWidth = ctx.measureText('UC: ').width;
        const enrollmentX = ucStartX + ucTextWidth + 50; // Position right after "UC: " with clear gap
        ctx.fillText(`${enrollment_id}`, enrollmentX, enrollmentY);
        ctx.textAlign = 'center'; // Reset to center for other elements
        ctx.textBaseline = 'middle'; // Reset baseline to middle

        console.log('✅ Text overlay completed');

        // Convert canvas to buffer
        console.log('🔄 Converting canvas to buffer...');
        const buffer = canvas.toBuffer('image/png');
        console.log(`✅ Certificate buffer created: ${buffer.length} bytes`);

        return buffer;
    } catch (error) {
        console.error('❌ Error in generateCertificate:', error);
        console.error('Error stack:', error.stack);

        // Check if it's a canvas library issue
        if (error.message && error.message.includes('Cannot find module')) {
            throw new Error('Canvas library not installed. Run: npm install canvas');
        }

        throw error;
    }
}

/**
 * Generate certificate and save to database/file system
 * @param {number} leadId - Lead ID
 * @returns {Promise<Object>} - Certificate data including file path
 */
async function generateAndSaveCertificate(leadId) {
    try {
        console.log(`\n====== Starting Certificate Generation for Lead ID: ${leadId} ======`);

        // Fetch lead data
        const leadQuery = `
      SELECT 
        l.lead_id,
        l.name,
        l.email,
        l.mobile_number,
        l.country_code,
        l.enrollment_id,
        l.created_at,
        c.course_name
      FROM leads l
      LEFT JOIN course c ON l.course_id = c.course_id
      WHERE l.lead_id = $1
    `;

        console.log('🔍 Fetching lead data from database...');
        const result = await pool.query(leadQuery, [leadId]);

        if (result.rowCount === 0) {
            console.error(`❌ Lead not found with ID: ${leadId}`);
            throw new Error('Lead not found');
        }

        const leadData = result.rows[0];
        console.log('✅ Lead data fetched:', {
            name: leadData.name,
            email: leadData.email,
            course_name: leadData.course_name,
            enrollment_id: leadData.enrollment_id
        });

        // Check if lead has required data
        if (!leadData.name) {
            console.error('❌ Missing required field: name');
            throw new Error('Lead is missing name for certificate generation');
        }
        if (!leadData.course_name) {
            console.error('❌ Missing required field: course_name');
            throw new Error('Lead is missing course name for certificate generation');
        }
        if (!leadData.enrollment_id) {
            console.error('❌ Missing required field: enrollment_id');
            throw new Error('Lead is missing enrollment ID for certificate generation');
        }
        if (!leadData.email) {
            console.error('❌ Missing required field: email');
            throw new Error('Lead is missing email for certificate generation');
        }

        console.log('✅ All required fields present');

        // Generate certificate
        console.log('🎨 Generating certificate image...');
        const certificateBuffer = await generateCertificate(leadData);
        console.log(`✅ Certificate image generated: ${certificateBuffer.length} bytes`);

        // Create certificates directory if it doesn't exist
        const certificatesDir = path.join(__dirname, '../../uploads/certificates');
        console.log('📁 Ensuring certificates directory exists:', certificatesDir);
        await fs.mkdir(certificatesDir, { recursive: true });
        console.log('✅ Directory ready');

        // Save certificate to file system
        const fileName = `certificate_${leadData.enrollment_id}_${Date.now()}.png`;
        const filePath = path.join(certificatesDir, fileName);
        console.log('💾 Saving certificate to:', filePath);
        await fs.writeFile(filePath, certificateBuffer);

        console.log(`✅ Certificate generated and saved for ${leadData.name}: ${fileName}`);

        // Save certificate record to database
        console.log('💾 Saving certificate record to database...');
        const insertQuery = `
            INSERT INTO certificates (
                lead_id, 
                enrollment_id, 
                student_name, 
                course_name, 
                certificate_path, 
                file_name,
                generated_at,
                sent_via_email
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, true)
            RETURNING certificate_id, generated_at
        `;

        const insertResult = await pool.query(insertQuery, [
            leadData.lead_id,
            leadData.enrollment_id,
            leadData.name,
            leadData.course_name,
            filePath,
            fileName
        ]);

        const certificateRecord = insertResult.rows[0];
        console.log(`✅ Certificate record saved with ID: ${certificateRecord.certificate_id}`);
        console.log('====== Certificate Generation Complete! ======\n');

        return {
            leadId: leadData.lead_id,
            name: leadData.name,
            email: leadData.email,
            mobile: `${leadData.country_code}${leadData.mobile_number}`,
            enrollmentId: leadData.enrollment_id,
            courseName: leadData.course_name,
            certificatePath: filePath,
            certificateBuffer: certificateBuffer,
            fileName: fileName,
            certificateId: certificateRecord.certificate_id,
            generatedAt: certificateRecord.generated_at
        };
    } catch (error) {
        console.error('\n❌ ====== Certificate Generation FAILED ======');
        console.error('Error in generateAndSaveCertificate:', error.message);
        console.error('Error stack:', error.stack);
        console.error('====== End Error ======\n');
        throw error;
    }
}

module.exports = {
    generateCertificate,
    generateAndSaveCertificate
};
