// Geometry for splitting a top bar around an Apple notched panel's camera
// cutout. Pure functions, no QML, so they run under node for tests.

// Camera-cutout widths in physical columns, keyed by physical panel size.
// BarModel.notchHeight covers the cutout's depth; this is its width. The
// cutout is the same physical module on every notched MacBook, so panels in
// the same ppi family share a width and lower-ppi panels span fewer columns.
var measuredNotchPanels = [
  // MacBook Pro 14" (3024x1964, 254ppi): calibrated by eye with the default gap.
  { width: 3024, height: 1964, cutoutColumns: 348 },
  // MacBook Pro 16" (3456x2234, 254ppi): same camera module as the 14".
  { width: 3456, height: 2234, cutoutColumns: 348 },
  // MacBook Air 13.6" and 15" (224ppi): 348 x 224/254 ~= 307.
  { width: 2560, height: 1664, cutoutColumns: 307 },
  { width: 2880, height: 1864, cutoutColumns: 307 }
]

// Unmeasured notched panels: the 14" cutout's share of its panel width.
var fallbackWidthRatio = 348 / 3024

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function entryId(entry) {
  if (typeof entry === "string") return entry
  if (isPlainObject(entry) && entry.id !== undefined && entry.id !== null) return String(entry.id)
  return ""
}

function measuredCutoutColumns(physicalWidth, physicalHeight) {
  for (var i = 0; i < measuredNotchPanels.length; i++) {
    var panel = measuredNotchPanels[i]
    // Logical sizes are rounded, so allow a few pixels at fractional scales.
    if (Math.abs(physicalWidth - panel.width) <= 4 && Math.abs(physicalHeight - panel.height) <= 4)
      return panel.cutoutColumns
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
  var columns = measuredCutoutColumns(Math.round(width * scale), Math.round(height * scale))
  if (columns > 0) return Math.ceil(columns / scale)
  return Math.ceil(width * fallbackWidthRatio)
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

// Split the center section into the entries that hug the notch from the left
// (before) and from the right (after). The notch marker entry is the divider
// and belongs to neither side. Without one, a center anchor ends the left
// side; without either, the first half (rounded up) goes left.
function splitCenter(entries, markerId, anchorId) {
  if (!Array.isArray(entries)) return { before: [], after: [] }

  var marker = -1
  var anchor = -1
  for (var i = 0; i < entries.length; i++) {
    var id = entryId(entries[i])
    if (marker === -1 && markerId && id === markerId) marker = i
    if (anchor === -1 && anchorId && id === anchorId) anchor = i
  }

  if (marker !== -1)
    return { before: entries.slice(0, marker), after: entries.slice(marker + 1) }
  if (anchor !== -1)
    return { before: entries.slice(0, anchor + 1), after: entries.slice(anchor + 1) }

  var half = Math.ceil(entries.length / 2)
  return { before: entries.slice(0, half), after: entries.slice(half) }
}

// Center-section entry id a widget dropped on a notch-facing island edge is
// inserted in front of ("" appends). The edges are drop targets even when that
// side of the notch is empty, which a drop onto neighbouring slots can't reach.
function notchDropBefore(entries, markerId, anchorId, side) {
  var list = Array.isArray(entries) ? entries : []
  var marker = -1
  for (var i = 0; i < list.length; i++) {
    if (markerId && entryId(list[i]) === markerId) { marker = i; break }
  }

  if (marker !== -1) {
    if (side === "left") return markerId
    return marker + 1 < list.length ? entryId(list[marker + 1]) : ""
  }

  if (side === "left") {
    var after = splitCenter(list, markerId, anchorId).after
    return after.length > 0 ? entryId(after[0]) : ""
  }
  return ""
}

if (typeof module !== "undefined") {
  module.exports = {
    measuredNotchPanels: measuredNotchPanels,
    notchWidth: notchWidth,
    islandRects: islandRects,
    splitCenter: splitCenter,
    notchDropBefore: notchDropBefore
  }
}
