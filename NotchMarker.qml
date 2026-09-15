import QtQuick
import qs.Ui

// Zero-width divider for the center section. On a split notch bar, center
// widgets before it hug the notch from the left and widgets after it hug the
// notch from the right. Elsewhere it takes no space.
BarWidget {
  id: root

  implicitWidth: 0
  implicitHeight: vertical ? 0 : barSize
  visible: false
}
