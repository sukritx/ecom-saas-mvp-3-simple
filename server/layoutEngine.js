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
      width: 800,
      height: 600,
      backgroundColor: '#FFFFFF',
      quality: 90,
      format: 'jpeg'
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
    // TODO: Implement single product layout logic
    // This will handle: centering, padding, background, etc.
    
    throw new Error('Single layout generation not implemented yet');
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
    // TODO: Implement text overlay logic
    // This will handle: fonts, positioning, styling, etc.
    
    throw new Error('Text overlay not implemented yet');
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
   * Analyze product image to find optimal positioning for overlays
   * @param {string} imagePath - Path to the product image
   * @returns {Promise<Object>} - Positioning coordinates for overlays
   */
  async analyzeProductImage(imagePath) {
    try {
      // Load and normalize image to 1080x1080
      const normalizedImage = await sharp(imagePath)
        .resize(1080, 1080, { 
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      // Get pixel data
      const { data, info } = await sharp(normalizedImage)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Find product bounding box by analyzing alpha channel
      let minX = 1080, minY = 1080, maxX = 0, maxY = 0;
      const width = 1080;
      const height = 1080;

      // Analyze pixels with optimization (every 5th pixel)
      for (let y = 0; y < height; y += 5) {
        for (let x = 0; x < width; x += 5) {
          const pixelIndex = (y * width + x) * 4; // RGBA = 4 channels
          const alpha = data[pixelIndex + 3]; // Alpha channel

          // If pixel is visible (not transparent)
          if (alpha > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // Ensure we found some content, otherwise use center area
      if (minX === 1080 && minY === 1080 && maxX === 0 && maxY === 0) {
        minX = 270; minY = 270; maxX = 810; maxY = 810; // Center 60% area
      }

      // Calculate empty zones around the product
      const productWidth = maxX - minX;
      const productHeight = maxY - minY;

      // Define the 4 zones
      const zones = [
        {
          name: 'top',
          x: 0,
          y: 0,
          width: width,
          height: minY,
          area: width * minY
        },
        {
          name: 'bottom',
          x: 0,
          y: maxY,
          width: width,
          height: height - maxY,
          area: width * (height - maxY)
        },
        {
          name: 'left',
          x: 0,
          y: minY,
          width: minX,
          height: productHeight,
          area: minX * productHeight
        },
        {
          name: 'right',
          x: maxX,
          y: minY,
          width: width - maxX,
          height: productHeight,
          area: (width - maxX) * productHeight
        }
      ];

      // Sort zones by largest area
      zones.sort((a, b) => b.area - a.area);

      // Calculate optimal positions as percentages
      const calculatePosition = (zone) => {
        const centerX = (zone.x + zone.width / 2) / width * 100;
        const centerY = (zone.y + zone.height / 2) / height * 100;
        return { x: centerX, y: centerY };
      };

      // Get positions for each zone type
      const pricePosition = calculatePosition(zones[0]);
      const titleBrandPosition = calculatePosition(zones[1]);
      const iconPosition = calculatePosition(zones[2]);

      // Return positioning data in frontend-friendly format
      return {
        success: true,
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
        optimalPositions: {
          price: {
            position: pricePosition,
            zone: zones[0].name,
            area: zones[0].area
          },
          title: {
            position: titleBrandPosition,
            zone: zones[1].name,
            area: zones[1].area
          },
          icon: {
            position: iconPosition,
            zone: zones[2].name,
            area: zones[2].area
          }
        },
        canvasSize: {
          width: 1080,
          height: 1080
        }
      };

    } catch (error) {
      throw new Error(`Failed to analyze product image: ${error.message}`);
    }
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

module.exports = LayoutEngine;
module.exports.analyzeProductImage = analyzeProductImage;