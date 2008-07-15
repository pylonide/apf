/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

//#ifdef __WITH_DATABINDING

jpf.NameServer = {
    lookup : {},
    
    add    : function(type, xmlNode){
        if (!this.lookup[type])
            this.lookup[type] = [];
        
        //#ifdef __DEBUG
        if(this.onchange)
            this.onchange(type, xmlNode);
        //#endif
        
        return this.lookup[type].push(xmlNode) - 1;
    },
    
    register : function(type, id, xmlNode){
        if (!this.lookup[type])
            this.lookup[type] = {};

        //#ifdef __DEBUG
        if (this.onchange)
            this.onchange(type, xmlNode, id);
        //#endif

        return (this.lookup[type][id] = xmlNode);
    },
    
    get : function(type, id){
        return this.lookup[type] ? this.lookup[type][id] : null;
    },
    
    getAll : function(type){
        var name, arr = [];
        for (name in this.lookup[type]) {
            //#ifdef __SUPPORT_Safari_Old
            if (jpf.isSafariOld
              && (!this.lookup[type][name]
              || typeof this.lookup[type][name] != "object"))
                continue;
            //#endif
            arr.push(this.lookup[type][name]);
        }
        return arr;
    }
    //#ifdef __DEBUG
    , getAllNames : function(type){
        var name, arr = [];
        for (name in this.lookup[type]){
            if (parseInt(name) == name) continue;
            arr.push(name);
        }
        return arr;
    }
    //#endif
}

