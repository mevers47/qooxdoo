/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * EXPERIMENTAL - NOT READY FOR PRODUCTION
 */
qx.Class.define("qx.ui.mobile.navigation.Manager",
{
  extend : qx.core.Object,
  type : "singleton",


  construct : function()
  {
    this.base(arguments);
    this.__routes = {},
    this.__routesIdCount = 0;
    this.__operationToIdMapping = {};
    this.__history = [];
    this.__currentGetPath = null;


    this.__navigationHandler = new qx.ui.mobile.navigation.Handler(qx.ui.mobile.navigation.Manager.DEFAULT_PATH);

    this.__navigationHandler.addListener("changeHash", this.__onChangeHash, this);
    this.__navigationHandler.setHash(this.__navigationHandler.getLocationHash());
  },


  statics :
  {
    DEFAULT_PATH : "/"
  },


  members :
  {
    __navigationHandler : null,

    __routes : null,
    __routesIdCount : null,
    __operationToIdMapping : null,
    __currentGetPath : null,

    __history : null,


    getCurrentGetPath : function()
    {
      return this.__currentGetPath;
    },

    onGet : function(route, handler, scope)
    {
      return this._addRoute("get", route, handler, scope);
    },


    onPost : function(route, handler, scope)
    {
      return this._addRoute("post", route, handler, scope);
    },


    onPut : function(route, handler, scope)
    {
      return this._addRoute("put", route, handler, scope);
    },


    onDelete : function(route, handler, scope)
    {
      return this._addRoute("delete", route, handler, scope);
    },


    onAny : function(route, handler, scope)
    {
      return this._addRoute("any", route, handler, scope);
    },


    _addRoute : function(operation, route, handler, scope)
    {
      var routes = this.__routes[operation] = this.__routes[operation] || {};
      var id = this.__routesIdCount++;
      var params = [];
      var param = null;

      // Convert the route to a regular expression.
      if (qx.lang.Type.isString(route))
      {
        var paramsRegexp = /:([\w\d]+)/g;
        var match = null;

        while ((param = paramsRegexp.exec(route)) !== null) {
          params.push(param[1]);
        }
        route = new RegExp("^" + route.replace(paramsRegexp, "([^\/]+)") + "$");
      }

      routes[id] = {regExp:route, params:params, handler:handler, scope:scope};
      this.__operationToIdMapping[id] = operation;
      this._executeRoute(operation, this.__currentGetPath, routes[id]);
      return id;
    },


    remove : function(id)
    {
      var operation = this.__operationToIdMapping[id];
      var routes = this.__routes[operation];
      delete routes[id];
      delete this.__operationToIdMapping[id];
    },


    /**
     * Hash change event handler
     */
    __onChangeHash : function(evt)
    {
      var path = evt.getData();

      if (path != this.__currentGetPath)
      {
        this.executeGet(path, null);
      }
    },


    executeGet : function(path, customData)
    {
      this.__currentGetPath = path;

      var entry = this.__getFromHistory(path);
      if (entry)
      {
        this.debug("Path from history: " + path);
        if (!customData)
        {
          customData = entry.customData || {};
          customData.fromHistory = true;
        }
      } else {
        this.__addToHistory(path, customData);
      }
 
      this.__navigationHandler.setHash(path);
      this._execute("get", path, null, customData);
    },


    executePost : function(path, params, customData)
    {
      this._execute("post", path, params, customData);
    },


    executePut : function(path, params, customData)
    {
      this._execute("put", path, params, customData);
    },


    executeDelete : function(path, params, customData)
    {
      this._execute("delete", path, params, customData);
    },


    __addToHistory : function(path, customData)
    {
      this.debug("Add path " + path + " to history");
      this.__history.unshift({
        path : path,
        customData :customData
      });
    },


    __getFromHistory : function(path)
    {
      var history = this.__history;
      var length = history.length;
      var entry = null;
      for (var i = 0; i < length; i++)
      {
        if (history[i].path == path)
        {
          entry = history[i];
          history.splice(0,i);
          break;
        }
      }
      return entry;
    },


    _execute : function(operation, path, params, customData)
    {
      this.debug("Execute " + operation + " for path " + path);
      var routeMatchedAny = false;
      var routes = this.__routes["any"];
      routeMatchedAny = this._executeRoutes(operation, path, routes, params, customData);

      var routeMatched = false;
      var routes = this.__routes[operation];
      routeMatched = this._executeRoutes(operation, path, routes, params, customData);

      if (!routeMatched && !routeMatchedAny) {
        this.info("No route found for " + path);
      }
    },


    _executeRoutes : function(operation, path, routes, params, customData)
    {
      if (!routes || qx.lang.Object.isEmpty(routes)) {
        return true;
      }
      var routeMatched = false;
      for (var id in routes)
      {
        var route = routes[id];
        routeMatched = this._executeRoute(operation, path, route, params, customData);
      }
      return routeMatched;
    },


    _executeRoute : function(operation, path, route, params, customData)
    {
      var match = route.regExp.exec(path);
      if (match)
      {
        var params = params || {};
        var param = null;
        var value = null;
        match.shift(); // first match is the whole path
        for (var i=0; i < match.length; i++)
        {
          value = this._decode(match[i]);
          param = route.params[i];
          if (param) {
            params[param] = value;
          } else {
            params[i] = value;
          }
        }
        this.debug("Execute " + operation + " handler for path " + path + " and route " + route.regExp.toString());
        route.handler.call(route.scope, {path:path, params:params, customData:customData});
      }
      return match;
    },


    _encode : function(value)
    {
      return encodeURIComponent(value);
    },


    _decode : function(value)
    {
      return decodeURIComponent(value);
    },


    _getRoutes : function()
    {
      return this.__routes;
    }
  },


  destruct : function()
  {
    this.__navigationHandler.removeListener("changeHash", this.__onChangeHash, this);
    this.__history = this.__routes = this.__operationToIdMapping = null;
    this._disposeObjects("__navigationHandler");
  }
});