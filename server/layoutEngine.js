const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

/**
 * LayoutEngine - Smart layout logic using Sharp for product image generation
 * 
 * This module will handle:
 * - Different layout templates (single product, collage, banner, etc.)
 * - Image composition and positioning
 * - Background handling and styling
 * - Text overlay capabilities
 * - Smart cropping and resizing
 */
class LayoutEngine {
  constructor() {
    this.defaultOptions = {
      width: 1080,
      height: 1080,
      backgroundColor: '#FFFFFF',
      quality: 90,
      format: 'png'
    };
  }

  /**
   * Generate a single product layout
   * @param {Object} params - Layout parameters
   * @param {string} params.productImage - Path to product image
   * @param {Object} params.options - Layout options
   * @returns {Promise<Buffer>} - Generated image buffer
   */
  async generateSingleLayout(params) {
    try {
      const { productImage, textData, layoutData, icon1File, icon2File } = params;
      const options = { ...this.defaultOptions, ...params.options };
      
      // Start with the product image
      let compositeImage = await sharp(productImage);
      
      // Resize to standard canvas size
      compositeImage = await compositeImage
        .resize(options.width, options.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();
      
      // Prepare text overlay configuration
      const textOverlay = {};
      
      if (textData.discountPrice) {
        // Convert percentage positions to absolute pixels with better accuracy
        const pricePos = layoutData.optimalPositions.price.position;
        const priceX = Math.round((pricePos.x / 100) * options.width);
        const priceY = Math.round((pricePos.y / 100) * options.height);
        
        console.log(`💰 DEBUG: Price position - Original: (${pricePos.x}%, ${pricePos.y}%) -> Pixels: (${priceX}, ${priceY})`);
        
        textOverlay.price = {
          x: priceX,
          y: priceY,
          fontSize: 60, // Increased font size for better visibility
          fontWeight: 'bold',
          color: '#dc2626', // red color
          text: `${textData.discountPrice}`,
          anchor: 'middle'
        };
        
        if (textData.fullPrice) {
          textOverlay.fullPrice = {
            x: priceX,
            y: priceY - 45, // More spacing between prices
            fontSize: 32,
            color: '#6b7280', // gray color
            text: `${textData.fullPrice}`,
            anchor: 'middle'
          };
        }
      }
      
      if (textData.productName || textData.brand) {
        const titleText = textData.productName || textData.brand;
        const titlePos = layoutData.optimalPositions.title.position;
        const titleX = Math.round((titlePos.x / 100) * options.width);
        const titleY = Math.round((titlePos.y / 100) * options.height);
        
        console.log(`📝 DEBUG: Title position - Original: (${titlePos.x}%, ${titlePos.y}%) -> Pixels: (${titleX}, ${titleY})`);
        
        textOverlay.title = {
          x: titleX,
          y: titleY,
          fontSize: 36, // Increased font size
          color: '#000000',
          text: titleText,
          anchor: 'middle'
        };
      }
      
      // Add brand/SKU if available
      if (textData.brand && textData.productName) {
        const brandPos = layoutData.optimalPositions.title.position;
        const brandX = Math.round((brandPos.x / 100) * options.width);
        const brandY = Math.round((brandPos.y / 100) * options.height) + 50; // Below title
        
        console.log(`🏷️ DEBUG: Brand position - Original: (${brandPos.x}%, ${brandPos.y}%) -> Pixels: (${brandX}, ${brandY})`);
        
        textOverlay.brand = {
          x: brandX,
          y: brandY,
          fontSize: 24,
          color: '#374151', // dark gray
          text: textData.brand,
          anchor: 'middle'
        };
      }
      
      // Add text overlay
      if (Object.keys(textOverlay).length > 0) {
        compositeImage = await this.addTextOverlay(compositeImage, textOverlay);
      }
      
      // Add icons if provided
      const compositeLayers = [];
      
      if (icon1File) {
        const iconBuffer = await fs.readFile(icon1File.path);
        const iconResized = await sharp(iconBuffer)
          .resize(60, 60)
          .png()
          .toBuffer();
          
        const iconPos = layoutData.optimalPositions.icon.position;
        const iconX = (iconPos.x / 100) * options.width;
        const iconY = (iconPos.y / 100) * options.height;
        
        compositeLayers.push({
          input: iconResized,
          left: Math.round(iconX - 30), // Center the 60px icon
          top: Math.round(iconY - 30)
        });
      }
      
      // Composite all layers
      if (compositeLayers.length > 0) {
        compositeImage = await sharp(compositeImage)
          .composite(compositeLayers)
          .png()
          .toBuffer();
      }
      
      return compositeImage;
    } catch (error) {
      throw new Error(`Failed to generate single layout: ${error.message}`);
    }
  }

  /**
   * Generate a collage layout with multiple images
   * @param {Object} params - Layout parameters
   * @param {Array} params.images - Array of image paths
   * @param {string} params.layoutType - Type of collage (grid, masonry, etc.)
   * @param {Object} params.options - Layout options
   * @returns {Promise<Buffer>} - Generated image buffer
   */
  async generateCollageLayout(params) {
    // TODO: Implement collage layout logic
    // This will handle: grid positioning, spacing, resizing, etc.
    
    throw new Error('Collage layout generation not implemented yet');
  }

  /**
   * Generate a banner layout
   * @param {Object} params - Layout parameters
   * @param {string} params.productImage - Path to product image
   * @param {string} params.backgroundImage - Optional background image
   * @param {Object} params.options - Layout options
   * @returns {Promise<Buffer>} - Generated image buffer
   */
  async generateBannerLayout(params) {
    // TODO: Implement banner layout logic
    // This will handle: wide format, text areas, branding, etc.
    
    throw new Error('Banner layout generation not implemented yet');
  }

  /**
   * Create a composite image from multiple layers
   * @param {Array} layers - Array of layer objects
   * @param {Object} canvasOptions - Canvas configuration
   * @returns {Promise<Buffer>} - Composed image buffer
   */
  async composeImage(layers, canvasOptions = {}) {
    // TODO: Implement image composition logic
    // This will handle: layering, positioning, blending modes, etc.
    
    throw new Error('Image composition not implemented yet');
  }

  /**
   * Apply smart cropping to an image
   * @param {string} imagePath - Path to input image
   * @param {Object} cropOptions - Cropping options
   * @returns {Promise<Buffer>} - Cropped image buffer
   */
  async smartCrop(imagePath, cropOptions) {
    // TODO: Implement smart cropping logic
    // This will detect focal points, faces, or use AI-based cropping
    
    throw new Error('Smart cropping not implemented yet');
  }

  /**
   * Add text overlay to an image
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} textOptions - Text configuration
   * @returns {Promise<Buffer>} - Image with text overlay
   */
  async addTextOverlay(imageBuffer, textOptions) {
    try {
      let image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      console.log('🎨 DEBUG: Image metadata for SVG overlay:', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      });
      
      // Create SVG overlay with text
      const svgElements = [];
      
      // Helper function to create SVG text element
      const createTextElement = (config, textDecoration = null) => {
        const decorationAttr = textDecoration ? ` text-decoration="${textDecoration}"` : '';
        return `<text x="${config.x}" y="${config.y}" 
                font-family="Arial, sans-serif" font-size="${config.fontSize}" 
                font-weight="${config.fontWeight || 'normal'}" 
                fill="${config.color}" text-anchor="${config.anchor || 'middle'}"${decorationAttr}>${config.text}</text>`;
      };
      
      if (textOptions.price) {
        const priceConfig = textOptions.price;
        svgElements.push(createTextElement(priceConfig));
        console.log(`💰 DEBUG: Added price text: "${priceConfig.text}" at (${priceConfig.x}, ${priceConfig.y})`);
      }
      
      if (textOptions.fullPrice) {
        const fullPriceConfig = textOptions.fullPrice;
        svgElements.push(createTextElement(fullPriceConfig, 'line-through'));
        console.log(`💸 DEBUG: Added full price text: "${fullPriceConfig.text}" at (${fullPriceConfig.x}, ${fullPriceConfig.y})`);
      }
      
      if (textOptions.title) {
        const titleConfig = textOptions.title;
        svgElements.push(createTextElement(titleConfig));
        console.log(`📝 DEBUG: Added title text: "${titleConfig.text}" at (${titleConfig.x}, ${titleConfig.y})`);
      }
      
      if (textOptions.brand) {
        const brandConfig = textOptions.brand;
        svgElements.push(createTextElement(brandConfig));
        console.log(`🏷️ DEBUG: Added brand text: "${brandConfig.text}" at (${brandConfig.x}, ${brandConfig.y})`);
      }
      
      if (svgElements.length === 0) {
        console.log('⚠️ DEBUG: No text elements to add to overlay');
        return imageBuffer; // Return original image if no text
      }
      
      const svgOverlay = `
        <svg width="${metadata.width}" height="${metadata.height}" 
             xmlns="http://www.w3.org/2000/svg">
          <style>
            text { 
              font-family: Arial, sans-serif; 
              dominant-baseline: middle;
            }
          </style>
          ${svgElements.join('\n')}
        </svg>
      `;
      
      console.log(`🎨 DEBUG: Generated SVG with ${svgElements.length} text elements`);
      
      // Composite the text overlay onto the image
      const result = await image
        .composite([{
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }])
        .png()
        .toBuffer();
        
      console.log('✅ DEBUG: Text overlay composite completed successfully');
      return result;
    } catch (error) {
      console.error('❌ DEBUG: Text overlay failed:', error);
      throw new Error(`Failed to add text overlay: ${error.message}`);
    }
  }

