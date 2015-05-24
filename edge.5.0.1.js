/**
   @license
   Copyright (c) 2011-2014. Adobe Systems Incorporated.
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are met:

     * Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.
     * Neither the name of Adobe Systems Incorporated nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
   LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   POSSIBILITY OF SUCH DAMAGE.

//# sourceMappingURL=edge.5.0.1.min.map

   5.0.1.1998
*/
// yepnope.js
// Version - 1.5.4pre
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//

/* Hack Comment
   ignore jshint on this file.
*/
/* starthack */
/* jshint ignore:start */
/* endhack */


( function ( window, doc, undef ) {

var docElement            = doc.documentElement,
    sTimeout              = window.setTimeout,
    firstScript           = doc.getElementsByTagName( "script" )[ 0 ],
    toString              = {}.toString,
    execStack             = [],
    started               = 0,
    noop                  = function () {},
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko               = ( "MozAppearance" in docElement.style ),
    isGeckoLTE18          = isGecko && !! doc.createRange().compareNode,
    insBeforeObj          = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera               = window.opera && toString.call( window.opera ) == "[object Opera]",
    isIE                  = !! doc.attachEvent && !isOpera,
    // isOlderWebkit fix for #95 - https://github.com/SlexAxton/yepnope.js/issues/95
    isOlderWebkit		  = ( 'webkitAppearance' in docElement.style ) && !( 'async' in doc.createElement('script') ),
    strJsElem             = isGecko ? "object" : (isIE || isOlderWebkit)  ? "script" : "img",
    strCssElem            = isIE ? "script" : (isOlderWebkit) ? "img" : strJsElem,
    isArray               = Array.isArray || function ( obj ) {
      return toString.call( obj ) == "[object Array]";
    },
    isObject              = function ( obj ) {
      return Object(obj) === obj;
    },
    isString              = function ( s ) {
      return typeof s == "string";
    },
    isFunction            = function ( fn ) {
      return toString.call( fn ) == "[object Function]";
    },
    readFirstScript       = function() {
        if (!firstScript || !firstScript.parentNode) {
            firstScript = doc.getElementsByTagName( "script" )[ 0 ];
        }
    },
    globalFilters         = [],
    scriptCache           = {},
    prefixes              = {
      // key value pair timeout options
      timeout : function( resourceObj, prefix_parts ) {
        if ( prefix_parts.length ) {
          resourceObj['timeout'] = prefix_parts[ 0 ];
        }
        return resourceObj;
      }
    },
    handler,
    yepnope;

  /* Loader helper functions */
  function isFileReady ( readyState ) {
    // Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == "loaded" || readyState == "complete" || readyState == "uninitialized" );
  }


  // Takes a preloaded js obj (changes in different browsers) and injects it into the head
  // in the appropriate order
  function injectJs ( src, cb, attrs, timeout, /* internal use */ err, internal ) {

    var script = doc.createElement( "script" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    script.src = src;

    // Add our extra attributes to the script element
    for ( i in attrs ) {
        script.setAttribute( i, attrs[ i ] );
    }

    cb = internal ? executeStack : ( cb || noop );

    // Bind to load events
    script.onreadystatechange = script.onload = function () {

      if ( ! done && isFileReady( script.readyState ) ) {

        // Set done to prevent this function from being called twice.
        done = 1;
        cb();

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
      }
    };

    // 404 Fallback
    sTimeout(function () {
      if ( ! done ) {
        done = 1;
        // Might as well pass in an error-state if we fire the 404 fallback
        cb(1);
      }
    }, timeout );

    // Inject script into to document
    // or immediately callback if we know there
    // was previously a timeout error
    readFirstScript();
    err ? script.onload() : firstScript.parentNode.insertBefore( script, firstScript );
  }

  // Takes a preloaded css obj (changes in different browsers) and injects it into the head
  function injectCss ( href, cb, attrs, timeout, /* Internal use */ err, internal ) {

    // Create stylesheet link
    var link = doc.createElement( "link" ),
        done, i;

    timeout = timeout || yepnope['errorTimeout'];

    cb = internal ? executeStack : ( cb || noop );

    // Add attributes
    link.href = href;
    link.rel  = "stylesheet";
    link.type = "text/css";

    // Add our extra attributes to the link element
    for ( i in attrs ) {
      link.setAttribute( i, attrs[ i ] );
    }

    if ( ! err ) {
      readFirstScript();
      firstScript.parentNode.insertBefore( link, firstScript );
      sTimeout(cb, 0);
    }
  }

  function executeStack ( ) {
    // shift an element off of the stack
    var i   = execStack.shift();
    started = 1;

    // if a is truthy and the first item in the stack has an src
    if ( i ) {
      // if it's a script, inject it into the head with no type attribute
      if ( i['t'] ) {
        // Inject after a timeout so FF has time to be a jerk about it and
        // not double load (ignore the cache)
        sTimeout( function () {
          (i['t'] == "c" ?  yepnope['injectCss'] : yepnope['injectJs'])( i['s'], 0, i['a'], i['x'], i['e'], 1 );
        }, 0 );
      }
      // Otherwise, just call the function and potentially run the stack
      else {
        i();
        executeStack();
      }
    }
    else {
      // just reset out of recursive mode
      started = 0;
    }
  }

  function preloadFile ( elem, url, type, splicePoint, dontExec, attrObj, timeout ) {

    timeout = timeout || yepnope['errorTimeout'];

    // Create appropriate element for browser and type
    var preloadElem = doc.createElement( elem ),
        done        = 0,
        firstFlag   = 0,
        stackObject = {
          "t": type,     // type
          "s": url,      // src
        //r: 0,        // ready
          "e": dontExec,// set to true if we don't want to reinject
          "a": attrObj,
          "x": timeout
        };

    // The first time (common-case)
    if ( scriptCache[ url ] === 1 ) {
      firstFlag = 1;
      scriptCache[ url ] = [];
    }

    function onload ( first ) {
      // If the script/css file is loaded
      if ( ! done && isFileReady( preloadElem.readyState ) ) {

        // Set done to prevent this function from being called twice.
        stackObject['r'] = done = 1;

        ! started && executeStack();

        if ( first ) {
          if ( elem != "img" ) {
            sTimeout(function(){ insBeforeObj.removeChild( preloadElem ) }, 50);
          }

          for ( var i in scriptCache[ url ] ) {
            if ( scriptCache[ url ].hasOwnProperty( i ) ) {
              scriptCache[ url ][ i ].onload();
            }
          }

          // Handle memory leak in IE
           preloadElem.onload = preloadElem.onreadystatechange = null;
        }
      }
    }


    // Setting url to data for objects or src for img/scripts
    if ( elem == "object" ) {
      preloadElem.data = url;

      // Setting the type attribute to stop Firefox complaining about the mimetype when running locally.
      // The type doesn't matter as long as it's real, thus text/css instead of text/javascript.
      preloadElem.setAttribute("type", "text/css");
    } else {
      preloadElem.src = url;

      // Setting bogus script type to allow the script to be cached
      preloadElem.type = elem;
    }

    // Don't let it show up visually
    preloadElem.width = preloadElem.height = "0";

    // Attach handlers for all browsers
    preloadElem.onerror = preloadElem.onload = preloadElem.onreadystatechange = function(){
      onload.call(this, firstFlag);
    };
    // inject the element into the stack depending on if it's
    // in the middle of other scripts or not
    execStack.splice( splicePoint, 0, stackObject );

    // The only place these can't go is in the <head> element, since objects won't load in there
    // so we have two options - insert before the head element (which is hard to assume) - or
    // insertBefore technically takes null/undefined as a second param and it will insert the element into
    // the parent last. We try the head, and it automatically falls back to undefined.
    if ( elem != "img" ) {
      // If it's the first time, or we've already loaded it all the way through
      if ( firstFlag || scriptCache[ url ] === 2 ) {
        readFirstScript();
        insBeforeObj.insertBefore( preloadElem, isGeckoLTE18 ? null : firstScript );

        // If something fails, and onerror doesn't fire,
        // continue after a timeout.
        sTimeout( onload, timeout );
      }
      else {
        // instead of injecting, just hold on to it
        scriptCache[ url ].push( preloadElem );
      }
    }
  }

  function load ( resource, type, dontExec, attrObj, timeout ) {
    // If this method gets hit multiple times, we should flag
    // that the execution of other threads should halt.
    started = 0;

    // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
    type = type || "j";
    if ( isString( resource ) ) {
      // if the resource passed in here is a string, preload the file
      preloadFile( type == "c" ? strCssElem : strJsElem, resource, type, this['i']++, dontExec, attrObj, timeout );
    } else {
      // Otherwise it's a callback function and we can splice it into the stack to run
      execStack.splice( this['i']++, 0, resource );
      execStack.length == 1 && executeStack();
    }

    // OMG is this jQueries? For chaining...
    return this;
  }

  // return the yepnope object with a fresh loader attached
  function getYepnope () {
    var y = yepnope;
    y['loader'] = {
      "load": load,
      "i" : 0
    };
    return y;
  }

  /* End loader helper functions */
  // Yepnope Function
  yepnope = function ( needs ) {

    var i,
        need,
        // start the chain as a plain instance
        chain = this['yepnope']['loader'];

    function satisfyPrefixes ( url ) {
      // split all prefixes out
      var parts   = url.split( "!" ),
      gLen    = globalFilters.length,
      origUrl = parts.pop(),
      pLen    = parts.length,
      res     = {
        "url"      : origUrl,
        // keep this one static for callback variable consistency
        "origUrl"  : origUrl,
        "prefixes" : parts
      },
      mFunc,
      j,
      prefix_parts;

      // loop through prefixes
      // if there are none, this automatically gets skipped
      for ( j = 0; j < pLen; j++ ) {
        prefix_parts = parts[ j ].split( '=' );
        mFunc = prefixes[ prefix_parts.shift() ];
        if ( mFunc ) {
          res = mFunc( res, prefix_parts );
        }
      }

      // Go through our global filters
      for ( j = 0; j < gLen; j++ ) {
        res = globalFilters[ j ]( res );
      }

      // return the final url
      return res;
    }

     function getExtension ( url ) {
      //The extension is always the last characters before the ? and after a period.
      //The previous method was not accounting for the possibility of a period in the query string.
      var b = url.split('?')[0];
      return b.substr(b.lastIndexOf('.')+1);
    }

    function loadScriptOrStyle ( input, callback, chain, index, testResult ) {
      // run through our set of prefixes
      var resource     = satisfyPrefixes( input ),
          autoCallback = resource['autoCallback'],
          extension    = getExtension( resource['url'] );

      // if no object is returned or the url is empty/0 just exit the load
      if ( resource['bypass'] ) {
        return;
      }

      // Determine callback, if any
      if ( callback ) {
        callback = isFunction( callback ) ?
          callback :
          callback[ input ] ||
          callback[ index ] ||
          callback[ ( input.split( "/" ).pop().split( "?" )[ 0 ] ) ];
      }

      // if someone is overriding all normal functionality
      if ( resource['instead'] ) {
        return resource['instead']( input, callback, chain, index, testResult );
      }
      else {
        // Handle if we've already had this url and it's completed loaded already
        if ( scriptCache[ resource['url'] ] && resource['reexecute'] !== true) {
          // don't let this execute again
          resource['noexec'] = true;
        }
        else {
          scriptCache[ resource['url'] ] = 1;
        }

        // Throw this into the queue
        input && chain.load( resource['url'], ( ( resource['forceCSS'] || ( ! resource['forceJS'] && "css" == getExtension( resource['url'] ) ) ) ) ? "c" : undef, resource['noexec'], resource['attrs'], resource['timeout'] );

        // If we have a callback, we'll start the chain over
        if ( isFunction( callback ) || isFunction( autoCallback ) ) {
          // Call getJS with our current stack of things
          chain['load']( function () {
            // Hijack yepnope and restart index counter
            getYepnope();
            // Call our callbacks with this set of data
            callback && callback( resource['origUrl'], testResult, index );
            autoCallback && autoCallback( resource['origUrl'], testResult, index );

            // Override this to just a boolean positive
            scriptCache[ resource['url'] ] = 2;
          } );
        }
      }
    }

    function loadFromTestObject ( testObject, chain ) {
        var testResult = !! testObject['test'],
            group      = testResult ? testObject['yep'] : testObject['nope'],
            always     = testObject['load'] || testObject['both'],
            callback   = testObject['callback'] || noop,
            cbRef      = callback,
            complete   = testObject['complete'] || noop,
            needGroupSize,
            callbackKey;

        // Reusable function for dealing with the different input types
        // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
        // much smaller than the functional equivalent in this case.
        function handleGroup ( needGroup, moreToCome ) {
          if ( '' !== needGroup && ! needGroup ) {
            // Call the complete callback when there's nothing to load.
            ! moreToCome && complete();
          }
          // If it's a string
          else if ( isString( needGroup ) ) {
            // if it's a string, it's the last
            if ( !moreToCome ) {
              // Add in the complete callback to go at the end
              callback = function () {
                var args = [].slice.call( arguments );
                cbRef.apply( this, args );
                complete();
              };
            }
            // Just load the script of style
            loadScriptOrStyle( needGroup, callback, chain, 0, testResult );
          }
          // See if we have an object. Doesn't matter if it's an array or a key/val hash
          // Note:: order cannot be guaranteed on an key value object with multiple elements
          // since the for-in does not preserve order. Arrays _should_ go in order though.
          else if ( isObject( needGroup ) ) {
            // I hate this, but idk another way for objects.
            needGroupSize = (function(){
              var count = 0, i
              for (i in needGroup ) {
                if ( needGroup.hasOwnProperty( i ) ) {
                  count++;
                }
              }
              return count;
            })();

            for ( callbackKey in needGroup ) {
              // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
              // patch if needed. Kangax has a nice shim for it. Or just remove the check
              // and promise not to extend the object prototype.
              if ( needGroup.hasOwnProperty( callbackKey ) ) {
                // Find the last added resource, and append to it's callback.
                if ( ! moreToCome && ! ( --needGroupSize ) ) {
                  // If this is an object full of callbacks
                  if ( ! isFunction( callback ) ) {
                    // Add in the complete callback to go at the end
                    callback[ callbackKey ] = (function( innerCb ) {
                      return function () {
                        var args = [].slice.call( arguments );
                        innerCb && innerCb.apply( this, args );
                        complete();
                      };
                    })( cbRef[ callbackKey ] );
                  }
                  // If this is just a single callback
                  else {
                    callback = function () {
                      var args = [].slice.call( arguments );
                      cbRef.apply( this, args );
                      complete();
                    };
                  }
                }
                loadScriptOrStyle( needGroup[ callbackKey ], callback, chain, callbackKey, testResult );
              }
            }
          }
        }

        // figure out what this group should do
        handleGroup( group, !!always || !!testObject['complete']);

        // Run our loader on the load/both group too
        // the always stuff always loads second.
        always && handleGroup( always );

	// If complete callback is used without loading anything
        !always && !!testObject['complete'] && handleGroup('');

    }

    // Someone just decides to load a single script or css file as a string
    if ( isString( needs ) ) {
      loadScriptOrStyle( needs, 0, chain, 0 );
    }
    // Normal case is likely an array of different types of loading options
    else if ( isArray( needs ) ) {
      // go through the list of needs
      for( i = 0; i < needs.length; i++ ) {
        need = needs[ i ];

        // if it's a string, just load it
        if ( isString( need ) ) {
          loadScriptOrStyle( need, 0, chain, 0 );
        }
        // if it's an array, call our function recursively
        else if ( isArray( need ) ) {
          yepnope( need );
        }
        // if it's an object, use our modernizr logic to win
        else if ( isObject( need ) ) {
          loadFromTestObject( need, chain );
        }
      }
    }
    // Allow a single object to be passed in
    else if ( isObject( needs ) ) {
      loadFromTestObject( needs, chain );
    }
  };

  // This publicly exposed function is for allowing
  // you to add functionality based on prefixes on the
  // string files you add. 'css!' is a builtin prefix
  //
  // The arguments are the prefix (not including the !) as a string
  // and
  // A callback function. This function is passed a resource object
  // that can be manipulated and then returned. (like middleware. har.)
  //
  // Examples of this can be seen in the officially supported ie prefix
  yepnope['addPrefix'] = function ( prefix, callback ) {
    prefixes[ prefix ] = callback;
  };

  // A filter is a global function that every resource
  // object that passes through yepnope will see. You can
  // of course conditionally choose to modify the resource objects
  // or just pass them along. The filter function takes the resource
  // object and is expected to return one.
  //
  // The best example of a filter is the 'autoprotocol' officially
  // supported filter
  yepnope['addFilter'] = function ( filter ) {
    globalFilters.push( filter );
  };

  // Default error timeout to 10sec - modify to alter
  yepnope['errorTimeout'] = 1e4;

  // Webreflection readystate hack
  // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
  // if the readyState is null and we have a listener
  if ( doc.readyState == null && doc.addEventListener ) {
    // set the ready state to loading
    doc.readyState = "loading";
    // call the listener
    doc.addEventListener( "DOMContentLoaded", handler = function () {
      // Remove the listener
      doc.removeEventListener( "DOMContentLoaded", handler, 0 );
      // Set it to ready
      doc.readyState = "complete";
    }, 0 );
  }

  // Attach loader &
  // Leak it
  window['yepnope'] = getYepnope();

  // Exposing executeStack to better facilitate plugins
  window['yepnope']['executeStack'] = executeStack;
  window['yepnope']['injectJs'] = injectJs;
  window['yepnope']['injectCss'] = injectCss;

})( window, document );
// yepnope.js - end

/**
 * Adobe Edge Animate - Core
 */

/*jslint plusplus:true, nomen: true, undef: true*/
/*global window: true, document: true, Image: true, CustomEvent: true, HTMLElement: true, console:true */
if (typeof Array.prototype.forEach != 'function') {
    Array.prototype.forEach = function(callback){
      for (var i = 0; i < this.length; i++){
        callback.apply(this, [this[i], i, this]);
      }
    };
}

if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  }
}

var aBootcompsLoaded = [];
var AdobeEdge = AdobeEdge || {};

