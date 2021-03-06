// Generated by CoffeeScript 1.4.0
(function() {
  var TAB_SPACES, coffee, errorHandler, errorTypes, getBundleHeaders, getCommonHeaders, getCommonHeadersJs, minimizeJs, parser, states, toffeeError, utils, view, vm, _ref, _ref1;

  parser = require('./toffee_lang').parser;

  _ref = require('./errorHandler'), errorHandler = _ref.errorHandler, toffeeError = _ref.toffeeError, errorTypes = _ref.errorTypes;

  _ref1 = require('./consts'), states = _ref1.states, TAB_SPACES = _ref1.TAB_SPACES;

  utils = require('./utils');

  vm = require('vm');

  try {
    coffee = require("iced-coffee-script");
  } catch (e) {
    coffee = require("coffee-script");
  }

  minimizeJs = function(js) {
    var uglify;
    try {
      uglify = require('uglify-js');
      js = uglify.minify(js, {
        fromString: true
      }).code;
    } catch (e) {
      console.log(js);
      console.log(e);
      process.exit(1);
    }
    return js;
  };

  getCommonHeaders = function(include_bundle_headers, auto_escape) {
    /*
      each view will use this, or if they're bundled together,
      it'll only be used once.
    
      include_bundle_headers: includes some functions needed for browser use
    */
    return "if not toffee?            then toffee = {}\nif not toffee.templates   then toffee.templates = {}\n\ntoffee.states = " + (JSON.stringify(states)) + "\n\ntoffee.__json = (locals, o) ->\n  if not o? then return \"null\"\n  else return \"\" + JSON.stringify(o).replace(/</g,'\\\\u003C').replace(/>/g,'\\\\u003E').replace(/&/g,'\\\\u0026')\n\ntoffee.__raw = (locals, o) -> o\n\ntoffee.__html = (locals, o) ->\n  (\"\"+o).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;')\n\ntoffee.__escape = (locals, o) ->\n  if locals.__toffee.autoEscape? then ae = locals.__toffee.autoEscape\n  else if " + (auto_escape != null) + "        then ae = " + auto_escape + "\n  else                                ae = true\n  if ae\n    if o is undefined then return ''\n    if o? and (typeof o) is \"object\" then return locals.json o\n    return locals.html o\n  return o\n\ntoffee.__augmentLocals = (locals, bundle_path) ->\n  _l = locals\n  _t = _l.__toffee = {out: []}\n  if not _l.print?   then _l.print    = (o) -> toffee.__print   _l, o\n  if not _l.json?    then _l.json     = (o) -> toffee.__json    _l, o\n  if not _l.raw?     then _l.raw      = (o) -> toffee.__raw     _l, o\n  if not _l.html?    then _l.html     = (o) -> toffee.__html    _l, o\n  if not _l.escape?  then _l.escape   = (o) -> toffee.__escape  _l, o\n  if not _l.partial? then _l.partial  = (path, vars) -> toffee.__partial toffee.templates[\"\#{bundle_path}\"], _l, path, vars\n  if not _l.snippet? then _l.snippet  = (path, vars) -> toffee.__snippet toffee.templates[\"\#{bundle_path}\"], _l, path, vars\n  _t.print   = _l.print\n  _t.json    = _l.json\n  _t.raw     = _l.raw\n  _t.html    = _l.html\n  _t.escape  = _l.escape\n  _t.partial = _l.partial\n  _t.snippet = _l.snippet\n\n" + (include_bundle_headers ? getBundleHeaders() : "");
  };

  getBundleHeaders = function() {
    /*
      header stuff 
      only needed when compiling to a JS file
    */
    return "\ntoffee.__print = (locals, o) ->\n  if locals.__toffee.state is toffee.states.COFFEE\n    locals.__toffee.out.push o\n    return ''\n  else\n    return \"\#{o}\"\n\ntoffee.__normalize = (path) ->\n  if (not path?) or path is \"/\"\n    return path\n  else \n    parts = path.split \"/\"\n    np = []\n    # make sure path always starts with '/'\n    if parts[0]\n      np.push ''\n    for part in parts\n      if part is \"..\"\n        if np.length > 1\n          np.pop()\n        else\n          np.push part\n      else\n        if part isnt \".\"\n          np.push part\n    path = np.join \"/\"\n    if not path then path = \"/\"\n    return path\n\ntoffee.__partial = (parent_tmpl, parent_locals, path, vars) ->\n  path = toffee.__normalize parent_tmpl.bundlePath + \"/../\" + path\n  return toffee.__inlineInclude path, vars, parent_locals\n\ntoffee.__snippet = (parent_tmpl, parent_locals, path, vars) ->\n  path = toffee.__normalize parent_tmpl.bundlePath + \"/../\" + path\n  vars = if vars? then vars else {}\n  vars.__toffee = vars.__toffee or {}\n  vars.__toffee.noInheritance = true\n  return toffee.__inlineInclude path, vars, parent_locals\n\ntoffee.__inlineInclude = (path, locals, parent_locals) ->\n  options                 = locals or {}\n  options.__toffee        = options.__toffee or {}\n\n  # we need to make a shallow copy of parent variables\n  if not options.__toffee.noInheritance\n    for k,v of parent_locals when not locals?[k]?\n      if not (k in [\"print\", \"partial\", \"snippet\", \"layout\", \"__toffee\"])\n        options[k] = v\n\n  if not toffee.templates[path]\n    return \"Inline toffee include: Could not find \#{path}\"\n  else\n    return toffee.templates[path].pub options\n";
  };

  getCommonHeadersJs = function(include_bundle_headers, auto_escape, minimize) {
    var ch, js;
    ch = getCommonHeaders(include_bundle_headers, auto_escape);
    js = coffee.compile(ch, {
      bare: true
    });
    if (minimize) {
      js = minimizeJs(js);
    }
    return js;
  };

  view = (function() {

    function view(txt, options) {
      /*
          important options:
            cb: if this is set, compilation will happen async and cb will be executed when it's ready
      */

      var _this = this;
      options = options || {};
      this.fileName = options.fileName || options.filename || null;
      this.bundlePath = options.bundlePath || "/";
      this.browserMode = options.browserMode || false;
      this.minimize = options.minimize || false;
      this.verbose = options.verbose || false;
      this.fsError = options.fsError || false;
      this.prettyPrintErrors = options.prettyPrintErrors != null ? options.prettyPrintErrors : true;
      this.prettyLogErrors = options.prettyLogErrors != null ? options.prettyLogErrors : false;
      this.autoEscape = options.autoEscape != null ? options.autoEscape : false;
      this.additionalErrorHandler = options.additionalErrorHandler || null;
      this.txt = txt;
      this.tokenObj = null;
      this.coffeeScript = null;
      this.javaScript = null;
      this.scriptObj = null;
      this.error = null;
      if (options.cb) {
        this._prepAsync(txt, function() {
          return options.cb(_this);
        });
      }
    }

    view.prototype._prepAsync = function(txt, cb) {
      /*
          Only once it's fully compiled does it callback.
          Defers via setTimeouts in each stage in the compile process
          for CPU friendliness. This is a lot prettier with iced-coffee-script.
      */

      var v;
      this._log("Prepping " + (this.fileName != null ? this.fileName : 'unknown') + " async.");
      this._toTokenObj();
      v = this;
      return setTimeout(function() {
        v.toCoffee();
        return setTimeout(function() {
          v.toJavaScript();
          return setTimeout(function() {
            v._toScriptObj();
            v._log("Done async prep of " + (v.fileName != null ? v.fileName : 'unknown') + ". Calling back.");
            return cb();
          }, 0);
        }, 0);
      }, 0);
    };

    view.prototype._log = function(o) {
      var _ref2;
      if (this.verbose) {
        if ((_ref2 = typeof o) === "string" || _ref2 === "number" || _ref2 === "boolean") {
          return console.log("toffee: " + o);
        } else {
          return console.log("toffee: " + (util.inspect(o)));
        }
      }
    };

    view.prototype._cleanTabs = function(obj) {
      /*
          replaces tabs with spaces in their coffee regions
      */

      var item, _i, _len, _ref2, _ref3, _results;
      if ((_ref2 = obj[0]) === "TOFFEE_ZONE" || _ref2 === "COFFEE_ZONE") {
        _ref3 = obj[1];
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          item = _ref3[_i];
          _results.push(this._cleanTabs(item));
        }
        return _results;
      } else if (obj[0] === "COFFEE") {
        return obj[1] = obj[1].replace(/\t/g, this._tabAsSpaces());
      }
    };

    view.prototype.run = function(options) {
      /*
          returns [err, str]
      */

      var line, pair, res, sandbox, script, txt, _i, _len, _ref2;
      script = this._toScriptObj();
      res = null;
      if (!this.error) {
        try {
          sandbox = {
            __toffee_run_input: options
          };
          script.runInNewContext(sandbox);
          res = sandbox.__toffee_run_input.__toffee.res;
          delete sandbox.__toffee_run_input.__toffee;
        } catch (e) {
          this.error = new toffeeError(this, errorTypes.RUNTIME, e);
        }
      }
      if (this.error) {
        if (this.prettyLogErrors) {
          txt = this.error.getPrettyPrintText();
          _ref2 = txt.split("\n");
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            line = _ref2[_i];
            console.log("toffee err: " + line);
          }
        }
        if (this.additionalErrorHandler) {
          this.additionalErrorHandler(this.error.getPrettyPrintText(), this.error.getPrettyPrint(), this.fileName, options);
        }
        if (this.prettyPrintErrors) {
          pair = [null, this.error.getPrettyPrint()];
        } else {
          pair = [this.error.getPrettyPrintText(), null];
        }
        if (this.error.errType === errorTypes.RUNTIME) {
          this.error = null;
        }
      } else {
        pair = [null, res];
      }
      return pair;
    };

    view.prototype._toTokenObj = function() {
      /*
          compiles Toffee to token array
      */
      if (!(this.tokenObj != null)) {
        try {
          this.tokenObj = parser.parse(this.txt);
        } catch (e) {
          this.error = new toffeeError(this, errorTypes.PARSER, e);
        }
        if (!(this.error != null)) {
          this._cleanTabs(this.tokenObj);
        }
      }
      return this.tokenObj;
    };

    view.prototype._toScriptObj = function() {
      var d, txt;
      if (!(this.scriptObj != null)) {
        txt = this.toJavaScript();
        if (!this.error) {
          d = Date.now();
          this.scriptObj = vm.createScript(txt);
          this._log("" + this.fileName + " compiled to scriptObj in " + (Date.now() - d) + "ms");
        }
      }
      return this.scriptObj;
    };

    view.prototype.toJavaScript = function() {
      var c, d, d2;
      if (!(this.javaScript != null)) {
        c = this.toCoffee();
        if (!this.error) {
          d = Date.now();
          try {
            this.javaScript = coffee.compile(c, {
              bare: false
            });
          } catch (e) {
            this.error = new toffeeError(this, errorTypes.COFFEE_COMPILE, e);
          }
          if (this.minimize && !this.error) {
            d2 = Date.now();
            this.javaScript = minimizeJs(this.javaScript);
          }
          this._log("" + this.fileName + " compiled to JavaScript in " + (Date.now() - d) + "ms");
        }
      }
      return this.javaScript;
    };

    view.prototype.toCoffee = function() {
      var d, res, tobj;
      if (!(this.coffeeScript != null)) {
        tobj = this._toTokenObj();
        if (!this.error) {
          d = Date.now();
          res = this._coffeeHeaders();
          try {
            res += this._toCoffeeRecurse(tobj, TAB_SPACES, 0, {})[0];
            res += this._coffeeFooters();
            this.coffeeScript = res;
          } catch (e) {
            this.error;
          }
          this._log("" + this.fileName + " compiled to CoffeeScript in " + (Date.now() - d) + "ms");
        }
      }
      return this.coffeeScript;
    };

    view.prototype._printLineNo = function(n, ind) {
      if (this.minimize || ((this.lastLineNo != null) && (n === this.lastLineNo))) {
        return "";
      } else {
        this.lastLineNo = n;
        return "\n" + (this._space(ind)) + "_ln " + n;
      }
    };

    view.prototype._snippetHasEscapeOverride = function(str) {
      var token, _i, _len, _ref2, _ref3;
      _ref2 = ['print', ' snippet', 'partial', 'raw', 'html', 'json', '__toffee.raw', '__toffee.html', '__toffee.json', 'JSON.stringify'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        token = _ref2[_i];
        if (str.slice(0, token.length) === token) {
          if ((str.length > token.length) && ((_ref3 = str[token.length]) === ' ' || _ref3 === '\t' || _ref3 === '\n' || _ref3 === '(')) {
            return true;
          }
        }
      }
      return false;
    };

    view.prototype._snippetIsSoloToken = function(str) {
      /*
          if the inside is something like #{ foo } not #{ foo.bar } or other complex thing.
      */
      if (str.match(/^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*$/)) {
        return true;
      }
      return false;
    };

    view.prototype._toCoffeeRecurse = function(obj, indent_level, indent_baseline, state_carry) {
      var c, chunk, delta, i, i_delta, ind, interp, item, lbreak, line, lineno, lines, part, res, s, t_int, temp_indent_level, zone_baseline, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref2, _ref3, _ref4, _ref5;
      res = "";
      i_delta = 0;
      switch (obj[0]) {
        case "TOFFEE_ZONE":
          if (state_carry.last_coffee_ends_with_newline === false) {
            indent_level += TAB_SPACES;
          }
          res += "\n" + (this._space(indent_level)) + "_ts " + states.TOFFEE;
          _ref2 = obj[1];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            item = _ref2[_i];
            _ref3 = this._toCoffeeRecurse(item, indent_level, indent_baseline, state_carry), s = _ref3[0], delta = _ref3[1];
            res += s;
          }
          break;
        case "COFFEE_ZONE":
          res += "\n" + (this._space(indent_level)) + "_ts " + states.COFFEE;
          zone_baseline = this._getZoneBaseline(obj[1]);
          temp_indent_level = indent_level;
          _ref4 = obj[1];
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            item = _ref4[_j];
            _ref5 = this._toCoffeeRecurse(item, temp_indent_level, zone_baseline, state_carry), s = _ref5[0], delta = _ref5[1];
            res += s;
            temp_indent_level = indent_level + delta;
          }
          break;
        case "TOFFEE":
          ind = indent_level;
          res += "\n" + (this._space(ind)) + "_ts " + states.TOFFEE;
          lineno = obj[2];
          try {
            t_int = utils.interpolateString(obj[1]);
          } catch (e) {
            e.relayed_line_range = [lineno, lineno + obj[1].split("\n").length];
            this.error = new toffeeError(this, errorTypes.STR_INTERPOLATE, e);
            throw e;
          }
          for (_k = 0, _len2 = t_int.length; _k < _len2; _k++) {
            part = t_int[_k];
            if (part[0] === "TOKENS") {
              res += this._printLineNo(lineno, ind);
              interp = part[1].replace(/(^[\n \t]+)|([\n \t]+)$/g, '');
              if (this._snippetIsSoloToken(interp)) {
                chunk = "\#{if " + interp + "? then escape " + interp + " else ''}";
              } else if (this._snippetHasEscapeOverride(interp)) {
                chunk = "\#{" + interp + "}";
              } else {
                chunk = "\#{escape(" + interp + ")}";
              }
              res += "\n" + (this._space(ind)) + "_to " + (this._quoteStr(chunk));
              lineno += part[1].split("\n").length - 1;
            } else {
              lines = part[1].split("\n");
              for (i = _l = 0, _len3 = lines.length; _l < _len3; i = ++_l) {
                line = lines[i];
                res += this._printLineNo(lineno, ind);
                lbreak = i !== lines.length - 1 ? "\n" : "";
                chunk = this._escapeForStr("" + line + lbreak);
                if (chunk.length) {
                  res += "\n" + (this._space(ind)) + "_to " + (this._quoteStr(chunk + lbreak));
                }
                if (i < lines.length - 1) {
                  lineno++;
                }
              }
            }
          }
          res += this._printLineNo(obj[2] + (obj[1].split('\n').length - 1), ind);
          res += "\n" + (this._space(ind)) + "_ts " + states.COFFEE;
          break;
        case "COFFEE":
          c = obj[1];
          res += "\n" + (this._reindent(c, indent_level, indent_baseline));
          i_delta = this._getIndentationDelta(c, indent_baseline);
          state_carry.last_coffee_ends_with_newline = this._doesEndWithNewline(c);
          break;
        default:
          throw "Bad parsing. " + obj + " not handled.";
          return ["", 0];
      }
      return [res, i_delta];
    };

    view.prototype._quoteStr = function(s) {
      /*
          returns a triple-quoted string, dividing into single quoted
          start and stops, if the string begins with double quotes, since
          coffee doesn't want to let us escape those.
      */

      var follow, lead, res;
      lead = "";
      follow = "";
      while (s.length && (s[0] === '"')) {
        s = s.slice(1);
        lead += '"';
      }
      while (s.length && (s.slice(-1) === '"')) {
        s = s.slice(0, -1);
        follow += '"';
      }
      res = '';
      if (lead.length) {
        res += "\'" + lead + "\' + ";
      }
      res += '"""' + s + '"""';
      if (follow.length) {
        res += "+ \'" + follow + "\'";
      }
      return res;
    };

    view.prototype._doesEndWithNewline = function(s) {
      var parts;
      parts = s.split("\n");
      if ((parts.length > 1) && parts[parts.length - 1].match(/^[\t ]*$/)) {
        return true;
      } else {
        return false;
      }
    };

    view.prototype._escapeForStr = function(s) {
      /*
          escapes a string so it can make it into coffeescript
          triple quotes without losing whitespace, etc.
      */
      s = s.replace(/\\/g, '\\\\');
      s = s.replace(/\n/g, '\\n');
      s = s.replace(/\t/g, '\\t');
      return s;
    };

    view.prototype._getZoneBaseline = function(obj_arr) {
      var ib, obj, _i, _len;
      for (_i = 0, _len = obj_arr.length; _i < _len; _i++) {
        obj = obj_arr[_i];
        if (obj[0] === "COFFEE") {
          ib = this._getIndentationBaseline(obj[1]);
          if (ib != null) {
            return ib;
          }
        }
      }
      return 0;
    };

    view.prototype._getIndentationBaseline = function(coffee) {
      var i, line, lines, res, _i, _len;
      res = null;
      lines = coffee.split("\n");
      if (lines.length) {
        for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
          line = lines[i];
          if ((!line.match(/^[ ]*$/)) || i === (lines.length - 1)) {
            res = line.match(/[ ]*/)[0].length;
            break;
          }
        }
      }
      if (!(res != null)) {
        res = coffee.length;
      }
      return res;
    };

    view.prototype._getIndentationDelta = function(coffee, baseline) {
      /*
          given an arbitrarily indented set of coffeescript, returns the delta
          between the first and last lines, in chars.
          Ignores leading/trailing whitespace lines
          If passed a baseline, uses that instead of own.
      */

      var lines, res, y, y_l;
      if (!(baseline != null)) {
        baseline = this._getIndentationBaseline(coffee);
      }
      if (!(baseline != null)) {
        res = 0;
      } else {
        lines = coffee.split("\n");
        if (lines.length < 1) {
          res = 0;
        } else {
          y = lines[lines.length - 1];
          y_l = y.match(/[ ]*/)[0].length;
          res = y_l - baseline;
        }
      }
      return res;
    };

    view.prototype._reindent = function(coffee, indent_level, indent_baseline) {
      var indent, line, lines, res, rxx, strip;
      lines = coffee.split('\n');
      while (lines.length && lines[0].match(/^[ ]*$/)) {
        lines = lines.slice(1);
      }
      if (!lines.length) {
        return '';
      }
      rxx = /^[ ]*/;
      strip = indent_baseline;
      indent = this._space(indent_level);
      res = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          _results.push("" + indent + line.slice(strip));
        }
        return _results;
      })()).join("\n");
      return res;
    };

    view.prototype._space = function(indent) {
      var i;
      return ((function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= indent ? _i < indent : _i > indent; i = 0 <= indent ? ++_i : --_i) {
          _results.push(" ");
        }
        return _results;
      })()).join("");
    };

    view.prototype._tabAsSpaces = function() {
      var i;
      return ((function() {
        var _i, _results;
        _results = [];
        for (i = _i = 0; 0 <= TAB_SPACES ? _i < TAB_SPACES : _i > TAB_SPACES; i = 0 <= TAB_SPACES ? ++_i : --_i) {
          _results.push(" ");
        }
        return _results;
      })()).join("");
    };

    view.prototype._coffeeHeaders = function() {
      var ___;
      ___ = this._tabAsSpaces();
      return "" + (this.browserMode ? '' : getCommonHeaders(false, this.autoEscape)) + "\ntmpl = toffee.templates[\"" + this.bundlePath + "\"]  =\n  bundlePath: \"" + this.bundlePath + "\"\ntmpl.render = tmpl.pub = (__locals) ->\n" + ___ + "_to = (x) -> __locals.__toffee.out.push x\n" + ___ + "_ln = (x) -> __locals.__toffee.lineno = x\n" + ___ + "_ts = (x) -> __locals.__toffee.state  = x\n" + ___ + "toffee.__augmentLocals __locals, \"" + this.bundlePath + "\"\n\n" + ___ + "`with (__locals) {`\n" + ___ + "__toffee.out = []";
    };

    view.prototype._coffeeFooters = function() {
      var ___;
      ___ = this._tabAsSpaces();
      return "\n\n" + ___ + "__toffee.res = __toffee.out.join \"\"\n" + ___ + "return __toffee.res\n" + ___ + "`true; } /* closing JS 'with' */ `\n# sometimes we want to execute the whole thing in a sandbox\n# and just output results\nif __toffee_run_input?\n" + ___ + "return tmpl.pub __toffee_run_input";
    };

    return view;

  })();

  exports.view = view;

  exports.getCommonHeaders = getCommonHeaders;

  exports.getCommonHeadersJs = getCommonHeadersJs;

  exports.expressCompile = function(txt, options) {
    var v;
    v = new view(txt, options);
    return function(vars) {
      var res;
      res = v.run(vars);
      if (res[0]) {
        return res[0];
      } else {
        return res[1];
      }
    };
  };

}).call(this);
