// Location helper. Location is only read when an alert or check-in is sent.

// Asks the phone for its position.
// Gives back { lat, lng }, or null if it fails, is refused, or takes too long.
export function getPosition(timeout = 8000) {
  return new Promise(function (resolve) {
    let finished = false

    // finishes only once, with either a position or null
    function finish(result) {
      if (!finished) {
        finished = true
        resolve(result)
      }
    }

    if (!navigator.geolocation) {
      finish(null)
      return
    }

    // Backup timer. If the person ignores the permission question, the browser's own
    // timeout never starts, so we give up ourselves and send without a location.
    setTimeout(function () {
      finish(null)
    }, timeout + 1000)

    navigator.geolocation.getCurrentPosition(
      function (p) {
        finish({ lat: p.coords.latitude, lng: p.coords.longitude })
      },
      function () {
        finish(null)
      },
      { enableHighAccuracy: true, timeout: timeout, maximumAge: 30000 }
    )
  })
}