(function (an) {

    "use strict";

    var doc = document,
        win = window,
        props = {},
        comps = {},
        loadedURIs = {},
        defaultOptions = { imagesDir: "images/" },
        hasTransform,
        forEach = Array.prototype.forEach,
        fnTimer,
        docIsReady,
        payloadsToLoad = [],
        testEle,
        arr = [],
        push = arr.push,
        htLookup = {},
        // We have to close these tags to support XHTML (#13200) - Taken from jQuery
        wrapMap = {
            // Support: IE 9
            option: [ 1, "<select multiple='multiple'>", "</select>" ],
            thead: [ 1, "<table>", "</table>" ],
            col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
            tr: [ 2, "<table><tbody>", "</tbody></table>" ],
            td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

            _default: [ 1, "", "" ]
        },
        rtagName = /<([\w:]+)/,
        rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
        supported = {},
        elementDisplay = {};

    an.doPlayWhenReady = false;
    an.readyAndWaiting = [];

    // Don't automatically add "px" to these possibly-unitless properties
	var cssNumber = {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	};

    var cssNormalTransform = {
        "letterSpacing": 0,
        "fontWeight": 400
    };

    /** Utilities **/

    function isArray(o) {
        //return (o instanceof Array);
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    //taken from zepto
    function isFunction(value) { return typeof(value) == "function" };

    // Adapted from jQuery
    function isWindow(obj) {
        return obj !== null && obj === obj.window;
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    // Adapted from jQuery
    function isNumeric(obj) {
		return !isNaN(parseFloat(obj)) && isFinite(obj);
	}

    // Adapted from jQuery | MIT
    function isArraylike(obj) {
        var length = obj.length;

        if (isWindow(obj)) {
            return false;
        }

        if (obj.nodeType === 1 && length) {
            return true;
        }

        return (isArray(obj) || (typeof obj !== "function" && ( length === 0 || typeof length === "number" && length > 0 && ( length - 1 ) in obj)));
    }

    function wrapArray(a, b) {
        var i;
        for (i = 0; a && i < a.length; i++) {
            b[b.length++] = a[i];
        }
    }

    function each(o, fn) {
        var k, length;
        if (isArray(o)) {
            length = o.length;
            for (k = 0; k < length; k++) {
                fn(k, o[k]);
            }
        } else {
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    fn(k, o[k]);
                }
            }
        }
    }

    function dir(elem, dir) {
        var matched = [];

        while ((elem = elem[ dir ]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
                matched.push(elem);
            }
        }
        return matched;
    }

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }

    // Modernizr 2.5.3 | MIT & BSD
    testEle = document.createElement('div');

    function isSupported(props) {
        var s = testEle.style, p, i;
        for ( i = 0; i < props.length; i++ ) {
            p = props[i];
            if ( s[p] !== undefined ) {
                return true;
            }
        }
        return false;
    }

    function supportsRGBA() {
        testEle.style.cssText = 'background-color:rgba(150,255,150,.5)';
        var sTest = '' + testEle.style.backgroundColor;
        if(sTest.indexOf('rgba') == 0) {
            return true;
        }
        return false;
    }

    function safeColor(sVal) {
        sVal = '' + sVal;
        if(!supported.rgba && sVal.indexOf('rgba') == 0) {
            var iPos = sVal.lastIndexOf(',');
            if(iPos > 0) {
                sVal = 'rgb(' + sVal.substring(5, iPos) + ')';
            }
        }
        return sVal;
    }

    function supportedAudio() {
        var a = document.createElement('audio'),
            supported = {};

        if (a.canPlayType) {
            supported['m4a'] = !!a.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/, '');
            supported['aac'] = supported['m4a'];
            supported['mp3'] = !!a.canPlayType('audio/mpeg;').replace(/no/, '');
            supported['wav'] = !!a.canPlayType('audio/wav; codecs="1"').replace(/no/, '');
            supported['ogg'] = !!a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '');
            supported['oga'] = supported['ogg'];
        }

        return supported;
    }

    function supportedVideo() {
        var v = document.createElement('video'),
            supported = {};

        if (v.canPlayType) {
            supported['webm'] = !!v.canPlayType('video/webm').replace(/no/, '');
            supported['mp4'] = !!v.canPlayType('video/mp4;').replace(/no/, '');
    	    supported['ogv'] = !!v.canPlayType('video/ogg; codecs="theora, vorbis"').replace(/no/, '');
            supported['ogg'] = !!v.canPlayType('video/ogg; codecs="theora, vorbis"').replace(/no/, '');
        }

        return supported;
    }

    function isCustomEventSupported() {
        if(!window.CustomEvent) return false;
        try {
            return new CustomEvent("testCustomEvent", false, false) !== undefined;
        } catch (e) {
        }
        return false;
    }

    function isOpera() {
        return /Opera/.test(navigator.userAgent);
    }

    function isiOS() {
	    var ua = navigator.userAgent;
	    var isWebkit = ( 'webkitAppearance' in document.documentElement.style );
	    return (isWebkit && (/iPad/.test(ua) || /iPod/.test(ua) || /iPhone/.test(ua) ));
    }

	function requestResource(type, aURLs, comp, preload) {
        if (AdobeEdge.isIOS) return undefined;
        var j, ext;

        for (j = 0; j < aURLs.length; j++) {
            ext = aURLs[j].split('.');
            ext = ext[ext.length - 1].toLowerCase();
            if (AdobeEdge.supported[type][ext]) {
                //request the resource
                var bDoLoad = false;

                if (preload === null || preload == "")
                    bDoLoad = (type == "audio" ? comp.opts.gAudioPreloadPreference : comp.opts.gVideoPreloadPreference) == "auto";
                else {
                    bDoLoad = preload == "auto";
                }

                if(bDoLoad) {
                    preloadAsset(type, comp._getFullURL(aURLs[j]), comp);
                }
                return comp._getFullURL(aURLs[j]);
            }
        }

        return undefined;
    }

    //check o for existence of non-null properties
    function isEmpty(o) {
        var r;
        each(o, function (_, v) {
            if (v !== null) {
                r = true;
            }
        });
        return !r;
    }

    function extend(tgt, src) {
        each(src, function (k, v) {
            tgt[k] = v;
        });
        return tgt;
    }

    function splitUnits(s) {
        var o = {};
        o.num = parseFloat(s);
        o.units = String(s).match(/[a-zA-Z%]+$/);
        if (isArray(o.units)) {
            o.units = o.units[0];
        }
        return o;
    }


    hasTransform = isSupported(['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform']);

    /** Document Selection **/

        // Camelize a dashed string

        //TBD: not sure which of these regex is better...
        //jqMobi's regex is shorter: /-+(.)?/g
        //than jQuery's            : /-([a-z]|[0-9])/ig

    function camelize(str) {
        return str.replace(/^-ms-/, "ms-").replace(/-([a-z]|[0-9])/ig, function (s, l) {
            return String(l).toUpperCase();
        });
    }

    //based of jQuery
    function buildFragment(html) {
        var tmp = document.createElement("div");

        // Deserialize a standard representation
        var tag = ( rtagName.exec( html ) || ["", ""] )[ 1 ].toLowerCase();
        var wrap = wrapMap[ tag ] || wrapMap._default;
        tmp.innerHTML = wrap[ 1 ] + html.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

        // Descend through wrappers to the right content
        var j = wrap[ 0 ];
        while ( j-- ) {
            tmp = tmp.lastChild;
        }
        return tmp;
    }

    function An$(sel) {
        var dom;
        AdobeEdge.Notifier.call(this);

        this.length = 0;
        if (!sel) {
            return this;
        }
        if (sel instanceof An$) {
            return sel;
        }
        if (typeof sel === 'string') {
            sel = sel.trim();

            //testing for ID selector
            // the reg-ex zepto uses (/^#([\w-]+)$/) doesn't pass JSLint - it complains about an unescaped dash
            if (/^#([\w\-]+)$/.test(sel)) {
                dom = doc.getElementById(sel.substring(1));
                if (dom) {
                    this[this.length++] = dom;
                }
            } else if(/<|&#?\w+;/.test(sel)) {
                //HTML fragment
                this[this.length++] = buildFragment(sel);
            } else {
                wrapArray(doc.querySelectorAll(sel), this);
            }
        } else if(isArraylike(sel)) {
            return wrapArray(sel, this);
        } else if (sel.nodeType) {
            this[this.length++] = sel;
        } else {
            push.call(this, sel);
        }

        return this;
    }

    function $(sel) {
        return new An$(sel);
    }

    $.each = each;
    $.extend = extend;
    $.data = function (ele, prop, val) {
        var propName = "an_" + prop;
        if (arguments.length > 2) {
            ele[propName] = val;
        }
        return ele[propName];
    };

    //Utility functions
    function isStageWrapped($stg) {
        return $stg.parent().hasClass('center-wrapper'); // we always double wrap so just check for inner wrap
    }

    function wrapForStageScaling($stage) {
        // Wrap in 2 divs. Inner is for centering. Outer is to push sibs in flow down below.
        // They both get their size adjusted when we scale the stage.
        // This has to be called before dom is built, because reparenting causes
        // audio autoplay to be disabled (at least on some browsers)
        if(!isStageWrapped($stage)) {
            $stage.wrap("<div class='flow-wrapper' style='width:1px'><div class='center-wrapper'></div></div>");
        }
    }


    function bindStageScaling($stage, scaleToFit, minWidth, maxWidth, bMainStage, bScaleToParent) {
  		function scaleStage() {
			var isWrapped = isStageWrapped($stage),
				parent = isWrapped ? $stage.parent().parent().parent() : $stage.parent(),
				parentWidth = parent.width(),
				parentHeight = parent.height(),
				stageWidth = $stage.width(),
				stageHeight = $stage.height(),
				browserHeight = $(window).height(),
				desiredWidth,
				desiredHeight,
				rescaleW,
				rescaleH,
				rescale = 1,
				orgX = '0',
				orgY = '0',
				val,
				origin,
				flowParent,
				isParentBody = parent[0].nodeName.toLowerCase() === 'body';
        if (isParentBody) {
          parentHeight = browserHeight;
        }

        if(!bScaleToParent)
        {
          parentHeight = $(window).height();
          parentWidth  = $(window).width();
        }

			desiredWidth = Math.round(parentWidth);
			desiredHeight = Math.round(parentHeight);
			rescaleW = desiredWidth / stageWidth;
			rescaleH = desiredHeight / stageHeight;

			if (scaleToFit === 'both') {
				rescale = Math.min(rescaleW, rescaleH);
			} else if (scaleToFit === 'height') {
				rescale = rescaleH;
			} else if (scaleToFit === 'width') {
				rescale = rescaleW;
			}
			if (maxWidth !== undefined) {
				rescale = Math.min(rescale, maxWidth / stageWidth);
			}
			if (minWidth !== undefined) {
				rescale = Math.max(rescale, minWidth / stageWidth);
			}
			origin = orgX + ' ' + orgY;
			$stage.css('-o-transform-origin', origin);
			$stage.css('-ms-transform-origin', origin);
			$stage.css('-webkit-transform-origin', origin);
			$stage.css('-moz-transform-origin', origin);
			$stage.css('-o-transform-origin', origin);
			$stage.css('transform-origin', origin);

			val = 'scale(' + rescale + ')';
			$stage.css('-o-transform', val);
			$stage.css('-ms-transform', val);
			$stage.css('-webkit-transform', val);
			$stage.css('-moz-transform', val);
			$stage.css('-o-transform', val);
			$stage.css('transform', val);
			if (!isParentBody || isWrapped) {
				// Handle the centering wrapper so it's the same size - without this wrapper, centering would try to work on
				// the non-transformed size, so it would break when the parent gets smaller than the stage
				$stage.parent().height(Math.round(stageHeight * rescale)).width(Math.round(stageWidth * rescale));
			}
			if (isWrapped) {
				// Flowparent
				flowParent = $stage.parent().parent();
				flowParent.height(Math.round(stageHeight * rescale + $stage.offset().top - flowParent.offset().top));
			}
		}

		if (bMainStage) {
			if (!($.data($stage[0], "alreadyWrapped"))) {
				$.data($stage[0], "alreadyWrapped", true);
				$(window).bind('resize', function () {
					scaleStage();
				});
				documentReady(function () {
					scaleStage();
				});
			}
		}
		else {
			if (!isStageWrapped($stage)) {
				wrapForStageScaling($stage);
				$(window).bind('resize', function () {
					scaleStage();
				});
				scaleStage();
			}
		}
	}

    function centerTheStage(stage, ctrStage) {
        var $stage = $(stage);
        if (isStageWrapped($stage)) {
            $stage = $stage.parent();
        }
        if (ctrStage === 'both' || ctrStage === 'horizontal') {
            $stage.css('position', 'absolute');
            $stage.css('margin-left', 'auto');
            $stage.css('margin-right', 'auto');
            $stage.css('left', '0');
            $stage.css('right', '0');
        }
        if (ctrStage === 'both' || ctrStage === 'vertical') {
            // Note we assume the stage height is already specified to make this work
            $stage.css('position', 'absolute');
            $stage.css('margin-top', 'auto');
            $stage.css('margin-bottom', 'auto');
            $stage.css('top', '0');
            $stage.css('bottom', '0');
        }
    }
    //
    // Notifier
    //

    function Notifier() {
        var notifier = this.notifier = {};
        notifier.obs = []; // observers
        notifier.lvl = 0;   // notification level
    }

    // Used a lot in this file - extract from Notifier object so we can call directly
    function notifyObservers(notifierObject, methodName, data) {
        if (!methodName) {
            return;
        }

        if (!data) {
            data = {};
        }

        data.methodName = methodName;
        var notifier = notifierObject.notifier,
            observers = notifier.obs,
            i,
            o,
            obs,
            len;
        notifier.lvl++; // Defer removals

        // We need to retest length in case of addObserver during notification
        for (i = 0; i < observers.length; i++) {
            o = observers[i];
            obs = o && !o.deleted ? o.o : undefined;
            if (obs) {
                if (typeof obs === "function") {
                    obs(methodName, notifierObject, data);
                } else if (obs[methodName]) {
                    obs[methodName](notifierObject, data);
                }
            }
        }

        notifier.lvl--;
        if (notifier.lvl === 0) {
            len = observers.length;
            // Do deferred removeObserver
            for (i = len - 1; i >= 0; i--) {
                if (observers[i].deleted) {
                    observers.splice(i, 1);
                }
            }
        }
    }

    extend(Notifier.prototype, {
        addObserver: function (observer) {
            if (!observer) {
                return;
            }

            var notifier = this.notifier,
                observers = notifier.obs,
                len,
                i;

            // Make sure the observer isn't already on the list.
            len = observers.length;
            for (i = 0; i < len; i++) {
                if (observers[i].o === observer) {
                    return;
                }
            }
            observers[len] = {o: observer};
        },

        removeObserver: function (observer) {
            if (!observer) {
                return;
            }
            var notifier = this.notifier,
                observers = notifier.obs,
                i;

            for (i = 0; i < observers.length; i++) {
                if (observers[i].o === observer) {
                    if (notifier.lvl === 0) {
                        observers.splice(i, 1);
                        break;
                    } else {
                        // defer removal
                        observers[i].deleted = true;
                    }
                }
            }
        },

        notifyObservers: function (methodName, data) {
            return notifyObservers(this, methodName, data);
        },
        removeObservers: function () {
            var observers = this.notifier ? this.notifier.obs : null;
            if (observers) {
                observers.splice(0, observers.length);
            }
        }

    });


    function setAttr(e, k, v) {
        return v ? e.setAttribute(k, v) : e.removeAttribute(k);
    }

	function setClass($e, value, bRemove) {
		var classes, elem, cur, clazz, j,
			defStr = (bRemove ? "" : " "),
			proceed = (bRemove ? ((typeof value === "undefined") || typeof value === "string" && value) : (typeof value === "string" && value)),
			core_rnotwhite = /\S+/g,
			rclass = /[\t\r\n\f]/g;

		if ( proceed ) {
			classes = ( value || "" ).match( core_rnotwhite ) || [];
			$e.each(function (_, elem) {
				cur = elem.nodeType === 1 && ( elem.className ? ( " " + elem.className + " " ).replace( rclass, " " ) : defStr );

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if (bRemove) {
							while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
								cur = cur.replace( " " + clazz + " ", " " );
							}
						}
						else {
							if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
								cur += clazz + " ";
							}
						}
					}
					if (bRemove) {
						elem.className = value ? cur.trim() : "";
					}
					else {
						elem.className = cur.trim();
					}
				}
			});
		}
	}

    //taken from zepto
    function qsa(element, selector) {
        var simpleSelectorRE = /^[\w-]*$/;
        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
            nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
            isSimple = simpleSelectorRE.test(nameOnly);

        return (isDocument(element) && isSimple && maybeID) ?
          ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
          (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
          Array.prototype.slice.call(
            isSimple && !maybeID ?
              maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
              element.getElementsByTagName(selector) : // Or a tag
              element.querySelectorAll(selector) // Or it's not simple, and we need to query all
          );
    }

    function matches(element, selector) {
        selector = selector.replace(/=#\]/g, '="#"]')
        var filter, arg, match = filterRe.exec(selector);
        if (match && match[2] in filters) {
          filter = filters[match[2]], arg = match[3];
          selector = match[1];
          if (arg) {
            var num = Number(arg)
            if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
            else arg = num;
          }
        }

        if(!selector) {
            return (!filter || filter.call(element, null, arg) === element);
        }

        if (!selector || !element || element.nodeType !== 1) return false;
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                              element.oMatchesSelector || element.matchesSelector;
        if (matchesSelector) return matchesSelector.call(element, selector);
        // fall back to performing a selector:
        var match, parent = element.parentNode, temp = !parent;
        if (temp) (parent = tempParent).appendChild(element);
        match = ~qsa(parent, selector).indexOf(element);
        temp && tempParent.removeChild(element);
        return match;
    }

    function visible(elem){
        elem = $(elem)
        return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
    }

    An$.expr = { }

    var filters = An$.expr[':'] = {
        visible:  function(){ if (visible(this)) return this },
        hidden:   function(){ if (!visible(this)) return this },
        selected: function(){ if (this.selected) return this },
        checked:  function(){ if (this.checked) return this },
        parent:   function(){ return this.parentNode },
        first:    function(idx){ if (idx === 0) return this },
        last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
        eq:       function(idx, _, value){ if (idx === value) return this },
        has:      function(idx, _, sel){ if (qsa(this, sel).length) return this }
    }

    var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*');
    var propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    };

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    extend(An$.prototype, {
        css: function (k, v) {
            if (this.length < 1) {
                return undefined;
            }

            if (typeof k == 'string') {
                var i,
                    kk = camelize(k);
                if (arguments.length > 1) {
                    // If a number was passed in, add 'px' to the (except for certain CSS properties)
                    if (isNumeric(v) && !cssNumber[kk]) {
                        v += "px";
                    }

                    for (i = 0; i < this.length; i++) {
                        this[i].style[kk] = v;
                    }
                    return this;
                }
                var val = win.getComputedStyle ? (win.getComputedStyle(this[0])[kk] || this[0].style[kk]) : this[0].style[kk];
                //convert "normal" to computed value
                if (val === "normal" && kk in cssNormalTransform) {
                    val = cssNormalTransform[ kk ];
                }
                return val;
            } else if (isArray(k)) {
                var props = {}, element = this[0]
                $.each(isArray(k) ? k: [k], function(_, prop){
                    var _prop = camelize(prop);
                    props[prop] = (element.style[_prop] || win.computedStyle.getPropertyValue(element)[_prop]);
                })
                return props;
            }

            for(var item in k) {
                this.css(item, k[item]);
            }

            return this;
        },
        prop: function(name, value){
            name = propMap[name] || name
                return (1 in arguments) ?
                    this.each(function(_, idx){
                        this[name] = funcArg(this, value, idx, this[name])
                }) :
            (this[0] && this[0][name]);
        },
        //add one class at a time
        addClass: function (value) {
            setClass(this, value);
            return this;
        },
        //remove one class at a time
        removeClass: function (value) {
            setClass(this, value, true);
            return this;
        },
        hasClass: function( selector ) {
            var className = " " + selector + " ",
                i = 0,
                l = this.length,
                rclass = /[\t\r\n\f]/g;
            for ( ; i < l; i++ ) {
                if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
                    return true;
                }
            }

            return false;
        },
        attr: function (k, v) {
            if (typeof k !== 'string' || !this.length) {
                return null;
            }
            if (v === undefined) {
                return this[0].getAttribute(k);
            }
            this.each(function (_, e) {
                setAttr(this, k, v);
            });

            return this;
        },
        each: function (fn) {

            // Note that forEach does not set 'this' in strict mode
            var f = function (val, index) {
                fn.call(val, index, val);
            };
            forEach.call(this, f);
            return this;
        },
        get: function(index) {
            if(this.length && index < this.length) return this[index];
            return undefined;
        },
        _s: function (s, propTarget) {
            if (!this.length) {
                return undefined;
            }
            if (s === undefined) {
                return this[0][propTarget];
            }
            this.each(function (_, e) {
                this[propTarget] = s;
            });
            return this;
        },
        parent: function() {
            var parent = this[0].parentNode;
            return parent && parent.nodeType !== 11 ? $(parent) : null;
        },
        parents: function() {
            return dir(this[0], "parentNode");
        },
        text: function (s) {
            return this._s(s, "textContent");
        },
        html: function (s) {
            return this._s(s, "innerHTML");
        },
        show: function(){
            return this.each(function() {
                this.style.display == "none" && (this.style.display = '')
                if (getComputedStyle(this, '').getPropertyValue("display") == "none") this.style.display = defaultDisplay(this.nodeName)
            })
        },
        hide: function(){
            return this.css("display", "none")
        },
        wrap: function(structure){
            var func = isFunction(structure)
            if (this[0] && !func)
                var dom   = $(structure).get(0),
                    clone = dom.parentNode || this.length > 1;

            return this.each(function(index) {
                $(this).wrapAll(
                    func ? structure.call(this, index) :
                    clone ? dom.cloneNode(true) : dom
                );
            })
        },
        wrapAll: function(structure){
            if (this[0]) {
                this[0].parentElement.insertBefore(structure, this[0]);
                while (structure.firstElementChild) structure = structure.firstElementChild;
                $(structure).append(this);
            }
            return this;
        },
        dimension: function (dim) {
            var offset, ele = this[0],
                d = dim[0] ? dim[0].toUpperCase() + dim.substr(1) : "",
                rect;

            if (ele === ele.window) {
                return ele.document.documentElement['client' + d];
            }
            if (ele.nodeType === 9) { // The element is the document element
                return Math.max(
					ele.body[ "scroll" + d ], doc[ "scroll" + d ],
					ele.body[ "offset" + d ], doc[ "offset" + d ],
					doc[ "client" + d ]
                );
            }
            var val = this.css(dim) || "";
            if(val != "auto") {
                val = splitUnits(val);
                if(!val.units || val.units == "px")
                    return val.num;
            }
            rect = ele.getBoundingClientRect();
            if (dim === "width") {
                return Math.round(rect.width);
            }
            if (dim === "height") {
                return Math.round(rect.height);
            }
        },
        width: function(val) {
            return (val != undefined) ? this.css("width", val) : this.dimension("width");
        },
        height: function (val) {
            return (val != undefined) ? this.css("height", val) : this.dimension("height");
        },
        offset: function() {
            if (!this.length) return null;
            var obj = this[0].getBoundingClientRect();
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        is: function(selector){
            return this.length > 0 && matches(this[0], selector);
        }
    });


    /** Property Setting **/

    /*
     function _setIfNotNull($ele, prop, val, negOk) {

     if (val || (negOk && val === 0)) {
     var valNum = getNumber(val);
     if (negOk || valNum > 0 || val === "auto") {
     $ele.css(prop, formatUnits(val));
     }
     }
     }
     */


    /** Preload the asset **/
    function preloadAsset(type, url, comp) {
        if(!AdobeEdge.supported.addEventListener) return url;

        function assetLoadHandler(e) {
            comp._l[url] = null;
            if (isEmpty(comp._l)) {
                notifyObservers(comp, "assetsLoaded", {inst: e.target});
            }
        }

        if (comp && typeof url === 'string') {
            if (!comp._l[url]) {

                switch(type) {
                    case "image":
                        var img = new Image();
                        //treat onerror the same as onload
                        img.addEventListener("error", assetLoadHandler);
                        img.addEventListener("load", assetLoadHandler);
                        img.src = url;
                        comp._l[url] = img;
                    break;

                    case "audio":
                        var aud = new Audio();
                        aud.addEventListener("error", assetLoadHandler);
                        aud.addEventListener("canplaythrough", assetLoadHandler);
                        aud.src = url;
                        comp._l[url] = aud;
                    break;

                    case "video":
                        var vid = document.createElement('video');
                        vid.addEventListener("error", assetLoadHandler);
                        vid.addEventListener("canplaythrough", assetLoadHandler);
                        vid.src = url;
                        comp._l[url] = vid;
                    break;
                }

            }
        }
    }

    /** Prop class - driven by configuration for additive property support **/

    function Prop(n, conf) {
        var self = extend({
            name: n,
            conf: conf,
            apply: function ($ele, val) {
                if (this.conf.a === 1) {
                    $ele.attr(this.name, val);
                } else {
                    if (this.conf.cb === 1) {
                        $ele.css("-webkit-" + this.name, val);
                        $ele.css("-ms-" + this.name, val);
                        $ele.css("-moz-" + this.name, val);
                        $ele.css("-o-" + this.name, val);
                    }
                    $ele.css(this.name, val);
                }
            },

            //formerly formatUnits from transform tween
            units: function (v) {
                var oV;
                if (v !== "auto" && this.conf.u) {
                    if (typeof v === "string") {
                        oV = splitUnits(v);
                    }
                    if (!oV || !oV.units) {
                        v = v + this.conf.u;
                    }
                }
                return v;
            },
            prep: function ($ele, oN, nm, i, j, ii, comp) {
                var val;
                if (i !== undefined && oN[nm]) {
                    if (oN[nm][i] === undefined && ii) {
                        i = ii;
                    }
                    if (j !== undefined && oN[nm][i]) {
                        val = oN[nm][i][j];
                    } else {
                        val = oN[nm][i];
                        if(val === undefined) val = this.conf.d;
                    }
                } else {
                    val = oN[nm];
                }

                //
                if (val !== undefined) {
                    val = this.units(val);

                    //this is a preloaded asset
                    if (this.conf.p === 1) {
                        preloadAsset(oN.type, comp._getFullURL(val), comp);
                    }

                    if (this.conf.t) {
                        val = this.conf.t.replace("@@0", val);
                    }
                }
                return val;
            },

            //comp is optional - it is only used if rendering requires loading an asset
            render: function ($ele, oN, comp) {
                var nm = this.conf.f || this.name,
                    val;
                if (oN[nm] !== undefined && (this.conf.o === undefined || this.conf.o === oN.tag) && (this.conf.e === undefined || this.conf.e !== oN.tag)) {
                    val = this.prep($ele, oN, nm, this.conf.i, this.conf.j, this.conf.ii, comp);
                    if (val !== null && val !== undefined) {
                        this.apply($ele, val, oN, comp);
                    }
                }
            }
        }, Prop.prototype);

        Prop.splitUnits = splitUnits;

        if (conf.x) {
            self = extend(self, conf.x);
        }
        return self;
    }

    function defineProps(oP) {
        each(oP, function (n, o) {
            props[n] = new Prop(n, o);
        });
    }

    /**
     Property definition fields:

     JSON DOM related fields:
     - f: the field name in oN.  if not provided, property name is used
     - i: if the field is stored in an array, the offset of the value in that array
     - ii: the index for i to use if val[i] === undefined
     - j: if the field is stored in a nested array, the offset of the value in the nested array
     - a: if === 1 then then set an attribute with this.name
     - o: only apply if the oN.tag == o
     - e: apply the tag except in the case that oN.tag == e
     - p: sets a preloaded asset if === 1

     Generic fields:
     - u: the default units of the property
     - t: a template used to set the property value
     **/

    defineProps({
        "opacity": {
        },
        "left": {
            f: "rect",
            i: 0,
            u: "px"
        },
        "top": {
            f: "rect",
            i: 1,
            u: "px"
        },
        "width": {
            f: "rect",
            i: 2,
            u: "px"
        },
        "height": {
            f: "rect",
            i: 3,
            u: "px"
        },
        "right": {
            f: "rect",
            i: 4,
            u: "px"
        },
        "bottom": {
            f: "rect",
            i: 5,
            u: "px"
        },
        "src": {
            o: "img",
            f: "fill",
            i: 1,
            a: 1,
            p: 1,
            x: {
                apply: function ($ele, val, oN, comp) {
					val = comp ? comp._getFullURL(val) : val;
                    $ele.attr('src', val);
                }
            }
        },
        "poster": {
            f: "poster",
            o: "video",
            a: 1
        },
        "preload": {
            f: "preload",
            a: 1
        },
        "medsrc": {
            e: "img",
            f: "source",
            a: 1,
            x: {
                apply: function ($ele, val, oN, comp) {
                    var supportedURL = requestResource(oN.type, val, comp, oN.preload);
                    if(!$.isArray(val) || val.length == 1) {
                        if(supportedURL) {
                            $ele.attr('src', supportedURL);
                        } else {
                            $ele.attr('src', $.isArray(val) ? comp._getFullURL(val[0]) : comp._getFullURL(val));
                        }
                    } else {
                        for (var iS = 0; iS < val.length; iS++) {
                            var eleSrc = document.createElement("source");
                            $(eleSrc).attr("src", comp._getFullURL(val[iS]));
                            $ele.get(0).appendChild(eleSrc);
                        }
                    }

                    if (oN.tag == "audio") {
                        $ele.attr("controls", oN.display == "block");
                    }
                }
            }
        },
        "background-image": {
            e: "img",
            f: "fill",
            i: 1,
            t: "url(@@0)",
            p: 1,
            x: {
                prep: function ($ele, oN, nm, i, j, ii, comp) {
                    var val;
                    if (oN[nm]) {
                        val = oN[nm][i];
                    }

                    if (val !== undefined) {
                        val = comp._getFullURL(val);
                        //this is a preloaded asset
                        preloadAsset(oN.type, val, comp);
                        val = this.conf.t.replace("@@0", val);
                    }
                    return val;
                }
            }
        },
        "background-color": {
            f: "fill",
            i: 0,
            x: {
                apply : function($ele, val) {
                    $ele.css("background-color", safeColor(val));
                }
            }
        },
        "text": {
            x: {
                apply: function ($ele, val) {
                    $ele.html(val);
                }
            }
        },
        "min-width": {
            f: "sizeRange",
            i: 0
        },
        "max-width": {
            f: "sizeRange",
            i: 1
        },
        "min-height": {
            f: "sizeRange",
            i: 2
        },
        "max-height": {
            f: "sizeRange",
            i: 3
        },
        "overflow": {
            x: {
                apply: function ($ele, val) {
                    $ele.css("overflow", val);
                    if (val === "hidden" || val === "scroll") {
                        $ele.css("text-overflow", "clip");
                    }
                }
            }
        },
        "background-repeat": {
            e: "img",
            f: "fill",
            x: {
                apply: function ($ele, val) {
                    if(!val || val.length == 1) return;
                    if ($.isArray(val[1])) return;
                    $ele.css("background-repeat", val[6] || "no-repeat" );
                }
            }
        },
        "background-attachment": {
            f: "fill",
            i: 7,
            x: {
                apply: function ($ele, val) {
                    if (val !== "scroll") {
                        $ele.css("background-attachment", val);
                    }
                }
            }
        },
        "background-size": {
            f: "fill",
            i: 4,
            d: "100% 100%"
        },
        "autoOrient": {
            x: {
                apply: function ($ele, val) {
                    AdobeEdge.$.data($ele[0], "doAutoOrient", val);
                }
            }
        },
        "clip": {
            //happens to work
        },
        "display": {
            //TBD
        },
        "border-top-left-radius": {
            f: "borderRadius",
            i: 0
        },
        "border-top-right-radius": {
            f: "borderRadius",
            i: 1,
            ii: 0
        },
        "border-bottom-right-radius": {
            f: "borderRadius",
            i: 2,
            ii: 0
        },
        "border-bottom-left-radius": {
            f: "borderRadius",
            i: 3,
            ii: 0
        },
        "border-width": {
            f: "stroke", //stroke
            i: 0,
            d: 0,
            u: "px"
        },
        "border-color": {
            f: "stroke",
            i: 1,
            d: "rgba(0,0,0,0)"
        },
        "border-style": {
            f: "stroke",
            i: 2,
            d: "none"
        },
        "cursor": {
            f: "cursor"
        },
        "transform-origin": {
            cb: 1,
            f: "transform",
            i: 4,
            x: {
                prep: function ($ele, oN, nm, i, j, ii) {
                    if (oN.transform && oN.transform[4] != undefined) {
                        if(oN.transform[4].length == 1) {
                            return oN.transform[4][0] + " " + "50%";
                        }
                        return oN.transform[4][0] + " " + oN.transform[4][1];
                    }
                }
            }
        },
        "font-family": {
            f: "font",
            i: 0
        },
        "font-size": {
            f: "font",
            i: 1,
            u: "px",
            x: {
                prep: function ($ele, oN, nm, i, j, ii, comp) {
                    if(oN.type != 'text') return;
                    var i = this.conf.i, j = 0, f = this.conf.f, val = oN[f][i][j], unit = oN[f][i][j + 1];
                    if (!unit || unit == "") unit = this.conf.u;
                    return val + unit;
                }
            }
        },
        "font-weight": {
            f: "font",
            i: 3
        },
        "letter-spacing": {
            f: "textStyle",
            i: 0
        },
        "word-spacing": {
            f: "textStyle",
            i: 1
        },
        "line-height": {
            f: "textStyle",
            i: 2
        },
        "text-indent": {
            f: "textStyle",
            i: 3
        },
        //?? color tween should maybe define this?
        "color": {
            f: "font",
            i: 2,
            x: {
                apply : function($ele, val) {
                    $ele.css("color", safeColor(val));
                }
            }
        },
        "text-decoration": {
            f: "font",
            i: 4
        },
        "font-style": {
            f: "font",
            i: 5
        },
        "word-wrap": {
            f: "font",
            i: 6
        },
        "text-align": {
            f: "align"
        },
        "white-space": {
            f: "rect",
            x: {
                prep: function($ele, val) {
                    if(val.font) { if(val.font.length > 7) return val.font[7]; else return val.rect; }
                },
                apply: function ($ele, val) {
                    if($.isArray(val)) {
                        if ((!val[2] || val[2] <= 0 || val[2] == "auto") && (!val[3] || val[3] <= 0 || val[3] == "auto")) {
                            $ele.css("white-space", "nowrap");
                            $ele.css("wordWrap", "break-word");
                        }
                    } else {
                        $ele.css("white-space", val);
						if(val == "nowrap") $ele.css("wordWrap", "break-word");
                    }
                }
            }
        },
		//PROPERTIES
		 "volume": {
            f: "volume",
            x: {
                apply: function ($ele, val) {
                    $ele.get(0).volume = val;
                }
            }
        },
        //ATTRIBUTES
        "className": {
            f: "uc",
            x: {
                apply: function ($ele, val) {
                    $ele.addClass(val);
                }
            }
        },
        "controls": {
            a: 1
        },
        "alt": {
            a: 1
        },
        "title": {
            //f: "tt",
            a: 1
        },
        "tabindex": {
            //f: "ti",
            a: 1
        },
        "autoplay": {
            a: 1
        },
        "loop": {
            a: 1
        },
        "linkURL": {
            f: "linkURL",
            a: 1,
            x: {
                prep: function($ele, oN) {
                    htLookup[$ele[0].id] = oN;
                    $ele[0].onclick=function() {
                        var oNE = htLookup[this.id];
                        if(oNE.linkTarget) {
                            window.open(oNE.linkURL, oNE.linkTarget);
                        }
                        else {
                            window.location.href=oNE.linkURL;
                        }
                    };
                    $ele[0].style.cursor = "pointer";
                }
            }
        }
    });

    var shortLongNameMap = {
      "c":"children",
      "r":"rect",
      "zr":"sizeRange",
      "br": "borderRadius",
      "cl":"clip",
      "al":"alt",
      "tt":"title",
      "ti":"tabindex",
      "cn":"controls",
      "sr":"source",
      "ps":"poster",
      "pr":"preload",
      "cu":"cursor",
      "ap":"autoplay",
      "lp":"loop",
      "n":"font",
      "tf":"transform",
      "sh":"boxShadow",
      "ts":"textStyle",
      "o":"opacity",
      "uc":"userClass",
      "s":"stroke",
      "f":"fill",
      "v":"display",
      "fi":"filter",
      "sN":"symbolName",
      "tr":"trigger"
    };

    function renderEle(comp, sym, oN, style, parent, cls, zInd, disableDOMEvents) {

        var tag = oN.tag || "div",
            $ele = $(document.createElement(tag)),
            ele = $ele[0],
            comp;

        //stash the dom definition on the element
        AdobeEdge.$.data(ele, "domDef", oN);
        $ele.attr("id", oN.id);

        $ele.css("position", "absolute");
        //Force zero margin
        $ele.css("margin", "0px");

        //Apply the base styles
        if(sym && oN.symbolName) {
            sym._applyBaseStyles($ele, oN.symbolName);
        }

        each(props, function (_, prop) {
            prop.render($ele, oN, comp);
        });

        // Prevent highlighting in Webkit mobile - Taken from R1
        $ele.css("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)");

        if (sym) {
            var parentId = sym.ele ? sym.ele.id : "";
            sym.register(ele, oN, parentId);
        }

        //Add the class name similar to R1
        $ele.addClass($ele.attr("id") + "_id");

        if(!disableDOMEvents) notifyObservers(AdobeEdge, 'beginEle', { sym: sym, ele: ele, defn: {dom: oN, style: style}});

        if (cls) {
            $ele.addClass(cls);
        }

        var statEle = document.getElementById(ele.id);
        if(statEle) {
            var $parent = $(statEle).parent();
            if($parent && $parent[0] == parent) {
                parent.removeChild(statEle);
            }
        }

        if (parent.children && zInd >= 0 && zInd < parent.children.length) {
            parent.insertBefore(ele, parent.children[zInd]);
        } else {
            parent.appendChild(ele);
        }

        AdobeEdge.$.data(ele, "originalId", oN.id);
        AdobeEdge.$.data(ele, "symParent", sym);

        if(sym) {
            var wkt = ele.style.webkitTransform;
            if (sym.gpuAccelerate && ele.style && (typeof(wkt) === "undefined" || wkt === "" || wkt === "none")) {
                if (!window.edge_authoring_mode || ele.nodeName !== "BODY") {
                    ele.style.webkitTransform = "translateZ(0)";
                }
            } else if (!ele.style.zIndex && window.edge_authoring_mode) {
                ele.style.zIndex = 0;
            }
        }

        if (sym) {
            if(!disableDOMEvents) notifyObservers(sym, 'newEle', { ele: ele, defn: oN });
        }

        return $ele;
    }

  function normalizeDomNode(oN) {
        if (oN.t) {
            oN.t = oN.t.toLowerCase();
            oN.type = oN.t;
        }

        if (oN.cs) {
            oN.className = oN.cs;
        }

        for (var shorty in shortLongNameMap) {
            if (oN[shorty] != null) {
                oN[ shortLongNameMap[shorty]]= oN[shorty];
                oN[shorty] = null;
            }
        }

        if (!oN.rect) { oN.rect = []; }
        while (oN.rect.length < 4) {
            oN.rect[oN.rect.length] = 0;
        }

        if (oN.transform) {
            //[x,y,z],[rx,ry,rz],[skewX,skewY],[scaleX,scaleY,scaleZ]
            if (oN.transform.length < 1) {
                oN.transform[0] = [0,0,0];
            }
            if (oN.transform.length < 2) {
                oN.transform[1] = [0,0,0];
            }
            if (oN.transform.length < 3) {
                oN.transform[2] = [0,0,0];
            }
            if (oN.transform.length < 4) {
                oN.transform[3] = [1,1,1];
            }
        }

        if(oN.children) {
            oN.c = oN.children; //Authoring needs .c also
            each(oN.children, function (_, oN) {
                normalizeDomNode(oN);
            });
        }
    };

    function renderDOM(comp, sym, dom, style, stg, cls, zInd) {
        if (!stg && !sym && !sym.id) return;

        stg = stg || $("." + sym.id)[0];

        each(dom, function (_, oN) {

            var ele = renderEle(comp, sym, oN, style, stg, cls, zInd++),
                data = { sym: sym, ele: ele[0], defn: oN };

            if (oN.c) {
                renderDOM(comp, sym, oN.c, undefined, ele[0], cls, 0);
            }
            notifyObservers(AdobeEdge, 'endEle', data);
        });
    }

    /* Stub for Symbol */
    function Symbol(oS, nm, comp, parent, variables) {
        Notifier.call(this);
        comp._s.push(this);

        extend(this, {
            name: nm,
            composition: comp,
            data: oS,
            prnt: parent,
            tl: [],
            variables: variables || {}
        });

        notifyObservers(comp, 'newSymbol', {symbol: this, parent: parent});
        return this;
    }

    extend(Symbol.prototype, Notifier.prototype);
    extend(Symbol.prototype, {
        init: function (stg, cls) {
            var s = this.data[this.name];
            if (s) {
                renderDOM(this.composition, this, s.content.dom, s.content.style, stg, cls);
            }
        },
        register: function (ele, obj) { // noop overridden in Symbol
        },
        play: function (ms) { // noop overridden in Symbol
        }
    });

    /** Composition **/

    function getComposition(compId) {
        return comps[compId];
    }

    function playAuto(sym, playNested) {

        if(playNested && sym.ci) {
            for(var i=0; i<sym.ci.length; ++i) {
                var inst = sym.ci[i];
                if(inst) playAuto(inst, playNested);
            }
        }

        var state = sym._getTimeline() ? sym._getTimeline().getState() : {'playing': undefined};

        if (sym.autoPlay == undefined || sym.autoPlay) {
            if(state.playing == undefined) {
                sym.play(0);
            }
        } else {
            if(state.playing == undefined) {
                sym.stop(-1, false);    //Make sure that base state is applied
            }
        }

    }

   function registerSymbols(comp, symbolData) {

      var symbolName, tlName, i, tw;
      for (symbolName in symbolData) {
          if (symbolData.hasOwnProperty(symbolName)) {
              var oD = symbolData[symbolName];
              oD.typeName = symbolName;
              /*jshint eqeqeq:false */
              /*jshint eqnull:true */

              //patch short names...
              if (oD.v) {
                  oD.version = oD.v;
              }
              if (oD.mv) {
                  oD.minimumCompatibleVersion = oD.mv;
              }
              if (oD.b) {
                  oD.build = oD.b;
              }
              if (oD.bS) {
                  oD.baseState = oD.bS;
              }
              if (oD.iS) {
                  oD.initialState = oD.iS;
              }
              if (oD.gpu != null) {
                  oD.gpuAccelerate = oD.gpu;
              }
              if (oD.rI != null) {
                  oD.resizeInstances = oD.rI;
              }
              if (oD.cn) {
                  oD.content = oD.cn;
              }
              if (oD.content) {
                  var oDC = oD.content;
                  if (oDC.sI != null) {
                      oDC.symbolInstances = oD.content.sI;
                  }
                  if (oDC.symbolInstances) {
                      for (var iS = 0; iS < oDC.symbolInstances.length; iS++) {
                          var oSI = oDC.symbolInstances[iS];
                          if (oSI.sN != null) {
                              oSI.symbolName = oSI.sN;
                          }
                          if (oSI.a != null) {
                              oSI.autoPlay = oSI.a;
                          }
                          if (oSI.x != null) {
                              oSI.variables = oSI.x;
                          }
                      }
                  }
              }

              each(oD.content.dom, function (_, oN) {
                  normalizeDomNode(oN);
              });

              var sElem;
              for ( sElem in oD.content.style) {
                if(oD.content.style.hasOwnProperty(sElem))
                  normalizeDomNode(oD.content.style[sElem]);
              }

              if (oD.cg) {
                  oD.centerStage = oD.cg;
              }
              if (oD.stf) {
                  oD.scaleToFit = oD.stf;
              }
              if (oD.x) {
                  oD.variables = oD.x;
              }
              if (oD.tt) {
                  oD.timeline = oD.tt;
              }

              var oTL = oD.timeline;

              if(oTL != null)
              {

                      if (oTL.d != null) {
                          oTL.duration = oTL.d;
                      }
                      if (oTL.a != null) {
                          oTL.autoPlay = oTL.a;
                      }
                      if (oTL.l) {
                          oTL.labels = oTL.l;
                      }

                      for (var i = 0; i < oTL.data.length; i++) {
                          if(oTL.data[i] && oTL.data[i][8] && oTL.data[i][8].vt)
                          {
                            oTL.data[i][8].valueTemplate = oTL.data[i][8].vt;
                          }

                          if(oTL.data[i] && oTL.data[i][1] && oTL.data[i][1]==="tr")
                          {
                            oTL.data[i][1]=shortLongNameMap["tr"];
                          }
                      }


              }
          }
      }


      comp.sym = symbolData;
    };

    function Composition(compId, opts) {
        Notifier.call(this);

        this.$ = $;

        extend(this, {
            id: compId,

            opts: extend(opts || {}, defaultOptions),

            _urlRegExp: new RegExp('^(?:[a-z]+:)?//', 'i'),

            _l: {},//hashtable of uris in the process of loading

            _s: [],//array of symbol instances

            loaded: function (uri, result, key) {
                //at this time the comp JS has been loaded, but we still need to exhaust the composition's loading queue...
                this._l[uri] = null;

                if (isEmpty(this._l)) {
                    this.ready();
                }
            },

            load: function (uri, cbk) {
                if(!cbk) this._l[uri] = true;
                var me=this;
                yepnope({load: this._getFullURL(uri), callback: function(ri, result, key){ cbk ? cbk(uri,result,key) : me.loaded(uri,result,key);}});
            },

            define: function (opts, symbols, fonts, scripts, resources, effects) {
                //console.log("define comp with id = " + this.id);
                registerSymbols(this,symbols);
                this.fnt = fonts;
                this.res = resources;
                this.fx = effects;
                mapToTranslate(symbols);
                this.registerFonts(fonts);

                var self = this;
                if(scripts && scripts.length > 0) {
                    scripts.forEach(function(s) {
                        self.load(s);
                    });
                }
            },

            _getFullURL: function(url) {
                if(this._urlRegExp.test(url)) return url;
                return (this.opts.htmlRoot || "") + url;
            },

			definePreloader: function(preloaderDOM) {
				this.preloaderDOM = preloaderDOM;
			},

			defineDownLevelStage: function(downLevelStageDOM) {
				this.downLevelStageDOM = downLevelStageDOM;
			},

            getStage: function () {
                return this.stage;
            },

            registerFonts: function(fonts) {
                if (!fonts) {
                    return;
                }
                var iTKPos,
                    iTKEnd,
                    eleTK,
                    fnTypeKitInit,
                    bFontExists,
                    bEWF,
                    fontName,
                    sInclude,
                    sExistingFont,
                    iScriptStart,
                    iScriptEnd,
                    sScript,
                    sTKURL;

                an.fonts = an.fonts || {};

                for (fontName in fonts) {
                    if (fonts.hasOwnProperty(fontName)) {
                        if (!an.fonts[fontName]) {

                            sInclude = fonts[fontName];

                            if (sInclude && sInclude !== "") {

                                //see if an.fonts already has this include... if so we don't need to instantiate it again...
                                bFontExists = false;
                                for (sExistingFont in an.fonts) {
                                    if (an.fonts.hasOwnProperty(sExistingFont)) {
                                        if (an.fonts[sExistingFont] === sInclude) {
                                            bFontExists = true;
                                        }
                                    }
                                }

                                if (!bFontExists) {
                                    an.fonts[fontName] = sInclude;

                                    /*
                                     <script type="text/javascript" src="//use.typekit.com/pza4jbg.js"></script>
                                     <script type="text/javascript">try{Typekit.load();}catch(e){}</script>
                                     */
                                    iTKPos = sInclude.indexOf("//use.typekit.com/");
                                    if (iTKPos < 0) {
                                        iTKPos = sInclude.indexOf("//use.typekit.net/");
                                    }
                                    if (iTKPos < 0) {
                                        iTKPos = sInclude.indexOf("//use.edgefonts.net/");
                                        bEWF = (iTKPos > 0);
                                        window._adobewebfontsappname_ = "Animate";
                                    }

                                    if (iTKPos > 0) {

                                        iTKEnd = sInclude.indexOf("\"", iTKPos + 1);
                                        if (iTKEnd > 0) {
                                            sTKURL = sInclude.substring(iTKPos, iTKEnd);

                                            if (bEWF && window.location.protocol === 'file:') {
                                                sTKURL = "http:" + sTKURL;
                                            }

                                            eleTK = document.createElement("script");
                                            eleTK.src = this._getFullURL(sTKURL);
                                            eleTK.type = "text/javascript";
                                            document.getElementsByTagName("head")[0].appendChild(eleTK);
                                            if (!bEWF) {

                                                fnTypeKitInit = function () {
                                                    try {
                                                        window.Typekit.load();
                                                    } catch (e) {
                                                        window.setTimeout(fnTypeKitInit, 100);
                                                    }
                                                };
                                                window.setTimeout(fnTypeKitInit, 100);
                                            }
                                        }
                                    } else if ((sInclude.indexOf("<script") < 0) && (sInclude.indexOf("<link") < 0)) {
                                        $('head').append(document.createTextNode(sInclude));
                                    } else if (sInclude.indexOf("<script") < 0) {
                                        //for non-script includes - we can just append to the head
                                        $('head').append(sInclude);
                                    } else {
                                        //we can try to eval their script...
                                        iScriptStart = sInclude.indexOf(">");
                                        iScriptEnd = sInclude.indexOf("</script>");

                                        if (iScriptStart > 0 && iScriptEnd > 0) {
                                            sScript = sInclude.substring(iScriptStart + 1, iScriptEnd);
                                            try {
                                                window.eval(sScript);
                                            } catch (exFnt) {
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            getSymbols: function (symbolName) {
                if(!symbolName) return this._s;

                var aRet = [];
                each(this._s, function (i, inst) {
                    if (inst.name === symbolName) {
                        aRet.push(inst);
                    }
                });
                return aRet;
            },

            //0 - render:calibrate
            rC: function (ms) {
                //extended in an.prop.js to traverse symbols to figure out if any triggers want to resync this time
                return ms;
            },
            //1 - render:prepare (rP)

            //TBD: add render prepare

            //2 - render:render
            rR: function (ms) {
                //execute timeline rendering
                if(this.stage) tick(this.stage, ms);
            },
            //3 - render:apply (rA)

            //TBD: finalize the update ???


            ready: function () {
                var self = this;
                AdobeEdge.ready(function () {
                    if (win.AdobeEdge && win.AdobeEdge.bootstrapLoading) {
                        opts = opts || {};
                        opts.bootstrapLoading = true;
                    }

			        //TODO - make sure that we redefine this only if jQuery is loaded from the edge composition.
					//Enabling a basic flow right now for testing and feedback on the upgrade workflow
            		if (!window.edge_authoring_mode) {
                        if (opts && opts.framework$) {
                            an.$ = opts.framework$;
                        } if(window.jQuery) {
                            an.$ = window.jQuery;
                        }
                    }

                    AdobeEdge.addTouchSupport();

                    if(self.bindingFn) self.bindingFn(an.$);

                    //dismiss the preloader
                    var s = self.stage = new Symbol(self.sym, 'stage', self),
                        fnLaunch;

                    var className = "." + self.id;
                    var $stg = $(className);
                    if(!$stg[0]) $stg = $("body").addClass(className);
                    s.init($stg[0], "edgeLoad-" + self.id);
                    s._applyBaseStyles($stg, 'stage');
                    $stg.css("position", "relative");

                    if (!window.edge_authoring_mode || opts.sym) {
                        var stageData = s.data.stage;

                        if (stageData && (stageData.scaleToFit === 'height' || stageData.scaleToFit === 'width' || stageData.scaleToFit === 'both')) {
                            wrapForStageScaling($(className));
                        }
                        if (stageData && (stageData.centerStage === 'vertical' || stageData.centerStage === 'horizontal' || stageData.centerStage === 'both')) {
                            centerTheStage(s.ele, stageData.centerStage);
                        }
                        if (stageData.scaleToFit === 'height' || stageData.scaleToFit === 'width' || stageData.scaleToFit === 'both') {
							var baseStateForStage = stageData.content.style['${Stage}'],
								minWidth, maxWidth, rePx = /px|^0$/;
							if (baseStateForStage && baseStateForStage.sizeRange) {
								minWidth = baseStateForStage.sizeRange[0];
								minWidth = rePx.test(minWidth) ? parseInt(minWidth, 10) : undefined;
								maxWidth = baseStateForStage.sizeRange[1];
								maxWidth = rePx.test(maxWidth) ? parseInt(maxWidth, 10) : undefined;
							}
                            bindStageScaling(s.$('Stage'), stageData.scaleToFit, minWidth, maxWidth, true, self.opts.bScaleToParent);
                        }
                    }

                    //preload fonts & images then launch

                    fnLaunch = function () {
                        if (self.launchCalled || (self.opts.bootstrapLoading && !an.doPlayWhenReady)) {
                            an.readyAndWaiting.push(fnLaunch);
                            return;
                        }
                        self.launchCalled = true;
                        $(".edgePreload-" + self.id).css("display", "none");
						//Keep the behavior same as R1
                        $(".edgeLoad-" + self.id).removeClass("edgeLoad-" + self.id);

                        aBootcompsLoaded.push(self.id);
                        var len = AdobeEdge.bootstrapListeners.length;
                        for (var i = 0; i < len; i++) {
                            try {
                                AdobeEdge.bootstrapListeners[i](self.id);
                            }
                            catch(e) {
                                console.log("bootstrap error " + e);
                            }
                        }

                        var evt = $.Event("compositionReady");
                        evt.compId = self.id;

                        $(document).trigger(evt);

                        self.readyCalled = true;

                        if(!window.edge_authoring_mode) {
                            playAuto(s, true);
                        } else {
                            s.stopAll(0);
                        }
                    };

                    if (isEmpty(self._l)) {
                        //nothing else to load, we can go ahead and launch
                        fnLaunch();
                    } else {
                        //wait for the assets to load then then launch
                        self.addObserver({ "assetsLoaded": function (e, data) {
                            fnLaunch();
                        }});
                    }
                });
            },
            getCompId: function () {
                return this.id;
            }
        });
        return this;
    }

    extend(Composition.prototype, Notifier.prototype);
    Composition._playAuto = playAuto;

    //the first phase of comp rendering is special, so it can't use renderU
    function renderCalibrate(msElapsed) {
        each(comps, function (_, comp) {
            msElapsed = Math.min(comp.rC(msElapsed), msElapsed);
        });
        return msElapsed;
    }

    //comp rendering phase utility
    function renderU(msElapsed, fn) {
        each(comps, function (_, comp) {
            var f = comp[fn];
            if (f) {
                f.call(comp, msElapsed);
            }
        });
    }

    function tick(sym, ms) {

        if(sym.ci) {
            for(var i=0; i<sym.ci.length; ++i) {
                var inst = sym.ci[i];
                if(inst) tick(inst, ms);
            }
        }

        if(sym) sym._getTimeline().tick(ms);
    }

    function startClock() {

        //tick at roughly 60fps
        var t = 17,
            requestAnimationFrame;

        if (!fnTimer) {
            requestAnimationFrame = win.requestAnimationFrame || win.webkitRequestAnimationFrame ||
                win.mozRequestAnimationFrame || win.msRequestAnimationFrame || win.oRequestAnimationFrame ||
                function (cb) {
                    win.setTimeout(cb, t);
                };

            fnTimer = function () {

                var msElapsed = 0;//TBD

                //Phase 0 - calibrate: compositions have a chance to wind-back time here in case we missed a trigger or other important time-sync event
                msElapsed = renderCalibrate(msElapsed);

                //Phase 1 - prepare: compositions all have a chance to setup rendering
                renderU(msElapsed, "rP");

                //checkpoint - we may have decided to cancel rendering by now, that can be done per-composition

                //Phase 2 - render: compositions render each property
                renderU(msElapsed, "rR");

                //Phase 3 - apply: compositions apply net property changes
                renderU(msElapsed, "rA");

                //console.log(".");

                requestAnimationFrame.call(win, fnTimer);
            };
            requestAnimationFrame.call(win, fnTimer);
        }
    }

    startClock();

    function documentReady(fn) {
        if (docIsReady || doc.readyState === "complete") {
            //win.setTimeout(fn, 0);
            fn();
        }
        else if (doc.addEventListener) {

            var fired=false;
            // Use the handy event callback
            doc.addEventListener("DOMContentLoaded", function (e) {
                docIsReady = true;
                if(!fired)
                {
                  fn();
                  fired=true;
                }
            }, false);

            doc.onreadystatechange = function () {
            if(document.readyState == "complete")
                docIsReady = true;
                doc.onreadystatechange=null;
                if(!fired)
                {
                  fn();
                  fired=true;
                }
          }
        } else if (doc.attachEvent) {
            doc.attachEvent("onreadystatechange", function (e) {
                docIsReady = true;
                fn(e);
            });
        }
    }

    function registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts) {
        var comp = comps[compId];
        comp.define(opts, symbols, fonts, scripts, resources);
    }

    function isPx(val) {
        if (val && typeof(val) === "string" && (val.indexOf("%") > 0 || val.indexOf("em") > 0 || val === "auto" || val === "null")) {
            return false;
        }
        return true;
    }

    function getPxValue(sPxVal) {

        if (!sPxVal) {
            return 0;
        }

        if (typeof(sPxVal) === "number") {
            return sPxVal;
        }

        var pos = sPxVal.indexOf("px").
            val;
        if (pos > 0) {
            val = sPxVal.substring(0, pos);
            return parseFloat(val);
        }
        return parseFloat(sPxVal);
    }

    function mapSymToTranslate (sym) {
        var sStateName,
            oState,
            sActorName,
            aKeyframes,
            aNewKeyframes,
            i,
            sNewPropName,
            aKF,
            sTimelineName,
            oTimeline,
            aTimeline,
            oTween,
            htLeft = {},
            htTop = {},
            bHasLeft,
            bHasTop,
            bHasTxfm,
            htManagedIDs = {},
            htHasPxAni = {};


        //timelines
        if (sym.timeline) {
            aTimeline = sym.timeline;
            for (i = 0; i < aTimeline.data.length; i++) {
                oTween = aTimeline.data[i];
                if (!oTween || (oTween[1] != "left" && oTween[1] != "top") || !isPx(oTween[7])) {
                    continue;
                }
                htHasPxAni[oTween[5]] = true;
            }
        }

        if (sym.content && sym.content.dom) {
            mapContentToTranslate(sym.content.dom, htManagedIDs, htHasPxAni, htLeft, htTop);
        }

        //timelines
        if (sym.timeline) {
            aTimeline = sym.timeline
            for (i = 0; i < aTimeline.data.length; i++) {
                oTween = aTimeline.data[i];
                if (!oTween || (oTween[1] != "left" && oTween[1] != "top") || !isPx(oTween[7])) {
                    continue;
                }
                if (!htManagedIDs[oTween[5]]) {
                    continue;
                }

                if (oTween[1] === "left") {
                    sNewPropName = "translateX";
                }
                else if (oTween[1] === "top") {
                    sNewPropName = "translateY";
                }

                oTween[1] = sNewPropName;
            }
        }
    }

    function mapContentToTranslate(aDom, htManagedIDs, htHasPxAni, htLeft, htTop) {
        var i,
            oN,
            sId;

        for (i = 0; i < aDom.length; i++) {
            oN = aDom[i];
            sId = "${" + oN.id + "}";

            if (htHasPxAni[sId]) {

                htManagedIDs[sId] = true;

                if (!oN.rect) {
                    oN.rect = oN.r;
                    oN.r = undefined;
                    if (!oN.rect) {
                        oN.rect = [0, 0, 0, 0];
                    }
                }

                if (oN.rect) {

                    if (!oN.transform) {
                        oN.transform = oN.tf;
                        oN.tf = undefined;
                        if (!oN.transform) {
                            oN.transform = [];
                        }
                    }
                    if (!oN.transform[0]) {
                        oN.transform[0] = [0, 0];
                    }

                    if (isPx(oN.rect[0])) {
                        oN.transform[0][0] = getPxValue(oN.rect[0]);
                        htLeft[sId] = oN.transform[0][0];
                        oN.rect[0] = "0px";
                    }

                    if (isPx(oN.rect[1])) {
                        oN.transform[0][1] = getPxValue(oN.rect[1]);
                        htTop[sId] = oN.transform[0][1];
                        oN.rect[1] = "0px";
                    }
                }
            }

            if (oN.children) {
                mapContentToTranslate(oN.children, htManagedIDs, htHasPxAni, htLeft, htTop);
            }
            else if (oN.c) {
                mapContentToTranslate(oN.c, htManagedIDs, htHasPxAni, htLeft, htTop);
            }
        }
    }

    function mapToTranslate(symbolData) {
        var sym;
        if (!window.edge_authoring_mode) {
            for (var symName in symbolData) {
                if (symbolData.hasOwnProperty(symName)) {
                    mapSymToTranslate(symbolData[symName]);
                }
            }
        }
    }

    function registerEventBinding(compId, bindingFn) {
        comps[compId].bindingFn = bindingFn;
    }


    /********************************************************************
     **                                                               **
      *   This is an added (hacked-in) method, to bypass the adding
      *   and loading of script tags, for use in dev workflows where
      *   code is precompiled and minified before distribution.
      *   It may also useful in workflows that make use of require
      *   statements (requirejs, browserify, es6/babel).
      *
      *   Currently does not support many of the features / checks
      *   found in the loadComposition method.
      *   (Preloaders / browers that do not support transform)
     **                                                               **
    *********************************************************************/


    /* starthack */

    function addComposition(compId, opts, compDefn) {
        var symbols   = compDefn.symbols,
            fonts     = compDefn.fonts,
            scripts   = compDefn.scripts,
            resources = compDefn.resources,
            defnOpts  = compDefn.opts;

        // Create and add the composition to the compositions Array
        if(AdobeEdge.compositions[compId]) {
            return AdobeEdge.compositions[compId];
        } else {
            var comp = comps[compId] = AdobeEdge.compositions[compId] = new Composition(compId, opts);
            notifyObservers(AdobeEdge, 'newComp', {comp: comp});
            AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, defnOpts);
        }

        return comp;
    }

    /* endhack */


    //TBD: remove loadComp (or loadComposition depending on which way we lean)
    function loadComposition(projectPrefix, compId, opts, preloaderDOM, downLevelStageDOM) {

		function preprocessStageInfo(stg, stageInfo) {
			var rePx = /px|^0$/;
			var plSTF	 = stageInfo.scaleToFit,
				ctrPlS 	 = stageInfo.centerStage,
				minPlW 	 = stageInfo.minW,
				maxPlW 	 = stageInfo.maxW,
				plWidth  = stageInfo.width,
				plHeight = stageInfo.height;

			var oS = stg || document.getElementsByTagName('body')[0];

			if (oS.style.position != 'absolute' && oS.style.position != 'relative') {
				oS.style.position = 'relative';
			}
			if (plHeight) {
				oS.style.height = plHeight;
			}
			if (plWidth) {
				oS.style.width = plWidth;
			}
			// preloadScaleToFit flag is written out as plSTF
			if (/^height$|^width$|^both$/.test(plSTF)) {
				minPlW = rePx.test(minPlW) ? parseInt(minPlW, 10) : undefined;
				maxPlW = rePx.test(maxPlW) ? parseInt(maxPlW, 10) : undefined;
				bindStageScaling($(oS), plSTF, minPlW, maxPlW, false, opts.bScaleToParent);
			}
			// centerPreloaderStage flag is written out as ctrPlS
			if (/^vertical$|^horizontal$|^both$/.test(ctrPlS)) {
				centerTheStage(oS, ctrPlS);
			}
		}

        function processContent(content, prefix) {
			documentReady(function() {
				var $stg = $("." + compId);

				preprocessStageInfo($stg[0], opts);

                if (content) {
					renderDOM(comps[compId], null, content.dom, content.style, $stg[0], prefix + compId);
				}
				//show the content
				$stg.removeClass("edgeLoad-" + compId);
			});
        }

		function processPreloader() {
            processContent(comp.preloaderDOM, "edgePreload-");
		}

        function processDownLevelStage() {
            processContent(comp.downLevelStageDOM, "edgeDownLevel-");
		}

        var comp = comps[compId] = AdobeEdge.compositions[compId] = new Composition(compId, opts);
        notifyObservers(AdobeEdge, 'newComp', {comp: comp});
        //check to see if this is a downlevel browser
        if (hasTransform) {

            if(!window.edge_authoring_mode) {
                if(!preloaderDOM) {
                    comp.load(projectPrefix + "_edgePreload.js", processPreloader);
                } else {
                    comp.definePreloader(preloaderDOM);
                    processPreloader();
                }
            }

            if (projectPrefix) {
                if (opts && opts.bootstrapLoading) {
                    //load when loadResources is called...
                    payloadsToLoad.push(projectPrefix);
                } else {
                    //should this be a "payload" file???"
                    if(window.edge_authoring_mode && opts.sym) {
						//request the resource with the symbol query parameter - required for library preview
                        //TODO - get rid of this from the runtime code
                        comp.load(projectPrefix + "_edge.js?symbol="+opts.sym)
                    } else {
                        comp.load(projectPrefix + "_edge.js");
                    }
                }
            }

        } else {
            //load the downlevel stage
            if(!window.edge_authoring_mode) {
                if(!downLevelStageDOM) {
                    comp.load(projectPrefix + "_edgePreload.js", processDownLevelStage);
                } else {
                    comp.defineDownLevelStage(downLevelStageDOM);
                    processDownLevelStage();
                }
            }
        }
    }


    function registerFonts(fonts) {
        AdobeEdge.getCurrentComposition().registerFonts(fonts);
    }

    function playWhenReady() {
        an.doPlayWhenReady = true;
        for (var i = 0; i < an.readyAndWaiting.length; i++) {
            an.readyAndWaiting[i]();
        }
    }

    supported.cssTransform = isSupported( ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'] );
    // Use our own detection instead of Modernizr.csstransforms3d
    supported.cssTransform3d = isSupported( ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'] );
    supported.audio = supportedAudio();
    supported.video = supportedVideo();
    supported.customEvent = isCustomEventSupported();
    supported.addEventListener = window.addEventListener !== undefined;
    supported.rgba = supportsRGBA();

    extend(an, {
        version: "5.0.0",
        Composition: Composition,
        defaultOpt: defaultOptions,

        $: $,
        An$: An$,
        renderDOM: renderDOM,

        ready: documentReady,

        camelize: camelize,
        splitUnits: splitUnits,

        addComposition: addComposition,
        loadComposition: loadComposition,
        registerCompositionDefn: registerCompositionDefn,
        registerEventBinding: registerEventBinding,

        getComposition: getComposition,
        defineProps: defineProps,
        props: props,
        Symbol: Symbol,
        Notifier: Notifier,
        isSupported: isSupported,
        supported: supported,
        isIOS: isiOS(),
        isOpera: isOpera(),
        registerFonts: registerFonts,
        playWhenReady: playWhenReady,

        _: {
            c: comps, //all comps
            P: Prop, // the Prop class
            p: props, //all the props

            rE: renderEle,
            nO: notifyObservers,
            nDN: normalizeDomNode
        }

    });
    extend(an, Notifier.prototype);
    Notifier.call(an);

})(AdobeEdge);

if(!AdobeEdge.bootstrapListeners) {
    AdobeEdge.bootstrapListeners=[];
}
AdobeEdge.bootstrapCallback=function(fnCallback) {
    AdobeEdge.bootstrapListeners.push(fnCallback);
    if(aBootcompsLoaded.length > 0) {
        for(var i=0;i<aBootcompsLoaded.length;i++) {
            fnCallback(aBootcompsLoaded[i]);
        }
    }
};

if(!AdobeEdge.compositions) {
    AdobeEdge.compositions=[];
}

AdobeEdge.yepnope = window.yepnope;// an.timeline.js - version  2.0
//
// Copyright (c) 2010. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
/*global window: false, document: false, CustomEvent: false, HTMLElement: false, console:false, alert: false, Object: false, undefined: false */

(function (Edge) {


    // Note: all functions or vars prefixed by '_' are to be considered to be non-public and should be only accessed
    // by the defining 'class' and its derived 'classes'.

    "use strict";

    var $ = Edge.$,
        tweenFactories = {},
        tweenTypes = {},   // map properties to tween types - each type must register theirs
        tweenDefaultType = "style", // use this if property name isn't found
        timelineDefaultConfig = {
            dropFrames: true,
            fps: 60, // milliseconds
            pauseThreshold: 250
        },
        tweenDefaultConfig = {
            duration: 500 // milliseconds
        },
        triggerPattern = /^(trigger|@)$/;

//////////////////////////////////////////////////////////////////////
//
// Animation
//
//////////////////////////////////////////////////////////////////////

    $.isArray = function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    $.easing = $.easing || {};

    $.extend($.easing, {
        linear: function (p, n, firstNum, diff) {
            return firstNum + diff * p;
        },
        swing: function (p, n, firstNum, diff) {
            return ((-Math.cos(p * Math.PI) / 2) + 0.5) * diff + firstNum;
        }
    });


    function Animation() {
        Edge.Notifier.call(this);
        this.animationID = "animID-" + Animation.nextID;
        Animation.nextID += 1;
    }

    Animation.nextID = 1;

    $.extend(Animation.prototype, Edge.Notifier.prototype);
    $.extend(Animation.prototype, {
        constructor: Animation,

        setup: function () {
        },
        update: function (elapsed, easingConst) {
        },
        getDuration: function () {
            return 0;
        }
    });

//////////////////////////////////////////////////////////////////////
//
// Trigger
//
//////////////////////////////////////////////////////////////////////


    function Trigger(handler, data, handlerContext) {
        Edge.Animation.call(this);
        if (typeof handler === 'function') {
            this.handler = handler;
        } else if (typeof handler === 'string') {
            this.eventType = handler;
        }
        this.handlerContext = handlerContext;
        this.data = data;
        this.isTrigger = true;
    }

    $.extend(Trigger.prototype, Animation.prototype);
    $.extend(Trigger.prototype, {
        constructor: Trigger,

        update: function (elapsed) {
            if (!this.fired) {
                this.fired = true;
                if (this.handler) {
                    this.handler.call(this.handlerContext, elapsed, this.data);
                } else if (this.eventType && this.timeline) {
                    this.timeline.notifyObservers(this.eventType, { elapsed: elapsed, data: this.data });
                }
            }
        },
        setup: function (timeline, position) {
            var useAutoForExecuteTriggers = timeline.executeTriggers === undefined || timeline.executeTriggers === null;

            if ((timeline.startingFromCurrent && useAutoForExecuteTriggers) || (!useAutoForExecuteTriggers && !timeline.executeTriggers)) {
                this.fired = ((timeline.playDirection !== "reverse") ? timeline.currentPosition >= position : timeline.currentPosition <= position);
            } else {
                this.fired = ((timeline.playDirection !== "reverse") ? timeline.currentPosition > position : timeline.currentPosition < position);
            }
            this.timeline = timeline;
        }

    });


//////////////////////////////////////////////////////////////////////
//
// TimelineObject
//
//////////////////////////////////////////////////////////////////////

    function TimelineObject(animation, position, duration, easing, opts) {
        Edge.Notifier.call(this);

        this.animation = animation;
        this.position = 0;  // msecs relative to the start of the timeline.
        this.duration = -1; // The amount of time this object is active within the timeline.
        this.opts = {};
        $.extend(this.opts, opts);
        if (typeof easing === "function") {
            this.easing = easing;
        } else {
            this.easing = easing && $.easing[easing] ? easing : TimelineObject.defaultEasing;
        }

        if (position !== undefined) {
            this.position = position;
        }
        if (duration !== undefined) {
            this.duration = duration;
        }

        // These properties get set up when the timeline is in play mode.

        this.timeline = null;
        this.dScale = 1;     // The ratio between the animation's duration and the override.
        this.dDuration = 0;
        this.done = false;
    }

    TimelineObject.defaultEasing = "linear";
    $.extend(TimelineObject.prototype, Edge.Notifier.prototype);
    $.extend(TimelineObject.prototype, {
        constructor: TimelineObject,

        setup: function (timeline) {
            this.timeline = timeline;
            var oDuration = this.duration,
                sDuration = null;
            if (this.animation && this.animation.getDuration) {
                sDuration = this.animation.getDuration();
            }
            this.dScale = (oDuration !== -1 && oDuration !== 0) ? sDuration / oDuration : 1;
            this.dDuration = oDuration !== -1 ? oDuration : sDuration;
            this.done = false;
            if (this.animation && this.animation.setup) {
                this.animation.setup(timeline, this.position);
            }
        },

        update: function (elapsed) {
            if (!this.done) {
                var e = elapsed,
                    d = this.dDuration,
                    easingConst,
                    complete;

                if (this.animation) {
                    // Prevent a divide by zero for zero-length tweens.
                    if (d === 0) {
                        if (e >= 0) {
                            // seek anywhere in or beyond tween yields toval
                            easingConst = 1;
                        } else {
                            easingConst = 0;
                        }
                    } else {
                        if (e >= d) {
                            e = d;
                        }
                        if (e <= 0) {
                            e = 0;
                        }

                        easingConst = $.easing[this.easing](e / d, e, 0, 1, d);
                    }

                    this.animation.update(e * this.dScale, easingConst);
                }

                complete = this.timeline.playDirection === "reverse" ? e <= 0 : e >= d;
                if (complete) {
                    this.complete();
                }
            }
        },

        complete: function () {
            this.done = true;
            if (this.timeline) {
                this.timeline.updateComplete(this);
            }
        },

        getPosition: function () {
            return this.position;
        },

        setPosition: function (pos) {
            this.position = pos;
        },

        getDuration: function () {
            return this.duration !== -1 ? this.duration : (this.animation && this.animation.getDuration ? this.animation.getDuration() : 0);
        },

        setDuration: function (duration) {
            this.duration = duration >= 0 ? duration : -1;
        }
    });


//////////////////////////////////////////////////////////////////////
//
// Timeline
//
//////////////////////////////////////////////////////////////////////

    function Timeline(opts) {
        Edge.Animation.call(this);

        $.extend(this, Edge.Timeline.config);
        $.extend(this, opts);

        this.timer = 0;
        this.timerStart = 0;
        this.startPosition = 0;
        this.currentPosition = -1;
        this.playing = undefined;
        this.duration = 0;
        this.iteration = 0;

        this.interval = 1000 / this.fps;

        this.objects = [];
    }

    Timeline.config = timelineDefaultConfig;

    /**
     Update all timelines driven by an external clock. To use an external clock, pass 'externalClock:true'
     as an option to play() for any timelines to be driven. Then, call this function to update all of them,
     based on whatever external time source you are using.
     @name tick
     @memberOf AdobeEdge.Timeline
     @function
     @return nothing
     */
    Timeline.prototype.tick = function (ms) {
        this._handleTimer(ms);
    };

    function loop(timeline) {
        var animations = timeline.objects,
            alen = animations.length,
            i;
        for (i = 0; i < alen; i += 1) {
            animations[i].done = false;
        }
        timeline.tick();
    }

    $.extend(Timeline.prototype, Animation.prototype);
    $.extend(Timeline.prototype, {

        constructor: Timeline,

        /**
         Play this timeline
         @name play
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @param {object} opts Options for running timeline.
         @return nothing
         */
        play: function (opts) {
            opts = opts || {};
            this.notifyObservers("play");
            this.playing = true;
            this._stop({});

            if (typeof opts.pos === "undefined" || opts.pos === null) {
                if(opts.playDirection == "reverse") {
                    opts.pos = this.currentPosition;
                    if (opts.pos <= 0) {
                        opts.pos = this.getDuration();
                    }
                } else if (this.currentPosition < 0 || this.currentPosition >= this.getDuration()) {
                    opts.pos = 0;
                }
            }

            //TODO - Get rid of opts.pos, its unnecessarily adding a variable in timeline which may be confused for something else
            $.extend(this, opts);

            this.seek(opts.pos, opts);
            this.sort(opts);

            this.iteration = 0;

            this.setup(this);

            this.timerStart = (new Date()).getTime();
            this.startPosition = this.currentPosition;

            this.lastUpdateTime = this.timerStart;

            this.firstUpdate = true;
            this._handleTimer();
            this.firstUpdate = false;
            return this;
        },

        /**
         Stop playing this timeline
         @name stop
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @return nothing
         */
        stop: function (opts) {
            this.playing = false;
            if(opts && opts.bSeek) {
                this.seek(opts.pos, opts);
            } else {
                this._stop(opts);
            }
        },

        /**
         Seek to a time in this timeline
         @name seek
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @param {number} pos Milliseconds to seek to.
         @param {object} opts Options for running timeline.
         @return nothing
         */
        seek: function (pos, opts) {
            this.notifyObservers("seek");
            this.sort(opts);
            var oldPosition = this.currentPosition;
            this._stop(opts);
            $.extend(this, opts);
            if(pos !== undefined) this.currentPosition = pos;

            if (typeof pos === "number" && oldPosition !== this.currentPosition) {
                this.startingFromCurrent = false;
            } else {
                this.startingFromCurrent = true;
            }
            this.setup(this);

            /* Note the extra oldPosition arg in this call to update. That allows optimization of multiple seeks
             *  if updateSeek supports it
             */
            this.firstUpdate = true;
            this.updateSeek(this.currentPosition, 1, oldPosition);
            this.firstUpdate = false;
            return this;
        },

        /**
         Add a TimelineObject to this timeline
         @name add
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @param {Animation} animation Animation to add as a TLO.
         @param {number} position Start position of animation in ms.
         @param {number} duration Duration of animation in ms.
         @param {string} easing Name of easing to use.
         @param {object} opts Options for new TimelineObject.
         @return nothing
         */
        add: function (animation, position, duration, easing, opts) {
            var o = new TimelineObject(animation, position, duration, easing, opts);
            this.objects.push(o);
            this.sorted = false;
        },

        sort: function (opts) {

            var sortPref = { "width": 1, "height": 2, "-webkit-transform-origin": 3, "transform-origin": 4, "-moz-transform-origin": 5, "-ms-transform-origin": 6, "left": 7, "top": 8, "bottom": 9, "right": 10, "motion": 11 };

            if (!this.sorted) {
                this.objects.sort(function (a, b) {
                    var aniA = a.animation,
                        aniB = b.animation;

                    //this is just defensive, it should never execute
                    if (!aniA && !aniB) {
                        return a.position - b.position;
                    } else if (!aniA) {
                        return -1;
                    } else if (!aniB) {
                        return 1;
                    }

                    //triggers don't have a property, so they all get grouped together and sorted by position
                    if (!aniA.property && !aniB.property) {
                        return a.position - b.position;
                    } else if (!aniA.property) {
                        return -1;
                    } else if (!aniB.property) {
                        return 1;
                    }

                    var srtA = sortPref[aniA.property],
                        srtB = sortPref[aniB.property];

                    if (aniA.sourceElements !== aniB.sourceElements) {
                        if (aniA.sourceElements > aniB.sourceElements) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }

                    //sorted properties first
                    if (srtA && (!srtB || srtB < srtA)) {
                        return 1;
                    }
                    if(srtB && (!srtA || srtB > srtA)) {
                        return -1;
                    }

                    //sort the transitions within the property
                    return a.position - b.position;
                });
                this.sorted = true;
            }

            //now link them
            for (var i = 1; i < this.objects.length; i++) {
                var prev = this.objects[i - 1];
                var obj = this.objects[i];

                if (prev.animation && obj.animation && prev.animation.property === obj.animation.property && prev.animation.sourceElements === obj.animation.sourceElements) {
                    prev.animation._nextObj = obj.animation;
                    obj.animation._prevObj = prev.animation;
                }
                else {
                    if (prev.animation) {
                        prev.animation._nextObj = null;
                    }
                    if (obj.animation) {
                        obj.animation._prevObj = null;
                    }
                }
            }
        },
        /**
         Get the duration of a timeline
         @name getDuration
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @return {number} Duration of the timeline in milliseconds
         */
        getDuration: function () {
            var duration = this.duration,
                objs = this.objects,
                ocnt = this.objects.length,
                m = Math.max,
                i,
                o;
            for (i = 0; i < ocnt; i += 1) {
                o = objs[i];
                duration = m(duration, o.position + o.getDuration());
            }
            return duration;
        },
        /**
         Get the current position of a timeline
         @name getCurrentPosition
         @memberOf AdobeEdge.Timeline.prototype
         @function
         @return Position of the timeline in milliseconds
         */
        getCurrentPosition: function () {
            return this.currentPosition;
        },

        update: function (elapsed, easingConst) {
            this.sort();

            this.notifyObservers("preUpdate", { elapsed: elapsed, easingConst: easingConst });

            var objs = this.objects, triggers = this.triggers,
                ocnt = objs.length, tcnt = triggers.length,
                forward = this.playDirection !== "reverse",
                updatedTweens = false,
                j,
                okToProceed = true,
                executeTriggers = !window.edge_authoring_mode && this.executeTriggers,
                useAutoForExecuteTriggers = !window.edge_authoring_mode && (this.executeTriggers === undefined || this.executeTriggers === null),
                o,
                p,
                directionMatches,
                i,
                t,
                shouldAutoFire,
                pos,
                state;
            this.currentDirection = forward ? "forward" : "reverse";
            // possible values for executeTriggers is true, false, or either null or undefined to be auto
            //first fire triggers - they have potential to reset the clock
            for (i = 0; i < tcnt; i += 1) {
                t = triggers[forward ? i : tcnt - i - 1];
                shouldAutoFire = t.animation.isTrigger && !(this.startingFromCurrent && this.firstUpdate);
                if (((useAutoForExecuteTriggers && shouldAutoFire) || executeTriggers || !this.firstUpdate) &&
                        (!t.animation.fired) &&
                        (forward ? elapsed >= t.position : elapsed <= t.position + t.duration)) {
                    pos = this.currentPosition = t.position;
                    state = this.getState();

                    //now update all the transitions
                    for (j = 0; j < ocnt; j += 1) {
                        o = objs[forward ? j : ocnt - j - 1];
                        directionMatches = (forward && !o.opts.reverseOnly) || (!forward && !o.opts.forwardOnly);
                        if (directionMatches && !o.animation.isTrigger && (forward ? pos >= o.position : pos <= o.position + o.duration)) {
                            p = pos - o.position;
                            if (!p && !o.duration && !forward) {
                                p -= 1;
                            }
                            o.update(p);
                        }
                    }
                    updatedTweens = true;
                    // Fire the trigger
                    t.animation.update(pos); // Pass in real total elapsed time

                    if (!this.equalState(state)) {
                        // Trigger changed the timeline state
                        okToProceed = false;
                        break;
                    }
                }
            }
            if (!updatedTweens) {
                // No triggers fired
                for (j = 0; j < ocnt; j += 1) {
                    o = objs[forward ? j : ocnt - j - 1];
                    directionMatches = (forward && !o.opts.reverseOnly) || (!forward && !o.opts.forwardOnly);
                    if (directionMatches && !o.animation.isTrigger && (forward ? elapsed >= o.position : elapsed <= o.position + o.duration)) {
                        p = elapsed - o.position;
                        if (!p && !o.duration && !forward) {
                            p -= 1;
                        }
                        o.update(p);
                    }
                }
            }
            this.notifyObservers("fxUpdate", { elapsed: elapsed });
            this.notifyObservers("postUpdate", { elapsed: elapsed, easingConst: easingConst });
            this.notifyObservers("update", { elapsed: elapsed, easingConst: easingConst });

            return okToProceed;
        },

        setLoop: function (loop) {
            this.loopCount = loop;
        },
        getState: function () {
            return {pos: this.currentPosition, dir: this.playDirection, playing: this.playing};
        },

        equalState: function (state) {
            var statePlaying = !!state.playing, thisPlaying = !!this.playing;   // Coerce to a boolean
            // If you do the negation in the expression, JsHint complains
            // about confusing use of ! and there's no switch to turn it off
            return state.pos === this.currentPosition && state.dir === this.playDirection && statePlaying === thisPlaying;
        },

        _handleTimer: function (tickTime) {

            //maybe optimize if not playing - stop updating?
            //if (!this.playing) return;

            tickTime = tickTime || (new Date()).getTime();
            // TODO: figure out exactly how to loop when you start at position other than 0
            // This assumes you loop from startPosition to end, and go back to same position each time
            var reversed = this.playDirection === "reverse",
                iterationLength = reversed ? this.startPosition : this.duration - this.startPosition,
                ms = tickTime - this.timerStart - this.iteration * iterationLength,
                elapsed = this.startPosition + (reversed ? -ms : ms),
                okToProceed,
                stillPlaying;

            if (tickTime - this.lastUpdateTime > this.pauseThreshold) {
                // We must have missed some updates, probably because the browser suspended us while the tab was hidden
                this.timerStart += tickTime - this.lastUpdateTime + this.interval;
                ms = tickTime - this.timerStart;
            }
            if (!this.playing) {
                this.notifyObservers("fxUpdate", { elapsed: ms });
                return;
            }

            elapsed = Math.max(0, Math.min(elapsed, this.duration));
            this.currentPosition = elapsed;
            okToProceed = this.update(elapsed, 1);
            this.lastUpdateTime = tickTime;

            reversed = this.playDirection === "reverse";
            stillPlaying = (!reversed ? this.currentPosition < this.duration : this.currentPosition > 0);
            if (!stillPlaying) {
                if (this.loopCount) {
                    this.iteration += 1;
                    this.notifyObservers("iterationComplete", { elapsed: ms, count: this.iteration });
                    if (this.loopCount === 'forever' || this.iteration < this.loopCount) {
                        loop(this);
                        return;
                    }
                }

                this.stop();
                this.notifyObservers("complete", { elapsed: ms });
            }
        },

        setup: function (timeline) {
            Edge.Animation.prototype.setup.call(this, timeline);

            this.triggers = [];
            var animations = this.objects,
                alen = this.objects.length,
                i,
                a;
            for (i = 0; i < alen; i += 1) {
                a = animations[i];
                a.done = false;
                a.setup(this);
                if (a.animation.isTrigger) {
                    this.triggers.push(a);
                }
            }

            this.duration = this.getDuration();
        },

        updateComplete: function (timelineObj) {
            timelineObj.done = true;
        },

        //Internal API
        _stop: function(opts) {
            var dontNotify = opts ? opts.dontNotify : false,
                i;

            if (!dontNotify) {
                this.notifyObservers("stop");
            }
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = 0;
            this.timerStart = 0;
            return this;
        }
    });

    Timeline.prototype.updateSeek = Timeline.prototype.update;

////////////////////////////////////

    Edge.Animation = Animation;
    Edge.TimelineObject = TimelineObject;
    Edge.Timeline = Timeline;


    /**
     Create a new timeline
     @name createTimeline
     @memberOf AdobeEdge.Timeline
     @function
     @param {object} opts Options for timeline.
     @return new Timeline
     */
    Edge.Timeline.createTimeline = function (opts) {
        return new Edge.Timeline(opts);
    };

    /**
     Create a new tween
     @name createTimeline
     @memberOf AdobeEdge.Timeline
     @function
     @param {string or ident} tweenType Type of tween as registered by addTweenType.
     @param {variable}  tweenData Data for tween - depends upon tween type
     @return new tween Animation - precise type depends on tweenType
     */
    Edge.Timeline.createTween = function (tweenType) {
        var factory = tweenFactories[tweenType];
        if (factory) {
            return factory.func.apply(factory.context, Array.prototype.slice.call(arguments, 1));
        }

        return null;
    };


    /**
     Add a new Tween type factory
     @name createTimeline
     @memberOf AdobeEdge.Timeline
     @function
     @param {object} opts Options for timeline.
     @return nothing
     */
    Edge.Timeline.addTweenType = function (tweenType, factoryFunc, context) {
        tweenFactories[tweenType] = { func: factoryFunc, context: context };
    };

    Edge.Timeline.addTweenProperty = function (propertyName, tweenType) {
        tweenTypes[propertyName] = tweenType;
    };

    Edge.Timeline.getTweenType = function (propertyName) {
        return tweenTypes[propertyName] || tweenDefaultType;
    };

    /**
     Create a new Trigger
     @name createTrigger
     @memberOf AdobeEdge.Timeline
     @function
     @param {string or function} handler Either the name of the event to fire, or a handler function to be called.
     @return new Trigger
     */
    Edge.Timeline.createTrigger = function (handler, data) {
        var handlerContext = arguments[arguments.length - 1];
        return new Trigger(handler, data, handlerContext);
    };


    function isTrigger(data) {
        return triggerPattern.test(data[1]);
    }

    Edge.Timeline.isTrigger = isTrigger;
    Edge.Timeline.isTween = function (data) {
        return !isTrigger(data);
    };

    /**
     Create a new timeline from JSON data
     @name createTimeline
     @memberOf AdobeEdge.Timeline
     @function
     @param {arr} opts Array of TLO JSON objects for timeline.
     @return new Timeline
     */
    Edge.Timeline.createTL = function (arr, context, options) {
        var tl = Edge.Timeline.createTimeline(),
            alen = arr.length,
            i,
            d,
            s,
            tweenType,
            args,
            opts,
            duration = arr.duration ? arr.duration : 0,
            easing;

        tl.duration = duration;

        if (options && options.loop) {
            tl.setLoop(options.loop);
        }
        for (i = 0; i < alen; i += 1) {
            d = arr[i];
            s = null;
            duration = -1;

            // We currently don't support nested timelines here,
            // but if/when we do, d[3] and d[4] are the same as in a
            // tween and d[5] should be a timeline array
            if (isTrigger(d)) {
                args = d.slice(3, 5);
                args.push(context);
                s = Edge.Timeline.createTrigger.apply(null, args);
                opts = d[5];
                easing = 'none';
            } else if (d[1]) {
                tweenType = tweenTypes[d[1]] || tweenDefaultType;
                args = [tweenType, d[1]].concat(d.slice(5));
                s = Edge.Timeline.createTween.apply(null, args);
                duration = d[3];
                easing = d[4];
                opts = d[8];
            }

            if (s) {
                s.id = d[0];
                tl.add(s, d[2], duration, easing, opts); // Note that opts is now part of trigger data
            }
        }

        return tl;
    };

})(AdobeEdge);
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 *
 * Open source under the BSD License.
 *
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

/*
 * This is wrapped in a function closure for protection and adapted to use in the Edge Animate (EdgeAn) framework
 */
(function (Edge) {

    "use strict";

    var $ = Edge.$,
        jQuery = $;

// t: current time, b: begInnIng value, c: change In value, d: duration
    $.easing['jswing'] = $.easing['swing'];

    $.extend(jQuery.easing,
        {
            def: 'easeOutQuad',
            swing: function (x, t, b, c, d) {
                //alert(jQuery.easing.default);
                return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
            },
            easeInQuad: function (x, t, b, c, d) {
                return c * (t /= d) * t + b;
            },
            easeOutQuad: function (x, t, b, c, d) {
                return -c * (t /= d) * (t - 2) + b;
            },
            easeInOutQuad: function (x, t, b, c, d) {
                if ((t /= d / 2) < 1) {
                    return c / 2 * t * t + b;
                }
                return -c / 2 * ((--t) * (t - 2) - 1) + b;
            },
            easeInCubic: function (x, t, b, c, d) {
                return c * (t /= d) * t * t + b;
            },
            easeOutCubic: function (x, t, b, c, d) {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            },
            easeInOutCubic: function (x, t, b, c, d) {
                if ((t /= d / 2) < 1) {
                    return c / 2 * t * t * t + b;
                }
                return c / 2 * ((t -= 2) * t * t + 2) + b;
            },
            easeInQuart: function (x, t, b, c, d) {
                return c * (t /= d) * t * t * t + b;
            },
            easeOutQuart: function (x, t, b, c, d) {
                return -c * ((t = t / d - 1) * t * t * t - 1) + b;
            },
            easeInOutQuart: function (x, t, b, c, d) {
                if ((t /= d / 2) < 1) {
                    return c / 2 * t * t * t * t + b;
                }
                return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
            },
            easeInQuint: function (x, t, b, c, d) {
                return c * (t /= d) * t * t * t * t + b;
            },
            easeOutQuint: function (x, t, b, c, d) {
                return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            },
            easeInOutQuint: function (x, t, b, c, d) {
                if ((t /= d / 2) < 1) {
                    return c / 2 * t * t * t * t * t + b;
                }
                return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
            },
            easeInSine: function (x, t, b, c, d) {
                return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
            },
            easeOutSine: function (x, t, b, c, d) {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            },
            easeInOutSine: function (x, t, b, c, d) {
                return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
            },
            easeInExpo: function (x, t, b, c, d) {
                return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
            },
            easeOutExpo: function (x, t, b, c, d) {
                return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
            },
            easeInOutExpo: function (x, t, b, c, d) {
                if (t == 0) {
                    return b;
                }
                if (t == d) {
                    return b + c;
                }
                if ((t /= d / 2) < 1) {
                    return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                }
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            },
            easeInCirc: function (x, t, b, c, d) {
                return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
            },
            easeOutCirc: function (x, t, b, c, d) {
                return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
            },
            easeInOutCirc: function (x, t, b, c, d) {
                if ((t /= d / 2) < 1) {
                    return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
                }
                return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
            },
            easeInElastic: function (x, t, b, c, d) {
                var s = 1.70158;
                var p = 0;
                var a = c;
                if (t == 0) {
                    return b;
                }
                if ((t /= d) == 1) {
                    return b + c;
                }
                if (!p) {
                    p = d * .3;
                }
                if (a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                }
                else {
                    var s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            },
            easeOutElastic: function (x, t, b, c, d) {
                var s = 1.70158;
                var p = 0;
                var a = c;
                if (t == 0) {
                    return b;
                }
                if ((t /= d) == 1) {
                    return b + c;
                }
                if (!p) {
                    p = d * .3;
                }
                if (a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                }
                else {
                    var s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
            },
            easeInOutElastic: function (x, t, b, c, d) {
                var s = 1.70158;
                var p = 0;
                var a = c;
                if (t == 0) {
                    return b;
                }
                if ((t /= d / 2) == 2) {
                    return b + c;
                }
                if (!p) {
                    p = d * (.3 * 1.5);
                }
                if (a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                }
                else {
                    var s = p / (2 * Math.PI) * Math.asin(c / a);
                }
                if (t < 1) {
                    return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                }
                return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
            },
            easeInBack: function (x, t, b, c, d, s) {
                if (s == undefined) {
                    s = 1.70158;
                }
                return c * (t /= d) * t * ((s + 1) * t - s) + b;
            },
            easeOutBack: function (x, t, b, c, d, s) {
                if (s == undefined) {
                    s = 1.70158;
                }
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            },
            easeInOutBack: function (x, t, b, c, d, s) {
                if (s == undefined) {
                    s = 1.70158;
                }
                if ((t /= d / 2) < 1) {
                    return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
                }
                return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
            },
            easeInBounce: function (x, t, b, c, d) {
                return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
            },
            easeOutBounce: function (x, t, b, c, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return c * (7.5625 * t * t) + b;
                } else if (t < (2 / 2.75)) {
                    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
                } else if (t < (2.5 / 2.75)) {
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
                } else {
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
                }
            },
            easeInOutBounce: function (x, t, b, c, d) {
                if (t < d / 2) {
                    return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
                }
                return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
            }
        });
})(AdobeEdge);

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *//**
 * Adobe Edge Animate - Symbol Core
 */

/*jslint plusplus:true, nomen: true*/
/*global window: false, document: false, CustomEvent: false, HTMLElement: false, console:false, alert: false */
/*properties AdobeEdge, $, Symbol, makeId, triggerDict, _, variableValue, originalEvent, methodName, composition, extend,
 createEvent, initEvent, _getTimeline, addObserver, timeline, symbol, length, type, getComposition, compId, bindings,
 data, name, actions, sym, getSymbols, newSymbol, bindElementAction, AnListeners, bind, EdgeAn$, element, each, creationComplete,
 getSymbolElement, isTween, isTrigger, Timeline,  comp, userClass, addClass, loop,
 init, symbolName, ci, prnt, defn, ele, isArray, newSymbol, newEle, newComp, cloneJSONObject, css,
 */
/* EdgeAn Core */
/*properties renderDOM, notifyObservers,
 */

/* Symbols and Properties */
/*properties id, children, props,prep, i, j, content, dom, tlCached, getSymbol, setSymbol, bindTimelineAction,
 bindTriggerAction, bindSymbolAction, bindVariableAction, performDefaultAction, autoPlay,  register, find$,
 variables, _rebuild, _seek, bldTL, getTimelineData, executeTriggers, labels, p2n, x, y, Stage, style, render,
 p, trimString, parseVariableName, substituteVariables */
/* Timelines */
/*properties duration, position, sort, reverseOnly, createTL, seek, play, stop, */
/*properties CustomEvent, bubbles, cancelable, dispatchEvent, Event, concat,
 console, log, prototype, slice, call, unshift, apply,
 test, splice, push, addEventListener, removeEventListener, hasOwnProperty,
 replace, max, preventDefault, join, split, sqrt, search */
(function (Edge) {

    "use strict";

    var $ = window.jQuery ? window.jQuery : Edge.$,
        Symbol = Edge.Symbol,
        Timeline = Edge.Timeline,
        isTween = Timeline.isTween,
        isTrigger = Timeline.isTrigger,
        idCounter = 0;

    function makeUniqueId(id, parentID) {
        if(parentID) return parentID + "_" + id;
        else return id + "_" + idCounter++;
    }

    Symbol._makeUniqueID = makeUniqueId;

    function registerId(sym, id, parentId) {
        var sel = makeUniqueId(id, parentId);
        sym._variables[id] = "#" + sel;
        return sel;
    }

    function getSymbol(ele) {
        if (ele.length) {
            ele = ele[0];
        }
        return ele ? ele.edgeSymbol : null;
    }

    function setSymbol(ele, sym) {
        if (ele.length) {
            ele = ele[0];
        }
        if (ele) {
            ele.edgeSymbol = sym;
        }
    }

    Edge.symbol = Symbol;   // Keep lowercase as an alias for now - but its use is deprecated
    Symbol.get = Symbol.getSymbol = getSymbol;
    Symbol.setSymbol = setSymbol;
    /*
     function unRegisterId(sym, id) {

     sym.map[id] = undefined; // Don't use delete, as it can have bad perf issues
     }
     */

    function extendElement(sym, $ele, oN) {
        var comp = sym.composition,
            s;
        // Add all the attributes and goodies not supported in EdgeAn core.
        if (oN.userClass) {
            $ele.addClass(oN.userClass);
        }
        Edge.$.data($ele[0], "defn", oN);  // save the initialization data
        if (oN.symbolName) {
            s = new Symbol(comp.sym, oN.symbolName, comp, sym); // ?? sym.stage = ??
            //comp.notifyObservers(comp, 'newSymbol', {symbol: s, parent: sym});
            s.init($ele[0]);
            sym.ci = sym.ci || [];
            sym.ci.push(s);
            s.prnt = sym;
        }
    }

    // Install observers to override core as needed
    Edge.addObserver({newComp: function (an, data) {
        data.comp.addObserver({newSymbol: function (comp, dat) {
            dat.symbol.addObserver({newEle: function (sym, da) {
                extendElement(sym, $(da.ele), da.defn);
            }});
        }});
    }});

    function cloneJSONObject(obj) {
        var o, v, i, cnt = obj.length, p;
        if ($.isArray(obj)) {
            o = [];
            for (i = 0; i < cnt; i++) {
                v = obj[i];
                o[i] = (v != null && typeof v === "object") ? cloneJSONObject(v) : v;
            }
        } else {// isObject
            o = {};
            for (p in obj) {
                if (obj.hasOwnProperty(p)) {
                    if (p !== 'prototype') {
                        v = obj[p];
                        o[p] = (v != null && typeof v === "object") ? cloneJSONObject(v) : v;
                    }
                }
            }
        }
        return o;
    }

    Edge.cloneJSONObject = cloneJSONObject;

    function _getTimelineData(sym) {
        var s = sym.data[sym.name];
        return s.timeline ? s.timeline.data : null;
    }

    function _getTimelineDuration(sym) {
        var s = sym.data[sym.name];
        return s.timeline ? s.timeline.duration : 0;
    }

    function getTimelineDefn(sym) {
        return sym.data[sym.name].timeline;
    }

    function getInitialValue(sym, sel, cssProp) {
        var id = sel.replace(/[\{\}\$]/g, ""),
            s = sym.data[sym.name],
            i,
            dom = s.content ? s.content.dom : null,
            oN,
            oProp;

        function findDefn(dom, id) {
            for (i = 0; i < dom.length; i += 1) {
                if (dom[i].id === id) {
                    return dom[i];
                }
                if (dom[i].children) {
                    return findDefn(dom[i].children, id);
                }
            }
            return null;
        }

        if (dom) {
            oN = findDefn(dom, id);
            if (oN) {
                oProp = Edge.props[cssProp];
                if (oProp) {
                    return oProp.prep(null, oN, cssProp, oProp.i, oProp.j);
                }
            }

        }
        return null;
    }

    function createSimpleMotionPathData(selector, beginPt, endPt, start, duration) {
        var mpd = [
                "generated",
                "location",
                start,
                duration,
                'linear',
                selector,
                [
                    [beginPt.x, beginPt.y, 0, 0],
                    [endPt.x, endPt.y, 0, 0]
                ]
            ];
        return mpd;
    }


    function buildTimeline(sym, force) {
        var currentPosition, observers;

        if (force) {
            sym.tlCached = undefined;
        }

        var tld = _getTimelineData(sym);
        if (!tld) {
            return null;
        }

        tld.duration = _getTimelineDuration(sym);

        if(tld.dirty && sym.tlCached) {
            currentPosition = sym.tlCached.currentPosition;
            observers = sym.tlCached.notifier.obs;
            sym.tlCached = undefined;
        }

        if (!sym.tlCached) {
            // Predeclare vars for JSHint
            var newO,
                val,
                defn = getTimelineDefn(sym),
                cnt,
                sdict = {},
                tdict = {},
                t,
                o,
                duration = tld.duration,
                sel,
                d,
                last,
                fullDuration,
                symData = sym.data[sym.name],
                i,
                ii,
                cmp,
                endTime,
                pt,
                index;

            cnt = tld.length;

            // Clean out any injected tweens
            for (ii = tld.length - 1; ii >= 0; ii--) {
                if (tld[ii][0] === 'injected') {
                    tld.splice(ii, 1);
                }
            }

            cnt = tld.length;
            if (typeof symData.timeline.duration !== 'number') {
                symData.timeline.duration = 0;
            }

            for (i = 0; i < cnt; i++) {
                o = tld[i];

                if (o && isTween(o)) {
                    sel = o[5];
                    if (!sdict[sel]) {
                        sdict[sel] = [];
                    }
                    sdict[sel].push(o);

                    t = sel + ":" + (o[1] === 'motion' ? 'location' : o[1]);
                    if (!tdict[t]) {
                        tdict[t] = [];
                    }
                    tdict[t].push(o);
                }
                if (o && isTween(o)) {
                    d = o[3] || 0;
                    duration = Math.max(duration, o[2] + d);
                }
            }
            fullDuration = Math.max(symData.timeline.duration, duration);

            cmp = function (a, b) {
                return a[2] - b[2];
            };
            for (t in tdict) {
                if (tdict.hasOwnProperty(t)) {
                    tdict[t].sort(cmp);
                }
            }

            for (t in tdict) {
                if (tdict.hasOwnProperty(t)) {
                    o = tdict[t][0];
                    if (o[2] > 0) {
                        val = getInitialValue(sym, o[5], o[1]);
                        if (val == null) {
                            val = o[6];
                        }

                        if (o[1] === "location") {
                            o = tdict[t][0];
                            pt = {
                                x: o[6][0][0],
                                y: o[6][0][1]
                            };
                            newO = createSimpleMotionPathData(o[5], pt, pt, 0, Math.max(0, o[2] - 1));
                            newO[0] = 'injected';
                            tld.push(newO);
                        } else if (val !== undefined) {
                            o = Edge.cloneJSONObject(tdict[t][0]);
                            o[6] = o[7] = val;
                            o[3] = o[2];
                            o[2] = 0;
                            o[0] = 'injected';
                            if(o[8] && o[8].valueTemplate != "" && typeof val == "string") {
                                //Template is already applied
                                o[8].valueTemplate = "";
                            }
                            tld.push(o);
                        }
                    }
                    last = tdict[t].length - 1;
                    if (last >= 0) {
                        o = tdict[t][last];
                        endTime = o[2] + o[3];
                        if (endTime < duration) {
                            if (o[1] === "location") {
                                index = o[6].length - 1;
                                pt = {
                                    x: o[6][index][0],
                                    y: o[6][index][1]
                                };
                                newO = createSimpleMotionPathData(o[5], pt, pt, endTime, fullDuration - endTime);
                                newO[0] ='injected';
                                tld.push(newO);
                            } else {
                                newO = Edge.cloneJSONObject(tdict[t][last]);
                                newO[6] = o[7];
                                newO[2] = fullDuration;
                                newO[3] = 0;
                                newO[0] = 'injected';
                                newO[8] = newO[8] || {};
                                newO[8].reverseOnly = true;
                                tld.push(newO);
                            }
                        }
                    }
                }
            }

            // Append a dummy tween if the declared timeline duration is greater than the final tween or trigger
            // This guarantees the complete event is fired at the right time
            if (duration < fullDuration) {
                o = ["injected", "-an_resting", duration, fullDuration - duration, "linear", "${Stage}", '0', '100' ];
                tld.push(o);
            }

            sym.tlCached = Timeline.createTL(tld, sym, {loop: defn.loop});
            if(tld.dirty) {
                sym.tlCached.currentPosition = currentPosition;
                sym.tlCached.notifier.obs = observers || sym.tlCached.notifier.obs;
            }
            sym.tlCached.sort();
        }
    }

    Symbol.bldTL = buildTimeline;
    function posToNum(sym, posInMsOrLabel) {
        if (typeof posInMsOrLabel === "string") {
            var s = sym.data ? sym.data[sym.name] : 0,
                tld = s ? s.timeline : 0;
            if (!tld || !tld.labels) {
                return 0;
            }
            return tld.labels[posInMsOrLabel];
        }
        return posInMsOrLabel;
    }
    Symbol.p2n = posToNum;

    // TOD - assess whether we keep performDefaultAction or change to preventDefault()
    function createEvent(sym, eventName, opts) {
        var e = { Symbol: sym, element: sym.ele, performDefaultAction: true };
        $.extend(e, opts);
        return e;
    }

    function lookup$(sym, sel) {
        var re = /^\$\{/;
        if (re.test(sel)) {
            sel = sel.replace(re, '');
            sel = sel.replace(/\}/, '');
            return sym.find$(sel);
        }
        return Edge.$(sel);
    }

    function applyBaseStyles(sym, $ele, baseStyles) {
        var propName;
        if ($ele && $ele[0]) {
            for (propName in Edge._.p) {
                if (Edge._.p.hasOwnProperty(propName)) {
                    if(propName == "width" || propName == "height") {
                        var val = $ele[0].style[propName];
                        //If width/height is already set on the instance, don't change it
                        if(val != null && val != "" && val != "auto") {
                            continue;
                        }
                    }

                    Edge._.p[propName].render($ele, baseStyles, sym.composition);
                }
            }
        }
    }

    function applyInstanceStyles(sym, styles) {
        var $ele,
            sel,
            propName;
        for (sel in styles) {
            if(sel == "${symbolSelector}") continue;

            if (styles.hasOwnProperty(sel)) {
                $ele = lookup$(sym, sel);
                if ($ele) {
                    for (propName in Edge._.p) {
                        if (Edge._.p.hasOwnProperty(propName)) {
                            Edge._.p[propName].render($ele, styles[sel], sym.composition);
                        }
                    }
                }
            }
        }
    }

    Edge.trimString = function (str) {
        return str.replace(/^\s+|\s+$/g, "");
    };

    function parseVariableName(str) {
        var varName = str,
            start,
            end;
        if (typeof str === "string" && str.search(/\$\{/) !== -1) {
            start = str.search(/\$\{/);
            end = str.search(/\}/);
            varName = str.slice(start + 2, end);
            //if (!varName)
            //    alert("Invalid variable name: " + varName);

            if (typeof varName === "string") {
                varName = Edge.trimString(varName);
                varName = varName.replace(/["']/g, "");
            }
        }
        return varName;
    }
    Symbol.parseVariableName = parseVariableName;

    /**
     Substitute variables into string
     @name substituteVariable
     @memberOf AdobeEdge.Symbol
     @function
     @param {string} s String to be substituted into - left unchanged. Tokens of form '${var}' will be substituted from entry for 'var' in variables
     @param {object}  variables Dictionary of substitution values
     @return {string} Substituted string
     */
    function substituteVariables(s, variables) {
        var str = s,
            varName;
        while (variables && typeof str === "string" && str.search(/\$\{/) !== -1) {
            varName = parseVariableName(str);

            if (variables[varName] === undefined) {
                //console.log("Animation variable ${" + varName + "} is undefined!");
                str = undefined;
            } else {
                /*jslint regexp: true */
                str = str.replace(/\$\{[^\}]*\}/, variables[varName]);
                /*jslint regexp: false */
            }
        }
        return str;
    }

    Symbol.substituteVariables = substituteVariables;

    $.extend(Symbol.prototype, {
        init: function (stg, cls) { // Overrides core
            var s = this.data[this.name],
                e,
                $stg = $(stg),
                id = $stg[0].id,
                sel;
            this.gpuAccelerate = s.gpuAccelerate;
            if (typeof(this.gpuAccelerate) === "undefined") {
                this.gpuAccelerate = true;
            }
            this.gpuAccelerate = this.gpuAccelerate && Edge.supported.cssTransform3d;

            this.variables = this.variables || {};
            this._variables = this._variables || {};
            stg = stg || $("." + cls)[0];
            this.autoPlay = s.timeline ? s.timeline.autoPlay : false;

            setSymbol(stg, this);
            this.ele = stg;
            if (stg) {
                if (!id || id === "") {
                    id = makeUniqueId("Stage");
                    $stg[0].id = id;
                }
                sel = "#" + id;
                this._variables[id] = this._variables["Stage"] = sel;
                this._variables["symbolStage"] = sel;
                this._variables["symbolSelector"] = sel;
                $stg.css("position", "absolute");
                $stg.css("z-index", "0");
            }
            if (s) {
                Edge.renderDOM(this.composition, this, s.content.dom, s.content.style, stg, cls);
                applyInstanceStyles(this, s.content.style);
            }
            e = createEvent(this, "creationComplete");
            this.notifyObservers("creationComplete", e);
        },
        lookupSelector: function (eleName) {
            if (typeof eleName !== "string") {
                return undefined;
            }
            try {
                return substituteVariables("${" + eleName + "}", this._variables);
            }
            catch (e) {

            }
        },
        getSymbolTypeName: function () {
            return this.name;
        },
        getComposition: function() {
            return this.composition;
        },
        find$: function (id) {
            var ids = id.split(" "), sel = this._variables[ids[0]], ele, tail, s;
            if (ids.length < 2 || !sel) {
                return sel ? Edge.$(sel) : null;
            }
            ele = Edge.$(sel);
            if (!ele || !ele.length) {
                return null;
            }
            ids.splice(0, 1);
            tail = ids.join(' ');
            s = getSymbol(ele);
            return s ? s.find$(tail) : undefined;
        },
        $: function (selector) {
            var ele = selector,
                $ele;
            if (typeof selector === 'string') {
                try {
                    if (selector.search(/\$\{/) === -1) {
                        ele = this.lookupSelector(selector);
                        if (typeof ele === "undefined") {
                            ele = selector;
                        }
                    }
                    else {
                        ele = substituteVariables(selector, this._variables);
                    }
                } catch (e) {

                }
            }
            if (ele === undefined) {
                ele = parseVariableName(selector);
            }
            return Edge.$(ele);
        },
        register: function (ele, obj, parentId) { // Overrides core
            var sel = registerId(this, obj.id, parentId);
            obj.oldId = obj.id;
            ele.id = sel;
        },
        seek: function(pos, opts) {
            buildTimeline(this);
            this.tlCached.seek(pos, opts);
        },
        play: function (pos, executeTriggers, playDirection) {
            buildTimeline(this);

            if (this.tlCached) {
                pos = posToNum(this, pos);
                var opts = {pos: pos, variables: this._variables, executeTriggers: executeTriggers, playDirection: playDirection};
                this.tlCached.play(opts);
            }
        },
        stop: function (ms, executeTriggers) {
            buildTimeline(this);
            if (this.tlCached) {
                ms = posToNum(this, ms);
                var opts = {pos: ms, variables: this._variables, executeTriggers: executeTriggers, bSeek: ms != undefined};
                this.tlCached.stop(opts);
            }
        },
        playReverse: function(pos, executeTriggers) {
            this.play(pos, executeTriggers, "reverse");
        },
        isPlaying: function () {
            var tl = this._getTimeline();
            return (tl && !!tl.playing);
        },
        isPlayDirectionReverse: function () {
            var tl = this._getTimeline();

            //if the timeline is not in the process of an update, report the last direction played
            if (tl && tl.currentDirection === "reverse") {
                return true;
            }

            return false;
        },
        //For backward compatibility
        getTimelinePosition: function() {
            return this.getPosition();
        },
        getPosition: function () {
            buildTimeline(this);
            if (this.tlCached) {
                return this.tlCached.getCurrentPosition();
            }
            return 0;
        },
        getDuration: function () {
            buildTimeline(this);
            if (this.tlCached) {
                return this.tlCached.getDuration();
            }

            return undefined;
        },
        getLabelPosition: function (label) {
            return posToNum(this, label);
        },
        // Called from authoring layer so needs to be available as method
        _getTimeline: function () {
            buildTimeline(this);
            return this.tlCached;
        },
        _rebuild: function () {
            buildTimeline(this, true);
        },
        getTimelineData: function() {
            return _getTimelineData(this);
        },
        //Deprecated - use getTimelineData instead. This will be removed in future
        getTLD: function () {
            return this.getTimelineData();
        },
        _applyBaseStyles: function($ele, name) {
            var s = this.data[name];
            if(s.content && s.content.style && s.content.style["${symbolSelector}"]) {
                applyBaseStyles(this, $ele, s.content.style["${symbolSelector}"]);
            }
        },
        getAutoPlay: function() {
            return this.autoPlay;
        },
        setAutoPlay: function(autoPlay) {
            this.autoPlay = autoPlay;
        }
    });

})(AdobeEdge);
// An.property-tween.js - version 0.2 - An Release 1.0
//
// Copyright (c) 2010. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//


(function (Edge) {
    "use strict";

// Builtin tween types handled by PropertyTween - other type requires a subclass that overloads setValue.
    var $ = Edge.$,
        tweenTypes = { style: 0, attribute: 1, property: 2 },
        isWebkit = 'webkitAppearance' in document.documentElement.style;

    Edge.trimString = function (str) {
        return str.replace(/^\s+|\s+$/g, "");
    };

    /**
     @name AdobeEdge.PropertyTween
     @class Animation for a single property on a set of elements.
     This class is designed to be extended. In particular, overriding setValue, getValue  will
     enable the animation of your own properties. Overriding  getElementSet or resolveElementSelector will permit
     application to arbitrary objects or object sets.
     Note that only the methods likely to be overridden by derived classes are documented.

     **/

    /**
     PropertyTween constructor
     @name PropertyTween
     @memberOf AdobeEdge.PropertyTween
     @function
     @param {string or ident} tweenType Type of tween as registered by addTweenType.
     @param {string, jQuery object, DOM element, or object}  elements The object or objects to be tweened. Strings will be $'d
     @param {string or ident} property Property, data member or attribute name
     @param {string, number or array} val Value to animate to
     @param {object} opts Additional tween-type specific options
     @return nothing
     */

    function PropertyTween(tweenType, property, elements, fromVal, val, opts) {
        Edge.Animation.call(this);

        this.name = "prop tween";
        this.elements = elements;
        this.sourceElements = elements;
        this.deferElementResolution = true;
        this.tweenType = tweenTypes[tweenType];
        this.updateTriggered = false;
        this.property = property;
        this.fromValue = fromVal;
        this.toValue = val;
        this.duration = 1000; // msecs
        this.valueTemplate = null;
        this.tokens = null;
        this.fromValues = null;

        if (opts) {
            $.extend(this, opts);
        }

        // We need to force a deferred resolution of our element set
        // if we were given a selector that contains a placeholder
        // reference.

        /*jslint regexp: true */
        this.deferElementResolution = this.deferElementResolution || (typeof elements === "string" && elements.search(/\$\{[^\{\}]+\}/) !== -1);
        /*jslint regexp: false */

        if (!this.deferElementResolution) {
            this.elements = this.resolveElementSelector(elements);
        }

        // Convert all "to" values specified into an array of objects
        // that specify the value and unit to drive to.
        // TODO - move all the value setting to setupForAnimation

        var values = this.toValues = [],
            valueArray = this.parseValue(val),
            i,
            v,
            len,
            o,
            fvs,
            parsedValues,
            f;

        if (!$.isArray(val)) {
            val = [ val ];
        }

        if (!valueArray || valueArray.length === 0) {
            valueArray = val;
        }

        len = valueArray.length;
        for (i = 0; i < len; i += 1) {
            v = valueArray[i];
            if (Edge.props[property]) {
                v = Edge.props[property].units(v);
            }
            o = {};
            if (typeof v === 'string') {
                o.value = parseFloat(v.replace(/[a-zA-Z%]+$/, ""));
                o.unit = v.replace(/^-?[0-9]*(\.[0-9]+)?/, "");
                if (isNaN(o.value)) {
                    o.value = v;
                    o.unit = "";
                }
            } else {
                if (typeof v === 'number') {
                    v = parseFloat(v);
                }
                o.value = v;
                o.unit = "";
            }
            values.push(o);
        }

        if (this.fromValue != null) {
            fvs = this.fromValues = [];

            parsedValues = this.parseValue(this.fromValue);
            if (parsedValues && parsedValues.length > 0) {
                this.fromValue = parsedValues;
            } else if (!$.isArray(this.fromValue)) {
                // If any "from" values were specified and we could not parse them, convert them into an
                // array of numeric values.
                this.fromValue = [ this.fromValue ];
            }

            len = this.fromValue.length;
            for (i = 0; i < len; i += 1) {
                v = this.fromValue[i];
                if (typeof v === 'string') {
                    fvs[i] = parseFloat(v.replace(/[a-zA-Z%]+$/, ""));
                    if (isNaN(fvs[i])) {
                        fvs[i] = v;
                    }
                } else {
                    if (typeof v === 'number') {
                        v = parseFloat(v);
                    }
                    fvs[i] = v;
                }
            }

            //if (this.toValues.length != this.fromValues.length)
            //    alert("Number of 'from' and 'to' values does not match for " + this.tweenType + " tween.");
        }

        // Make sure filter is an array and convert strings to functions
        // TODO - consider whether we should support parameterized filters and valueTemplates - if so move them to setupForAnimation
        if (this.filter) {
            if (!$.isArray(this.filter)) {
                this.filter = [ this.filter ];
            }
            f = this.filter;
            len = f.length;
            for (i = 0; i < len; i += 1) {
                if (typeof f[i] === 'string') {
                    f[i] = Math[f[i]];
                }
                if (typeof f[i] !== 'function') {
                    f[i] = null;
                }
            }
        }


        if (this.valueTemplate) {
            this.tokens = this.parseTemplate(this.valueTemplate);
        }
    }


    PropertyTween.Token = function (value, isPlaceholder) {
        this.value = value;
        this.isPlaceholder = isPlaceholder;
    };

    PropertyTween.parseVariableName = function (str) {
        var varName = str,
            start,
            end;
        if (typeof str === "string" && str.search(/\$\{/) !== -1) {
            start = str.search(/\$\{/);
            end = str.search(/\}/);
            varName = str.slice(start + 2, end);
            //if (!varName)
            //    alert("Invalid variable name: " + varName);

            if (typeof varName === "string") {
                varName = Edge.trimString(varName);
                varName = varName.replace(/["']/g, "");
            }
        }
        return varName;
    };

    /**
     Substitute variables into string
     @name substituteVariable
     @memberOf AdobeEdge.PropertyTween
     @function
     @param {string} s String to be substituted into - left unchanged. Tokens of form '${var}' will be substituted from entry for 'var' in variables
     @param {object}  variables Dictionary of substitution values
     @return {string} Substituted string
     */
    PropertyTween.substituteVariables = function (s, variables) {
        var str = s,
            varName;
        while (variables && typeof str === "string" && str.search(/\$\{/) !== -1) {
            varName = PropertyTween.parseVariableName(str);

            if (variables[varName] === undefined) {
                //console.log("Animation variable ${" + varName + "} is undefined!");
                str = undefined;
            } else {
                /*jslint regexp: true */
                str = str.replace(/\$\{[^\}]*\}/, variables[varName]);
                /*jslint regexp: false */
            }
        }
        return str;
    };

    $.extend(PropertyTween.prototype, Edge.Animation.prototype);
    $.extend(PropertyTween.prototype, {
        constructor: PropertyTween,

        setup: function (timeline) {
            this.updateTriggered = false;
            this.timeline = timeline;
            this.animData = undefined;
        },

        update: function (elapsed, easingConst) {
            var elements = this.getElementSet(),
                tween = this,
                tt = this.tweenType,
                prop = this.property,
                i;

            if (!this.updateTriggered) {
                this.updateTriggered = true;
                this.setupForAnimation();
            }

            elements.each(function (index, ele) {
                // We only want to tween if the property data has a
                // matching animation id. If the ids don't match, that
                // means another animation has started which is modifying
                // this same property.

                var td = tween.getPropertyTweenData(ele, tt, prop),
                    fvs,
                    tvs,
                    tkns,
                    filters,
                    cnt,
                    results,
                    f,
                    v,
                    t,
                    val,
                    formattedValue,
                    tlen,
                    a,
                    o;

                if (td.animationID !== tween.animationID) {
                    return;
                }

                fvs = td.fromValues;
                tvs = td.toValues;
                tkns = td.tokens;
                filters = tween.filter;

                cnt = fvs.length;
                results = [];

                for (i = 0; i < cnt; i += 1) {
                    f = fvs[i];
                    t = tvs[i];

                    if (typeof f === "string") {
                        v = (easingConst === 0 && tween.duration > 0) ? f : t.value;
                    } else {
                        v = (f + ((t.value - f) * easingConst));
                    }
                    if (filters && filters[i]) {
                        v = filters[i](v, tween, this, prop, t.unit, elapsed);
                    }
                    if (typeof v === "number" && v < 1) {
                        // protect against exponential notation
                        v = v.toFixed(6);
                    }
                    results.push(v + t.unit);
                }

                val = "";

                formattedValue = tween.formatValue(results);

                if (formattedValue.length > 0) {
                    val = formattedValue;
                } else if (tkns) {
                    tlen = tkns.length;
                    a = [];
                    for (i = 0; i < tlen; i += 1) {
                        o = tkns[i];
                        if (o.isPlaceholder) {
                            a.push(results[o.value]);
                        } else {
                            a.push(o.value);
                        }
                    }

                    val = a.join("");
                } else {
                    val = results.join("");
                }

                //console.log(this.id + ": " + prop + " = " + val);
                tween.setValue.call(this, tt, prop, val);
                tween.notifyObservers("onUpdate", { elapsed: elapsed, easingConst: easingConst, property: prop, value: val, element: this });
            });

        },
        /**
         Set a value for a property on an animated object. Override this method for a custom property
         @name setValue
         @memberOf AdobeEdge.PropertyTween
         @function
         @param (animated object) this Note that setValue is called for each animated object/property pair
         @param {integer} tt Type of tween. Undefined for tweenTypes not defined in the tweenTypes object
         @param {string}  prop The name of the property
         @param {any} val New value. Type depends on what the animated property is
         @return nothing
         */
        setValue: function (tt, prop, val) {
            switch (tt) {
            case 0:
                var $this = $(this);
                $this.css(prop, val);
                if( isWebkit && prop === 'background-size' ) {
                    $this.css('-webkit-background-size', val);
                }
                else if (prop === "display" && (this.nodeName == "AUDIO")) {
                    $this.attr("controls", val === "none" ? null : "controls");
                }
                break;
            case 1:
                this.setAttribute(prop, val);
                break;
            case 2:
                this[prop] = val;
                break;
            }
        },

        getDuration: function () {
            return this.duration;
        },

        /**
         Resolve the tween's selector (this.elements) to the set of objects to be animated by this tween.
         Override this method to use a custom lookup method.
         @name resolveElementSelector
         @memberOf AdobeEdge.PropertyTween
         @function
         @return {jQuery object} jQuery object containing the actual objects or DOM elements
         */
        resolveElementSelector: function () {
            var ele = PropertyTween.substituteVariables(this.elements, this.timeline.variables);
            if (!ele) {
                ele = this.elements;
            }
            if (/^\$\{/.test(ele)) {
                ele = "bad_selector";
            }
            return $(ele);
        },

        getElementSet: function () {
            // The actual set of elements each tween operates on is cached in the
            // timeline. This is done because the
            // same timeline can be invoked with different variables that change
            // what each animation operates on.

            var id = this.animationID,
                animData;

            this.timeline.animData = this.timeline.animData || {};

            animData = this.timeline.animData[id];
            if (!animData) {
                animData = this.timeline.animData[id] = this.deferElementResolution ? this.resolveElementSelector() : this.elements;
            }

            return animData;
        },

        /**
         Get the current value for a property on an animated object. Note that this is called with this set to the
         animated object, not a PropertyTween. Override this method for a custom property
         @name getValue
         @memberOf AdobeEdge.PropertyTween
         @function
         @param (animated object) this Note that getValue is called for each animated object/property pair
         @param {string}  prop The name of the property
         @param {integer} tt Type of tween. Undefined for tweenTypes not defined in the tweenTypes object
         @return {any} val Current value. Type depends on what the animated property is
         */
        getValue: function (prop, tt) {
            var fv;
            switch (tt) {
            case 0:
                fv = $(this).css(prop);
                break;
            case 1:
                fv = this.getAttribute(prop);
                break;
            case 2:
                fv = String(this[prop]);
                break;
            }
            return fv;
        },
        setupForAnimation: function () {
            // This function needs to get called just before the tween starts
            // to make sure we don't disable other tween animations that run
            // before this one.

            var tween = this,
                tt = this.tweenType,
                prop = this.property,
                elements = this.getElementSet();
            elements.each(function (index, ele) {
                var d = tween.getPropertyTweenData(ele, tt, prop),
                    fv,
                    fromValues,
                    fvs,
                    fromLen,
                    i,
                    v;
                d.animationID = tween.animationID;
                d.toValues = tween.toValues;
                d.tokens = tween.tokens;

                // There's a big assumption being made here, which is that
                // if there is a valueTemplate in use, which is the only case
                // where we can have multiple toValues, the tween fromValues
                // property will be non-null.

                // The above comment is not true for color tweens anymore.
                // They are not templated values but they do have an array of values.

                if (tween.fromValues) {
                    d.fromValues = tween.fromValues;
                } else {
                    fv = tween.getValue.call(this, prop, tt);
                    if (fv === undefined) {
                        fv = "0";
                    }

                    fromValues = tween.parseValue(fv);

                    if (fromValues && fromValues.length > 0) {
                        fvs = d.fromValues = [];

                        fromLen = fromValues.length;
                        for (i = 0; i < fromLen; i += 1) {
                            v = fromValues[i];
                            if (typeof v === 'string') {
                                fvs[i] = parseFloat(v.replace(/[a-zA-Z%]+$/, ""));
                            } else {
                                fvs[i] = v; // hope it's a number
                            }
                            if (isNaN(fvs[i])) {
                                fvs[i] = v;
                            }
                        }
                    } else {
                        d.fromValues = [ parseFloat(fv.replace(/[a-zA-Z%]+$/, "")) ];
                    }

                }
            });
        },

        parseTemplate: function (templateStr) {
            var tlen = templateStr.length,
                results = [],
                startIndex = 0,
                re = /@@[0-9]+@@/g,
                m = null;
            if (startIndex < tlen) {
                m = re.exec(templateStr);
            }
            while (m) {
                if (m.index !== startIndex) {
                    results.push(new PropertyTween.Token(templateStr.substring(startIndex, m.index), false));
                }
                results.push(new PropertyTween.Token(parseInt(m[0].replace(/@@/g, ""), 10), true));
                startIndex = re.lastIndex;
                m = null;
                if (startIndex < tlen) {
                    m = re.exec(templateStr);
                }
            }

            if (startIndex < tlen) {
                results.push(new PropertyTween.Token(templateStr.substring(startIndex, tlen), false));
            }

            return results;
        },
        /**
         Parse the from and to values into an array of values. Override this function to provide custom
         formats. When overriding this method, the formatValue method should also be implemented.
         @name parseValue
         @memberOf AdobeEdge.PropertyTween
         @function
         @param {val}  prop value The value of the property
         @return {Array} Array of values for a property.
         */
        parseValue: function (val) {
            return [];
        },
        /**
         Format the given array of values into a string that can be used as a css property value. Invoked
         by update to get the formatted string value. Used in conjunction with parseValue.
         @name formatValue
         @memberOf AdobeEdge.PropertyTween
         @function
         @param {values}  Array of values of a property.
         @return {string} Formatted string value.
         */
        formatValue: function (values) {
            return "";
        },
        getPropertyTweenData: function (ele, tweenType, propertyName) {
            // The data for a tween is stored on each element, with a key
            // of "tweenData". The stored data is actually a dictionary
            // of dictionaries, where the outer dictionary is indexed by
            // tween type, and the dictionary for that type uses property
            // names as the index/key. The structure of the data stored
            // for each property is as follows:
            //
            //        tweenData = {
            //            style: {
            //                opacity: {
            //                    animationID: <animation/tween id>,
            //                    fromValues: [ ... ],
            //                    toValues: [ ... ],
            //                    tokens: [ ... ]
            //                }
            //            },
            //
            //            attribute: {
            //                // Data for attribute tweens are stored in this
            //                // dictionary. Like the style example above, the key
            //                // is the attribute name, and the value is an object
            //                // exactly like the one used in the style case above.
            //            },
            //
            //            property: {
            //                // Data for property tweens are stored in this
            //                // dictionary. Like the style example above, the key
            //                // is the property name, and the value is an object
            //                // exactly like the one used in the style case above.
            //            }
            //        }

            var td = Edge.$.data(ele, "tweenData"),
                tt,
                data;
            if (!td) {
                td = {};
                Edge.$.data(ele, "tweenData", td);
            }

            tt = td[tweenType];
            if (!tt) {
                tt = td[tweenType] = {};
            }

            data = tt[propertyName];
            if (!data) {
                data = tt[propertyName] = { animationID: -1 };
            }
            return data;
        }
    });

    Edge.PropertyTween = PropertyTween;

    Edge.Timeline.addTweenType("style", function (prop, ele, fromVal, toVal, opts) {
        return new PropertyTween("style", prop, ele, fromVal, toVal, opts);
    });
    AdobeEdge.Timeline.addTweenType("attribute", function (prop, ele, fromVal, toVal, opts) {
        return new PropertyTween("attribute", prop, ele, fromVal, toVal, opts);
    });
    AdobeEdge.Timeline.addTweenType("property", function (prop, ele, fromVal, toVal, opts) {
        return new PropertyTween("property", prop, ele, fromVal, toVal, opts);
    });

    Edge.Timeline.addTweenProperty("volume", "property");
})(AdobeEdge);
(function(Edge){


    // Note: all functions or vars prefixed by '_' are to be considered to be non-public and should be only accessed
    // by the defining 'class' and its derived 'classes'.

    "use strict";

    var $ = Edge.$,/** @name UpdateFinalizer
     @description Register a set of handlers added by tweens (or other objects) during an update to be called when a timeline
     update is final. At the conclusion of the     update, all handlers are removed.
     When the timeline is complete, this UpdateFinalizer is removed.

     */

    UpdateFinalizer = function(timeline){
        this.handlers = {};
        this.timeline = timeline;
    };

    UpdateFinalizer.Register = function(timeline, id, handlerObject){
        var finalizer = timeline.updateFinalizer;
        if(typeof finalizer === 'undefined'){
            finalizer = new UpdateFinalizer(timeline);
            timeline.updateFinalizer = finalizer;
            timeline.addObserver(finalizer);
        }
        finalizer.handlers[id] = handlerObject;
    };

    UpdateFinalizer.unRegister = function(timeline, id){
        var finalizer = timeline.updateFinalizer;
        if(typeof finalizer !== 'undefined') {
            delete finalizer.handlers[id];
		}
    };

    $.extend(UpdateFinalizer.prototype, {
        _finalizeUpdate : function(elapsed, context){
            var data = {elapsed:elapsed, context:context};
            var methodName = "onFinalUpdate";
            var h;
            for(h in this.handlers){
                if(this.handlers.hasOwnProperty(h)){
                    var obj = this.handlers[h];
                    // Note that we call the handler function with 'this' set to the handler object
                    if (obj[methodName])
                        obj[methodName](data);
                }
            }

			// TBD: Jim to review and potentially solve differently
			// does it matter that we don't call delete on each handler?
			// prevent a handlers leak
			this.handlers = {};
        },
        // Called by timeline notifyObservers
        postUpdate: function(tween, data){
            this._finalizeUpdate(data.elapsed, data.context);
        },
        // Called by timeline notifyObservers
        complete: function(data){
            if(this.timeline) {
                this.timeline.removeObserver(this);
			}
            this.timeline.updateFinalizer = undefined;
        }
        /*,
        applyTransform : function(updateData){
            // Note that this is called with 'this' set to the handler object
            var data = Edge.$.data(this.element, TransformTween.dataName);
            if ( data && updateData ) {
                TransformTween.applyTransform( this.element, data, data.tween, updateData.context );
            }
        }
        */

    });

    Edge.UpdateFinalizer = UpdateFinalizer;
})(AdobeEdge);
/**
 * Adobe Edge Animate - Symbol Trigger and Event Support
 */

// Copyright (c) 2013. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/*jslint plusplus:true, nomen: true, browser: true */
/*global window: false, document: false, CustomEvent: false, HTMLElement: false, console:false, alert: false, indent: false  */
/*properties EdgeAn, $, Symbol, makeId, triggerDict, _, variableValue, originalEvent, methodName, composition, extend,
 createEvent, initEvent, _getTimeline, addObserver, timeline, symbol, length, type, getComposition, compId, bindings,
 data, name, actions, sym, getSymbols, newSymbol, bindElementAction, bindTimelineAction, bindTriggerAction,
 bindSymbolAction, bindVariableAction, AnListeners, bind, EdgeAn$, find$, element, each, creationComplete, An$,
  eSA, executeSymbolAction*/
/*properties CustomEvent, bubbles, cancelable, dispatchEvent, Event, concat,
 console, log, prototype, slice, call, unshift, apply,
 test, splice, push, addEventListener, removeEventListener */
(function (Edge) {

    "use strict";

    var An = window.EdgeAn,
        $ = Edge.$,
        Symbol = Edge.Symbol,
        makeId = Edge.Symbol._makeUniqueID,
        triggerDict = Edge.triggerDict = {
            // These are intended to be called with 'this' being a symbol
            "timeline": function (actionFunc, unused, triggerEvent) { // , triggerData
                if (actionFunc) {
                    var tlProxy = {},
                        tl = this._getTimeline();

                    tlProxy[triggerEvent] = actionFunc;

                    tl.addObserver(tlProxy);
                }
            },
            // TODO supporting stuff for these not implemented yet
            // also, change order of tfunc params
            "element": function (actionFunc, selector, triggerEvent) {
                if (actionFunc) {
                    if (selector === "document") {
                        $(document).bind(triggerEvent, actionFunc);
                    } else if (selector === "window") {
                        $(window).bind(triggerEvent, actionFunc);
                    } else {
                        var re = /^\$\{/;
                        if (re.test(selector)) {
                            selector = selector.replace(re, '');
                            selector = selector.replace(/\}/, '');
                        }
                        var $ele = this.find$(selector);
                        if(!$ele) {
                            //Discard the binding right now, but continue processing
                            //console.log("Error: Couldn't find the element: " + selector);
                            return;
                        }
                        $ele.bind(triggerEvent, actionFunc);
                    }
                }
            },
            "symbol": function (actionFunc, unused, triggerEvent) { //, triggerData
                if (actionFunc) {
                    var symProxy = {};
                    symProxy[triggerEvent] = actionFunc;
                    this.addObserver(symProxy);
                }
            }
        },
        binderObserver,
        newSymbolObserver;

    // We're only on modern browsers (IE9 and above)
    // So DOM3 events are available.
    $.Event = function (evtName) {
        if (Edge.supported.customEvent) {
            return new CustomEvent(evtName, {bubbles: true, cancelable: true});
        }
        // Fallback for no CustomEvent support
        var e = document.createEvent('Event');
        e.initEvent(evtName, true, true);
        return e;
    };

    $.event = {};
    $.event.special = {};

    function bind(ele, eventName, listener) {
        var special = $.event.special[eventName];
        if (special && special.setup) {
            special.setup.call(ele, eventName, listener);
        }

        if(ele.addEventListener) ele.addEventListener(eventName, listener);
        else if(ele.attachEvent) ele.attachEvent(eventName, listener);

        var listeners = ele.AnListeners = ele.AnListeners || {};
        listeners[eventName] = listeners[eventName] || [];
        listeners[eventName].push(listener);
    }

    function unbind(ele, eventName, listener) {
        var special = $.event.special[eventName];
        if (special && special.teardown) {
            special.teardown.call(ele, eventName, listener);
        }

        var listeners = ele.AnListeners = ele.AnListeners || {},
            rememberedListener,
            i;
        rememberedListener = listeners[eventName] = listeners[eventName] || [];

        if(listener != null) {
            if(ele.removeEventListener) ele.removeEventListener(eventName, listener);
            else if(ele.detachEvent) ele.detachEvent(eventName, listener);

            for (i = listeners.length - 1; i >= 0; i--) {
                if (rememberedListener[i] === listener) {
                    listeners.splice(i, 1);
                }
            }
        } else if(eventName) {
            listeners[eventName].forEach(function(l) {
                if(ele.removeEventListener) ele.removeEventListener(eventName, l);
                else if(ele.detachEvent) ele.detachEvent(eventName, l);
            });
            listeners[eventName] = [];
        }
    }

    $.extend(Edge.An$.prototype, {
        bind: function (eventName, listener) {
            this.each(function (index, ele) {
                bind(ele, eventName, listener);
            });
            return this;
        },
        unbind: function (eventName, listener) {
            this.each(function (index, ele) {
                unbind(ele, eventName, listener);
            });
            return this;
        },
        trigger: function(evt) {
            var $this = document;
            if(this[0]) $this = this[0];
            $this.dispatchEvent(evt);
            return this;
        }
    });

    function _getActionCallbackFunc(sym, eventType, selectorOrTL, funcName) {
        var f = sym[funcName[0]],
            ff;

        function dispatchError(args) {

            if (args.length >= 2 && typeof args[0] === 'object' && typeof args[1] === 'object' && args[1].type !== 'onError') {
                var evt;
                evt = $.Event("onError");
                if (sym) {
                    evt.compId = sym.getComposition().compId;
                }
                evt.originalEvent = args[1];
                document.dispatchEvent(evt);
            }
            window.console.log("Javascript error in event handler! Event Type = " + eventType);
        }

        if (typeof f === "function") {
            if (eventType === 'element') {

                ff = function () {
                    var args;
                    args = Array.prototype.slice.call(arguments);
                    args.unshift(sym);
                    if (args.length >= 2 && typeof args[0] === 'object' && typeof args[1] === 'object' && args[1].type === 'compositionReady') {
                        // This is a hack but need a fix for multiple compositionReady messages when there are multiple comps in a page
                        // and today is last day of Preview 6 fixes
                        if (typeof args[1].compId === 'string' && typeof args[0].composition === 'object' && args[1].compId !== args[0].composition.id) {
                            return null;
                        }
                    }
                    try {
                        return f.apply(sym, args);
                    } catch (err) {
                        dispatchError(args);
                        return undefined;
                    }
                };
            } else if (eventType === 'timeline') {
                ff = function (tl, data) {
                    var args,
                        e;
                    if (data && data.methodName && /^trig_/.test(data.methodName)) {
                        // Triggers fire custom timeline events
                        e = $.Event("trigger");
                    } else {
                        e = $.Event(eventType);
                    }
                    if (data) {
                        $.extend(e, data);
                    }
                    e.timeline = tl;
                    args = Array.prototype.slice.call(arguments);
                    args.splice(0, 0, e);
                    args.unshift(sym);
                    try {
                        return f.apply(sym, args);
                    } catch (err) {
                        dispatchError(args);
                        return undefined;
                    }
                };
            } else if (eventType === 'symbol') {
                ff = function (sym, data) {
                    var args,
                        e,
                        variableValue;
                    if (data && data.methodName) {
                        e = $.Event(data.methodName);
                    } else {
                        e = $.Event(eventType);
                    }

                    if (data) {
                        $.extend(e, data);
                        if (data.variableValue) {
                            variableValue = data.variableValue;
                        }
                    }

                    args = Array.prototype.slice.call(arguments);
                    args.splice(0, 0, e, variableValue);
                    args.unshift(sym);
                    try {
                        return f.apply(sym, args);
                    } catch (err) {
                        dispatchError(args);
                        return undefined;
                    }
                };
            }
            return ff;
        }
        return null;
    }

    function _addBindingFromData(sym, bd) {
        var td = bd[0],
            tfunc = triggerDict[td[0]],
            afunc;
        /*if (td[0] === 'element') {
         var newEle = substituteVariables(td[1], sym.variableValues);
         if (newEle !== td[1]) {
         td = Edge.cloneJSONObject(td);
         td[1] = newEle;
         }
         }*/
        if (tfunc) {
            afunc = _getActionCallbackFunc(sym, td[0], td[1], bd.slice(1));
            if (afunc) {
                tfunc.apply(sym, [afunc].concat(td.slice(1)));
            }
        }
    }

    function _addBindingsFromData(sym, bindingData) {
        bindingData = bindingData || sym.data[sym.name].bindings || [];
        var cnt = bindingData.length,
            i,
            bd;
        for (i = 0; i < cnt; i++) {
            bd = bindingData[i];
            _addBindingFromData(sym, bd);
        }
    }

    function _addActionsFromData(sym, actionData) {
        actionData = actionData || sym.data[sym.name].actions || {};
        $.extend(sym, actionData); // this puts the actions right on object - this makes aSymbol.anAction() work and you can use 'this'
        // maybe putting it in Symbol.actions would be better to prevent collisions, then setting a member variable of actions to point to the Symbol
    }

    function binderCallback(sym, data) {
        _addActionsFromData(sym);
        _addBindingsFromData(sym);
    }

    binderObserver = {'creationComplete': binderCallback};

    function newSymbolCallback(comp, data) {
        var sym = data.symbol;
        sym.addObserver(binderObserver);
    }
    newSymbolObserver = {'newSymbol': newSymbolCallback};

    function bindHelper(compId, symbolName, elementOrTimelineSelector, eventName, eventFunction, bindType) {
        var symbolDefn = Edge.getComposition(compId).sym[symbolName],
            name = makeId("binding"),
            bd = [
                [bindType, elementOrTimelineSelector, eventName],
                name
            ],
            theComp,
            aSymbolInstances,
            instLen,
            symbolInstance,
            i,
            currSymName,
            actions;

        if(!symbolDefn)
            return;

        symbolDefn.actions = symbolDefn.actions || {};
        symbolDefn.actions[name] = eventFunction;
        symbolDefn.bindings = symbolDefn.bindings || [];

        symbolDefn.bindings.push(bd);

        //patch any existing symbols

        theComp = Edge.getComposition(compId);
        if (!theComp) {
            return;
        }

        theComp.addObserver(newSymbolObserver);

        aSymbolInstances = theComp.getSymbols();
        if (aSymbolInstances) {
            instLen = aSymbolInstances.length;

            for (i = 0; i < instLen; i++) {
                symbolInstance = aSymbolInstances[i];
                currSymName = symbolInstance.name;
                if (symbolName === currSymName) {
                    actions = {};
                    actions[name] = eventFunction;
                    _addActionsFromData(symbolInstance, actions);
                    _addBindingFromData(symbolInstance, bd);
                }
            }
        }
    }

    Symbol.bindElementAction = function (compId, symbolName, elementSelector, eventName, eventFunction) {
        bindHelper(compId, symbolName, elementSelector, eventName, eventFunction, 'element');
    };

    Symbol.bindTimelineAction = function (compId, symbolName, unused, eventName, eventFunction) {
        bindHelper(compId, symbolName, unused, eventName, eventFunction, 'timeline');
    };

    Symbol.bindTriggerAction = function (compId, symbolName, unused, delay, triggerFunction) {
        var symbolDef = Edge.getComposition(compId).sym[symbolName],
            tl,
            customEventName,
            tlod;
        if (!symbolDef) {
            //Edge.logError( "$.Edge.Symbol.bindTriggerAction: symbol not found" );
            return;
        }

        tl = symbolDef.timeline ? symbolDef.timeline.data : null;

        if (!tl) {
            //Edge.logError( "$.Edge.Symbol.bindTriggerAction: timeline not found" );
            return;
        }

        customEventName = makeId("trig");
        tlod = [ customEventName, 'trigger', delay, customEventName];
        tl.push(tlod);
        //Mark timeline as dirty
        tl.dirty = true;
        bindHelper(compId, symbolName, unused, customEventName, triggerFunction, 'timeline');
        //Timeline rebuilt for all instances, now mark it as not dirty
        tl.dirty = false;
    };

    Symbol.bindSymbolAction = function (compId, symbolName, eventName, eventFunction) {
        bindHelper(compId, symbolName, "", eventName, eventFunction, 'symbol');
    };

    Symbol.bindVariableAction = function (compId, symbolName, varName, eventFunction) {
        var eventName = "variableChanged:" + varName;
        bindHelper(compId, symbolName, "", eventName, eventFunction, 'symbol');
    };
    /*
     Symbol.bindVariableActionToSymbol = function (sym, varName, actionFunc) {
     var symbolInstance = Symbol.getSymbol(sym);
     if (!symbolInstance) {
     return;
     }

     varName = Symbol._parseVariableName(varName);

     var eventName = "variableChanged:" + varName;
     var name = Symbol._makeUniqueID();

     var bd = [
     ["symbol", "", eventName],
     name
     ];

     var aActions = {};
     aActions[name] = actionFunc;
     _addActionsFromData.call(symbolInstance, aActions);
     _addBindingFromData.call(symbolInstance, bd);
     };
     */
    $.extend(Symbol.prototype, {
        executeSymbolAction: function (e, data) {
            if (typeof data !== "object" || data.length < 3) {
                return;
            }
            // symInstanceSelector is data[1],
            var actionFunction = data[0],
                $ele = this.$(data[1]),
                args = data[2],
                symInstance;

            if (!$ele || $ele.length < 1) {
                return;
            }
            symInstance = Symbol.getSymbol($ele[0]);
            if (!symInstance || !actionFunction) {
                return;
            }

            if (!args || typeof args !== "object") {
                args = null;
            }

            symInstance[actionFunction].apply(symInstance, args);
        },
        //Alias for _executeSymbolAction used when writing minified content
        eSA: function (e, data) {
            this.executeSymbolAction(e, data);
        }
    });

})(AdobeEdge);
/*
* Based on http://jquerymobile.com
*
* Copyright 2010, 2013 jQuery Foundation, Inc. and other contributors
* Released under the MIT license.
* http://jquery.org/license
*
*/

//Copyright (c) 2011-2014. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
//

(function( Edge, window, undefined ) {
	"use strict";

	if(!document.createEvent) return;

    Edge.addTouchSupport = function() {
        var $ = Edge.$;
        var An$ = Edge.An$;

        $.fn = $.fn || {};

        // add new event shortcuts
        $.each(("touchstart touchmove touchend " +
            "swipe swipeleft swiperight " ).split( " " ), function(i, name) {
            An$.prototype[name] = $.fn[ name ] = function( fn ) {
                return fn ? this.bind( name, fn ) : this.trigger( name );
            };

            // jQuery < 1.8
            if ( $.attrFn ) {
                $.attrFn[ name ] = true;
            }
        });

        var supportTouch = "ontouchend" in document; // $.mobile.support.touch,
            var msTouch = !supportTouch && window.navigator.msPointerEnabled;
            var touchStartEvent = supportTouch ? "touchstart" : "mousedown",
            touchStopEvent = supportTouch ? "touchend" : "mouseup",
            touchMoveEvent = supportTouch ? "touchmove" : "mousemove";

        // also handles swipeleft, swiperight
        $.event.special.swipe = {
            scrollSupressionThreshold: 30, // More than this horizontal displacement, and we will suppress scrolling.
            durationThreshold: 1000, // More time than this, and it isn't a swipe.
            horizontalDistanceThreshold: 30,  // Swipe horizontal displacement must be more than this.
            verticalDistanceThreshold: 75,  // Swipe vertical displacement must be less than this.

            swipeEvent: $.Event("swipe"),
            swipeLeftEvent: $.Event("swipeleft"),
            swipeRightEvent: $.Event("swiperight"),

            setup: function() {
                if(this.setupDone) {
                    return;
                }

                var thisObject = this,
                    $this = $( thisObject );

                if(msTouch) {
                    $this.css("-ms-touch-action", "pan-y pinch-zoom double-tap-zoom");
                }
                $this.bind( touchStartEvent, function( event ) {
                    var data = event.touches ? event.touches[0] : (event.originalEvent.touches ? event.originalEvent.touches[0] : event),
                        start = {
                            time: ( new Date() ).getTime(),
                            coords: [ data.pageX, data.pageY ],
                            origin: $( event.target )
                        },
                        stop;

                    function moveStopHandler (event) {
                        $this.unbind( touchStopEvent, moveStopHandler );
                        $this.unbind( touchMoveEvent, moveHandler );

                        if ( start && stop ) {
                            if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
                                Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
                                Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {

                                $this.trigger( $.event.special.swipe.swipeEvent )
                                    .trigger( start.coords[0] > stop.coords[ 0 ] ? $.event.special.swipe.swipeLeftEvent : $.event.special.swipe.swipeRightEvent );
                            }
                        }
                        start = stop = undefined;
                    }

                    function moveHandler( event ) {
                        if ( !start ) {
                            return;
                        }

                        var data = event.touches ? event.touches[0] : (event.originalEvent.touches ? event.originalEvent.touches[0] : event);

                        stop = {
                            time: (new Date()).getTime(),
                            coords: [data.pageX, data.pageY]
                        };

                        // prevent scrolling
                        if ( Math.abs(start.coords[0] - stop.coords[0] ) > $.event.special.swipe.scrollSupressionThreshold ) {
                            event.preventDefault();
                        }
                    }

                    $this.bind(touchMoveEvent, moveHandler).bind(touchStopEvent, moveStopHandler);
                });

                this.setupDone = true;
            }
        };
        $.each({
            swipeleft: "swipe",
            swiperight: "swipe"
        }, function( event, sourceEvent ) {
            $.event.special[ event ] = {
                setup: function() {
                    $( this ).bind( sourceEvent, $.noop );
                },
                teardown: function(ele, eventName, listener) {
                    $( ele ).unbind( sourceEvent );
                }
            };
        });
    }
})(AdobeEdge, window);
/// an.subproperty-tween.js - version 0.2 - An Release 1.0
//
// Copyright (c) 2011-2014. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/***
 @name SubpropertyTween
 @class Defines a complex tween that can animate the multiple sub-properties of a complex CSS property.
 This defines a tween type of "subproperty' which can parse multiple properties with multiple types.
 It also extends the framework's Property setting for constructed dom elements for the supported subproperties.
 */

(function (Edge) {
	"use strict";

    var $ = Edge.$,
            PropertyTween = Edge.PropertyTween,
            UpdateFinalizer = Edge.UpdateFinalizer,
            subprop;

    var propTemplates = {
        'box-shadow': {
            def: 'box-shadow',
            '-webkit-box-shadow': "boxShadow.color boxShadow.offsetH boxShadow.offsetV boxShadow.blur boxShadow.spread boxShadow.inset".split(' '),
            '-moz-box-shadow': "boxShadow.color boxShadow.offsetH boxShadow.offsetV boxShadow.blur boxShadow.spread boxShadow.inset".split(' '),
            'box-shadow': "boxShadow.color boxShadow.offsetH boxShadow.offsetV boxShadow.blur boxShadow.spread boxShadow.inset".split(' ')
        },
        'text-shadow': {
            def: 'text-shadow',
            'text-shadow': ["textShadow.color", "textShadow.offsetH", "textShadow.offsetV", "textShadow.blur"] // using split costs bytes for less than 5 items
        },
        'filter': {
            def: '-webkit-filter',
            '-webkit-filter': "filter.invert filter.hue-rotate filter.contrast filter.saturate filter.brightness filter.sepia filter.grayscale filter.blur filter.drop-shadow.color filter.drop-shadow.offsetH filter.drop-shadow.offsetV filter.drop-shadow.blur".split(' '),
            '-moz-filter': "filter.invert filter.hue-rotate filter.contrast filter.saturate filter.brightness filter.sepia filter.grayscale filter.blur filter.drop-shadow.color filter.drop-shadow.offsetH filter.drop-shadow.offsetV filter.drop-shadow.blur".split(' '),
            'filter': "filter.invert filter.hue-rotate filter.contrast filter.saturate filter.brightness filter.sepia filter.grayscale filter.blur filter.drop-shadow.color filter.drop-shadow.offsetH filter.drop-shadow.offsetV filter.drop-shadow.blur".split(' ')
        },
        'background-size': {
            def: 'background-size',
            'background-size': ["background-size.x", "background-size.y"]
        },
        'background-position': {
            def: 'background-position',
            'background-position': ["background-position.x", "background-position.y"]
        }
    };

    // u: default units
    // i: index in dom declaration
    // j: subindex in dom declaration
    // cssProp: actual css property to set
    // domProp: name of parent prop field in dom. Defaults to camelized cssProp if not supplied
    var subpropLookup = {
        'boxShadow.offsetH': {cssProp: "box-shadow", type: "style", def: "0px", u: "px", i: 1},
        'boxShadow.offsetV': {cssProp: "box-shadow", type: "style", def: "0px", u: "px", i: 2},
        'boxShadow.blur': {cssProp: "box-shadow", type: "style", def: "0px", u: "px", i: 3},
        'boxShadow.spread': {cssProp: "box-shadow", type: "style", def: "0px", u: "px", i: 4},
        'boxShadow.color': {cssProp: "box-shadow", type: "color", def: "rgba(0,0,0,0)", i: 5},
        'boxShadow.inset': {cssProp: "box-shadow", def: "", i: 0},
        'textShadow.offsetH': {cssProp: "text-shadow", type: "style", def: "0px", u: "px", i: 1},
        'textShadow.offsetV': {cssProp: "text-shadow", type: "style", def: "0px", u: "px", i: 2},
        'textShadow.blur': {cssProp: "text-shadow", type: "style", def: "0px", u: "px", i: 3},
        'textShadow.color': {cssProp: "text-shadow", type: "color", def: "rgba(0,0,0,0)", i: 0},
        // Note that filter.drop-shadow is an array in dom declaration
        'filter.drop-shadow.color': {cssProp: "filter", type: "color", def: "rgba(0,0,0,0)", strReplace: "drop-shadow(%1", combinedNum: 4, i: 8},
        'filter.drop-shadow.offsetH': {cssProp: "filter", type: "style", def: "0px", u: "px", i: 9},
        'filter.drop-shadow.offsetV': {cssProp: "filter", type: "style", def: "0px", u: "px", i: 10},
        'filter.drop-shadow.blur': {cssProp: "filter", type: "style", def: "0px", strReplace: "%1)", u: "px", i: 11},
        'filter.grayscale': {cssProp: "filter", type: "style", def: "0", strReplace: "grayscale(%1)", i: 6},
        'filter.sepia': {cssProp: "filter", type: "style", def: "0", strReplace: "sepia(%1)", i: 5},
        'filter.saturate': {cssProp: "filter", type: "style", def: "1", strReplace: "saturate(%1)", i: 3},
        'filter.hue-rotate': {cssProp: "filter", type: "style", def: "0deg", strReplace: "hue-rotate(%1)", u: "deg", i: 1},
        'filter.invert': {cssProp: "filter", type: "style", def: "0", strReplace: "invert(%1)", i: 0},
        'filter.brightness': {cssProp: "filter", type: "style", def: "0", strReplace: "brightness(%1)", i: 4},
        'filter.contrast': {cssProp: "filter", type: "style", def: "1", strReplace: "contrast(%1)", i: 2},
        'filter.blur': {cssProp: "filter", type: "style", def: "0px", strReplace: "blur(%1)", u: "px", i: 7},
        'background-position.x': {cssProp: 'background-position', type: 'style', def: '0px', u: 'px', i: 2, domProp: 'fill'},
        'background-position.y': {cssProp: 'background-position', type: 'style', def: '0px', u: 'px', i: 3, domProp: 'fill'},
        'background-size.x': {cssProp: 'background-size', type: 'style', def: '100%', u: '%', i: 4, domProp: 'fill'},
        'background-size.y': {cssProp: 'background-size', type: 'style', def: '100%', u: '%', i: 5, domProp: 'fill'}
    };

    var subpropertyId = 1,
            funcs = {
                setValue:function (tt, prop, val) {
                    var data = Edge.$.data(this, subpropLookup[prop].cssProp);
                    data[prop] = val;
                },
                getValue:function (prop, tt) {
                    var data = Edge.$.data(this, subpropLookup[prop].cssProp);
                },
                setupForAnimation:function () {
                    var elements = this.getElementSet();
                    var tween = this;
                    elements.each(function () {
                        var data = Edge.$.data(this, tween.superProperty);
                        if (!data) {
                            // Get the current values on the element and save
                            data = tween.buildProp(this);
                            Edge.$.data(this, tween.superProperty, data);
                        }
                    });

                    PropertyTween.prototype.setupForAnimation.call(this);
                },
                buildProp:function (ele) {
                    var j;
                    var data = {};
                    var propName = this.superProperty;

					// add the retrieved values
                    var props = Edge.getSubProps(ele, propName);
                    for (j in props) {
                        if (props.hasOwnProperty(j)) {
                            data[j] = props[j];
                        }
                    }
                    data.id = this.superProperty + subpropertyId;
                    subpropertyId += 1;
                    data.element = ele;
                    data.prop = propName;
                    data.onFinalUpdate = _applySubproperty;

                    return data;
                },
                update:function (elapsed, easingConst) {
                    PropertyTween.prototype.update.call(this, elapsed, easingConst);
                    var elements = this.getElementSet();
                    var tween = this;
                    var prop = this.property;
                    var tt = this.tweenType;

                    elements.each(function () {
                        // We only want to tween if the property data has a
                        // matching animation id. If the ids don't match, that
                        // means another animation has started which is modifying
                        // this same property.

                        var td = tween.getPropertyTweenData(this, tt, prop);
                        if (td.animationID !== tween.animationID) {
                            return;
                        }

                        var data = Edge.$.data(this, tween.superProperty);
                        data.timeline = tween.timeline;
                        data.tween = tween;
                        UpdateFinalizer.Register(tween.timeline, data.id, data);
                    });
                }
            };

    function SubpropertyTween (tweenType, property, elements, fromVal, val, opts) {
        if (subpropLookup[property] !== null) {
            this.superProperty = subpropLookup[property].cssProp;
            tweenType = subpropLookup[property].type;
            if (tweenType === "color") {
                if (Edge.ColorTween) {
                    $.extend(this, Edge.ColorTween.prototype);
                    $.extend(this, funcs);
                    Edge.ColorTween.call(this, tweenType, property, elements, fromVal, val, opts);
                }
                // TODO throw something if no color-tween
            } else {
                $.extend(this, PropertyTween.prototype);
                $.extend(this, funcs);
                Edge.PropertyTween.call(this, tweenType, property, elements,  fromVal, val, opts);
            }
        }
        // TODO: Error?
        this.name = "subpropertyTween";
    }

    SubpropertyTween.prototype.constructor = SubpropertyTween;

    function decomposeFilterSubprops(style, prop, propOrder) {
        // Just in case there is a color property, we need to strip out the spaces first...
        style = style.replace(/,\s*/g, ",");
        var styles = [], val;
        styles["filter.invert"] = (val = style.match(/invert\((.*?)\)/)) ? val[1] : null;
        styles["filter.hue-rotate"] = (val = style.match(/hue-rotate\((.*?)\)/)) ? val[1] : null;
        styles["filter.contrast"] = (val = style.match(/contrast\((.*?)\)/)) ? val[1] : null;
        styles["filter.saturate"] = (val = style.match(/saturate\((.*?)\)/)) ? val[1] : null;
        styles["filter.brightness"] = (val = style.match(/brightness\((.*?)\)/)) ? val[1] : null;
        styles["filter.sepia"] = (val = style.match(/sepia\((.*?)\)/)) ? val[1] : null;
        styles["filter.grayscale"] = (val = style.match(/grayscale\((.*?)\)/)) ? val[1] : null;
        styles["filter.blur"] = (val = style.match(/blur\((.*?)\)/)) ? val[1] : null;
        var dropShadow = (val = style.match(/drop-shadow\((.*?\)\s*.*?)\)/)) ? val[1].split(" ") : [null, null, null, null];
        styles["filter.drop-shadow.color"] = dropShadow[0];
        styles["filter.drop-shadow.offsetH"] = dropShadow[1];
        styles["filter.drop-shadow.offsetV"] = dropShadow[2];
        styles["filter.drop-shadow.blur"] = dropShadow[3];

        var returnValue = [];
        var i;
        for (i = 0; i < propOrder.length; i += 1) {
            returnValue[propOrder[i]] = styles[propOrder[i]] || subpropLookup[propOrder[i]].def;
        }

        return returnValue;
    }

    function decomposeSubprops(style, prop, propOrder) {
        // Just in case there is a color property, we need to strip out the spaces first...
        style = style.replace(/,\s*/g, ",");
        var styles = style.split(" ");
        var returnValue = [];
        var i;
        for (i = 0; i < propOrder.length; i += 1) {
            returnValue[propOrder[i]] = styles[i] || subpropLookup[propOrder[i]].def;
        }
        return returnValue;
    }

    function getSubProps(ele, prop) {
        var $ele = $(ele);
        var style, i;
        for (i in propTemplates[prop]) {
            if (propTemplates[prop].hasOwnProperty(i)) {
                style = $ele.css(i);
                if (style && style !== "" && style !== "none") {
                    if(prop == "filter") return decomposeFilterSubprops(style, prop, propTemplates[prop][i]);
                    return decomposeSubprops(style, prop, propTemplates[prop][i]);
                }
            }
        }

        return [];
    }
    Edge.getSubProps = getSubProps;

    function getSubType (s) {
        return subpropLookup[s] ? subpropLookup[s].type : undefined;
    }

    SubpropertyTween.getSubType = getSubType;

    function getStyle (s) {
        return subpropLookup[s] ? subpropLookup[s].cssProp : undefined;
    }

    SubpropertyTween.getStyle = getStyle;

    SubpropertyTween.applySubproperty = function (ele, data, tween) {
        var val, prop, i, subVal,
                $ele = $(ele);

        // Set up the CSS string to set
        // loop through all the browser specific css props and set them
        for (prop in propTemplates[data.prop]) {
            if (prop !== "def" && propTemplates[data.prop].hasOwnProperty(prop)) {
                val = "";
                var combinedSubIsDefault = true;
                for (i = 0; i < propTemplates[data.prop][prop].length; i += 1) {
                    subVal = data[propTemplates[data.prop][prop][i]];
                    if (subVal === undefined) {
                        subVal = subpropLookup[propTemplates[data.prop][prop][i]].def;
                    }
                    if ("combinedNum" in subpropLookup[propTemplates[data.prop][prop][i]]) {
                        combinedSubIsDefault = true;
                        for (var j = i; j < i + subpropLookup[propTemplates[data.prop][prop][i]].combinedNum; j++) {
                            if (data[propTemplates[data.prop][prop][j]] !== undefined && data[propTemplates[data.prop][prop][j]] != subpropLookup[propTemplates[data.prop][prop][j]].def) {
                                combinedSubIsDefault = false;
                            }
                        }
                    }
                    if (!propTemplates[data.prop][prop][i].match(/^filter./) || (subVal != subpropLookup[propTemplates[data.prop][prop][i]].def || !combinedSubIsDefault)) {
                        if ("strReplace" in subpropLookup[propTemplates[data.prop][prop][i]]) {
                            subVal = subpropLookup[propTemplates[data.prop][prop][i]].strReplace.replace("%1", subVal);
                        }
                        val += subVal;
                        if (i !== propTemplates[data.prop][prop].length - 1) {
                            val += " ";
                        }
                    }
                }
                if ((window.edge_authoring_mode && prop === propTemplates[data.prop].def) || !window.edge_authoring_mode) {
                    $ele.css(prop, val);
                }
            }
        }

        if (tween && tween.notifier.obs.length) {
            tween.notifyObservers("onUpdate", {elapsed:0, easingConst:0, property:prop, value:val, element:$ele[0]});
        }
    };

    function _applySubproperty () {
        // Note that this is called with 'this' set to the handler object
        var data = Edge.$.data(this.element, this.prop);
        if (data) {
            SubpropertyTween.applySubproperty(this.element, data, data.tween);
        }
    }

    // Monkey patch for Prop's apply method
    function applySubprop ($ele, val) {
        var ele = $ele[0],
                prop = this.name;

        var data = Edge.$.data(ele, subpropLookup[prop].cssProp);
        if (!data) {
            data = funcs.buildProp.call({superProperty:subpropLookup[prop].cssProp}, ele);
            Edge.$.data(ele, subpropLookup[prop].cssProp, data);
        }
        data[prop] = val;
        data.onFinalUpdate.call({element:ele, prop:subpropLookup[prop].cssProp});
    }


    Edge.SubpropertyTween = SubpropertyTween;

    var subpropertyTweenName = "subproperty";
    Edge.Timeline.addTweenType(subpropertyTweenName, function (prop, ele, fromVal, toVal, opts) {
        return new SubpropertyTween(subpropertyTweenName, prop, ele, fromVal, toVal, opts);
    });

    // Now register all our subproperty names
    var defn, sp;

    for (subprop in subpropLookup) {
        defn = {};
        if (subpropLookup.hasOwnProperty(subprop)) {
            Edge.Timeline.addTweenProperty(subprop, subpropertyTweenName);
            sp = subpropLookup[subprop];
            defn[subprop] = {
                f:sp.domProp || Edge.camelize(sp.cssProp),
                i:sp.i,
                j:sp.j,
                def:sp.def
            };
            if (subpropLookup[subprop].u) {
                defn[subprop].u = subpropLookup[subprop].u;
            }

            Edge.defineProps(defn);
            Edge._.p[subprop].apply = applySubprop;
        }
    }

})(AdobeEdge);
/// an.transform-tween.js - version 0.2 - An Release 2.0
//
// Copyright (c) 2011. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/***
 @name TransformTween
 @class Defines a tween that can separately animate the components of a CSS3 3d transform (later
 improvements are planned to support 2d transforms on browsers that don't support 3d). This defines a tween type of
 "transform' which permits the separate animation of the following transform properties:
 translateX, translateY, translateZ, rotateX, rotateY, rotateZ, skewX, skewY, scaleX, scaleY, and scaleZ.
 The individual component functions are combined in a single transform on each update, in the order just listed.
 */
/*jslint regexp: true */
(function (Edge) {
    "use strict";

    var $ = Edge.$,
        PropertyTween = Edge.PropertyTween,
        UpdateFinalizer = Edge.UpdateFinalizer,
        asin = Math.asin,
        sin = Math.sin,
        cos = Math.cos,
        tan = Math.tan,
        atan2 = Math.atan2,
        deg2Rad = Math.PI / 180.0,
        rad2Deg = 180.0 / Math.PI,
        i,
        sSubpropNames = 'translateX translateY translateZ scaleX scaleY rotateX rotateY rotateZ skewX skewY',
        subpropNames = sSubpropNames.split(' '),
        supported = Edge.supported = Edge.supported || {},
        TransformIdRoot = "transform_",
        TransformId = 1,
        canonOrder = {
            translate3d: 0,
            translate: 0,
            translateX: 0,
            translateY: 0,
            translateZ: 0,
            rotate: 1,
            rotateZ: 1,
            rotateX: 1,
            rotateY: 1,
            rotate3d: 1,
            skew: 2,
            skewX: 2,
            skewY: 2,
            scale3d: 3,
            scale: 3,
            scaleX: 3,
            scaleY: 3,
            scaleZ: 3,
            perspective: 4
        },
		isWebkit = 'webkitAppearance' in document.documentElement.style;;

    supported.cssTransform = Edge.isSupported(['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform']);
    supported.cssTransform3d = Edge.isSupported(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']);

    Edge.An$.prototype.hasClass = Edge.An$.prototype.hasClass || function (cls) {
        if (this[0]) {
            var className = this[0].className || "",
                classNames = className.split(/\s+/),
                i;
            for (i = 0; i < classNames.length; i += 1) {
                if (cls === classNames[i]) {
                    return true;
                }
            }

        }
        return false;
    };
    // prop, ele, fromVal, toVal, opts
    function TransformTween(tweenType, property, elements, fromVal, val, opts) {
        Edge.PropertyTween.call(this, tweenType, property, elements, fromVal, val, opts);
        this.name = "transformTween";

    }

    TransformTween.removeData = function (ele) {
        var data = Edge.$.data(ele, TransformTween.dataName);
        if (data) {
            if (data.timeline) {
                UpdateFinalizer.unRegister(data.timeline, data.id);
            }
            Edge.$.data(ele, TransformTween.dataName, undefined);
        }
    };

    function getNumber(numWithUnits) {
        var num = 0;
        if (typeof numWithUnits === 'string') {
            num = parseFloat(numWithUnits.replace(/[a-zA-Z%]+$/, ""));
        } else if (typeof numWithUnits === 'number') {
            num = numWithUnits;
        }
        return num;
    }
    TransformTween.getNumber = getNumber;

    TransformTween.splitUnits = Edge.splitUnits;

    function formatNumber(num) {
        if (num !== 0 && Math.abs(num) < 1e-6) {
            return num.toFixed(6);
        }
        return num.toString();
    }

    function combineTranslation(parentDim, translate1, translate2) {
        if (translate1 === undefined) {
            return translate2;
        }
        if (translate2 === undefined) {
            return translate1;
        }
        var number1 = getNumber(translate1),
            number2 = getNumber(translate2),
            units1,
            units2,
            units;
        if (!number1) {
            return translate2;
        }
        if (!number2) {
            return translate1;
        }

        units1 = Edge.splitUnits(translate1).units;
        units2 = Edge.splitUnits(translate2).units;
        units = units1;

        if (units1 !== units2) {
            if (units1 === '%') {
                units = units2;
                number1 = number1 / 100 * parentDim;
            }
            if (units2 === '%') {
                number2 = number2 / 100 * parentDim;
            }
        }
        return number1 + number2 + units;
    }

    TransformTween.applyTransform = function (ele, data, tween, opts) {
        if (Edge.applyCount !== undefined) {
            Edge.applyCount += 1;
        }

        var $ele = $(ele),
            val,
            forceZ = true,
            prop = 'transform',
            translateX,
            translateY,
            supports3d,
            num,
            ua,
            rotateX,
            rotateY,
            rotateZ,
            scaleX,
            scaleY;

        if (opts) {
            forceZ = !opts.dontForceZ;
        }

        translateX = combineTranslation(1, data.translateX, data.motionTranslateX);
        translateY = combineTranslation(1, data.translateY, data.motionTranslateY);
        rotateZ = combineTranslation ( 1, data.rotateZ, data.motionRotateZ);

        supports3d = Edge.supported.cssTransform3d;

        if (isWebkit) {
            // Z transforms make some Android browsers sick, so don't write out unless necessary
            val = "translate(" + translateX + "," + translateY + ")";
            num = getNumber(data.translateZ);
            if ((num !== 0 || forceZ) && supports3d) {
                val += " translateZ(" + data.translateZ + ")";
            }
            val += " rotate(" + rotateZ + ") "; // don't call it rotateZ - android gets ill

            if (supports3d) {
                num = getNumber(data.rotateY);
                if (num !== 0) {
                    val += " rotateY(" + data.rotateY + ")";
                }

                num = getNumber(data.rotateX);
                if (num !== 0) {
                    val += " rotateX(" + data.rotateX + ")";
                }
            }

            if (data.skewX && data.skewX !== "0deg") {
                val += " skewX(" + data.skewX + ") ";
            }
            if (data.skewY && data.skewY !== "0deg") {
                val += " skewY(" + data.skewY + ") ";
            }

            val += " scale(" + data.scaleX + "," + data.scaleY + ") ";

            num = getNumber(data.scaleZ);
            if (num !== 1 && supports3d) {
                val += " scaleZ(" + data.scaleZ + ")";
            }

            ua = navigator.userAgent;

            // Don't do this in tool!
            if (!window.edge_authoring_mode && supports3d) {
                $ele.css('-webkit-transform-style', 'preserve-3d');
            }

            $ele.css('-webkit-transform', val);

            if (tween && tween.notifier.obs.length) {
                tween.notifyObservers("onUpdate", { elapsed: 0, easingConst: 0, property: prop, value: val, element: $ele[0] });
            }

        } else {
            rotateX = getNumber(data.rotateX);
            rotateY = getNumber(data.rotateY);
            scaleX = data.scaleX * cos(deg2Rad * rotateY);
            scaleY = data.scaleY * cos(deg2Rad * rotateX);

            val = "translate(" + translateX + "," + translateY + ")";
            val += " rotate(" + rotateZ + ")";
            if (data.skewX && data.skewX !== "0deg") {
                val += " skewX(" + data.skewX + ") ";
            }
            if (data.skewY && data.skewY !== "0deg") {
                val += " skewY(" + data.skewY + ") ";
            }
            val += " scale(" + scaleX + "," + scaleY + ")";

            $ele.css('-moz-transform', val);

            $ele.css('-o-transform', val);

            $ele.css('-ms-transform', val);// This is here in case MS changes ie9 for bug 8346

            $ele.css('msTransform', val); // work around jquery bug #8346 - IE9 uses wrong camel case
            if (tween && tween.notifier.obs.length) {
                tween.notifyObservers("onUpdate", { elapsed: 0, easingConst: 0, property: prop, value: val, element: $ele[0] });
            }
        }
        $ele.css("transform", val);
    };


    TransformTween.dataName = "EdgeTransformData";
    $.extend(TransformTween.prototype, PropertyTween.prototype);
    $.extend(TransformTween.prototype, {

        constructor: TransformTween,

        setup: function (timeline) {
            this.timeline = timeline;
            this.updateTriggered = false;
        },
        setValue: function (tt, prop, val) {
            var data = Edge.$.data(this, TransformTween.dataName);
            data[prop] = val;
        },
        getValue: function (prop, tt) {
            var data = Edge.$.data(this, TransformTween.dataName);
        },
        setupForAnimation: function () {
            var elements = this.getElementSet(),
                tween = this,
                data;
            elements.each(function () {
                //var $this = $(this);
                data = Edge.$.data(this, TransformTween.dataName);
                if (!data) {
                    // Get the current values on the element and save
                    data = tween.buildTransformData(this);
                    Edge.$.data(this, TransformTween.dataName, data);
                }
            });

            PropertyTween.prototype.setupForAnimation.call(this);

        },
        update: function (elapsed, easingConst) {
            PropertyTween.prototype.update.call(this, elapsed, easingConst);
            var elements = this.getElementSet(),
                tween = this,
                prop = this.property,
                tt = this.tweenType;

            elements.each(function () {
                // We only want to tween if the property data has a
                // matching animation id. If the ids don't match, that
                // means another animation has started which is modifying
                // this same property.

                var td = tween.getPropertyTweenData(this, tt, prop),
                    data;
                if (td.animationID !== tween.animationID) {
                    return;
                }

                data = Edge.$.data(this, TransformTween.dataName);
                data.timeline = tween.timeline;
                data.tween = tween;
                UpdateFinalizer.Register(tween.timeline, data.id, data);
            });
        },
        buildTransformData: function (ele) {

            var data = Edge.parseCanonicalTransform(ele);
            if (!data) {
                data = {};
                data.translateX = "0px";
                data.translateY = "0px";
                data.translateZ = "0px";
                data.scaleX = 1;
                data.scaleY = 1;
                data.scaleZ = 1;
                data.rotateX = "0deg";
                data.rotateY = "0deg";
                data.rotateZ = "0deg";
                data.skewXZ = 0;
                data.skewXY = 0;
                data.skewYZ = 0;
                data.skewX = '0deg';
                data.skewY = '0deg';
                if (data.matrix) {
                    delete data.matrix;
                }
            }
            if (data === null) {
                data = {};
            }

            data.id = TransformIdRoot + TransformId;
            TransformId += 1;
            data.element = ele;
            data.onFinalUpdate = UpdateFinalizer.prototype.applyTransform;

            return data;
        },
        buildDefaultTransformData: function (ele) {
            var data = {};
            data.translateX = "0px";
            data.translateY = "0px";
            data.translateZ = "0px";
            data.scaleX = 1;
            data.scaleY = 1;
            data.scaleZ = 1;
            data.rotateX = "0deg";
            data.rotateY = "0deg";
            data.rotateZ = "0deg";
            data.skewXZ = 0;
            data.skewXY = 0;
            data.skewYZ = 0;
            data.skewX = '0deg';
            data.skewY = '0deg';

            data.id = TransformIdRoot + TransformId;
            TransformId += 1;
            data.element = ele;
            data.onFinalUpdate = UpdateFinalizer.prototype.applyTransform;

            return data;
        }
        // End of TransformTween extend
    });

    function getTransform(ele) {
        var $ele = $(ele),
            style = $ele[0].style,
            xform;
        if (isWebkit) {
            xform = $ele[0].style.webkitTransform;
            if (!xform) {
                xform = $ele.css("-webkit-transform");
            }
        }

        if (xform) {
            return xform;
        }

        xform = $ele[0].style.msTransform;
        if (!xform) {
            xform = $ele.css("-ms-transform");
        }
        if (!xform) {
            xform = $ele.css("msTransform");
        }
        if (!xform) {
            xform = style.MozTransform;
        }
        if (!xform) {
            xform = style["-moz-transform"];
        }
        if (!xform) {
            xform = $ele.css("-moz-transform");
        }
        if (!xform) {
            xform = style.oTransform;
        }
        if (!xform) {
            xform = $ele.css("-o-transform");
        }
        if (!xform) {
            xform = style.transform;
        }
        if (!xform) {
            xform = $ele.css("transform");
        }

        return xform || "";
    }

    function parseCanonicalTransform(ele, xformString) {
        var xform = typeof xformString === 'string' ? xformString : Edge.getTransform(ele),
            re = /(\w+\s*\([^\)]*\))/g,
            funcs = xform.match(re),
            found = {},
            hiWater = 0,
            data = {},
            i,
            func,
            params,
            angle;

        if (!funcs) {
            return null;
        }

        data.translateX = "0px";
        data.translateY = "0px";
        data.translateZ = "0px";
        data.scaleX = 1;
        data.scaleY = 1;
        data.scaleZ = 1;
        data.rotateX = "0deg";
        data.rotateY = "0deg";
        data.rotateZ = "0deg";
        data.skewXZ = 0;
        data.skewXY = 0;
        data.skewYZ = 0;
        data.skewX = '0deg';
        data.skewY = '0deg';

        for (i = 0; i < funcs.length; i += 1) {
            func = funcs[i].match(/\w+/);
            if (found[func[0]] || canonOrder[func[0]] < hiWater) {
                return null;
            }
            params = funcs[i].match(/\([^\)]*\)/);
            params = params[0].replace(/[\(\)]/g, '');
            params = params.split(',');
            switch (func[0]) {
            case ('matrix'):
                return null;
            case ('translate3d'):
                data.translateX = params[0];
                data.translateY = params.length > 1 ? params[1] : '0px';
                data.translateZ = params.length > 2 ? params[2] : '0px';

                found.translate3d = found.translate = found.translateX = found.translateY = found.translateZ = true;
                break;
            case ('translate'):
                data.translateX = params[0];
                data.translateY = params.length > 1 ? params[1] : '0px';

                found.translate3d = found.translate = found.translateX = found.translateY = true;
                break;
            case ('translateX'):
                data.translateX = params[0];

                found.translate3d = found.translate = found.translateX = true;
                break;
            case ('translateY'):
                data.translateY = params[0];

                found.translate3d = found.translate = found.translateY = true;
                break;
            case ('translateZ'):
                data.translateZ = params[0];

                found.translate3d = found.translateZ = true;
                break;
            case ('rotate3d'):
                found.rotate3d = found.rotate = found.rotateX = found.rotateY = found.rotateZ = true;
                return null;
            case ('rotateX'):
                data.rotateX = params[0];
                found.rotate3d = found.rotateX = true;
                break;
            case ('rotateY'):
                data.rotateY = params[0];
                found.rotate3d = found.rotateY = true;
                break;
            case ('rotateZ'):
            case ('rotate'):
                data.rotateZ = params[0];
                found.rotate3d = found.rotate = found.rotateZ = true;
                break;
            case ('skew'):
                data.skewX = params[0];
                data.skewY = params.length > 1 ? params[1] : '0px';
                found.skew = found.skewX = found.skewY = true;
                break;
            case ('skewX'):
                data.skewX = params[0];
                found.skew = found.skewX = true;
                break;
            case ('skewY'):
                data.skewY = params[0];
                found.skew = found.skewY = true;
                break;
            case ('scale3d'):
                // Note that according to spec y and z default to 1 in scale3d, but y defaults to the x value in scale!
                data.scaleX = params[0];
                data.scaleY = params.length > 1 ? params[1] : 1;
                data.scaleZ = params.length > 2 ? params[2] : 1;

                found.scale3d = found.scale = found.scaleX = found.scaleY = found.scaleZ = true;
                break;
            case ('scale'):
                data.scaleX = params[0];
                data.scaleY = params.length > 1 ? params[1] : params[0];
                found.scale = found.scaleX = found.scaleY = true;
                break;
            case ('scaleX'):
                data.scaleX = params[0];
                found.scale3d = found.scale = found.scaleX = true;
                break;
            case ('scaleY'):
                data.scaleY = params[0];
                found.scale3d = found.scale = found.scaleY = true;
                break;
            case ('scaleZ'):
                data.scaleZ = params[0];
                found.scale3d = found.scaleZ = true;
                break;
            case ('perspective'):
                found.perspective = true;
                break;
            }
        }
        return data;
    }

    Edge.getTransform = getTransform;
    Edge.parseCanonicalTransform = parseCanonicalTransform;
    Edge.TransformTween = TransformTween;

    $.extend(UpdateFinalizer.prototype, {
        applyTransform: function (updateData) {
            // Note that this is called with 'this' set to the handler object
            var data = Edge.$.data(this.element, TransformTween.dataName);
            if (data && updateData) {
                TransformTween.applyTransform(this.element, data, data.tween, updateData.context);
            }
        }

    });

    /* transformSubprop is only here to work properly with use strict */
    function transformSubprop() {
    }

    transformSubprop.applySubprop = function ($ele, val) {
        var ele = $ele[0],
            prop = this.name,
            data = TransformTween.prototype.buildTransformData(ele);
        data[prop] = val;
        TransformTween.applyTransform(ele, data, null, {});
    };

    Edge.Timeline.addTweenType("transform", function (prop, ele, fromVal, toVal, opts) {
        return new TransformTween("transform", prop, ele, fromVal, toVal, opts);
    });

    for (i = 0; i < subpropNames.length; i += 1) {
        Edge.Timeline.addTweenProperty(subpropNames[i], 'transform');
    }

    //   subpropNames = 'translateX translateY translateZ scaleX scaleY rotateX rotateY rotateZ skewX skewY'

    Edge.defineProps({
        translateX: {
            f: 'transform',
            i: 0,
            j: 0,
            u: "px"
        },
        translateY: {
            f: 'transform',
            i: 0,
            j: 1,
            u: "px"
        },
        translateZ: {
            f: 'transform',
            i: 0,
            j: 2,
            u: "px"
        },
        // Notice that rotate is in the order [z, x, y] - this saves 4 bytes for the majority of usages
        rotateZ: {
            f: 'transform',
            i: 1,
            j: 0,
            u: "deg"
        },
        rotateX: {
            f: 'transform',
            i: 1,
            j: 1,
            u: "deg"
        },
        rotateY: {
            f: 'transform',
            i: 1,
            j: 2,
            u: "deg"
        },
        skewX: {
            f: 'transform',
            i: 2,
            j: 0,
            u: "deg"
        },
        skewY: {
            f: 'transform',
            i: 2,
            j: 1,
            u: "deg"
        },
        scaleX: {
            f: 'transform',
            i: 3,
            j: 0
        },
        scaleY: {
            f: 'transform',
            i: 3,
            j: 1
        },
        scaleZ: {
            f: 'transform',
            i: 3,
            j: 2
        }
    });

    /*jslint nomen: true */
    for (i = 0; i < subpropNames.length; i += 1) {
        Edge._.p[subpropNames[i]].apply = transformSubprop.applySubprop;
    }

})(AdobeEdge);
/// edge.color-tween.js - version 0.2 - An Release 1.0
//
// Copyright (c) 2011. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/***
 @name ColorTween
 @class Defines a tween that can animate the background-color and color properties in rgb or hsl color space.
 This defines a tween type of "color' which can parse color properties in RGB or HSL css formats and convert them
 to the desired animation color space - HSL or RGB. (It is also planned to later support color names as css property
 values.
 */

(function (Edge) {

    "use strict";

    var $ = Edge.$,
        PropertyTween = Edge.PropertyTween,
        sPropNames = 'color background-color',
        propNames = sPropNames.split(' '),
        i,
        supportTested = false,
        supportRGB = false,
        supportHSL = false,
        supportRGBA = false,
        supportHSLA = false,
        oneThird = 1.0 / 3.0,
        oneSixth = 1.0 / 6.0,
        twoThirds = 2.0 / 3.0;

    function testSupport() {
        if (!supportTested) {

            var ele = document.createElement("div"), $ele = $(ele),
                val,
                transparent;
            $ele.css("background-color", "transparent");
            transparent = $ele.css("background-color");
            $ele.css("background-color", "rgb(100, 100, 100)");
            val = $ele.css("background-color");
            supportRGB = val !== transparent;

            $ele.css("background-color", "transparent");
            $ele.css("background-color", "hsl(100, 100%, 100%)");
            val = $ele.css("background-color");
            supportHSL = val !== transparent;

            $ele.css("background-color", "transparent");
            $ele.css("background-color", "rgba(100, 100, 100,.5)");
            val = $ele.css("background-color");
            supportRGBA = val !== transparent;

            $ele.css("background-color", "transparent");
            $ele.css("background-color", "hsla(100, 100%, 100%, .5)");
            val = $ele.css("background-color");
            supportHSLA = val !== transparent;

            supportTested = true;
        }
    }

    function ColorTween(tweenType, property, elements, fromVal, val, opts) {
        Edge.PropertyTween.call(this, tweenType, property, elements, fromVal, val, opts);
        this.name = "colorTween";
        testSupport();
    }

    $.extend(ColorTween.prototype, PropertyTween.prototype);
    $.extend(ColorTween.prototype, {

        constructor: ColorTween,

        getValue: function (prop, tt) {
            return $(this).css(prop);
        },
        setValue: function (tt, prop, val) {
            $(this).css(prop, val);
        },
        parseValue: function (val) {
            var colorValueObj = Edge.parseColorValue(val),
                values,
                colorFn,
                patternRGB = /rgb/gi,
                patternHSL = /hsl/gi,
                valueRGB,
                valueHSL,
                opacity;

            if (!colorValueObj || !colorValueObj.colorFunction || !colorValueObj.values) {
                return;
            }

            values = colorValueObj.values;

            colorFn = colorValueObj.colorFunction;

            if (colorFn.match(patternRGB)) {
                if (this.animationColorSpace && this.animationColorSpace === 'HSL') {
                    valueRGB = {r: values[0], g: values[1], b: values[2]};
                    valueHSL = Edge.rgbToHSL(valueRGB);
                    if (!valueHSL) {
                        values = [];
                    } else if (values.length > 3) {
                        opacity = values[3];
                        values = [valueHSL.h, valueHSL.s, valueHSL.l, opacity];
                    } else {
                        values = [valueHSL.h, valueHSL.s, valueHSL.l];
                    }
                } else if (!this.animationColorSpace) {
                    this.animationColorSpace = 'RGB';
                } else if (this.animationColorSpace !== 'RGB') {
                    //Unexpected value, Not yet implemented
                    return values;
                }
            } else if (colorFn.match(patternHSL)) { //HSL
                if (this.animationColorSpace && this.animationColorSpace === 'RGB') {
                    valueHSL = {h: values[0], s: values[1], l: values[2]};
                    valueRGB = Edge.hslToRGB(valueHSL);
                    if (!valueRGB) {
                        values = [];
                    } else if (values.length > 3) {
                        opacity = values[3];
                        values = [valueRGB.r, valueRGB.g, valueRGB.b, opacity];
                    } else {
                        values = [valueRGB.r, valueRGB.g, valueRGB.b];
                    }
                } else if (!this.animationColorSpace) {
                    this.animationColorSpace = 'HSL';
                } else if (this.animationColorSpace !== 'HSL') {
                    //Unexpected value, Not yet implemented
                    return values;
                }

            }

            if (values.length === 3) {
                values[3] = 1; // Normalize to rgba or hsla, set the opacity to 1
            }

            return values;
        },
        formatValue: function (values) {
            testSupport();
            if (!values) {
                return;
            }

            var formattedValue,
                colorFn,
                val,
                r,
                g,
                b,
                rgb;
            if (this.animationColorSpace === 'HSL' && supportHSLA) {
                colorFn = 'hsl';
                if (values.length === 4 && supportHSLA) {
                    formattedValue = colorFn + 'a(' + values[0] + ',' + values[1] + '%,' + values[2] + '%,' + values[3] + ')';
                } else {
                    formattedValue = colorFn + '(' + values[0] + ',' + values[1] + '%,' + values[2] + '%)';
                }
            } else if (supportRGBA) {
                colorFn = 'rgb';
                if (values.length === 4 && supportRGBA) {
                    formattedValue = colorFn + 'a(' + values[0] + '%,' + values[1] + '%,' + values[2] + '%,' + values[3] + ')';
                } else {
                    formattedValue = colorFn + '(' + values[0] + '%,' + values[1] + '%,' + values[2] + '%)';
                }
            } else {
                // Downlevel support
                r = values[0];
                g = values[1];
                b = values[2];
                if (this.animationColorSpace === 'HSL') {
                    rgb = Edge.hslToRGB({h: values[0], g: values[1], b: values[2]});
                    r = rgb.r;
                    g = rgb.g;
                    b = rgb.b;
                }
                r *= 255 / 100;
                g *= 255 / 100;
                b *= 255 / 100;
                val = Math.floor(r) * 256 * 256 + Math.floor(g) * 256 + Math.floor(b);
                formattedValue = "#" + val.toString(16);
            }
            return formattedValue;
        }
    });

    Edge.ColorTween = ColorTween;

    Edge.Color = { formatValue: ColorTween.prototype.formatValue, parseValue: ColorTween.prototype.parseValue };

    Edge.parseColorValue = function (val) {
        if (!val) {
            return;
        }

        var values = [],

            colorFn,
            params,
        // Tests for #ffffff
            colorExpHex6 = /^\s*#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})\s*$/,
        // Tests for #fff
            colorExpHex3 = /^\s*#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])\s*$/,
            patternRGB = /rgb/gi,
            patternHSL = /hsl/gi,
            i,
            splitParams,
            colorValueObj;

        params = colorExpHex6.exec(val);
        if (params) {
            values = [((parseInt(params[1], 16)) / 255) * 100, ((parseInt(params[2], 16)) / 255) * 100, ((parseInt(params[3], 16)) / 255) * 100];
            colorFn = 'rgb';
        } else {
            params = colorExpHex3.exec(val);
            if (params) {
                values = [((parseInt(params[1] + params[1], 16)) / 255) * 100, ((parseInt(params[2] + params[2], 16)) / 255) * 100, ((parseInt(params[3] + params[3], 16)) / 255) * 100];
                colorFn = 'rgb';
            } else if (val === "transparent") {
                values = [0, 0, 0, 0];
                colorFn = 'rgb';
            }
        }

        if (!colorFn) {
            colorFn = val.toString().match(/\w+/);
            if ($.isArray(colorFn)) {
                colorFn = colorFn[0];
            } else if (!colorFn) {
                colorFn = "";
            }

            params = val.toString().match(/\([\d%,\.\s]*\)/);
            if (params && params.length > 0) {
                params = params[0].replace(/[\(\)]/g, '');
            }
        }

        if (values.length === 0) {
            if (colorFn.match(patternRGB)) {
                //Tests for % or ints
                // Test for numbers
                splitParams = /^\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*(?:,\s*([0-9](?:\.[0-9]+)?)\s*)?$/.exec(params);
                if (splitParams && splitParams.length >= 4) {
                    for (i = 0; i < 3; i += 1) {
                        // if the number is an integer (from 0 -255) normalize to percent
                        values[i] = (splitParams[i + 1] / 255) * 100;
                    }
                    if (splitParams.length > 4) {
                        if (!splitParams[4]) {
                            splitParams[4] = 1;
                        }
                        values[3] = splitParams[4]; // opacity
                    }
                } else {
                    // Tests for float %
                    params = /^\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*(?:,\s*([0-9](?:\.[0-9]+)?)\s*)?$/.exec(params);
                    if (params && params.length >= 4) {
                        /// Get rid of any unnecessary data captured
                        if (params.length >= 5) {
                            params.length = 5;
                            if (!params[4]) {
                                params[4] = 1;
                            }
                        }
                        for (i = 0; i < (params.length - 1); i += 1) {
                            // if the number is a percentage copy it as is
                            values[i] = params[i + 1];
                        }
                    }
                }
            } else if (colorFn.match(patternHSL)) { //HSL
                params = /^\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*,\s*([0-9]{1,3}(?:\.[0-9]+)?)\s*%\s*(?:,\s*([0-9](?:\.[0-9]+)?)\s*)?$/.exec(params);
                if (params && params.length >= 4) {
                    /// Get rid of any unnecessary data captured
                    if (params.length >= 5) {
                        params.length = 5;
                        if (!params[4]) {
                            params[4] = 1;
                        }
                    }
                    for (i = 0; i < (params.length - 1); i += 1) {
                        values[i] = params[i + 1];
                    }
                }
            }
        }

        // Round to 4 decimal places
        if (values) {
            for (i = 0; i < values.length; i += 1) {
                values[i] = (Math.round(values[i] * 10000)) / 10000;
            }
        }

        colorValueObj = {colorFunction: colorFn, values: values};

        return colorValueObj;
    };


    function normalizeColorComponent(c) {
        if (c < 0.0) {
            return c + 1.0;
        }
        if (c > 1) {
            return c - 1.0;
        }
        return c;

    }

    function rgbComponentFromIntermediate(p, q, multiplier, tC) {
        if (tC < oneSixth) {
            return p + multiplier * tC;
        }
        if (tC < 0.5) {
            return q;
        }
        if (tC < twoThirds) {
            return p + multiplier * (twoThirds - tC);
        }
        return p;
    }

    /** @name hslToRGB
     Assumes hsl values as (deg, %, %). Returns rgb as percentage
     */
    Edge.hslToRGB = function (hsl) {
        if (hsl === null || hsl.s < 0 || hsl.s > 100 || hsl.l < 0 || hsl.l > 100) {
            return null;
        }

        // Normalize the hue
        while (hsl.h > 360) {
            hsl.h = hsl.h - 360;
        }

        while (hsl.h < 0) {
            hsl.h = 360 + hsl.h;
        }

        var rgb = {},
            h = hsl.h / 360,
            s = hsl.s / 100,
            l = hsl.l / 100,
            q,
            p,
            tR,
            tG,
            tB,
            multiplier;

        if (s === 0) {
            rgb.r = rgb.g = rgb.b = l;
        } else {
            if (l <= 0.5) {
                q = l * (1 + s);
            } else {
                q = l + s - (l * s);
            }

            p = 2.0 * l - q;

            tR = normalizeColorComponent(h + oneThird);
            tG = normalizeColorComponent(h);
            tB = normalizeColorComponent(h - oneThird);

            multiplier = (q - p) * 6.0;

            rgb.r = rgbComponentFromIntermediate(p, q, multiplier, tR);
            rgb.g = rgbComponentFromIntermediate(p, q, multiplier, tG);
            rgb.b = rgbComponentFromIntermediate(p, q, multiplier, tB);
        }

        rgb.r = Math.min(rgb.r * 100, 100);
        rgb.g = Math.min(rgb.g * 100, 100);
        rgb.b = Math.min(rgb.b * 100, 100);

        // Round to 4 decimal places
        rgb.r = (Math.round(rgb.r * 10000)) / 10000;
        rgb.g = (Math.round(rgb.g * 10000)) / 10000;
        rgb.b = (Math.round(rgb.b * 10000)) / 10000;

        return rgb;
    };

    /** @name rgbToHSL
     Assumes rgb values as a percentage. Returns hsl as (deg, %,%)
     */
    Edge.rgbToHSL = function (rgb) {
        if (rgb === null || rgb.r < 0 || rgb.r > 100 || rgb.g < 0 || rgb.g > 100 || rgb.b < 0 || rgb.b > 100) {
            return null;
        }

        var hsl = {h: 0, s: 0, l: 0 },
            r = rgb.r / 100,
            g = rgb.g / 100,
            b = rgb.b / 100,
            maxColor = Math.max(r, g, b),
            minColor = Math.min(r, g, b),
            colorDiff;

        hsl.l = (maxColor + minColor) / 2.0;

        // If the max and min colors are the same (ie the color is some kind of grey), S is defined to be 0,
        // and H is undefined but in programs usually written as 0
        if (maxColor > minColor && hsl.l > 0.0) {
            colorDiff = maxColor - minColor;
            if (hsl.l <= 0.5) {
                hsl.s = colorDiff / (maxColor + minColor);
            } else {
                hsl.s = colorDiff / (2.0 - maxColor - minColor);
            }

            if (maxColor === b) {
                hsl.h = 4.0 + (r - g) / colorDiff;
            } else if (maxColor === g) {
                hsl.h = 2.0 + (b - r) / colorDiff;
            } else {  // maxColor == r
                hsl.h = (g - b) / colorDiff;
            }

            // Normalize hue
            hsl.h *= 60;
            if (hsl.h > 360) {
                hsl.h = hsl.h - 360;
            } else if (hsl.h < 0) {
                hsl.h = 360 + hsl.h;
            }
        }

        hsl.s = Math.min(hsl.s * 100, 100);
        hsl.l = Math.min(hsl.l * 100, 100);

        // Round to 4 decimal places
        hsl.h = (Math.round(hsl.h * 10000)) / 10000;
        hsl.s = (Math.round(hsl.s * 10000)) / 10000;
        hsl.l = (Math.round(hsl.l * 10000)) / 10000;

        return hsl;
    };

    Edge.colorToSupported = function (val) {
        testSupport();
        if ((!supportRGBA && /rgba/.test(val)) || (!supportRGB && /rgb/.test(val)) || (!supportHSLA && /hsla/.test(val)) || (!supportHSL && /hsl/.test(val))) {
            // Downlevel support
            var result = Edge.parseColorValue(val), values = result.values,
                r,
                g,
                b,
                rgb;
            if (values.length >= 4 && values[3] < 0.5) {
                return 'transparent';
            }
            r = values[0];
            g = values[1];
            b = values[2];
            if (/hsl/.test(val)) {
                rgb = Edge.hslToRGB({h: values[0], g: values[1], b: values[2]});
                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
            }
            r *= 255 / 100;
            g *= 255 / 100;
            b *= 255 / 100;
            r = Math.floor(r);
            g = Math.floor(g);
            b = Math.floor(b);
            r = (r > 15 ? "" : "0") + r.toString(16);
            g = (g > 15 ? "" : "0") + g.toString(16);
            b = (b > 15 ? "" : "0") + b.toString(16);
            val = "#" + r + g + b;
        }
        return val;
    };

    Edge.Timeline.addTweenType("color", function (prop, ele, fromVal, toVal, opts) {
        return new ColorTween("color", prop, ele, fromVal, toVal, opts);
    });

    for (i = 0; i < propNames.length; i += 1) {
        Edge.Timeline.addTweenProperty(propNames[i], 'color');
    }
})(AdobeEdge);
/// edge.gradient-tween.js - version 0.2 - An Release 1.0
//
// Copyright (c) 2011. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/***
 @name GradientTween
 @class Defines a tween that can animate the background-image gradients.
 This defines a tween type of 'gradient' which can parse gradient properties.
 */

/*global window: true, document: true, EdgeAn: true */

(function (Edge) {

    "use strict";

    var $ = Edge.$,
        PropertyTween = Edge.PropertyTween,
        tweenTypes = { gradient: 0 },
        cssProp = "background-image",
        propLookup = { 'background-image': { cssProp: cssProp, def: "0px", u: "px", i: 1 } },
        prop,
        superApply = Edge._.p[cssProp].apply,
        superPrep = Edge._.p[cssProp].prep;

    // Helpers

    function forceGPU(ele) {
        if (document.documentElement.style.hasOwnProperty('webkitAppearance')) {
            var transform = $(ele).css('-webkit-transform');
            if (!transform.match(/translateZ/) && !transform.match(/matrix3d/)) {
                $(ele).css('-webkit-transform', transform + ' translateZ(0)');
            }
        }
    }
    Edge.forceGPU = forceGPU;

    function GradientTween(tweenType, property, elements, fromVal, val, opts) {
        var ci = null,
            i,
            lt,
            gt;
        if (val.length >= 2 && $.isArray(val[1]) && fromVal.length >= 2 && $.isArray(fromVal[1])) { // linear gradient
            ci = 1;
        } else if (val.length >= 2 && $.isArray(val[4]) && fromVal.length >= 2 && $.isArray(fromVal[4])) { // radial gradient
            ci = 4;
        }
        if (ci) {
            // Generate color stops when one of the tween ends has less than the other
            // Note:  For now, just duplicate the final color stop to get to the final set of colorstops.
            //        We might decide we need to interpolate values to get an approximate value at an interim position.
            lt = fromVal[ci].length < val[ci].length ? fromVal[ci] : val[ci];
            gt = lt === val[ci] ? fromVal[ci] : val[ci];

            for (i = lt.length; i < gt.length; i += 1) {
                lt[i] = lt[i - 1];
            }
        }
        Edge.PropertyTween.call(this, tweenType, property, elements, fromVal, val, opts);
        this.name = "GradientTween";
        this.tweenType = tweenTypes[tweenType];
    }

    $.extend(GradientTween.prototype, PropertyTween.prototype);
    $.extend(GradientTween.prototype, {

        constructor: GradientTween,

        setupForAnimation: function () {
            var elements = this.getElementSet();
            elements.each(function () {
                forceGPU(this);
            });

            PropertyTween.prototype.setupForAnimation.call(this);
        },
        getValue: function (prop, tt) {
            return $(this).css(prop);
        },
        setValuePre: function (tt, prop, val) {
            $(this).css(prop, '-webkit-' + val);
            $(this).css(prop, '-moz-' + val);
            $(this).css(prop, '-ms-' + val);
            $(this).css(prop, '-o-' + val);
        },
        setValue: function (tt, prop, val) {
            $(this).css(prop, val);
        },
        update: function (elapsed, easingConst) {
            var elements = this.getElementSet(),
                tween = this,
                tt = this.tweenType,
                i,
                fvs,
                tvs,
                filters,
                cnt,
                results;

            prop = propLookup[this.property].cssProp;

            if (!this.updateTriggered) {
                this.updateTriggered = true;
                this.setupForAnimation();
            }


            elements.each(function () {
                // We only want to tween if the property data has a
                // matching animation id. If the ids don't match, that
                // means another animation has started which is modifying
                // this same property.

                var td = tween.getPropertyTweenData(this, tt, tween.property),
                    f,
                    v,
                    t,
                    valPre,
                    val;
                if (td.animationID !== tween.animationID) {
                    return;
                }

                fvs = td.fromValues;
                tvs = td.toValues;
                filters = tween.filter;

                cnt = fvs.length;
                results = [];

                for (i = 0; i < cnt; i += 1) {
                    f = fvs[i];
                    t = tvs[i];
                    v = undefined;
                    if (typeof f === "string") {
                        v = (easingConst === 0 && tween.duration > 0) ? f : t.value;
                    } else {
                        v = (f + ((t.value - f) * easingConst));
                    }
                    if (filters && filters[i]) {
                        v = filters[i](v, tween, this, prop, t.unit, elapsed);
                    }
                    if (typeof v === "number" && v < 1) {
                        // protect against exponential notation
                        v = v.toFixed(6);
                    }
                    results.push(v + t.unit);
                }

                valPre = tween.formatValuePre(results);
                val = tween.formatValue(results);

                tween.setValuePre.call(this, tt, prop, valPre);
                tween.setValue.call(this, tt, prop, val);
                tween.notifyObservers("onUpdate", { elapsed: elapsed, easingConst: easingConst, property: prop, value: val, element: this });
            });

        },
        parseValue: function (val) {
            if (!val || val.length < 2) {
                return;
            }
            if (typeof val === "string") {
                val = JSON.parse(val);
            }
            function getStopPosition(colorstops, index) {
                if (colorstops[index].length > 1) {
                    return colorstops[index][1];
                }

                var colorstopPosition;
                if (index === 0) { // If this color is the first color, then we know it's at position 0%
                    colorstopPosition = 0;
                } else if (index === colorstops.length - 1) { // If this color is the last color, then we know it's at position 100%
                    colorstopPosition = 100;
                } else { // If this color is in the middle, then we average the two adjacent stops
                    colorstopPosition = (getStopPosition(colorstops, index - 1) + getStopPosition(colorstops, index + 1)) / 2;
                }
                colorstops[index].push(colorstopPosition);

                return colorstopPosition;
            }

            var angle = null,
                colorstops = null,
                centerPoint = null,
                ellipse = null,
                extent = null,
                colorstopValues = [],
                repeating = false,
                i,
                values = [],
                gradientValueObj,
                parsedColor;

            if ($.isArray(val[1])) { // Linear Gradient
                angle = val[0];
                colorstops = val[1];
                if (val[2]) {
                    repeating = val[2];
                }
            } else { // Radial Gradient
                centerPoint = [val[0], val[1]];
                ellipse = val[2];
                extent = val[3];
                colorstops = val[4];
                if (val[5]) {
                    repeating = val[5];
                }
            }

            for (i = 0; i < (colorstops.length); i += 1) {
                parsedColor = Edge.Color.parseValue(colorstops[i][0], i);
                if (parsedColor) {
                    colorstopValues = colorstopValues.concat(parsedColor);
                    colorstopValues.push(getStopPosition(colorstops, i));
                }
            }

            gradientValueObj = {angle: angle, colorstops: colorstopValues, centerPoint: centerPoint, ellipse: ellipse, extent: extent, repeating: repeating};

            if (!gradientValueObj || !gradientValueObj.colorstops) {
                return;
            }

            if (gradientValueObj.angle !== null) {
                values = values.concat(gradientValueObj.angle);
            } else if (gradientValueObj.centerPoint) {
                values = values.concat(gradientValueObj.centerPoint);
                values = values.concat([gradientValueObj.ellipse, gradientValueObj.extent]);
            }
            values = values.concat(gradientValueObj.colorstops);

            return values.concat(gradientValueObj.repeating);
        },
        formatValue: function (values) {
            return Edge.formatGradient(values, false);
        },
        formatValuePre: function (values) {
            return Edge.formatGradient(values, true);
        }
    });

    Edge.GradientTween = GradientTween;

    Edge.Gradient = { parseValue: GradientTween.prototype.parseValue };

    Edge.formatGradient = function (values, isPrefixed) {
        if (!values) {
            return;
        }
        var formattedValue = "",
            colorstopIndex = null,
            i,
            firstIndex,
            numberOfColors;

        if (values.length % 5 === 2) { // Linear Gradient
            // [0] - angle
            // [1-n]*5 - color stops
            colorstopIndex = 1;

            formattedValue += "linear-gradient(";
            formattedValue += (isPrefixed ? values[0] : (450 - values[0]) % 360) + 'deg,';
        } else { // values.length % 5 == 4 // Radial Gradient
            colorstopIndex = 4;
            formattedValue += "radial-gradient(";
            if (isPrefixed) {
                formattedValue += values[0] + "% " + values[1] + "%," + (values[2] == 1 ? "ellipse" : "circle") + " " + values[3] + ",";
            } else {
                formattedValue += values[3] + " " + (values[2] == 1 ? "ellipse" : "circle") + " at " + values[0] + "% " + values[1] + "%,";
            }
        }

        // repeating
        if (values[values.length - 1] == 1) {
            formattedValue = "repeating-" + formattedValue;
        }

        // Format color stops
        if (values.length < 12 || (values.length - colorstopIndex - 1) % 5 !== 0) { // 1 for the angle, 4 per color and 1 for the stop x 2 colors = 11
            return;
        }

        numberOfColors = Math.floor((values.length - colorstopIndex - 1) / 5);
        for (i = 0; i < numberOfColors; i += 1) {
            firstIndex = i * 5 + colorstopIndex;
            formattedValue += Edge.Color.formatValue(values.slice(firstIndex, firstIndex + 4)); // format the color using the color-tween formatting code
            if (values[firstIndex + 4] !== -1) {
                formattedValue += " " + values[firstIndex + 4] + '%';
            } // add the stop
            if (i !== numberOfColors - 1) {
                formattedValue += ',';
            }
        }
        formattedValue += ")"; // close the gradient function

        return formattedValue;
    };


    Edge.Timeline.addTweenType("gradient", function (prop, ele, fromVal, toVal, opts) {
        return new GradientTween("gradient", prop, ele, fromVal, toVal, opts);
    });

    // Monkey patch for Prop's prep and apply methods
    function applyProp($ele, val) {
        var parsedValue,
            formattedValue,
            formattedValueStandard;
        if (typeof val === 'string') {
            return superApply.call(Edge._.p[cssProp], $ele, val);
        }
        parsedValue = Edge.Gradient.parseValue(val);
        formattedValueStandard = Edge.formatGradient(parsedValue, false);
        formattedValue = Edge.formatGradient(parsedValue, true);

        $ele.css(cssProp, '-webkit-' + formattedValue);
        $ele.css(cssProp, '-moz-' + formattedValue);
        $ele.css(cssProp, '-ms-' + formattedValue);
        $ele.css(cssProp, '-o-' + formattedValue);
        $ele.css(cssProp, formattedValueStandard);
    }

    function prepProp($ele, oN, nm, i, j, ii, comp) {
        return (oN[nm] == undefined || typeof oN[nm][i] === 'string') ? superPrep.call(Edge._.p[cssProp], $ele, oN, nm, i, j, ii, comp) : oN[nm][i]; // the gradient definition object
    }


    Edge._.p[cssProp].apply = applyProp;
    Edge._.p[cssProp].prep = prepProp;

    for (prop in propLookup) {
        if (propLookup.hasOwnProperty(prop)) {
            Edge.Timeline.addTweenProperty(prop, "gradient");
        }
    }

})(AdobeEdge);
/// Edge.motion-tween.js - version 0.2 - Edge Release 1.0
//
// Copyright (c) 2011. Adobe Systems Incorporated.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   * Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//   * Neither the name of Adobe Systems Incorporated nor the names of its
//     contributors may be used to endorse or promote products derived from this
//     software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

/***
 @name MotionTween
 @class Defines a tween that can animate an object along a path described by a cubic spline
 */

/*jslint plusplus: true */
/*global window: true */
/*global document: true */
(function (Edge) {
    "use strict";

    var $ = Edge.$,
        PropertyTween = Edge.PropertyTween,
        TransformTween = Edge.TransformTween,
        UpdateFinalizer = Edge.UpdateFinalizer;

    function originIncludesBorders() {
        var ele = document.createElement('div'),
            ele$ = $(ele),
            sOrigin,
            sOrigin2;
        if (document.body !== null) {
            document.body.appendChild(ele);
        }
        ele$.css("left", "-9999px").css("width", "100px");
        ele$.css("transform-origin", "50% 50%").css("-webkit-transform-origin", "50% 50%").css("-moz-transform-origin", "50% 50%").css("-ms-transform-origin", "50% 50%").css("-o-transform-origin", "50% 50%");

        sOrigin = ele$.css("transform-origin") || ele$.css("-webkit-transform-origin") || ele$.css("-moz-transform-origin") || ele$.css("-ms-transform-origin") || ele$.css("-o-transform-origin");
        ele$.css("border-width", "10px").css("border-style", "solid");
        sOrigin2 = ele$.css("transform-origin") || ele$.css("-webkit-transform-origin") || ele$.css("-moz-transform-origin") || ele$.css("-ms-transform-origin") || ele$.css("-o-transform-origin");

        if (ele.parentNode !== null) {
            ele.parentNode.removeChild(ele);
        }

        return sOrigin !== sOrigin2;
    }

    function MotionTween(tweenType, property, elements, path, keyframes, opts) {
        TransformTween.call(this, tweenType, 'motion', elements, undefined, undefined, opts);

        this.name = "motionTween";
        this.path = path;
        if (path && path.length > 1 && path[0].length < 6) {
            path[0][4] = path[0][5] = 0; // append lowerdx
            path[path.length - 1].splice(2, 0, 0, 0); // insert upperdx
        }
        this.keyframes = [];

        this.originIncludesBorders = originIncludesBorders();
    }

    function formatNumber(num) {
        if (num !== 0 && Math.abs(num) < 1e-6) {
            return num.toFixed(6);
        }
        return num.toString();
    }

    function cubic(s0, s1, b) {
        // see http://en.wikipedia.org/wiki/Hermite_curve
        // s = { x, y, upperdx/db, upperdy/db, lowerdx/db, lowerdy/db }
        try {
            if (s0[0] === s1[0] && s0[1] === s1[1]) {
                return { x: s1[0], y: s1[1] };
            }
        } catch (e) {
            //debugger;
        }

        var o = {},
            b2 = b * b,
            b3 = b2 * b,
            h00 = 2 * b3 - 3 * b2 + 1,
            h10 = b3 - 2 * b2 + b,
            h01 = -2 * b3 + 3 * b2,
            h11 = b3 - b2;
        /*  For comparison to article ref'd above:
            x0 = s0[0]
            y0 = s0[1]
            x1 = s1[0]
            y1 = s1[1]
            m0x = s0[2];
            m0y = s0[3];
            m1x = s1[4];
            m1y = s1[5];
         */
        o.x = h00 * s0[0] + h10 * s0[2] + h01 * s1[0] + h11 * s1[4];
        o.y = h00 * s0[1] + h10 * s0[3] + h01 * s1[1] + h11 * s1[5];
        return o;
    }

    function derivative(s0, s1, b) {

        // see http://en.wikipedia.org/wiki/Hermite_curve
        // LUA: s = { t, x, y, udx/dt, udy/dt, lowerdx, lowerdy }
        // s = { x, y, upperdx/db, upperdy/db, lowerdx/db, lowerdy/db }

        if (s0[0] === s1[0] && s0[1] === s1[1]) {
            return { dx: 0, dy: 0};
        }

        var o = {},
            b2 = b * b,
            h00 = 6 * b2 - 6 * b,
            h10 = 3 * b2 - 4 * b + 1,
            h01 = -6 * b2 + 6 * b,
            h11 = 3 * b2 - 2 * b,
            m0x = s0[2],
            m0y = s0[3],
            m1x = s1[4],
            m1y = s1[5];

        o.dx = h00 * s0[0] + h10 * m0x + h01 * s1[0] + h11 * m1x;
        o.dy = h00 * s0[1] + h10 * m0y + h01 * s1[1] + h11 * m1y;
        return o;
    }

    function distance2(pt1, pt2) {
        var dx = pt1.x - pt2.x,
            dy = pt1.y - pt2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function dot2(pt1, pt2) {
        return pt1.x * pt2.x + pt1.y * pt2.y;
    }

    function refinePoints(s0, s1, points, startIndex, tolerance) {
        var baseB = Math.floor(points[startIndex].b),
            b = (points[startIndex].b + points[startIndex + 1].b) / 2 - baseB,
            val = cubic(s0, s1, b),
            linearPoint = {x : (points[startIndex].x + points[startIndex + 1].x) / 2, y : (points[startIndex].y + points[startIndex + 1].y) / 2},
            inserted = 0;

        if (distance2(linearPoint, val) > tolerance) {
            // subdivide and recurse
            val.b = b + baseB;
            points.splice(startIndex + 1, 0, val);
            inserted = refinePoints(s0, s1, points, startIndex + 1, tolerance);
            inserted = inserted + refinePoints(s0, s1, points, startIndex, tolerance) + 1;
        }
        return inserted;
    }

    function createEasingTable(points) {
        //console.log("createEasingTable called")
        // convert points of a curve in (0,0)-(1,1) to be a lookup table from t to easing value
        var minStep = 1, i, t, numSteps, step, easingTable, index, e;

        for (i = 0; i < points.length - 1; i++) {
            if (points[i + 1].x - points[i].x > 0) {
                minStep = Math.min(minStep, points[i + 1].x - points[i].x);
            }
        }
        numSteps = Math.ceil(1 / minStep);
        step = 1 / numSteps;
        easingTable = [];
        index = 0;

        easingTable[0] = {t : 0, e : 0};

        for (i = 0; i < numSteps; i++) {
            t = i * step;
            while (t > points[index + 1].x && index < points.length - 2) {
                index++;
            }
            e = points[index + 1].y;
            if ((points[index + 1].x - points[index].x) > 0) {
                e = points[index].y + (t - points[index].x) * (points[index + 1].y - points[index].y) / (points[index + 1].x - points[index].x);
            }
            easingTable[i] = {t : t, e : e};
            // compare to easeinoutquad
            //easingTable[i + 1].eioq = Easing.easeInOutQuad(t, t, 0, 1, 1)
        }
        if (easingTable[easingTable.length - 1].t < 1) {
            easingTable[easingTable.length] = {t : 1, e : 1};
        }
        return easingTable;
    }

    function isStraightLine(points, toleranceInRadians) {
        var len = distance2(points[points.length - 1], points[0]),
            i,
            pt1,
            dot,
            denom,
            pt2 = {x: points[points.length - 1].x - points[0].x, y: points[points.length - 1].y - points[0].y};
        for (i = 1; i < points.length - 1; i++) {
            pt1 = {x: points[i].x - points[0].x, y: points[i].y - points[0].y};
            dot = dot2(pt1, pt2);
            denom = len * distance2(points[i], points[0]);
            if (Math.abs(Math.acos(dot / denom)) > toleranceInRadians) {
                return false;
            }
        }
        return true;
    }

    function setUpEasings(aKfs) {
        var i, j, k, s0, s1, points, b, o, val;
        for (i = 0; i < aKfs.length - 1; i++) {
            // convert from bezier to hermite
            s0 = [0, 0, aKfs[i].upper.x * 3, aKfs[i].upper.y * 3, aKfs[i].lower.x * 3, aKfs[i].lower.y * 3];
            s1 = [1, 1, aKfs[i + 1].upper.x * 3, aKfs[i + 1].upper.y * 3, (1 - aKfs[i + 1].lower.x) * 3, (1 - aKfs[i + 1].lower.y) * 3];
            points = [];

            for (j = 0; j < 5; j++) {
                b = j / 4;
                o = { b: b };
                val = cubic(s0, s1, b);
                o.x = val.x;
                o.y = val.y;
                o.b = b;
                points[j] = o;
            }
            if (isStraightLine(points, 0.005)) {
                // discard unneeded intermediate points
                points.splice(1, 3);
            } else {
                for (j = 0; j < 4; j++) {
                    k = 3 - j;
                    refinePoints(s0, s1, points, k, 0.01);
                }
            }
            aKfs[i].easingTable = createEasingTable(points);
        }
    }

    $.extend(MotionTween.prototype, TransformTween.prototype);
    $.extend(MotionTween.prototype, {

        constructor: MotionTween,

        /*setValue: use the inherited one from TransformTween */
        getValue: function (prop, tt) {
        },
        setupForAnimation: function () {
            //this.duration = this.path[this.path.length-1][0];
            TransformTween.prototype.setupForAnimation.call(this);
            if (!this.points) {
                this.setUpPoints();
                this.setUpLen2bMap();
                setUpEasings(this.keyframes);
            }

            if (!this.deltas && !window.edge_authoring_mode) {
                this.getElementSet().each(function () {
                    var $this = $(this),
                        propX = Edge.$.data(this, "p_x") || "left",
                        propY = Edge.$.data(this, "p_y") || "top",
                        parentEle = this.parentElement,
                        $parent = $(parentEle),
                        deltaX = +parseFloat($this.css(propX)) || 0,
                        deltaY = +parseFloat($this.css(propY)) || 0;

                    if (Edge.$.data(this, "u_x") === "%") {
                        deltaX = (deltaX / 100) * +$parent.width();
                    }
                    if (Edge.$.data(this, "u_y") === "%") {
                        deltaY = (deltaY / 100) * +$parent.height();
                    }

                    Edge.$.data(this, "deltaX", deltaX);
                    Edge.$.data(this, "deltaY", deltaY);
                    $this.css(propX, "0px").css(propY, "0px");
                });
                this.deltas = true;
            }

            var firstT = this,
                dxy0;

            while (firstT._prevObj) {
                //ignore "filler" transitions
                if (firstT._prevObj.path.length == 2 && (firstT._prevObj.path[0][0] === firstT._prevObj.path[1][0] && firstT._prevObj.path[0][1] === firstT._prevObj.path[1][1])) {
                    break;
                }
                firstT = firstT._prevObj;
            }

            dxy0 = derivative(firstT.path[0], firstT.path[1], 0.000001);
            this.deltaRotate = Math.atan2(dxy0.dx, dxy0.dy) * 180 / Math.PI;

        },
        computeEasing: function (ms) {
            var aKfs = this.keyframes,
                t = ms / this.getDuration(),
                index = 0,
                i,
                easingTable,
                segLen,
                segDuration,
                tableIndex,
                e;

            for (i = 0; i < aKfs.length - 1; i++) {
                index = i;
                if (t <= aKfs[i + 1].t) {
                    break;
                }
            }
            easingTable = aKfs[index].easingTable;
            segLen = aKfs[index + 1].l - aKfs[index].l;
            segDuration = aKfs[index + 1].t - aKfs[index].t;

            // lookup e in the table, interpolating linearly
            t = (t  - aKfs[index].t) / segDuration;
            tableIndex = Math.floor(t / (easingTable[1].t - easingTable[0].t));
            tableIndex = Math.min(easingTable.length - 2, Math.max(tableIndex, 0));
            // e is easing per segment
            e = easingTable[tableIndex].e + (t - easingTable[tableIndex].t) * (easingTable[tableIndex + 1].e - easingTable[tableIndex].e) / (easingTable[tableIndex + 1].t - easingTable[tableIndex].t);
            return aKfs[index].l + e * segLen;
        },
        originInPx: function (ele$) {

            var sOrigin,
                aOrigin,
                oOrigin = {},
                w = ele$.width(),
                h = ele$.height(),
                bdlW,
                bdtW,
                originXp,
                originYp;
            sOrigin = ele$.css("transform-origin") || ele$.css("-webkit-transform-origin") || ele$.css("-moz-transform-origin") || ele$.css("-ms-transform-origin") || ele$.css("-o-transform-origin") || "50% 50%";

            aOrigin = sOrigin.split(" ");
            if (aOrigin[0].indexOf("%") > 0) {
                originXp = parseFloat(aOrigin[0].substring(0, aOrigin[0].length - 1)) / 100;
                originYp = parseFloat(aOrigin[1].substring(0, aOrigin[1].length - 1)) / 100;
                oOrigin.x = w * originXp;
                oOrigin.y = h * originYp;
            } else {
                //already in pixels...
                oOrigin.x = parseFloat(aOrigin[0].substring(0, aOrigin[0].length - 2));
                oOrigin.y = parseFloat(aOrigin[1].substring(0, aOrigin[1].length - 2));
            }

            if (!this.originIncludesBorders) {
                originXp = originXp || oOrigin.x / w;
                originYp = originYp || oOrigin.y / h;

                //adjust for border
                bdlW = Edge.splitUnits(ele$.css("border-left-width")).num + Edge.splitUnits(ele$.css("border-right-width")).num || 0;
                bdlW = bdlW * originXp;
                bdtW = Edge.splitUnits(ele$.css("border-top-width")).num + Edge.splitUnits(ele$.css("border-bottom-width")).num || 0;
                bdtW = bdtW * originYp;
                oOrigin.x += bdlW;
                oOrigin.y += bdtW;
            }

            return oOrigin;
        },

        update: function (elapsed, easingConst, context) {

            if (!this.updateTriggered) {
                this.updateTriggered = true;
                this.setupForAnimation(context);
            }

            var elements = this.getElementSet(context),
                tween = this,
                prop = this.property,
                tt = this.tweenType,
                e = easingConst,
                seg = this.findSegment(e),
                path = this.path,
                b = this.easeToB(e),
                len = this.points[this.points.length - 1].l,
                deltaB,
                angle,
                overshoot;

            b = b - seg;
            b = Math.min(1.0, Math.max(0, b));
            deltaB = Math.max(0.000001, Math.min(0.999999, b));

            var o = cubic(path[seg], path[seg + 1], b),
                deltaXY = derivative(path[seg], path[seg + 1], deltaB),
                rotation1 = Math.atan2(deltaXY.dx, deltaXY.dy) * 180 / Math.PI,
                rotation,
                skipRotation;

            if (this._prevObj && path.length === 2 && path[0][0] === path[1][0] && path[0][1] === path[1][1]) {
                skipRotation = true;
                rotation = 0;//we don't know what it really is, this path shouldn't change it
            } else {
                rotation = (this.deltaRotate - rotation1);
            }

            if (e < 0 || e > 1) {
                angle = Math.atan2(deltaXY.dy, deltaXY.dx);
                overshoot = (e > 1) ? e - 1 : e;
                o.x += Math.cos(angle) * len * overshoot;
                o.y += Math.sin(angle) * len * overshoot;
            }

            elements.each(function () {
                // We only want to tween if the property data has a
                // matching animation id. If the ids don't match, that
                // means another animation has started which is modifying
                // this same property.

                var $this = $(this),
                    oOrigin,
                    td = tween.getPropertyTweenData(this, tt, prop),
                    data = Edge.$.data(this, TransformTween.dataName),
                    parentEle = this.parentElement,
                    $parent,
                    parentW,
                    parentH;

                data.tween = tween;

                if (td.animationID !== tween.animationID) {
                    return;
                }

                oOrigin = tween.originInPx($this);

                //step 1: calculate the offset of the origin point from the corner
                var propX = Edge.$.data(this, "p_x") || "left",
                    propY = Edge.$.data(this, "p_y") || "top",
                    valX = o.x,
                    valY = o.y,
                    uX = Edge.$.data(this, "u_x") || "px",
                    uY = Edge.$.data(this, "u_y") || "px",
                    deltaX = /*Edge.$.data(this, "deltaX") ||*/ 0,
                    deltaY = /*Edge.$.data(this, "deltaY") ||*/ 0,
                    //pushToTranslate = !window.edge_authoring_mode || !Edge.$.data(this, "domDef"),
                    pushToTranslate = !window.edge_authoring_mode,
                    doAutoRotate = Edge.$.data(this, "doAutoOrient");

                doAutoRotate = doAutoRotate === "true" ? true : doAutoRotate === "false" ? false : doAutoRotate;

                if (pushToTranslate) {

                    $parent = $(parentEle);
                    parentW = $parent.width();
                    parentH = $parent.height();

                //if in % then we need to calculate value in px
                    if (uX === "%") {
                        valX = (valX / 100.0) * parentW;
                    }
                    if (uY === "%") {
                        valY = (valY / 100.0) * parentH;
                    }
                }

                valX = valX + (propX === "right" ? oOrigin.x : -1 * oOrigin.x);
                valY = valY + (propY === "bottom" ? oOrigin.y : -1 * oOrigin.y);

                if (pushToTranslate) {
                    valX = valX + deltaX;
                    valY = valY + deltaY;
                }

                valX = formatNumber(valX);
                valY = formatNumber(valY);

                if (!skipRotation) {
                    if (!doAutoRotate) {
                        rotation = 0;
                    }
                    rotation = Math.abs(rotation) > .01 ? rotation: 0; // Handle tiny numbers that might go to exp notation

                    Edge.$.data(this, "motionRotateZ", rotation + "deg");
                    tween.setValue.call(this, undefined, "motionRotateZ", rotation + "deg");
                    UpdateFinalizer.Register(tween.timeline, data.id, data);
                }

                if (!pushToTranslate) {
                    $(this).css(propX, valX + uX);
                    tween.notifyObservers("onUpdate", { elapsed: elapsed, easingConst: easingConst, property: propX, value: valX + uX, element: data.tween });
                    $(this).css(propY, valY + uY);
                    tween.notifyObservers("onUpdate", { elapsed: elapsed, easingConst: easingConst, property: propY, value: valY + uY, element: this });
                } else {
                    tween.setValue.call(this, undefined, "motionTranslateX", valX + "px");
                    tween.setValue.call(this, undefined, "motionTranslateY", valY + "px");
                    UpdateFinalizer.Register(tween.timeline, data.id, data);
                }
            });

        },
        findSegment : function (e) {
            var b = this.len2b(e * this.points[this.points.length - 1].l);
            b = Math.floor(b);
            return Math.min(Math.max(b, 0), this.path.length - 2);
        },
        // Return the b value for whole curve
        easeToB : function (e) {
            return this.len2b(e * this.points[this.points.length - 1].l);
        },
        setUpLen2bMap : function () {
            var len = 0,
                i,
                index = 0,
                totalLength,
                numTicks = (this.getDuration() * 60) / 1000.0,
                lenPerTick,
                len2bMap = this.len2bMap = [],
                points = this.points,
                b;

            for (i = 0; i < points.length - 1; i++) {
                points[i].l = len;
                len = len + distance2(points[i], points[i + 1]);
            }
            points[points.length - 1].l = len;
            totalLength = len;
            lenPerTick = totalLength / numTicks;
            this.len2bStep = lenPerTick;

            len = 0;
            i = 0;
            if (totalLength > 0) {
                while (len <= totalLength) {
                    while (i < points.length - 1 && len > points[i + 1].l) {
                        i = i + 1;
                    }
                    if (i >= points.length - 1) {
                        break;
                    }
                    // assume samples are dense enough to do linear interpolation
                    b = points[i].b + (len - points[i].l) * (points[i + 1].b - points[i].b) / (points[i + 1].l - points[i].l);
                    len2bMap.push({l: len, b: b});

                    len = len + lenPerTick;
                }
                if (len2bMap[len2bMap.length - 1].b < points[points.length - 1].b) {
                    len2bMap.push({l: points[points.length - 1].l, b: points[points.length - 1].b});
                }
            } else {
                // Special case for 0 length
                len2bMap.push({l: 0, b: points[0].b});
            }
        },

        setUpPoints: function () {
            var curve = this.path,
                tolerance = 2,
                i,
                j,
                k,
                b,
                o,
                val,
                seg;

            this.points = [];

            for (i = 0; i < curve.length - 1; i++) {
                for (j = 0; j < 5; j++) {
                    if (j < 4 || i === curve.length - 2) {
                        b = j / 4;
                        o = { b: i + b };
                        val = cubic(curve[i], curve[i + 1], b);
                        o.x = val.x;
                        o.y = val.y;

                        this.points.push(o);
                    }
                }
            }
            for (i = 1; i < curve.length; i++) {
                seg = curve.length - i - 1;
                for (j = 0; j < 4; j++) {
                    k = 3 - j + seg * 4;
                    refinePoints(curve[seg], curve[seg + 1], this.points, k, tolerance);
                }
            }
            return this.points;
        },

        len2b: function (len) {
            if (!this.len2bMap) {
                this.setUpLen2bMap();
            }

            var len2bMap = this.len2bMap,
                index = Math.min(Math.max(0, Math.floor(len / this.len2bStep)), this.len2bMap.length - 2),
                b;

            if (len2bMap.length === 0) {
                return 0;
            }
            if (len2bMap.length === 1) {
                return len2bMap[0].b;
            }
            b = (len - len2bMap[index].l) * (len2bMap[index + 1].b - len2bMap[index].b) / (len2bMap[index + 1].l - len2bMap[index].l) + len2bMap[index].b;

            return b;
        }
    });

    Edge.MotionTween = MotionTween;
    Edge.Timeline.addTweenType("motion", function (prop, ele, fromVal, toVal, keyframes, opts) {
        return new MotionTween("motion", prop, ele, fromVal, toVal, keyframes, opts);
    });
    Edge.Timeline.addTweenProperty("motion", "motion");
    Edge.Timeline.addTweenProperty("location", "motion");

})(AdobeEdge);
/**
 * Adobe Edge Animate - Symbol Dynamic Extensions
 * Supports apis to create, delete child instances
 * Requires an.symbol.js and an.event.js
 */

/*jslint plusplus:true, nomen: true*/
/*global window: false, document: false, CustomEvent: false, HTMLElement: false, console:false, alert: false */

(function (Edge) {

    "use strict";

    var $ = Edge.$,
        An$ = Edge.An$,
        Symbol = Edge.Symbol,
        Composition = Edge.Composition,
        Notifier = Edge.Notifier;

    function addChildSymbol(parent, sym) {
        var instances = parent.ci = parent.ci || [];
        instances.push(sym);
    }

    function createSymbolChild(comp, sym, symbolName, parentSelector, index, variables) {

        if (!symbolName || !parentSelector) {
            return;
        }
        if (!comp || !comp._s || !comp.sym || !comp.sym[symbolName]) {
            return;
        }
        var createdInstances = [],
            $parentSelector,
            i;
        if(typeof parentSelector == 'object') {
            $parentSelector = parentSelector;
        } else {
            $parentSelector = sym.find$(parentSelector);
            if(!$parentSelector) {
                $parentSelector = sym.$(parentSelector);
            }
        }
        $parentSelector.each(function () {
            var $this = $(this),
                newEle = document.createElement('div'),
                $children = $this._children(),
                autoPlayTimelines,
                opts = {},
                autoPlay,
                symbInstance,
                parentSym;
            //opts.variables = variables;
            parentSym = Symbol.getParentSymbol(this, true);
            symbInstance = new Symbol(comp.sym, symbolName, comp, parentSym, variables);
            if (symbInstance) {
                if ((index || index === 0) && $this._children().eq(index)[0]) {
                    if (index < 0) {
                        $children.get(index).insertAfter(newEle);
                    } else {
                        $children.get(index).insertBefore(newEle);
                    }
                } else {
                    $this.append(newEle);
                }

                symbInstance.opts = symbInstance.opts || {};
                $.extend(symbInstance.opts, opts);
                symbInstance.init(newEle);
                symbInstance._applyBaseStyles($(newEle), symbolName);
                if (typeof autoPlay === 'boolean') {
                    symbInstance.setAutoPlay(autoPlay);
                }

                //go through and display any of the items that are supposed to be displayed
                // Is this still necessary ?? jwd 3.4.13
                //comp.instanceReady(symbInstance);

                addChildSymbol(parentSym, symbInstance);
                createdInstances.push(symbInstance);
            }
        });

        if (comp.readyCalled) {
            createdInstances.forEach(function (sym) {
                Composition._playAuto(sym, true);
                //Set the position as relative for the main element
                sym.getSymbolElement().css("position", "relative");
            });
        }
        return createdInstances;
    }


    // remove all instances of an object/element from an array
    function removeFromArray(ary, o) {
        var i, id = o.getSymbolElementNode().id;
        for (i = ary.length - 1; i >= 0; i--) {
            if (ary[i].getSymbolElementNode().id === id) {
                ary.splice(i, 1);
            }
        }
    }

    // Remove a symbol from comp and parent, and break its back-refs
    function removeSymbol(sym) {
        // Remove from comp and parent lists, along with back pointers
        if (sym.prnt && sym.prnt.ci) {
            removeFromArray(sym.prnt.ci, sym);
        }
        removeFromArray(sym.composition._s, sym);
        sym.composition = undefined;
        sym.prnt = undefined;
    }

    function parents(ele, result) {
        result = result || [];
        var p = ele.parentNode;
        if (ele && ele.nodeType === 1) {
            result.push(p);
            parents(p, result);
        }
        return result;
    }

    function children(ele, result) {
        result = result || [];
        var c = ele.firstElementChild;
        while (c) {
            result.push(c);
            c = c.nextElementSibling;
        }
        return result;
    }

    $.extend(An$.prototype, {
        _parents: function () {
            // We hide this because it's not as full featured as the jquery one
            // We don't support an optional selector arg to filter by
            var result = [];
            this.each(function (i, ele) {
                parents(ele, result);
            });
            return $(result);
        },
        _children: function () {
            // We hide this because it's not as full featured as the jquery one
            // We don't support an optional selector arg to filter by
            var result = [];
            this.each(function (i, ele) {
                children(ele, result);
            });
            return $(result);
        },
        eq: function (index) {
            return $(this[index]);
        },
        append: function (ele) {
            var $ele = $(ele),
                self = this;
            $ele.each(function (i, e) {
                self.each(function (j, selfEle) {
                    selfEle.appendChild(e);
                });
            });
        }
    });

    Symbol.getParentSymbol = function (ele, includeSelf) {
        var $ele = $(ele),
            parents = $ele._parents(),
            parentLen = parents.length,
            i,
            sym;

        sym = Symbol.getSymbol($ele[0]);
        if (sym && includeSelf) {
            return sym;
        }
        for (i = 0; i < parentLen; i++) {
            sym = Symbol.getSymbol(parents[i]);
            if (sym) {
                return sym;
            }
        }
        return null;
    };

    function createSymbolEvent(eventName, sym, opts) {
        var e = $.Event(eventName);
        $.extend(e, { Symbol: sym, element: sym.ele, performDefaultAction: true });
        if (opts) {
            $.extend(e, opts);
        }
        return e;
    }

    $.extend(An$.prototype, {
        //TODO add removeEventListener to these when we start adding them for events
        empty: function () {
            var index,
                node,
                ele;
            this.each(function (index, ele) {
                node = ele.firstChild;
                while (node) {
                    ele.removeChild(node);
                    node = ele.firstChild;
                }
            });
        },
        remove: function () {
            var index,
                ele,
                parent;
            this.empty();
            this.each(function (index, ele) {
                parent = ele.parentNode;
                if (parent) {
                    parent.removeChild(ele);
                }
            });
        }
    });
    // Remove this instance from its element
    // and the global list of instances. It will be eligible for gc as soon
    // as user code lets go of references.
    function deleteSymbol(sym, opts) {
        opts = opts || {};
        var symbolInstances = sym.composition ? sym.composition._s : null,
            i,
            instLen,
            instanceSelector,
            evt = createSymbolEvent('beforeDeletion', sym, {  }),
            parentSymbol,
            sel,
            ele,
            childInstances = sym.ci,
            len,
            child;

        if (!symbolInstances) {
            return;
        }

        sym.notifyObservers('beforeDeletion', evt);
        if (!evt.performDefaultAction) {
            return;
        }

        sym.stop(0);

        // Remove all nested symbol instances
        if (childInstances) {
            instLen = childInstances.length;
            while (childInstances.length > 0) {
                deleteSymbol(childInstances[0], opts); // was comp.removeSymbol
            }
        }

        removeSymbol(sym);
        ele = sym.ele;
        Symbol.setSymbol($(ele)[0], undefined);

        if (opts._keepElement) {
            $(ele).empty();
        } else {
            $(ele).remove();
        }

        sym.tlCached = null;
        sym.ele = null;
        sym.removeObservers();
    }

    function createEvent(sym, eventName, opts) {
        var evt = $.Event(eventName);

        $.extend(evt, { Symbol: sym, element: sym.ele, performDefaultAction: true });
        $.extend(evt, opts);
        return evt;
    }

    function notifyVariableBindings(sym, varName) {
        if (!varName) {
            return;
        }
        // process bindings
        var value = sym.getVariable(varName),
            eventName = "variableChanged:" + varName,
            evt = createEvent(sym, eventName, {variableValue: value});
        sym.notifyObservers(eventName, evt);
    }


    $.extend(Symbol.prototype, {
        deleteSymbol: function (opts) {
            return deleteSymbol(this, opts);
        },
        createChildSymbol: function (symbolName, parentSelector, index, variables) {
            if (!symbolName || !parentSelector) {
                return;
            }
            var parentEle,
                aSymbolInstances,
                self = this;;
            if(typeof parentSelector == 'object') {
                parentEle = parentSelector;
            } else {
                parentEle = this.find$(parentSelector);
                if(!parentEle) {
                    parentEle = this.$(parentSelector);
                }
            }

            if (!parentEle || !parentEle[0]) {
                return;
            }

            aSymbolInstances = createSymbolChild(this.composition, this, symbolName, parentSelector, index, variables);
            if (aSymbolInstances) {
                aSymbolInstances.forEach(function (val) {
                    //addChildSymbol(self, val);
                });
                return aSymbolInstances[0];
            }
        },
        /**
         Get a variable from this instance
         @name getVariable
         @memberOf Edge.Symbol.prototype
         @function
         @param {string} variable Name of the variable to fetch.
         @return The value of the variable.
         */
        getVariable: function (varName) {
            return this.variables[varName];
        },

        /**
         Set a variable on this instance
         @name setVariable
         @memberOf Edge.Symbol.prototype
         @function
         @param {string} variable Name of the variable to set. The variable does not have to be predefined by the Symbol.
         @param value The value to set
         */
        setVariable: function (varName, value) {
            this.variables[varName] = value;
            if (window.edge_authoring_mode) {
	            this._variables[varName] = value;
			}
            // process bindings
            notifyVariableBindings(this, varName);
            return this;
        },

        getSymbol: function (selector) {
            var $ele = this.$(selector);
            return Symbol.getSymbol($ele);
        },

        getParentSymbol: function () {
            return Symbol.getParentSymbol(this.ele, false);
        },

        getChildSymbols: function () {
            return this.ci ? this.ci.slice(0) : [];    //return a copy
        },

        playAll: function () {
        	this.play();
        	var childSymbols = this.getChildSymbols();
        	for(var i=0; i<childSymbols.length; i++) {
        	   childSymbols[i].playAll(); // play all of the children
        	}
        	return;
        },

        stopAll: function (ms, executeTriggers) {
        	this.stop(ms, executeTriggers);
        	var childSymbols = this.getChildSymbols();
        	for(var i=0; i<childSymbols.length; i++) {
        	   childSymbols[i].stopAll(ms, executeTriggers); // stop all of the children
        	}
        	return;
        },

        /**
        Get the corresponding DOM element node for this Symbol
        @memberOf Edge.Symbol.prototype
        @function
        @return The DOM element node corresponding to this instance.
        @deprecated Use getSymbolElement instead
        */
        getSymbolElementNode: function () {
            return this.ele;
        },

        /**
        Get the corresponding wrapper element object for this Symbol
        @memberOf Edge.Symbol.prototype
        @function
        @return The jQuery element object corresponding to this instance.
        */
        getSymbolElement: function () {
            return Edge.$(this.ele);
        },

        // Used in commands inserted in generated file
        _executeMediaAction: function (e, data) {
            if (typeof data !== "object" || data.length < 3) {
                return;
            }

            var actionFunction = data[0];
            var medInstanceSelector = data[1];
            var medInstance = this.$(medInstanceSelector)[0];
            if (!medInstance || !actionFunction) {
                return;
            }

            var args = data[2];
            if (!args || typeof args !== "object") {
                args = null;
            }

            if (actionFunction === "play") {
                if (args && args.length > 0 && typeof args[0] === "number") {
                    medInstance.currentTime = args[0];
                }
                medInstance.play();
            }
            else if (actionFunction === "pause") {
                medInstance.pause();
            }
        },
        // Used in commands inserted in generated file
        _executeSymbolAction: function (e, data) {
            if (typeof data !== "object" || data.length < 3) {
                return;
            }

            var actionFunction = data[0];
            var symInstanceSelector = data[1];
            var symInstance = Edge.Symbol.get(this.$(symInstanceSelector));
            if (!symInstance || !actionFunction) {
                return;
            }

            var args = data[2];
            if (!args || typeof args !== "object") {
                args = null;
            }

            symInstance[actionFunction].apply(symInstance, args);
        },
        //Alias for _executeSymbolAction used when writing minified content
        eMA: function (e, data) {
            this._executeMediaAction(e, data);
        }
    });

    /**
    Get a parameter of this instance
    @name getParameter
    @memberOf Edge.Symbol.prototype
    @function
    @param {string} param Name of the parameter to fetch.
    @return The value of the parameter.
    @deprecated Use sym.getVariable instead.
    */
    Symbol.prototype.getParameter = Symbol.prototype.getVariable;

    /**
    Set a parameter this instance
    @name setParameter
    @memberOf Edge.Symbol.prototype
    @function
    @param {string} param Name of the parameter to set. The parameter does not have to be predefined by the Symbol.
    @param value The value to set
    @deprecated Use sym.setVariable instead
    */
    Symbol.prototype.setParameter = Symbol.prototype.setVariable;

    $.extend(Composition.prototype, {
        createSymbolChild: function (symbolName, parentSelector, index, variables) {
            return createSymbolChild(this, this.stage, symbolName, parentSelector, index, variables);
        },
        removeSymbol: function (sSelector, opts) {
            if (!this.symbolInstances) {
                return;
            }

            var symInstance = Symbol.get(sSelector);
            if (symInstance) {
                symInstance.deleteSymbol(opts);
            }
        }
    });
}(AdobeEdge));
/* jshint ignore:end */

/* starthack */
module.exports = AdobeEdge;
/* endhack */
