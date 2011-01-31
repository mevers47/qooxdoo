/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Mixin for the border radius CSS property.
 * 
 * Keep in mind that this is not supported by all browsers:
 *   * Firefox 3,5+
 *   * IE9+
 *   * Safari 3.0+
 *   * Opera 10.5+
 *   * Chrome 4.0+
 */
qx.Mixin.define("qx.ui.decoration.MBorderRadius", 
{
  properties : {
    /** top left corner radius */
    radiusTopLeft :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** top right corner radius */
    radiusTopRight :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** bottom left corner radius */
    radiusBottomLeft :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },

    /** bottom right corner radius */
    radiusBottomRight :
    {
      nullable : true,
      check : "Integer",
      apply : "_applyBorderRadius"
    },
    
    /** Property group to set the corner radius of all sides */
    radius :
    {
      group : [ "radiusTopLeft", "radiusTopRight", "radiusBottomRight", "radiusBottomLeft" ],
      mode : "shorthand"
    }
  },
  
  
  members :
  {
    _getMarkupBorderRadius : function(styles) {
      // radius handling
      var radius = this.getRadiusTopLeft();
      if (radius > 0) {
        styles["-moz-border-radius-topleft"] = radius + "px";
        styles["-webkit-border-top-left-radius"] = radius + "px";
        styles["border-top-left-radius"] = radius + "px";
      }
      
      radius = this.getRadiusTopRight();
      if (radius > 0) {
        styles["-moz-border-radius-topright"] = radius + "px";
        styles["-webkit-border-top-right-radius"] = radius + "px";
        styles["border-top-right-radius"] = radius + "px";
      }
      
      radius = this.getRadiusBottomLeft();
      if (radius > 0) {
        styles["-moz-border-radius-bottomleft"] = radius + "px";
        styles["-webkit-border-bottom-left-radius"] = radius + "px";
        styles["border-bottom-left-radius"] = radius + "px";
      }
      
      radius = this.getRadiusBottomRight();
      if (radius > 0) {
        styles["-moz-border-radius-bottomright"] = radius + "px";
        styles["-webkit-border-bottom-right-radius"] = radius + "px";
        styles["border-bottom-right-radius"] = radius + "px";
      }
    },

    // property apply
    _applyBorderRadius : function()
    {
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    }
  }
});
