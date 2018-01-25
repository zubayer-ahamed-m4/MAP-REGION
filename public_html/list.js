/* Copyright 2017, Chris Youderian, SimpleMaps, http://simplemaps.com
 Released under MIT license - https://opensource.org/licenses/MIT 
 Requires SimpleMaps version 3.5+
 */
(function (plugin) {

    //Start helper functions
    //IE8 support for index of
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (needle) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === needle) {
                    return i;
                }
            }
            return -1;
        };
    }

    //add support for index of
    Array.prototype.indexOf || (Array.prototype.indexOf = function (d, e) {
        var a;
        if (null === this)
            throw new TypeError('"this" is null or not defined');
        var c = Object(this),
                b = c.length >>> 0;
        if (0 === b)
            return -1;
        a = +e || 0;
        Infinity === Math.abs(a) && (a = 0);
        if (a >= b)
            return -1;
        for (a = Math.max(0 <= a ? a : b - Math.abs(a), 0); a < b; ) {
            if (a in c && c[a] === d)
                return a;
            a++;
        }
        return -1;
    });

    //docReady in pure JavaScript, source: https://github.com/jfriend00/docReady/blob/master/docready.js, MIT
    (function (funcName, baseObj) {
        funcName = funcName || "docReady";
        baseObj = baseObj || window;
        var readyList = [];
        var readyFired = false;
        var readyEventHandlersInstalled = false;
        function ready() {
            if (!readyFired) {
                readyFired = true;
                for (var i = 0; i < readyList.length; i++) {
                    readyList[i].fn.call(window, readyList[i].ctx);
                }
                readyList = [];
            }
        }
        function readyStateChange() {
            if (document.readyState === "complete") {
                ready();
            }
        }
        baseObj[funcName] = function (callback, context) {
            if (readyFired) {
                setTimeout(function () {
                    callback(context);
                }, 1);
                return;
            } else {
                readyList.push({fn: callback, ctx: context});
            }
            if (document.readyState === "complete" || !document.attachEvent && document.readyState === "interactive") {
                setTimeout(ready, 1);
            } else if (!readyEventHandlersInstalled) {
                if (document.addEventListener) {
                    document.addEventListener("DOMContentLoaded", ready, false);
                    window.addEventListener("load", ready, false);
                } else {
                    document.attachEvent("onreadystatechange", readyStateChange);
                    window.attachEvent("onload", ready);
                }
                readyEventHandlersInstalled = true;
            }
        };
    })("docReady", window);

    function create_style(str) {
        var pa = document.getElementsByTagName('head')[0];
        var el = document.createElement('style');
        el.type = 'text/css';
        el.media = 'screen';
        if (el.styleSheet)
            el.styleSheet.cssText = str;// IE method
        else
            el.appendChild(document.createTextNode(str));// others
        pa.appendChild(el);
        return el;
    }

    //find region ids
    function extract_ids(map) {
        arr = [];
        //console.log("Region Id");
        for (var region in map.mapdata.regions) {
           arr.push(region);
           //console.log(region);
        }
        return arr;
    }
    
    //find region url
    function extract_url(map) {
        arr = [];
        //console.log("Url");
        for (var id in map.mapdata.regions) {
           arr.push(map.mapdata.regions[id].url);
        }
        //console.log(arr);
        return arr;
    }

    //filter id
    function filter_ids(arr, exclude) {
        clean_arr = [];
        for (var i = 0; i < arr.length; i++) {
            id = arr[i];
            if (exclude.indexOf(id) === -1) {
                clean_arr.push(id);
            }
        }
        return clean_arr;
    }
    
    //filter urls
    function filter_url(arr, exclude) {
        clean_arr = [];
        for (var i = 0; i < arr.length; i++) {
            id = arr[i];
            if (exclude.indexOf(id) === -1) {
                clean_arr.push(id);
            }
        }
        return clean_arr;
    }

    function create_html(ids_clean, me, url_clean) {
        //alert(me.map.mapinfo.default_regions[0].name);
        var html = '';
        var elements = {};
        for (var i = 0; i < ids_clean.length; i++) {
            var id = ids_clean[i];
            var name = me.map.mapinfo.default_regions[id].name;
            //alert(name);
            if (!name) {
                continue
            }
            var dom_id = 'simplemaps_list_' + id;
            var ul = document.getElementById(me.div);
            var li = document.createElement("li");
            ul.appendChild(li);
            
            var url = url_clean[i];
            var a = document.createElement("a");
            a.setAttribute("href", url);
            a.setAttribute("target", "_blank");
            a.innerHTML = name;
            li.appendChild(a);
            
            elements[id] = li;
        }
        return elements;
    }

    function set_to_events(all_elements, me) {
        if (!me.list_to_map) {
            return;
        }
        for (var id in all_elements) {
            var element = all_elements[id];
            (function (id) {
                element.onmouseenter = function () {
                    me.map.popup('region', id);
                };
            })(id);
            element.onmouseleave = function () {
                me.map.popup_hide();
            };
        }
    }

    function set_from_events(all_elements, me) {
        if (!me.map_to_list) {
            return;
        }
        me.map.plugin_hooks.over_region.push(function (id) {
            all_elements[id].className = me.div + '_over';
        });
        me.map.plugin_hooks.out_region.push(function (id) {
            all_elements[id].className = '';
        });
    }


    //End helper functions
    var api_object = {
        map: false,
        div: plugin,
        include: [],
        exclude: [],
        hover_color: false,
        style: true,
        map_to_list: true,
        list_to_map: true
    };

    window[plugin] = api_object;

    docReady(function () {
        var me = api_object;
        var map = me.map ? me.map : window['simplemaps_worldmap']; //usmap is default
        if (!me.hover_color) {
            me.hover_color = me.map.mapdata.main_settings.state_hover_color;
        }
        if (me.style) {
            css_text = '#' + me.div + ' li{cursor: pointer; list-style-type: none;}';
            css_text += '#' + me.div + ' li:hover{color: ' + me.hover_color + ', font-weight: bold;}';
            css_text += 'li.' + me.div + '_over{color: ' + me.hover_color + '; font-weight: bold;}';
            create_style(css_text);
        }
        var ids_raw = (me.include.length > 0) ? me.include : extract_ids(map);
        var url_raw = (me.include.length > 0) ? me.include : extract_url(map); 
        
        var ids_clean = filter_ids(ids_raw, me.exclude);
        var url_clean = filter_url(url_raw, me.exclude);
        
        all_elements = create_html(ids_clean, me, url_clean);
        set_to_events(all_elements, me);
        set_from_events(all_elements, me);
        window[plugin] = api_object;
    });

})('simplemaps_list'); //change plugin name to use across multiple maps on the same page
