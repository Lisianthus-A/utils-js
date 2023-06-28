// polufill for Array.prototype.forEach
(function () {
    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function (callbackfn) {
        for (var i = 0; i < this.length; ++i) {
          callbackfn(this[i], i, this);
        }
      };
    }
  })();
  
  // polufill for JSON
  (function () {
    if (window.JSON) {
      return;
    }
  
    window.JSON = {};
    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable =
      /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous =
      /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  
    function f(n) {
      return n < 10 ? "0" + n : n;
    }
  
    function this_value() {
      return this.valueOf();
    }
  
    if (typeof Date.prototype.toJSON !== "function") {
      Date.prototype.toJSON = function () {
        return isFinite(this.valueOf())
          ? this.getUTCFullYear() +
              "-" +
              f(this.getUTCMonth() + 1) +
              "-" +
              f(this.getUTCDate()) +
              "T" +
              f(this.getUTCHours()) +
              ":" +
              f(this.getUTCMinutes()) +
              ":" +
              f(this.getUTCSeconds()) +
              "Z"
          : null;
      };
  
      Boolean.prototype.toJSON = this_value;
      Number.prototype.toJSON = this_value;
      String.prototype.toJSON = this_value;
    }
  
    var gap;
    var indent;
    var meta;
    var rep;
  
    function quote(string) {
      rx_escapable.lastIndex = 0;
      return rx_escapable.test(string)
        ? '"' +
            string.replace(rx_escapable, function (a) {
              var c = meta[a];
              return typeof c === "string"
                ? c
                : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) +
            '"'
        : '"' + string + '"';
    }
  
    function str(key, holder) {
      var i; // The loop counter.
      var k; // The member key.
      var v; // The member value.
      var length;
      var mind = gap;
      var partial;
      var value = holder[key];
  
      if (value && typeof value === "object" && typeof value.toJSON === "function") {
        value = value.toJSON(key);
      }
  
      if (typeof rep === "function") {
        value = rep.call(holder, key, value);
      }
  
      switch (typeof value) {
        case "string":
          return quote(value);
        case "number":
          return isFinite(value) ? String(value) : "null";
        case "boolean":
        case "null":
          return String(value);
        case "object":
          if (!value) {
            return "null";
          }
  
          gap += indent;
          partial = [];
  
          if (Object.prototype.toString.apply(value) === "[object Array]") {
            length = value.length;
            for (i = 0; i < length; i += 1) {
              partial[i] = str(i, value) || "null";
            }
  
            v =
              partial.length === 0
                ? "[]"
                : gap
                ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                : "[" + partial.join(",") + "]";
            gap = mind;
            return v;
          }
  
          if (rep && typeof rep === "object") {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
              if (typeof rep[i] === "string") {
                k = rep[i];
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ": " : ":") + v);
                }
              }
            }
          } else {
            for (k in value) {
              if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ": " : ":") + v);
                }
              }
            }
          }
  
          v =
            partial.length === 0
              ? "{}"
              : gap
              ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
              : "{" + partial.join(",") + "}";
          gap = mind;
          return v;
      }
    }
  
    if (typeof JSON.stringify !== "function") {
      meta = {
        "\b": "\\b",
        "\t": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\",
      };
      JSON.stringify = function (value, replacer, space) {
        var i;
        gap = "";
        indent = "";
  
        if (typeof space === "number") {
          for (i = 0; i < space; i += 1) {
            indent += " ";
          }
        } else if (typeof space === "string") {
          indent = space;
        }
  
        rep = replacer;
        if (
          replacer &&
          typeof replacer !== "function" &&
          (typeof replacer !== "object" || typeof replacer.length !== "number")
        ) {
          throw new Error("JSON.stringify");
        }
  
        return str("", { "": value });
      };
    }
  
    if (typeof JSON.parse !== "function") {
      JSON.parse = function (text, reviver) {
        var j;
  
        function walk(holder, key) {
          var k;
          var v;
          var value = holder[key];
          if (value && typeof value === "object") {
            for (k in value) {
              if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = walk(value, k);
                if (v !== undefined) {
                  value[k] = v;
                } else {
                  delete value[k];
                }
              }
            }
          }
          return reviver.call(holder, key, value);
        }
  
        text = String(text);
        rx_dangerous.lastIndex = 0;
        if (rx_dangerous.test(text)) {
          text = text.replace(rx_dangerous, function (a) {
            return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
          });
        }
  
        if (rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) {
          j = eval("(" + text + ")");
          return typeof reviver === "function" ? walk({ "": j }, "") : j;
        }
  
        throw new SyntaxError("JSON.parse");
      };
    }
  })();
  
  (function () {
    // 服务 IP 地址
    var serverIp = "172.16.4.152";
    // 是否显示函数
    var showFunction = false;
  
    var useWebSocket = typeof window.WebSocket !== "undefined";
    var connected = false;
    var ws;
    var logType = ["log", "info", "warn", "error"];
  
    function request(url, jsonData, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      if (jsonData) {
        xhr.setRequestHeader("content-type", "application/json");
        xhr.send(JSON.stringify(jsonData));
      } else {
        xhr.send();
      }
  
      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            console.error("xhr error:", url);
          } else {
            var json = JSON.parse(xhr.responseText);
            callback && callback(json);
          }
        }
      };
    }
  
    function mockConsole() {
      if (!window.console) {
        window.console = {};
      }
  
      logType.forEach(function (type) {
        var origMethod = window.console[type];
        window.console[type] = function () {
          var args = [];
          for (var i = 0; i < arguments.length; ++i) {
            args.push(arguments[i]);
          }
          typeof origMethod === "function" && origMethod.apply(null, args);
          sendToServer(args);
        };
      });
    }
  
    function sendToServer(args) {
      var message = "";
      args.forEach(function (value, index) {
        message += resolveArgs(value);
        if (index > 0) {
          message += " ";
        }
      });
  
      if (message === "" || !connected) {
        return;
      }
  
      try {
        if (useWebSocket) {
          ws.send(message);
        } else {
          request("http://" + serverIp + ":3200/api/print", {
            message: message,
          });
        }
      } catch (e) {}
    }
  
    function resolveArgs(value) {
      // ES6+ 使用 Map 更合适
      // 用于处理互相引用的对象
      var resolvedObj = [];
      var resolvedValue = [];
  
      // function resolveArray(array, stringify) {
      // 	var resolvedArray = [];
      // 	for (var i = 0; i < array.length; ++i) {
      // 		resolvedArray.push(getResolveValue(array[i], false));
      // 	}
      // 	return stringify ? JSON.stringify(resolvedArray) : resolvedArray;
      // }
  
      function resolveObj(obj) {
        var index = resolvedObj.indexOf(obj);
        if (index >= 0) {
          return resolvedValue[index];
        }
        resolvedObj.push(obj);
        var o = {};
        for (var k in obj) {
          if (obj.hasOwnProperty(k)) {
            o[k] = getResolveValue(obj[k]);
          }
        }
  
        return o;
      }
  
      function getResolveValue(value) {
        if (value instanceof Error) {
          return value.message || value.toString();
        }

        var type = Object.prototype.toString.call(value);
        switch (type) {
          case "[object Object]":
            return resolveObj(value);
          case "[object Function]":
            return showFunction ? value.toString() : "[object Function]";
          case "[object Undefined]":
            return "undefined";
          default:
            return value;
        }
      }
  
      try {
        var resolveValue = getResolveValue(value);
        return JSON.stringify(resolveValue);
      } catch (err) {
        return "resolveError: " + err.message || err.toString();
      }
    }
  
    function executeCommand(command) {
      try {
        var value = eval(command);
        console.log(value);
      } catch (e) {
        console.error(e);
      }
    }
  
    if (useWebSocket) {
      ws = new WebSocket("ws:" + serverIp + ":3200/ws/iptv");
      ws.addEventListener("open", function () {
        connected = true;
      });
      ws.addEventListener("error", function () {
        console.error("WebSocket Error");
      });
      ws.addEventListener("message", function (evt) {
        executeCommand(evt.data);
      });
    } else {
      setInterval(function () {
        request("http://" + serverIp + ":3200/api/getCommand", undefined, function (res) {
          connected = true;
          res.data.forEach(executeCommand);
        });
      }, 5000);
    }
  
    mockConsole();
    window.addEventListener("error", function (err) {
      var msg = err.message;
      msg += "\n At file:" + err.filename + ";line:" + err.lineno + ";col:" + err.colno;
      if (err.error && err.error.stack) {
        msg += "\n call stack:" + err.error.stack;
      }
      console.log(msg);
    });
    window.onerror = function (message, filename, lineno, colno, error) {
      var msg = message;
      msg += "\n At file:" + filename + ";line:" + lineno + ";col:" + colno;
      if (error && error.stack) {
        msg += "\n call stack:" + error.stack;
      }
      console.log(msg);
    };
  })();
  