  /**
   * Resize image with smart aspect ratio handling
   * @param {string} imagePath - Path to input image
   * @param {Object} resizeOptions - Resize configuration
   * @returns {Promise<Buffer>} - Resized image buffer
   */
  async smartResize(imagePath, resizeOptions) {
    // TODO: Implement smart resize logic
    // This will maintain aspect ratios, add padding, etc.
    
    throw new Error('Smart resize not implemented yet');
  }

  /**
   * Apply filters and effects to an image
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} filterOptions - Filter configuration
   * @returns {Promise<Buffer>} - Filtered image buffer
   */
  async applyEffects(imageBuffer, filterOptions) {
    // TODO: Implement effects logic
    // This will handle: brightness, contrast, blur, etc.
    
    throw new Error('Effects not implemented yet');
  }
  /**
   * Enhanced product image analysis with multiple detection methods
   * @param {string} imagePath - Path to the product image
   * @returns {Promise<Object>} - Positioning coordinates for overlays
   */
  async analyzeProductImage(imagePath) {
    try {
      console.log('🔍 DEBUG: Starting enhanced image analysis...');
      
      // Method 1: Try enhanced boundary detection
      const result1 = await this.detectBoundariesEnhanced(imagePath);
      if (result1.confidence > 0.7) {
        console.log('✅ DEBUG: Enhanced detection successful with high confidence');
        return result1;
      }

      // Method 2: Try adaptive edge detection
      console.log('🔍 DEBUG: Trying adaptive edge detection...');
      const result2 = await this.detectBoundariesAdaptive(imagePath);
      if (result2.confidence > 0.6) {
        console.log('✅ DEBUG: Adaptive detection successful');
        return result2;
      }

      // Method 3: Try color-based segmentation
      console.log('🔍 DEBUG: Trying color-based segmentation...');
      const result3 = await this.detectBoundariesColorSegmentation(imagePath);
      if (result3.confidence > 0.5) {
        console.log('✅ DEBUG: Color segmentation successful');
        return result3;
      }

      // Fallback: Safe grid-based positioning
      console.log('⚠️ DEBUG: All detection methods failed, using safe grid fallback');
      return this.createSafeGridPositioning();

    } catch (error) {
      console.error('❌ DEBUG: Enhanced analysis failed:', error);
      // Final fallback
      return this.createSafeGridPositioning();
    }
  }

