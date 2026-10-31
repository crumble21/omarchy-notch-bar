#!/usr/bin/env node
// Run with: node test/notch-model-test.js
const assert = require('assert')
const path = require('path')
const notch = require(path.join(__dirname, '..', 'NotchModel.js'))

let failures = 0
function check(name, fn) {
  try {
    fn()
    console.log('ok   ' + name)
  } catch (error) {
    failures++
    console.log('FAIL ' + name + '\n     ' + error.message)
  }
}

// notchWidth ---------------------------------------------------------------

check('MacBook Pro 14" at scale 1 uses its measured cutout width', () => {
  assert.strictEqual(notch.notchWidth('eDP-1', 3024, 1964, 1), notch.measuredNotchPanels[0].cutoutColumns)
})

check('MacBook Pro 14" at scale 2 halves the logical cutout width', () => {
  assert.strictEqual(notch.notchWidth('eDP-1', 1512, 982, 2), Math.ceil(notch.measuredNotchPanels[0].cutoutColumns / 2))
})

check('an unmeasured notched panel falls back to a width ratio', () => {
  const width = notch.notchWidth('eDP-1', 1536, 990, 2)
  assert.ok(width > 150 && width < 260, 'got ' + width)
})

check('external monitors never report a notch', () => {
  assert.strictEqual(notch.notchWidth('DP-1', 3024, 1964, 1), 0)
})

check('an exactly 16:10 panel has no notch', () => {
  assert.strictEqual(notch.notchWidth('eDP-1', 1280, 800, 2), 0)
})

check('a rotated panel is not mistaken for a notch', () => {
  assert.strictEqual(notch.notchWidth('eDP-1', 1964, 3024, 1), 0)
})

check('degenerate input reports no notch', () => {
  assert.strictEqual(notch.notchWidth('eDP-1', 0, 0, 1), 0)
  assert.strictEqual(notch.notchWidth('', 3024, 1964, 1), 0)
})

// islandRects --------------------------------------------------------------

check('islands flank a centered notch with the gap on each side', () => {
  const r = notch.islandRects(3024, 400, 10)
  assert.deepStrictEqual(r.left, { x: 0, width: 1302 })
  assert.deepStrictEqual(r.right, { x: 1722, width: 1302 })
})

check('odd leftovers never let an island reach under the notch', () => {
  const r = notch.islandRects(1001, 100, 0)
  assert.ok(r.left.x + r.left.width <= (1001 - 100) / 2)
  assert.ok(r.right.x >= (1001 + 100) / 2)
  assert.strictEqual(r.right.x + r.right.width, 1001)
})

check('islands clamp to zero width instead of going negative', () => {
  const r = notch.islandRects(300, 400, 10)
  assert.strictEqual(r.left.width, 0)
  assert.strictEqual(r.right.width, 0)
})

// notchHeight --------------------------------------------------------------

check('a measured panel gets its exact cutout depth', () => {
  assert.strictEqual(notch.notchHeight('eDP-1', 1728, 1117, 2), 32)
})

check('an unmeasured notched panel gets the whole strip', () => {
  assert.ok(notch.notchHeight('eDP-1', 1536, 990, 2) > 0)
})

check('external monitors and 16:10 panels have no cutout depth', () => {
  assert.strictEqual(notch.notchHeight('DP-1', 1728, 1117, 2), 0)
  assert.strictEqual(notch.notchHeight('eDP-1', 1280, 800, 2), 0)
})

if (failures > 0) {
  console.log('\n' + failures + ' failing')
  process.exit(1)
}
console.log('\nall passing')