/**
 * Class SmartBinding represents a connection between a component and data.
 * The SmartBinding presents a way of translating data into representation and back.
 * It offers the possibility to synchronize a second data set on a remote location (server).
 * A SmartBinding also offers the ability to specify rules for drag&drop data handling.
 *
 * @classDescription		This class creates a new smartbinding
 * @return {SmartBinding} Returns a new smartbinding
 * @type {SmartBinding}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.SmartBinding = function(name, xmlNode){
    this.xmlbindings = null;
    this.xmlactions  = null;
    this.xmldragdrop = null;
    this.bindings    = null;
    this.actions     = null;
    this.dragdrop    = null;

    this.jmlNodes    = {};
    this.modelXpath  = {};
    this.name        = name;

    var parts        = {
        bindings: 'loadBindings',
        actions : 'loadActions',
        dragdrop: 'loadDragDrop'
    };
    
    //#ifdef __STATUS
    jpf.status(name
        ? "Creating SmartBinding [" + name + "]"
        : "Creating implicitly assigned SmartBinding");
    //#endif
    
    /**
     * @private
     */
    this.initialize = function(jmlNode, part){
        //register element
        this.jmlNodes[jmlNode.uniqueId] = jmlNode;
        
        if (part)
            return jmlNode[parts[part]](this[part], this["xml" + part]);
        
        if (jmlNode.jml && this.name) 
            jmlNode.jml.setAttribute("smartbinding", this.name);
        
        for (part in parts) {
            //#ifdef __SUPPORT_Safari
            if (typeof parts[part] != "string") continue;
            //#endif
            if (!this[part]) continue;

            if (!jmlNode[parts[part]])
                throw new Error(1035, jpf.formErrorString(1035, jmlNode, "initialize method in SmartBindings object", "Could not find handler for '" + part + "'."));

            jmlNode[parts[part]](this[part], this["xml" + part]);
        }
        
        if (this.model)
            this.model.register(jmlNode, this.modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making MOdels with links to other models possible, this should not be needed
        else if (jmlNode.model)
            jmlNode.model.reloadJmlNode(jmlNode.uniqueId);//.load(jmlNode.model.data.selectSingleNode("Accounts/Account[1]"));
    }
    
    /**
     * @private
     */
    this.deinitialize = function(jmlNode){
        //unregister element
        this.jmlNodes[jmlNode.uniqueId] = null;
        delete this.jmlNodes[jmlNode.uniqueId];
        
        if (this.model)
            this.model.unregister(jmlNode);
    }
    
    /**
     * @private
     */
    this.addBindRule = function(xmlNode, jmlParent){
        var str = xmlNode[jpf.TAGNAME] == "ref"
            ? jmlParent ? jmlParent.mainBind : "value"
            : xmlNode.tagName;
        if (!this.bindings)
            this.bindings = {};
        if (!this.bindings[str])
            this.bindings[str] = [xmlNode];
        else
            this.bindings[str].push(xmlNode);
    }
    
    /**
     * @private
     */
    this.addBindings = function(rules){
        this.bindings    = rules;//jpf.getRules(xmlNode);
        this.xmlbindings = xmlNode;
    }
    
    /**
     * @private
     */
    this.addActionRule = function(xmlNode){
        var str = xmlNode[jpf.TAGNAME] == "action" ? "Change" : xmlNode.tagName;
        if (!this.actions)
            this.actions = {};
        if (!this.actions[str])
            this.actions[str] = [xmlNode];
        else
            this.actions[str].push(xmlNode);
    }
    
    /**
     * @private
     */
    this.addActions = function(rules, xmlNode){
        this.actions    = rules;//jpf.getRules(xmlNode);
        this.xmlactions = xmlNode;
    }
    
    /**
     * @private
     */
    this.addDropRule = 
    this.addDragRule = function(xmlNode){
        if (!this.dragdrop)
            this.dragdrop = {};
        if (!this.dragdrop[xmlNode[jpf.TAGNAME]])
            this.dragdrop[xmlNode[jpf.TAGNAME]] = [xmlNode];
        else
            this.dragdrop[xmlNode[jpf.TAGNAME]].push(xmlNode);
    }
    
    /**
     * @private
     */
    this.addDragDrop = function(rules, xmlNode){
        this.dragdrop    = rules;//jpf.getRules(xmlNode);
        this.xmldragdrop = xmlNode;
    }
    
    /**
     * @private
     */
    this.setModel = function(model, xpath){
        if (typeof model == "string")
            model = jpf.NameServer.get("model", model);
        
        this.model          = jpf.NameServer.register("model", this.name, model);
        this.modelBaseXpath = xpath;
        
        for (var uniqueId in this.jmlNodes) {
            this.model.unregister(this.jmlNodes[uniqueId]);
            this.model.register(jmlNode, this.modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making Models with links to other models possible, this should not be needed
            //this.jmlNodes[uniqueId].load(this.model);
        }
    }
    
    /**
     * Loads xml data in all the components using this SmartBinding.
     * 
     * @param  {variant}  xmlRootNode  optional  XMLNode  XML node which is loaded in this component. 
     *                                          String  Serialize xml which is loaded in this component.
     *                                          Null  Giving null clears this component {@link Cache#clear}.
     */
    this.load = function(xmlNode){
        this.setModel(new jpf.Model().load(xmlNode));
    }
    
    this.loadJML = function(xmlNode){
        this.name = xmlNode.getAttribute("id");
        this.jml  = xmlNode;
        
        //Bindings
        if (xmlNode.getAttribute("bindings")) {
            //#ifdef __DEBUG
            if (!jpf.NameServer.get("bindings", xmlNode.getAttribute("bindings")))
                throw new Error(1036, jpf.formErrorString(1036, this, "Connecting bindings", "Could not find bindings by name '" + xmlNode.getAttribute("bindings") + "'"));
            //#endif
            
            var cNode = jpf.NameServer.get("bindings", xmlNode.getAttribute("bindings"));
            this.addBindings(jpf.getRules(cNode), cNode);
        }
        
        //Actions
        if (xmlNode.getAttribute("actions")) {
            //#ifdef __DEBUG
            if (!jpf.NameServer.get("actions", xmlNode.getAttribute("actions")))
                throw new Error(1037, jpf.formErrorString(1037, this, "Connecting bindings", "Could not find actions by name '" + xmlNode.getAttribute("actions") + "'"));
            //#endif
            
            var cNode = jpf.NameServer.get("actions", xmlNode.getAttribute("actions"));
            this.addActions(jpf.getRules(cNode), cNode);
        }
        
        //DragDrop
        if (xmlNode.getAttribute("dragdrop")) {
            //#ifdef __DEBUG
            if (!jpf.NameServer.get("dragdrop", xmlNode.getAttribute("dragdrop")))
                throw new Error(1038, jpf.formErrorString(1038, this, "Connecting dragdrop", "Could not find dragdrop by name '" + xmlNode.getAttribute("dragdrop") + "'"));
            //#endif
            
            var cNode = jpf.NameServer.get("dragdrop", xmlNode.getAttribute("dragdrop"));
            this.addDragDrop(jpf.getRules(cNode), cNode);
        }
        
        var data_node, nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
    
            switch (nodes[i][jpf.TAGNAME]) {
                case "model":
                    data_node = nodes[i];
                    break;
                case "bindings":
                    this.addBindings(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "actions":
                    this.addActions(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "dragdrop":
                    this.addDragDrop(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "ref":
                    this.addBindRule(nodes[i]);
                    break;
                case "action":
                    this.addActionRule(nodes[i]);
                    break;
                default:
                    throw new Error(1039, jpf.formErrorString(1039, this, "setSmartBinding Method", "Could not find handler for '" + nodes[i].tagName + "' node."));
                    //when an unknown found assume that this is an implicit bindings node
                    //this.addBindings(jpf.getRules(xmlNode)); 
                    break;
            }
        }
        
        //Set Model
        if (data_node)
            this.setModel(new jpf.Model().loadJML(data_node));
        else if (xmlNode.getAttribute("model"))
            jpf.setModel(xmlNode.getAttribute("model"), this);
    }
    
    if (xmlNode)
        this.loadJML(xmlNode);
}

// #endif
