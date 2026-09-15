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

// splitCenter --------------------------------------------------------------

const ids = entries => entries.map(e => e.id)
const center = [{ id: 'a' }, { id: 'b' }, { id: 'marker' }, { id: 'c' }]

check('the marker splits center entries and is dropped from both sides', () => {
  const s = notch.splitCenter(center, 'marker', '')
  assert.deepStrictEqual(ids(s.before), ['a', 'b'])
  assert.deepStrictEqual(ids(s.after), ['c'])
})

check('the marker wins over a center anchor', () => {
  const s = notch.splitCenter(center, 'marker', 'c')
  assert.deepStrictEqual(ids(s.before), ['a', 'b'])
})

check('without a marker the anchor ends the left side', () => {
  const s = notch.splitCenter([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'marker', 'b')
  assert.deepStrictEqual(ids(s.before), ['a', 'b'])
  assert.deepStrictEqual(ids(s.after), ['c'])
})

check('without marker or anchor the first half (rounded up) goes left', () => {
  const s = notch.splitCenter([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'marker', '')
  assert.deepStrictEqual(ids(s.before), ['a', 'b'])
  assert.deepStrictEqual(ids(s.after), ['c'])
})

check('string entries and non-arrays are tolerated', () => {
  assert.deepStrictEqual(notch.splitCenter(['a', 'marker', 'b'], 'marker', '').after, ['b'])
  assert.deepStrictEqual(notch.splitCenter(null, 'marker', ''), { before: [], after: [] })
})

// notchDropBefore ----------------------------------------------------------

check('dropping on the left notch edge lands just before the marker', () => {
  assert.strictEqual(notch.notchDropBefore(center, 'marker', '', 'left'), 'marker')
})

check('dropping on the right notch edge lands just after the marker', () => {
  assert.strictEqual(notch.notchDropBefore(center, 'marker', '', 'right'), 'c')
})

check('dropping on the right notch edge with nothing after the marker appends', () => {
  assert.strictEqual(notch.notchDropBefore([{ id: 'a' }, { id: 'marker' }], 'marker', '', 'right'), '')
})

check('dropping on the left notch edge of an empty left side still lands before the marker', () => {
  assert.strictEqual(notch.notchDropBefore([{ id: 'marker' }, { id: 'c' }], 'marker', '', 'left'), 'marker')
})

check('without a marker the left edge lands before the first right-side entry', () => {
  assert.strictEqual(notch.notchDropBefore([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'marker', 'b', 'left'), 'c')
  assert.strictEqual(notch.notchDropBefore([{ id: 'a' }], 'marker', 'a', 'left'), '')
})

check('without a marker the right edge appends', () => {
  assert.strictEqual(notch.notchDropBefore([{ id: 'a' }, { id: 'b' }], 'marker', '', 'right'), '')
})

if (failures > 0) {
  console.log('\n' + failures + ' failing')
  process.exit(1)
}
console.log('\nall passing')
