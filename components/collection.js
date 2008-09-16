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

// #ifdef __JCOLLECTION || __INC_ALL

/**
 * Virtual component acting as a parent for a set of child components 
 * but only draws it's children. It doesn't have any representation itself.
 *
 * @classDescription		This class creates a new collection
 * @return {Collection} Returns a new collection
 * @type {Collection}
 * @constructor
 * @allowchild {components}, {anyjml}
 * @addnode components:collection
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.collection = function(pHtmlNode){
    jpf.register(this, "collection", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        this.oExt = pHtmlNode;
        this.oInt = pHtmlNode;
        jpf.JmlParser.parseChildren(this.jml, this.oInt, this);
    };
    
    this.__loadJML = function(x){};
}

// #endif