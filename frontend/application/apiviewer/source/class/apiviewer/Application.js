/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132)
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#module(apiviewer)
#resource(apiviewer.css:apiviewer/css)
#resource(apiviewer.image:apiviewer/image)
#embed(apiviewer.css/*)

#asset(apiviewer/css/*)

************************************************************************ */

/**
 * The main application class.
 */
qx.Class.define("apiviewer.Application",
{
  extend : qx.legacy.application.Gui,

  members :
  {
    main : function()
    {
      this.base(arguments);

      qx.Class.include(qx.legacy.ui.core.Widget, apiviewer.MWidgetRegistry);

      // Define alias for custom resource path
      qx.util.AliasManager.getInstance().add("api", qx.core.Setting.get("apiviewer.resourceUri") + "/apiviewer");

      // Include CSS file
      qx.bom.Stylesheet.includeFile(qx.util.AliasManager.getInstance().resolve("api/css/apiviewer.css"));

      // preload images
      var preloader = new qx.legacy.io.image.PreloaderSystem(apiviewer.TreeUtil.PRELOAD_IMAGES);
      preloader.start();

      // Initialize the viewer
      this.viewer = new apiviewer.Viewer();
      this.controller = new apiviewer.Controller();
      this.viewer.addToDocument();

      // Load data file
      qx.event.Timer.once(this._load, this, 0);
    },

    _load : function()
    {
      // Finally load the data
      this.controller.load("script/apidata.js");
    }
  },




  /*
  *****************************************************************************
     SETTINGS
  *****************************************************************************
  */

  settings : {
    "apiviewer.resourceUri" : "./resource"
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeObjects("viewer", "controller");
  }
});
