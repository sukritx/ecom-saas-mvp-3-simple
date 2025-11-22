const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const { analyzeProductImage, generateCompositeImage } = require('./layoutEngine');
const { analyzeWithML } = require('./mlLayoutEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.ensureDirSync(UPLOADS_DIR);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads with automatic directory creation
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Create uploads directory if it doesn't exist
      await fs.ensureDir(UPLOADS_DIR);
      cb(null, UPLOADS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate timestamp-based filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${sanitizedBasename}-${timestamp}-${randomSuffix}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Configure upload fields for productImage, icon1, and icon2
const productUpload = upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'icon1', maxCount: 1 },
  { name: 'icon2', maxCount: 1 }
]);

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Product Image Generator Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify image accessibility
app.get('/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(UPLOADS_DIR, filename);
  
  if (fs.existsSync(imagePath)) {
    res.json({ 
      exists: true, 
      filename: filename,
      url: `/uploads/${filename}`,
      serverTime: new Date().toISOString()
    });
  } else {
    res.status(404).json({ 
      exists: false, 
      filename: filename,
      message: 'Image not found'
    });
  }
});

// API Endpoint: POST /api/generate-final
app.post('/api/generate-final', productUpload, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['sku', 'brand', 'productName', 'fullPrice'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Validate that product image was uploaded
    if (!req.files || !req.files.productImage) {
      return res.status(400).json({
        success: false,
        error: 'Product image is required'
      });
    }

    // Extract form data
    const textData = {
      sku: req.body.sku,
      brand: req.body.brand,
      productName: req.body.productName,
      fullPrice: req.body.fullPrice,
      discountPrice: req.body.discountPrice || null,
      percentOff: req.body.percentOff || null
    };

    // Get uploaded file paths
    const productImageFile = req.files.productImage[0];
    const icon1File = req.files.icon1 ? req.files.icon1[0] : null;
    const icon2File = req.files.icon2 ? req.files.icon2[0] : null;

    // Build image URLs for uploaded files
    const imageUrls = {
      productImage: `/uploads/${productImageFile.filename}`,
      icon1: icon1File ? `/uploads/${icon1File.filename}` : null,
      icon2: icon2File ? `/uploads/${icon2File.filename}` : null
    };

    // Analyze product image for positioning using ML detection
    const productImagePath = path.join(UPLOADS_DIR, productImageFile.filename);
    const layoutData = await analyzeWithML(productImagePath);

    // Generate the final composite image
    const compositeImageBuffer = await generateCompositeImage({
      productImage: productImagePath,
      textData: textData,
      layoutData: layoutData,
      icon1File: icon1File,
      icon2File: icon2File
    });

    // Generate filename for the final composite image
    const timestamp = Date.now();
    const finalImageFilename = `composite-${productImageFile.filename.replace(/\.[^/.]+$/, "")}-${timestamp}.png`;
    const finalImagePath = path.join(UPLOADS_DIR, finalImageFilename);

    // Save the composite image
    await fs.writeFile(finalImagePath, compositeImageBuffer);

    console.log('🎨 DEBUG: Final composite image generated:', finalImageFilename);

    // Return successful response with the final image URL
    res.json({
      success: true,
      textData: textData,
      imageUrls: imageUrls,
      finalImageUrl: `/uploads/${finalImageFilename}`,
      aiDebug: {
        detected: layoutData.detectedLabel,
        confidence: layoutData.confidence,
        method: layoutData.method
      },
      layoutStrategy: {
        coordinates: layoutData.optimalPositions,
        productBounds: layoutData.productBounds,
        zones: layoutData.zones,
        canvasSize: layoutData.canvasSize
      },
      message: 'Final composite image generated successfully'
    });

  } catch (error) {
    console.error('Error in /api/generate-final:', error);
    res.status(500).json({
      success: false,
      error: 'Final image generation failed',
      details: error.message
    });
  }
});

// API Endpoint: POST /api/generate
app.post('/api/generate', productUpload, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['sku', 'brand', 'productName', 'fullPrice'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Validate that product image was uploaded
    if (!req.files || !req.files.productImage) {
      return res.status(400).json({
        success: false,
        error: 'Product image is required'
      });
    }

    // Extract form data
    const textData = {
      sku: req.body.sku,
      brand: req.body.brand,
      productName: req.body.productName,
      fullPrice: req.body.fullPrice,
      discountPrice: req.body.discountPrice || null,
      percentOff: req.body.percentOff || null
    };

    // Get uploaded file paths
    const productImageFile = req.files.productImage[0];
    const icon1File = req.files.icon1 ? req.files.icon1[0] : null;
    const icon2File = req.files.icon2 ? req.files.icon2[0] : null;

    // Build image URLs
    const imageUrls = {
      productImage: `/uploads/${productImageFile.filename}`,
      icon1: icon1File ? `/uploads/${icon1File.filename}` : null,
      icon2: icon2File ? `/uploads/${icon2File.filename}` : null
    };

    // Use ML Analysis to analyze product image for positioning
    const productImagePath = path.join(UPLOADS_DIR, productImageFile.filename);
    const layoutData = await analyzeWithML(productImagePath);

    // Generate the final composite image
    const compositeImageBuffer = await generateCompositeImage({
      productImage: productImagePath,
      textData: textData,
      layoutData: layoutData,
      icon1File: icon1File,
      icon2File: icon2File
    });

    // Generate filename for the final composite image
    const timestamp = Date.now();
    const finalImageFilename = `composite-${productImageFile.filename.replace(/\.[^/.]+$/, "")}-${timestamp}.png`;
    const finalImagePath = path.join(UPLOADS_DIR, finalImageFilename);

    // Save the composite image
    await fs.writeFile(finalImagePath, compositeImageBuffer);

    console.log('🎨 DEBUG: Final composite image generated:', finalImageFilename);

    // Log the response data for debugging
    const responseData = {
      success: true,
      textData: textData,
      imageUrls: imageUrls,
      finalImageUrl: `/uploads/${finalImageFilename}`,
      aiDebug: {
        detected: layoutData.detectedLabel,
        confidence: layoutData.confidence,
        method: layoutData.method
      },
      layoutStrategy: {
        coordinates: layoutData.optimalPositions,
        productBounds: layoutData.productBounds,
        zones: layoutData.zones,
        canvasSize: layoutData.canvasSize
      },
      message: 'Product analyzed and final composite image generated successfully'
    };
    
    console.log('🔍 DEBUG: Server Response Data:', JSON.stringify(responseData, null, 2));
    console.log('📁 DEBUG: Product image uploaded to:', imageUrls.productImage);
    console.log('🎨 DEBUG: Final composite image saved as:', finalImageFilename);
    
    // Return successful response with layout strategy, file URLs, and final image
    res.json(responseData);

  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({
      success: false,
      error: 'Generation failed',
      details: error.message
    });
  }
});

// List uploaded files
app.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const fileList = files.map(filename => ({
      filename,
      url: `/uploads/${filename}`,
      size: fs.statSync(path.join(UPLOADS_DIR, filename)).size
    }));
    
    res.json({ files: fileList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Product Image Generator Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📸 Image Generation API: http://localhost:${PORT}/api/generate`);
});