// Alex Bosworth: merged 2 libs together!

/*
 * util.js
 *  - utility helper functions for querystring module
 *
 * Chad Etzel
 *
 * Copyright (c) 2009, Yahoo! Inc. and Chad Etzel
 * BSD License (see LICENSE.md for info)
 *
 */

function is (type, obj) {
  return Object.prototype.toString.call(obj) === '[object '+type+']';
}

function isArray (obj) {
  return is("Array", obj);
}

function isObject (obj) {
  return is("Object", obj);
}

function isString (obj) {
  return is("String", obj);
}

function isNumber (obj) {
  return is("Number", obj);
}

function isBoolean (obj) {
  return is("Boolean", obj);
}

function isNull (obj) {
  return typeof obj === "object" && !obj;
}

function isUndefined (obj) {
  return typeof obj === "undefined";
}

/*
 * querystring-stringify.js
 *   - node.js module providing 'stringify' method for converting objects to query strings.
 *
 * Chad Etzel
 *
 * Based on YUI "querystring-stringify.js" module
 * http://github.com/isaacs/yui3/tree/master/src/querystring/js
 *
 * Copyright (c) 2009, Yahoo! Inc. and Chad Etzel
 * BSD License (see LICENSE.md for info)
 *
 */

/**
 * <p>Converts an arbitrary value to a Query String representation.</p>
 *
 * <p>Objects with cyclical references will trigger an exception.</p>
 *
 * @method stringify
 * @param obj {Variant} any arbitrary value to convert to query string
 * @param sep {String} (optional) Character that should join param k=v pairs together. Default: "&"
 * @param eq  {String} (optional) Character that should join keys to their values. Default: "="
 * @param name {String} (optional) Name of the current key, for handling children recursively.
 * @param escape {Function} (optional) Function for escaping. Default: encodeURIComponent
 */
 
var stack = [];
 
exports.stringify = function(obj, sep, eq, name, escape) {
    sep = sep || "&";
    eq = eq || "=";
    escape = escape || encodeURIComponent;
  
    if (isNull(obj) || isUndefined(obj) || typeof(obj) === 'function') {
        return name ? escape(name) + eq : '';
    }
  
    if (isBoolean(obj)) obj = +obj;
    
    if (isNumber(obj) || isString(obj)) {
        return escape(name) + eq + escape(obj);
    }  
    
    if (isArray(obj)) {
        var s = [];
        name = name+'[]';
        for (var i = 0, l = obj.length; i < l; i ++) {
            s.push( exports.stringify(obj[i], sep, eq, name, escape) );
        }
        return s.join(sep);
    }
  
    // Check for cyclical references in nested objects
    for (var i = stack.length - 1; i >= 0; --i) if (stack[i] === obj) {
        throw new Error("querystring. Cyclical reference");
    }
  
    stack.push(obj);
  
    var s = [];
    var begin = name ? name + '[' : '';
    var end = name ? ']' : '';
    for (var i in obj) if (obj.hasOwnProperty(i)) {
        var n = begin + i + end;
        s.push(exports.stringify(obj[i], sep, eq, n, escape));
    }
  
    stack.pop();
  
    s = s.join(sep);

    if (!s && name) return name + "=";

    return s;
};

/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str) {
  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      var pair = decodeURIComponent(pair.replace(/\+/g, ' '))
        , eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , obj = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(obj, parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            parent[key] = val;
          // array
          } else if (']' == part) {
            obj = parent[key] = Array.isArray(parent[key])
              ? parent[key]
              : [];
            if ('' != val) obj.push(val);
          // prop
          } else if (~part.indexOf(']')) {
            part = part.substr(0, part.length - 1);
            parse(obj[part] = obj[part] || {}, parts, obj, part);
          // key
          } else {
            parse(obj[part] = obj[part] || {}, parts, obj, part);
          }
        }

        parse(obj, parts);
      // optimize
      } else {
        set(obj, key, val);
      }

      return ret;
    }, {});
};

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (Array.isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}