# Notch Bar

A fork of Omarchy's built-in bar (`omarchy.bar`) for Apple Silicon MacBooks with a camera notch. On the built-in panel, the top bar splits into two islands with nothing drawn or clickable behind the notch. On other monitors, at other bar positions, or with the split turned off, it is the stock bar.

## Layout

```
[left …]        [center before marker] |notch| [center after marker]        [… right]
```

- `left` and `right` sections sit at the screen edges, as usual.
- The `center` section hugs the notch. The plugin's zero-width **Notch divider** widget (`{ "id": "connor.bar" }` in `center`) decides which side each widget goes on: entries before it sit left of the notch, entries after it sit right.
- Without the divider, `centerAnchor` ends the left side; without either, the first half goes left.
- Drag widgets across the divider to switch sides. Each island's notch-facing edge is a drop target, even when that side has no widgets.

## Config (`~/.config/omarchy/shell.json`, under `bar`)

```json
"notch": { "split": true, "width": 348, "gap": 10, "radius": 0 }
```

| Key | Default | Meaning |
|---|---|---|
| `split` | `true` | Split the bar around the notch |
| `width` | `0` (auto) | Notch width in physical pixels |
| `gap` | `Style.space(6)` | Space between each island and the notch, in physical pixels |
| `radius` | `0` | Rounding of each island's notch-facing bottom corner, in physical pixels. Square sits flush with the cutout's own rounded corners |

Toggle the split: `omarchy-shell omarchy.bar toggleNotchSplit`

## Calibrating the notch width

The 14" MacBook Pro (3024x1964) default of 348 physical pixels was calibrated by eye with the default gap: one pixel narrower and the background shows between the notch and the islands. Adjust `"width"` the same way on another panel. Record the value in `measuredNotchPanels` in `NotchModel.js`.

## Keeping up with Omarchy

Every change to the fork is fenced by `// notch-split: begin` / `// notch-split: end`. After an Omarchy update:

```bash
./sync-upstream.sh   # 3-way merges upstream Bar.qml changes, refreshes BarModel.js
node test/notch-model-test.js
```

Note: the running shell does not pick up edits to `Bar.qml` or `NotchModel.js`, and a new QML file may fail with "File name case mismatch". Run `omarchy-restart-shell` after changing the plugin's code.

## Removing

`omarchy plugin remove connor.bar` (or `omarchy bar use omarchy.bar`) restores the built-in bar.
