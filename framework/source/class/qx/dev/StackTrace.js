/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Methods to get information about the JavaScript call stack.
 */
qx.Bootstrap.define("qx.dev.StackTrace",
{
  statics:
  {

    /**
     * Optional user-defined function to convert source file names into readable
     * class names. Will be called with the source file name extracted from the
     * browser's stack trace information as the only argument. The returned
     * string is used in the output of {@link #getStackTraceFromError}
     */
    FILENAME_TO_CLASSNAME : null,

    /**
     * Optional user-defined formatting function for stack trace information.
     * Will be called by with an array of strings representing the calls in the
     * stack trace. {@link #getStackTraceFromError} will return the output of
     * this function
     */
    FORMAT_STACKTRACE : null,

    /**
     * Get a stack trace of the current position in the code.
     *
     * Browser compatibility:
     * <ul>
     *   <li> Mozilla combines the output of {@link #getStackTraceFromError}
     *        and {@link #getStackTraceFromCaller} and thus generates the richest trace.
     *   </li>
     *   <li> Internet Explorer and WebKit always use {@link #getStackTraceFromCaller}</li>
     *   <li> Opera is able to return file/class names and line numbers.</li>
     * </ul>
     *
     * @return {String[]} Stack trace of the current position in the code. Each line in the array
     *     represents one call in the stack trace.
     * @signature function()
     */
    getStackTrace : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        try
        {
          throw new Error();
        }
        catch(ex)
        {
          var errorTrace = this.getStackTraceFromError(ex);
          qx.lang.Array.removeAt(errorTrace, 0);
          var callerTrace = this.getStackTraceFromCaller(arguments);

          var trace = callerTrace.length > errorTrace.length ? callerTrace : errorTrace;
          for (var i=0; i<Math.min(callerTrace.length, errorTrace.length); i++)
          {
            var callerCall = callerTrace[i];
            if (callerCall.indexOf("anonymous") >= 0) {
              continue;
            }

            var callerArr = callerCall.split(":");
            if (callerArr.length != 2) {
              continue;
            }
            var callerClassName = callerArr[0];
            var methodName = callerArr[1];

            var errorCall = errorTrace[i];
            var errorArr = errorCall.split(":");
            var errorClassName = errorArr[0];
            var lineNumber = errorArr[1];

            if (qx.Class.getByName(errorClassName)) {
              var className = errorClassName;
            } else {
              className = callerClassName;
            }
            var line = className + ":";
            if (methodName) {
              line += methodName + ":";
            }
            line += lineNumber;
            trace[i] = line;
          }

          return trace;
        }
      },

      "mshtml|webkit" : function()
      {
        return this.getStackTraceFromCaller(arguments);
      },

      "opera" : function()
      {
        var foo;
        try {
          // force error
          foo.bar();
        }
        catch (ex)
        {
          var trace = this.getStackTraceFromError(ex);
          qx.lang.Array.removeAt(trace, 0)
          return trace;
        }
        return [];
      }
    }),


    /**
     * Get a stack trace from the arguments special variable using the
     * <code>caller</code> property.
     *
     * This methods returns class/mixin and function names of each step
     * in the call stack.
     *
     * Recursion is not supported.
     *
     * @param args {arguments} arguments variable.
     * @return {String[]} Stack trace of caller of the function the arguments variable belongs to.
     *     Each line in the array represents one call in the stack trace.
     * @signature function(args)
     */
    getStackTraceFromCaller : function(args)
    {
      var trace = [];
      var fcn = qx.lang.Function.getCaller(args);
      var knownFunction = {};
      while (fcn)
      {
        var fcnName = qx.lang.Function.getName(fcn);
        trace.push(fcnName);

        try {
          fcn = fcn.caller;
        } catch(ex) {
          break;
        }

        if (!fcn) {
          break;
        }

        // avoid infinite recursion
        var hash = qx.core.ObjectRegistry.toHashCode(fcn);
        if (knownFunction[hash]) {
          trace.push("...");
          break;
        }
        knownFunction[hash] = fcn;
      }
      return trace;
    },


    /**
     * Try to get a stack trace from an Error object. Mozilla sets the field
     * <code>stack</code> for Error objects thrown using <code>throw new Error()</code>.
     * From this field it is possible to get a stack trace from the position
     * the exception was thrown at.
     *
     * This will get the JavaScript file names and the line numbers of each call.
     * The file names are converted into qooxdoo class names if possible (customizable
     * via {@link #FILENAME_TO_CLASSNAME}).
     *
     * The stack trace can be custom formatted using {@link #FORMAT_STACKTRACE}.
     *
     * This works reliably in Gecko-based browsers. Later Opera versions and
     * Chrome also provide a useful stack trace. For Safari, only the class or
     * file name and line number where the error occurred are returned.
     * IE 6/7/8/9 does not attach any stack information to error objects so an
     * empty array is returned.
     *
     * @param error {Error} Error exception instance.
     * @return {String[]} Stack trace of the exception. Each line in the array
     *     represents one call in the stack trace.
     */
    getStackTraceFromError : function(error)
    {
      var trace = [];

      if (qx.core.Environment.get("ecmascript.stacktrace") === "stack") {
        if (!error.stack) {
          return trace;
        }
        // Gecko style, e.g. "()@http://localhost:8080/webcomponent-test-SNAPSHOT/webcomponent/js/com/ptvag/webcomponent/common/log/Logger:253"
        var lineRe = /@(.+):(\d+)$/gm;
        var hit;

        while ((hit = lineRe.exec(error.stack)) != null)
        {
          var url = hit[1];
          var lineNumber = hit[2];

          var className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber);
        }

        if (trace.length > 0) {
          return this.__formatStackTrace(trace);
        }
        /*
         * Chrome trace info comes in two flavors:
         * at [jsObject].function (fileUrl:line:char)
         * at fileUrl:line:char
         */
        var lineRe = /at (.*)/gm;
        var fileReParens = /\((.*?)(:[^\/].*)\)/;
        var fileRe = /(.*?)(:[^\/].*)/;
        var hit;
        while ((hit = lineRe.exec(error.stack)) != null) {
          var fileMatch = fileReParens.exec(hit[1]);
          if (!fileMatch) {
            fileMatch = fileRe.exec(hit[1]);
          }

          if (fileMatch) {
            var className = this.__fileNameToClassName(fileMatch[1]);
            trace.push(className + fileMatch[2]);
          } else {
            trace.push(hit[1]);
          }
        }
      }
      else if (qx.core.Environment.get("ecmascript.stacktrace") === "stacktrace") {
        // Opera
        var stacktrace = error.stacktrace;
        if (!stacktrace) {
          return trace;
        }
        if (stacktrace.indexOf("Error created at") >= 0) {
          stacktrace = stacktrace.split("Error created at")[0];
        }

        // new Opera style (10.6+)
        var lineRe = /line\ (\d+?),\ column\ (\d+?)\ in\ (?:.*?)\ in\ (.*?):[^\/]/gm;
        var hit;
        while ((hit = lineRe.exec(stacktrace)) != null) {
          var lineNumber = hit[1];
          var columnNumber = hit[2];
          var url = hit[3];
          var className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber + ":" + columnNumber);
        }

        if (trace.length > 0) {
          return this.__formatStackTrace(trace);
        }

        // older Opera style
        var lineRe = /Line\ (\d+?)\ of\ linked\ script\ (.*?)$/gm;
        var hit;
        while ((hit = lineRe.exec(stacktrace)) != null) {
          var lineNumber = hit[1];
          var url = hit[2];
          var className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber);
        }
      }
      else if (error.message && error.message.indexOf("Backtrace:") >= 0) {
        // Some old Opera versions append the trace to the message property
        var traceString = qx.lang.String.trim(error.message.split("Backtrace:")[1]);
        var lines = traceString.split("\n");
        for (var i=0; i<lines.length; i++)
        {
          var reResult = lines[i].match(/\s*Line ([0-9]+) of.* (\S.*)/);
          if (reResult && reResult.length >= 2) {
            var lineNumber = reResult[1];
            var fileName = this.__fileNameToClassName(reResult[2]);
            trace.push(fileName + ":" + lineNumber);
          }
        }
      }
      else if (error.sourceURL && error.line) {
        // Safari
        trace.push(this.__fileNameToClassName(error.sourceURL) + ":" + error.line);
      }

      return this.__formatStackTrace(trace);
    },

    /**
     * Converts the URL of a JavaScript file to a class name using either a
     * user-defined ({@link #FILENAME_TO_CLASSNAME}) or default
     * ({@link #__fileNameToClassNameDefault}) converter
     *
     * @param fileName {String} URL of the JavaScript file
     * @return {String} Result of the conversion
     */
    __fileNameToClassName : function(fileName)
    {
      if (typeof qx.dev.StackTrace.FILENAME_TO_CLASSNAME == "function") {
        return qx.dev.StackTrace.FILENAME_TO_CLASSNAME(fileName);
      }

      return qx.dev.StackTrace.__fileNameToClassNameDefault(fileName);
    },


    /**
     * Converts the URL of a JavaScript file to a class name if the file is
     * named using the qooxdoo naming conventions.
     *
     * @param fileName {String} URL of the JavaScript file
     * @return {String} class name of the file if conversion was possible.
     * Otherwise the fileName is returned unmodified.
     */
    __fileNameToClassNameDefault : function(fileName)
    {
      var scriptDir = "/source/class/";
      var jsPos = fileName.indexOf(scriptDir);
      var paramPos = fileName.indexOf("?");
      if (paramPos >= 0) {
        fileName = fileName.substring(0, paramPos);
      }
      var className = (jsPos == -1) ? fileName : fileName.substring(jsPos + scriptDir.length).replace(/\//g, ".").replace(/\.js$/, "");
      return className;
    },


    /**
     * Runs the given stack trace array through the formatter function
     * ({@link #FORMAT_STACKTRACE}) if available and returns it. Otherwise, the
     * original array is returned
     *
     * @param trace {String[]} Stack trace information
     * @return {String[]} Formatted stack trace info
     */
    __formatStackTrace : function(trace)
    {
      if (typeof qx.dev.StackTrace.FORMAT_STACKTRACE == "function") {
        return qx.dev.StackTrace.FORMAT_STACKTRACE(trace);
      }
      return trace;
    }
  }
});
