/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/* ************************************************************************

#module(core)
#require(qx.core.Bootstrap)
#require(qx.core.Variant)
#require(qx.core.Setting)

************************************************************************ */

/**
 * Stuff needed for qooxdoo's advanced JavaScript OO handling.
 */
qx.Clazz.define("qx.Clazz",
{
  statics :
  {
    /** Stores all defined classes */
    registry : {},


    /**
     * Class config
     *
     * Example:
     * <pre><code>
     * qx.Clazz.define("name",
     * {
     *   extend : Object, // superclass
     *   implement : [Interfaces],
     *   include : [Mixins],
     *
     *   statics:
     *   {
     *     CONSTANT : 3.141,
     *
     *     publicMethod: function() {},
     *     _protectedMethod: function() {},
     *     __privateMethod: function() {}
     *   },
     *
     *   properties:
     *   {
     *     "tabIndexOld": { type: "number", defaultValue : -1, compat : true }
     *     "tabIndex": { type: "number", init : -1 }
     *   },
     *
     *   members:
     *   {
     *     publicProperty: "foo",
     *     publicMethod: function() {},
     *
     *     _protectedProperty: "bar",
     *     _protectedMethod: function() {},
     *
     *     __privateProperty: "baz",
     *     __privateMethod: function() {}
     *   }
     * });
     * </code></pre>
     *
     * @param name {String} class name
     * @param config {Map} config structure
     * @param config {Map ? null} config structure
     * @param config.type {String ? null}  type of class ("abstract" | "static" | "singleton")
     * @param config.extend {Function ? null} extend class
     * @param config.implement {Array ? null} list of implement that need to be implemented
     * @param config.include {Array ? null} list of include to include
     * @param config.construct {Function ? null} constructor method to run on each initialization
     * @param config.statics {Map ? null} hash of static properties and methods ("class members")
     * @param config.properties {Map ? null} hash of properties with generated setters and getters
     * @param config.members {Map ? null} hash of regular properties and methods ("instance members")
     * @param config.defer {Function ? null} function to be called for post-processing
     * @param config.settings {Map ? null} hash of settings for this class
     * @param config.variants {Map ? null} hash of settings for this class
     * @param config.events {Array ? null} list of events the class is able to fire
     * @return {void}
     * @throws TODOC
     */
    define : function(name, config)
    {
      var key, value;
      var extend, implement, include, type, settings, variants, construct, statics, properties, members;




      /*
      ---------------------------------------------------------------------------
        Read in configuration map
      ---------------------------------------------------------------------------
      */

      for (key in config)
      {
        value = config[key];

        if (value == null) {
          throw new Error('Invalid key "' + key + '" in class "' + name + '"! The value is undefined/null!');
        }

        switch(key)
        {
          case "extend":
            extend = value;
            break;

          case "implement":
            // Normalize to Array
            if (!(value instanceof Array)) {
              value = [ value ];
            }

            implement = value;
            break;

          case "include":
            // Normalize to Array
            if (!(value instanceof Array)) {
              value = [ value ];
            }
            include = value;
            break;
            
          case "type":
            type = value;
            break;

          case "settings":
            settings = value;
            break;

          case "variants":
            variants = value;
            break;

          case "construct":
            construct = value;
            break;

          case "statics":
            statics = value;
            break;

          case "properties":
            properties = value;
            break;

          case "members":
            members = value;
            break;

          default:
            throw new Error('The configuration key "' + key + '" in class "' + name + '" is not allowed!');
        }
      }




      /*
      ---------------------------------------------------------------------------
        Create Class
      ---------------------------------------------------------------------------
      */

      if (!extend)
      {
        if (construct) {
          throw new Error('Superclass is undefined, but constructor was given for class: "' + name + "'");
        }

        // Create empty/non-empty class
        var obj = {};
      }
      else
      {
        if (!construct) {
          throw new Error('Constructor is missing for class "' + name + "'");
        }

        // Store class pointer
        if (type == "abstract") {
          obj = this.__createAbstractConstructor(name, construct);
        } else if (type == "singleton") {
          obj = this.__createSingletonConstructor(construct);
          // two alternatives to implement singletons
          if (true) {
            // enfore the imlpementation of the interface qx.lang.ISingleton
            if (!implement) {
              implement = [];
            }
            implement.push(qx.lang.ISingleton);
          } else {
            // automagically add the getInstance method to the statics
            if (!statics) {
              statics = {}
            }
            statics.getInstance = qx.lang.MSingleton.statics.getInstance;
          }
        } else {
          obj = construct;
        }
      }

      // Create namespace
      var basename = qx.Clazz.createNamespace(name, obj);

      // Store names in constructor/object
      obj.classname = name;
      obj.basename = basename;

      // Store class reference in global class registry
      qx.Clazz.registry[name] = obj;

      // Compatibility to old properties etc.
      qx.Class = obj;
      qx.Proto = null;
      qx.Super = null;






      /*
      ---------------------------------------------------------------------------
        Attach static class members
      ---------------------------------------------------------------------------
      */

      if (statics)
      {
        for (var vProp in statics)
        {
          obj[vProp] = statics[vProp];

          // Added helper stuff to functions
          if (typeof statics[vProp] == "function")
          {
            // Configure class
            obj[vProp].statics = obj;
          }
        }
      }




      /*
      ---------------------------------------------------------------------------
        Settings
      ---------------------------------------------------------------------------
      */

      if (settings)
      {
        for (var key in settings)
        {
          if (qx.core.Variant.isSet("qx.debug", "on"))
          {
            if (key.substr(0, key.indexOf(".")) != name.substr(0, name.indexOf("."))) {
              throw new Error('Forbidden setting "' + key + '" found in "' + name + '". It forbidden to define a default setting for an external namespace!');
            }
          }

          qx.core.Setting.define(key, settings[key]);
        }
      }





      /*
      ---------------------------------------------------------------------------
        Variants
      ---------------------------------------------------------------------------
      */

      if (variants)
      {
        for (var key in variants)
        {
          if (qx.core.Variant.isSet("qx.debug", "on"))
          {
            if (key.substr(0, key.indexOf(".")) != name.substr(0, name.indexOf("."))) {
              throw new Error('Forbidden setting "' + key + '" found in "' + name + '". It forbidden to define a default setting for an external namespace!');
            }
          }

          qx.core.Variant.define(key, variants[key].allowedValues, variants[key].defaultValue);
        }
      }





      /*
      ---------------------------------------------------------------------------
        Superclass support
      ---------------------------------------------------------------------------
      */

      // For static classes we're done now
      if (!extend) {
        return;
      }

      // Use helper function/class to save the unnecessary constructor call while
      // setting up inheritance. Safari does not support "new Function"
      var helper = function() {};
      helper.prototype = extend.prototype;
      var prot = new helper;

      // Apply prototype to new helper instance
      obj.prototype = prot;

      // Store names in prototype
      prot.classname = name;
      prot.basename = basename;

      // Store reference to extend class
      obj.superclass = prot.superclass = extend;

      // Store correct constructor
      obj.constructor = prot.constructor = construct;

      // Store base constructor to constructor
      construct.base = extend;

      // Compatibility to old properties etc.
      qx.Proto = prot;
      qx.Super = extend;



      /*
      ---------------------------------------------------------------------------
        Attach instance members
      ---------------------------------------------------------------------------
      */

      if (members)
      {
        var superprotoobj = extend.prototype;

        for (var key in members)
        {
          // Attach member
          value = prot[key] = members[key];

          // Added helper stuff to functions
          if (typeof value === "function")
          {
            if (superprotoobj[key])
            {
              // Configure extend (named base here)
              value.base = superprotoobj[key];
            }

            // Configure class [TODO: find better name for statics here]
            value.statics = obj;
          }
        }
      }



      /*
      ---------------------------------------------------------------------------
        Attach properties
      ---------------------------------------------------------------------------
      */

      if (properties)
      {
        for (var key in properties) {
          this.__addProperty(obj, key, properties[key]);
        }
      }
      
      
      
      /*
      ---------------------------------------------------------------------------
        Merge in the Mixins
      ---------------------------------------------------------------------------
      */

      if (include)
      {
        if (qx.core.Variant.isSet("qx.debug", "on")) {
          qx.Mixin.compatible(include, 'include list in Class "' + name + '".');
        }
        for (var i=0, l=include.length; i<l; i++)
        {
          this.__mixin(obj, include[i], false);
        }
      }



      /*
      ---------------------------------------------------------------------------
        Check interface implementation
      ---------------------------------------------------------------------------
      */

      if (implement)
      {
        // Only validate members in debug mode.
        // There is nothing more needed for builds
        if (qx.core.Variant.isSet("qx.debug", "on"))
        {
          for (var i=0, l=implement.length; i<l; i++)
          {
            // Validate members
            var interfaceMembers = implement[i].members;

            for (key in interfaceMembers)
            {
              if (typeof prot[key] != "function") {
                throw new Error('Implementation of method "' + key + '" is missing in Class "' + name + '" required by interface "' + implement[i].name + "'");
              }
            }
            
            // Validate statics
            var interfaceStatics = implement[i].statics;
            for (key in interfaceStatics)
            {
              if (typeof(interfaceStatics[key]) == "function") {
                if (typeof obj[key] != "function") {
                  throw new Error('Implementation of static method "' + key + '" is missing in Class "' + name + '" required by interface "' + implement[i].name + "'");
                }
              }             
            }
                
          }
        }

        for (var i=0, l=implement.length; i<l; i++)
        {
          var interfaceStatics = implement[i].statics;

          for (key in interfaceStatics) {
            if (typeof(interfaceStatics[key]) != "function") {
              // Attach statics
              // Validation is done in qx.Interface
              obj[key] = interfaceStatics[key];
            }
          }
        }
        
        // validate properties
        
      }
    },


    /**
     * Creates a given namespace and assigns the given object to the last part.
     *
     * @type static
     * @name createNamespace
     * @access public
     * @param name {String} The namespace including the last (class) name
     * @param object {Object} The data to attach to the namespace
     * @return {var} TODOC
     */
    createNamespace : function(name, object)
    {
      var splits = name.split(".");
      var len = splits.length;
      var parent = window;
      var part = splits[0];

      for (var i=0, l=len-1; i<l; i++)
      {
        if (!parent[part]) {
          parent[part] = {};
        }

        parent = parent[part];
        part = splits[i + 1];
      }

      // store object
      parent[part] = object;

      // return last part name (e.g. classname)
      return part;
    },


    /**
     * Determine if class exists
     *
     * @type static
     * @name isDefined
     * @access public
     * @param name {String} class name to check
     * @return {Boolean} true if class exists
     */
    isDefined : function(name) {
      return this.registry[name] != null;
    },


    /**
     * Wrapper for qx.OO.addProperty. This is needed in two places so the code
     * has been extracted. The global variables qx.Class, qx.Proto and qx.Super
     * must be set before this method is called.
     * 
     * @param targetClass {Clazz} class to add the properties to
     * @param name {String} Name of the property
     * @param property {Map} new class style property definition
     */
    __addProperty: function(targetClass, name, property) {
      if (qx.core.Variant.isSet("qx.debug", "on")) {
        if (
          (qx.Class != targetClass) ||
          (qx.Proto != targetClass.prototype) ||
          (qx.Super != targetClass.constructor.base)
        ) {
          throw new Error("The global variable qx.Proto, qx.Class and qx.Super must point to the target class!");
        }
      }
      
      var value = property;
      value.name = name;

      if (value.fast) {
        qx.OO.addFastProperty(value);
      } else if (value.cached) {
        qx.OO.addCachedProperty(value);
      } else if (value.compat) {
        qx.OO.addProperty(value);
      } else {
        throw new Error('Could not handle property definition "' + key + '" in Class "' + qx.Proto.classname + "'");
      }
    },
    
    
    /**
     * Include all features of the Mixin into the given Class. 
     *
     * @access private
     * @param targetClass {Clazz} A class previously defined where the mixin should be attached.
     * @param mixin {Mixin} Include all features of this Mixin
     * @param overwrite {Boolean} Overwrite existing functions and properties
     */
    __mixin : function(targetClass, mixin, overwrite) {
      // Attach members
      // Directly attach them. This is because we must not
      // modify them e.g. attaching base etc. because they may
      // used by multiple classes
      var imembers = mixin.members;
      var proto = targetClass.prototype;

      if (imembers == null) {
        throw new Error('Invalid include in class "' + proto.classname + '"! The value is undefined/null!');
      }

      for (var key in imembers) {
        if (qx.core.Variant.isSet("qx.debug", "on")) {
          if (!overwrite && proto[key] != undefined) {
            throw new Error("Overwriting the member '" + key + "' is not allowed!");
          }
        }
        proto[key] = imembers[key];
      }

      // Attach statics
      var istatics = mixin.statics;
      for (var key in istatics) {
        if (qx.core.Variant.isSet("qx.debug", "on")) {
          if (!overwrite && targetClass[key] != undefined) {
            throw new Error("Overwriting the static '" + key + "' is not allowed!");
          }
        }
        targetClass[key] = istatics[key];
      }

      // Attach properties
      var iproperties = mixin.properties;
      for (var key in iproperties) {
        if (qx.core.Variant.isSet("qx.debug", "on")) {
          if (!overwrite) {
            var getterName = "get" + qx.OO.toFirstUp(key);
            if (proto[getterName] != undefined) {
              throw new Error("Overwriting the property '" + key + "' of class '" + proto.classname + "'is not allowed!");
            }
          }
        }   
      this.__addProperty(targetClass, key, iproperties[key]);
      }    
    },
    
    
    /**
     * Convert a constructor into an abstract constructor.
     * 
     * @param className {String} fully qualified class name of the constructor.
     * @param construct {Fuction} the original constructor
     * @return {Function} abstract constructor
     */
    __createAbstractConstructor: function(className, construct)
    {
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        var abstractConstructor = function() {
          if (this.classname == arguments.callee.$ABSTRACT) {
            throw new Error("The class '" + className + "' is abstract! It is not possible to instantiate it.");
          }
          return construct.apply(this, arguments);
        }

        abstractConstructor.$ABSTRACT = className;
        return abstractConstructor;
      }
      else 
      {
        // in production code omit the check and just return the
        // constructor
        return construct;
      }
    },


    /**
     * Add a singleton check to a constructor. The constructor will only work if
     * the static member <code>$ALLOWCONSTRUCT</code> of the class is set to true.
     * 
     * @param construct {Function} original constructor to wrap
     * @return {Function} wrapped constructor
     */
    __createSingletonConstructor: function(construct) {
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {      
        var singletonConstruct = function() {
          if (!arguments.callee.$ALLOWCONSTRUCT) {
            throw new Error("Singleton");
          }
          return construct.apply(this, arguments);
        }
        return singletonConstruct;
      } 
      else
      {
        // in production code omit the check and just return the
        // constructor
        return construct;
      }
    },
    
    
    /**
     * Include all features of the Mixin into the given Class. The Mixin must not include
     * any functions or properties which are already available. This is only possible using
     * the hackier patch method.
     *
     * @type static
     * @name include
     * @access public
     * @param target {Clazz} A class previously defined where the stuff should be attached.
     * @param mixin {Mixin} Include all features of this Mixin
     * @return {call} TODOC
     */
    include : function(target, mixin) {
      return qx.Clazz.__mixin(target, mixin, false);
    },


    /**
     * Include all features of the Mixin into the given Class. The Mixin can include features
     * which are already defined in the target Class. Existing stuff gets overwritten. Please
     * be aware that this functionality is not the preferred way. You can damage working
     * Classes and features.
     *
     * @type static
     * @name patch
     * @access public
     * @param target {Clazz} A class previously defined where the stuff should be attached.
     * @param mixin {Mixin} Include all features of this Mixin
     * @return {call} TODOC
     */
    patch : function(target, mixin) {
      return qx.Clazz.__mixin(target, mixin, true);
    }
  }
});
