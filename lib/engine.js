// Generated by IcedCoffeeScript 1.3.3a
(function() {
  var engine, fs, path, view,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  view = require('./view').view;

  fs = require('fs');

  path = require('path');

  engine = (function() {

    function engine(options) {
      this._inlineInclude = __bind(this._inlineInclude, this);
      this.viewCache = {};
      this.lastCacheReset = Date.now();
      this.maxCacheAge = 100;
    }

    engine.prototype.run = function(filename, options, cb) {
      /*
          "options" contains the pub vars
          may also contain special items:
            __dir: path to look relative to
      */

      var err, res, _ref;
      _ref = this.runSync(filename, options), err = _ref[0], res = _ref[1];
      return cb(err, res);
    };

    engine.prototype.runSync = function(filename, options) {
      /*
          returns [err, res];
          "options" the same as run() above
      */

      var err, pwd, realpath, res, v, view_options, _ref,
        _this = this;
      options = options || {};
      options.__dir = options.__dir || process.cwd();
      filename = "" + options.__dir + "/" + filename;
      realpath = filename;
      pwd = path.dirname(realpath);
      if (Date.now() - this.lastCacheReset > this.maxCacheAge) this._resetCache();
      v = this.viewCache[filename] || this._loadAndCache(filename, options);
      if (v) {
        view_options = {
          include_fn: function(fname, lvars) {
            return _this._inlineInclude(fname, lvars, realpath);
          },
          parent: filename
        };
        _ref = v.run(options, view_options), err = _ref[0], res = _ref[1];
        return [err, res];
      } else {
        return ["Couldn't load " + filename, null];
      }
    };

    engine.prototype._inlineInclude = function(filename, local_vars, parent_realpath) {
      var err, options, res, _ref;
      options = local_vars || {};
      options.__dir = path.dirname(parent_realpath);
      options.__parent = parent_realpath;
      _ref = this.runSync(filename, options), err = _ref[0], res = _ref[1];
      if (err) {
        return err;
      } else {
        return res;
      }
    };

    engine.prototype._loadAndCache = function(filename, options) {
      var txt, v;
      try {
        txt = fs.readFileSync(filename, 'utf-8');
      } catch (e) {
        txt = "Error: Could not read " + filename;
        if (options.__parent != null) txt += " requested in " + options.__parent;
      }
      v = new view(txt);
      this.viewCache[filename] = v;
      return v;
    };

    engine.prototype._resetCache = function() {
      this.viewCache = {};
      return this.lastCacheReset = Date.now();
    };

    return engine;

  })();

  exports.engine = engine;

}).call(this);