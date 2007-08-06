qx.Class.define("qx.html2.Table",
{
  extend : qx.core.Object,
  
  construct : function(layout, data)
  {
    this._layout = layout;
    this._data = data;
    
    this._appliedRowPosition = 0;
    this._rowPosition = 0;
    this._rowNumber = 25;
    this._rowHeight = 16;
    this._rowCache = [];
    
    this._scrollTimeout = 50;
    
    this._height = 400;
    this._width = 600;
    
    this._onscrollWrapper = qx.lang.Function.bind(this._onscroll, this);
    this._onintervalWrapper = qx.lang.Function.bind(this._oninterval, this);
    this._helperInterval = window.setInterval(this._onintervalWrapper, this._scrollTimeout);
    
    this._init();
    this._configure();
    this._render();
  },
  
  
  members : 
  {
    getElement : function()
    {
      return this._root;
    },
    
    _init : function()
    {
      this._root = document.createElement("div");
      this._root.style.position = "absolute";
      
      // Create table frame
      this._frame = document.createElement("div");
      
      // Create and configure scrollarea
      this._scrollarea = document.createElement("div");
      this._scrollhelper = document.createElement("div");
      this._scrollarea.onscroll = this._onscrollWrapper;
      this._scrollarea.appendChild(this._scrollhelper);
      
      // Fill root
      this._root.appendChild(this._frame);
      this._root.appendChild(this._scrollarea);
    },
    
    _configure : function()
    {
      // Configure table frame
      this._frame.style.left = "0px";
      this._frame.style.top = "0px";
      this._frame.style.width = this._width + "px";
      this._frame.style.height = this._height + "px";
      this._frame.style.border = "2px solid black";
      
      // Configure scrollarea
      this._scrollarea.style.overflowY = "scroll";
      this._scrollarea.style.position = "absolute";
      this._scrollarea.style.left = this._width + "px";
      this._scrollarea.style.top = "0px";
      this._scrollarea.style.height = this._height + "px";
      this._scrollarea.style.width = "20px";
      
      // Configure scrollhelper
      this._scrollhelper.style.height = (this._rowHeight * this._data.length) + "px";
      this._scrollhelper.style.width = "1px";
      this._scrollhelper.style.visibility = "hidden";
    },
    
    _render : function()
    {
      var html = [];
      
      var pos = this._rowPosition;
      var nr = this._rowNumber;
      
      var layout = this._layout;
      var data = this._data;
      
      html.push("<table style='width:100%;height:100%' cellSpacing='0' cellPadding='0'><tbody");
      
      for (var i=pos, l=pos+nr; i<l; i++)
      {
        html.push("<tr>");
        
        for (var key in layout)
        {
          html.push("<td>", data[i][key], "</td>");
        }
        
        html.push("</tr>");
      }
      
      html.push("</tbody></table>");
      this._frame.innerHTML = html.join("");
    },
    
    _sync : function()
    {
      var now = new Date;
      
      if (now - this._scrollTimeout < this._lastScroll) {
        return;
      }
      
      this._lastScroll = now;
      this._appliedRowPosition = this._rowPosition;
      this._render();      
    },
    
    _onscroll : function(e)
    {
      var rowPos = Math.round(this._scrollarea.scrollTop/this._rowHeight);
      
      if (this._appliedRowPosition == rowPos) {
        return; 
      }
      
      this._rowPosition = rowPos;
    },
    
    _oninterval : function()
    {
      if (this._appliedRowPosition != this._rowPosition) {
        this._sync();
      }
    }
  }
});
