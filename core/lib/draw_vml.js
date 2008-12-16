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
// #ifdef __WITH_DRAW
//#ifdef __ENABLE_DRAW_VML
jpf.draw.vml = {
   //----------------------------------------------------------------------
    
    // initialization
    
    //----------------------------------------------------------------------
     
    initRoot : function(r){
        
        jpf.importCssString(document, "v\\:* {behavior: url(#default#VML);}");
        
        r.oExt.onselectstart = function(){
            return false;
        }
        r.oInt.innerHTML = "\
            <div style='z-index:10000;position:absolute;left:0px;width:0px;\
                        background:url(images/spacer.gif);width:"+
                        r.oExt.offsetWidth+"px;height:"+r.oExt.offsetHeight+"px;'>\
            </div>\
            <div style='margin: 0 0 0 0;padding: 0px 0px 0px 0px; \
                        position:absolute;left:0;top:0;width:"+
                        r.oExt.offsetWidth+';height:'+r.oExt.offsetHeight+
                        ";overflow:hidden;'>\
            </div>";
        r.vmlroot = r.oInt.lastChild;
        return this;
    },
        
    initLayer : function(l , r){ 

        var vmlroot = r.vmlroot;
        var tag = "<div style='position:absolute;left:"+l.left+
                  ";top:"+l.top+";width:"+l.width+";height:"+l.height+
                  ";overflow:hidden;'/>";
 
        l.ds = 4;
        l.dx = 0;
        l.dy = 0;
        l.dw = parseFloat(l.width)*l.ds;
        l.dh = parseFloat(l.height)*l.ds;
        
        l.vmltag = "style='position:absolute;display:block;left:0;top:0;width:"+
                   (l.width)+";height:"+(l.height)+
        ";overflow:hidden;' coordorigin='0,0' coordsize='"+(l.dw+1)+","+(l.dh+1)+"'";
        vmlroot.insertAdjacentHTML("beforeend", tag);
        var vmlgroup = vmlroot.lastChild;

        l._styles       = [];
        l._htmljoin     = [];
        l._vmlgroup = vmlgroup;
    },

    updateLayer : function(l){
        // update layer position, and perhaps z-order?
    },
     
    deinitLayer : function(l){
        // we should remove the layer from the output group.
        l._vmlgroup.removeNode();
        l._vmlgroup = 0;
    },

    beginLayer : function(l){
        this.l = l,this.mx="",this.my="",this.last=null;
        return [ this.jssVars,
                "var _s1,_s2,_s3,_s4,_s5,_s6,_s7,_s8,_s9,",
                "_x1,_x2,_x3,_x4,_x5,_x6,_x7,_x8,_x9,_x10,",
                "_y1,_y2,_y3,_y4,_y5,_y6,_y7,_y8,_y9,_y10,",
                    "_t,_u,_l,_dx,_dy,_tn,_tc,_lc,_s,_p,",
                   "_styles = this._styles;"
        ].join('');
    },

    clear : function(){
        return '';
    },
    
    endLayer : function(){
        var l = this.l;
        var s = [this.$endDraw()];

        l._vmlgroup.innerHTML = l._htmljoin.join('');
        var j = 0,i = 0, t, k, v, len = this.l._styles.length;
        for(;i<len;i++){
            var style = this.l._styles[i];

            if(style._prev===undefined){ // original style
                var n = l._vmlgroup.childNodes[j++];
                if(style.isshape){
                    style._vmlnode = n;
                    style._vmlfill = n.firstChild.nextSibling;
                    style._vmlstroke = n.lastChild;
                    //alert(style._vmlstroke.color='red');
                    s.push(this.$finalizeShape(style));
                }
                else{
                    style._txtnode = n;
                    s.push(this.$finalizeFont(style));
                }
            }
        }
        this.l = null;
        return s.join('');
    },
    
    //----------------------------------------------------------------------
    
    // Shape rendering
    
    //----------------------------------------------------------------------

    beginShape : function(style) {
        if(!style.active)return -1;
        var l=this.l, html = l._htmljoin, i, t,
            shape=[], path=[], child=[], opacity="", s=[this.$endDraw()];
        style._path = [];
        if(style._id === undefined){
            style._id = l._styles.push(style)-1;
        }
        this.style = style;

        // find a suitable same-styled other shape so we minimize the VML nodes
        for(i = l._styles.length-2;i>=0;i--){
            if(!l._styles[i]._prev && 
                this.$equalStyle( l._styles[i], style )){
                style._prev = i;
                break;
            }
        }       

        if(style._prev === undefined) {
            s.push("_p=(_s=_styles[",style._id,"])._path=[];");
            // lets check the style object. what different values do we have?
            if(typeof style.tile != 'undefined'){
                var fillalpha = style.fillalpha;
                if( this.isDynamic(fillalpha) ){
                    fillalpha = '1';
                    s.push("_s._vmlfill.opacity=",style.fillalpha,";");
                };
                if(this.isDynamic(style.tile)){
                    s.push("if(_s._vmlimg!=(_t=",style.tile,"))_s._vmlfill.src=_t;");
                    child.push("<v:fill origin='0,0' position='0,0' opacity='",fillalpha,
                                "' src='' type='tile'/>"); 
                }else{
                    child.push("<v:fill origin='0,0' position='0,0' opacity='",fillalpha,
                         "'  src='",style.tile,"' type='tile'/>"); 
                    if(style.tilex || style.tiley){
                        style._img = new Image(); style._img.src = style.tile;
                        if(style.tilex)
                            s.push("_s._vmlfill.origin.x=((_t=((",
                                style.tilex,")/(_s._img.width))%1)<0?1+_t:_t);");
                        if(style.tiley)
                            s.push("_s._vmlfill.origin.y=((_t=((",
                                style.tiley,")/_s._img.height)%1)<0?1+_t:_t);");
                    }
                }
                s.push("_p.push('m',_dx=-_s._img.width*100,' ',_dy=-_s._img.height*100,",
                       "',l',_dx,' ',_dy);");
            }else
            if(style.fill !== undefined){
                // check if our fill is dynamic. 
                var fill = style.fill, fillalpha = style.fillalpha,
                    angle = style.angle, gradalpha = style.gradalpha;
                if(!fill.sort)fill=[fill];
                var len = fill.length;
                var color='black', colors, color2, getColorors;
                // precalc the colors value, we might need it later
                if(len>2){
                    for(i=1;i<len-1&&!this.isDynamic(fill[i]);i++);
                    if(i!=len-1){ // its dynamic
                        for(t=[],i=1;i<len-1;i++)
                            t.push(i>1?'+",':'"',Math.round((i/(len-1))*100),'% "+',
                              this.getColor(fill[i]));
                        colors = t.join('');
                        getColorors = 1;
                    }else{
                        for(t=[],i=1;i<len-1;i++)
                            t.push(i>1?',':'',Math.round((i/(len-1))*100),'% ',fill[i]);
                        colors = t.join(''); 
                    }
                }
                if(len>1){
                    // we have a gradient
                    if( this.isDynamic(gradalpha) || this.isDynamic(fillalpha)){
                        // hack to allow animated alphas for gradients. There is no o:opacity2 property unfortunately
                        if(gradalpha == fillalpha)fillalpha='_t='+fillalpha,gradalpha='_t';
                        if(len>2)t=gradalpha,gradalpha=fillalpha,fillalpha=t;
                        s.push(
                          "if(_s._vmldata!=(_t=", 
                           "[\"<v:fill opacity='\",(",fillalpha,"),\"' method='none' ",
                           "o:opacity2='\",",gradalpha,",\"' color='\",",
                           this.getColor(fill[0]),",\"' color2='\",",
                           this.getColor(fill[len-1]),",\"' type='gradient' angle='\",parseInt(((",
                           angle,")*360+180)%360),\"' ", colors?(getColorors?"colors='\","+
                           colors+",\"'":"colors='"+colors+"'"):"",
                           "/>\"].join(''))){",
                           "_s._vmlnode.removeChild(_s._vmlfill);",
                           "_s._vmlnode.insertAdjacentHTML( 'beforeend',_s._vmldata=_t);",
                           "_s._vmlfill = _s._vmlnode.lastChild;}");
                        child.push("<v:fill opacity='0' color='black' type='fill'/>");
                    }else{
                        if(len>2)t=gradalpha,gradalpha=fillalpha,fillalpha=t;
                        if( this.isDynamic(fill[0]) )
                            s.push("_s._vmlfill.color=",this.getColor(fill[0]),";");
                        else color = fill[0];

                        if(this.isDynamic(fill[len-1]))
                            s.push("_s._vmlfill.color2=",
                                this.getColor(fill[len-1]),";");
                        else color2 = fill[len-1];
                        
                        if(getColorors){
                          s.push("_s._vmlfill.colors.value=",colors,";");
                        }
                        if( this.isDynamic(angle) ){
                            angle = '0';
                            s.push("_s._vmlfill.angle=(((",style.angle,")+180)*360)%360;");
                        };
                        if( this.isDynamic(fillalpha) ){
                            fillalpha = '1';
                            s.push("_s._vmlfill.opacity=",style.fillalpha,";");
                        };
                        child.push("<v:fill opacity='",
                            fillalpha,"' method='none' o:opacity2='",
                            gradalpha,colors?"' colors='"+colors+"'":"",
                            "' color='",color,"' color2='",color2,
                            "' type='gradient' angle='",(angle*360+180)%360,"'/>");
                    }
                }else{
                    if( this.isDynamic(fillalpha) ){
                            fillalpha = '1';
                            s.push("_s._vmlfill.opacity=",style.fillalpha,";");
                    };
                    if( this.isDynamic(fill[0]) )
                        s.push("_s._vmlfill.color=",this.getColor(fill[0]),";");
                    else color = fill[0];
                
                    child.push("<v:fill opacity='",fillalpha,
                        "' color=",this.getColor(color)," type='fill'/>");
                }
                shape.push("fill='t'"),path.push("fillok='t'");
            } else {
                shape.push("fill='f'"),path.push("fillok='f'");
            }
            if(style.line !== undefined){
                var weight = style.weight,
                    alpha = style.linealpha,
                    line = style.line;
                if( this.isDynamic(alpha) ){
                        alpha = '1';
                        s.push("_s._vmlstroke.opacity=",style.alpha,";");
                }
                if( this.isDynamic(weight) ){
                        weight = '1';
                        s.push("_t=",style.weight,
                            ";_s._vmlstroke.weight=_t;if(_t<",alpha,
                            ")_s._vmlstroke.opacity=_t;");
                }
                if( this.isDynamic(line) ){
                        line = 'black';
                        s.push("_s._vmlstroke.color=",this.getColor(style.line),";");
                }
                    
                child.push("<v:stroke opacity='",
                    weight<1?(alpha<weight?alpha:weight):alpha,
                    "' weight='",weight,"' color=",this.getColor(line),"/>");
            } else {
                shape.push("stroke='f'"), path.push("strokeok='f'");
            }
            html.push(["<v:shape alignshape='f' ",l.vmltag," path='' ",shape.join(' '),"><v:path ",
                    path.join(' '),"/>",child.join(' '),"</v:shape>"].join(''));
        }  
        /*
        if(style._prev !== undefined){
            if(this.last !== style._prev)
                s.push("_p=(_s=_styles[",style._prev,"])._path;");
        }    */
       
        return s.join('');
    },
       
    // drawing command
    moveTo : function(x, y){
        return ["_p.push('m',__round(",x,")",
               ",' ',__round(",y+"),'l');\n"].join('');
    },
    
    lineTo : function(x, y){
        return ["_p.push(__round(",x,")",
               ",' ',__round("+y+"));\n"].join('');
    },
    
    lineH : function(x,y,w){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r',__round(",w,"),' 0');"].join('');
    },
    
    lineV : function(x,y,h){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r0 ',__round(",h,"));"].join('');
    },
    
    dot : function(x,y){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r0 0');"].join('');
    },
    
    rect : function( x,y,w,h,inv ){
        return ["_u=",x,";if((_t=__round(",w,"))>0)_p.push('m',__round(_u),' ',__round(",y,")",
                ",'r',_t,' 0r0 ',__round(",h,
                inv?"),'r-'+_t,' 0x');":"),'r-'+_t,' 0xe');"].join('');
    },

    ellipse : function( x,y,w,h,s,e,c){
       if(!s){
        return ["_p.push('at ',(_x1=__round(",x,"))-(_x2=__round(",w,")),' ',(_y1=__round(",y,"))-(_y2=__round(",h,")),' ',",
                "_x1+_x2,' ',_y1+_y2,' 0 0 0 0');"].join('');
       }else{ // generate heaps of crap
        return ["if( (_t=",s,")+0.000001<(_u=",e,")){",
                "_p.push('",c?"at":"wa"," ',(_x1=__round(",x,"))-(_x2=__round(",w,")),' ',(_y1=__round(",y,"))-(_y2=__round(",h,")),' ',",
                "_x1+_x2,' ',_y1+_y2,' ',__round(_x1+__cos(_t)*_x2*4000),' ',__round(_y1+__sin(_t)*_y2*4000),' ',",
                "__round(_x1+__cos(_u)*_x2*4000),' ',__round(_y1+__sin(_u)*_y2*4000),'x');}else{",
                "_p.push('l',__round((",x,")+__cos(_t)*(",w,")),' ',__round((",y,")+__sin(_t)*(",h,")),'x');",
                "}",
                ].join('');
       }
       /*
       
       return ["_p.push('al ',_x1=__round(",x,"),' ',_y1=__round(",y,"),' ',",
               "_x1+__round(",w,"),' ',_y1+__round(",h,"),' 90 1024');"].join('');*/
    },

    
    rectInv : function( x,y,w,h ){
        return this.rect(x,y,w,h,1);
    },
    
    close : function (){
        return "_p.push('xe');";
    },
      
    $endShape : function(){
        this.mx="",this.my="";
        this.last = this.style._id;
        this.style = 0;    
        return '';
    },
      
    $finalizeShape : function(style){
        return ["if((_s=_styles[",style._id,"])._pathstr!=(_t=",
            "(_p=_s._path).length?_p.join(' '):'m'))_s._vmlnode.path=_t;\n"].join('');
    },
    
    //----------------------------------------------------------------------
    
    // State rendering
    
    //----------------------------------------------------------------------

    // state based drawing
    beginState : function( style, sthis, func, nargs ){
        var s = [this.beginShape(style.$shadow || style)];
        
        this.statemode = 1;
        this.statethis = sthis;
        this.stateargs = nargs;
        this.statefunc = func;
    
        var v = style.$statelist, i, n;
        if(!v || !v.length) return s.join('');
    
        s.push("_sh = _s.$statehash, _sl = _s.$storelist,",
               "_st= jpf.draw.stateTransition,_sp = _s.$speedhash;\n");
        
        for(i = 0, n = v.length;i<n;i++){
            s[s.length]="_sl["+i+"].length=0;";
        }
        return s.join('');
    },
    
    drawState:function(state,time) {
        var a=[],t,i,j,v = this.style.$statelist;
        if(!v || !v.length){
             for(i = 2, j = arguments.length;i<j;i++)
                a.push(arguments[i]);
            return this.statefunc.apply(this.statethis,a);
        }
        var s=["if((_t=",state,")&0x36EC0000){",
                    "if((t=(n-",time,")*(_sp[_t]||100000))>1){",
                        "_t=",state,"=_st[_t],",time,"=n,t=0;",
                    "}",
                "}"];
        for(i = 2, j = arguments.length;i<j;i++){
            a.push(t="_s"+(i-1));
            s.push( t,"=",arguments[i],";");
        }

        t = a.join(',');
        s.push("if(_t=_sh[_t]){",
                "_t.push(t,x,",t,");",
                    "if(_u=_t.base){",
                        "if(_u.sort)_u.push(t,x,",t,");",
                        "else _t=0;",
                    "}",
                "}",
                "if(!_t){",this.statefunc.apply(this.statethis,a),"}\n"
            );
        return s.join('');
    },
    
    $endState : function(){
        this.statemode = 0;
        var style = this.style, s = [this.$endDraw()];

        var v = style.$statelist, i, j, l, m, n = this.stateargs+2, a = [];
        if(!v || !v.length)return s.join('');
        
        for(i=2;i<n;i++){
            a.push("_sh[_sv+"+i+"]");
        }
        for(i = 0, j = v.length;i<j;i++){
            style = v[i]; 
            s[s.length]=[
              "if((_st=(_sh=_sl["+i+"]).length)>0){",
                  "t = _sh[0];",
                  this.beginShape(style),
                  "for(_sv=0;_sv<_st;_sv+=",n,"){",
                    style.trans?"t=_sh[_sv];":"","x=_sh[_sv+1];",
                    this.statefunc.apply(this.statethis,a),
                  "}",
                  this.$endDraw(),
              "}else _styles[",style._id,"]._path=[];\n"].join('');
        }
        return s.join('');
    } 
       
}
//#endif
//#endif