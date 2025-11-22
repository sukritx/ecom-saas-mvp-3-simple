const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const cocoSsd = require('@tensorflow-models/coco-ssd');

/**
 * ML-Powered Product Image Positioning System
 * Uses TensorFlow.js and COCO-SSD model for intelligent text placement
 */
class MLPositioningEngine {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
  }

  /**
   * Load the COCO-SSD object detection model
   */
  async loadModel() {
    try {
      if (!this.isModelLoaded) {
        console.log('🤖 DEBUG: Loading TensorFlow.js COCO-SSD model...');
        this.model = await cocoSsd.load();
        this.isModelLoaded = true;
        console.log('✅ DEBUG: TensorFlow.js model loaded successfully');
      }
      return this.model;
    } catch (error) {
      console.error('❌ DEBUG: Failed to load TensorFlow.js model:', error);
      throw new Error(`Failed to load ML model: ${error.message}`);
    }
  }

  /**
   * Detect product boundaries using ML object detection
   * @param {string} imagePath - Path to the product image
   * @returns {Promise<Object>} - ML-detected product boundaries
   */
  async detectProductBoundaries(imagePath) {
    try {
      await this.loadModel();
      
      // Load and preprocess image for ML model
      const imageBuffer = await sharp(imagePath)
        .resize(640, 640, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg()
        .toBuffer();

      // Convert buffer to tensor
      const imageTensor = tf.node.decodeImage(imageBuffer, 3);
      
      console.log('🔍 DEBUG: Running ML object detection...');
      
      // Run object detection
      const predictions = await this.model.detect(imageTensor);
      
      // Clean up tensor
      imageTensor.dispose();
      
      console.log('🎯 DEBUG: ML predictions:', predictions.map(p => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox
      })));

      // Filter relevant predictions (likely products)
      const productPredictions = predictions.filter(pred => 
        pred.score > 0.5 && 
        ['bottle', 'cup', 'book', 'cell phone', 'laptop', 'mouse', 'keyboard', 'clock', 'camera'].includes(pred.class)
      );

      if (productPredictions.length === 0) {
        console.log('⚠️ DEBUG: No product objects detected, falling back to largest prediction');
        // Fallback to highest confidence prediction
        const fallback = predictions.reduce((prev, current) => 
          prev.score > current.score ? prev : current
        );
        if (fallback) {
          productPredictions.push(fallback);
        }
      }

      if (productPredictions.length === 0) {
        throw new Error('No objects detected in image');
      }

      // Use the product with highest confidence
      const bestPrediction = productPredictions.reduce((prev, current) => 
        prev.score > current.score ? prev : current
      );

      // Convert ML coordinates (0-1 relative) to pixel coordinates (640x640)
      const [x, y, width, height] = bestPrediction.bbox;
      const mlBounds = {
        minX: x * 640,
        minY: y * 640,
        maxX: (x + width) * 640,
        maxY: (y + height) * 640,
        confidence: bestPrediction.score,
        class: bestPrediction.class
      };

      console.log('🎯 DEBUG: ML-detected product boundaries:', mlBounds);

      return mlBounds;

    } catch (error) {
      console.error('❌ DEBUG: ML boundary detection failed:', error);
      throw new Error(`ML boundary detection failed: ${error.message}`);
    }
  }

  /**
   * Calculate optimal text positions using ML insights
   * @param {Object} mlBounds - ML-detected boundaries
   * @param {Object} imageInfo - Image dimensions
   * @returns {Object} - Optimal text positions
   */
  calculateOptimalPositions(mlBounds, imageInfo = { width: 1080, height: 1080 }) {
    const { width: canvasWidth, height: canvasHeight } = imageInfo;
    const { minX, minY, maxX, maxY, class: objectClass } = mlBounds;

    // Scale ML coordinates to canvas size
    const scaleX = canvasWidth / 640;
    const scaleY = canvasHeight / 640;
    
    const scaledBounds = {
      minX: minX * scaleX,
      minY: minY * scaleY,
      maxX: maxX * scaleX,
      maxY: maxY * scaleY,
      width: (maxX - minX) * scaleX,
      height: (maxY - minY) * scaleY
    };

    console.log('📐 DEBUG: Scaled boundaries:', scaledBounds);

    // ML-powered positioning logic based on object class and boundaries
    let positions;

    if (objectClass === 'bottle' || objectClass === 'cup') {
      // For bottles/cups: title at top, price at bottom
      positions = {
        price: {
          x: 50, // Center bottom
          y: 85,
          zone: 'bottom'
        },
        title: {
          x: 50, // Center top
          y: 15,
          zone: 'top'
        },
        icon: {
          x: 80, // Upper right
          y: 25,
          zone: 'top-right'
        }
      };
    } else if (objectClass === 'cell phone' || objectClass === 'laptop') {
      // For electronics: title at top, price at bottom
      positions = {
        price: {
          x: 50,
          y: 80,
          zone: 'bottom'
        },
        title: {
          x: 50,
          y: 12,
          zone: 'top'
        },
        icon: {
          x: 85,
          y: 20,
          zone: 'top-right'
        }
      };
    } else {
      // Default intelligent positioning based on actual boundaries
      const productLeft = scaledBounds.minX;
      const productRight = scaledBounds.maxX;
      const productTop = scaledBounds.minY;
      const productBottom = scaledBounds.maxY;

      // Calculate empty zones around product
      const topSpace = productTop;
      const bottomSpace = canvasHeight - productBottom;
      const leftSpace = productLeft;
      const rightSpace = canvasWidth - productRight;

      console.log('📊 DEBUG: Available spaces:', {
        top: topSpace,
        bottom: bottomSpace,
        left: leftSpace,
        right: rightSpace
      });

      // Intelligent position selection based on largest empty spaces
      if (bottomSpace > topSpace && bottomSpace > leftSpace && bottomSpace > rightSpace) {
        // Best space is bottom
        positions = {
          price: { x: 50, y: Math.min(85, 60 + (bottomSpace / canvasHeight) * 30), zone: 'bottom' },
          title: { x: 50, y: Math.max(15, topSpace / canvasHeight * 50), zone: 'top' },
          icon: { x: Math.min(85, 60 + (rightSpace / canvasWidth) * 25), y: 25, zone: 'top-right' }
        };
      } else if (rightSpace > leftSpace) {
        // Best space is right side
        positions = {
          price: { x: Math.min(85, 60 + (rightSpace / canvasWidth) * 25), y: 75, zone: 'right' },
          title: { x: 50, y: 15, zone: 'top' },
          icon: { x: Math.min(90, 70 + (rightSpace / canvasWidth) * 20), y: 30, zone: 'right' }
        };
      } else {
        // Best space is left side
        positions = {
          price: { x: Math.max(15, leftSpace / canvasWidth * 40), y: 75, zone: 'left' },
          title: { x: 50, y: 15, zone: 'top' },
          icon: { x: Math.max(10, leftSpace / canvasWidth * 30), y: 30, zone: 'left' }
        };
      }
    }

    console.log('🎯 DEBUG: ML-calculated optimal positions:', positions);
    return positions;
  }

  /**
   * Main method: Get ML-powered positioning for product image
   * @param {string} imagePath - Path to product image
   * @returns {Promise<Object>} - Complete positioning data
   */
  async getMLPositioning(imagePath) {
    try {
      console.log('🤖 DEBUG: Starting ML-powered positioning analysis...');
      
      // Step 1: ML object detection
      const mlBounds = await this.detectProductBoundaries(imagePath);
      
      // Step 2: Calculate optimal positions
      const optimalPositions = this.calculateOptimalPositions(mlBounds);
      
      // Step 3: Format for compatibility with existing system
      const result = {
        success: true,
        method: 'tensorflow_js',
        mlBounds: mlBounds,
        optimalPositions: {
          price: {
            position: { x: optimalPositions.price.x, y: optimalPositions.price.y },
            zone: optimalPositions.price.zone,
            confidence: mlBounds.confidence,
            objectClass: mlBounds.class
          },
          title: {
            position: { x: optimalPositions.title.x, y: optimalPositions.title.y },
            zone: optimalPositions.title.zone,
            confidence: mlBounds.confidence,
            objectClass: mlBounds.class
          },
          icon: {
            position: { x: optimalPositions.icon.x, y: optimalPositions.icon.y },
            zone: optimalPositions.icon.zone,
            confidence: mlBounds.confidence,
            objectClass: mlBounds.class
          }
        },
        canvasSize: { width: 1080, height: 1080 }
      };

      console.log('✅ DEBUG: ML positioning completed successfully');
      return result;

    } catch (error) {
      console.error('❌ DEBUG: ML positioning failed:', error);
      throw new Error(`ML positioning failed: ${error.message}`);
    }
  }

  /**
   * Cleanup method
   */
  async cleanup() {
    if (this.model && this.isModelLoaded) {
      try {
        // Dispose model to free memory
        await this.model.dispose();
        this.model = null;
        this.isModelLoaded = false;
        console.log('🧹 DEBUG: TensorFlow.js model cleaned up');
      } catch (error) {
        console.error('⚠️ DEBUG: Error during cleanup:', error);
      }
    }
  }
}

module.exports = MLPositioningEngine;