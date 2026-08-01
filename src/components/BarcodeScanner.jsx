import { useState, useRef, useEffect } from 'react'
import { Camera, X, ScanBarcode, Keyboard, Search, Package, Check, ExternalLink } from 'lucide-react'

async function lookupBarcode(code) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,categories,stores,quantity,ingredients_text,labels,image_front_url,image_front_small_url`)
    if (res.ok) {
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        return {
          found: true,
          source: 'Open Food Facts',
          name: p.product_name || '',
          brand: p.brands || '',
          category: p.categories || '',
          quantity: p.quantity || '',
          store: p.stores || '',
          image: p.image_front_small_url || p.image_front_url || '',
          ingredients: p.ingredients_text || '',
          labels: p.labels || '',
        }
      }
    }
  } catch {}

  try {
    const res = await fetch(`https://world.openpetfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,categories,quantity,image_front_small_url`)
    if (res.ok) {
      const data = await res.json()
      if (data.status === 1 && data.product) {
        const p = data.product
        return {
          found: true,
          source: 'Open Pet Food Facts',
          name: p.product_name || '',
          brand: p.brands || '',
          category: p.categories || '',
          quantity: p.quantity || '',
          image: p.image_front_small_url || '',
        }
      }
    }
  } catch {}

  return { found: false }
}

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const rafRef = useRef(null)
  const [mode, setMode] = useState('camera')
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState('')
  const [supported, setSupported] = useState(true)
  const [lookupResult, setLookupResult] = useState(null)
  const [looking, setLooking] = useState(false)
  const [scannedCode, setScannedCode] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
      setSupported(false)
      setMode('manual')
    }
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      setError('')
      setScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if ('BarcodeDetector' in window) {
        const formats = await BarcodeDetector.getSupportedFormats?.() || ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        detectorRef.current = new BarcodeDetector({ formats })
        detectLoop()
      }
    } catch (err) {
      setError('Camera access denied or unavailable')
      setScanning(false)
      setMode('manual')
    }
  }

  function detectLoop() {
    if (!videoRef.current || !detectorRef.current) return
    rafRef.current = requestAnimationFrame(async () => {
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current)
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue
          if (code !== lastScan) {
            setLastScan(code)
            vibrate(20)
            handleLookup(code)
            stopCamera()
            return
          }
        }
      } catch {}
      detectLoop()
    })
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    detectorRef.current = null
    setScanning(false)
  }

  function vibrate(ms) {
    try { navigator.vibrate?.(ms) } catch {}
  }

  async function handleLookup(code) {
    setScannedCode(code)
    setLooking(true)
    setLookupResult(null)
    const result = await lookupBarcode(code)
    setLookupResult(result)
    setLooking(false)
  }

  function handleManualSubmit() {
    if (manualCode.trim()) {
      vibrate(15)
      handleLookup(manualCode.trim())
    }
  }

  function handleConfirm() {
    if (lookupResult?.found) {
      onScan(scannedCode, {
        name: lookupResult.name,
        brand: lookupResult.brand,
        category: lookupResult.category,
        quantity: lookupResult.quantity,
        image: lookupResult.image,
      })
    } else {
      onScan(scannedCode, null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-white" />
          <h2 className="text-white font-bold text-sm">
            {looking ? 'Looking up...' : lookupResult ? 'Product Found' : 'Scan Barcode'}
          </h2>
        </div>
        <div className="flex gap-2">
          {!looking && !lookupResult && (
            <button
              onClick={() => { stopCamera(); setMode(mode === 'camera' ? 'manual' : 'camera') }}
              className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-medium hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              {mode === 'camera' ? <Keyboard className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              {mode === 'camera' ? 'Type Code' : 'Use Camera'}
            </button>
          )}
          <button onClick={() => { stopCamera(); onClose() }} className="p-2 text-white/70 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Mode */}
      {mode === 'camera' && !looking && !lookupResult && (
        <div className="flex-1 relative flex items-center justify-center bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-32 border-2 border-white/60 rounded-2xl relative">
              <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
              {scanning && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-[scanline_2s_ease-in-out_infinite]" />
              )}
            </div>
          </div>
          {!supported && (
            <div className="absolute bottom-8 left-4 right-4 bg-black/70 text-white text-sm text-center py-3 rounded-xl">
              BarcodeDetector not supported. Use manual entry.
            </div>
          )}
          {error && (
            <div className="absolute bottom-8 left-4 right-4 bg-red-500/80 text-white text-sm text-center py-3 rounded-xl">
              {error}
            </div>
          )}
          {!scanning && !error && (
            <button
              onClick={startCamera}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm active:scale-95 transition-all"
            >
              Start Scanning
            </button>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {mode === 'manual' && !looking && !lookupResult && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-900">
          <ScanBarcode className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/60 text-sm mb-4 text-center">Enter barcode number manually</p>
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Type or paste barcode..."
            className="w-full max-w-sm px-4 py-3 rounded-xl bg-white/10 text-white text-center text-lg font-mono tracking-widest placeholder:text-white/30 outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            autoFocus
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold text-sm active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Look Up
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {looking && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-900">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-medium text-sm">Looking up barcode...</p>
          <p className="text-white/40 text-xs mt-1 font-mono">{scannedCode}</p>
        </div>
      )}

      {/* Result */}
      {lookupResult && !looking && (
        <div className="flex-1 flex flex-col px-4 py-4 bg-gray-900 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-white/40">{scannedCode}</span>
              {lookupResult.found && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-semibold">
                  <Check className="w-3 h-3" /> Found
                </span>
              )}
            </div>
            {lookupResult.found && (
              <p className="text-[10px] text-white/30">Source: {lookupResult.source}</p>
            )}
          </div>

          {lookupResult.found ? (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-4">
              {lookupResult.image && (
                <div className="h-40 bg-white/5 flex items-center justify-center overflow-hidden">
                  <img src={lookupResult.image} alt={lookupResult.name} className="h-full object-contain" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-white/40 uppercase font-semibold mb-0.5">Product Name</p>
                  <p className="text-white font-bold text-sm">{lookupResult.name}</p>
                </div>
                {lookupResult.brand && (
                  <div>
                    <p className="text-xs text-white/40 uppercase font-semibold mb-0.5">Brand</p>
                    <p className="text-white/80 text-sm">{lookupResult.brand}</p>
                  </div>
                )}
                {lookupResult.quantity && (
                  <div>
                    <p className="text-xs text-white/40 uppercase font-semibold mb-0.5">Quantity</p>
                    <p className="text-white/80 text-sm">{lookupResult.quantity}</p>
                  </div>
                )}
                {lookupResult.category && (
                  <div>
                    <p className="text-xs text-white/40 uppercase font-semibold mb-0.5">Category</p>
                    <p className="text-white/80 text-sm truncate">{lookupResult.category}</p>
                  </div>
                )}
                {lookupResult.labels && (
                  <div>
                    <p className="text-xs text-white/40 uppercase font-semibold mb-0.5">Labels</p>
                    <p className="text-white/80 text-xs">{lookupResult.labels}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center mb-4">
              <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 font-medium text-sm mb-1">Product not found</p>
              <p className="text-white/30 text-xs">This barcode is not in the database. You can still add the item manually.</p>
            </div>
          )}

          <div className="flex gap-3 mt-auto pb-4">
            <button
              onClick={() => { setLookupResult(null); setScannedCode(''); setManualCode('') }}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all active:scale-95"
            >
              Scan Again
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {lookupResult.found ? (
                <>
                  <Package className="w-4 h-4" /> Add to Inventory
                </>
              ) : (
                'Add Manually'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
