const QRCode = require('qrcode')
const { cloudinary } = require('./upload')

/**
 * Generate a QR code image from `text` and upload it to Cloudinary.
 * @param {string} text  - The value to encode (e.g. "MERAS-U42")
 * @returns {Promise<string>} Cloudinary secure_url of the QR image
 */
async function generateAndUploadQR(text) {
    // Generate QR as a PNG buffer (300×300, no padding waste)
    const buffer = await QRCode.toBuffer(text, {
        type: 'png',
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
    })

    // Upload buffer to Cloudinary as a base64 data-URI
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`
    const result = await cloudinary.uploader.upload(base64, {
        folder: 'meras/qrcodes',
        public_id: `qr_${text.replace(/[^a-zA-Z0-9]/g, '_')}`,
        overwrite: true,
        resource_type: 'image',
    })

    return result.secure_url
}

module.exports = { generateAndUploadQR }
