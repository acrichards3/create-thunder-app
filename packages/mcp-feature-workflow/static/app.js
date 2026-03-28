// node_modules/.bun/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js
var noop = { value: () => {} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames
    .trim()
    .split(/^|\s+/)
    .map(function (t) {
      var name = "",
        i = t.indexOf(".");
      if (i >= 0) ((name = t.slice(i + 1)), (t = t.slice(0, i)));
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return { type: t, name };
    });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function (typename, callback) {
    var _ = this._,
      T = parseTypenames(typename + "", _),
      t,
      i = -1,
      n = T.length;
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if ((t = (typename = T[i]).type)) _[t] = set(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
    }
    return this;
  },
  copy: function () {
    var copy = {},
      _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function (type2, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
    for (t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function (type2, that, args) {
    if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
    for (var t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
};
function get(type2, name) {
  for (var i = 0, n = type2.length, c; i < n; ++i) {
    if ((c = type2[i]).name === name) {
      return c.value;
    }
  }
}
function set(type2, name, callback) {
  for (var i = 0, n = type2.length; i < n; ++i) {
    if (type2[i].name === name) {
      ((type2[i] = noop), (type2 = type2.slice(0, i).concat(type2.slice(i + 1))));
      break;
    }
  }
  if (callback != null) type2.push({ name, value: callback });
  return type2;
}
var dispatch_default = dispatch;

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/namespaces.js
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces_default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
};

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js
function namespace_default(name) {
  var prefix = (name += ""),
    i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js
function creatorInherit(name) {
  return function () {
    var document2 = this.ownerDocument,
      uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml
      ? document2.createElement(name)
      : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js
function none() {}
function selector_default(selector) {
  return selector == null
    ? none
    : function () {
        return this.querySelector(selector);
      };
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js
function select_default(select) {
  if (typeof select !== "function") select = selector_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (
      var group = groups[j], n = group.length, subgroup = (subgroups[j] = new Array(n)), node, subnode, i = 0;
      i < n;
      ++i
    ) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/array.js
function array(x2) {
  return x2 == null ? [] : Array.isArray(x2) ? x2 : Array.from(x2);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null
    ? empty
    : function () {
        return this.querySelectorAll(selector);
      };
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js
function arrayAll(select) {
  return function () {
    return array(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js
function matcher_default(selector) {
  return function () {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function (node) {
    return node.matches(selector);
  };
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js
var find = Array.prototype.find;
function childFind(match) {
  return function () {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function () {
    return filter.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(
    match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)),
  );
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js
function filter_default(match) {
  if (typeof match !== "function") match = matcher_default(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = (subgroups[j] = []), node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js
function sparse_default(update) {
  return new Array(update.length);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function (child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function (child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function (selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function (selector) {
    return this._parent.querySelectorAll(selector);
  },
};

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js
function constant_default(x2) {
  return function () {
    return x2;
  };
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js
function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
    node,
    groupLength = group.length,
    dataLength = data.length;
  for (; i < dataLength; ++i) {
    if ((node = group[i])) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if ((node = group[i])) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
    node,
    nodeByKeyValue = /* @__PURE__ */ new Map(),
    groupLength = group.length,
    dataLength = data.length,
    keyValues = new Array(groupLength),
    keyValue;
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i])) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if ((node = nodeByKeyValue.get(keyValue))) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function data_default(value, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex,
    parents = this._parents,
    groups = this._groups;
  if (typeof value !== "function") value = constant_default(value);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
      group = groups[j],
      groupLength = group.length,
      data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
      dataLength = data.length,
      enterGroup = (enter[j] = new Array(dataLength)),
      updateGroup = (update[j] = new Array(dataLength)),
      exitGroup = (exit[j] = new Array(groupLength));
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if ((previous = enterGroup[i0])) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(),
    update = this,
    exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove();
  else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js
function merge_default(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (
    var groups0 = this._groups,
      groups1 = selection2._groups,
      m0 = groups0.length,
      m1 = groups1.length,
      m = Math.min(m0, m1),
      merges = new Array(m0),
      j = 0;
    j < m;
    ++j
  ) {
    for (
      var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = (merges[j] = new Array(n)), node, i = 0;
      i < n;
      ++i
    ) {
      if ((node = group0[i] || group1[i])) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection(merges, this._parents);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js
function order_default() {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
      if ((node = group[i])) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js
function sort_default(compare) {
  if (!compare) compare = ascending;
  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = (sortgroups[j] = new Array(n)), node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js
function nodes_default() {
  return Array.from(this);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js
function node_default() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js
function size_default() {
  let size = 0;
  for (const node of this) ++size;
  return size;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js
function empty_default() {
  return !this.node();
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js
function each_default(callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if ((node = group[i])) callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js
function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each(
    (value == null
      ? fullname.local
        ? attrRemoveNS
        : attrRemove
      : typeof value === "function"
        ? fullname.local
          ? attrFunctionNS
          : attrFunction
        : fullname.local
          ? attrConstantNS
          : attrConstant)(fullname, value),
  );
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/window.js
function window_default(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) || (node.document && node) || node.defaultView;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js
function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}
function style_default(name, value, priority) {
  return arguments.length > 1
    ? this.each(
        (value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(
          name,
          value,
          priority == null ? "" : priority,
        ),
      )
    : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js
function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}
function property_default(name, value) {
  return arguments.length > 1
    ? this.each(
        (value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(
          name,
          value,
        ),
      )
    : this.node()[name];
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function (name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function (name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function (name) {
    return this._names.indexOf(name) >= 0;
  },
};
function classedAdd(node, names) {
  var list2 = classList(node),
    i = -1,
    n = names.length;
  while (++i < n) list2.add(names[i]);
}
function classedRemove(node, names) {
  var list2 = classList(node),
    i = -1,
    n = names.length;
  while (++i < n) list2.remove(names[i]);
}
function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list2 = classList(this.node()),
      i = -1,
      n = names.length;
    while (++i < n) if (!list2.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default(value) {
  return arguments.length
    ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value))
    : this.node().textContent;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default(value) {
  return arguments.length
    ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value))
    : this.node().innerHTML;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js
function append_default(name) {
  var create3 = typeof name === "function" ? name : creator_default(name);
  return this.select(function () {
    return this.appendChild(create3.apply(this, arguments));
  });
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create3 = typeof name === "function" ? name : creator_default(name),
    select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function () {
    return this.insertBefore(create3.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js
function selection_cloneShallow() {
  var clone2 = this.cloneNode(false),
    parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function selection_cloneDeep() {
  var clone2 = this.cloneNode(true),
    parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js
function contextListener(listener) {
  return function (event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames
    .trim()
    .split(/^|\s+/)
    .map(function (t) {
      var name = "",
        i = t.indexOf(".");
      if (i >= 0) ((name = t.slice(i + 1)), (t = t.slice(0, i)));
      return { type: t, name };
    });
}
function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (((o = on[j]), (!typename.type || o.type === typename.type) && o.name === typename.name)) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}
function onAdd(typename, value, options2) {
  return function () {
    var on = this.__on,
      o,
      listener = contextListener(value);
    if (on)
      for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, (o.listener = listener), (o.options = options2));
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options2);
    o = { type: typename.type, name: typename.name, value, listener, options: options2 };
    if (!on) this.__on = [o];
    else on.push(o);
  };
}
function on_default(typename, value, options2) {
  var typenames = parseTypenames2(typename + ""),
    i,
    n = typenames.length,
    t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on)
      for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options2));
  return this;
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js
function dispatchEvent(node, type2, params) {
  var window2 = window_default(node),
    event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type2, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params) (event.initEvent(type2, params.bubbles, params.cancelable), (event.detail = params.detail));
    else event.initEvent(type2, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type2, params) {
  return function () {
    return dispatchEvent(this, type2, params);
  };
}
function dispatchFunction(type2, params) {
  return function () {
    return dispatchEvent(this, type2, params.apply(this, arguments));
  };
}
function dispatch_default2(type2, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js
function* iterator_default() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if ((node = group[i])) yield node;
    }
  }
}

// node_modules/.bun/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js
var root = [null];
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_default,
  selectAll: selectAll_default,
  selectChild: selectChild_default,
  selectChildren: selectChildren_default,
  filter: filter_default,
  data: data_default,
  enter: enter_default,
  exit: exit_default,
  join: join_default,
  merge: merge_default,
  selection: selection_selection,
  order: order_default,
  sort: sort_default,
  call: call_default,
  nodes: nodes_default,
  node: node_default,
  size: size_default,
  empty: empty_default,
  each: each_default,
  attr: attr_default,
  style: style_default,
  property: property_default,
  classed: classed_default,
  text: text_default,
  html: html_default,
  raise: raise_default,
  lower: lower_default,
  append: append_default,
  insert: insert_default,
  remove: remove_default,
  clone: clone_default,
  datum: datum_default,
  on: on_default,
  dispatch: dispatch_default2,
  [Symbol.iterator]: iterator_default,
};
var selection_default = selection;

// node_modules/.bun/d3-color@3.1.0/node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

// node_modules/.bun/d3-color@3.1.0/node_modules/d3-color/src/color.js
function Color() {}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074,
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb,
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format))
    ? ((l = m[1].length),
      (m = parseInt(m[1], 16)),
      l === 6
        ? rgbn(m)
        : l === 3
          ? new Rgb(((m >> 8) & 15) | ((m >> 4) & 240), ((m >> 4) & 15) | (m & 240), ((m & 15) << 4) | (m & 15), 1)
          : l === 8
            ? rgba((m >> 24) & 255, (m >> 16) & 255, (m >> 8) & 255, (m & 255) / 255)
            : l === 4
              ? rgba(
                  ((m >> 12) & 15) | ((m >> 8) & 240),
                  ((m >> 8) & 15) | ((m >> 4) & 240),
                  ((m >> 4) & 15) | (m & 240),
                  (((m & 15) << 4) | (m & 15)) / 255,
                )
              : null)
    : (m = reRgbInteger.exec(format))
      ? new Rgb(m[1], m[2], m[3], 1)
      : (m = reRgbPercent.exec(format))
        ? new Rgb((m[1] * 255) / 100, (m[2] * 255) / 100, (m[3] * 255) / 100, 1)
        : (m = reRgbaInteger.exec(format))
          ? rgba(m[1], m[2], m[3], m[4])
          : (m = reRgbaPercent.exec(format))
            ? rgba((m[1] * 255) / 100, (m[2] * 255) / 100, (m[3] * 255) / 100, m[4])
            : (m = reHslPercent.exec(format))
              ? hsla(m[1], m[2] / 100, m[3] / 100, 1)
              : (m = reHslaPercent.exec(format))
                ? hsla(m[1], m[2] / 100, m[3] / 100, m[4])
                : named.hasOwnProperty(format)
                  ? rgbn(named[format])
                  : format === "transparent"
                    ? new Rgb(NaN, NaN, NaN, 0)
                    : null;
}
function rgbn(n) {
  return new Rgb((n >> 16) & 255, (n >> 8) & 255, n & 255, 1);
}
function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define_default(
  Rgb,
  rgb,
  extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return (
        -0.5 <= this.r &&
        this.r < 255.5 &&
        -0.5 <= this.g &&
        this.g < 255.5 &&
        -0.5 <= this.b &&
        this.b < 255.5 &&
        0 <= this.opacity &&
        this.opacity <= 1
      );
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb,
  }),
);
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
    g = o.g / 255,
    b = o.b / 255,
    min2 = Math.min(r, g, b),
    max2 = Math.max(r, g, b),
    h = NaN,
    s = max2 - min2,
    l = (max2 + min2) / 2;
  if (s) {
    if (r === max2) h = (g - b) / s + (g < b) * 6;
    else if (g === max2) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max2 + min2 : 2 - max2 - min2;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define_default(
  Hsl,
  hsl,
  extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = (this.h % 360) + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity,
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (
        ((0 <= this.s && this.s <= 1) || isNaN(this.s)) &&
        0 <= this.l &&
        this.l <= 1 &&
        0 <= this.opacity &&
        this.opacity <= 1
      );
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    },
  }),
);
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + ((m2 - m1) * h) / 60 : h < 180 ? m2 : h < 240 ? m1 + ((m2 - m1) * (240 - h)) / 60 : m1) * 255;
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
    t3 = t2 * t1;
  return (
    ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6
  );
}
function basis_default(values) {
  var n = values.length - 1;
  return function (t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? ((t = 1), n - 1) : Math.floor(t * n),
      v1 = values[i],
      v2 = values[i + 1],
      v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
      v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n = values.length;
  return function (t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
      v0 = values[(i + n - 1) % n],
      v1 = values[i % n],
      v2 = values[(i + 1) % n],
      v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js
var constant_default2 = (x2) => () => x2;

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js
function linear(a, d) {
  return function (t) {
    return a + t * d;
  };
}
function exponential(a, b, y2) {
  return (
    (a = Math.pow(a, y2)),
    (b = Math.pow(b, y2) - a),
    (y2 = 1 / y2),
    function (t) {
      return Math.pow(a + t * b, y2);
    }
  );
}
function gamma(y2) {
  return (y2 = +y2) === 1
    ? nogamma
    : function (a, b) {
        return b - a ? exponential(a, b, y2) : constant_default2(isNaN(a) ? b : a);
      };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant_default2(isNaN(a) ? b : a);
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js
var rgb_default = (function rgbGamma(y2) {
  var color2 = gamma(y2);
  function rgb2(start2, end) {
    var r = color2((start2 = rgb(start2)).r, (end = rgb(end)).r),
      g = color2(start2.g, end.g),
      b = color2(start2.b, end.b),
      opacity = nogamma(start2.opacity, end.opacity);
    return function (t) {
      start2.r = r(t);
      start2.g = g(t);
      start2.b = b(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
})(1);
function rgbSpline(spline) {
  return function (colors) {
    var n = colors.length,
      r = new Array(n),
      g = new Array(n),
      b = new Array(n),
      i,
      color2;
    for (i = 0; i < n; ++i) {
      color2 = rgb(colors[i]);
      r[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function (t) {
      color2.r = r(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js
function number_default(a, b) {
  return (
    (a = +a),
    (b = +b),
    function (t) {
      return a * (1 - t) + b * t;
    }
  );
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero(b) {
  return function () {
    return b;
  };
}
function one(b) {
  return function (t) {
    return b(t) + "";
  };
}
function string_default(a, b) {
  var bi = (reA.lastIndex = reB.lastIndex = 0),
    am,
    bm,
    bs,
    i = -1,
    s = [],
    q = [];
  ((a = a + ""), (b = b + ""));
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm;
      else s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs;
    else s[++i] = bs;
  }
  return s.length < 2
    ? q[0]
      ? one(q[0].x)
      : zero(b)
    : ((b = q.length),
      function (t) {
        for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
        return s.join("");
      });
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1,
};
function decompose_default(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if ((scaleX = Math.sqrt(a * a + b * b))) ((a /= scaleX), (b /= scaleX));
  if ((skewX = a * c + b * d)) ((c -= a * skewX), (d -= b * skewX));
  if ((scaleY = Math.sqrt(c * c + d * d))) ((c /= scaleY), (d /= scaleY), (skewX /= scaleY));
  if (a * d < b * c) ((a = -a), (b = -b), (skewX = -skewX), (scaleX = -scaleX));
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY,
  };
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js
var svgNode;
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity : decompose_default(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value) {
  if (value == null) return identity;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}

// node_modules/.bun/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;
      else if (b - a > 180) a += 360;
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }
  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function (a, b) {
    var s = [],
      q = [];
    ((a = parse(a)), (b = parse(b)));
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null;
    return function (t) {
      var i = -1,
        n = q.length,
        o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

// node_modules/.bun/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js
var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1e3;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame =
  typeof window === "object" && window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (f) {
        setTimeout(f, 17);
      };
function now() {
  return clockNow || (setFrame(clearNow), (clockNow = clock.now() + clockSkew));
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function (callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function () {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  },
};
function timer(callback, delay, time) {
  var t = new Timer();
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead,
    e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(void 0, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(),
    delay = now2 - clockLast;
  if (delay > pokeDelay) ((clockSkew -= delay), (clockLast = now2));
}
function nap() {
  var t0,
    t1 = taskHead,
    t2,
    time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      ((t0 = t1), (t1 = t1._next));
    } else {
      ((t2 = t1._next), (t1._next = null));
      t1 = t0 ? (t0._next = t2) : (taskHead = t2);
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame) return;
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) ((clockLast = clock.now()), (interval = setInterval(poke, pokeDelay)));
    ((frame = 1), setFrame(wake));
  }
}

// node_modules/.bun/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js
function timeout_default(callback, delay, time) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart(
    (elapsed) => {
      t.stop();
      callback(elapsed + delay);
    },
    delay,
    time,
  );
  return t;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/schedule.js
var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
function schedule_default(node, name, id2, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id2 in schedules) return;
  create(node, id2, {
    name,
    index,
    // For context during callback.
    group,
    // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED,
  });
}
function init(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}
function set2(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}
function get2(node, id2) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id2])) throw new Error("transition not found");
  return schedule;
}
function create(node, id2, self) {
  var schedules = node.__transition,
    tween;
  schedules[id2] = self;
  self.timer = timer(schedule, 0, self.time);
  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start2, self.delay, self.time);
    if (self.delay <= elapsed) start2(elapsed - self.delay);
  }
  function start2(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED) return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;
      if (o.state === STARTED) return timeout_default(start2);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id2) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default(function () {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return;
    self.state = STARTED;
    tween = new Array((n = self.tween.length));
    for (i = 0, j = -1; i < n; ++i) {
      if ((o = self.tween[i].value.call(node, node.__data__, self.index, self.group))) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t =
        elapsed < self.duration
          ? self.ease.call(null, elapsed / self.duration)
          : (self.timer.restart(stop), (self.state = ENDING), 1),
      i = -1,
      n = tween.length;
    while (++i < n) {
      tween[i].call(node, t);
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id2];
    for (var i in schedules) return;
    delete node.__transition;
  }
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/interrupt.js
function interrupt_default(node, name) {
  var schedules = node.__transition,
    schedule,
    active,
    empty2 = true,
    i;
  if (!schedules) return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty2 = false;
      continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }
  if (empty2) delete node.__transition;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/interrupt.js
function interrupt_default2(name) {
  return this.each(function () {
    interrupt_default(this, name);
  });
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/tween.js
function tweenRemove(id2, name) {
  var tween0, tween1;
  return function () {
    var schedule = set2(this, id2),
      tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule.tween = tween1;
  };
}
function tweenFunction(id2, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule = set2(this, id2),
      tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id2).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
}
function tweenValue(transition2, name, value) {
  var id2 = transition2._id;
  transition2.each(function () {
    var schedule = set2(this, id2);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });
  return function (node) {
    return get2(node, id2).value[name];
  };
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/interpolate.js
function interpolate_default(a, b) {
  var c;
  return (
    typeof b === "number"
      ? number_default
      : b instanceof color
        ? rgb_default
        : (c = color(b))
          ? ((b = c), rgb_default)
          : string_default
  )(a, b);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/attr.js
function attrRemove2(name) {
  return function () {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate, value1) {
  var string00,
    string1 = value1 + "",
    interpolate0;
  return function () {
    var string0 = this.getAttribute(name);
    return string0 === string1
      ? null
      : string0 === string00
        ? interpolate0
        : (interpolate0 = interpolate((string00 = string0), value1));
  };
}
function attrConstantNS2(fullname, interpolate, value1) {
  var string00,
    string1 = value1 + "",
    interpolate0;
  return function () {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1
      ? null
      : string0 === string00
        ? interpolate0
        : (interpolate0 = interpolate((string00 = string0), value1));
  };
}
function attrFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function () {
    var string0,
      value1 = value(this),
      string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
        ? interpolate0
        : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)));
  };
}
function attrFunctionNS2(fullname, interpolate, value) {
  var string00, string10, interpolate0;
  return function () {
    var string0,
      value1 = value(this),
      string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
        ? interpolate0
        : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name),
    i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(
    name,
    typeof value === "function"
      ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null
        ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname)
        : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value),
  );
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/attrTween.js
function attrInterpolate(name, i) {
  return function (t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function (t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/delay.js
function delayFunction(id2, value) {
  return function () {
    init(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id2, value) {
  return (
    (value = +value),
    function () {
      init(this, id2).delay = value;
    }
  );
}
function delay_default(value) {
  var id2 = this._id;
  return arguments.length
    ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value))
    : get2(this.node(), id2).delay;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/duration.js
function durationFunction(id2, value) {
  return function () {
    set2(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id2, value) {
  return (
    (value = +value),
    function () {
      set2(this, id2).duration = value;
    }
  );
}
function duration_default(value) {
  var id2 = this._id;
  return arguments.length
    ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value))
    : get2(this.node(), id2).duration;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/ease.js
function easeConstant(id2, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set2(this, id2).ease = value;
  };
}
function ease_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/easeVarying.js
function easeVarying(id2, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error();
    set2(this, id2).ease = v;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function") throw new Error();
  return this.each(easeVarying(this._id, value));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/filter.js
function filter_default2(match) {
  if (typeof match !== "function") match = matcher_default(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = (subgroups[j] = []), node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/merge.js
function merge_default2(transition2) {
  if (transition2._id !== this._id) throw new Error();
  for (
    var groups0 = this._groups,
      groups1 = transition2._groups,
      m0 = groups0.length,
      m1 = groups1.length,
      m = Math.min(m0, m1),
      merges = new Array(m0),
      j = 0;
    j < m;
    ++j
  ) {
    for (
      var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = (merges[j] = new Array(n)), node, i = 0;
      i < n;
      ++i
    ) {
      if ((node = group0[i] || group1[i])) {
        merge[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/on.js
function start(name) {
  return (name + "")
    .trim()
    .split(/^|\s+/)
    .every(function (t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
}
function onFunction(id2, name, listener) {
  var on0,
    on1,
    sit = start(name) ? init : set2;
  return function () {
    var schedule = sit(this, id2),
      on = schedule.on;
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/remove.js
function removeFunction(id2) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id2) return;
    if (parent) parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/select.js
function select_default2(select) {
  var name = this._name,
    id2 = this._id;
  if (typeof select !== "function") select = selector_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (
      var group = groups[j], n = group.length, subgroup = (subgroups[j] = new Array(n)), node, subnode, i = 0;
      i < n;
      ++i
    ) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule_default(subgroup[i], name, id2, i, subgroup, get2(node, id2));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id2);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/selectAll.js
function selectAll_default2(select) {
  var name = this._name,
    id2 = this._id;
  if (typeof select !== "function") select = selectorAll_default(select);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        for (
          var children2 = select.call(node, node.__data__, i, group),
            child,
            inherit2 = get2(node, id2),
            k = 0,
            l = children2.length;
          k < l;
          ++k
        ) {
          if ((child = children2[k])) {
            schedule_default(child, name, id2, k, children2, inherit2);
          }
        }
        subgroups.push(children2);
        parents.push(node);
      }
    }
  }
  return new Transition(subgroups, parents, name, id2);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/selection.js
var Selection2 = selection_default.prototype.constructor;
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/style.js
function styleNull(name, interpolate) {
  var string00, string10, interpolate0;
  return function () {
    var string0 = styleValue(this, name),
      string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
        ? interpolate0
        : (interpolate0 = interpolate((string00 = string0), (string10 = string1)));
  };
}
function styleRemove2(name) {
  return function () {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate, value1) {
  var string00,
    string1 = value1 + "",
    interpolate0;
  return function () {
    var string0 = styleValue(this, name);
    return string0 === string1
      ? null
      : string0 === string00
        ? interpolate0
        : (interpolate0 = interpolate((string00 = string0), value1));
  };
}
function styleFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function () {
    var string0 = styleValue(this, name),
      value1 = value(this),
      string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1
      ? null
      : string0 === string00 && string1 === string10
        ? interpolate0
        : ((string10 = string1), (interpolate0 = interpolate((string00 = string0), value1)));
  };
}
function styleMaybeRemove(id2, name) {
  var on0,
    on1,
    listener0,
    key = "style." + name,
    event = "end." + key,
    remove2;
  return function () {
    var schedule = set2(this, id2),
      on = schedule.on,
      listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, (listener0 = listener));
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null
    ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name))
    : typeof value === "function"
      ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(
          styleMaybeRemove(this._id, name),
        )
      : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/styleTween.js
function styleInterpolate(name, i, priority) {
  return function (t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/text.js
function textConstant2(value) {
  return function () {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween(
    "text",
    typeof value === "function"
      ? textFunction2(tweenValue(this, "text", value))
      : textConstant2(value == null ? "" : value + ""),
  );
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/textTween.js
function textInterpolate(i) {
  return function (t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, textTween(value));
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/transition.js
function transition_default() {
  var name = this._name,
    id0 = this._id,
    id1 = newId();
  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        var inherit2 = get2(node, id0);
        schedule_default(node, name, id1, i, group, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease,
        });
      }
    }
  }
  return new Transition(groups, this._parents, name, id1);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/end.js
function end_default() {
  var on0,
    on1,
    that = this,
    id2 = that._id,
    size = that.size();
  return new Promise(function (resolve, reject) {
    var cancel = { value: reject },
      end = {
        value: function () {
          if (--size === 0) resolve();
        },
      };
    that.each(function () {
      var schedule = set2(this, id2),
        on = schedule.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule.on = on1;
    });
    if (size === 0) resolve();
  });
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/transition/index.js
var id = 0;
function Transition(groups, parents, name, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function transition(name) {
  return selection_default().transition(name);
}
function newId() {
  return ++id;
}
var selection_prototype = selection_default.prototype;
Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: select_default2,
  selectAll: selectAll_default2,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: filter_default2,
  merge: merge_default2,
  selection: selection_default2,
  transition: transition_default,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: on_default2,
  attr: attr_default2,
  attrTween: attrTween_default,
  style: style_default2,
  styleTween: styleTween_default,
  text: text_default2,
  textTween: textTween_default,
  remove: remove_default2,
  tween: tween_default,
  delay: delay_default,
  duration: duration_default,
  ease: ease_default,
  easeVarying: easeVarying_default,
  end: end_default,
  [Symbol.iterator]: selection_prototype[Symbol.iterator],
};

// node_modules/.bun/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/transition.js
var defaultTiming = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut,
};
function inherit(node, id2) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id2])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    ((id2 = name._id), (name = name._name));
  } else {
    ((id2 = newId()), ((timing = defaultTiming).time = now()), (name = name == null ? null : name + ""));
  }
  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if ((node = group[i])) {
        schedule_default(node, name, id2, i, group, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}

// node_modules/.bun/d3-transition@3.0.1+ddb27bb92657a88b/node_modules/d3-transition/src/selection/index.js
selection_default.prototype.interrupt = interrupt_default2;
selection_default.prototype.transition = transition_default2;

// node_modules/.bun/d3-brush@3.0.0/node_modules/d3-brush/src/brush.js
var { abs, max, min } = Math;
function number1(e) {
  return [+e[0], +e[1]];
}
function number2(e) {
  return [number1(e[0]), number1(e[1])];
}
var X = {
  name: "x",
  handles: ["w", "e"].map(type),
  input: function (x2, e) {
    return x2 == null
      ? null
      : [
          [+x2[0], e[0][1]],
          [+x2[1], e[1][1]],
        ];
  },
  output: function (xy) {
    return xy && [xy[0][0], xy[1][0]];
  },
};
var Y = {
  name: "y",
  handles: ["n", "s"].map(type),
  input: function (y2, e) {
    return y2 == null
      ? null
      : [
          [e[0][0], +y2[0]],
          [e[1][0], +y2[1]],
        ];
  },
  output: function (xy) {
    return xy && [xy[0][1], xy[1][1]];
  },
};
var XY = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
  input: function (xy) {
    return xy == null ? null : number2(xy);
  },
  output: function (xy) {
    return xy;
  },
};
function type(t) {
  return { type: t };
}

// node_modules/.bun/d3-path@3.1.0/node_modules/d3-path/src/path.js
var pi = Math.PI;
var tau = 2 * pi;
var epsilon = 1e-6;
var tauEpsilon = tau - epsilon;
function append(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d > 15) return append;
  const k = 10 ** d;
  return function (strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k) / k + strings[i];
    }
  };
}
var Path = class {
  constructor(digits) {
    this._x0 =
      this._y0 = // start of current subpath
      this._x1 =
      this._y1 =
        null;
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
  }
  moveTo(x2, y2) {
    this._append`M${(this._x0 = this._x1 = +x2)},${(this._y0 = this._y1 = +y2)}`;
  }
  closePath() {
    if (this._x1 !== null) {
      ((this._x1 = this._x0), (this._y1 = this._y0));
      this._append`Z`;
    }
  }
  lineTo(x2, y2) {
    this._append`L${(this._x1 = +x2)},${(this._y1 = +y2)}`;
  }
  quadraticCurveTo(x1, y1, x2, y2) {
    this._append`Q${+x1},${+y1},${(this._x1 = +x2)},${(this._y1 = +y2)}`;
  }
  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    this._append`C${+x1},${+y1},${+x2},${+y2},${(this._x1 = +x3)},${(this._y1 = +y3)}`;
  }
  arcTo(x1, y1, x2, y2, r) {
    ((x1 = +x1), (y1 = +y1), (x2 = +x2), (y2 = +y2), (r = +r));
    if (r < 0) throw new Error(`negative radius: ${r}`);
    let x0 = this._x1,
      y0 = this._y1,
      x21 = x2 - x1,
      y21 = y2 - y1,
      x01 = x0 - x1,
      y01 = y0 - y1,
      l01_2 = x01 * x01 + y01 * y01;
    if (this._x1 === null) {
      this._append`M${(this._x1 = x1)},${(this._y1 = y1)}`;
    } else if (!(l01_2 > epsilon));
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._append`L${(this._x1 = x1)},${(this._y1 = y1)}`;
    } else {
      let x20 = x2 - x0,
        y20 = y2 - y0,
        l21_2 = x21 * x21 + y21 * y21,
        l20_2 = x20 * x20 + y20 * y20,
        l21 = Math.sqrt(l21_2),
        l01 = Math.sqrt(l01_2),
        l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
        t01 = l / l01,
        t21 = l / l21;
      if (Math.abs(t01 - 1) > epsilon) {
        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }
      this
        ._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${(this._x1 = x1 + t21 * x21)},${(this._y1 = y1 + t21 * y21)}`;
    }
  }
  arc(x2, y2, r, a0, a1, ccw) {
    ((x2 = +x2), (y2 = +y2), (r = +r), (ccw = !!ccw));
    if (r < 0) throw new Error(`negative radius: ${r}`);
    let dx = r * Math.cos(a0),
      dy = r * Math.sin(a0),
      x0 = x2 + dx,
      y0 = y2 + dy,
      cw = 1 ^ ccw,
      da = ccw ? a0 - a1 : a1 - a0;
    if (this._x1 === null) {
      this._append`M${x0},${y0}`;
    } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._append`L${x0},${y0}`;
    }
    if (!r) return;
    if (da < 0) da = (da % tau) + tau;
    if (da > tauEpsilon) {
      this
        ._append`A${r},${r},0,1,${cw},${x2 - dx},${y2 - dy}A${r},${r},0,1,${cw},${(this._x1 = x0)},${(this._y1 = y0)}`;
    } else if (da > epsilon) {
      this
        ._append`A${r},${r},0,${+(da >= pi)},${cw},${(this._x1 = x2 + r * Math.cos(a1))},${(this._y1 = y2 + r * Math.sin(a1))}`;
    }
  }
  rect(x2, y2, w, h) {
    this._append`M${(this._x0 = this._x1 = +x2)},${(this._y0 = this._y1 = +y2)}h${(w = +w)}v${+h}h${-w}Z`;
  }
  toString() {
    return this._;
  }
};
function path() {
  return new Path();
}
path.prototype = Path.prototype;

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/count.js
function count(node) {
  var sum = 0,
    children2 = node.children,
    i = children2 && children2.length;
  if (!i) sum = 1;
  else while (--i >= 0) sum += children2[i].value;
  node.value = sum;
}
function count_default() {
  return this.eachAfter(count);
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/each.js
function each_default2(callback, that) {
  let index = -1;
  for (const node of this) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
function eachBefore_default(callback, that) {
  var node = this,
    nodes = [node],
    children2,
    i,
    index = -1;
  while ((node = nodes.pop())) {
    callback.call(that, node, ++index, this);
    if ((children2 = node.children)) {
      for (i = children2.length - 1; i >= 0; --i) {
        nodes.push(children2[i]);
      }
    }
  }
  return this;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
function eachAfter_default(callback, that) {
  var node = this,
    nodes = [node],
    next = [],
    children2,
    i,
    n,
    index = -1;
  while ((node = nodes.pop())) {
    next.push(node);
    if ((children2 = node.children)) {
      for (i = 0, n = children2.length; i < n; ++i) {
        nodes.push(children2[i]);
      }
    }
  }
  while ((node = next.pop())) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/find.js
function find_default(callback, that) {
  let index = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index, this)) {
      return node;
    }
  }
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sum.js
function sum_default(value) {
  return this.eachAfter(function (node) {
    var sum = +value(node.data) || 0,
      children2 = node.children,
      i = children2 && children2.length;
    while (--i >= 0) sum += children2[i].value;
    node.value = sum;
  });
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sort.js
function sort_default2(compare) {
  return this.eachBefore(function (node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/path.js
function path_default(end) {
  var start2 = this,
    ancestor = leastCommonAncestor(start2, end),
    nodes = [start2];
  while (start2 !== ancestor) {
    start2 = start2.parent;
    nodes.push(start2);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}
function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
    bNodes = b.ancestors(),
    c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/ancestors.js
function ancestors_default() {
  var node = this,
    nodes = [node];
  while ((node = node.parent)) {
    nodes.push(node);
  }
  return nodes;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/descendants.js
function descendants_default() {
  return Array.from(this);
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/leaves.js
function leaves_default() {
  var leaves = [];
  this.eachBefore(function (node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/links.js
function links_default() {
  var root2 = this,
    links = [];
  root2.each(function (node) {
    if (node !== root2) {
      links.push({ source: node.parent, target: node });
    }
  });
  return links;
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/iterator.js
function* iterator_default2() {
  var node = this,
    current,
    next = [node],
    children2,
    i,
    n;
  do {
    ((current = next.reverse()), (next = []));
    while ((node = current.pop())) {
      yield node;
      if ((children2 = node.children)) {
        for (i = 0, n = children2.length; i < n; ++i) {
          next.push(children2[i]);
        }
      }
    }
  } while (next.length);
}

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/index.js
function hierarchy(data, children2) {
  if (data instanceof Map) {
    data = [void 0, data];
    if (children2 === void 0) children2 = mapChildren;
  } else if (children2 === void 0) {
    children2 = objectChildren;
  }
  var root2 = new Node2(data),
    node,
    nodes = [root2],
    child,
    childs,
    i,
    n;
  while ((node = nodes.pop())) {
    if ((childs = children2(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push((child = childs[i] = new Node2(childs[i])));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root2.eachBefore(computeHeight);
}
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d) {
  return d.children;
}
function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null;
}
function copyData(node) {
  if (node.data.value !== void 0) node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && node.height < ++height);
}
function Node2(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
Node2.prototype = hierarchy.prototype = {
  constructor: Node2,
  count: count_default,
  each: each_default2,
  eachAfter: eachAfter_default,
  eachBefore: eachBefore_default,
  find: find_default,
  sum: sum_default,
  sort: sort_default2,
  path: path_default,
  ancestors: ancestors_default,
  descendants: descendants_default,
  leaves: leaves_default,
  links: links_default,
  copy: node_copy,
  [Symbol.iterator]: iterator_default2,
};

// node_modules/.bun/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/tree.js
function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
function nextLeft(v) {
  var children2 = v.children;
  return children2 ? children2[0] : v.t;
}
function nextRight(v) {
  var children2 = v.children;
  return children2 ? children2[children2.length - 1] : v.t;
}
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}
function executeShifts(v) {
  var shift = 0,
    change = 0,
    children2 = v.children,
    i = children2.length,
    w;
  while (--i >= 0) {
    w = children2[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}
function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i;
}
TreeNode.prototype = Object.create(Node2.prototype);
function treeRoot(root2) {
  var tree = new TreeNode(root2, 0),
    node,
    nodes = [tree],
    child,
    children2,
    i,
    n;
  while ((node = nodes.pop())) {
    if ((children2 = node._.children)) {
      node.children = new Array((n = children2.length));
      for (i = n - 1; i >= 0; --i) {
        nodes.push((child = node.children[i] = new TreeNode(children2[i], i)));
        child.parent = node;
      }
    }
  }
  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}
function tree_default() {
  var separation = defaultSeparation,
    dx = 1,
    dy = 1,
    nodeSize = null;
  function tree(root2) {
    var t = treeRoot(root2);
    (t.eachAfter(firstWalk), (t.parent.m = -t.z));
    t.eachBefore(secondWalk);
    if (nodeSize) root2.eachBefore(sizeNode);
    else {
      var left = root2,
        right = root2,
        bottom = root2;
      root2.eachBefore(function (node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2,
        tx = s - left.x,
        kx = dx / (right.x + s + tx),
        ky = dy / (bottom.depth || 1);
      root2.eachBefore(function (node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }
    return root2;
  }
  function firstWalk(v) {
    var children2 = v.children,
      siblings = v.parent.children,
      w = v.i ? siblings[v.i - 1] : null;
    if (children2) {
      executeShifts(v);
      var midpoint = (children2[0].z + children2[children2.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
        vop = v,
        vim = w,
        vom = vip.parent.children[0],
        sip = vip.m,
        sop = vop.m,
        sim = vim.m,
        som = vom.m,
        shift;
      while (((vim = nextRight(vim)), (vip = nextLeft(vip)), vim && vip)) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }
  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }
  tree.separation = function (x2) {
    return arguments.length ? ((separation = x2), tree) : separation;
  };
  tree.size = function (x2) {
    return arguments.length ? ((nodeSize = false), (dx = +x2[0]), (dy = +x2[1]), tree) : nodeSize ? null : [dx, dy];
  };
  tree.nodeSize = function (x2) {
    return arguments.length ? ((nodeSize = true), (dx = +x2[0]), (dy = +x2[1]), tree) : nodeSize ? [dx, dy] : null;
  };
  return tree;
}

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/constant.js
function constant_default4(x2) {
  return function constant() {
    return x2;
  };
}

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/path.js
function withPath(shape) {
  let digits = 3;
  shape.digits = function (_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    return shape;
  };
  return () => new Path(digits);
}

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/array.js
var slice = Array.prototype.slice;

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/point.js
function x(p) {
  return p[0];
}
function y(p) {
  return p[1];
}

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/curve/bump.js
var Bump = class {
  constructor(context, x2) {
    this._context = context;
    this._x = x2;
  }
  areaStart() {
    this._line = 0;
  }
  areaEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x2, y2) {
    ((x2 = +x2), (y2 = +y2));
    switch (this._point) {
      case 0: {
        this._point = 1;
        if (this._line) this._context.lineTo(x2, y2);
        else this._context.moveTo(x2, y2);
        break;
      }
      case 1:
        this._point = 2;
      // falls through
      default: {
        if (this._x) this._context.bezierCurveTo((this._x0 = (this._x0 + x2) / 2), this._y0, this._x0, y2, x2, y2);
        else this._context.bezierCurveTo(this._x0, (this._y0 = (this._y0 + y2) / 2), x2, this._y0, x2, y2);
        break;
      }
    }
    ((this._x0 = x2), (this._y0 = y2));
  }
};
function bumpY(context) {
  return new Bump(context, false);
}

// node_modules/.bun/d3-shape@3.2.0/node_modules/d3-shape/src/link.js
function linkSource(d) {
  return d.source;
}
function linkTarget(d) {
  return d.target;
}
function link(curve) {
  let source = linkSource,
    target = linkTarget,
    x2 = x,
    y2 = y,
    context = null,
    output = null,
    path2 = withPath(link3);
  function link3() {
    let buffer;
    const argv = slice.call(arguments);
    const s = source.apply(this, argv);
    const t = target.apply(this, argv);
    if (context == null) output = curve((buffer = path2()));
    output.lineStart();
    ((argv[0] = s), output.point(+x2.apply(this, argv), +y2.apply(this, argv)));
    ((argv[0] = t), output.point(+x2.apply(this, argv), +y2.apply(this, argv)));
    output.lineEnd();
    if (buffer) return ((output = null), buffer + "" || null);
  }
  link3.source = function (_) {
    return arguments.length ? ((source = _), link3) : source;
  };
  link3.target = function (_) {
    return arguments.length ? ((target = _), link3) : target;
  };
  link3.x = function (_) {
    return arguments.length ? ((x2 = typeof _ === "function" ? _ : constant_default4(+_)), link3) : x2;
  };
  link3.y = function (_) {
    return arguments.length ? ((y2 = typeof _ === "function" ? _ : constant_default4(+_)), link3) : y2;
  };
  link3.context = function (_) {
    return arguments.length
      ? (_ == null ? (context = output = null) : (output = curve((context = _))), link3)
      : context;
  };
  return link3;
}
function linkVertical() {
  return link(bumpY);
}

// node_modules/.bun/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js
function Transform(k, x2, y2) {
  this.k = k;
  this.x = x2;
  this.y = y2;
}
Transform.prototype = {
  constructor: Transform,
  scale: function (k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function (x2, y2) {
    return (x2 === 0) & (y2 === 0) ? this : new Transform(this.k, this.x + this.k * x2, this.y + this.k * y2);
  },
  apply: function (point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function (x2) {
    return x2 * this.k + this.x;
  },
  applyY: function (y2) {
    return y2 * this.k + this.y;
  },
  invert: function (location2) {
    return [(location2[0] - this.x) / this.k, (location2[1] - this.y) / this.k];
  },
  invertX: function (x2) {
    return (x2 - this.x) / this.k;
  },
  invertY: function (y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function (x2) {
    return x2.copy().domain(x2.range().map(this.invertX, this).map(x2.invert, x2));
  },
  rescaleY: function (y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function () {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  },
};
var identity2 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
function transform(node) {
  while (!node.__zoom) if (!(node = node.parentNode)) return identity2;
  return node.__zoom;
}

// node_modules/.bun/dompurify@3.3.3/node_modules/dompurify/dist/purify.es.mjs
var { entries, setPrototypeOf, isFrozen, getPrototypeOf, getOwnPropertyDescriptor } = Object;
var { freeze, seal, create: create2 } = Object;
var { apply, construct } = typeof Reflect !== "undefined" && Reflect;
if (!freeze) {
  freeze = function freeze2(x2) {
    return x2;
  };
}
if (!seal) {
  seal = function seal2(x2) {
    return x2;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function (thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set3, array2) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set3, null);
  }
  let l = array2.length;
  while (l--) {
    let element = array2[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array2)) {
          array2[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set3[element] = true;
  }
  return set3;
}
function cleanArray(array2) {
  for (let index = 0; index < array2.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array2, index);
    if (!isPropertyExist) {
      array2[index] = null;
    }
  }
  return array2;
}
function clone(object) {
  const newObject = create2(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
var html$1 = freeze([
  "a",
  "abbr",
  "acronym",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "big",
  "blink",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "content",
  "data",
  "datalist",
  "dd",
  "decorator",
  "del",
  "details",
  "dfn",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "element",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "font",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "map",
  "mark",
  "marquee",
  "menu",
  "menuitem",
  "meter",
  "nav",
  "nobr",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "select",
  "shadow",
  "slot",
  "small",
  "source",
  "spacer",
  "span",
  "strike",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "tt",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
]);
var svg$1 = freeze([
  "svg",
  "a",
  "altglyph",
  "altglyphdef",
  "altglyphitem",
  "animatecolor",
  "animatemotion",
  "animatetransform",
  "circle",
  "clippath",
  "defs",
  "desc",
  "ellipse",
  "enterkeyhint",
  "exportparts",
  "filter",
  "font",
  "g",
  "glyph",
  "glyphref",
  "hkern",
  "image",
  "inputmode",
  "line",
  "lineargradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "part",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialgradient",
  "rect",
  "stop",
  "style",
  "switch",
  "symbol",
  "text",
  "textpath",
  "title",
  "tref",
  "tspan",
  "view",
  "vkern",
]);
var svgFilters = freeze([
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
]);
var svgDisallowed = freeze([
  "animate",
  "color-profile",
  "cursor",
  "discard",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignobject",
  "hatch",
  "hatchpath",
  "mesh",
  "meshgradient",
  "meshpatch",
  "meshrow",
  "missing-glyph",
  "script",
  "set",
  "solidcolor",
  "unknown",
  "use",
]);
var mathMl$1 = freeze([
  "math",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mglyph",
  "mi",
  "mlabeledtr",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msup",
  "msubsup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "mprescripts",
]);
var mathMlDisallowed = freeze([
  "maction",
  "maligngroup",
  "malignmark",
  "mlongdiv",
  "mscarries",
  "mscarry",
  "msgroup",
  "mstack",
  "msline",
  "msrow",
  "semantics",
  "annotation",
  "annotation-xml",
  "mprescripts",
  "none",
]);
var text = freeze(["#text"]);
var html = freeze([
  "accept",
  "action",
  "align",
  "alt",
  "autocapitalize",
  "autocomplete",
  "autopictureinpicture",
  "autoplay",
  "background",
  "bgcolor",
  "border",
  "capture",
  "cellpadding",
  "cellspacing",
  "checked",
  "cite",
  "class",
  "clear",
  "color",
  "cols",
  "colspan",
  "controls",
  "controlslist",
  "coords",
  "crossorigin",
  "datetime",
  "decoding",
  "default",
  "dir",
  "disabled",
  "disablepictureinpicture",
  "disableremoteplayback",
  "download",
  "draggable",
  "enctype",
  "enterkeyhint",
  "exportparts",
  "face",
  "for",
  "headers",
  "height",
  "hidden",
  "high",
  "href",
  "hreflang",
  "id",
  "inert",
  "inputmode",
  "integrity",
  "ismap",
  "kind",
  "label",
  "lang",
  "list",
  "loading",
  "loop",
  "low",
  "max",
  "maxlength",
  "media",
  "method",
  "min",
  "minlength",
  "multiple",
  "muted",
  "name",
  "nonce",
  "noshade",
  "novalidate",
  "nowrap",
  "open",
  "optimum",
  "part",
  "pattern",
  "placeholder",
  "playsinline",
  "popover",
  "popovertarget",
  "popovertargetaction",
  "poster",
  "preload",
  "pubdate",
  "radiogroup",
  "readonly",
  "rel",
  "required",
  "rev",
  "reversed",
  "role",
  "rows",
  "rowspan",
  "spellcheck",
  "scope",
  "selected",
  "shape",
  "size",
  "sizes",
  "slot",
  "span",
  "srclang",
  "start",
  "src",
  "srcset",
  "step",
  "style",
  "summary",
  "tabindex",
  "title",
  "translate",
  "type",
  "usemap",
  "valign",
  "value",
  "width",
  "wrap",
  "xmlns",
  "slot",
]);
var svg = freeze([
  "accent-height",
  "accumulate",
  "additive",
  "alignment-baseline",
  "amplitude",
  "ascent",
  "attributename",
  "attributetype",
  "azimuth",
  "basefrequency",
  "baseline-shift",
  "begin",
  "bias",
  "by",
  "class",
  "clip",
  "clippathunits",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "cx",
  "cy",
  "d",
  "dx",
  "dy",
  "diffuseconstant",
  "direction",
  "display",
  "divisor",
  "dur",
  "edgemode",
  "elevation",
  "end",
  "exponent",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "filterunits",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "fx",
  "fy",
  "g1",
  "g2",
  "glyph-name",
  "glyphref",
  "gradientunits",
  "gradienttransform",
  "height",
  "href",
  "id",
  "image-rendering",
  "in",
  "in2",
  "intercept",
  "k",
  "k1",
  "k2",
  "k3",
  "k4",
  "kerning",
  "keypoints",
  "keysplines",
  "keytimes",
  "lang",
  "lengthadjust",
  "letter-spacing",
  "kernelmatrix",
  "kernelunitlength",
  "lighting-color",
  "local",
  "marker-end",
  "marker-mid",
  "marker-start",
  "markerheight",
  "markerunits",
  "markerwidth",
  "maskcontentunits",
  "maskunits",
  "max",
  "mask",
  "mask-type",
  "media",
  "method",
  "mode",
  "min",
  "name",
  "numoctaves",
  "offset",
  "operator",
  "opacity",
  "order",
  "orient",
  "orientation",
  "origin",
  "overflow",
  "paint-order",
  "path",
  "pathlength",
  "patterncontentunits",
  "patterntransform",
  "patternunits",
  "points",
  "preservealpha",
  "preserveaspectratio",
  "primitiveunits",
  "r",
  "rx",
  "ry",
  "radius",
  "refx",
  "refy",
  "repeatcount",
  "repeatdur",
  "restart",
  "result",
  "rotate",
  "scale",
  "seed",
  "shape-rendering",
  "slope",
  "specularconstant",
  "specularexponent",
  "spreadmethod",
  "startoffset",
  "stddeviation",
  "stitchtiles",
  "stop-color",
  "stop-opacity",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke",
  "stroke-width",
  "style",
  "surfacescale",
  "systemlanguage",
  "tabindex",
  "tablevalues",
  "targetx",
  "targety",
  "transform",
  "transform-origin",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "textlength",
  "type",
  "u1",
  "u2",
  "unicode",
  "values",
  "viewbox",
  "visibility",
  "version",
  "vert-adv-y",
  "vert-origin-x",
  "vert-origin-y",
  "width",
  "word-spacing",
  "wrap",
  "writing-mode",
  "xchannelselector",
  "ychannelselector",
  "x",
  "x1",
  "x2",
  "xmlns",
  "y",
  "y1",
  "y2",
  "z",
  "zoomandpan",
]);
var mathMl = freeze([
  "accent",
  "accentunder",
  "align",
  "bevelled",
  "close",
  "columnsalign",
  "columnlines",
  "columnspan",
  "denomalign",
  "depth",
  "dir",
  "display",
  "displaystyle",
  "encoding",
  "fence",
  "frame",
  "height",
  "href",
  "id",
  "largeop",
  "length",
  "linethickness",
  "lspace",
  "lquote",
  "mathbackground",
  "mathcolor",
  "mathsize",
  "mathvariant",
  "maxsize",
  "minsize",
  "movablelimits",
  "notation",
  "numalign",
  "open",
  "rowalign",
  "rowlines",
  "rowspacing",
  "rowspan",
  "rspace",
  "rquote",
  "scriptlevel",
  "scriptminsize",
  "scriptsizemultiplier",
  "selection",
  "separator",
  "separators",
  "stretchy",
  "subscriptshift",
  "supscriptshift",
  "symmetric",
  "voffset",
  "width",
  "xmlns",
]);
var xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // eslint-disable-line no-useless-escape
);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g,
  // eslint-disable-line no-control-regex
);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR,
  ATTR_WHITESPACE,
  CUSTOM_ELEMENT,
  DATA_ATTR,
  DOCTYPE_NAME,
  ERB_EXPR,
  IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR,
  TMPLIT_EXPR,
});
var NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12,
  // Deprecated
};
var getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html3) {
        return html3;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      },
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
var _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: [],
  };
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root2) => createDOMPurify(root2);
  DOMPurify.version = "3.3.3";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let { document: document2 } = window2;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node: Node3,
    Element: Element2,
    NodeFilter,
    NamedNodeMap = window2.NamedNodeMap || window2.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes,
  } = window2;
  const ElementPrototype = Element2.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove2 = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  const { implementation, createNodeIterator, createDocumentFragment, getElementsByTagName } = document2;
  const { importNode } = originalDocument;
  let hooks = _createHooksMap();
  DOMPurify.isSupported =
    typeof entries === "function" &&
    typeof getParentNode === "function" &&
    implementation &&
    implementation.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: MUSTACHE_EXPR2,
    ERB_EXPR: ERB_EXPR2,
    TMPLIT_EXPR: TMPLIT_EXPR2,
    DATA_ATTR: DATA_ATTR2,
    ARIA_ATTR: ARIA_ATTR2,
    IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA2,
    ATTR_WHITESPACE: ATTR_WHITESPACE2,
    CUSTOM_ELEMENT: CUSTOM_ELEMENT2,
  } = EXPRESSIONS;
  let { IS_ALLOWED_URI: IS_ALLOWED_URI$1 } = EXPRESSIONS;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(
    create2(null, {
      tagNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null,
      },
      attributeNameCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null,
      },
      allowCustomizedBuiltInElements: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: false,
      },
    }),
  );
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(
    create2(null, {
      tagCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null,
      },
      attributeCheck: {
        writable: true,
        configurable: false,
        enumerable: true,
        value: null,
      },
    }),
  );
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, [
    "annotation-xml",
    "audio",
    "colgroup",
    "desc",
    "foreignobject",
    "head",
    "iframe",
    "math",
    "mi",
    "mn",
    "mo",
    "ms",
    "mtext",
    "noembed",
    "noframes",
    "noscript",
    "plaintext",
    "script",
    "style",
    "svg",
    "template",
    "thead",
    "title",
    "video",
    "xmp",
  ]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
    "alt",
    "class",
    "for",
    "id",
    "label",
    "name",
    "pattern",
    "placeholder",
    "role",
    "summary",
    "title",
    "value",
    "style",
    "xmlns",
  ]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
      SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1
        ? DEFAULT_PARSER_MEDIA_TYPE
        : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS")
      ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc)
      : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR")
      ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc)
      : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES")
      ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString)
      : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR")
      ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc)
      : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS")
      ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc)
      : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS")
      ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc)
      : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS")
      ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc)
      : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR")
      ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc)
      : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (
      cfg.CUSTOM_ELEMENT_HANDLING &&
      typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean"
    ) {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements =
        cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = create2(null);
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    if (!objectHasOwnProperty(cfg, "ADD_TAGS")) {
      EXTRA_ELEMENT_HANDLING.tagCheck = null;
    }
    if (!objectHasOwnProperty(cfg, "ADD_ATTR")) {
      EXTRA_ELEMENT_HANDLING.attributeCheck = null;
    }
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (cfg.ADD_FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      emptyHTML = trustedTypesPolicy.createHTML("");
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
        emptyHTML = trustedTypesPolicy.createHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template",
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return (
          tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName])
        );
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node,
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove2(node);
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element,
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element,
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {}
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {}
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {}
    }
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {}
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root2) {
    return createNodeIterator.call(
      root2.ownerDocument || root2,
      root2,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT |
        NodeFilter.SHOW_COMMENT |
        NodeFilter.SHOW_TEXT |
        NodeFilter.SHOW_PROCESSING_INSTRUCTION |
        NodeFilter.SHOW_CDATA_SECTION,
      null,
    );
  };
  const _isClobbered = function _isClobbered2(element) {
    return (
      element instanceof HTMLFormElement &&
      (typeof element.nodeName !== "string" ||
        typeof element.textContent !== "string" ||
        typeof element.removeChild !== "function" ||
        !(element.attributes instanceof NamedNodeMap) ||
        typeof element.removeAttribute !== "function" ||
        typeof element.setAttribute !== "function" ||
        typeof element.namespaceURI !== "string" ||
        typeof element.insertBefore !== "function" ||
        typeof element.hasChildNodes !== "function")
    );
  };
  const _isNode = function _isNode2(value) {
    return typeof Node3 === "function" && value instanceof Node3;
  };
  function _executeHooks(hooks2, currentNode, data) {
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    let content = null;
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS,
    });
    if (
      SAFE_FOR_XML &&
      currentNode.hasChildNodes() &&
      !_isNode(currentNode.firstElementChild) &&
      regExpTest(/<[/\w!]/g, currentNode.innerHTML) &&
      regExpTest(/<[/\w!]/g, currentNode.textContent)
    ) {
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    if (
      !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) &&
      (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])
    ) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (
          CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp &&
          regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)
        ) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode instanceof Element2 && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if (
      (tagName === "noscript" || tagName === "noembed" || tagName === "noframes") &&
      regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)
    ) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        content = stringReplace(content, expr, " ");
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode(),
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (FORBID_ATTR[lcName]) {
      return false;
    }
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR2, lcName));
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR2, lcName));
    else if (
      EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function &&
      EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)
    );
    else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        (_isBasicCustomElement(lcTag) &&
          ((CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp &&
            regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag)) ||
            (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function &&
              CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag))) &&
          ((CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp &&
            regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName)) ||
            (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function &&
              CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)))) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        (lcName === "is" &&
          CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements &&
          ((CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp &&
            regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value)) ||
            (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))))
      );
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]);
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE2, "")));
    else if (
      (lcName === "src" || lcName === "xlink:href" || lcName === "href") &&
      lcTag !== "script" &&
      stringIndexOf(value, "data:") === 0 &&
      DATA_URI_TAGS[lcTag]
    );
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA2, stringReplace(value, ATTR_WHITESPACE2, "")));
    else if (value) {
      return false;
    } else;
    return true;
  };
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT2);
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const { attributes } = currentNode;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0,
    };
    let l = attributes.length;
    while (l--) {
      const attr = attributes[l];
      const { name, namespaceURI, value: attrValue } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (
        SAFE_FOR_XML &&
        regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)
      ) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          value = stringReplace(value, expr, " ");
        });
      }
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (
        trustedTypesPolicy &&
        typeof trustedTypes === "object" &&
        typeof trustedTypes.getAttributeType === "function"
      ) {
        if (namespaceURI);
        else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case "TrustedHTML": {
              value = trustedTypesPolicy.createHTML(value);
              break;
            }
            case "TrustedScriptURL": {
              value = trustedTypesPolicy.createScriptURL(value);
              break;
            }
          }
        }
      }
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM = function _sanitizeShadowDOM2(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while ((shadowNode = shadowIterator.nextNode())) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  DOMPurify.sanitize = function (dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      if (typeof dirty.toString === "function") {
        dirty = dirty.toString();
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      } else {
        throw typeErrorCreate("toString is not a function");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    DOMPurify.removed = [];
    if (typeof dirty === "string") {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
    } else if (dirty instanceof Node3) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
    } else {
      if (
        !RETURN_DOM &&
        !SAFE_FOR_TEMPLATES &&
        !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
        dirty.indexOf("<") === -1
      ) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    while ((currentNode = nodeIterator.nextNode())) {
      _sanitizeElements(currentNode);
      _sanitizeAttributes(currentNode);
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM(currentNode.content);
      }
    }
    if (IN_PLACE) {
      return dirty;
    }
    if (RETURN_DOM) {
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (
      WHOLE_DOCUMENT &&
      ALLOWED_TAGS["!doctype"] &&
      body.ownerDocument &&
      body.ownerDocument.doctype &&
      body.ownerDocument.doctype.name &&
      regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)
    ) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        serializedHTML = stringReplace(serializedHTML, expr, " ");
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function () {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function () {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function (tag2, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag2);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function (entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function (entryPoint, hookFunction) {
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function (entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function () {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();

// node_modules/.bun/marked@15.0.12/node_modules/marked/lib/marked.esm.js
function _getDefaults() {
  return {
    async: false,
    breaks: false,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    renderer: null,
    silent: false,
    tokenizer: null,
    walkTokens: null,
  };
}
var _defaults = _getDefaults();
function changeDefaults(newDefaults) {
  _defaults = newDefaults;
}
var noopTest = { exec: () => null };
function edit(regex, opt = "") {
  let source = typeof regex === "string" ? regex : regex.source;
  const obj = {
    replace: (name, val) => {
      let valSource = typeof val === "string" ? val : val.source;
      valSource = valSource.replace(other.caret, "$1");
      source = source.replace(name, valSource);
      return obj;
    },
    getRegex: () => {
      return new RegExp(source, opt);
    },
  };
  return obj;
}
var other = {
  codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  listReplaceTabs: /^\t+/,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\] /,
  listReplaceTask: /^\[[ xX]\] +/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (bull) => new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (indent) =>
    new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`),
  htmlBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}<(?:[a-z].*>|!--)`, "i"),
};
var newline = /^(?:[ \t]*(?:\n|$))+/;
var blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var fences =
  /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var bullet = /(?:[*+-]|\d{1,9}[.)])/;
var lheadingCore =
  /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var lheading = edit(lheadingCore)
  .replace(/bull/g, bullet)
  .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
  .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
  .replace(/blockquote/g, / {0,3}>/)
  .replace(/heading/g, / {0,3}#{1,6}/)
  .replace(/html/g, / {0,3}<[^\n>]+>\n/)
  .replace(/\|table/g, "")
  .getRegex();
var lheadingGfm = edit(lheadingCore)
  .replace(/bull/g, bullet)
  .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
  .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
  .replace(/blockquote/g, / {0,3}>/)
  .replace(/heading/g, / {0,3}#{1,6}/)
  .replace(/html/g, / {0,3}<[^\n>]+>\n/)
  .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/)
  .getRegex();
var _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var blockText = /^[^\n]+/;
var _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
var def = edit(
  /^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/,
)
  .replace("label", _blockLabel)
  .replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/)
  .getRegex();
var list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/)
  .replace(/bull/g, bullet)
  .getRegex();
var _tag =
  "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var html2 = edit(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i",
)
  .replace("comment", _comment)
  .replace("tag", _tag)
  .replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
  .getRegex();
var paragraph = edit(_paragraph)
  .replace("hr", hr)
  .replace("heading", " {0,3}#{1,6}(?:\\s|$)")
  .replace("|lheading", "")
  .replace("|table", "")
  .replace("blockquote", " {0,3}>")
  .replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
  .replace("list", " {0,3}(?:[*+-]|1[.)]) ")
  .replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
  .replace("tag", _tag)
  .getRegex();
var blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
  .replace("paragraph", paragraph)
  .getRegex();
var blockNormal = {
  blockquote,
  code: blockCode,
  def,
  fences,
  heading,
  hr,
  html: html2,
  lheading,
  list,
  newline,
  paragraph,
  table: noopTest,
  text: blockText,
};
var gfmTable = edit(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)",
)
  .replace("hr", hr)
  .replace("heading", " {0,3}#{1,6}(?:\\s|$)")
  .replace("blockquote", " {0,3}>")
  .replace("code", "(?: {4}| {0,3}	)[^\\n]")
  .replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
  .replace("list", " {0,3}(?:[*+-]|1[.)]) ")
  .replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
  .replace("tag", _tag)
  .getRegex();
var blockGfm = {
  ...blockNormal,
  lheading: lheadingGfm,
  table: gfmTable,
  paragraph: edit(_paragraph)
    .replace("hr", hr)
    .replace("heading", " {0,3}#{1,6}(?:\\s|$)")
    .replace("|lheading", "")
    .replace("table", gfmTable)
    .replace("blockquote", " {0,3}>")
    .replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
    .replace("list", " {0,3}(?:[*+-]|1[.)]) ")
    .replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)")
    .replace("tag", _tag)
    .getRegex(),
};
var blockPedantic = {
  ...blockNormal,
  html: edit(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`,
  )
    .replace("comment", _comment)
    .replace(
      /tag/g,
      "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b",
    )
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: noopTest,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: edit(_paragraph)
    .replace("hr", hr)
    .replace("heading", " *#{1,6} *[^\n]")
    .replace("lheading", lheading)
    .replace("|table", "")
    .replace("blockquote", " {0,3}>")
    .replace("|fences", "")
    .replace("|list", "")
    .replace("|html", "")
    .replace("|tag", "")
    .getRegex(),
};
var escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var br = /^( {2,}|\\)\n(?!\s*$)/;
var inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var _punctuation = /[\p{P}\p{S}]/u;
var _punctuationOrSpace = /[\s\p{P}\p{S}]/u;
var _notPunctuationOrSpace = /[^\s\p{P}\p{S}]/u;
var punctuation = edit(/^((?![*_])punctSpace)/, "u")
  .replace(/punctSpace/g, _punctuationOrSpace)
  .getRegex();
var _punctuationGfmStrongEm = /(?!~)[\p{P}\p{S}]/u;
var _punctuationOrSpaceGfmStrongEm = /(?!~)[\s\p{P}\p{S}]/u;
var _notPunctuationOrSpaceGfmStrongEm = /(?:[^\s\p{P}\p{S}]|~)/u;
var blockSkip = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g;
var emStrongLDelimCore = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
var emStrongLDelim = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuation).getRegex();
var emStrongLDelimGfm = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuationGfmStrongEm).getRegex();
var emStrongRDelimAstCore =
  "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var emStrongRDelimAst = edit(emStrongRDelimAstCore, "gu")
  .replace(/notPunctSpace/g, _notPunctuationOrSpace)
  .replace(/punctSpace/g, _punctuationOrSpace)
  .replace(/punct/g, _punctuation)
  .getRegex();
var emStrongRDelimAstGfm = edit(emStrongRDelimAstCore, "gu")
  .replace(/notPunctSpace/g, _notPunctuationOrSpaceGfmStrongEm)
  .replace(/punctSpace/g, _punctuationOrSpaceGfmStrongEm)
  .replace(/punct/g, _punctuationGfmStrongEm)
  .getRegex();
var emStrongRDelimUnd = edit(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu",
)
  .replace(/notPunctSpace/g, _notPunctuationOrSpace)
  .replace(/punctSpace/g, _punctuationOrSpace)
  .replace(/punct/g, _punctuation)
  .getRegex();
var anyPunctuation = edit(/\\(punct)/, "gu")
  .replace(/punct/g, _punctuation)
  .getRegex();
var autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
  .replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
  .replace(
    "email",
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
  )
  .getRegex();
var _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
var tag = edit(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
)
  .replace("comment", _inlineComment)
  .replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/)
  .getRegex();
var _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
var link2 = edit(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/)
  .replace("label", _inlineLabel)
  .replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/)
  .replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/)
  .getRegex();
var reflink = edit(/^!?\[(label)\]\[(ref)\]/)
  .replace("label", _inlineLabel)
  .replace("ref", _blockLabel)
  .getRegex();
var nolink = edit(/^!?\[(ref)\](?:\[\])?/)
  .replace("ref", _blockLabel)
  .getRegex();
var reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
var inlineNormal = {
  _backpedal: noopTest,
  // only used for GFM url
  anyPunctuation,
  autolink,
  blockSkip,
  br,
  code: inlineCode,
  del: noopTest,
  emStrongLDelim,
  emStrongRDelimAst,
  emStrongRDelimUnd,
  escape,
  link: link2,
  nolink,
  punctuation,
  reflink,
  reflinkSearch,
  tag,
  text: inlineText,
  url: noopTest,
};
var inlinePedantic = {
  ...inlineNormal,
  link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace("label", _inlineLabel)
    .getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace("label", _inlineLabel)
    .getRegex(),
};
var inlineGfm = {
  ...inlineNormal,
  emStrongRDelimAst: emStrongRDelimAstGfm,
  emStrongLDelim: emStrongLDelimGfm,
  url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i")
    .replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/)
    .getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
};
var inlineBreaks = {
  ...inlineGfm,
  br: edit(br).replace("{2,}", "*").getRegex(),
  text: edit(inlineGfm.text)
    .replace("\\b_", "\\b_| {2,}\\n")
    .replace(/\{2,\}/g, "*")
    .getRegex(),
};
var block = {
  normal: blockNormal,
  gfm: blockGfm,
  pedantic: blockPedantic,
};
var inline = {
  normal: inlineNormal,
  gfm: inlineGfm,
  breaks: inlineBreaks,
  pedantic: inlinePedantic,
};
var escapeReplacements = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
var getEscapeReplacement = (ch) => escapeReplacements[ch];
function escape2(html22, encode) {
  if (encode) {
    if (other.escapeTest.test(html22)) {
      return html22.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html22)) {
      return html22.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }
  return html22;
}
function cleanUrl(href) {
  try {
    href = encodeURI(href).replace(other.percentDecode, "%");
  } catch {
    return null;
  }
  return href;
}
function splitCells(tableRow, count2) {
  const row = tableRow.replace(other.findPipe, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === "\\") escaped = !escaped;
      if (escaped) {
        return "|";
      } else {
        return " |";
      }
    }),
    cells = row.split(other.splitPipe);
  let i = 0;
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells.at(-1)?.trim()) {
    cells.pop();
  }
  if (count2) {
    if (cells.length > count2) {
      cells.splice(count2);
    } else {
      while (cells.length < count2) cells.push("");
    }
  }
  for (; i < cells.length; i++) {
    cells[i] = cells[i].trim().replace(other.slashPipe, "|");
  }
  return cells;
}
function rtrim(str, c, invert) {
  const l = str.length;
  if (l === 0) {
    return "";
  }
  let suffLen = 0;
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }
  return str.slice(0, l - suffLen);
}
function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\\") {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  if (level > 0) {
    return -2;
  }
  return -1;
}
function outputLink(cap, link22, raw, lexer2, rules) {
  const href = link22.href;
  const title = link22.title || null;
  const text2 = cap[1].replace(rules.other.outputLinkReplace, "$1");
  lexer2.state.inLink = true;
  const token = {
    type: cap[0].charAt(0) === "!" ? "image" : "link",
    raw,
    href,
    title,
    text: text2,
    tokens: lexer2.inlineTokens(text2),
  };
  lexer2.state.inLink = false;
  return token;
}
function indentCodeCompensation(raw, text2, rules) {
  const matchIndentToCode = raw.match(rules.other.indentCodeCompensation);
  if (matchIndentToCode === null) {
    return text2;
  }
  const indentToCode = matchIndentToCode[1];
  return text2
    .split("\n")
    .map((node) => {
      const matchIndentInNode = node.match(rules.other.beginningSpace);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    })
    .join("\n");
}
var _Tokenizer = class {
  options;
  rules;
  // set by the lexer
  lexer;
  // set by the lexer
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  space(src) {
    const cap = this.rules.block.newline.exec(src);
    if (cap && cap[0].length > 0) {
      return {
        type: "space",
        raw: cap[0],
      };
    }
  }
  code(src) {
    const cap = this.rules.block.code.exec(src);
    if (cap) {
      const text2 = cap[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: cap[0],
        codeBlockStyle: "indented",
        text: !this.options.pedantic ? rtrim(text2, "\n") : text2,
      };
    }
  }
  fences(src) {
    const cap = this.rules.block.fences.exec(src);
    if (cap) {
      const raw = cap[0];
      const text2 = indentCodeCompensation(raw, cap[3] || "", this.rules);
      return {
        type: "code",
        raw,
        lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
        text: text2,
      };
    }
  }
  heading(src) {
    const cap = this.rules.block.heading.exec(src);
    if (cap) {
      let text2 = cap[2].trim();
      if (this.rules.other.endingHash.test(text2)) {
        const trimmed = rtrim(text2, "#");
        if (this.options.pedantic) {
          text2 = trimmed.trim();
        } else if (!trimmed || this.rules.other.endingSpaceChar.test(trimmed)) {
          text2 = trimmed.trim();
        }
      }
      return {
        type: "heading",
        raw: cap[0],
        depth: cap[1].length,
        text: text2,
        tokens: this.lexer.inline(text2),
      };
    }
  }
  hr(src) {
    const cap = this.rules.block.hr.exec(src);
    if (cap) {
      return {
        type: "hr",
        raw: rtrim(cap[0], "\n"),
      };
    }
  }
  blockquote(src) {
    const cap = this.rules.block.blockquote.exec(src);
    if (cap) {
      let lines = rtrim(cap[0], "\n").split("\n");
      let raw = "";
      let text2 = "";
      const tokens = [];
      while (lines.length > 0) {
        let inBlockquote = false;
        const currentLines = [];
        let i;
        for (i = 0; i < lines.length; i++) {
          if (this.rules.other.blockquoteStart.test(lines[i])) {
            currentLines.push(lines[i]);
            inBlockquote = true;
          } else if (!inBlockquote) {
            currentLines.push(lines[i]);
          } else {
            break;
          }
        }
        lines = lines.slice(i);
        const currentRaw = currentLines.join("\n");
        const currentText = currentRaw
          .replace(this.rules.other.blockquoteSetextReplace, "\n    $1")
          .replace(this.rules.other.blockquoteSetextReplace2, "");
        raw = raw
          ? `${raw}
${currentRaw}`
          : currentRaw;
        text2 = text2
          ? `${text2}
${currentText}`
          : currentText;
        const top = this.lexer.state.top;
        this.lexer.state.top = true;
        this.lexer.blockTokens(currentText, tokens, true);
        this.lexer.state.top = top;
        if (lines.length === 0) {
          break;
        }
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "code") {
          break;
        } else if (lastToken?.type === "blockquote") {
          const oldToken = lastToken;
          const newText = oldToken.raw + "\n" + lines.join("\n");
          const newToken = this.blockquote(newText);
          tokens[tokens.length - 1] = newToken;
          raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
          text2 = text2.substring(0, text2.length - oldToken.text.length) + newToken.text;
          break;
        } else if (lastToken?.type === "list") {
          const oldToken = lastToken;
          const newText = oldToken.raw + "\n" + lines.join("\n");
          const newToken = this.list(newText);
          tokens[tokens.length - 1] = newToken;
          raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
          text2 = text2.substring(0, text2.length - oldToken.raw.length) + newToken.raw;
          lines = newText.substring(tokens.at(-1).raw.length).split("\n");
          continue;
        }
      }
      return {
        type: "blockquote",
        raw,
        tokens,
        text: text2,
      };
    }
  }
  list(src) {
    let cap = this.rules.block.list.exec(src);
    if (cap) {
      let bull = cap[1].trim();
      const isordered = bull.length > 1;
      const list2 = {
        type: "list",
        raw: "",
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : "",
        loose: false,
        items: [],
      };
      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
      if (this.options.pedantic) {
        bull = isordered ? bull : "[*+-]";
      }
      const itemRegex = this.rules.other.listItemRegex(bull);
      let endsWithBlankLine = false;
      while (src) {
        let endEarly = false;
        let raw = "";
        let itemContents = "";
        if (!(cap = itemRegex.exec(src))) {
          break;
        }
        if (this.rules.block.hr.test(src)) {
          break;
        }
        raw = cap[0];
        src = src.substring(raw.length);
        let line = cap[2].split("\n", 1)[0].replace(this.rules.other.listReplaceTabs, (t) => " ".repeat(3 * t.length));
        let nextLine = src.split("\n", 1)[0];
        let blankLine = !line.trim();
        let indent = 0;
        if (this.options.pedantic) {
          indent = 2;
          itemContents = line.trimStart();
        } else if (blankLine) {
          indent = cap[1].length + 1;
        } else {
          indent = cap[2].search(this.rules.other.nonSpaceChar);
          indent = indent > 4 ? 1 : indent;
          itemContents = line.slice(indent);
          indent += cap[1].length;
        }
        if (blankLine && this.rules.other.blankLine.test(nextLine)) {
          raw += nextLine + "\n";
          src = src.substring(nextLine.length + 1);
          endEarly = true;
        }
        if (!endEarly) {
          const nextBulletRegex = this.rules.other.nextBulletRegex(indent);
          const hrRegex = this.rules.other.hrRegex(indent);
          const fencesBeginRegex = this.rules.other.fencesBeginRegex(indent);
          const headingBeginRegex = this.rules.other.headingBeginRegex(indent);
          const htmlBeginRegex = this.rules.other.htmlBeginRegex(indent);
          while (src) {
            const rawLine = src.split("\n", 1)[0];
            let nextLineWithoutTabs;
            nextLine = rawLine;
            if (this.options.pedantic) {
              nextLine = nextLine.replace(this.rules.other.listReplaceNesting, "  ");
              nextLineWithoutTabs = nextLine;
            } else {
              nextLineWithoutTabs = nextLine.replace(this.rules.other.tabCharGlobal, "    ");
            }
            if (fencesBeginRegex.test(nextLine)) {
              break;
            }
            if (headingBeginRegex.test(nextLine)) {
              break;
            }
            if (htmlBeginRegex.test(nextLine)) {
              break;
            }
            if (nextBulletRegex.test(nextLine)) {
              break;
            }
            if (hrRegex.test(nextLine)) {
              break;
            }
            if (nextLineWithoutTabs.search(this.rules.other.nonSpaceChar) >= indent || !nextLine.trim()) {
              itemContents += "\n" + nextLineWithoutTabs.slice(indent);
            } else {
              if (blankLine) {
                break;
              }
              if (line.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4) {
                break;
              }
              if (fencesBeginRegex.test(line)) {
                break;
              }
              if (headingBeginRegex.test(line)) {
                break;
              }
              if (hrRegex.test(line)) {
                break;
              }
              itemContents += "\n" + nextLine;
            }
            if (!blankLine && !nextLine.trim()) {
              blankLine = true;
            }
            raw += rawLine + "\n";
            src = src.substring(rawLine.length + 1);
            line = nextLineWithoutTabs.slice(indent);
          }
        }
        if (!list2.loose) {
          if (endsWithBlankLine) {
            list2.loose = true;
          } else if (this.rules.other.doubleBlankLine.test(raw)) {
            endsWithBlankLine = true;
          }
        }
        let istask = null;
        let ischecked;
        if (this.options.gfm) {
          istask = this.rules.other.listIsTask.exec(itemContents);
          if (istask) {
            ischecked = istask[0] !== "[ ] ";
            itemContents = itemContents.replace(this.rules.other.listReplaceTask, "");
          }
        }
        list2.items.push({
          type: "list_item",
          raw,
          task: !!istask,
          checked: ischecked,
          loose: false,
          text: itemContents,
          tokens: [],
        });
        list2.raw += raw;
      }
      const lastItem = list2.items.at(-1);
      if (lastItem) {
        lastItem.raw = lastItem.raw.trimEnd();
        lastItem.text = lastItem.text.trimEnd();
      } else {
        return;
      }
      list2.raw = list2.raw.trimEnd();
      for (let i = 0; i < list2.items.length; i++) {
        this.lexer.state.top = false;
        list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
        if (!list2.loose) {
          const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
          const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => this.rules.other.anyLine.test(t.raw));
          list2.loose = hasMultipleLineBreaks;
        }
      }
      if (list2.loose) {
        for (let i = 0; i < list2.items.length; i++) {
          list2.items[i].loose = true;
        }
      }
      return list2;
    }
  }
  html(src) {
    const cap = this.rules.block.html.exec(src);
    if (cap) {
      const token = {
        type: "html",
        block: true,
        raw: cap[0],
        pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
        text: cap[0],
      };
      return token;
    }
  }
  def(src) {
    const cap = this.rules.block.def.exec(src);
    if (cap) {
      const tag2 = cap[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " ");
      const href = cap[2]
        ? cap[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1")
        : "";
      const title = cap[3]
        ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1")
        : cap[3];
      return {
        type: "def",
        tag: tag2,
        raw: cap[0],
        href,
        title,
      };
    }
  }
  table(src) {
    const cap = this.rules.block.table.exec(src);
    if (!cap) {
      return;
    }
    if (!this.rules.other.tableDelimiter.test(cap[2])) {
      return;
    }
    const headers = splitCells(cap[1]);
    const aligns = cap[2].replace(this.rules.other.tableAlignChars, "").split("|");
    const rows = cap[3]?.trim() ? cap[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [];
    const item = {
      type: "table",
      raw: cap[0],
      header: [],
      align: [],
      rows: [],
    };
    if (headers.length !== aligns.length) {
      return;
    }
    for (const align of aligns) {
      if (this.rules.other.tableAlignRight.test(align)) {
        item.align.push("right");
      } else if (this.rules.other.tableAlignCenter.test(align)) {
        item.align.push("center");
      } else if (this.rules.other.tableAlignLeft.test(align)) {
        item.align.push("left");
      } else {
        item.align.push(null);
      }
    }
    for (let i = 0; i < headers.length; i++) {
      item.header.push({
        text: headers[i],
        tokens: this.lexer.inline(headers[i]),
        header: true,
        align: item.align[i],
      });
    }
    for (const row of rows) {
      item.rows.push(
        splitCells(row, item.header.length).map((cell, i) => {
          return {
            text: cell,
            tokens: this.lexer.inline(cell),
            header: false,
            align: item.align[i],
          };
        }),
      );
    }
    return item;
  }
  lheading(src) {
    const cap = this.rules.block.lheading.exec(src);
    if (cap) {
      return {
        type: "heading",
        raw: cap[0],
        depth: cap[2].charAt(0) === "=" ? 1 : 2,
        text: cap[1],
        tokens: this.lexer.inline(cap[1]),
      };
    }
  }
  paragraph(src) {
    const cap = this.rules.block.paragraph.exec(src);
    if (cap) {
      const text2 = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
      return {
        type: "paragraph",
        raw: cap[0],
        text: text2,
        tokens: this.lexer.inline(text2),
      };
    }
  }
  text(src) {
    const cap = this.rules.block.text.exec(src);
    if (cap) {
      return {
        type: "text",
        raw: cap[0],
        text: cap[0],
        tokens: this.lexer.inline(cap[0]),
      };
    }
  }
  escape(src) {
    const cap = this.rules.inline.escape.exec(src);
    if (cap) {
      return {
        type: "escape",
        raw: cap[0],
        text: cap[1],
      };
    }
  }
  tag(src) {
    const cap = this.rules.inline.tag.exec(src);
    if (cap) {
      if (!this.lexer.state.inLink && this.rules.other.startATag.test(cap[0])) {
        this.lexer.state.inLink = true;
      } else if (this.lexer.state.inLink && this.rules.other.endATag.test(cap[0])) {
        this.lexer.state.inLink = false;
      }
      if (!this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = true;
      } else if (this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = false;
      }
      return {
        type: "html",
        raw: cap[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: false,
        text: cap[0],
      };
    }
  }
  link(src) {
    const cap = this.rules.inline.link.exec(src);
    if (cap) {
      const trimmedUrl = cap[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(trimmedUrl)) {
        if (!this.rules.other.endAngleBracket.test(trimmedUrl)) {
          return;
        }
        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        const lastParenIndex = findClosingBracket(cap[2], "()");
        if (lastParenIndex === -2) {
          return;
        }
        if (lastParenIndex > -1) {
          const start2 = cap[0].indexOf("!") === 0 ? 5 : 4;
          const linkLen = start2 + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = "";
        }
      }
      let href = cap[2];
      let title = "";
      if (this.options.pedantic) {
        const link22 = this.rules.other.pedanticHrefTitle.exec(href);
        if (link22) {
          href = link22[1];
          title = link22[3];
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : "";
      }
      href = href.trim();
      if (this.rules.other.startAngleBracket.test(href)) {
        if (this.options.pedantic && !this.rules.other.endAngleBracket.test(trimmedUrl)) {
          href = href.slice(1);
        } else {
          href = href.slice(1, -1);
        }
      }
      return outputLink(
        cap,
        {
          href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
          title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title,
        },
        cap[0],
        this.lexer,
        this.rules,
      );
    }
  }
  reflink(src, links) {
    let cap;
    if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
      const linkString = (cap[2] || cap[1]).replace(this.rules.other.multipleSpaceGlobal, " ");
      const link22 = links[linkString.toLowerCase()];
      if (!link22) {
        const text2 = cap[0].charAt(0);
        return {
          type: "text",
          raw: text2,
          text: text2,
        };
      }
      return outputLink(cap, link22, cap[0], this.lexer, this.rules);
    }
  }
  emStrong(src, maskedSrc, prevChar = "") {
    let match = this.rules.inline.emStrongLDelim.exec(src);
    if (!match) return;
    if (match[3] && prevChar.match(this.rules.other.unicodeAlphaNumeric)) return;
    const nextChar = match[1] || match[2] || "";
    if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
      const lLength = [...match[0]].length - 1;
      let rDelim,
        rLength,
        delimTotal = lLength,
        midDelimTotal = 0;
      const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      endReg.lastIndex = 0;
      maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
      while ((match = endReg.exec(maskedSrc)) != null) {
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim) continue;
        rLength = [...rDelim].length;
        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        } else if (match[5] || match[6]) {
          if (lLength % 3 && !((lLength + rLength) % 3)) {
            midDelimTotal += rLength;
            continue;
          }
        }
        delimTotal -= rLength;
        if (delimTotal > 0) continue;
        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
        const lastCharLength = [...match[0]][0].length;
        const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
        if (Math.min(lLength, rLength) % 2) {
          const text22 = raw.slice(1, -1);
          return {
            type: "em",
            raw,
            text: text22,
            tokens: this.lexer.inlineTokens(text22),
          };
        }
        const text2 = raw.slice(2, -2);
        return {
          type: "strong",
          raw,
          text: text2,
          tokens: this.lexer.inlineTokens(text2),
        };
      }
    }
  }
  codespan(src) {
    const cap = this.rules.inline.code.exec(src);
    if (cap) {
      let text2 = cap[2].replace(this.rules.other.newLineCharGlobal, " ");
      const hasNonSpaceChars = this.rules.other.nonSpaceChar.test(text2);
      const hasSpaceCharsOnBothEnds =
        this.rules.other.startingSpaceChar.test(text2) && this.rules.other.endingSpaceChar.test(text2);
      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text2 = text2.substring(1, text2.length - 1);
      }
      return {
        type: "codespan",
        raw: cap[0],
        text: text2,
      };
    }
  }
  br(src) {
    const cap = this.rules.inline.br.exec(src);
    if (cap) {
      return {
        type: "br",
        raw: cap[0],
      };
    }
  }
  del(src) {
    const cap = this.rules.inline.del.exec(src);
    if (cap) {
      return {
        type: "del",
        raw: cap[0],
        text: cap[2],
        tokens: this.lexer.inlineTokens(cap[2]),
      };
    }
  }
  autolink(src) {
    const cap = this.rules.inline.autolink.exec(src);
    if (cap) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = cap[1];
        href = "mailto:" + text2;
      } else {
        text2 = cap[1];
        href = text2;
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2,
          },
        ],
      };
    }
  }
  url(src) {
    let cap;
    if ((cap = this.rules.inline.url.exec(src))) {
      let text2, href;
      if (cap[2] === "@") {
        text2 = cap[0];
        href = "mailto:" + text2;
      } else {
        let prevCapZero;
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? "";
        } while (prevCapZero !== cap[0]);
        text2 = cap[0];
        if (cap[1] === "www.") {
          href = "http://" + cap[0];
        } else {
          href = cap[0];
        }
      }
      return {
        type: "link",
        raw: cap[0],
        text: text2,
        href,
        tokens: [
          {
            type: "text",
            raw: text2,
            text: text2,
          },
        ],
      };
    }
  }
  inlineText(src) {
    const cap = this.rules.inline.text.exec(src);
    if (cap) {
      const escaped = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: cap[0],
        text: cap[0],
        escaped,
      };
    }
  }
};
var _Lexer = class __Lexer {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(options2) {
    this.tokens = [];
    this.tokens.links = /* @__PURE__ */ Object.create(null);
    this.options = options2 || _defaults;
    this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
    this.tokenizer = this.options.tokenizer;
    this.tokenizer.options = this.options;
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      top: true,
    };
    const rules = {
      other,
      block: block.normal,
      inline: inline.normal,
    };
    if (this.options.pedantic) {
      rules.block = block.pedantic;
      rules.inline = inline.pedantic;
    } else if (this.options.gfm) {
      rules.block = block.gfm;
      if (this.options.breaks) {
        rules.inline = inline.breaks;
      } else {
        rules.inline = inline.gfm;
      }
    }
    this.tokenizer.rules = rules;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block,
      inline,
    };
  }
  /**
   * Static Lex Method
   */
  static lex(src, options2) {
    const lexer2 = new __Lexer(options2);
    return lexer2.lex(src);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(src, options2) {
    const lexer2 = new __Lexer(options2);
    return lexer2.inlineTokens(src);
  }
  /**
   * Preprocessing
   */
  lex(src) {
    src = src.replace(other.carriageReturn, "\n");
    this.blockTokens(src, this.tokens);
    for (let i = 0; i < this.inlineQueue.length; i++) {
      const next = this.inlineQueue[i];
      this.inlineTokens(next.src, next.tokens);
    }
    this.inlineQueue = [];
    return this.tokens;
  }
  blockTokens(src, tokens = [], lastParagraphClipped = false) {
    if (this.options.pedantic) {
      src = src.replace(other.tabCharGlobal, "    ").replace(other.spaceLine, "");
    }
    while (src) {
      let token;
      if (
        this.options.extensions?.block?.some((extTokenizer) => {
          if ((token = extTokenizer.call({ lexer: this }, src, tokens))) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })
      ) {
        continue;
      }
      if ((token = this.tokenizer.space(src))) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (token.raw.length === 1 && lastToken !== void 0) {
          lastToken.raw += "\n";
        } else {
          tokens.push(token);
        }
        continue;
      }
      if ((token = this.tokenizer.code(src))) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if ((token = this.tokenizer.fences(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.heading(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.hr(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.blockquote(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.list(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.html(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.def(src))) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.raw;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else if (!this.tokens.links[token.tag]) {
          this.tokens.links[token.tag] = {
            href: token.href,
            title: token.title,
          };
        }
        continue;
      }
      if ((token = this.tokenizer.table(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.lheading(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      let cutSrc = src;
      if (this.options.extensions?.startBlock) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startBlock.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
        const lastToken = tokens.at(-1);
        if (lastParagraphClipped && lastToken?.type === "paragraph") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        lastParagraphClipped = cutSrc.length !== src.length;
        src = src.substring(token.raw.length);
        continue;
      }
      if ((token = this.tokenizer.text(src))) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "text") {
          lastToken.raw += "\n" + token.raw;
          lastToken.text += "\n" + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    this.state.top = true;
    return tokens;
  }
  inline(src, tokens = []) {
    this.inlineQueue.push({ src, tokens });
    return tokens;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(src, tokens = []) {
    let maskedSrc = src;
    let match = null;
    if (this.tokens.links) {
      const links = Object.keys(this.tokens.links);
      if (links.length > 0) {
        while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
          if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
            maskedSrc =
              maskedSrc.slice(0, match.index) +
              "[" +
              "a".repeat(match[0].length - 2) +
              "]" +
              maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
          }
        }
      }
    }
    while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
      maskedSrc =
        maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    }
    while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
      maskedSrc =
        maskedSrc.slice(0, match.index) +
        "[" +
        "a".repeat(match[0].length - 2) +
        "]" +
        maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    }
    let keepPrevChar = false;
    let prevChar = "";
    while (src) {
      if (!keepPrevChar) {
        prevChar = "";
      }
      keepPrevChar = false;
      let token;
      if (
        this.options.extensions?.inline?.some((extTokenizer) => {
          if ((token = extTokenizer.call({ lexer: this }, src, tokens))) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })
      ) {
        continue;
      }
      if ((token = this.tokenizer.escape(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.tag(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.link(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.reflink(src, this.tokens.links))) {
        src = src.substring(token.raw.length);
        const lastToken = tokens.at(-1);
        if (token.type === "text" && lastToken?.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if ((token = this.tokenizer.emStrong(src, maskedSrc, prevChar))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.codespan(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.br(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.del(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if ((token = this.tokenizer.autolink(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      if (!this.state.inLink && (token = this.tokenizer.url(src))) {
        src = src.substring(token.raw.length);
        tokens.push(token);
        continue;
      }
      let cutSrc = src;
      if (this.options.extensions?.startInline) {
        let startIndex = Infinity;
        const tempSrc = src.slice(1);
        let tempStart;
        this.options.extensions.startInline.forEach((getStartIndex) => {
          tempStart = getStartIndex.call({ lexer: this }, tempSrc);
          if (typeof tempStart === "number" && tempStart >= 0) {
            startIndex = Math.min(startIndex, tempStart);
          }
        });
        if (startIndex < Infinity && startIndex >= 0) {
          cutSrc = src.substring(0, startIndex + 1);
        }
      }
      if ((token = this.tokenizer.inlineText(cutSrc))) {
        src = src.substring(token.raw.length);
        if (token.raw.slice(-1) !== "_") {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === "text") {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }
      if (src) {
        const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
        if (this.options.silent) {
          console.error(errMsg);
          break;
        } else {
          throw new Error(errMsg);
        }
      }
    }
    return tokens;
  }
};
var _Renderer = class {
  options;
  parser;
  // set by the parser
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  space(token) {
    return "";
  }
  code({ text: text2, lang, escaped }) {
    const langString = (lang || "").match(other.notSpaceStart)?.[0];
    const code = text2.replace(other.endingNewline, "") + "\n";
    if (!langString) {
      return "<pre><code>" + (escaped ? code : escape2(code, true)) + "</code></pre>\n";
    }
    return (
      '<pre><code class="language-' +
      escape2(langString) +
      '">' +
      (escaped ? code : escape2(code, true)) +
      "</code></pre>\n"
    );
  }
  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote>
${body}</blockquote>
`;
  }
  html({ text: text2 }) {
    return text2;
  }
  heading({ tokens, depth }) {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>
`;
  }
  hr(token) {
    return "<hr>\n";
  }
  list(token) {
    const ordered = token.ordered;
    const start2 = token.start;
    let body = "";
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      body += this.listitem(item);
    }
    const type2 = ordered ? "ol" : "ul";
    const startAttr = ordered && start2 !== 1 ? ' start="' + start2 + '"' : "";
    return "<" + type2 + startAttr + ">\n" + body + "</" + type2 + ">\n";
  }
  listitem(item) {
    let itemBody = "";
    if (item.task) {
      const checkbox = this.checkbox({ checked: !!item.checked });
      if (item.loose) {
        if (item.tokens[0]?.type === "paragraph") {
          item.tokens[0].text = checkbox + " " + item.tokens[0].text;
          if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
            item.tokens[0].tokens[0].text = checkbox + " " + escape2(item.tokens[0].tokens[0].text);
            item.tokens[0].tokens[0].escaped = true;
          }
        } else {
          item.tokens.unshift({
            type: "text",
            raw: checkbox + " ",
            text: checkbox + " ",
            escaped: true,
          });
        }
      } else {
        itemBody += checkbox + " ";
      }
    }
    itemBody += this.parser.parse(item.tokens, !!item.loose);
    return `<li>${itemBody}</li>
`;
  }
  checkbox({ checked }) {
    return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens }) {
    return `<p>${this.parser.parseInline(tokens)}</p>
`;
  }
  table(token) {
    let header = "";
    let cell = "";
    for (let j = 0; j < token.header.length; j++) {
      cell += this.tablecell(token.header[j]);
    }
    header += this.tablerow({ text: cell });
    let body = "";
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];
      cell = "";
      for (let k = 0; k < row.length; k++) {
        cell += this.tablecell(row[k]);
      }
      body += this.tablerow({ text: cell });
    }
    if (body) body = `<tbody>${body}</tbody>`;
    return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
  }
  tablerow({ text: text2 }) {
    return `<tr>
${text2}</tr>
`;
  }
  tablecell(token) {
    const content = this.parser.parseInline(token.tokens);
    const type2 = token.header ? "th" : "td";
    const tag2 = token.align ? `<${type2} align="${token.align}">` : `<${type2}>`;
    return (
      tag2 +
      content +
      `</${type2}>
`
    );
  }
  /**
   * span level renderer
   */
  strong({ tokens }) {
    return `<strong>${this.parser.parseInline(tokens)}</strong>`;
  }
  em({ tokens }) {
    return `<em>${this.parser.parseInline(tokens)}</em>`;
  }
  codespan({ text: text2 }) {
    return `<code>${escape2(text2, true)}</code>`;
  }
  br(token) {
    return "<br>";
  }
  del({ tokens }) {
    return `<del>${this.parser.parseInline(tokens)}</del>`;
  }
  link({ href, title, tokens }) {
    const text2 = this.parser.parseInline(tokens);
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return text2;
    }
    href = cleanHref;
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + escape2(title) + '"';
    }
    out += ">" + text2 + "</a>";
    return out;
  }
  image({ href, title, text: text2, tokens }) {
    if (tokens) {
      text2 = this.parser.parseInline(tokens, this.parser.textRenderer);
    }
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return escape2(text2);
    }
    href = cleanHref;
    let out = `<img src="${href}" alt="${text2}"`;
    if (title) {
      out += ` title="${escape2(title)}"`;
    }
    out += ">";
    return out;
  }
  text(token) {
    return "tokens" in token && token.tokens
      ? this.parser.parseInline(token.tokens)
      : "escaped" in token && token.escaped
        ? token.text
        : escape2(token.text);
  }
};
var _TextRenderer = class {
  // no need for block level renderers
  strong({ text: text2 }) {
    return text2;
  }
  em({ text: text2 }) {
    return text2;
  }
  codespan({ text: text2 }) {
    return text2;
  }
  del({ text: text2 }) {
    return text2;
  }
  html({ text: text2 }) {
    return text2;
  }
  text({ text: text2 }) {
    return text2;
  }
  link({ text: text2 }) {
    return "" + text2;
  }
  image({ text: text2 }) {
    return "" + text2;
  }
  br() {
    return "";
  }
};
var _Parser = class __Parser {
  options;
  renderer;
  textRenderer;
  constructor(options2) {
    this.options = options2 || _defaults;
    this.options.renderer = this.options.renderer || new _Renderer();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
    this.renderer.parser = this;
    this.textRenderer = new _TextRenderer();
  }
  /**
   * Static Parse Method
   */
  static parse(tokens, options2) {
    const parser2 = new __Parser(options2);
    return parser2.parse(tokens);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(tokens, options2) {
    const parser2 = new __Parser(options2);
    return parser2.parseInline(tokens);
  }
  /**
   * Parse Loop
   */
  parse(tokens, top = true) {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const genericToken = anyToken;
        const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
        if (
          ret !== false ||
          !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(
            genericToken.type,
          )
        ) {
          out += ret || "";
          continue;
        }
      }
      const token = anyToken;
      switch (token.type) {
        case "space": {
          out += this.renderer.space(token);
          continue;
        }
        case "hr": {
          out += this.renderer.hr(token);
          continue;
        }
        case "heading": {
          out += this.renderer.heading(token);
          continue;
        }
        case "code": {
          out += this.renderer.code(token);
          continue;
        }
        case "table": {
          out += this.renderer.table(token);
          continue;
        }
        case "blockquote": {
          out += this.renderer.blockquote(token);
          continue;
        }
        case "list": {
          out += this.renderer.list(token);
          continue;
        }
        case "html": {
          out += this.renderer.html(token);
          continue;
        }
        case "paragraph": {
          out += this.renderer.paragraph(token);
          continue;
        }
        case "text": {
          let textToken = token;
          let body = this.renderer.text(textToken);
          while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
            textToken = tokens[++i];
            body += "\n" + this.renderer.text(textToken);
          }
          if (top) {
            out += this.renderer.paragraph({
              type: "paragraph",
              raw: body,
              text: body,
              tokens: [{ type: "text", raw: body, text: body, escaped: true }],
            });
          } else {
            out += body;
          }
          continue;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(tokens, renderer = this.renderer) {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const anyToken = tokens[i];
      if (this.options.extensions?.renderers?.[anyToken.type]) {
        const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
        if (
          ret !== false ||
          !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(anyToken.type)
        ) {
          out += ret || "";
          continue;
        }
      }
      const token = anyToken;
      switch (token.type) {
        case "escape": {
          out += renderer.text(token);
          break;
        }
        case "html": {
          out += renderer.html(token);
          break;
        }
        case "link": {
          out += renderer.link(token);
          break;
        }
        case "image": {
          out += renderer.image(token);
          break;
        }
        case "strong": {
          out += renderer.strong(token);
          break;
        }
        case "em": {
          out += renderer.em(token);
          break;
        }
        case "codespan": {
          out += renderer.codespan(token);
          break;
        }
        case "br": {
          out += renderer.br(token);
          break;
        }
        case "del": {
          out += renderer.del(token);
          break;
        }
        case "text": {
          out += renderer.text(token);
          break;
        }
        default: {
          const errMsg = 'Token with "' + token.type + '" type was not found.';
          if (this.options.silent) {
            console.error(errMsg);
            return "";
          } else {
            throw new Error(errMsg);
          }
        }
      }
    }
    return out;
  }
};
var _Hooks = class {
  options;
  block;
  constructor(options2) {
    this.options = options2 || _defaults;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  /**
   * Process markdown before marked
   */
  preprocess(markdown) {
    return markdown;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(html22) {
    return html22;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(tokens) {
    return tokens;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? _Lexer.lex : _Lexer.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? _Parser.parse : _Parser.parseInline;
  }
};
var Marked = class {
  defaults = _getDefaults();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = _Parser;
  Renderer = _Renderer;
  TextRenderer = _TextRenderer;
  Lexer = _Lexer;
  Tokenizer = _Tokenizer;
  Hooks = _Hooks;
  constructor(...args) {
    this.use(...args);
  }
  /**
   * Run callback for every token
   */
  walkTokens(tokens, callback) {
    let values = [];
    for (const token of tokens) {
      values = values.concat(callback.call(this, token));
      switch (token.type) {
        case "table": {
          const tableToken = token;
          for (const cell of tableToken.header) {
            values = values.concat(this.walkTokens(cell.tokens, callback));
          }
          for (const row of tableToken.rows) {
            for (const cell of row) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
          }
          break;
        }
        case "list": {
          const listToken = token;
          values = values.concat(this.walkTokens(listToken.items, callback));
          break;
        }
        default: {
          const genericToken = token;
          if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
            this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
              const tokens2 = genericToken[childTokens].flat(Infinity);
              values = values.concat(this.walkTokens(tokens2, callback));
            });
          } else if (genericToken.tokens) {
            values = values.concat(this.walkTokens(genericToken.tokens, callback));
          }
        }
      }
    }
    return values;
  }
  use(...args) {
    const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
    args.forEach((pack) => {
      const opts = { ...pack };
      opts.async = this.defaults.async || opts.async || false;
      if (pack.extensions) {
        pack.extensions.forEach((ext) => {
          if (!ext.name) {
            throw new Error("extension name required");
          }
          if ("renderer" in ext) {
            const prevRenderer = extensions.renderers[ext.name];
            if (prevRenderer) {
              extensions.renderers[ext.name] = function (...args2) {
                let ret = ext.renderer.apply(this, args2);
                if (ret === false) {
                  ret = prevRenderer.apply(this, args2);
                }
                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }
          if ("tokenizer" in ext) {
            if (!ext.level || (ext.level !== "block" && ext.level !== "inline")) {
              throw new Error("extension level must be 'block' or 'inline'");
            }
            const extLevel = extensions[ext.level];
            if (extLevel) {
              extLevel.unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }
            if (ext.start) {
              if (ext.level === "block") {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === "inline") {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }
          if ("childTokens" in ext && ext.childTokens) {
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
        opts.extensions = extensions;
      }
      if (pack.renderer) {
        const renderer = this.defaults.renderer || new _Renderer(this.defaults);
        for (const prop in pack.renderer) {
          if (!(prop in renderer)) {
            throw new Error(`renderer '${prop}' does not exist`);
          }
          if (["options", "parser"].includes(prop)) {
            continue;
          }
          const rendererProp = prop;
          const rendererFunc = pack.renderer[rendererProp];
          const prevRenderer = renderer[rendererProp];
          renderer[rendererProp] = (...args2) => {
            let ret = rendererFunc.apply(renderer, args2);
            if (ret === false) {
              ret = prevRenderer.apply(renderer, args2);
            }
            return ret || "";
          };
        }
        opts.renderer = renderer;
      }
      if (pack.tokenizer) {
        const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
        for (const prop in pack.tokenizer) {
          if (!(prop in tokenizer)) {
            throw new Error(`tokenizer '${prop}' does not exist`);
          }
          if (["options", "rules", "lexer"].includes(prop)) {
            continue;
          }
          const tokenizerProp = prop;
          const tokenizerFunc = pack.tokenizer[tokenizerProp];
          const prevTokenizer = tokenizer[tokenizerProp];
          tokenizer[tokenizerProp] = (...args2) => {
            let ret = tokenizerFunc.apply(tokenizer, args2);
            if (ret === false) {
              ret = prevTokenizer.apply(tokenizer, args2);
            }
            return ret;
          };
        }
        opts.tokenizer = tokenizer;
      }
      if (pack.hooks) {
        const hooks = this.defaults.hooks || new _Hooks();
        for (const prop in pack.hooks) {
          if (!(prop in hooks)) {
            throw new Error(`hook '${prop}' does not exist`);
          }
          if (["options", "block"].includes(prop)) {
            continue;
          }
          const hooksProp = prop;
          const hooksFunc = pack.hooks[hooksProp];
          const prevHook = hooks[hooksProp];
          if (_Hooks.passThroughHooks.has(prop)) {
            hooks[hooksProp] = (arg) => {
              if (this.defaults.async) {
                return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                  return prevHook.call(hooks, ret2);
                });
              }
              const ret = hooksFunc.call(hooks, arg);
              return prevHook.call(hooks, ret);
            };
          } else {
            hooks[hooksProp] = (...args2) => {
              let ret = hooksFunc.apply(hooks, args2);
              if (ret === false) {
                ret = prevHook.apply(hooks, args2);
              }
              return ret;
            };
          }
        }
        opts.hooks = hooks;
      }
      if (pack.walkTokens) {
        const walkTokens2 = this.defaults.walkTokens;
        const packWalktokens = pack.walkTokens;
        opts.walkTokens = function (token) {
          let values = [];
          values.push(packWalktokens.call(this, token));
          if (walkTokens2) {
            values = values.concat(walkTokens2.call(this, token));
          }
          return values;
        };
      }
      this.defaults = { ...this.defaults, ...opts };
    });
    return this;
  }
  setOptions(opt) {
    this.defaults = { ...this.defaults, ...opt };
    return this;
  }
  lexer(src, options2) {
    return _Lexer.lex(src, options2 ?? this.defaults);
  }
  parser(tokens, options2) {
    return _Parser.parse(tokens, options2 ?? this.defaults);
  }
  parseMarkdown(blockType) {
    const parse2 = (src, options2) => {
      const origOpt = { ...options2 };
      const opt = { ...this.defaults, ...origOpt };
      const throwError = this.onError(!!opt.silent, !!opt.async);
      if (this.defaults.async === true && origOpt.async === false) {
        return throwError(
          new Error(
            "marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.",
          ),
        );
      }
      if (typeof src === "undefined" || src === null) {
        return throwError(new Error("marked(): input parameter is undefined or null"));
      }
      if (typeof src !== "string") {
        return throwError(
          new Error(
            "marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected",
          ),
        );
      }
      if (opt.hooks) {
        opt.hooks.options = opt;
        opt.hooks.block = blockType;
      }
      const lexer2 = opt.hooks ? opt.hooks.provideLexer() : blockType ? _Lexer.lex : _Lexer.lexInline;
      const parser2 = opt.hooks ? opt.hooks.provideParser() : blockType ? _Parser.parse : _Parser.parseInline;
      if (opt.async) {
        return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src)
          .then((src2) => lexer2(src2, opt))
          .then((tokens) => (opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens))
          .then((tokens) =>
            opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens,
          )
          .then((tokens) => parser2(tokens, opt))
          .then((html22) => (opt.hooks ? opt.hooks.postprocess(html22) : html22))
          .catch(throwError);
      }
      try {
        if (opt.hooks) {
          src = opt.hooks.preprocess(src);
        }
        let tokens = lexer2(src, opt);
        if (opt.hooks) {
          tokens = opt.hooks.processAllTokens(tokens);
        }
        if (opt.walkTokens) {
          this.walkTokens(tokens, opt.walkTokens);
        }
        let html22 = parser2(tokens, opt);
        if (opt.hooks) {
          html22 = opt.hooks.postprocess(html22);
        }
        return html22;
      } catch (e) {
        return throwError(e);
      }
    };
    return parse2;
  }
  onError(silent, async) {
    return (e) => {
      e.message += "\nPlease report this to https://github.com/markedjs/marked.";
      if (silent) {
        const msg = "<p>An error occurred:</p><pre>" + escape2(e.message + "", true) + "</pre>";
        if (async) {
          return Promise.resolve(msg);
        }
        return msg;
      }
      if (async) {
        return Promise.reject(e);
      }
      throw e;
    };
  }
};
var markedInstance = new Marked();
function marked(src, opt) {
  return markedInstance.parse(src, opt);
}
marked.options = marked.setOptions = function (options2) {
  markedInstance.setOptions(options2);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.getDefaults = _getDefaults;
marked.defaults = _defaults;
marked.use = function (...args) {
  markedInstance.use(...args);
  marked.defaults = markedInstance.defaults;
  changeDefaults(marked.defaults);
  return marked;
};
marked.walkTokens = function (tokens, callback) {
  return markedInstance.walkTokens(tokens, callback);
};
marked.parseInline = markedInstance.parseInline;
marked.Parser = _Parser;
marked.parser = _Parser.parse;
marked.Renderer = _Renderer;
marked.TextRenderer = _TextRenderer;
marked.Lexer = _Lexer;
marked.lexer = _Lexer.lex;
marked.Tokenizer = _Tokenizer;
marked.Hooks = _Hooks;
marked.parse = marked;
var options = marked.options;
var setOptions = marked.setOptions;
var use = marked.use;
var walkTokens = marked.walkTokens;
var parseInline = marked.parseInline;
var parser = _Parser.parse;
var lexer = _Lexer.lex;

// packages/vexkit/dist/dashboard/bundle/_work/strip-assistant-visible-text.js
function stripLeadingDescribePlanningPreamble(raw) {
  const trimmed = raw.trimStart();
  if (/^(?:Here['\u2019]s|Here is)\s+/i.test(trimmed)) {
    return raw;
  }
  if (/^##\s+/i.test(trimmed)) {
    return raw;
  }
  const patterns = [/\n\nHere['\u2019]s\s+/i, /\n\nHere is\s+/i, /\n\n##\s+Questions for you\b/i, /\n\n##\s+/];
  let best = -1;
  for (let i = 0; i < patterns.length; i += 1) {
    const m = patterns[i].exec(raw);
    if (m != null && m.index !== void 0) {
      if (best === -1 || m.index < best) {
        best = m.index;
      }
    }
  }
  if (best === -1) {
    return raw;
  }
  return raw.slice(best + 2);
}
function truncateIfUnclosedOpenTag(text2, openPattern, closeLiteral) {
  const m = openPattern.exec(text2);
  if (m == null || m.index === void 0) {
    return text2;
  }
  const start2 = m.index;
  const afterOpen = text2.slice(start2 + m[0].length);
  if (afterOpen.includes(closeLiteral)) {
    return text2;
  }
  return text2.slice(0, start2);
}
var THINKING_PAIRS = [
  [/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, /<thinking\b[^>]*>/i, "</thinking>"],
  [/<think\b[^>]*>[\s\S]*?<\/think>/gi, /<think\b[^>]*>/i, "</think>"],
  [/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, /<reasoning\b[^>]*>/i, "</reasoning>"],
  [/<thought\b[^>]*>[\s\S]*?<\/thought>/gi, /<thought\b[^>]*>/i, "</thought>"],
  [/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, /<analysis\b[^>]*>/i, "</analysis>"],
  [/<scratchpad\b[^>]*>[\s\S]*?<\/scratchpad>/gi, /<scratchpad\b[^>]*>/i, "</scratchpad>"],
  [/<redacted_reasoning\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, /<redacted_reasoning\b[^>]*>/i, "</think>"],
];
function stripAssistantThinkingVisible(raw) {
  let out = raw;
  for (const [pairRe, openRe, closeLiteral] of THINKING_PAIRS) {
    out = out.replace(pairRe, "");
    out = truncateIfUnclosedOpenTag(out, openRe, closeLiteral);
  }
  return out;
}
function stripWorkflowSignals(text2) {
  return text2.replace(/---(?:SCOPE_READY|SPECS_DONE|BUILD_DONE|NEED_SPEC_CHANGE)---/g, "");
}
function stripHugeFencedBlocks(text2) {
  return text2.replace(/```[^\n]*\n([\s\S]*?)```/g, (full, inner) => {
    if (inner.length > 6e3) {
      return "\n```\n_(Large fenced block omitted in chat view.)_\n```\n";
    }
    return full;
  });
}
var MAX_ASSISTANT_DISPLAY_CHARS = 1e4;
function truncateForDisplay(text2) {
  if (text2.length <= MAX_ASSISTANT_DISPLAY_CHARS) {
    return text2;
  }
  const tail = text2.slice(-MAX_ASSISTANT_DISPLAY_CHARS);
  return `_(Earlier assistant output omitted.)_

${tail}`;
}
function finalizeAssistantVisibleText(raw) {
  const stripped = stripAssistantThinkingVisible(stripWorkflowSignals(raw));
  const withoutHugeFences = stripHugeFencedBlocks(stripped);
  const cleaned = stripLeadingDescribePlanningPreamble(withoutHugeFences);
  return truncateForDisplay(cleaned);
}

// packages/vexkit/dist/dashboard/bundle/_work/chat-panel.js
var ASSISTANT_WIDTH_MIN = 260;
var ASSISTANT_WIDTH_MAX = 560;
var DEFAULT_CHAT_MODEL_PRESETS = [
  "auto",
  "composer-2",
  "composer-2-fast",
  "composer-1",
  "gpt-5.2",
  "gpt-4o",
  "claude-4.5-sonnet",
  "claude-4.5-opus",
  "claude-4.6-sonnet",
  "claude-4.6-opus",
];
marked.setOptions({
  breaks: true,
  gfm: true,
});
purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node instanceof Element) {
    node.setAttribute("rel", "noopener noreferrer");
    node.setAttribute("target", "_blank");
  }
});
var ASSISTANT_MD_PURIFY = {
  ADD_ATTR: ["class"],
  ADD_TAGS: ["div"],
};
function wrapAssistantQuestionsSectionHtml(html3) {
  const headingRe = /<h[1-4][^>]*>\s*(?:Questions?\b|Clarif(?:ying|ication)\b|Before (?:we|I)\b)[^<]*<\/h[1-4]>/i;
  const headingMatch = headingRe.exec(html3);
  if (headingMatch != null && headingMatch.index !== void 0) {
    return `${html3.slice(0, headingMatch.index)}<div class="assistant-questions">${html3.slice(headingMatch.index)}</div>`;
  }
  const listRe = /<(?:ul|ol)>[\s\S]*?<\/(?:ul|ol)>/gi;
  let out = html3;
  let offset = 0;
  let match;
  while ((match = listRe.exec(html3)) != null) {
    const block2 = match[0];
    const questionCount = (block2.match(/\?/g) ?? []).length;
    const itemCount = (block2.match(/<li/gi) ?? []).length;
    if (questionCount > 0 && questionCount >= itemCount * 0.5) {
      const pos = match.index + offset;
      const before = out.slice(0, pos);
      const after = out.slice(pos + block2.length);
      const wrapped = `<div class="assistant-questions"><h4>Questions</h4>${block2}</div>`;
      out = before + wrapped + after;
      offset += wrapped.length - block2.length;
    }
  }
  return out;
}
function humanizeCursorErrorInAssistantText(text2) {
  if (typeof text2 !== "string") {
    return text2;
  }
  const lower2 = text2.toLowerCase();
  if (lower2.includes("resource_exhausted")) {
    return "Cursor hit a usage or quota limit (resource_exhausted). Try another model, wait a few minutes, or check usage at cursor.com/dashboard.";
  }
  return text2;
}
function parseNdjsonErrorMessage(errText) {
  const first = errText.trim().split("\n")[0] ?? "";
  if (first.length === 0) {
    return "";
  }
  try {
    const ev = JSON.parse(first);
    if (ev && typeof ev.type === "string" && ev.type === "error" && typeof ev.message === "string") {
      return ev.message;
    }
  } catch {
    return "";
  }
  return "";
}
function assistantMarkdownToSafeHtml(markdown) {
  const withoutMarker = finalizeAssistantVisibleText(markdown);
  const raw = marked.parse(withoutMarker);
  const html3 = typeof raw === "string" ? raw : "";
  const wrapped = wrapAssistantQuestionsSectionHtml(html3);
  return purify.sanitize(wrapped, ASSISTANT_MD_PURIFY);
}
function fillAssistantMessageBody(bodyEl, content, useMarkdown) {
  bodyEl.classList.remove("assistant-msg-body--md");
  if (useMarkdown) {
    bodyEl.classList.add("assistant-msg-body--md");
    bodyEl.innerHTML = assistantMarkdownToSafeHtml(content);
    return;
  }
  bodyEl.textContent = content;
}
function clampAssistantWidthPx(w) {
  return Math.min(ASSISTANT_WIDTH_MAX, Math.max(ASSISTANT_WIDTH_MIN, Math.round(w)));
}
function setAssistantWidthCss(px) {
  document.documentElement.style.setProperty("--assistant-width", `${String(px)}px`);
}
function applyAssistantWidthFromState(state2) {
  if (typeof state2.assistantWidthPx !== "number" || !Number.isFinite(state2.assistantWidthPx)) {
    return;
  }
  const w = clampAssistantWidthPx(state2.assistantWidthPx);
  state2.assistantWidthPx = w;
  setAssistantWidthCss(w);
}
function syncAssistantPanel(state2) {
  const layout = document.getElementById("layout");
  const btn = document.getElementById("toggle-assistant");
  const collapsed = state2.assistantCollapsed;
  layout.classList.toggle("assistant-panel-collapsed", collapsed);
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  btn.textContent = collapsed ? "\u27EA" : "\u27EB";
  btn.setAttribute("title", collapsed ? "Show assistant (Ctrl+Shift+L)" : "Hide assistant (Ctrl+Shift+L)");
  btn.setAttribute("aria-label", collapsed ? "Show assistant" : "Hide assistant");
}
function toggleAssistantPanel(state2, saveDashboardView2) {
  state2.assistantCollapsed = !state2.assistantCollapsed;
  syncAssistantPanel(state2);
  saveDashboardView2();
}
function onAssistantHotkey(e, state2, saveDashboardView2) {
  if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) {
    return;
  }
  if (e.key !== "l" && e.key !== "L") {
    return;
  }
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
    return;
  }
  e.preventDefault();
  toggleAssistantPanel(state2, saveDashboardView2);
}
function wireAssistantResize(state2, saveDashboardView2) {
  const handle = document.getElementById("assistant-resize-handle");
  const layout = document.getElementById("layout");
  const shell = document.getElementById("assistant-shell");
  let dragging = false;
  let startX = 0;
  let startWidth = 0;
  function shellWidthNow() {
    return shell.getBoundingClientRect().width;
  }
  function onPointerDown(e) {
    if (state2.assistantCollapsed) {
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = shellWidthNow();
    layout.classList.add("assistant-shell-resizing");
    document.body.classList.add("assistant-resize-active");
    handle.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) {
      return;
    }
    const delta = e.clientX - startX;
    const w = clampAssistantWidthPx(startWidth - delta);
    setAssistantWidthCss(w);
  }
  function onPointerUp(e) {
    if (!dragging) {
      return;
    }
    dragging = false;
    layout.classList.remove("assistant-shell-resizing");
    document.body.classList.remove("assistant-resize-active");
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {}
    state2.assistantWidthPx = clampAssistantWidthPx(shellWidthNow());
    setAssistantWidthCss(state2.assistantWidthPx);
    saveDashboardView2();
  }
  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("pointercancel", onPointerUp);
}
function renderChatMessages(container, messages, scrollOptions) {
  const forceBottom = scrollOptions != null && scrollOptions.forceBottom === true;
  const scrollEl = document.getElementById("assistant-scroll");
  let scrollTopBefore = 0;
  let scrollHeightBefore = 0;
  let clientHeightBefore = 0;
  if (scrollEl != null && !forceBottom) {
    scrollTopBefore = scrollEl.scrollTop;
    scrollHeightBefore = scrollEl.scrollHeight;
    clientHeightBefore = scrollEl.clientHeight;
  }
  container.replaceChildren();
  messages.forEach((m, i) => {
    const row = document.createElement("div");
    const isErr = m.error === true;
    row.className = `assistant-msg assistant-msg-${m.role}`;
    if (isErr) {
      row.classList.add("assistant-msg--error");
    }
    row.dataset.index = String(i);
    const label = document.createElement("div");
    label.className = "assistant-msg-label";
    if (m.role === "user") {
      label.textContent = "You";
    } else if (isErr) {
      label.textContent = "Error";
    } else {
      label.textContent = "Assistant";
    }
    const body = document.createElement("div");
    body.className = "assistant-msg-body";
    fillAssistantMessageBody(body, m.content, m.role === "assistant");
    row.append(label, body);
    container.append(row);
  });
  function applyAssistantScroll() {
    if (scrollEl == null) {
      return;
    }
    const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    if (forceBottom) {
      scrollEl.scrollTop = maxScroll;
      return;
    }
    const thresholdPx = 72;
    const distanceFromBottom = Math.max(0, scrollHeightBefore - scrollTopBefore - clientHeightBefore);
    const pinnedToBottom = distanceFromBottom <= thresholdPx;
    if (pinnedToBottom) {
      scrollEl.scrollTop = maxScroll;
      return;
    }
    scrollEl.scrollTop = Math.min(scrollTopBefore, maxScroll);
  }
  window.requestAnimationFrame(() => {
    applyAssistantScroll();
  });
}
var DEFAULT_ASSISTANT_PLACEHOLDER = "Ask about your spec\u2026";
function initAssistantPanel(input) {
  const { onSpecChangeRequest, onStartNew, onStepChange, saveDashboardView: saveDashboardView2, state: state2 } = input;
  const messages = [];
  const listEl = document.getElementById("assistant-messages");
  const form = document.getElementById("assistant-form");
  const inputEl = document.getElementById("assistant-input");
  const sendBtn = document.getElementById("assistant-send");
  const modelBtn = document.getElementById("assistant-model-btn");
  const modelMenu = document.getElementById("assistant-model-menu");
  const composerBarEl = document.getElementById("assistant-composer-bar");
  const modelLabelEl = document.getElementById("assistant-model-btn-label");
  const composerWrapEl = document.getElementById("assistant-composer-wrap");
  const doneWrapEl = document.getElementById("assistant-done-wrap");
  const startNewBtn = document.getElementById("assistant-start-new");
  const statusEl = document.getElementById("assistant-status");
  const activityRowEl = document.getElementById("assistant-activity-row");
  const modelConfirmEl = document.getElementById("assistant-model-confirm");
  applyAssistantWidthFromState(state2);
  syncAssistantPanel(state2);
  let chatModelPresets = [];
  function presetList() {
    return chatModelPresets.length > 0 ? chatModelPresets : DEFAULT_CHAT_MODEL_PRESETS;
  }
  function effectiveModelId() {
    const list2 = presetList();
    const cur = typeof state2.assistantChatModel === "string" ? state2.assistantChatModel : "";
    if (cur.length > 0 && list2.includes(cur)) {
      return cur;
    }
    return list2[0] ?? "auto";
  }
  function renderModelMenu() {
    if (modelMenu == null) {
      return;
    }
    modelMenu.replaceChildren();
    const active = effectiveModelId();
    presetList().forEach((id2) => {
      const li = document.createElement("li");
      li.setAttribute("role", "none");
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "assistant-model-option";
      if (id2 === active) {
        opt.classList.add("assistant-model-option--active");
      }
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-selected", id2 === active ? "true" : "false");
      opt.textContent = id2;
      opt.dataset.modelId = id2;
      li.append(opt);
      modelMenu.append(li);
    });
  }
  function syncModelLabelAndState() {
    const id2 = effectiveModelId();
    const prev = state2.assistantChatModel;
    state2.assistantChatModel = id2;
    if (modelLabelEl != null) {
      modelLabelEl.textContent = id2;
    }
    renderModelMenu();
    if (prev !== id2) {
      saveDashboardView2();
    }
  }
  function closeModelMenu() {
    if (modelMenu != null) {
      modelMenu.hidden = true;
    }
    if (modelBtn != null) {
      modelBtn.setAttribute("aria-expanded", "false");
    }
  }
  function openModelMenu() {
    if (modelMenu != null) {
      modelMenu.hidden = false;
    }
    if (modelBtn != null) {
      modelBtn.setAttribute("aria-expanded", "true");
    }
  }
  function onModelMenuClick(ev) {
    const raw = ev.target;
    const el = raw instanceof Element ? raw : null;
    const btn = el != null ? el.closest("button.assistant-model-option") : null;
    if (!(btn instanceof HTMLButtonElement)) {
      return;
    }
    const id2 = btn.dataset.modelId;
    if (typeof id2 !== "string" || id2.length === 0) {
      return;
    }
    state2.assistantChatModel = id2;
    saveDashboardView2();
    if (modelLabelEl != null) {
      modelLabelEl.textContent = id2;
    }
    renderModelMenu();
    closeModelMenu();
  }
  function onDocumentPointerDownForModel(ev) {
    if (composerBarEl == null || modelMenu == null || modelMenu.hidden) {
      return;
    }
    const t = ev.target;
    if (t instanceof Node && composerBarEl.contains(t)) {
      return;
    }
    closeModelMenu();
  }
  function onDocumentKeydownForModel(ev) {
    if (ev.key !== "Escape") {
      return;
    }
    closeModelMenu();
  }
  function onModelBtnClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (modelBtn != null && modelBtn.disabled) {
      return;
    }
    if (modelMenu == null || modelBtn == null) {
      return;
    }
    if (modelMenu.hidden) {
      renderModelMenu();
      openModelMenu();
    } else {
      closeModelMenu();
    }
  }
  if (modelMenu != null) {
    modelMenu.addEventListener("click", onModelMenuClick);
  }
  if (modelBtn != null) {
    modelBtn.addEventListener("click", onModelBtnClick);
  }
  document.addEventListener("pointerdown", onDocumentPointerDownForModel, true);
  document.addEventListener("keydown", onDocumentKeydownForModel, true);
  let thinkingTimer = null;
  function setActivityBusy(isBusy) {
    if (activityRowEl == null) {
      return;
    }
    activityRowEl.classList.toggle("assistant-activity-row--busy", isBusy);
    activityRowEl.setAttribute("aria-busy", isBusy ? "true" : "false");
  }
  function clearThinkingAnimation() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    statusEl.classList.remove("assistant-status--thinking");
  }
  function setStatus(text2) {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--error");
    statusEl.textContent = text2;
  }
  function setStatusError(text2) {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.classList.add("assistant-status--error");
    statusEl.textContent = text2;
  }
  function setWorkingLine(text2) {
    clearThinkingAnimation();
    setActivityBusy(true);
    statusEl.classList.remove("assistant-status--error");
    statusEl.classList.remove("assistant-status--thinking");
    statusEl.textContent = text2;
  }
  function setThinking() {
    if (thinkingTimer != null) {
      window.clearInterval(thinkingTimer);
      thinkingTimer = null;
    }
    setActivityBusy(true);
    statusEl.classList.remove("assistant-status--error");
    statusEl.classList.add("assistant-status--thinking");
    let phase = 0;
    const suffixes = ["", ".", "..", "..."];
    function tick() {
      statusEl.textContent = `Agent working${suffixes[phase]}`;
      phase = (phase + 1) % suffixes.length;
    }
    tick();
    thinkingTimer = window.setInterval(tick, 420);
  }
  let cachedStatusLine = "";
  function restoreIdleStatus() {
    clearThinkingAnimation();
    setActivityBusy(false);
    statusEl.classList.remove("assistant-status--error");
    statusEl.textContent = cachedStatusLine.length > 0 ? cachedStatusLine : "Cursor agent ready";
  }
  async function refreshStatus() {
    try {
      const res = await fetch("/api/assistant/status");
      if (!res.ok) {
        setStatusError("Status unavailable.");
        return;
      }
      const data = await res.json();
      const parts = [];
      if (data.cursorConfigured) {
        parts.push("Cursor agent ready");
      } else {
        parts.push("Set VEXKIT_USE_CURSOR_AGENT=1 + CURSOR_API_KEY");
      }
      if (data.mcpConfigured) {
        parts.push("MCP configured");
      }
      if (Array.isArray(data.chatModelPresets)) {
        chatModelPresets = data.chatModelPresets.filter((x2) => typeof x2 === "string" && x2.length > 0);
      }
      cachedStatusLine = parts.join(" \xB7 ");
      setStatus(cachedStatusLine);
      syncModelLabelAndState();
    } catch {
      setStatusError("Could not load assistant status.");
    }
  }
  function currentStep() {
    return typeof state2.workflowStep === "number" ? state2.workflowStep : 0;
  }
  function syncWorkflowComposer() {
    if (composerWrapEl == null || doneWrapEl == null || inputEl == null || sendBtn == null) {
      return;
    }
    const step = currentStep();
    if (step === 5) {
      composerWrapEl.hidden = true;
      doneWrapEl.hidden = false;
      return;
    }
    composerWrapEl.hidden = false;
    doneWrapEl.hidden = true;
    const locked = step === 3 || step === 4;
    inputEl.disabled = locked;
    sendBtn.disabled = locked;
    if (modelBtn != null) {
      modelBtn.disabled = locked;
    }
    inputEl.placeholder = locked
      ? step === 3
        ? "Chat disabled during build\u2026"
        : "Chat disabled during verification\u2026"
      : DEFAULT_ASSISTANT_PLACEHOLDER;
  }
  function buildPayload() {
    return {
      messages: messages.map((m) => ({ content: m.content, role: m.role })),
      model: effectiveModelId(),
      step: currentStep(),
    };
  }
  function onSubmit(ev) {
    ev.preventDefault();
    if (inputEl.disabled) {
      return;
    }
    const text2 = inputEl.value.trim();
    if (text2.length === 0) {
      return;
    }
    inputEl.value = "";
    messages.push({ content: text2, role: "user" });
    renderChatMessages(listEl, messages, { forceBottom: true });
    void sendChatRequest(buildPayload());
  }
  function onAssistantInputKeydown(e) {
    if (inputEl.disabled) {
      return;
    }
    if (e.key !== "Enter") {
      return;
    }
    if (e.shiftKey) {
      return;
    }
    e.preventDefault();
    form.requestSubmit();
  }
  async function sendChatRequest(payload) {
    let statusErrorShown = false;
    function chatStatusError(msg) {
      statusErrorShown = true;
      setStatusError(msg);
    }
    setThinking();
    messages.push({ content: "", role: "assistant", error: false });
    renderChatMessages(listEl, messages, { forceBottom: true });
    const assistantIdx = messages.length - 1;
    try {
      const res = await fetch("/api/assistant/chat", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        const errText = await res.text();
        const parsedMsg = parseNdjsonErrorMessage(errText);
        const body = parsedMsg.length > 0 ? parsedMsg : `Request failed (${String(res.status)}): ${errText}`;
        messages[assistantIdx].content = body;
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError(parsedMsg.length > 0 ? parsedMsg : `Chat request failed (${String(res.status)}).`);
        return;
      }
      const reader = res.body?.getReader();
      if (reader == null) {
        messages[assistantIdx].content = "Empty response from server (no body).";
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("Empty response from server.");
        return;
      }
      const dec = new TextDecoder();
      let carry = "";
      let acc = "";
      let sawStreamError = false;
      let sawAssistantOutput = false;
      let pendingStepChange = null;
      let pendingSpecChange = null;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          carry += dec.decode(value, { stream: true });
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";
          lines.forEach((line) => {
            const t = line.trim();
            if (t.length === 0) {
              return;
            }
            let ev;
            try {
              ev = JSON.parse(t);
            } catch {
              return;
            }
            if (ev.type === "meta" && typeof ev.model === "string" && modelConfirmEl != null) {
              modelConfirmEl.hidden = false;
              modelConfirmEl.textContent = `This request: ${ev.model}. Replies may say Auto as the agent name; latency still reflects the model id you chose if the CLI honors it.`;
            }
            if (ev.type === "delta" && typeof ev.text === "string") {
              if (!sawAssistantOutput) {
                sawAssistantOutput = true;
                clearThinkingAnimation();
                setActivityBusy(false);
                statusEl.classList.remove("assistant-status--error");
                statusEl.textContent = cachedStatusLine.length > 0 ? cachedStatusLine : "Cursor agent ready";
              }
              acc += ev.text;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              renderChatMessages(listEl, messages);
            }
            if (ev.type === "error" && typeof ev.message === "string") {
              sawStreamError = true;
              if (!sawAssistantOutput) {
                sawAssistantOutput = true;
                clearThinkingAnimation();
                setActivityBusy(false);
              }
              const errLine = humanizeCursorErrorInAssistantText(ev.message);
              acc += `
${errLine}`;
              messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
              messages[assistantIdx].error = true;
              renderChatMessages(listEl, messages);
              if (errLine !== ev.message) {
                chatStatusError("Usage or quota limit. Try another model or check cursor.com/dashboard.");
              } else {
                chatStatusError("Assistant reported an error.");
              }
            }
            if (ev.type === "step_change" && typeof ev.step === "number") {
              console.log("[vexkit-chat] received step_change event:", ev.step);
              pendingStepChange = ev.step;
            }
            if (ev.type === "spec_change_request" && typeof ev.reason === "string") {
              console.log("[vexkit-chat] received spec_change_request:", ev.reason);
              pendingSpecChange = ev.reason;
            }
            if (ev.type === "done") {
              console.log(
                "[vexkit-chat] received done event, pendingStepChange:",
                pendingStepChange,
                "pendingSpecChange:",
                pendingSpecChange,
              );
            }
          });
        }
        if (acc.length > 0) {
          const humanized = humanizeCursorErrorInAssistantText(acc);
          if (humanized !== acc) {
            acc = humanized;
            messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
            messages[assistantIdx].error = true;
            renderChatMessages(listEl, messages);
            chatStatusError("Usage or quota limit. Try another model or check cursor.com/dashboard.");
          }
        }
      } catch (readErr) {
        sawStreamError = true;
        const detail = readErr instanceof Error ? readErr.message : String(readErr);
        messages[assistantIdx].content = finalizeAssistantVisibleText(
          acc.length > 0
            ? `${acc}

(Stream interrupted: ${detail})`
            : `Stream interrupted: ${detail}`,
        );
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("Connection to assistant was interrupted.");
      }
      if (!sawAssistantOutput && !sawStreamError && acc.length === 0) {
        messages[assistantIdx].content =
          "No response was received. The server may have closed the stream early (check the terminal running vexkit).";
        messages[assistantIdx].error = true;
        renderChatMessages(listEl, messages);
        chatStatusError("No assistant output received.");
      }
      if (!sawStreamError && sawAssistantOutput) {
        messages[assistantIdx].content = finalizeAssistantVisibleText(acc);
        renderChatMessages(listEl, messages);
      }
      console.log(
        "[vexkit-chat] stream finished \u2014 pendingStepChange:",
        pendingStepChange,
        "pendingSpecChange:",
        pendingSpecChange,
        "onStepChange:",
        typeof onStepChange,
        "onSpecChangeRequest:",
        typeof onSpecChangeRequest,
      );
      if (pendingSpecChange != null && typeof onSpecChangeRequest === "function") {
        console.log("[vexkit-chat] calling onSpecChangeRequest");
        onSpecChangeRequest(pendingSpecChange);
      } else if (pendingStepChange != null && typeof onStepChange === "function") {
        console.log("[vexkit-chat] calling onStepChange with step:", pendingStepChange);
        onStepChange(pendingStepChange);
      } else {
        console.log("[vexkit-chat] NO transition triggered");
      }
    } finally {
      if (!statusErrorShown) {
        restoreIdleStatus();
      }
    }
  }
  function autoPrompt(text2) {
    const msg = typeof text2 === "string" && text2.length > 0 ? text2 : "Proceed.";
    const payload = buildPayload();
    console.log("[vexkit-chat] autoPrompt firing \u2014 step:", payload.step, "msg:", msg);
    messages.push({ content: msg, role: "user" });
    renderChatMessages(listEl, messages, { forceBottom: true });
    payload.messages = messages.map((m) => ({ content: m.content, role: m.role }));
    void sendChatRequest(payload);
  }
  function triggerVerify() {
    setWorkingLine("Running verification (lint, format, typecheck)\u2026");
    console.log("[vexkit-chat] triggerVerify called");
    messages.push({ content: "Running verification (lint, typecheck, format)...", role: "assistant", error: false });
    renderChatMessages(listEl, messages, { forceBottom: true });
    fetch("/api/workflow/verify", { method: "POST" })
      .then((res) => {
        console.log("[vexkit-chat] verify response status:", res.status);
        return res.json();
      })
      .then((data) => {
        restoreIdleStatus();
        console.log("[vexkit-chat] verify result ok:", data.ok);
        if (data.ok === true) {
          messages.push({ content: "All checks passed!", role: "assistant", error: false });
          renderChatMessages(listEl, messages);
          if (typeof onStepChange === "function") {
            onStepChange(5);
          }
        } else {
          const rawLog = typeof data.log === "string" ? data.log : "Verification failed.";
          const errorCtx =
            rawLog.length > 3e3
              ? `${rawLog.slice(0, 3e3)}

... (truncated)`
              : rawLog;
          messages.push({
            content: `Verification failed. Sending errors to model to fix.

\`\`\`
${errorCtx.slice(0, 1e3)}
\`\`\``,
            role: "assistant",
            error: true,
          });
          renderChatMessages(listEl, messages);
          if (typeof onStepChange === "function") {
            onStepChange(3);
          }
          setTimeout(() => {
            autoPrompt(`Verification failed. Fix the issues and try again.

${errorCtx}`);
          }, 200);
        }
      })
      .catch((catchErr) => {
        console.error("[vexkit-chat] verify fetch error:", catchErr);
        restoreIdleStatus();
        messages.push({
          content: `Verify request failed: ${catchErr instanceof Error ? catchErr.message : String(catchErr)}`,
          role: "assistant",
          error: true,
        });
        renderChatMessages(listEl, messages);
        setStatusError("Verify request failed.");
      });
  }
  form.addEventListener("submit", onSubmit);
  inputEl.addEventListener("keydown", onAssistantInputKeydown);
  document.getElementById("toggle-assistant").addEventListener("click", () => {
    toggleAssistantPanel(state2, saveDashboardView2);
  });
  window.addEventListener("keydown", (e) => {
    onAssistantHotkey(e, state2, saveDashboardView2);
  });
  if (startNewBtn != null && typeof onStartNew === "function") {
    startNewBtn.addEventListener("click", () => {
      onStartNew();
    });
  }
  wireAssistantResize(state2, saveDashboardView2);
  syncModelLabelAndState();
  void refreshStatus();
  syncWorkflowComposer();
  return { autoPrompt, syncWorkflowComposer, triggerVerify };
}

// packages/vexkit/dist/dashboard/bundle/_work/app.js
var NS = "http://www.w3.org/2000/svg";
var NODE_MAX_W = 248;
var NODE_KIND_BASELINE = 16;
var NODE_LABEL_FIRST_BASELINE = 38;
var NODE_LABEL_LINE_H = 14;
var NODE_LABEL_MAX_LINES = 14;
var NODE_LABEL_BOTTOM_PAD = 12;
var NODE_INNER_PAD_X = 12;
var NODE_LABEL_CHAR_W = 6.2;
var NODE_LEVEL_GAP_X = 16;
var TREE_LEAF_SPACING_X = 58;
var TREE_DEPTH_PER_LEVEL = 132;
var TREE_LAYOUT_MIN_DEPTH_PX = 168;
var TREE_LAYOUT_MIN_BREADTH = 340;
var DASHBOARD_VIEW_STORAGE_KEY = "vexkit.dashboard.view.v1";
var WORKFLOW_STEP_LABELS = ["Describe", "Spec", "Approve", "Build", "Verify", "Done"];
function wireWorkflowRevertModal() {
  const overlay = document.getElementById("workflow-revert-modal-overlay");
  const bodyEl = document.getElementById("workflow-revert-modal-body");
  const titleEl = document.getElementById("workflow-revert-modal-title");
  const cancelBtn = document.getElementById("workflow-revert-modal-cancel");
  const confirmBtn = document.getElementById("workflow-revert-modal-confirm");
  if (overlay == null || bodyEl == null || titleEl == null || cancelBtn == null || confirmBtn == null) {
    return () => {};
  }
  let pendingStep = null;
  function closeModal() {
    pendingStep = null;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
  }
  function openModal(step) {
    pendingStep = step;
    const label = WORKFLOW_STEP_LABELS[step];
    titleEl.textContent = `Revert to ${label}?`;
    bodyEl.textContent = `You will move the workflow back to ${label}. Approvals, verify results, and phase progress after that point will be cleared or reset for this run.`;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    confirmBtn.focus();
  }
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  confirmBtn.addEventListener("click", () => {
    if (pendingStep == null) {
      return;
    }
    const step = pendingStep;
    closeModal();
    setWorkflowStep(step);
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.hidden) {
      return;
    }
    if (e.key !== "Escape") {
      return;
    }
    e.preventDefault();
    closeModal();
  });
  return openModal;
}
var openWorkflowRevertModal = wireWorkflowRevertModal();
var EXPLORER_WIDTH_MIN = 200;
var EXPLORER_WIDTH_MAX = 640;
var state = {
  approvalsByPath: {},
  assistantChatModel: null,
  assistantCollapsed: false,
  assistantWidthPx: null,
  currentPath: null,
  explorerCollapsed: false,
  explorerWidthPx: null,
  expandedDirs: /* @__PURE__ */ new Set(),
  parseResult: null,
  selectedFnIndex: 0,
  tree: [],
  vexSource: "",
  workflowStep: 0,
};
function clampExplorerWidthPx(w) {
  return Math.min(EXPLORER_WIDTH_MAX, Math.max(EXPLORER_WIDTH_MIN, Math.round(w)));
}
function setExplorerWidthCss(px) {
  document.documentElement.style.setProperty("--explorer-width", `${String(px)}px`);
}
function applyExplorerWidthFromState() {
  if (typeof state.explorerWidthPx !== "number" || !Number.isFinite(state.explorerWidthPx)) {
    return;
  }
  const w = clampExplorerWidthPx(state.explorerWidthPx);
  state.explorerWidthPx = w;
  setExplorerWidthCss(w);
}
function loadDashboardView() {
  try {
    const raw = localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
    if (raw == null) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed.explorerCollapsed === "boolean") {
      state.explorerCollapsed = parsed.explorerCollapsed;
    }
    if (Array.isArray(parsed.expandedDirs)) {
      state.expandedDirs = new Set(parsed.expandedDirs.filter((p) => typeof p === "string" && p.length > 0));
    }
    if (typeof parsed.currentPath === "string" && parsed.currentPath.length > 0) {
      state.currentPath = parsed.currentPath;
    }
    if (typeof parsed.selectedFnIndex === "number" && Number.isFinite(parsed.selectedFnIndex)) {
      state.selectedFnIndex = Math.max(0, Math.floor(parsed.selectedFnIndex));
    }
    if (typeof parsed.explorerWidthPx === "number" && Number.isFinite(parsed.explorerWidthPx)) {
      state.explorerWidthPx = clampExplorerWidthPx(parsed.explorerWidthPx);
    }
    if (typeof parsed.assistantCollapsed === "boolean") {
      state.assistantCollapsed = parsed.assistantCollapsed;
    }
    if (typeof parsed.assistantWidthPx === "number" && Number.isFinite(parsed.assistantWidthPx)) {
      state.assistantWidthPx = Math.min(560, Math.max(260, Math.round(parsed.assistantWidthPx)));
    }
    if (typeof parsed.assistantChatModel === "string" && parsed.assistantChatModel.length > 0) {
      state.assistantChatModel = parsed.assistantChatModel;
    }
    if (typeof parsed.workflowStep === "number" && Number.isFinite(parsed.workflowStep)) {
      state.workflowStep = Math.max(0, Math.min(5, Math.floor(parsed.workflowStep)));
    }
    if (parsed.approvalsByPath != null && typeof parsed.approvalsByPath === "object") {
      state.approvalsByPath = parsed.approvalsByPath;
    }
  } catch {}
}
function setWorkflowStatus(text2, isErr) {
  const el = document.getElementById("workflow-status");
  el.hidden = text2.length === 0;
  el.textContent = text2;
  el.classList.toggle("err", Boolean(isErr));
}
async function runCodegenSpecForCurrentPath() {
  const path2 = state.currentPath;
  if (path2 == null || path2.length === 0) {
    setWorkflowStatus("Open a .vex file before continuing.", true);
    return false;
  }
  const res = await fetch("/api/codegen-spec", {
    body: JSON.stringify({ overwrite: false, path: path2 }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const again = await fetch("/api/codegen-spec", {
      body: JSON.stringify({ overwrite: true, path: path2 }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const d2 = await again.json().catch(() => ({}));
    if (!again.ok) {
      setWorkflowStatus(typeof d2.message === "string" ? d2.message : "Codegen failed.", true);
      return false;
    }
    setWorkflowStatus(`Wrote ${typeof d2.wrote === "string" ? d2.wrote : "spec"}.`);
    return true;
  }
  if (!res.ok) {
    setWorkflowStatus(typeof data.message === "string" ? data.message : "Codegen failed.", true);
    return false;
  }
  setWorkflowStatus(`Wrote ${typeof data.wrote === "string" ? data.wrote : "spec"}.`);
  return true;
}
function syncLogicCanvasSpecEditClass() {
  const viewport = document.getElementById("logic-canvas-viewport");
  const logicTree = document.getElementById("logic-tree");
  const canvasHint = document.querySelector(".logic-canvas-hint");
  if (viewport == null || logicTree == null || logicTree.hidden) {
    return;
  }
  const specOk = state.parseResult?.ok === true;
  const isSpecStep = state.workflowStep === 1 || state.workflowStep === 2;
  const canSpecEdit = isSpecStep && specOk;
  viewport.classList.toggle("logic-canvas--spec-edit", canSpecEdit);
  if (canvasHint != null && specOk) {
    const doc = state.parseResult?.document;
    const fn = doc?.functions?.[state.selectedFnIndex];
    if (fn != null) {
      const hasWhens = Array.isArray(fn.whens) && fn.whens.length > 0;
      if (hasWhens) {
        if (isSpecStep) {
          canvasHint.textContent = "Click a node to edit its label \xB7 scroll to zoom \xB7 drag empty space to pan";
        } else {
          canvasHint.textContent = "Scroll to zoom \xB7 drag empty space to pan";
        }
      }
    }
  }
}
function setWorkflowStep(step) {
  state.workflowStep = Math.max(0, Math.min(5, Math.floor(step)));
  saveDashboardView();
  renderWorkflowBar();
}
function getApprovedFnNames() {
  return new Set(state.approvalsByPath[state.currentPath ?? ""] ?? []);
}
function areAllFnsApproved() {
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];
  if (fnNames.length === 0) {
    return false;
  }
  const approved = getApprovedFnNames();
  return fnNames.every((n) => approved.has(n));
}
function applyWorkflowPanelVisibility() {
  const sel = state.workflowStep;
  for (let i = 0; i < 6; i += 1) {
    const p = document.getElementById(`workflow-tabpanel-${String(i)}`);
    if (p == null) {
      continue;
    }
    p.hidden = i !== sel;
  }
}
function workflowAddButton(parent, label, onClick, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "workflow-btn";
  btn.textContent = label;
  btn.disabled = Boolean(disabled);
  btn.addEventListener("click", onClick);
  parent.append(btn);
}
function renderWorkflowStepper() {
  const nav = document.getElementById("workflow-stepper");
  nav.replaceChildren();
  nav.setAttribute("aria-label", "Workflow steps \u2014 choose a completed step to go back");
  const line = document.createElement("div");
  line.className = "stepper-line";
  line.setAttribute("aria-hidden", "true");
  line.setAttribute("role", "presentation");
  const labels = ["Describe", "Spec", "Approve", "Build", "Verify", "Done"];
  const gapCount = labels.length - 1;
  const current = state.workflowStep;
  const splitRatio = Math.min(1, Math.max(0, current / gapCount));
  line.style.setProperty("--stepper-line-split-pct", `${String(splitRatio * 100)}%`);
  nav.append(line);
  labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stepper-node";
    btn.id = `workflow-tab-${String(i)}`;
    btn.setAttribute("aria-controls", `workflow-tabpanel-${String(i)}`);
    btn.setAttribute("aria-selected", current === i ? "true" : "false");
    btn.setAttribute("role", "tab");
    if (i > current) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("title", "Complete earlier steps first");
      btn.setAttribute("aria-label", `${label} (locked)`);
    } else if (i < current) {
      btn.setAttribute("title", `Go back to ${label}`);
      btn.setAttribute("aria-label", `Go back to ${label}`);
    } else {
      btn.setAttribute("title", `Current: ${label}`);
      btn.setAttribute("aria-label", `Current step: ${label}`);
    }
    if (current === 5) {
      btn.classList.add("stepper-node--done-all");
    } else if (i < current) {
      btn.classList.add("stepper-node--past");
    } else if (i === current) {
      btn.classList.add("stepper-node--current");
    } else {
      btn.classList.add("stepper-node--future");
    }
    if (current === i) {
      btn.classList.add("stepper-node--selected");
    }
    const inner = document.createElement("span");
    inner.className = "stepper-node__label";
    inner.textContent = label;
    inner.setAttribute("aria-hidden", "true");
    btn.append(inner);
    const stepIndex = i;
    btn.addEventListener("click", () => {
      if (stepIndex < current) {
        openWorkflowRevertModal(stepIndex);
      }
    });
    nav.append(btn);
  });
}
function renderWorkflowActions() {
  const continueEl = document.getElementById("workflow-actions-continue");
  const buildEl = document.getElementById("workflow-actions-build");
  const verifyEl = document.getElementById("workflow-actions-verify");
  const doneEl = document.getElementById("workflow-actions-done");
  continueEl.replaceChildren();
  buildEl.replaceChildren();
  verifyEl.replaceChildren();
  doneEl.replaceChildren();
  const step = state.workflowStep;
  workflowAddButton(
    continueEl,
    "Continue to Build",
    () => {
      void (async () => {
        setWorkflowStatus("Generating spec\u2026");
        const ok = await runCodegenSpecForCurrentPath();
        if (!ok) {
          return;
        }
        setWorkflowStep(3);
        if (assistantControls != null) {
          setTimeout(() => assistantControls.autoPrompt(), 100);
        }
      })();
    },
    step !== 2 || !areAllFnsApproved(),
  );
  workflowAddButton(
    doneEl,
    "Start New",
    () => {
      state.approvalsByPath = {};
      setWorkflowStep(0);
    },
    step !== 5,
  );
}
function toggleApproval(fnName) {
  const key = state.currentPath ?? "";
  const current = state.approvalsByPath[key] ?? [];
  const set3 = new Set(current);
  if (set3.has(fnName)) {
    set3.delete(fnName);
  } else {
    set3.add(fnName);
  }
  state.approvalsByPath[key] = [...set3];
  saveDashboardView();
  renderWorkflowBar();
}
function approveAll(fnNames) {
  const key = state.currentPath ?? "";
  state.approvalsByPath[key] = [...fnNames];
  saveDashboardView();
  renderWorkflowBar();
}
function renderWorkflowApprovals(fnNames) {
  const wrap = document.getElementById("workflow-approvals");
  const outer = document.getElementById("workflow-approvals-wrap");
  wrap.replaceChildren();
  if (fnNames.length === 0 || state.workflowStep !== 2) {
    outer.hidden = true;
    return;
  }
  outer.hidden = false;
  const approved = getApprovedFnNames();
  const approveAllRow = document.createElement("div");
  approveAllRow.className = "workflow-fn-approve";
  const approveAllBtn = document.createElement("button");
  approveAllBtn.type = "button";
  approveAllBtn.className = "workflow-btn";
  approveAllBtn.textContent = "Approve all functions";
  approveAllBtn.addEventListener("click", () => {
    approveAll(fnNames);
  });
  approveAllRow.append(approveAllBtn);
  wrap.append(approveAllRow);
  fnNames.forEach((name) => {
    const row = document.createElement("div");
    row.className = "workflow-fn-approve";
    const lab = document.createElement("span");
    lab.className = "workflow-fn-name";
    lab.textContent = name;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "workflow-btn";
    const isAp = approved.has(name);
    btn.textContent = isAp ? "Unapprove" : "Approve";
    btn.addEventListener("click", () => {
      toggleApproval(name);
    });
    row.append(lab, btn);
    wrap.append(row);
  });
}
function renderWorkflowBar() {
  const doc = state.parseResult != null && state.parseResult.ok ? state.parseResult.document : null;
  const fnNames = doc != null && Array.isArray(doc.functions) ? doc.functions.map((f) => f.name) : [];
  renderWorkflowStepper();
  renderWorkflowActions();
  renderWorkflowApprovals(fnNames);
  applyWorkflowPanelVisibility();
  syncLogicCanvasSpecEditClass();
  if (assistantControls != null && typeof assistantControls.syncWorkflowComposer === "function") {
    assistantControls.syncWorkflowComposer();
  }
}
function saveDashboardView() {
  try {
    const payload = {
      approvalsByPath: state.approvalsByPath,
      assistantChatModel: typeof state.assistantChatModel === "string" ? state.assistantChatModel : null,
      assistantCollapsed: state.assistantCollapsed,
      assistantWidthPx: typeof state.assistantWidthPx === "number" ? state.assistantWidthPx : null,
      currentPath: state.currentPath,
      explorerCollapsed: state.explorerCollapsed,
      expandedDirs: [...state.expandedDirs],
      explorerWidthPx: typeof state.explorerWidthPx === "number" ? state.explorerWidthPx : null,
      selectedFnIndex: state.selectedFnIndex,
      workflowStep: state.workflowStep,
    };
    localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
var graphInteractionAbort = null;
var watchReloadTimer = null;
var pendingVexEditPath = null;
var graphView = {
  applyTransform: () => {},
  scale: 1,
  tx: 0,
  ty: 0,
};
function kindLabel(kind) {
  if (kind === "fn") {
    return "Function";
  }
  if (kind === "when") {
    return "When";
  }
  if (kind === "and") {
    return "And";
  }
  return "It";
}
function branchToTree(body, path2) {
  if (body.kind === "it") {
    return { children: [], kind: "it", label: body.label, line: body.line, vexPath: path2 };
  }
  const kids = body.child ? [branchToTree(body.child, [...path2, 0])] : [];
  return { children: kids, kind: "and", label: body.label, line: body.line, vexPath: path2 };
}
function whenToTree(when, fnIndex, whenIndex) {
  const basePath = [fnIndex, whenIndex];
  return {
    children: when.branches.map((b, bi) => branchToTree(b, [...basePath, bi])),
    kind: "when",
    label: when.label,
    line: when.line,
    vexPath: basePath,
  };
}
function treeDataFromFunction(fn, fnIndex) {
  const whens = Array.isArray(fn.whens) ? fn.whens : [];
  return {
    children: whens.map((w, wi) => whenToTree(w, fnIndex, wi)),
    kind: "fn",
    label: fn.name,
    line: fn.line,
    vexPath: [fnIndex],
  };
}
function cloneVexDocument(doc) {
  if (typeof structuredClone === "function") {
    return structuredClone(doc);
  }
  return JSON.parse(JSON.stringify(doc));
}
function updateBodyLabel(body, tail, newLabel) {
  if (tail.length === 0) {
    return { ...body, label: newLabel };
  }
  if (body.kind === "it") {
    return body;
  }
  const [t0, ...trest] = tail;
  if (t0 !== 0 || body.child == null) {
    return body;
  }
  return { ...body, child: updateBodyLabel(body.child, trest, newLabel) };
}
function updateBranchesAt(branches, path2, newLabel) {
  const [b, ...tail] = path2;
  return branches.map((body, idx) => {
    if (idx !== b) {
      return body;
    }
    return updateBodyLabel(body, tail, newLabel);
  });
}
function updateNodeLabel(doc, segments, newLabel) {
  if (segments.length === 1) {
    const fi2 = segments[0];
    return {
      ...doc,
      functions: doc.functions.map((f, i) => (i === fi2 ? { ...f, name: newLabel } : f)),
    };
  }
  if (segments.length === 2) {
    const [fi2, wi2] = segments;
    return {
      ...doc,
      functions: doc.functions.map((f, i) => {
        if (i !== fi2) {
          return f;
        }
        return {
          ...f,
          whens: f.whens.map((w, j) => (j === wi2 ? { ...w, label: newLabel } : w)),
        };
      }),
    };
  }
  const [fi, wi, ...rest] = segments;
  return {
    ...doc,
    functions: doc.functions.map((f, i) => {
      if (i !== fi) {
        return f;
      }
      return {
        ...f,
        whens: f.whens.map((w, j) => {
          if (j !== wi) {
            return w;
          }
          return { ...w, branches: updateBranchesAt(w.branches, rest, newLabel) };
        }),
      };
    }),
  };
}
function closeVexNodeEditDialog() {
  const overlay = document.getElementById("vex-node-edit-overlay");
  if (overlay != null) {
    overlay.hidden = true;
  }
  pendingVexEditPath = null;
}
function openVexNodeEditDialog(data) {
  const overlay = document.getElementById("vex-node-edit-overlay");
  const input = document.getElementById("vex-node-edit-input");
  const titleEl = document.getElementById("vex-node-edit-title");
  if (overlay == null || input == null || titleEl == null) {
    return;
  }
  if (!Array.isArray(data.vexPath)) {
    return;
  }
  pendingVexEditPath = data.vexPath;
  input.value = data.label;
  titleEl.textContent = `Edit ${kindLabel(data.kind)}`;
  overlay.hidden = false;
  input.focus();
  input.select();
}
function onLogicNodeHitClick(data) {
  if (state.workflowStep !== 1 && state.workflowStep !== 2) {
    return;
  }
  if (state.currentPath == null || state.parseResult?.ok !== true) {
    return;
  }
  if (!Array.isArray(data.vexPath)) {
    return;
  }
  openVexNodeEditDialog(data);
}
async function commitVexNodeEdit() {
  const path2 = pendingVexEditPath;
  const input = document.getElementById("vex-node-edit-input");
  if (path2 == null || state.currentPath == null || input == null) {
    return;
  }
  const raw = input.value.trim();
  if (raw.length === 0) {
    setWorkflowStatus("Label cannot be empty.", true);
    return;
  }
  const doc = state.parseResult?.document;
  if (doc == null || state.parseResult?.ok !== true) {
    return;
  }
  const nextDoc = updateNodeLabel(cloneVexDocument(doc), path2, raw);
  const res = await fetch("/api/document", {
    body: JSON.stringify({ document: nextDoc, path: state.currentPath }),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    setWorkflowStatus(typeof payload.message === "string" ? payload.message : "Save failed.", true);
    return;
  }
  setWorkflowStatus("Updated .vex");
  closeVexNodeEditDialog();
  await openVexFile(state.currentPath, { resetFunctionIndex: false });
}
function splitLongToken(token, maxLen) {
  if (token.length <= maxLen) {
    return [token];
  }
  const parts = [];
  for (let i = 0; i < token.length; i += maxLen) {
    parts.push(token.slice(i, i + maxLen));
  }
  return parts;
}
function wrapLabelToLines(text2, maxWidthPx) {
  const maxChars = Math.max(4, Math.floor(maxWidthPx / NODE_LABEL_CHAR_W));
  const words = text2.split(/\s+/).filter((w) => w.length > 0);
  const tokens = words.flatMap((w) => splitLongToken(w, maxChars));
  if (tokens.length === 0) {
    return [""];
  }
  const lines = [];
  let line = tokens[0];
  for (let i = 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    const next = `${line} ${t}`;
    if (next.length <= maxChars) {
      line = next;
    } else {
      lines.push(line);
      line = t;
    }
  }
  lines.push(line);
  return lines;
}
function capLabelLines(lines) {
  if (lines.length <= NODE_LABEL_MAX_LINES) {
    return lines;
  }
  const out = lines.slice(0, NODE_LABEL_MAX_LINES);
  const last = out[NODE_LABEL_MAX_LINES - 1];
  out[NODE_LABEL_MAX_LINES - 1] = `${last}\u2026`;
  return out;
}
function measureNode(d) {
  const raw = d.data.label;
  const innerW = NODE_MAX_W - NODE_INNER_PAD_X * 2;
  const lines = capLabelLines(wrapLabelToLines(raw, innerW));
  d.labelLines = lines;
  d.nodeWidth = NODE_MAX_W;
  const lineCount = Math.max(1, lines.length);
  d.nodeHeight = NODE_LABEL_FIRST_BASELINE + (lineCount - 1) * NODE_LABEL_LINE_H + NODE_LABEL_BOTTOM_PAD;
}
function resolveNodeOverlapX(hierarchyRoot) {
  const maxDepth = hierarchyRoot.height;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let depth = 0; depth <= maxDepth; depth += 1) {
      const row = [];
      hierarchyRoot.each((d) => {
        if (d.depth === depth) {
          row.push(d);
        }
      });
      if (row.length <= 1) {
        continue;
      }
      const ordered = row.toSorted((a, b) => a.px - b.px);
      for (let i = 1; i < ordered.length; i += 1) {
        const prev = ordered[i - 1];
        const cur = ordered[i];
        const minCenter = prev.px + prev.nodeWidth / 2 + NODE_LEVEL_GAP_X + cur.nodeWidth / 2;
        if (cur.px < minCenter) {
          const delta = minCenter - cur.px;
          cur.eachBefore((n) => {
            n.px += delta;
          });
        }
      }
    }
  }
}
function layoutHierarchy(treeData) {
  const root2 = hierarchy(treeData);
  const leaves = root2.leaves();
  const leafCount = Math.max(1, leaves.length);
  const maxDepth = root2.height + 1;
  const breadth = Math.max(
    TREE_LAYOUT_MIN_BREADTH,
    leafCount * TREE_LEAF_SPACING_X,
    NODE_MAX_W * leafCount + NODE_LEVEL_GAP_X * (leafCount + 1),
  );
  const depthPx = Math.max(TREE_LAYOUT_MIN_DEPTH_PX, maxDepth * TREE_DEPTH_PER_LEVEL);
  tree_default().size([breadth, depthPx])(root2);
  root2.each((d) => {
    d.px = d.x + 18;
    d.py = d.y + 18;
  });
  return root2;
}
function curvedLinkPath(sx, sy, tx, ty) {
  const gen = linkVertical()
    .x((p) => p[0])
    .y((p) => p[1]);
  return gen({
    source: [sx, sy],
    target: [tx, ty],
  });
}
function graphBounds(hierarchyRoot) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  hierarchyRoot.each((d) => {
    const w = d.nodeWidth;
    const h = d.nodeHeight;
    minX = Math.min(minX, d.px - w / 2 - 12);
    maxX = Math.max(maxX, d.px + w / 2 + 12);
    minY = Math.min(minY, d.py - h / 2 - 12);
    maxY = Math.max(maxY, d.py + h / 2 + 12);
  });
  return { maxX, maxY, minX, minY };
}
function setGraphTransform(panRoot, input) {
  const { scale, tx, ty } = input;
  graphView.scale = scale;
  graphView.tx = tx;
  graphView.ty = ty;
  panRoot.setAttribute("transform", `translate(${String(tx)},${String(ty)}) scale(${String(scale)})`);
}
function fitGraphInViewport(viewport, panRoot, bounds) {
  const w = Math.max(bounds.maxX - bounds.minX, 1);
  const h = Math.max(bounds.maxY - bounds.minY, 1);
  const vw = Math.max(viewport.clientWidth, 64);
  const vh = Math.max(viewport.clientHeight, 64);
  const pad = 56;
  const scaleRaw = Math.min((vw - pad) / w, (vh - pad) / h, 1.12, 1);
  const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? Math.max(scaleRaw, 0.04) : 0.5;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const tx = vw / 2 - scale * cx;
  const ty = vh / 2 - scale * cy;
  setGraphTransform(panRoot, { scale, tx, ty });
}
function viewportHasSize(viewport) {
  return viewport.clientWidth > 8 && viewport.clientHeight > 8;
}
function scheduleFitAndWire(viewport, panRoot, bounds) {
  const run = () => {
    void viewport.offsetHeight;
    void viewport.getBoundingClientRect();
    if (!viewportHasSize(viewport)) {
      return false;
    }
    fitGraphInViewport(viewport, panRoot, bounds);
    wireGraphPanZoom(viewport, panRoot);
    return true;
  };
  if (run()) {
    return;
  }
  requestAnimationFrame(() => {
    if (run()) {
      return;
    }
    requestAnimationFrame(() => {
      if (run()) {
        return;
      }
      const ro = new ResizeObserver(() => {
        if (run()) {
          ro.disconnect();
        }
      });
      ro.observe(viewport);
    });
  });
}
function wireGraphPanZoom(viewport, panRoot) {
  if (graphInteractionAbort) {
    graphInteractionAbort.abort();
  }
  graphInteractionAbort = new AbortController();
  const signal = graphInteractionAbort.signal;
  graphView.applyTransform = () => {
    setGraphTransform(panRoot, {
      scale: graphView.scale,
      tx: graphView.tx,
      ty: graphView.ty,
    });
  };
  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        dy *= 16;
      }
      if (e.deltaMode === 2) {
        dy *= Math.max(rect.height, 64);
      }
      const zoom = Math.exp(-dy * 78e-5);
      if (!Number.isFinite(zoom) || zoom <= 0) {
        return;
      }
      const newScale = Math.min(2.4, Math.max(0.18, graphView.scale * zoom));
      const ratio = newScale / graphView.scale;
      graphView.tx = mx - ratio * (mx - graphView.tx);
      graphView.ty = my - ratio * (my - graphView.ty);
      graphView.scale = newScale;
      graphView.applyTransform();
    },
    { passive: false, signal },
  );
  viewport.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) {
        return;
      }
      const t = e.target;
      if (t.closest && t.closest(".logic-node-hit")) {
        return;
      }
      viewport.classList.add("logic-canvas-grabbing");
      viewport.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const startTx = graphView.tx;
      const startTy = graphView.ty;
      const onMove = (ev) => {
        graphView.tx = startTx + ev.clientX - startX;
        graphView.ty = startTy + ev.clientY - startY;
        graphView.applyTransform();
      };
      const onUp = (ev) => {
        viewport.classList.remove("logic-canvas-grabbing");
        try {
          viewport.releasePointerCapture(ev.pointerId);
        } catch {}
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerup", onUp);
        viewport.removeEventListener("pointercancel", onUp);
      };
      viewport.addEventListener("pointermove", onMove, { signal });
      viewport.addEventListener("pointerup", onUp, { signal });
      viewport.addEventListener("pointercancel", onUp, { signal });
    },
    { signal },
  );
}
function drawLinks(linksLayer, hierarchyRoot) {
  for (const link3 of hierarchyRoot.links()) {
    const s = link3.source;
    const t = link3.target;
    const sx = s.px;
    const sy = s.py + s.nodeHeight / 2;
    const tx = t.px;
    const ty = t.py - t.nodeHeight / 2;
    const dPath = curvedLinkPath(sx, sy, tx, ty);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", dPath);
    p.setAttribute("fill", "none");
    p.setAttribute("marker-end", "url(#logic-arrow)");
    p.setAttribute("stroke", "#8b9cb3");
    p.setAttribute("stroke-width", "1.5");
    linksLayer.append(p);
  }
}
var NODE_THEME = {
  and: { fill: "rgba(122,184,122,0.22)", kind: "#9ed49e", stroke: "#7ab87a" },
  fn: { fill: "rgba(91,159,212,0.22)", kind: "#8ec4f0", stroke: "#5b9fd4" },
  it: { fill: "rgba(184,143,212,0.22)", kind: "#c9a8e0", stroke: "#b88fd4" },
  when: { fill: "rgba(196,163,90,0.24)", kind: "#dcc07a", stroke: "#c4a35a" },
};
function drawNodes(nodesLayer, hierarchyRoot) {
  hierarchyRoot.each((d) => {
    const w = d.nodeWidth;
    const h = d.nodeHeight;
    const lines = d.labelLines;
    const theme = NODE_THEME[d.data.kind] ?? NODE_THEME.fn;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${String(d.px)},${String(d.py)})`);
    const hit = document.createElementNS(NS, "rect");
    hit.setAttribute("class", "logic-node-hit");
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("height", String(h + 8));
    hit.setAttribute("width", String(w + 8));
    hit.setAttribute("x", String(-(w + 8) / 2));
    hit.setAttribute("y", String(-(h + 8) / 2));
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", "logic-node-rect");
    rect.setAttribute("fill", theme.fill);
    rect.setAttribute("height", String(h));
    rect.setAttribute("rx", "7");
    rect.setAttribute("stroke", theme.stroke);
    rect.setAttribute("stroke-width", "1.75");
    rect.setAttribute("width", String(w));
    rect.setAttribute("x", String(-w / 2));
    rect.setAttribute("y", String(-h / 2));
    const kindEl = document.createElementNS(NS, "text");
    kindEl.setAttribute("fill", theme.kind);
    kindEl.setAttribute("font-size", "8px");
    kindEl.setAttribute("font-weight", "700");
    kindEl.setAttribute("text-anchor", "middle");
    kindEl.setAttribute("x", "0");
    kindEl.setAttribute("y", String(-h / 2 + NODE_KIND_BASELINE));
    kindEl.textContent = kindLabel(d.data.kind);
    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("fill", "#e7ecf3");
    lab.setAttribute("font-size", "11px");
    lab.setAttribute("text-anchor", "middle");
    lab.setAttribute("x", "0");
    lab.setAttribute("y", String(-h / 2 + NODE_LABEL_FIRST_BASELINE));
    lines.forEach((line, i) => {
      const ts = document.createElementNS(NS, "tspan");
      ts.setAttribute("x", "0");
      if (i > 0) {
        ts.setAttribute("dy", String(NODE_LABEL_LINE_H));
      }
      ts.textContent = line;
      lab.append(ts);
    });
    const tip = document.createElementNS(NS, "title");
    tip.textContent = d.data.label;
    hit.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onLogicNodeHitClick(d.data);
    });
    g.append(hit, rect, kindEl, lab, tip);
    nodesLayer.append(g);
  });
}
function renderLogicGraph(fn) {
  const svg2 = document.getElementById("logic-canvas-svg");
  const viewport = document.getElementById("logic-canvas-viewport");
  viewport.classList.toggle(
    "logic-canvas--spec-edit",
    (state.workflowStep === 1 || state.workflowStep === 2) && state.parseResult?.ok === true,
  );
  svg2.replaceChildren();
  const defs = document.createElementNS(NS, "defs");
  const marker = document.createElementNS(NS, "marker");
  marker.setAttribute("id", "logic-arrow");
  marker.setAttribute("markerHeight", "9");
  marker.setAttribute("markerWidth", "9");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("refX", "8");
  marker.setAttribute("refY", "4.5");
  const arrowPath = document.createElementNS(NS, "path");
  arrowPath.setAttribute("d", "M0,0 L9,4.5 L0,9 L2,4.5 Z");
  arrowPath.setAttribute("fill", "#8b9cb3");
  marker.append(arrowPath);
  defs.append(marker);
  const panRoot = document.createElementNS(NS, "g");
  panRoot.setAttribute("id", "logic-pan-root");
  const linksLayer = document.createElementNS(NS, "g");
  const nodesLayer = document.createElementNS(NS, "g");
  panRoot.append(linksLayer, nodesLayer);
  svg2.append(defs, panRoot);
  const data = treeDataFromFunction(fn, state.selectedFnIndex);
  const hierarchyRoot = layoutHierarchy(data);
  hierarchyRoot.each((d) => {
    measureNode(d);
  });
  resolveNodeOverlapX(hierarchyRoot);
  drawLinks(linksLayer, hierarchyRoot);
  drawNodes(nodesLayer, hierarchyRoot);
  const bounds = graphBounds(hierarchyRoot);
  scheduleFitAndWire(viewport, panRoot, bounds);
}
function renderFileNode(node) {
  const li = document.createElement("li");
  if (node.kind === "directory") {
    const row2 = document.createElement("div");
    row2.className = "file-row";
    const twisty = document.createElement("span");
    twisty.className = "twisty";
    const isOpen = state.expandedDirs.has(node.relativePath);
    twisty.textContent = isOpen ? "\u25BC" : "\u25B6";
    twisty.addEventListener("click", () => {
      if (state.expandedDirs.has(node.relativePath)) {
        state.expandedDirs.delete(node.relativePath);
      } else {
        state.expandedDirs.add(node.relativePath);
      }
      renderFileTree();
      saveDashboardView();
    });
    const label = document.createElement("span");
    label.textContent = `${node.name}/`;
    row2.append(twisty, label);
    li.append(row2);
    if (isOpen && node.children) {
      const ul = document.createElement("ul");
      ul.className = "file-list";
      for (const ch of node.children) {
        ul.append(renderFileNode(ch));
      }
      li.append(ul);
    }
    return li;
  }
  const row = document.createElement("div");
  const isVex = node.name.endsWith(".vex");
  row.className = isVex ? "file-row file-vex" : "file-row file-other";
  if (isVex && node.relativePath === state.currentPath) {
    row.classList.add("file-row-current");
    row.setAttribute("aria-current", "true");
  }
  row.textContent = node.name;
  if (isVex) {
    row.addEventListener("click", () => {
      void openVexFile(node.relativePath);
    });
  }
  li.append(row);
  return li;
}
function renderFileTree() {
  const el = document.getElementById("sidebar-tree");
  el.replaceChildren();
  const ul = document.createElement("ul");
  ul.className = "file-list root";
  for (const node of state.tree) {
    ul.append(renderFileNode(node));
  }
  el.append(ul);
}
function collapseAllExplorerFolders() {
  state.expandedDirs.clear();
  renderFileTree();
  saveDashboardView();
}
async function treeHasRelativePath(nodes, relPath) {
  if (!Array.isArray(nodes)) {
    return false;
  }
  return nodes.some((node) => {
    if (node.relativePath === relPath) {
      return true;
    }
    return node.children != null && treeHasRelativePath(node.children, relPath);
  });
}
async function refreshTree() {
  const res = await fetch("/api/tree");
  if (!res.ok) {
    document.getElementById("header-root").textContent = "Failed to load file tree.";
    return;
  }
  const data = await res.json();
  state.tree = data.tree;
  document.getElementById("header-root").textContent = data.root;
  renderFileTree();
}
function updateMainPanel() {
  try {
    const hint = document.getElementById("hint");
    const errBox = document.getElementById("parse-errors");
    const logicTree = document.getElementById("logic-tree");
    const toolbar = document.getElementById("toolbar");
    hint.hidden = true;
    errBox.hidden = true;
    logicTree.hidden = true;
    toolbar.replaceChildren();
    if (state.parseResult == null) {
      hint.hidden = false;
      return;
    }
    if (!state.parseResult.ok) {
      errBox.hidden = false;
      const errs = state.parseResult.errors;
      if (Array.isArray(errs) && errs.length > 0) {
        errBox.textContent = errs.map((e) => `Line ${String(e.line)}: ${e.message}`).join("\n");
      } else if (typeof state.parseResult.loadErrorMessage === "string") {
        errBox.textContent = state.parseResult.loadErrorMessage;
      } else {
        errBox.textContent = "Document could not be loaded.";
      }
      return;
    }
    const doc = state.parseResult.document;
    if (doc == null || doc.functions.length === 0) {
      errBox.hidden = false;
      errBox.textContent = "No functions in document.";
      return;
    }
    const fnCount = doc.functions.length;
    if (state.selectedFnIndex >= fnCount) {
      state.selectedFnIndex = fnCount - 1;
    }
    for (let i = 0; i < doc.functions.length; i += 1) {
      const fn2 = doc.functions[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = i === state.selectedFnIndex ? "fn-btn active" : "fn-btn";
      btn.textContent = fn2.name;
      const idx = i;
      btn.addEventListener("click", () => {
        state.selectedFnIndex = idx;
        updateMainPanel();
      });
      toolbar.append(btn);
    }
    logicTree.hidden = false;
    const viewportEl = document.getElementById("logic-canvas-viewport");
    const canvasHint = document.querySelector(".logic-canvas-hint");
    void logicTree.offsetHeight;
    void viewportEl.offsetHeight;
    const fn = doc.functions[state.selectedFnIndex];
    if (canvasHint != null) {
      const hasWhens = Array.isArray(fn.whens) && fn.whens.length > 0;
      if (hasWhens) {
        if (state.workflowStep === 1 || state.workflowStep === 2) {
          canvasHint.textContent =
            "Use the assistant to describe work across .vex files \xB7 scroll to zoom \xB7 drag empty space to pan";
        } else {
          canvasHint.textContent = "Scroll to zoom \xB7 drag empty space to pan";
        }
      } else {
        canvasHint.textContent = "No WHEN blocks under this function.";
      }
    }
    renderLogicGraph(fn);
  } finally {
    renderWorkflowBar();
    saveDashboardView();
  }
}
async function openVexFile(relPath, options2) {
  const resetFunctionIndex = options2?.resetFunctionIndex !== false;
  state.currentPath = relPath;
  if (resetFunctionIndex) {
    state.selectedFnIndex = 0;
  }
  const params = new URLSearchParams({ path: relPath });
  const res = await fetch(`/api/document?${params.toString()}`);
  const data = await res.json();
  if (res.ok) {
    state.vexSource = typeof data.source === "string" ? data.source : "";
    state.parseResult = {
      document: data.document,
      errors: Array.isArray(data.errors) ? data.errors : [],
      ok: data.ok === true,
    };
  } else {
    state.vexSource = "";
    const msg = typeof data.message === "string" ? data.message : "Could not load document.";
    state.parseResult = {
      document: null,
      errors: [],
      loadErrorMessage: msg,
      ok: false,
    };
  }
  saveDashboardView();
  updateMainPanel();
  renderFileTree();
}
document.getElementById("collapse-all-folders").addEventListener("click", collapseAllExplorerFolders);
function syncExplorerPanel() {
  const layout = document.getElementById("layout");
  const btn = document.getElementById("toggle-explorer");
  const collapsed = state.explorerCollapsed;
  layout.classList.toggle("sidebar-explorer-collapsed", collapsed);
  btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  btn.textContent = collapsed ? "\u27E9" : "\u27E8";
  btn.setAttribute(
    "title",
    collapsed ? "Show file explorer (Ctrl+B or \u2318B)" : "Hide file explorer (Ctrl+B or \u2318B)",
  );
  btn.setAttribute("aria-label", collapsed ? "Show file explorer" : "Hide file explorer");
}
function toggleExplorerPanel() {
  state.explorerCollapsed = !state.explorerCollapsed;
  syncExplorerPanel();
  saveDashboardView();
}
function onExplorerHotkey(e) {
  if (!(e.ctrlKey || e.metaKey)) {
    return;
  }
  if (e.key !== "b" && e.key !== "B") {
    return;
  }
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
    return;
  }
  e.preventDefault();
  toggleExplorerPanel();
}
loadDashboardView();
applyExplorerWidthFromState();
var vexNodeEditForm = document.getElementById("vex-node-edit-form");
var vexNodeEditCancel = document.getElementById("vex-node-edit-cancel");
var vexNodeEditOverlay = document.getElementById("vex-node-edit-overlay");
if (vexNodeEditForm != null) {
  vexNodeEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    void commitVexNodeEdit();
  });
}
if (vexNodeEditCancel != null) {
  vexNodeEditCancel.addEventListener("click", () => {
    closeVexNodeEditDialog();
  });
}
if (vexNodeEditOverlay != null) {
  vexNodeEditOverlay.addEventListener("click", (e) => {
    if (e.target === vexNodeEditOverlay) {
      closeVexNodeEditDialog();
    }
  });
}
document.addEventListener("keydown", (e) => {
  if (vexNodeEditOverlay == null || vexNodeEditOverlay.hidden) {
    return;
  }
  if (e.key === "Escape") {
    closeVexNodeEditDialog();
  }
});
function wireSidebarResize() {
  const handle = document.getElementById("sidebar-resize-handle");
  const layout = document.getElementById("layout");
  const shell = document.getElementById("sidebar-shell");
  let dragging = false;
  let startX = 0;
  let startWidth = 0;
  function shellWidthNow() {
    return shell.getBoundingClientRect().width;
  }
  function onPointerDown(e) {
    if (state.explorerCollapsed) {
      return;
    }
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = shellWidthNow();
    layout.classList.add("sidebar-shell-resizing");
    document.body.classList.add("sidebar-resize-active");
    handle.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) {
      return;
    }
    const delta = e.clientX - startX;
    const w = clampExplorerWidthPx(startWidth + delta);
    setExplorerWidthCss(w);
  }
  function onPointerUp(e) {
    if (!dragging) {
      return;
    }
    dragging = false;
    layout.classList.remove("sidebar-shell-resizing");
    document.body.classList.remove("sidebar-resize-active");
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {}
    state.explorerWidthPx = clampExplorerWidthPx(shellWidthNow());
    setExplorerWidthCss(state.explorerWidthPx);
    saveDashboardView();
  }
  handle.addEventListener("pointerdown", onPointerDown);
  handle.addEventListener("pointermove", onPointerMove);
  handle.addEventListener("pointerup", onPointerUp);
  handle.addEventListener("pointercancel", onPointerUp);
}
document.getElementById("toggle-explorer").addEventListener("click", toggleExplorerPanel);
window.addEventListener("keydown", onExplorerHotkey);
syncExplorerPanel();
wireSidebarResize();
var assistantControls = null;
function handleStepChange(newStep) {
  setWorkflowStep(newStep);
  if (newStep === 4 && assistantControls != null) {
    assistantControls.triggerVerify();
  }
}
function handleSpecChangeRequest(reason) {
  const overlay = document.getElementById("workflow-revert-modal-overlay");
  const bodyEl = document.getElementById("workflow-revert-modal-body");
  const titleEl = document.getElementById("workflow-revert-modal-title");
  if (overlay == null || bodyEl == null || titleEl == null) {
    return;
  }
  titleEl.textContent = "Agent requests spec changes";
  bodyEl.textContent = reason;
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  const confirmBtn = document.getElementById("workflow-revert-modal-confirm");
  const cancelBtn = document.getElementById("workflow-revert-modal-cancel");
  function cleanup() {
    confirmBtn.removeEventListener("click", onConfirm);
    cancelBtn.removeEventListener("click", onCancel);
  }
  function onConfirm() {
    cleanup();
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    setWorkflowStep(1);
    if (assistantControls != null) {
      setTimeout(() => assistantControls.autoPrompt("Refine the specs based on the build feedback."), 100);
    }
  }
  function onCancel() {
    cleanup();
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
  }
  confirmBtn.addEventListener("click", onConfirm);
  cancelBtn.addEventListener("click", onCancel);
}
assistantControls = initAssistantPanel({
  onSpecChangeRequest: handleSpecChangeRequest,
  onStartNew: () => {
    state.approvalsByPath = {};
    setWorkflowStep(0);
  },
  onStepChange: handleStepChange,
  saveDashboardView,
  state,
});
function scheduleReloadFromWatch() {
  if (watchReloadTimer != null) {
    clearTimeout(watchReloadTimer);
  }
  watchReloadTimer = window.setTimeout(async () => {
    watchReloadTimer = null;
    await refreshTree();
    if (state.currentPath != null) {
      await openVexFile(state.currentPath, { resetFunctionIndex: false });
    }
  }, 220);
}
function onWatchSocketMessage(ev) {
  let payload;
  try {
    payload = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (payload?.type !== "vexFilesChanged") {
    return;
  }
  scheduleReloadFromWatch();
}
function connectProjectWatch() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${location.host}/api/watch`);
  ws.addEventListener("message", onWatchSocketMessage);
  ws.addEventListener("close", () => {
    window.setTimeout(connectProjectWatch, 2600);
  });
  ws.addEventListener("error", () => {
    ws.close();
  });
}
connectProjectWatch();
void (async () => {
  await refreshTree();
  if (state.currentPath != null && !treeHasRelativePath(state.tree, state.currentPath)) {
    state.currentPath = null;
    state.parseResult = null;
    saveDashboardView();
  }
  if (state.currentPath != null) {
    await openVexFile(state.currentPath, { resetFunctionIndex: false });
  }
  renderWorkflowBar();
})();
/*! Bundled license information:

dompurify/dist/purify.es.mjs:
  (*! @license DOMPurify 3.3.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.3/LICENSE *)
*/
