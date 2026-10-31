// Geometry for splitting a top bar around an Apple notched panel's camera
// cutout. Pure functions, no QML, so they run under node for tests.

// Camera-cutout widths in physical columns, keyed by physical panel size.
// BarModel.notchHeight covers the cutout's depth; this is its width. The
// cutout is the same physical module on every notched MacBook, so panels in
// the same ppi family share a width and lower-ppi panels span fewer columns.
var measuredNotchPanels = [
  // MacBook Pro 14" (3024x1964, 254ppi): calibrated by eye with the default gap.
  { width: 3024, height: 1964, cutoutColumns: 348, cutoutRows: 64 },
  // MacBook Pro 16" (3456x2234, 254ppi): same camera module as the 14".
  { width: 3456, height: 2234, cutoutColumns: 348, cutoutRows: 64 },
  // MacBook Air 13.6" and 15" (224ppi): 348 x 224/254 ~= 307.
  { width: 2560, height: 1664, cutoutColumns: 307, cutoutRows: 56 },
  { width: 2880, height: 1864, cutoutColumns: 307, cutoutRows: 56 }
]

// Unmeasured notched panels: the 14" cutout's share of its panel width.
var fallbackWidthRatio = 348 / 3024

function measuredCutoutRows(physicalWidth, physicalHeight, key) {
  for (var i = 0; i < measuredNotchPanels.length; i++) {
    var panel = measuredNotchPanels[i]
    // Logical sizes are rounded, so allow a few pixels at fractional scales.
    if (Math.abs(physicalWidth - panel.width) <= 4 && Math.abs(physicalHeight - panel.height) <= 4)
      return panel[key]
  }
  return 0
}

// Logical width of the camera cutout, or 0 when the screen has none. Uses the
// same notched-panel test as BarModel.notchHeight: a built-in panel with a
// thin strip above its 16:10 area. Callers still gate on Apple Silicon.
function notchWidth(screenName, logicalWidth, logicalHeight, devicePixelRatio) {
  if (String(screenName || "").indexOf("eDP") !== 0) return 0

  var width = Number(logicalWidth)
  var height = Number(logicalHeight)
  if (!(width > 0) || !(height > 0)) return 0

  var strip = height - (width * 10) / 16
  if (strip <= 0 || strip > height / 20) return 0

  var scale = Number(devicePixelRatio) > 0 ? Number(devicePixelRatio) : 1
  var columns = measuredCutoutRows(Math.round(width * scale), Math.round(height * scale), "cutoutColumns")
  if (columns > 0) return Math.ceil(columns / scale)
  return Math.ceil(width * fallbackWidthRatio)
}

// Logical height of the camera cutout, or 0 when the screen has none. Panels
// expose more rows above the 16:10 area than the cutout covers, so a measured
// panel gets its exact depth and others the whole strip.
function notchHeight(screenName, logicalWidth, logicalHeight, devicePixelRatio) {
  if (String(screenName || "").indexOf("eDP") !== 0) return 0

  var width = Number(logicalWidth)
  var height = Number(logicalHeight)
  if (!(width > 0) || !(height > 0)) return 0

  var strip = height - (width * 10) / 16
  if (strip <= 0 || strip > height / 20) return 0

  var scale = Number(devicePixelRatio)
  if (scale > 0) {
    var rows = measuredCutoutRows(Math.round(width * scale), Math.round(height * scale), "cutoutRows")
    if (rows > 0) return Math.ceil(rows / scale)
  }
  return Math.ceil(strip)
}

// Left and right island spans for a bar of screenWidth with a centered notch.
// Islands stop gap short of the notch and never reach under it.
function islandRects(screenWidth, notchWidthValue, gap) {
  var total = Math.max(0, Number(screenWidth) || 0)
  var cutout = Math.max(0, Number(notchWidthValue) || 0)
  var spacing = Math.max(0, Number(gap) || 0)

  var leftEnd = Math.floor((total - cutout) / 2) - spacing
  var rightStart = Math.ceil((total + cutout) / 2) + spacing

  return {
    left: { x: 0, width: Math.max(0, leftEnd) },
    right: { x: Math.min(total, rightStart), width: Math.max(0, total - rightStart) }
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    measuredNotchPanels: measuredNotchPanels,
    notchHeight: notchHeight,
    notchWidth: notchWidth,
    islandRects: islandRects
  }
}
