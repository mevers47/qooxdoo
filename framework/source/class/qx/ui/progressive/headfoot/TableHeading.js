/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 Derrell Lipman

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Derrell Lipman (derrell)

************************************************************************ */

/* ************************************************************************

#module(ui_progressive)

************************************************************************ */

/**
 * A header for a standard table.
 */
qx.Class.define("qx.ui.progressive.headfoot.TableHeading",
{
  extend     : qx.ui.progressive.headfoot.Abstract,

  /**
   * @param columnWidths {qx.ui.progressive.renderer.table.Widths}
   *   The set of widths, minimum widths, and maximum widths to be used for
   *   each of the columns in the table.
   *
   * @param labelArr {Array}
   *   Array of labels, one for each of the columns.
   *
   * @return {Void}
   */
  construct : function(columnWidths, labelArr)
  {
    this.base(arguments);

    this._columnWidths = columnWidths;
    
    // Set a default height for the progress bar
    this.setHeight(16);

    // Get the array of column width data
    var columnData = columnWidths.getData();

    // Create a place to put labels
    this._labels = [ ];

    // For each label...
    for (var i = 0; i < columnData.length; i++)
    {
      // ... create an atom to hold the label
      label = new qx.ui.basic.Atom(labelArr[i]);

      // Add the label to this heading.
      this.add(label);
this.warn("Adding label " + label + " (" + labelArr[i] + ") to parent " + this);

      // Save this label so we can resize it later
      this._labels[i] = label;
    }

    // Arrange to be called when the window appears or is resized, so we
    // can set each style sheet's left and width field appropriately.
    this.addListener("resize", this._resizeColumns, this);

    // This layout is not connected to a widget but to this class. This class
    // must implement the method "getLayoutChildren", which must return all
    // columns (LayoutItems) which should be recalcutated. The call
    // "layout.renderLayout" will call the method "renderLayout" on each
    // column data object The advantage of the use of the normal layout
    // manager is that the samantics of flex and percent are exectly the same
    // as in the widget code.
    this._layout = new qx.ui.layout.HBox();
    this._layout.connectToWidget(this);
  },

  members :
  {
    // overridden
    join : function(progressive)
    {
      // Save the progressive handle
      this.base(arguments, progressive);
    },

    /**
     * This method is required by the box layout. If returns an array of items
     * to relayout.
     */
    getLayoutChildren : function()
    {
      if (this.__bCalculateWidths)
      {
        return this._columnWidths.getData();
      }
      else
      {
        return this.getChildren();
      }
    },


    /**
     * Event handler for the "resize" event.  We recalculate and set the
     * new widths of each of our columns.
     *
     * @param e {qx.event.type.Event}
     *   Ignored.
     *
     * @return {Void}
     */
    _resizeColumns : function(e)
    {

      var width =
        this.getBounds().width - qx.bom.element.Overflow.getScrollbarWidth();
/*
      var width =
        (! this._progressive.getContainerElement().getDomElement()
         ? 0
         : this._progressive.getBounds().width) -
        qx.bom.element.Overflow.getScrollbarWidth();
*/

      // Compute the column widths
      this.__bCalculateWidths = true;
this.warn("rendering into width " + width + " with scrollbar width " + qx.bom.element.Overflow.getScrollbarWidth());
      this._layout.renderLayout(width, 100);
      this.__bCalculateWidths = false;

      // Get the column data
      var columnData = this._columnWidths.getData();

      // Get the column width data.  For each label...
      for (var i = 0; i < columnData.length; i++)
      {
this.warn("resize column " + i + " to " + columnData[i].getComputedWidth());
        // ... reset the width of the corresponding column (label)
        this._labels[i].setWidth(columnData[i].getComputedWidth());
      }
    }
  }
});
