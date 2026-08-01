export function vibrate(ms = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {}
}
