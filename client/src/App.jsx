import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Canvas, Text, Image } from 'fabric'
import axios from 'axios'
import { HeroUIProvider } from '@heroui/react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      sku: '',
      brand: '',
      productName: '',
      fullPrice: '',
      discountedPrice: '',
      percentOff: '',
    }
  })

  const watchedFields = watch()

  // Initialize canvas on component mount
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new Canvas(canvasRef.current, {
        width: 500,
        height: 500,
        backgroundColor: 'white'
      })
    }

    // Cleanup on unmount
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [])

  // Canvas rendering logic
  const renderCanvas = () => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    canvas.clear()
    canvas.backgroundColor = 'white'
    canvas.renderAll()

    const scaleFactor = 500 / 1080

    // Sample layout positions (these would come from the backend)
    const layout = {
      pricePos: { x: 540 * scaleFactor, y: 820 * scaleFactor },
      titlePos: { x: 250 * scaleFactor, y: 150 * scaleFactor },
      iconPos: { x: 850 * scaleFactor, y: 200 * scaleFactor }
    }

    // Render product image
    const productImageFile = document.querySelector('input[type="file"][name="productImage"]')?.files[0]
    if (productImageFile) {
      const reader = new FileReader()
      reader.onload = function(e) {
        Image.fromURL(e.target.result, (img) => {
          // Scale to 300px width
          const scale = 300 / img.width
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: (canvas.width - img.width * scale) / 2,
            top: (canvas.height - img.height * scale) / 2
          })
          canvas.add(img)
          canvas.renderAll()
        })
      }
      reader.readAsDataURL(productImageFile)
    }

    // Render price text
    if (watchedFields.discountedPrice) {
      const priceText = new Text(`${watchedFields.discountedPrice}`, {
        left: layout.pricePos.x,
        top: layout.pricePos.y,
        fontFamily: 'Arial',
        fontSize: 40,
        fontWeight: 'bold',
        fill: 'red',
        originX: 'center',
        originY: 'center'
      })
      canvas.add(priceText)
    }

    // Render crossed-out full price
    if (watchedFields.fullPrice) {
      const fullPriceText = new Text(`${watchedFields.fullPrice}`, {
        left: layout.pricePos.x,
        top: layout.pricePos.y - 30,
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 'grey',
        originX: 'center',
        originY: 'center',
        linethrough: true
      })
      canvas.add(fullPriceText)
    }

    // Render title/brand
    if (watchedFields.productName || watchedFields.brand) {
      const title = watchedFields.productName || watchedFields.brand
      const titleText = new Text(title, {
        left: layout.titlePos.x,
        top: layout.titlePos.y,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 'black',
        originX: 'center',
        originY: 'center',
        width: 200,
        textAlign: 'center'
      })
      canvas.add(titleText)
    }

    // Render icon1
    const icon1File = document.querySelector('input[type="file"][name="icon1"]')?.files[0]
    if (icon1File) {
      const reader = new FileReader()
      reader.onload = function(e) {
        Image.fromURL(e.target.result, (img) => {
          const scale = 50 / img.width
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: layout.iconPos.x,
            top: layout.iconPos.y,
            originX: 'center',
            originY: 'center'
          })
          canvas.add(img)
          canvas.renderAll()
        })
      }
      reader.readAsDataURL(icon1File)
    }
  }

  // Update canvas when form fields change
  useEffect(() => {
    renderCanvas()
  }, [watchedFields])

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      // Add all form fields
      Object.keys(data).forEach(key => {
        if (data[key]) {
          formData.append(key, data[key])
        }
      })

      // Add files
      const productImageFile = document.querySelector('input[type="file"][name="productImage"]')?.files[0]
      const icon1File = document.querySelector('input[type="file"][name="icon1"]')?.files[0]
      const icon2File = document.querySelector('input[type="file"][name="icon2"]')?.files[0]

      if (productImageFile) {
        formData.append('productImage', productImageFile)
      }
      if (icon1File) {
        formData.append('icon1', icon1File)
      }
      if (icon2File) {
        formData.append('icon2', icon2File)
      }

      const response = await axios.post('http://localhost:5000/api/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Handle successful response
      console.log('Generation successful:', response.data)
      
      // Reset form after successful submission
      reset()
      
      // Clear canvas
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear()
        fabricCanvasRef.current.backgroundColor = 'white'
        fabricCanvasRef.current.renderAll()
      }
      
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <HeroUIProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Product Image Generator
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate professional product images with AI-powered layouts
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Form (1/3 width) */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Product Information
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    {...register('sku')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter SKU"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    {...register('brand')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter brand name"
                  />
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    {...register('productName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Full Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('fullPrice')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Discounted Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discounted Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('discountedPrice')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Percent Off */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Percent Off
                  </label>
                  <input
                    type="number"
                    {...register('percentOff')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Product Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image *
                  </label>
                  <input
                    type="file"
                    accept="image/png"
                    {...register('productImage', { required: 'Product image is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.productImage && (
                    <p className="text-red-500 text-sm mt-1">{errors.productImage.message}</p>
                  )}
                </div>

                {/* Icon 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon 1 (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    {...register('icon1')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Icon 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon 2 (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    {...register('icon2')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Analyzing Pixels...' : 'Generate Image'}
                </button>
              </form>
            </div>

            {/* Right Panel - Canvas (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Preview
              </h2>
              
              <div className="flex justify-center">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                  <canvas 
                    ref={canvasRef}
                    width="500" 
                    height="500"
                    className="border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </HeroUIProvider>
  )
}

export default App