  /**
   * Enhanced boundary detection with multiple strategies
   */
  async detectBoundariesEnhanced(imagePath) {
    const result = await this.detectBoundariesAdaptive(imagePath);
    
    // Add safety margins to prevent text from falling off edges
    const safeBounds = this.applySafetyMargins(result);
    
    return {
      ...result,
      ...safeBounds,
      confidence: Math.min(result.confidence * 1.2, 1.0),
      method: 'enhanced_with_safety'
    };
  }

  /**
   * Adaptive edge detection with multiple tolerance levels
   */
  async detectBoundariesAdaptive(imagePath) {
    const normalizedImage = await sharp(imagePath)
      .resize(1080, 1080, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    const { data } = await sharp(normalizedImage)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = 1080;
    const height = 1080;
    const hasAlpha = data.some((_, index) => index % 4 === 3 && data[index] < 255);

    let minX = width, maxX = 0, minY = height, maxY = 0;
    let detectionMethod = 'none';
    let confidence = 0;

    if (hasAlpha) {
      // PNG with transparency - most reliable
      detectionMethod = 'alpha_detection';
      for (let y = 0; y < height; y += 3) {
        for (let x = 0; x < width; x += 3) {
          const pixelIndex = (y * width + x) * 4;
          const alpha = data[pixelIndex + 3];
          if (alpha > 10) { // Lower threshold for better detection
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      confidence = 0.9;
    } else {
      // Try multiple tolerance levels for JPG
      const tolerances = [20, 30, 40, 50];
      let bestResult = null;
      let bestScore = 0;

      for (const tolerance of tolerances) {
        const result = this.analyzeWithTolerance(data, width, height, tolerance);
        const score = this.evaluateBoundaryQuality(result, width, height);
        
        if (score > bestScore) {
          bestScore = score;
          bestResult = result;
        }
      }

      if (bestResult) {
        minX = bestResult.minX;
        maxX = bestResult.maxX;
        minY = bestResult.minY;
        maxY = bestResult.maxY;
        detectionMethod = `adaptive_tolerance_${bestScore > 0.7 ? 'high' : 'medium'}`;
        confidence = bestScore;
      }
    }

    // Validate results
    const productWidth = maxX - minX;
    const productHeight = maxY - minY;
    const productArea = productWidth * productHeight;
    const totalArea = width * height;
    const areaRatio = productArea / totalArea;

    // Check if detection makes sense
    if (areaRatio < 0.01 || areaRatio > 0.95) {
      console.log(`⚠️ DEBUG: Boundary detection suspicious - area ratio: ${areaRatio}`);
      confidence *= 0.5;
    }

    // Apply safety margins
    const margin = Math.max(20, Math.min(width, height) * 0.05); // 5% or 20px minimum
    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(width, maxX + margin);
    maxY = Math.min(height, maxY + margin);

    console.log(`🎯 DEBUG: Enhanced detection - Method: ${detectionMethod}, Confidence: ${confidence.toFixed(2)}`);

    return this.createPositioningResult(
      { minX, minY, maxX, maxY, width, height },
      detectionMethod,
      confidence
    );
  }

  /**
   * Analyze boundaries with specific tolerance
   */
  analyzeWithTolerance(data, width, height, tolerance) {
    let minX = width, minY = height, maxX = 0, maxY = 0;

    // Sample background colors from multiple edge regions
    const bgSamples = [];
    
    // Top edge
    for (let x = 0; x < width; x += 20) {
      const idx = (0 * width + x) * 4;
      bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    
    // Bottom edge
    for (let x = 0; x < width; x += 20) {
      const idx = ((height - 1) * width + x) * 4;
      bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    
    // Left edge
    for (let y = 0; y < height; y += 20) {
      const idx = (y * width + 0) * 4;
      bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    
    // Right edge
    for (let y = 0; y < height; y += 20) {
      const idx = (y * width + (width - 1)) * 4;
      bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    // Calculate dominant background color
    const avgBg = bgSamples.reduce((sum, color) => [
      sum[0] + color[0],
      sum[1] + color[1], 
      sum[2] + color[2]
    ], [0, 0, 0]).map(sum => Math.round(sum / bgSamples.length));

    // Find product boundaries
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        const diff = Math.sqrt(
          Math.pow(r - avgBg[0], 2) +
          Math.pow(g - avgBg[1], 2) +
          Math.pow(b - avgBg[2], 2)
        );
        
        if (diff > tolerance) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Evaluate boundary detection quality
   */
  evaluateBoundaryQuality(result, width, height) {
    const { minX, minY, maxX, maxY } = result;
    const productWidth = maxX - minX;
    const productHeight = maxY - minY;
    
    // Check for reasonable boundaries
    if (minX >= maxX || minY >= maxY) return 0;
    
    // Check area合理性
    const productArea = productWidth * productHeight;
    const totalArea = width * height;
    const areaRatio = productArea / totalArea;
    
    // Good ratios are between 5% and 85%
    if (areaRatio < 0.05 || areaRatio > 0.85) return 0.3;
    
    // Check for reasonable aspect ratio (not too extreme)
    const aspectRatio = productWidth / productHeight;
    if (aspectRatio < 0.1 || aspectRatio > 10) return 0.5;
    
    // Bonus for reasonable sizes
    let score = 0.7;
    if (areaRatio > 0.1 && areaRatio < 0.7) score += 0.2;
    if (aspectRatio > 0.3 && aspectRatio < 3.0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Color-based segmentation for complex backgrounds
   */
  async detectBoundariesColorSegmentation(imagePath) {
    const metadata = await sharp(imagePath).metadata();
    
    // Simple color-based approach for now
    // In a real implementation, this could use more sophisticated segmentation
    return {
      success: true,
      method: 'color_segmentation',
      confidence: 0.4,
      optimalPositions: {
        price: { position: { x: 50, y: 80 }, zone: 'bottom' },
        title: { position: { x: 50, y: 15 }, zone: 'top' },
        icon: { position: { x: 85, y: 25 }, zone: 'top-right' }
      },
      canvasSize: { width: 1080, height: 1080 }
    };
  }

  /**
   * Apply safety margins to prevent text from falling off edges
   */
  applySafetyMargins(result) {
    const { minX, minY, maxX, maxY, width, height } = result;
    const margin = Math.max(30, Math.min(width, height) * 0.08); // 8% or 30px
    
    const safeBounds = {
      minX: Math.max(0, minX - margin),
      minY: Math.max(0, minY - margin),
      maxX: Math.min(width, maxX + margin),
      maxY: Math.min(height, maxY + margin)
    };

    console.log(`🛡️ DEBUG: Applied safety margins: ${margin}px`);
    return { safeBounds };
  }

  /**
   * Create safe grid-based positioning as ultimate fallback
   */
  createSafeGridPositioning() {
    console.log('🛡️ DEBUG: Creating safe grid positioning');
    
    return {
      success: true,
      method: 'safe_grid_fallback',
      confidence: 0.3,
      optimalPositions: {
        price: { 
          position: { x: 50, y: 85 }, 
          zone: 'bottom',
          safetyMargin: true
        },
        title: { 
          position: { x: 50, y: 12 }, 
          zone: 'top',
          safetyMargin: true
        },
        icon: { 
          position: { x: 82, y: 20 }, 
          zone: 'top-right',
          safetyMargin: true
        }
      },
      canvasSize: { width: 1080, height: 1080 },
      zones: [
        { name: 'top', area: 1080 * 130, percentage: 12 },
        { name: 'bottom', area: 1080 * 162, percentage: 15 },
        { name: 'right', area: 162 * 648, percentage: 9.6 }
      ]
    };
  }

  /**
   * Create final positioning result
   */
  createPositioningResult(bounds, method, confidence) {
    const { minX, minY, maxX, maxY, width, height } = bounds;
    const productWidth = maxX - minX;
    const productHeight = maxY - minY;

    // Calculate zones with enhanced logic
    const zones = this.calculateOptimalZones({ minX, minY, maxX, maxY, width, height });
    
    // Intelligent positioning based on zones
    const positions = this.calculateIntelligentPositions(zones, productWidth, productHeight);

    return {
      success: true,
      method: method,
      confidence: confidence,
      productBounds: {
        minX: minX / width * 100,
        minY: minY / height * 100,
        maxX: maxX / width * 100,
        maxY: maxY / height * 100,
        width: productWidth / width * 100,
        height: productHeight / height * 100
      },
      zones: zones.map(zone => ({
        name: zone.name,
        area: zone.area,
        percentage: zone.area / (width * height) * 100,
        position: {
          x: zone.x / width * 100,
          y: zone.y / height * 100,
          width: zone.width / width * 100,
          height: zone.height / height * 100
        }
      })),
      optimalPositions: positions,
      canvasSize: { width: 1080, height: 1080 }
    };
  }

  /**
   * Calculate optimal zones with intelligent positioning
   */
  calculateOptimalZones(bounds) {
    const { minX, minY, maxX, maxY, width, height } = bounds;
    
    const zones = [
      {
        name: 'top',
        x: 0,
        y: 0,
        width: width,
        height: minY,
        area: width * minY,
        optimalX: width / 2,
        optimalY: Math.max(minY * 0.4, 80)
      },
      {
        name: 'bottom',
        x: 0,
        y: maxY,
        width: width,
        height: height - maxY,
        area: width * (height - maxY),
        optimalX: width / 2,
        optimalY: maxY + (height - maxY) * 0.4
      },
      {
        name: 'left',
        x: 0,
        y: minY,
        width: minX,
        height: maxY - minY,
        area: minX * (maxY - minY),
        optimalX: Math.max(minX * 0.6, 100),
        optimalY: minY + (maxY - minY) / 2
      },
      {
        name: 'right',
        x: maxX,
        y: minY,
        width: width - maxX,
        height: maxY - minY,
        area: (width - maxX) * (maxY - minY),
        optimalX: maxX + (width - maxX) * 0.4,
        optimalY: minY + (maxY - minY) / 2
      }
    ];

    return zones.sort((a, b) => b.area - a.area);
  }

  /**
   * Calculate intelligent text positions
   */
  calculateIntelligentPositions(zones, productWidth, productHeight) {
    const width = 1080, height = 1080;
    
    // Price in largest zone (usually bottom)
    const pricePos = {
      position: { 
        x: zones[0].optimalX / width * 100, 
        y: zones[0].optimalY / height * 100 
      },
      zone: zones[0].name,
      area: zones[0].area
    };
    
    // Title in second largest zone (usually top)
    const titlePos = {
      position: { 
        x: zones[1].optimalX / width * 100, 
        y: zones[1].optimalY / height * 100 
      },
      zone: zones[1].name,
      area: zones[1].area
    };
    
    // Icon in third zone (usually side)
    const iconPos = {
      position: { 
        x: zones[2].optimalX / width * 100, 
        y: zones[2].optimalY / height * 100 
      },
      zone: zones[2].name,
      area: zones[2].area
    };

    return {
      price: pricePos,
      title: titlePos,
      icon: iconPos
    };
  }

  /**
   * Get image metadata
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} - Image metadata
   */
  async getImageMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      throw new Error(`Failed to get metadata for ${imagePath}: ${error.message}`);
    }
  }

  /**
   * Validate image file
   * @param {string} imagePath - Path to image file
   * @returns {Promise<boolean>} - True if valid image
   */
  async validateImage(imagePath) {
    try {
      await sharp(imagePath).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a canvas with background
   * @param {Object} canvasOptions - Canvas configuration
   * @returns {Promise<Buffer>} - Canvas buffer
   */
  async createCanvas(canvasOptions = {}) {
    const options = { ...this.defaultOptions, ...canvasOptions };
    
    const canvas = sharp({
      create: {
        width: options.width,
        height: options.height,
        channels: 4,
        background: options.backgroundColor
      }
    });

    return await canvas.png().toBuffer();
  }

  /**
   * Get layout templates
   * @returns {Array} - Available layout templates
   */
  getLayoutTemplates() {
    return [
      { id: 'single', name: 'Single Product', description: 'Single product centered with background' },
      { id: 'collage-grid', name: 'Grid Collage', description: 'Multiple products in grid layout' },
      { id: 'collage-masonry', name: 'Masonry Collage', description: 'Pinterest-style masonry layout' },
      { id: 'banner', name: 'Banner', description: 'Wide banner format for headers' },
      { id: 'lifestyle', name: 'Lifestyle', description: 'Product in lifestyle setting' }
    ];
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.mlEngine.cleanup();
      console.log('🧹 DEBUG: LayoutEngine cleanup completed');
    } catch (error) {
      console.error('⚠️ DEBUG: Error during LayoutEngine cleanup:', error);
    }
  }
}

/**
 * Standalone function for analyzing product images
 * @param {string} imagePath - Path to the product image
 * @returns {Promise<Object>} - Positioning coordinates for overlays
 */
async function analyzeProductImage(imagePath) {
  const layoutEngine = new LayoutEngine();
  return await layoutEngine.analyzeProductImage(imagePath);
}

/**
 * Standalone function for generating composite product image
 * @param {Object} params - Generation parameters
 * @param {string} params.productImagePath - Path to product image
 * @param {Object} params.textData - Text data for overlays
 * @param {Object} params.layoutData - Layout positioning data
 * @param {Object} params.icon1File - First icon file (optional)
 * @param {Object} params.icon2File - Second icon file (optional)
 * @returns {Promise<Buffer>} - Generated composite image buffer
 */
async function generateCompositeImage(params) {
  const layoutEngine = new LayoutEngine();
  return await layoutEngine.generateSingleLayout(params);
}

module.exports = LayoutEngine;
module.exports.analyzeProductImage = analyzeProductImage;
module.exports.generateCompositeImage = generateCompositeImage;