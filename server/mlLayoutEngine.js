const { pipeline } = require('@xenova/transformers');
const sharp = require('sharp');
const fs = require('fs');

// Singleton to hold the model (so we don't reload it every request)
let detector = null;

async function getDetector() {
  if (!detector) {
    console.log('Loading AI Model... (this happens only once)');
    // We use a quantized model for speed in Node.js
    detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');
  }
  return detector;
}

const CANVAS_SIZE = 1080;

async function analyzeWithML(imagePath) {
  try {
    // 1. Prepare Image
    // DETR works best with standard images. We don't need to process alpha channel here.
    // We just need the path or buffer.
    
    // 2. Run AI Detection
    const detect = await getDetector();
    const output = await detect(imagePath);

    // Output looks like: [{ score: 0.99, label: 'bottle', box: { xmin, ymin, xmax, ymax } }, ...]

    // 3. Filter Results
    // We only want the MAIN product. Strategy: Highest confidence score + largest area.
    if (output.length === 0) {
      // Fallback: If AI finds nothing, assume center placement
      return getDefaultLayout();
    }

    // Find the object with the highest confidence score
    const mainObject = output.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    const { xmin, ymin, xmax, ymax } = mainObject.box;

    // 4. Map the coordinates (The AI returns coords based on original image size)
    // We need to scale these to our 1080x1080 logic.
    const metadata = await sharp(imagePath).metadata();
    const scaleX = CANVAS_SIZE / metadata.width;
    const scaleY = CANVAS_SIZE / metadata.height;

    // The actual box of the product in our 1080 canvas
    const productBox = {
      x: xmin * scaleX,
      y: ymin * scaleY,
      width: (xmax - xmin) * scaleX,
      height: (ymax - ymin) * scaleY,
      bottom: ymax * scaleY,
      right: xmax * scaleX
    };

    // 5. Calculate Free Zones (Logic is similar to previous method, but now based on AI box)
    const zones = [
      { 
          name: 'top', 
          area: productBox.y * CANVAS_SIZE, 
          coords: { x: CANVAS_SIZE/2, y: productBox.y / 2 } 
      },
      { 
          name: 'bottom', 
          area: (CANVAS_SIZE - productBox.bottom) * CANVAS_SIZE, 
          coords: { x: CANVAS_SIZE/2, y: productBox.bottom + (CANVAS_SIZE - productBox.bottom)/2 } 
      },
      { 
          name: 'left', 
          area: productBox.x * CANVAS_SIZE, 
          coords: { x: productBox.x / 2, y: CANVAS_SIZE/2 } 
      },
      { 
          name: 'right', 
          area: (CANVAS_SIZE - productBox.right) * CANVAS_SIZE, 
          coords: { x: productBox.right + (CANVAS_SIZE - productBox.right)/2, y: CANVAS_SIZE/2 } 
      }
    ];

    // Sort by largest area
    zones.sort((a, b) => b.area - a.area);

    return {
      detectedLabel: mainObject.label, // e.g., "bottle" or "shoe"
      confidence: mainObject.score,
      success: true,
      method: 'ml_detr_detection',
      productBounds: {
        minX: productBox.x / CANVAS_SIZE * 100,
        minY: productBox.y / CANVAS_SIZE * 100,
        maxX: productBox.right / CANVAS_SIZE * 100,
        maxY: productBox.bottom / CANVAS_SIZE * 100,
        width: productBox.width / CANVAS_SIZE * 100,
        height: productBox.height / CANVAS_SIZE * 100
      },
      layout: {
          pricePos: zones[0].coords, // Largest empty space
          titlePos: zones[1].coords,
          iconPos: zones[2].coords
      },
      optimalPositions: {
        price: {
          position: { 
            x: zones[0].coords.x / CANVAS_SIZE * 100, 
            y: zones[0].coords.y / CANVAS_SIZE * 100 
          },
          zone: zones[0].name,
          area: zones[0].area
        },
        title: {
          position: { 
            x: zones[1].coords.x / CANVAS_SIZE * 100, 
            y: zones[1].coords.y / CANVAS_SIZE * 100 
          },
          zone: zones[1].name,
          area: zones[1].area
        },
        icon: {
          position: { 
            x: zones[2].coords.x / CANVAS_SIZE * 100, 
            y: zones[2].coords.y / CANVAS_SIZE * 100 
          },
          zone: zones[2].name,
          area: zones[2].area
        }
      },
      zones: zones.map(zone => ({
        name: zone.name,
        area: zone.area,
        percentage: zone.area / (CANVAS_SIZE * CANVAS_SIZE) * 100,
        position: {
          x: zone.coords.x / CANVAS_SIZE * 100,
          y: zone.coords.y / CANVAS_SIZE * 100
        }
      })),
      canvasSize: { width: 1080, height: 1080 }
    };
  } catch (error) {
    console.error('❌ DEBUG: ML Analysis failed:', error);
    return getDefaultLayout();
  }
}

function getDefaultLayout() {
    console.log('🛡️ DEBUG: Using ML fallback layout');
    return {
      detectedLabel: 'unknown',
      confidence: 0.3,
      success: true,
      method: 'ml_fallback',
      productBounds: {
        minX: 20,
        minY: 20,
        maxX: 80,
        maxY: 80,
        width: 60,
        height: 60
      },
      layout: {
        pricePos: { x: 540, y: 900 },
        titlePos: { x: 540, y: 150 },
        iconPos: { x: 100, y: 100 }
      },
      optimalPositions: {
        price: {
          position: { x: 50, y: 85 },
          zone: 'bottom',
          area: 1080 * 162
        },
        title: {
          position: { x: 50, y: 12 },
          zone: 'top',
          area: 1080 * 130
        },
        icon: {
          position: { x: 82, y: 20 },
          zone: 'top-right',
          area: 162 * 648
        }
      },
      zones: [
        { name: 'top', area: 1080 * 130, percentage: 12 },
        { name: 'bottom', area: 1080 * 162, percentage: 15 },
        { name: 'right', area: 162 * 648, percentage: 9.6 }
      ],
      canvasSize: { width: 1080, height: 1080 }
    };
}

module.exports = { analyzeWithML };