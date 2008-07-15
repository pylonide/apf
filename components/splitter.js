// #ifdef __WITH_ALIGNMENT

/**
 * @constructor
 * @private
 */
jpf.splitter = function(pHtmlNode){
    jpf.register(this, "splitter", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    var jmlNode = this;
    this.focussable = true; // This object can get the focus
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.update = function(){
        //Optimize this to not recalc for certain cases
        var b = this.type == "vertical" ?
            {fsize : "fwidth", size : "width", offsetPos : "offsetLeft", offsetSize : "offsetWidth", pos : "left"} : 
            {fsize : "fheight", size : "height", offsetPos : "offsetTop", offsetSize : "offsetHeight", pos : "top"};
        
        var jmlNode = this.refNode;
        var htmlNode = this.refHtml;
        
        var v = jpf.layoutServer.vars;
        var oItem = this.oItem;
        
        var itemStart = htmlNode ? htmlNode[b.offsetPos] : v[b.pos + "_" + oItem.id];
        var itemSize = htmlNode ? htmlNode[b.offsetSize] : v[b.size + "_" + oItem.id];
        
        var row = oItem.parent.children;
        for(var z=0,i=0;i<row.length;i++) if(!row[i][b.fsize]) z++;

        if(!oItem[b.fsize] && z > 1){
            for(var rTotal=0, rSize=0, i=oItem.stackId+1;i<row.length;i++){
                if(!row[i][b.fsize]){
                    rTotal += row[i].weight || 1;
                    rSize += (row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id]);
                }
            }
            
            var diff = this.oExt[b.offsetPos] - itemStart - itemSize;
            var rEach = (rSize - diff)/rTotal;
            
            for(var i=0;i<oItem.stackId;i++){
                if(!row[i][b.fsize]) row[i].original.weight = (row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id]) / rEach;
            }

            oItem.original.weight = (itemSize + diff) / rEach
            needRecalc = true;
        }
        else{
            var isNumber = oItem[b.fsize] ? oItem[b.fsize].match(/^\d+$/) : false;
            var isPercentage = oItem[b.fsize] ? oItem[b.fsize].match(/^([\d\.]+)\%$/) : false;
            if(isNumber || isPercentage || !oItem[b.fsize]){
                var diff = this.oExt[b.offsetPos] - itemStart - itemSize;
                var newHeight = this.oExt[b.offsetPos] - itemStart;
                
                for(var total=0, size=0, i=oItem.stackId+1;i<row.length;i++){
                    if(!row[i][b.fsize]){
                        total += row[i].weight || 1;
                        size += (row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id]);
                    }
                }
                
                if(total > 0){
                    var ratio = ((size-diff)/total)/(size/total);
                    for(var i=oItem.stackId+1;i<row.length;i++)
                        row[i].original.weight = ratio * (row[i].weight || 1);
                }
                else{
                    for(var i=oItem.stackId+1;i<row.length;i++){
                        if(row[i][b.fsize].match(/^\d+$/)){
                            //should check for max here as well
                            var nHeight = (row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id]) - diff;
                            row[i].original[b.fsize] = "" + Math.max(0, nHeight, row[i].minheight || 0);
                            if(row[i][b.fsize] - nHeight != 0) diff = row[i][b.fsize] - nHeight;
                            else break;
                        }
                        else if(row[i][b.fsize].match(/^([\d\.]+)\%$/)){
                            var nHeight = (row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id]) - diff;
                            row[i].original[b.fsize] = Math.max(0, ((parseFloat(RegExp.$1)/(row[i].node ? row[i].oHtml[b.offsetSize] : v[b.size + "_" + row[i].id])) * nHeight)) + "%";
                            //check fheight
                            break;
                        }
                    }
                }
                
                if(oItem.original[b.fsize]){
                    oItem.original[b.fsize] = isPercentage ? 
                        ((parseFloat(isPercentage[1])/itemSize) * newHeight) + "%" :
                        "" + newHeight;
                }
                
                //if(total > 0  || isPercentage) needRecalc = true;
                needRecalc = true;
            }
        }
    
        if(needRecalc){
            jpf.layoutServer.compile(this.oExt.parentNode);
            jpf.layoutServer.activateRules(this.oExt.parentNode);
            
            return;
        }

        jpf.layoutServer.forceResize(this.oExt.parentNode);
    }
    
    this.onmouseup = function(){
        jmlNode.__setStyleClass(jmlNode.oExt, "", ["moving"]);
        jpf.Plane.hide();
        
        jmlNode.update();
        jmlNode.__setStyleClass(document.body, "", ["n-resize", "w-resize"]);
        
        jpf.DragMode.clear();
    }
    
    this.onmousemove = function(e){
        if(!e) e = event;

        if(jmlNode.type == "vertical"){
            if(e.clientX >= 0){
                var pos = jpf.compat.getAbsolutePosition(jmlNode.oExt.offsetParent);
                jmlNode.oExt.style.left = (Math.min(jmlNode.max, Math.max(jmlNode.min, (e.clientX - pos[0]) - jmlNode.tx))) + "px";
            }
        }
        else{
            if(e.clientY >= 0){
                var pos = jpf.compat.getAbsolutePosition(jmlNode.oExt.offsetParent);
                jmlNode.oExt.style.top = (Math.min(jmlNode.max, Math.max(jmlNode.min, (e.clientY - pos[1]) - jmlNode.ty))) + "px";
            }
        }
        
        e.returnValue = false;
        e.cancelBubble = true;
    }

    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    var lastinit, sizeArr, verdiff, hordiff;
    this.init = function(size, refNode, oItem){
        /*var li = size + min + max + (refNode.uniqueId || refNode);
        if(li == lastinit) return;
        lastinit = li;*/
        this.min = 0;
        this.max = 1000000;
        this.size = parseInt(size) || 3;
        this.refNode = null;
        this.refHtml = null;
        
        var pNode;
        if(refNode){
            if(typeof refNode != "object") refNode = jpf.lookup(refNode);
            this.refNode = refNode;
            this.refHtml = this.refNode.oExt;
            pNode = this.refHtml.parentNode;

            oItem = refNode.aData.calcData;
        }
        else pNode = oItem.pHtml;
        
        this.oItem = oItem;
        if(pNode && pNode != this.oExt.parentNode) pNode.appendChild(this.oExt);
        
        var diff = jpf.compat.getDiff(this.oExt);
        verdiff = diff[0];
        hordiff = diff[1];
        sizeArr = [];
        
        this.type = oItem.parent.vbox ? "horizontal" : "vertical";
        
        var layout = jpf.layoutServer.get(this.oExt.parentNode).layout;
        var name = "splitter" + this.uniqueId;
        layout.addRule("var " + name + " = jpf.lookup(" + this.uniqueId + ").oExt");
        
        var vleft = [name + ".style.left = "];
        var vtop = [name + ".style.top = "];
        var vwidth = [name + ".style.width = -" + hordiff + " + "];
        var vheight = [name + ".style.height = -" + verdiff + " + "];
        var oNext = oItem.parent.children[oItem.stackId+1];
        
        if(this.type == "horizontal"){
            vwidth.push("Math.max(");
            if(oItem.node){
                vleft.push(oItem.id + ".offsetLeft");
                vtop.push(oItem.id + ".offsetTop + " + oItem.id + ".offsetHeight");
                vwidth.push(oItem.id + ".offsetWidth");
            }
            else{
                vleft.push("v.left_" + oItem.id);
                vtop.push("v.top_" + oItem.id + " + v.height_" + oItem.id);
                vwidth.push("v.width_" + oItem.id);
            }
            vwidth.push(",", oNext.node ? oNext.id + ".offsetWidth" : "v.width_" + oNext.id, ")");
            
            layout.addRule(vwidth.join(""));
            this.oExt.style.height = (oItem.splitter - hordiff) + "px";
        }
        else{
            vheight.push("Math.max(");
            if(oItem.node){
                vleft.push(oItem.id + ".offsetLeft + " + oItem.id + ".offsetWidth");
                vtop.push(oItem.id + ".offsetTop");
                vheight.push(oItem.id + ".offsetHeight");
            }
            else{
                vleft.push("v.left_" + oItem.id + " + v.width_" + oItem.id);
                vtop.push("v.top_" + oItem.id);
                vheight.push("v.height_" + oItem.id);
            }
            vheight.push(",", oNext.node ? oNext.id + ".offsetHeight" : "v.height_" + oNext.id, ")");
            
            layout.addRule(vheight.join(""));
            this.oExt.style.width = (oItem.splitter - hordiff) + "px";
        }
        
        layout.addRule(vleft.join(""));
        layout.addRule(vtop.join(""));

        //if(!jpf.p) jpf.p = new jpf.ProfilerClass();
        //jpf.p.start();
        
        //Determine min and max
        var row = oItem.parent.children;
        if(this.type == "vertical"){
            layout.addRule(name + ".host.min = " + (oItem.node ? "document.getElementById('" + oItem.id + "').offsetLeft" : "v.left_" + oItem.id) + " + " + parseInt(oItem.minwidth || oItem.childminwidth || 10));

            var max = [], extra = [];
            for(var hasRest=false,i=oItem.stackId+1;i<row.length;i++){
                if(!row[i].fwidth) hasRest = true;
            }
            
            for(var d, i=oItem.stackId+1;i<row.length;i++){
                d = row[i];
                
                //should take care here of minwidth due to html padding and html borders
                if(d.minwidth || d.childminheight) max.push(parseInt(d.minwidth || d.childminheight));
                else if(d.fwidth){
                    if(!hasRest && i == oItem.stackId+1) max.push(10);
                    else if(d.fwidth.indexOf("%") != -1)
                        max.push("(" + d.parent.innerspace + ") * " + (parseFloat(d.fwidth)/100));
                    else max.push(d.fwidth);
                }
                else max.push(10);
                
                max.push(d.edgeMargin);
            }
            
            layout.addRule(name + ".host.max = v.left_" + oItem.parent.id + " + v.width_" + oItem.parent.id + " - (" + (max.join("+")||0) + ")");
        }
        else{
            layout.addRule(name + ".host.min = " + (oItem.node ? "document.getElementById('" + oItem.id + "').offsetTop" : "v.top_" + oItem.id) + " + " + parseInt(oItem.minheight || oItem.childminheight || 10));

            var max = [], extra = [];
            for(var hasRest=false,i=oItem.stackId+1;i<row.length;i++){
                if(!row[i].fheight) hasRest = true;
            }
            
            //This line prevents splitters from sizing minimized items without a rest
            if(!hasRest && oNext.state > 0) return this.oExt.parentNode.removeChild(this.oExt);
            
            for(var d, i=oItem.stackId+1;i<row.length;i++){
                d = row[i];
                
                //should take care here of minwidth due to html padding and html borders
                if(d.minheight || d.childminheight) max.push(parseInt(d.minheight || d.childminheight));
                else if(d.fheight){
                    if(!hasRest && i == oItem.stackId+1) max.push(10);
                    else if(d.fheight.indexOf("%") != -1)
                        max.push("(" + d.parent.innerspace + ") * " + (parseFloat(d.fheight)/100));
                    else max.push(d.fheight);
                }
                else max.push(10);
                
                max.push(d.edgeMargin);
            }

            layout.addRule(name + ".host.max = v.top_" + oItem.parent.id + " + v.height_" + oItem.parent.id + " - (" + (max.join("+")||0) + ")");
        }

        //jpf.p.stop();
        //document.title = jpf.p.totalTime;	
        
        this.__setStyleClass(this.oExt, this.type, [this.type == "horizontal" ? "vertical" : "horizontal"]);
        
        if(this.type == "vertical") this.__setStyleClass(this.oExt, "w-resize", ["n-resize"]);
        else this.__setStyleClass(this.oExt, "n-resize", ["w-resize"]);

        return this;
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();

        this.oExt.onmousedown = function(e){
            if(!e) e = event;
            
            var pos = jpf.compat.getAbsolutePosition(this);
            if(jmlNode.type == "vertical") jmlNode.tx = e.clientX - pos[0];
            else jmlNode.ty = e.clientY - pos[1];
            jmlNode.startPos = jmlNode.type == "vertical" ? this.offsetLeft : this.offsetTop;
            
            e.returnValue = false;
            e.cancelBubble = true;
            
            jpf.Plane.show(this);
            jmlNode.__setStyleClass(this, "moving");
            
            jmlNode.__setStyleClass(document.body, jmlNode.type == "vertical" ? "w-resize" : "n-resize", [jmlNode.type == "vertical" ? "n-resize" : "w-resize"]);
            jpf.DragMode.setMode("splitter" + jmlNode.uniqueId);
        }
    }
        
    this.__loadJML = function(x){
        if(x.getAttribute("left") || x.getAttribute("top")){
            var O1 = x.getAttribute("left") || x.getAttribute("top");
            var O2 = x.getAttribute("right") || x.getAttribute("bottom");
            O1 = O1.split(/\s*,\s*/);
            O2 = O2.split(/\s*,\s*/);
            
            for(var i=0;i<O1.length;i++) O1[i] = O1[i];
            for(var i=0;i<O2.length;i++) O2[i] = O2[i];
                
            //Not a perfect hack, but ok, for now
            setTimeout(function(){
                jmlNode.init(x.getAttribute("type"), x.getAttribute("size"), x.getAttribute("min"), x.getAttribute("max"), x.getAttribute("change"), O1, O2);
            });
        }
    }
    
    jpf.Plane.init();
    jpf.DragMode.defineMode("splitter" + this.uniqueId, this);
    
    this.__destroy = function(){
        jpf.DragMode.removeMode("splitter" + this.uniqueId);
    }
}
// #endif