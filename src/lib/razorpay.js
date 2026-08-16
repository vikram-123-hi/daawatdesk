let scriptPromise = null

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Failed to load Razorpay checkout'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

export async function openRazorpay({ keyId, orderId, amountMs, email, name, planLabel }) {
  const key = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!key) {
    throw new Error('Razorpay is not configured. Please set VITE_RAZORPAY_KEY_ID in your environment.')
  }
  await loadRazorpayScript()
  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: amountMs,
      currency: 'INR',
      name: 'DaawatDesk',
      description: planLabel,
      order_id: orderId,
      prefill: { email, name },
      handler(response) {
        resolve(response)
      },
      onClose() {
        reject(new Error('PAYMENT_CANCELLED'))
      },
      modal: {
        ondismiss() {
          reject(new Error('PAYMENT_CANCELLED'))
        },
      },
    }
    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (res) => {
      reject(new Error(res?.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}
