#!/usr/bin/env node
// Run with: node test/notch-model-test.js
const assert = require('assert')
const path = require('path')
const notch = require(path.join(__dirname, '..', 'NotchModel.js'))
const bar = require(path.join(__dirname, '..', 'BarModel.js'))

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

// split layout centerDropTarget --------------------------------------------

check('empty centerBegin with split boundaries lands in centerBegin near notch', () => {
  const box = { x: 1700, y: 0, width: 100, height: 32, beginEdge: 1324, endEdge: 1800 }
  const slotLeft = { id: 'leftWidget' }
  const candidates = [
    { slot: slotLeft, region: 'left', x: 8, y: 0, width: 1092, height: 32 }
  ]
  const target = bar.centerDropTarget(candidates, box, { x: 1300, y: 16 }, false, null)
  assert.deepStrictEqual(target, { region: 'centerBegin', after: true })
})

check('drop beside right-hand box does not cross notch into centerBegin', () => {
  const box = { x: 1700, y: 0, width: 100, height: 32, beginEdge: 1324, endEdge: 1800 }
  const slotLeft = { id: 'leftWidget' }
  const candidates = [
    { slot: slotLeft, region: 'left', x: 8, y: 0, width: 1092, height: 32 }
  ]
  const target = bar.centerDropTarget(candidates, box, { x: 1690, y: 16 }, false, null)
  assert.notDeepStrictEqual(target && target.region, 'centerBegin')
})

check('centerDropTarget falls back to box edges when no split boundaries given', () => {
  const box = { x: 1000, y: 0, width: 100, height: 32 }
  const target = bar.centerDropTarget([], box, { x: 950, y: 16 }, false, null)
  assert.deepStrictEqual(target, { region: 'centerBegin', after: true })
})

check('centerDropZone preserves beginEdge and endEdge boundaries', () => {
  const zone = bar.centerDropZone({ x: 1700, y: 0, width: 100, height: 32, beginEdge: 1324, endEdge: 1800 }, 32, false)
  assert.strictEqual(zone.beginEdge, 1324)
  assert.strictEqual(zone.endEdge, 1800)
})

// drawer slot pool ownership -----------------------------------------------

check('releasing owner slot reclaims surviving drawer slot from the pool', () => {
  const hosts = {}
  const slots = {}
  const slotPool = {}

  function claim(slot) {
    const key = slot.widgetKey
    const list = slotPool[key] || []
    const idx = list.indexOf(slot)
    if (idx !== -1) list.splice(idx, 1)
    list.push(slot)
    slotPool[key] = list
    const last = slots[key]
    if (last && last !== slot) last.host = null
    slots[key] = slot
    const host = hosts[key] || null
    slot.host = host
    if (host) host.owner = slot
  }

  function release(slot) {
    const key = slot.widgetKey
    const list = slotPool[key] || []
    const idx = list.indexOf(slot)
    if (idx !== -1) {
      list.splice(idx, 1)
      if (list.length === 0) delete slotPool[key]
      else slotPool[key] = list
    }
    slot.host = null
    if (slots[key] !== slot) return

    let survivor = null
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i]) {
        survivor = list[i]
        break
      }
    }

    if (survivor) {
      slots[key] = survivor
      const host = hosts[key] || null
      survivor.host = host
      if (host) host.owner = survivor
    } else {
      delete slots[key]
      if (hosts[key]) hosts[key].owner = null
    }
  }

  const host = { key: 'audio', owner: null }
  hosts[host.key] = host
  const slotA = { widgetKey: 'audio', name: 'slotA', host: null }
  const slotB = { widgetKey: 'audio', name: 'slotB', host: null }

  claim(slotA)
  assert.strictEqual(slotA.host, host)
  assert.strictEqual(host.owner, slotA)

  claim(slotB)
  assert.strictEqual(slotA.host, null)
  assert.strictEqual(slotB.host, host)
  assert.strictEqual(host.owner, slotB)

  release(slotB)
  assert.strictEqual(slotB.host, null)
  assert.strictEqual(slotA.host, host)
  assert.strictEqual(host.owner, slotA)

  release(slotA)
  assert.strictEqual(slotA.host, null)
  assert.strictEqual(host.owner, null)
  assert.strictEqual(slots['audio'], undefined)
})

if (failures > 0) {
  console.log('\n' + failures + ' failing')
  process.exit(1)
}
console.log('\nall passing')
