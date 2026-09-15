# Notch Bar

A fork of Omarchy's built-in bar (`omarchy.bar`) for Apple Silicon MacBooks with a camera notch. On the built-in panel, the top bar splits into two islands with nothing drawn or clickable behind the notch. On other monitors, at other bar positions, or with the split turned off, it is the stock bar.

## Layout

```
[left …]        [center before marker] |notch| [center after marker]        [… right]
```

- `left` and `right` sections sit at the screen edges, as usual.
- The `center` section hugs the notch. The plugin's zero-width **Notch divider** widget (`{ "id": "connor.bar" }` in `center`) decides which side each widget goes on: entries before it sit left of the notch, entries after it sit right.
- Without the divider, `centerAnchor` ends the left side; without either, the first half goes left.
- Drag widgets across the divider to switch sides. An island's inner side that has no widgets has no drop target, so use `omarchy bar move <id> --section center --index N` instead.

## Config (`~/.config/omarchy/shell.json`, under `bar`)

```json
"notch": { "split": true, "width": 0, "gap": 10 }
```

| Key | Default | Meaning |
|---|---|---|
| `split` | `true` | Split the bar around the notch |
| `width` | `0` (auto) | Notch width in physical pixels |
| `gap` | `Style.space(6)` | Space between each island and the notch, in physical pixels |

Toggle the split: `omarchy-shell omarchy.bar toggleNotchSplit`

## Calibrating the notch width

The default for the 14" MacBook Pro (3024x1964) is an estimate of 400 physical pixels. Set `"gap": 0`, then adjust `"width"` until each island's inner edge just disappears under the cutout. Record the value in `measuredNotchPanels` in `NotchModel.js`.

## Keeping up with Omarchy

Every change to the fork is fenced by `// notch-split: begin` / `// notch-split: end`. After an Omarchy update:

```bash
./sync-upstream.sh   # 3-way merges upstream Bar.qml changes, refreshes BarModel.js
node test/notch-model-test.js
```

Note: a new QML file added to this directory while the shell is running may fail to load with "File name case mismatch" until `omarchy-restart-shell`.

## Removing

`omarchy plugin remove connor.bar` (or `omarchy bar use omarchy.bar`) restores the built-in bar.
