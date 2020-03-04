
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var nodejsCustomInspectSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function' ? Symbol.for('nodejs.util.inspect.custom') : undefined;

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    var MAX_ARRAY_LENGTH = 10;
    var MAX_RECURSIVE_DEPTH = 2;
    /**
     * Used to print values in error messages.
     */

    function inspect(value) {
      return formatValue(value, []);
    }

    function formatValue(value, seenValues) {
      switch (_typeof(value)) {
        case 'string':
          return JSON.stringify(value);

        case 'function':
          return value.name ? "[function ".concat(value.name, "]") : '[function]';

        case 'object':
          if (value === null) {
            return 'null';
          }

          return formatObjectValue(value, seenValues);

        default:
          return String(value);
      }
    }

    function formatObjectValue(value, previouslySeenValues) {
      if (previouslySeenValues.indexOf(value) !== -1) {
        return '[Circular]';
      }

      var seenValues = [].concat(previouslySeenValues, [value]);
      var customInspectFn = getCustomFn(value);

      if (customInspectFn !== undefined) {
        // $FlowFixMe(>=0.90.0)
        var customValue = customInspectFn.call(value); // check for infinite recursion

        if (customValue !== value) {
          return typeof customValue === 'string' ? customValue : formatValue(customValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }

      return formatObject(value, seenValues);
    }

    function formatObject(object, seenValues) {
      var keys = Object.keys(object);

      if (keys.length === 0) {
        return '{}';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[' + getObjectTag(object) + ']';
      }

      var properties = keys.map(function (key) {
        var value = formatValue(object[key], seenValues);
        return key + ': ' + value;
      });
      return '{ ' + properties.join(', ') + ' }';
    }

    function formatArray(array, seenValues) {
      if (array.length === 0) {
        return '[]';
      }

      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return '[Array]';
      }

      var len = Math.min(MAX_ARRAY_LENGTH, array.length);
      var remaining = array.length - len;
      var items = [];

      for (var i = 0; i < len; ++i) {
        items.push(formatValue(array[i], seenValues));
      }

      if (remaining === 1) {
        items.push('... 1 more item');
      } else if (remaining > 1) {
        items.push("... ".concat(remaining, " more items"));
      }

      return '[' + items.join(', ') + ']';
    }

    function getCustomFn(object) {
      var customInspectFn = object[String(nodejsCustomInspectSymbol)];

      if (typeof customInspectFn === 'function') {
        return customInspectFn;
      }

      if (typeof object.inspect === 'function') {
        return object.inspect;
      }
    }

    function getObjectTag(object) {
      var tag = Object.prototype.toString.call(object).replace(/^\[object /, '').replace(/]$/, '');

      if (tag === 'Object' && typeof object.constructor === 'function') {
        var name = object.constructor.name;

        if (typeof name === 'string' && name !== '') {
          return name;
        }
      }

      return tag;
    }

    var QueryDocumentKeys = {
      Name: [],
      Document: ['definitions'],
      OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
      VariableDefinition: ['variable', 'type', 'defaultValue', 'directives'],
      Variable: ['name'],
      SelectionSet: ['selections'],
      Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
      Argument: ['name', 'value'],
      FragmentSpread: ['name', 'directives'],
      InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
      FragmentDefinition: ['name', // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      'variableDefinitions', 'typeCondition', 'directives', 'selectionSet'],
      IntValue: [],
      FloatValue: [],
      StringValue: [],
      BooleanValue: [],
      NullValue: [],
      EnumValue: [],
      ListValue: ['values'],
      ObjectValue: ['fields'],
      ObjectField: ['name', 'value'],
      Directive: ['name', 'arguments'],
      NamedType: ['name'],
      ListType: ['type'],
      NonNullType: ['type'],
      SchemaDefinition: ['directives', 'operationTypes'],
      OperationTypeDefinition: ['type'],
      ScalarTypeDefinition: ['description', 'name', 'directives'],
      ObjectTypeDefinition: ['description', 'name', 'interfaces', 'directives', 'fields'],
      FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
      InputValueDefinition: ['description', 'name', 'type', 'defaultValue', 'directives'],
      InterfaceTypeDefinition: ['description', 'name', 'directives', 'fields'],
      UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
      EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
      EnumValueDefinition: ['description', 'name', 'directives'],
      InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
      DirectiveDefinition: ['description', 'name', 'arguments', 'locations'],
      SchemaExtension: ['directives', 'operationTypes'],
      ScalarTypeExtension: ['name', 'directives'],
      ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
      InterfaceTypeExtension: ['name', 'directives', 'fields'],
      UnionTypeExtension: ['name', 'directives', 'types'],
      EnumTypeExtension: ['name', 'directives', 'values'],
      InputObjectTypeExtension: ['name', 'directives', 'fields']
    };
    var BREAK = Object.freeze({});
    /**
     * visit() will walk through an AST using a depth first traversal, calling
     * the visitor's enter function at each node in the traversal, and calling the
     * leave function after visiting that node and all of its child nodes.
     *
     * By returning different values from the enter and leave functions, the
     * behavior of the visitor can be altered, including skipping over a sub-tree of
     * the AST (by returning false), editing the AST by returning a value or null
     * to remove the value, or to stop the whole traversal by returning BREAK.
     *
     * When using visit() to edit an AST, the original AST will not be modified, and
     * a new version of the AST with the changes applied will be returned from the
     * visit function.
     *
     *     const editedAST = visit(ast, {
     *       enter(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: skip visiting this node
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       },
     *       leave(node, key, parent, path, ancestors) {
     *         // @return
     *         //   undefined: no action
     *         //   false: no action
     *         //   visitor.BREAK: stop visiting altogether
     *         //   null: delete this node
     *         //   any value: replace this node with the returned value
     *       }
     *     });
     *
     * Alternatively to providing enter() and leave() functions, a visitor can
     * instead provide functions named the same as the kinds of AST nodes, or
     * enter/leave visitors at a named key, leading to four permutations of
     * visitor API:
     *
     * 1) Named visitors triggered when entering a node a specific kind.
     *
     *     visit(ast, {
     *       Kind(node) {
     *         // enter the "Kind" node
     *       }
     *     })
     *
     * 2) Named visitors that trigger upon entering and leaving a node of
     *    a specific kind.
     *
     *     visit(ast, {
     *       Kind: {
     *         enter(node) {
     *           // enter the "Kind" node
     *         }
     *         leave(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     *
     * 3) Generic visitors that trigger upon entering and leaving any node.
     *
     *     visit(ast, {
     *       enter(node) {
     *         // enter any node
     *       },
     *       leave(node) {
     *         // leave any node
     *       }
     *     })
     *
     * 4) Parallel visitors for entering and leaving nodes of a specific kind.
     *
     *     visit(ast, {
     *       enter: {
     *         Kind(node) {
     *           // enter the "Kind" node
     *         }
     *       },
     *       leave: {
     *         Kind(node) {
     *           // leave the "Kind" node
     *         }
     *       }
     *     })
     */

    function visit(root, visitor) {
      var visitorKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QueryDocumentKeys;

      /* eslint-disable no-undef-init */
      var stack = undefined;
      var inArray = Array.isArray(root);
      var keys = [root];
      var index = -1;
      var edits = [];
      var node = undefined;
      var key = undefined;
      var parent = undefined;
      var path = [];
      var ancestors = [];
      var newRoot = root;
      /* eslint-enable no-undef-init */

      do {
        index++;
        var isLeaving = index === keys.length;
        var isEdited = isLeaving && edits.length !== 0;

        if (isLeaving) {
          key = ancestors.length === 0 ? undefined : path[path.length - 1];
          node = parent;
          parent = ancestors.pop();

          if (isEdited) {
            if (inArray) {
              node = node.slice();
            } else {
              var clone = {};

              for (var _i2 = 0, _Object$keys2 = Object.keys(node); _i2 < _Object$keys2.length; _i2++) {
                var k = _Object$keys2[_i2];
                clone[k] = node[k];
              }

              node = clone;
            }

            var editOffset = 0;

            for (var ii = 0; ii < edits.length; ii++) {
              var editKey = edits[ii][0];
              var editValue = edits[ii][1];

              if (inArray) {
                editKey -= editOffset;
              }

              if (inArray && editValue === null) {
                node.splice(editKey, 1);
                editOffset++;
              } else {
                node[editKey] = editValue;
              }
            }
          }

          index = stack.index;
          keys = stack.keys;
          edits = stack.edits;
          inArray = stack.inArray;
          stack = stack.prev;
        } else {
          key = parent ? inArray ? index : keys[index] : undefined;
          node = parent ? parent[key] : newRoot;

          if (node === null || node === undefined) {
            continue;
          }

          if (parent) {
            path.push(key);
          }
        }

        var result = void 0;

        if (!Array.isArray(node)) {
          if (!isNode(node)) {
            throw new Error('Invalid AST Node: ' + inspect(node));
          }

          var visitFn = getVisitFn(visitor, node.kind, isLeaving);

          if (visitFn) {
            result = visitFn.call(visitor, node, key, parent, path, ancestors);

            if (result === BREAK) {
              break;
            }

            if (result === false) {
              if (!isLeaving) {
                path.pop();
                continue;
              }
            } else if (result !== undefined) {
              edits.push([key, result]);

              if (!isLeaving) {
                if (isNode(result)) {
                  node = result;
                } else {
                  path.pop();
                  continue;
                }
              }
            }
          }
        }

        if (result === undefined && isEdited) {
          edits.push([key, node]);
        }

        if (isLeaving) {
          path.pop();
        } else {
          stack = {
            inArray: inArray,
            index: index,
            keys: keys,
            edits: edits,
            prev: stack
          };
          inArray = Array.isArray(node);
          keys = inArray ? node : visitorKeys[node.kind] || [];
          index = -1;
          edits = [];

          if (parent) {
            ancestors.push(parent);
          }

          parent = node;
        }
      } while (stack !== undefined);

      if (edits.length !== 0) {
        newRoot = edits[edits.length - 1][1];
      }

      return newRoot;
    }

    function isNode(maybeNode) {
      return Boolean(maybeNode && typeof maybeNode.kind === 'string');
    }
    /**
     * Given a visitor instance, if it is leaving or not, and a node kind, return
     * the function the visitor runtime should call.
     */

    function getVisitFn(visitor, kind, isLeaving) {
      var kindVisitor = visitor[kind];

      if (kindVisitor) {
        if (!isLeaving && typeof kindVisitor === 'function') {
          // { Kind() {} }
          return kindVisitor;
        }

        var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;

        if (typeof kindSpecificVisitor === 'function') {
          // { Kind: { enter() {}, leave() {} } }
          return kindSpecificVisitor;
        }
      } else {
        var specificVisitor = isLeaving ? visitor.leave : visitor.enter;

        if (specificVisitor) {
          if (typeof specificVisitor === 'function') {
            // { enter() {}, leave() {} }
            return specificVisitor;
          }

          var specificKindVisitor = specificVisitor[kind];

          if (typeof specificKindVisitor === 'function') {
            // { enter: { Kind() {} }, leave: { Kind() {} } }
            return specificKindVisitor;
          }
        }
      }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var genericMessage = "Invariant Violation";
    var _a = Object.setPrototypeOf, setPrototypeOf = _a === void 0 ? function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    } : _a;
    var InvariantError = /** @class */ (function (_super) {
        __extends(InvariantError, _super);
        function InvariantError(message) {
            if (message === void 0) { message = genericMessage; }
            var _this = _super.call(this, typeof message === "number"
                ? genericMessage + ": " + message + " (see https://github.com/apollographql/invariant-packages)"
                : message) || this;
            _this.framesToPop = 1;
            _this.name = genericMessage;
            setPrototypeOf(_this, InvariantError.prototype);
            return _this;
        }
        return InvariantError;
    }(Error));
    function invariant(condition, message) {
        if (!condition) {
            throw new InvariantError(message);
        }
    }
    function wrapConsoleMethod(method) {
        return function () {
            return console[method].apply(console, arguments);
        };
    }
    (function (invariant) {
        invariant.warn = wrapConsoleMethod("warn");
        invariant.error = wrapConsoleMethod("error");
    })(invariant || (invariant = {}));
    // Code that uses ts-invariant with rollup-plugin-invariant may want to
    // import this process stub to avoid errors evaluating process.env.NODE_ENV.
    // However, because most ESM-to-CJS compilers will rewrite the process import
    // as tsInvariant.process, which prevents proper replacement by minifiers, we
    // also attempt to define the stub globally when it is not already defined.
    var processStub = { env: {} };
    if (typeof process === "object") {
        processStub = process;
    }
    else
        try {
            // Using Function to evaluate this assignment in global scope also escapes
            // the strict mode of the current module, thereby allowing the assignment.
            // Inspired by https://github.com/facebook/regenerator/pull/369.
            Function("stub", "process = stub")(processStub);
        }
        catch (atLeastWeTried) {
            // The assignment can fail if a Content Security Policy heavy-handedly
            // forbids Function usage. In those environments, developers should take
            // extra care to replace process.env.NODE_ENV in their production builds,
            // or define an appropriate global.process polyfill.
        }
    //# sourceMappingURL=invariant.esm.js.map

    var fastJsonStableStringify = function (data, opts) {
        if (!opts) opts = {};
        if (typeof opts === 'function') opts = { cmp: opts };
        var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

        var cmp = opts.cmp && (function (f) {
            return function (node) {
                return function (a, b) {
                    var aobj = { key: a, value: node[a] };
                    var bobj = { key: b, value: node[b] };
                    return f(aobj, bobj);
                };
            };
        })(opts.cmp);

        var seen = [];
        return (function stringify (node) {
            if (node && node.toJSON && typeof node.toJSON === 'function') {
                node = node.toJSON();
            }

            if (node === undefined) return;
            if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
            if (typeof node !== 'object') return JSON.stringify(node);

            var i, out;
            if (Array.isArray(node)) {
                out = '[';
                for (i = 0; i < node.length; i++) {
                    if (i) out += ',';
                    out += stringify(node[i]) || 'null';
                }
                return out + ']';
            }

            if (node === null) return 'null';

            if (seen.indexOf(node) !== -1) {
                if (cycles) return JSON.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }

            var seenIndex = seen.push(node) - 1;
            var keys = Object.keys(node).sort(cmp && cmp(node));
            out = '';
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node[key]);

                if (!value) continue;
                if (out) out += ',';
                out += JSON.stringify(key) + ':' + value;
            }
            seen.splice(seenIndex, 1);
            return '{' + out + '}';
        })(data);
    };

    var _a$1 = Object.prototype, toString = _a$1.toString, hasOwnProperty = _a$1.hasOwnProperty;
    var previousComparisons = new Map();
    /**
     * Performs a deep equality check on two JavaScript values, tolerating cycles.
     */
    function equal(a, b) {
        try {
            return check(a, b);
        }
        finally {
            previousComparisons.clear();
        }
    }
    function check(a, b) {
        // If the two values are strictly equal, our job is easy.
        if (a === b) {
            return true;
        }
        // Object.prototype.toString returns a representation of the runtime type of
        // the given value that is considerably more precise than typeof.
        var aTag = toString.call(a);
        var bTag = toString.call(b);
        // If the runtime types of a and b are different, they could maybe be equal
        // under some interpretation of equality, but for simplicity and performance
        // we just return false instead.
        if (aTag !== bTag) {
            return false;
        }
        switch (aTag) {
            case '[object Array]':
                // Arrays are a lot like other objects, but we can cheaply compare their
                // lengths as a short-cut before comparing their elements.
                if (a.length !== b.length)
                    return false;
            // Fall through to object case...
            case '[object Object]': {
                if (previouslyCompared(a, b))
                    return true;
                var aKeys = Object.keys(a);
                var bKeys = Object.keys(b);
                // If `a` and `b` have a different number of enumerable keys, they
                // must be different.
                var keyCount = aKeys.length;
                if (keyCount !== bKeys.length)
                    return false;
                // Now make sure they have the same keys.
                for (var k = 0; k < keyCount; ++k) {
                    if (!hasOwnProperty.call(b, aKeys[k])) {
                        return false;
                    }
                }
                // Finally, check deep equality of all child properties.
                for (var k = 0; k < keyCount; ++k) {
                    var key = aKeys[k];
                    if (!check(a[key], b[key])) {
                        return false;
                    }
                }
                return true;
            }
            case '[object Error]':
                return a.name === b.name && a.message === b.message;
            case '[object Number]':
                // Handle NaN, which is !== itself.
                if (a !== a)
                    return b !== b;
            // Fall through to shared +a === +b case...
            case '[object Boolean]':
            case '[object Date]':
                return +a === +b;
            case '[object RegExp]':
            case '[object String]':
                return a == "" + b;
            case '[object Map]':
            case '[object Set]': {
                if (a.size !== b.size)
                    return false;
                if (previouslyCompared(a, b))
                    return true;
                var aIterator = a.entries();
                var isMap = aTag === '[object Map]';
                while (true) {
                    var info = aIterator.next();
                    if (info.done)
                        break;
                    // If a instanceof Set, aValue === aKey.
                    var _a = info.value, aKey = _a[0], aValue = _a[1];
                    // So this works the same way for both Set and Map.
                    if (!b.has(aKey)) {
                        return false;
                    }
                    // However, we care about deep equality of values only when dealing
                    // with Map structures.
                    if (isMap && !check(aValue, b.get(aKey))) {
                        return false;
                    }
                }
                return true;
            }
        }
        // Otherwise the values are not equal.
        return false;
    }
    function previouslyCompared(a, b) {
        // Though cyclic references can make an object graph appear infinite from the
        // perspective of a depth-first traversal, the graph still contains a finite
        // number of distinct object references. We use the previousComparisons cache
        // to avoid comparing the same pair of object references more than once, which
        // guarantees termination (even if we end up comparing every object in one
        // graph to every object in the other graph, which is extremely unlikely),
        // while still allowing weird isomorphic structures (like rings with different
        // lengths) a chance to pass the equality test.
        var bSet = previousComparisons.get(a);
        if (bSet) {
            // Return true here because we can be sure false will be returned somewhere
            // else if the objects are not equivalent.
            if (bSet.has(b))
                return true;
        }
        else {
            previousComparisons.set(a, bSet = new Set);
        }
        bSet.add(b);
        return false;
    }
    //# sourceMappingURL=equality.esm.js.map

    function isStringValue(value) {
        return value.kind === 'StringValue';
    }
    function isBooleanValue(value) {
        return value.kind === 'BooleanValue';
    }
    function isIntValue(value) {
        return value.kind === 'IntValue';
    }
    function isFloatValue(value) {
        return value.kind === 'FloatValue';
    }
    function isVariable(value) {
        return value.kind === 'Variable';
    }
    function isObjectValue(value) {
        return value.kind === 'ObjectValue';
    }
    function isListValue(value) {
        return value.kind === 'ListValue';
    }
    function isEnumValue(value) {
        return value.kind === 'EnumValue';
    }
    function isNullValue(value) {
        return value.kind === 'NullValue';
    }
    function valueToObjectRepresentation(argObj, name, value, variables) {
        if (isIntValue(value) || isFloatValue(value)) {
            argObj[name.value] = Number(value.value);
        }
        else if (isBooleanValue(value) || isStringValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isObjectValue(value)) {
            var nestedArgObj_1 = {};
            value.fields.map(function (obj) {
                return valueToObjectRepresentation(nestedArgObj_1, obj.name, obj.value, variables);
            });
            argObj[name.value] = nestedArgObj_1;
        }
        else if (isVariable(value)) {
            var variableValue = (variables || {})[value.name.value];
            argObj[name.value] = variableValue;
        }
        else if (isListValue(value)) {
            argObj[name.value] = value.values.map(function (listValue) {
                var nestedArgArrayObj = {};
                valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables);
                return nestedArgArrayObj[name.value];
            });
        }
        else if (isEnumValue(value)) {
            argObj[name.value] = value.value;
        }
        else if (isNullValue(value)) {
            argObj[name.value] = null;
        }
        else {
            throw process.env.NODE_ENV === "production" ? new InvariantError(17) : new InvariantError("The inline argument \"" + name.value + "\" of kind \"" + value.kind + "\"" +
                'is not supported. Use variables instead of inline arguments to ' +
                'overcome this limitation.');
        }
    }
    function storeKeyNameFromField(field, variables) {
        var directivesObj = null;
        if (field.directives) {
            directivesObj = {};
            field.directives.forEach(function (directive) {
                directivesObj[directive.name.value] = {};
                if (directive.arguments) {
                    directive.arguments.forEach(function (_a) {
                        var name = _a.name, value = _a.value;
                        return valueToObjectRepresentation(directivesObj[directive.name.value], name, value, variables);
                    });
                }
            });
        }
        var argObj = null;
        if (field.arguments && field.arguments.length) {
            argObj = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj, name, value, variables);
            });
        }
        return getStoreKeyName(field.name.value, argObj, directivesObj);
    }
    var KNOWN_DIRECTIVES = [
        'connection',
        'include',
        'skip',
        'client',
        'rest',
        'export',
    ];
    function getStoreKeyName(fieldName, args, directives) {
        if (directives &&
            directives['connection'] &&
            directives['connection']['key']) {
            if (directives['connection']['filter'] &&
                directives['connection']['filter'].length > 0) {
                var filterKeys = directives['connection']['filter']
                    ? directives['connection']['filter']
                    : [];
                filterKeys.sort();
                var queryArgs_1 = args;
                var filteredArgs_1 = {};
                filterKeys.forEach(function (key) {
                    filteredArgs_1[key] = queryArgs_1[key];
                });
                return directives['connection']['key'] + "(" + JSON.stringify(filteredArgs_1) + ")";
            }
            else {
                return directives['connection']['key'];
            }
        }
        var completeFieldName = fieldName;
        if (args) {
            var stringifiedArgs = fastJsonStableStringify(args);
            completeFieldName += "(" + stringifiedArgs + ")";
        }
        if (directives) {
            Object.keys(directives).forEach(function (key) {
                if (KNOWN_DIRECTIVES.indexOf(key) !== -1)
                    return;
                if (directives[key] && Object.keys(directives[key]).length) {
                    completeFieldName += "@" + key + "(" + JSON.stringify(directives[key]) + ")";
                }
                else {
                    completeFieldName += "@" + key;
                }
            });
        }
        return completeFieldName;
    }
    function argumentsObjectFromField(field, variables) {
        if (field.arguments && field.arguments.length) {
            var argObj_1 = {};
            field.arguments.forEach(function (_a) {
                var name = _a.name, value = _a.value;
                return valueToObjectRepresentation(argObj_1, name, value, variables);
            });
            return argObj_1;
        }
        return null;
    }
    function resultKeyNameFromField(field) {
        return field.alias ? field.alias.value : field.name.value;
    }
    function isField(selection) {
        return selection.kind === 'Field';
    }
    function isInlineFragment(selection) {
        return selection.kind === 'InlineFragment';
    }
    function isIdValue(idObject) {
        return idObject &&
            idObject.type === 'id' &&
            typeof idObject.generated === 'boolean';
    }
    function toIdValue(idConfig, generated) {
        if (generated === void 0) { generated = false; }
        return __assign({ type: 'id', generated: generated }, (typeof idConfig === 'string'
            ? { id: idConfig, typename: undefined }
            : idConfig));
    }
    function isJsonValue(jsonObject) {
        return (jsonObject != null &&
            typeof jsonObject === 'object' &&
            jsonObject.type === 'json');
    }

    function getDirectiveInfoFromField(field, variables) {
        if (field.directives && field.directives.length) {
            var directiveObj_1 = {};
            field.directives.forEach(function (directive) {
                directiveObj_1[directive.name.value] = argumentsObjectFromField(directive, variables);
            });
            return directiveObj_1;
        }
        return null;
    }
    function shouldInclude(selection, variables) {
        if (variables === void 0) { variables = {}; }
        return getInclusionDirectives(selection.directives).every(function (_a) {
            var directive = _a.directive, ifArgument = _a.ifArgument;
            var evaledValue = false;
            if (ifArgument.value.kind === 'Variable') {
                evaledValue = variables[ifArgument.value.name.value];
                process.env.NODE_ENV === "production" ? invariant(evaledValue !== void 0, 1) : invariant(evaledValue !== void 0, "Invalid variable referenced in @" + directive.name.value + " directive.");
            }
            else {
                evaledValue = ifArgument.value.value;
            }
            return directive.name.value === 'skip' ? !evaledValue : evaledValue;
        });
    }
    function getDirectiveNames(doc) {
        var names = [];
        visit(doc, {
            Directive: function (node) {
                names.push(node.name.value);
            },
        });
        return names;
    }
    function hasDirectives(names, doc) {
        return getDirectiveNames(doc).some(function (name) { return names.indexOf(name) > -1; });
    }
    function hasClientExports(document) {
        return (document &&
            hasDirectives(['client'], document) &&
            hasDirectives(['export'], document));
    }
    function isInclusionDirective(_a) {
        var value = _a.name.value;
        return value === 'skip' || value === 'include';
    }
    function getInclusionDirectives(directives) {
        return directives ? directives.filter(isInclusionDirective).map(function (directive) {
            var directiveArguments = directive.arguments;
            var directiveName = directive.name.value;
            process.env.NODE_ENV === "production" ? invariant(directiveArguments && directiveArguments.length === 1, 2) : invariant(directiveArguments && directiveArguments.length === 1, "Incorrect number of arguments for the @" + directiveName + " directive.");
            var ifArgument = directiveArguments[0];
            process.env.NODE_ENV === "production" ? invariant(ifArgument.name && ifArgument.name.value === 'if', 3) : invariant(ifArgument.name && ifArgument.name.value === 'if', "Invalid argument for the @" + directiveName + " directive.");
            var ifValue = ifArgument.value;
            process.env.NODE_ENV === "production" ? invariant(ifValue &&
                (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), 4) : invariant(ifValue &&
                (ifValue.kind === 'Variable' || ifValue.kind === 'BooleanValue'), "Argument for the @" + directiveName + " directive must be a variable or a boolean value.");
            return { directive: directive, ifArgument: ifArgument };
        }) : [];
    }

    function getFragmentQueryDocument(document, fragmentName) {
        var actualFragmentName = fragmentName;
        var fragments = [];
        document.definitions.forEach(function (definition) {
            if (definition.kind === 'OperationDefinition') {
                throw process.env.NODE_ENV === "production" ? new InvariantError(5) : new InvariantError("Found a " + definition.operation + " operation" + (definition.name ? " named '" + definition.name.value + "'" : '') + ". " +
                    'No operations are allowed when using a fragment as a query. Only fragments are allowed.');
            }
            if (definition.kind === 'FragmentDefinition') {
                fragments.push(definition);
            }
        });
        if (typeof actualFragmentName === 'undefined') {
            process.env.NODE_ENV === "production" ? invariant(fragments.length === 1, 6) : invariant(fragments.length === 1, "Found " + fragments.length + " fragments. `fragmentName` must be provided when there is not exactly 1 fragment.");
            actualFragmentName = fragments[0].name.value;
        }
        var query = __assign(__assign({}, document), { definitions: __spreadArrays([
                {
                    kind: 'OperationDefinition',
                    operation: 'query',
                    selectionSet: {
                        kind: 'SelectionSet',
                        selections: [
                            {
                                kind: 'FragmentSpread',
                                name: {
                                    kind: 'Name',
                                    value: actualFragmentName,
                                },
                            },
                        ],
                    },
                }
            ], document.definitions) });
        return query;
    }

    function assign(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        sources.forEach(function (source) {
            if (typeof source === 'undefined' || source === null) {
                return;
            }
            Object.keys(source).forEach(function (key) {
                target[key] = source[key];
            });
        });
        return target;
    }
    function checkDocument(doc) {
        process.env.NODE_ENV === "production" ? invariant(doc && doc.kind === 'Document', 8) : invariant(doc && doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        var operations = doc.definitions
            .filter(function (d) { return d.kind !== 'FragmentDefinition'; })
            .map(function (definition) {
            if (definition.kind !== 'OperationDefinition') {
                throw process.env.NODE_ENV === "production" ? new InvariantError(9) : new InvariantError("Schema type definitions not allowed in queries. Found: \"" + definition.kind + "\"");
            }
            return definition;
        });
        process.env.NODE_ENV === "production" ? invariant(operations.length <= 1, 10) : invariant(operations.length <= 1, "Ambiguous GraphQL document: contains " + operations.length + " operations");
        return doc;
    }
    function getOperationDefinition(doc) {
        checkDocument(doc);
        return doc.definitions.filter(function (definition) { return definition.kind === 'OperationDefinition'; })[0];
    }
    function getOperationName(doc) {
        return (doc.definitions
            .filter(function (definition) {
            return definition.kind === 'OperationDefinition' && definition.name;
        })
            .map(function (x) { return x.name.value; })[0] || null);
    }
    function getFragmentDefinitions(doc) {
        return doc.definitions.filter(function (definition) { return definition.kind === 'FragmentDefinition'; });
    }
    function getQueryDefinition(doc) {
        var queryDef = getOperationDefinition(doc);
        process.env.NODE_ENV === "production" ? invariant(queryDef && queryDef.operation === 'query', 12) : invariant(queryDef && queryDef.operation === 'query', 'Must contain a query definition.');
        return queryDef;
    }
    function getFragmentDefinition(doc) {
        process.env.NODE_ENV === "production" ? invariant(doc.kind === 'Document', 13) : invariant(doc.kind === 'Document', "Expecting a parsed GraphQL document. Perhaps you need to wrap the query string in a \"gql\" tag? http://docs.apollostack.com/apollo-client/core.html#gql");
        process.env.NODE_ENV === "production" ? invariant(doc.definitions.length <= 1, 14) : invariant(doc.definitions.length <= 1, 'Fragment must have exactly one definition.');
        var fragmentDef = doc.definitions[0];
        process.env.NODE_ENV === "production" ? invariant(fragmentDef.kind === 'FragmentDefinition', 15) : invariant(fragmentDef.kind === 'FragmentDefinition', 'Must be a fragment definition.');
        return fragmentDef;
    }
    function getMainDefinition(queryDoc) {
        checkDocument(queryDoc);
        var fragmentDefinition;
        for (var _i = 0, _a = queryDoc.definitions; _i < _a.length; _i++) {
            var definition = _a[_i];
            if (definition.kind === 'OperationDefinition') {
                var operation = definition.operation;
                if (operation === 'query' ||
                    operation === 'mutation' ||
                    operation === 'subscription') {
                    return definition;
                }
            }
            if (definition.kind === 'FragmentDefinition' && !fragmentDefinition) {
                fragmentDefinition = definition;
            }
        }
        if (fragmentDefinition) {
            return fragmentDefinition;
        }
        throw process.env.NODE_ENV === "production" ? new InvariantError(16) : new InvariantError('Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.');
    }
    function createFragmentMap(fragments) {
        if (fragments === void 0) { fragments = []; }
        var symTable = {};
        fragments.forEach(function (fragment) {
            symTable[fragment.name.value] = fragment;
        });
        return symTable;
    }
    function getDefaultValues(definition) {
        if (definition &&
            definition.variableDefinitions &&
            definition.variableDefinitions.length) {
            var defaultValues = definition.variableDefinitions
                .filter(function (_a) {
                var defaultValue = _a.defaultValue;
                return defaultValue;
            })
                .map(function (_a) {
                var variable = _a.variable, defaultValue = _a.defaultValue;
                var defaultValueObj = {};
                valueToObjectRepresentation(defaultValueObj, variable.name, defaultValue);
                return defaultValueObj;
            });
            return assign.apply(void 0, __spreadArrays([{}], defaultValues));
        }
        return {};
    }

    function filterInPlace(array, test, context) {
        var target = 0;
        array.forEach(function (elem, i) {
            if (test.call(this, elem, i, array)) {
                array[target++] = elem;
            }
        }, context);
        array.length = target;
        return array;
    }

    var TYPENAME_FIELD = {
        kind: 'Field',
        name: {
            kind: 'Name',
            value: '__typename',
        },
    };
    function isEmpty(op, fragments) {
        return op.selectionSet.selections.every(function (selection) {
            return selection.kind === 'FragmentSpread' &&
                isEmpty(fragments[selection.name.value], fragments);
        });
    }
    function nullIfDocIsEmpty(doc) {
        return isEmpty(getOperationDefinition(doc) || getFragmentDefinition(doc), createFragmentMap(getFragmentDefinitions(doc)))
            ? null
            : doc;
    }
    function getDirectiveMatcher(directives) {
        return function directiveMatcher(directive) {
            return directives.some(function (dir) {
                return (dir.name && dir.name === directive.name.value) ||
                    (dir.test && dir.test(directive));
            });
        };
    }
    function removeDirectivesFromDocument(directives, doc) {
        var variablesInUse = Object.create(null);
        var variablesToRemove = [];
        var fragmentSpreadsInUse = Object.create(null);
        var fragmentSpreadsToRemove = [];
        var modifiedDoc = nullIfDocIsEmpty(visit(doc, {
            Variable: {
                enter: function (node, _key, parent) {
                    if (parent.kind !== 'VariableDefinition') {
                        variablesInUse[node.name.value] = true;
                    }
                },
            },
            Field: {
                enter: function (node) {
                    if (directives && node.directives) {
                        var shouldRemoveField = directives.some(function (directive) { return directive.remove; });
                        if (shouldRemoveField &&
                            node.directives &&
                            node.directives.some(getDirectiveMatcher(directives))) {
                            if (node.arguments) {
                                node.arguments.forEach(function (arg) {
                                    if (arg.value.kind === 'Variable') {
                                        variablesToRemove.push({
                                            name: arg.value.name.value,
                                        });
                                    }
                                });
                            }
                            if (node.selectionSet) {
                                getAllFragmentSpreadsFromSelectionSet(node.selectionSet).forEach(function (frag) {
                                    fragmentSpreadsToRemove.push({
                                        name: frag.name.value,
                                    });
                                });
                            }
                            return null;
                        }
                    }
                },
            },
            FragmentSpread: {
                enter: function (node) {
                    fragmentSpreadsInUse[node.name.value] = true;
                },
            },
            Directive: {
                enter: function (node) {
                    if (getDirectiveMatcher(directives)(node)) {
                        return null;
                    }
                },
            },
        }));
        if (modifiedDoc &&
            filterInPlace(variablesToRemove, function (v) { return !variablesInUse[v.name]; }).length) {
            modifiedDoc = removeArgumentsFromDocument(variablesToRemove, modifiedDoc);
        }
        if (modifiedDoc &&
            filterInPlace(fragmentSpreadsToRemove, function (fs) { return !fragmentSpreadsInUse[fs.name]; })
                .length) {
            modifiedDoc = removeFragmentSpreadFromDocument(fragmentSpreadsToRemove, modifiedDoc);
        }
        return modifiedDoc;
    }
    function addTypenameToDocument(doc) {
        return visit(checkDocument(doc), {
            SelectionSet: {
                enter: function (node, _key, parent) {
                    if (parent &&
                        parent.kind === 'OperationDefinition') {
                        return;
                    }
                    var selections = node.selections;
                    if (!selections) {
                        return;
                    }
                    var skip = selections.some(function (selection) {
                        return (isField(selection) &&
                            (selection.name.value === '__typename' ||
                                selection.name.value.lastIndexOf('__', 0) === 0));
                    });
                    if (skip) {
                        return;
                    }
                    var field = parent;
                    if (isField(field) &&
                        field.directives &&
                        field.directives.some(function (d) { return d.name.value === 'export'; })) {
                        return;
                    }
                    return __assign(__assign({}, node), { selections: __spreadArrays(selections, [TYPENAME_FIELD]) });
                },
            },
        });
    }
    var connectionRemoveConfig = {
        test: function (directive) {
            var willRemove = directive.name.value === 'connection';
            if (willRemove) {
                if (!directive.arguments ||
                    !directive.arguments.some(function (arg) { return arg.name.value === 'key'; })) {
                    process.env.NODE_ENV === "production" || invariant.warn('Removing an @connection directive even though it does not have a key. ' +
                        'You may want to use the key parameter to specify a store key.');
                }
            }
            return willRemove;
        },
    };
    function removeConnectionDirectiveFromDocument(doc) {
        return removeDirectivesFromDocument([connectionRemoveConfig], checkDocument(doc));
    }
    function getArgumentMatcher(config) {
        return function argumentMatcher(argument) {
            return config.some(function (aConfig) {
                return argument.value &&
                    argument.value.kind === 'Variable' &&
                    argument.value.name &&
                    (aConfig.name === argument.value.name.value ||
                        (aConfig.test && aConfig.test(argument)));
            });
        };
    }
    function removeArgumentsFromDocument(config, doc) {
        var argMatcher = getArgumentMatcher(config);
        return nullIfDocIsEmpty(visit(doc, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign(__assign({}, node), { variableDefinitions: node.variableDefinitions.filter(function (varDef) {
                            return !config.some(function (arg) { return arg.name === varDef.variable.name.value; });
                        }) });
                },
            },
            Field: {
                enter: function (node) {
                    var shouldRemoveField = config.some(function (argConfig) { return argConfig.remove; });
                    if (shouldRemoveField) {
                        var argMatchCount_1 = 0;
                        node.arguments.forEach(function (arg) {
                            if (argMatcher(arg)) {
                                argMatchCount_1 += 1;
                            }
                        });
                        if (argMatchCount_1 === 1) {
                            return null;
                        }
                    }
                },
            },
            Argument: {
                enter: function (node) {
                    if (argMatcher(node)) {
                        return null;
                    }
                },
            },
        }));
    }
    function removeFragmentSpreadFromDocument(config, doc) {
        function enter(node) {
            if (config.some(function (def) { return def.name === node.name.value; })) {
                return null;
            }
        }
        return nullIfDocIsEmpty(visit(doc, {
            FragmentSpread: { enter: enter },
            FragmentDefinition: { enter: enter },
        }));
    }
    function getAllFragmentSpreadsFromSelectionSet(selectionSet) {
        var allFragments = [];
        selectionSet.selections.forEach(function (selection) {
            if ((isField(selection) || isInlineFragment(selection)) &&
                selection.selectionSet) {
                getAllFragmentSpreadsFromSelectionSet(selection.selectionSet).forEach(function (frag) { return allFragments.push(frag); });
            }
            else if (selection.kind === 'FragmentSpread') {
                allFragments.push(selection);
            }
        });
        return allFragments;
    }
    function buildQueryFromSelectionSet(document) {
        var definition = getMainDefinition(document);
        var definitionOperation = definition.operation;
        if (definitionOperation === 'query') {
            return document;
        }
        var modifiedDoc = visit(document, {
            OperationDefinition: {
                enter: function (node) {
                    return __assign(__assign({}, node), { operation: 'query' });
                },
            },
        });
        return modifiedDoc;
    }
    function removeClientSetsFromDocument(document) {
        checkDocument(document);
        var modifiedDoc = removeDirectivesFromDocument([
            {
                test: function (directive) { return directive.name.value === 'client'; },
                remove: true,
            },
        ], document);
        if (modifiedDoc) {
            modifiedDoc = visit(modifiedDoc, {
                FragmentDefinition: {
                    enter: function (node) {
                        if (node.selectionSet) {
                            var isTypenameOnly = node.selectionSet.selections.every(function (selection) {
                                return isField(selection) && selection.name.value === '__typename';
                            });
                            if (isTypenameOnly) {
                                return null;
                            }
                        }
                    },
                },
            });
        }
        return modifiedDoc;
    }

    var canUseWeakMap = typeof WeakMap === 'function' && !(typeof navigator === 'object' &&
        navigator.product === 'ReactNative');

    var toString$1 = Object.prototype.toString;
    function cloneDeep(value) {
        return cloneDeepHelper(value, new Map());
    }
    function cloneDeepHelper(val, seen) {
        switch (toString$1.call(val)) {
            case "[object Array]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_1 = val.slice(0);
                seen.set(val, copy_1);
                copy_1.forEach(function (child, i) {
                    copy_1[i] = cloneDeepHelper(child, seen);
                });
                return copy_1;
            }
            case "[object Object]": {
                if (seen.has(val))
                    return seen.get(val);
                var copy_2 = Object.create(Object.getPrototypeOf(val));
                seen.set(val, copy_2);
                Object.keys(val).forEach(function (key) {
                    copy_2[key] = cloneDeepHelper(val[key], seen);
                });
                return copy_2;
            }
            default:
                return val;
        }
    }

    function getEnv() {
        if (typeof process !== 'undefined' && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }
        return 'development';
    }
    function isEnv(env) {
        return getEnv() === env;
    }
    function isProduction() {
        return isEnv('production') === true;
    }
    function isDevelopment() {
        return isEnv('development') === true;
    }
    function isTest() {
        return isEnv('test') === true;
    }

    function tryFunctionOrLogError(f) {
        try {
            return f();
        }
        catch (e) {
            if (console.error) {
                console.error(e);
            }
        }
    }
    function graphQLResultHasError(result) {
        return result.errors && result.errors.length;
    }

    function deepFreeze(o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach(function (prop) {
            if (o[prop] !== null &&
                (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
                !Object.isFrozen(o[prop])) {
                deepFreeze(o[prop]);
            }
        });
        return o;
    }
    function maybeDeepFreeze(obj) {
        if (isDevelopment() || isTest()) {
            var symbolIsPolyfilled = typeof Symbol === 'function' && typeof Symbol('') === 'string';
            if (!symbolIsPolyfilled) {
                return deepFreeze(obj);
            }
        }
        return obj;
    }

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    function mergeDeep() {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        return mergeDeepArray(sources);
    }
    function mergeDeepArray(sources) {
        var target = sources[0] || {};
        var count = sources.length;
        if (count > 1) {
            var pastCopies = [];
            target = shallowCopyForMerge(target, pastCopies);
            for (var i = 1; i < count; ++i) {
                target = mergeHelper(target, sources[i], pastCopies);
            }
        }
        return target;
    }
    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }
    function mergeHelper(target, source, pastCopies) {
        if (isObject(source) && isObject(target)) {
            if (Object.isExtensible && !Object.isExtensible(target)) {
                target = shallowCopyForMerge(target, pastCopies);
            }
            Object.keys(source).forEach(function (sourceKey) {
                var sourceValue = source[sourceKey];
                if (hasOwnProperty$1.call(target, sourceKey)) {
                    var targetValue = target[sourceKey];
                    if (sourceValue !== targetValue) {
                        target[sourceKey] = mergeHelper(shallowCopyForMerge(targetValue, pastCopies), sourceValue, pastCopies);
                    }
                }
                else {
                    target[sourceKey] = sourceValue;
                }
            });
            return target;
        }
        return source;
    }
    function shallowCopyForMerge(value, pastCopies) {
        if (value !== null &&
            typeof value === 'object' &&
            pastCopies.indexOf(value) < 0) {
            if (Array.isArray(value)) {
                value = value.slice(0);
            }
            else {
                value = __assign({ __proto__: Object.getPrototypeOf(value) }, value);
            }
            pastCopies.push(value);
        }
        return value;
    }
    //# sourceMappingURL=bundle.esm.js.map

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var OBSERVABLE;
    function isObservable(value) {
        // Lazy-load Symbol to give polyfills a chance to run
        if (!OBSERVABLE) {
            OBSERVABLE =
                (typeof Symbol === 'function' && Symbol.observable) || '@@observable';
        }
        return value && value[OBSERVABLE] && value[OBSERVABLE]() === value;
    }
    function deferred(set, initial) {
        var initialized = initial !== undefined;
        var resolve;
        var reject;
        // Set initial value
        set(initialized
            ? initial
            : new Promise(function (_resolve, _reject) {
                resolve = _resolve;
                reject = _reject;
            }));
        return {
            fulfill: function (value) {
                if (initialized)
                    return set(Promise.resolve(value));
                initialized = true;
                resolve(value);
            },
            reject: function (error) {
                if (initialized)
                    return set(Promise.reject(error));
                initialized = true;
                reject(error);
            }
        };
    }

    var noop$1 = function () { };
    function observe(observable, initial) {
        if (!isObservable(observable)) {
            return readable(observable, noop$1);
        }
        return readable(undefined, function (set) {
            var _a = deferred(set, initial), fulfill = _a.fulfill, reject = _a.reject;
            var subscription = observable.subscribe({
                next: function (value) {
                    fulfill(value);
                },
                error: function (err) {
                    reject(err);
                }
            });
            return function () { return subscription.unsubscribe(); };
        });
    }
    //# sourceMappingURL=svelte-observable.es.js.map

    var CLIENT = typeof Symbol !== 'undefined' ? Symbol('client') : '@@client';
    function getClient() {
        return getContext(CLIENT);
    }
    function setClient(client) {
        setContext(CLIENT, client);
    }

    var restoring = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();

    function query(client, options) {
        var subscribed = false;
        var initial_value;
        // If client is restoring (e.g. from SSR)
        // attempt synchronous readQuery first (to prevent loading in {#await})
        if (restoring.has(client)) {
            try {
                // undefined = skip initial value (not in cache)
                initial_value = client.readQuery(options) || undefined;
                initial_value = { data: initial_value };
            }
            catch (err) {
                // Ignore preload errors
            }
        }
        // Create query and observe,
        // but don't subscribe directly to avoid firing duplicate value if initialized
        var observable_query = client.watchQuery(options);
        var subscribe_to_query = observe(observable_query, initial_value).subscribe;
        // Wrap the query subscription with a readable to prevent duplicate values
        var subscribe = readable(initial_value, function (set) {
            subscribed = true;
            var skip_duplicate = initial_value !== undefined;
            var initialized = false;
            var skipped = false;
            var unsubscribe = subscribe_to_query(function (value) {
                if (skip_duplicate && initialized && !skipped) {
                    skipped = true;
                }
                else {
                    if (!initialized)
                        initialized = true;
                    set(value);
                }
            });
            return unsubscribe;
        }).subscribe;
        return {
            subscribe: subscribe,
            refetch: function (variables) {
                // If variables have not changed and not subscribed, skip refetch
                if (!subscribed && equal(variables, observable_query.variables))
                    return observable_query.result();
                return observable_query.refetch(variables);
            },
            result: function () { return observable_query.result(); },
            fetchMore: function (options) { return observable_query.fetchMore(options); },
            setOptions: function (options) { return observable_query.setOptions(options); },
            updateQuery: function (map) { return observable_query.updateQuery(map); },
            startPolling: function (interval) { return observable_query.startPolling(interval); },
            stopPolling: function () { return observable_query.stopPolling(); },
            subscribeToMore: function (options) { return observable_query.subscribeToMore(options); }
        };
    }

    function mutate(client, options) {
        return client.mutate(options);
    }
    //# sourceMappingURL=svelte-apollo.es.js.map

    let folderFocus = writable('/home/brian/Pictures');
    let fileFocus = writable('/home/brian/Pictures/index.jpeg');
    let searchArray = writable(['ape']);
    let searchMode = writable(false);
    let searchString = writable('');

    function devAssert(condition, message) {
      var booleanCondition = Boolean(condition);

      if (!booleanCondition) {
        throw new Error(message);
      }
    }

    /**
     * The `defineToJSON()` function defines toJSON() and inspect() prototype
     * methods, if no function provided they become aliases for toString().
     */

    function defineToJSON(classObject) {
      var fn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : classObject.prototype.toString;
      classObject.prototype.toJSON = fn;
      classObject.prototype.inspect = fn;

      if (nodejsCustomInspectSymbol) {
        classObject.prototype[nodejsCustomInspectSymbol] = fn;
      }
    }

    function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }

    /**
     * Return true if `value` is object-like. A value is object-like if it's not
     * `null` and has a `typeof` result of "object".
     */
    function isObjectLike(value) {
      return _typeof$1(value) == 'object' && value !== null;
    }

    /**
     * Represents a location in a Source.
     */

    /**
     * Takes a Source and a UTF-8 character offset, and returns the corresponding
     * line and column as a SourceLocation.
     */
    function getLocation(source, position) {
      var lineRegexp = /\r\n|[\n\r]/g;
      var line = 1;
      var column = position + 1;
      var match;

      while ((match = lineRegexp.exec(source.body)) && match.index < position) {
        line += 1;
        column = position + 1 - (match.index + match[0].length);
      }

      return {
        line: line,
        column: column
      };
    }

    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printLocation(location) {
      return printSourceLocation(location.source, getLocation(location.source, location.start));
    }
    /**
     * Render a helpful description of the location in the GraphQL Source document.
     */

    function printSourceLocation(source, sourceLocation) {
      var firstLineColumnOffset = source.locationOffset.column - 1;
      var body = whitespace(firstLineColumnOffset) + source.body;
      var lineIndex = sourceLocation.line - 1;
      var lineOffset = source.locationOffset.line - 1;
      var lineNum = sourceLocation.line + lineOffset;
      var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
      var columnNum = sourceLocation.column + columnOffset;
      var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
      var lines = body.split(/\r\n|[\n\r]/g);
      var locationLine = lines[lineIndex]; // Special case for minified documents

      if (locationLine.length > 120) {
        var sublineIndex = Math.floor(columnNum / 80);
        var sublineColumnNum = columnNum % 80;
        var sublines = [];

        for (var i = 0; i < locationLine.length; i += 80) {
          sublines.push(locationLine.slice(i, i + 80));
        }

        return locationStr + printPrefixedLines([["".concat(lineNum), sublines[0]]].concat(sublines.slice(1, sublineIndex + 1).map(function (subline) {
          return ['', subline];
        }), [[' ', whitespace(sublineColumnNum - 1) + '^'], ['', sublines[sublineIndex + 1]]]));
      }

      return locationStr + printPrefixedLines([// Lines specified like this: ["prefix", "string"],
      ["".concat(lineNum - 1), lines[lineIndex - 1]], ["".concat(lineNum), locationLine], ['', whitespace(columnNum - 1) + '^'], ["".concat(lineNum + 1), lines[lineIndex + 1]]]);
    }

    function printPrefixedLines(lines) {
      var existingLines = lines.filter(function (_ref) {
        var _ = _ref[0],
            line = _ref[1];
        return line !== undefined;
      });
      var padLen = Math.max.apply(Math, existingLines.map(function (_ref2) {
        var prefix = _ref2[0];
        return prefix.length;
      }));
      return existingLines.map(function (_ref3) {
        var prefix = _ref3[0],
            line = _ref3[1];
        return lpad(padLen, prefix) + (line ? ' | ' + line : ' |');
      }).join('\n');
    }

    function whitespace(len) {
      return Array(len + 1).join(' ');
    }

    function lpad(len, str) {
      return whitespace(len - str.length) + str;
    }

    /**
     * A GraphQLError describes an Error found during the parse, validate, or
     * execute phases of performing a GraphQL operation. In addition to a message
     * and stack trace, it also includes information about the locations in a
     * GraphQL document and/or execution result that correspond to the Error.
     */

    function GraphQLError( // eslint-disable-line no-redeclare
    message, nodes, source, positions, path, originalError, extensions) {
      // Compute list of blame nodes.
      var _nodes = Array.isArray(nodes) ? nodes.length !== 0 ? nodes : undefined : nodes ? [nodes] : undefined; // Compute locations in the source for the given nodes/positions.


      var _source = source;

      if (!_source && _nodes) {
        var node = _nodes[0];
        _source = node && node.loc && node.loc.source;
      }

      var _positions = positions;

      if (!_positions && _nodes) {
        _positions = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(node.loc.start);
          }

          return list;
        }, []);
      }

      if (_positions && _positions.length === 0) {
        _positions = undefined;
      }

      var _locations;

      if (positions && source) {
        _locations = positions.map(function (pos) {
          return getLocation(source, pos);
        });
      } else if (_nodes) {
        _locations = _nodes.reduce(function (list, node) {
          if (node.loc) {
            list.push(getLocation(node.loc.source, node.loc.start));
          }

          return list;
        }, []);
      }

      var _extensions = extensions;

      if (_extensions == null && originalError != null) {
        var originalExtensions = originalError.extensions;

        if (isObjectLike(originalExtensions)) {
          _extensions = originalExtensions;
        }
      }

      Object.defineProperties(this, {
        message: {
          value: message,
          // By being enumerable, JSON.stringify will include `message` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: true,
          writable: true
        },
        locations: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _locations || undefined,
          // By being enumerable, JSON.stringify will include `locations` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_locations)
        },
        path: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: path || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(path)
        },
        nodes: {
          value: _nodes || undefined
        },
        source: {
          value: _source || undefined
        },
        positions: {
          value: _positions || undefined
        },
        originalError: {
          value: originalError
        },
        extensions: {
          // Coercing falsey values to undefined ensures they will not be included
          // in JSON.stringify() when not provided.
          value: _extensions || undefined,
          // By being enumerable, JSON.stringify will include `path` in the
          // resulting output. This ensures that the simplest possible GraphQL
          // service adheres to the spec.
          enumerable: Boolean(_extensions)
        }
      }); // Include (non-enumerable) stack trace.

      if (originalError && originalError.stack) {
        Object.defineProperty(this, 'stack', {
          value: originalError.stack,
          writable: true,
          configurable: true
        });
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, GraphQLError);
      } else {
        Object.defineProperty(this, 'stack', {
          value: Error().stack,
          writable: true,
          configurable: true
        });
      }
    }
    GraphQLError.prototype = Object.create(Error.prototype, {
      constructor: {
        value: GraphQLError
      },
      name: {
        value: 'GraphQLError'
      },
      toString: {
        value: function toString() {
          return printError(this);
        }
      }
    });
    /**
     * Prints a GraphQLError to a string, representing useful location information
     * about the error's position in the source.
     */

    function printError(error) {
      var output = error.message;

      if (error.nodes) {
        for (var _i2 = 0, _error$nodes2 = error.nodes; _i2 < _error$nodes2.length; _i2++) {
          var node = _error$nodes2[_i2];

          if (node.loc) {
            output += '\n\n' + printLocation(node.loc);
          }
        }
      } else if (error.source && error.locations) {
        for (var _i4 = 0, _error$locations2 = error.locations; _i4 < _error$locations2.length; _i4++) {
          var location = _error$locations2[_i4];
          output += '\n\n' + printSourceLocation(error.source, location);
        }
      }

      return output;
    }

    /**
     * Produces a GraphQLError representing a syntax error, containing useful
     * descriptive information about the syntax error's position in the source.
     */

    function syntaxError(source, position, description) {
      return new GraphQLError("Syntax Error: ".concat(description), undefined, source, [position]);
    }

    /**
     * The set of allowed kind values for AST nodes.
     */
    var Kind = Object.freeze({
      // Name
      NAME: 'Name',
      // Document
      DOCUMENT: 'Document',
      OPERATION_DEFINITION: 'OperationDefinition',
      VARIABLE_DEFINITION: 'VariableDefinition',
      SELECTION_SET: 'SelectionSet',
      FIELD: 'Field',
      ARGUMENT: 'Argument',
      // Fragments
      FRAGMENT_SPREAD: 'FragmentSpread',
      INLINE_FRAGMENT: 'InlineFragment',
      FRAGMENT_DEFINITION: 'FragmentDefinition',
      // Values
      VARIABLE: 'Variable',
      INT: 'IntValue',
      FLOAT: 'FloatValue',
      STRING: 'StringValue',
      BOOLEAN: 'BooleanValue',
      NULL: 'NullValue',
      ENUM: 'EnumValue',
      LIST: 'ListValue',
      OBJECT: 'ObjectValue',
      OBJECT_FIELD: 'ObjectField',
      // Directives
      DIRECTIVE: 'Directive',
      // Types
      NAMED_TYPE: 'NamedType',
      LIST_TYPE: 'ListType',
      NON_NULL_TYPE: 'NonNullType',
      // Type System Definitions
      SCHEMA_DEFINITION: 'SchemaDefinition',
      OPERATION_TYPE_DEFINITION: 'OperationTypeDefinition',
      // Type Definitions
      SCALAR_TYPE_DEFINITION: 'ScalarTypeDefinition',
      OBJECT_TYPE_DEFINITION: 'ObjectTypeDefinition',
      FIELD_DEFINITION: 'FieldDefinition',
      INPUT_VALUE_DEFINITION: 'InputValueDefinition',
      INTERFACE_TYPE_DEFINITION: 'InterfaceTypeDefinition',
      UNION_TYPE_DEFINITION: 'UnionTypeDefinition',
      ENUM_TYPE_DEFINITION: 'EnumTypeDefinition',
      ENUM_VALUE_DEFINITION: 'EnumValueDefinition',
      INPUT_OBJECT_TYPE_DEFINITION: 'InputObjectTypeDefinition',
      // Directive Definitions
      DIRECTIVE_DEFINITION: 'DirectiveDefinition',
      // Type System Extensions
      SCHEMA_EXTENSION: 'SchemaExtension',
      // Type Extensions
      SCALAR_TYPE_EXTENSION: 'ScalarTypeExtension',
      OBJECT_TYPE_EXTENSION: 'ObjectTypeExtension',
      INTERFACE_TYPE_EXTENSION: 'InterfaceTypeExtension',
      UNION_TYPE_EXTENSION: 'UnionTypeExtension',
      ENUM_TYPE_EXTENSION: 'EnumTypeExtension',
      INPUT_OBJECT_TYPE_EXTENSION: 'InputObjectTypeExtension'
    });
    /**
     * The enum type representing the possible kind values of AST nodes.
     */

    /**
     * The `defineToStringTag()` function checks first to see if the runtime
     * supports the `Symbol` class and then if the `Symbol.toStringTag` constant
     * is defined as a `Symbol` instance. If both conditions are met, the
     * Symbol.toStringTag property is defined as a getter that returns the
     * supplied class constructor's name.
     *
     * @method defineToStringTag
     *
     * @param {Class<any>} classObject a class such as Object, String, Number but
     * typically one of your own creation through the class keyword; `class A {}`,
     * for example.
     */
    function defineToStringTag(classObject) {
      if (typeof Symbol === 'function' && Symbol.toStringTag) {
        Object.defineProperty(classObject.prototype, Symbol.toStringTag, {
          get: function get() {
            return this.constructor.name;
          }
        });
      }
    }

    /**
     * A representation of source input to GraphQL.
     * `name` and `locationOffset` are optional. They are useful for clients who
     * store GraphQL documents in source files; for example, if the GraphQL input
     * starts at line 40 in a file named Foo.graphql, it might be useful for name to
     * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
     * line and column in locationOffset are 1-indexed
     */
    var Source = function Source(body, name, locationOffset) {
      this.body = body;
      this.name = name || 'GraphQL request';
      this.locationOffset = locationOffset || {
        line: 1,
        column: 1
      };
      this.locationOffset.line > 0 || devAssert(0, 'line in locationOffset is 1-indexed and must be positive');
      this.locationOffset.column > 0 || devAssert(0, 'column in locationOffset is 1-indexed and must be positive');
    }; // Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported

    defineToStringTag(Source);

    /**
     * Produces the value of a block string from its parsed raw value, similar to
     * CoffeeScript's block string, Python's docstring trim or Ruby's strip_heredoc.
     *
     * This implements the GraphQL spec's BlockStringValue() static algorithm.
     */
    function dedentBlockStringValue(rawString) {
      // Expand a block string's raw value into independent lines.
      var lines = rawString.split(/\r\n|[\n\r]/g); // Remove common indentation from all lines but first.

      var commonIndent = getBlockStringIndentation(lines);

      if (commonIndent !== 0) {
        for (var i = 1; i < lines.length; i++) {
          lines[i] = lines[i].slice(commonIndent);
        }
      } // Remove leading and trailing blank lines.


      while (lines.length > 0 && isBlank(lines[0])) {
        lines.shift();
      }

      while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
        lines.pop();
      } // Return a string of the lines joined with U+000A.


      return lines.join('\n');
    } // @internal

    function getBlockStringIndentation(lines) {
      var commonIndent = null;

      for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        var indent = leadingWhitespace(line);

        if (indent === line.length) {
          continue; // skip empty lines
        }

        if (commonIndent === null || indent < commonIndent) {
          commonIndent = indent;

          if (commonIndent === 0) {
            break;
          }
        }
      }

      return commonIndent === null ? 0 : commonIndent;
    }

    function leadingWhitespace(str) {
      var i = 0;

      while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
        i++;
      }

      return i;
    }

    function isBlank(str) {
      return leadingWhitespace(str) === str.length;
    }
    /**
     * Print a block string in the indented block form by adding a leading and
     * trailing blank line. However, if a block string starts with whitespace and is
     * a single-line, adding a leading blank line would strip that whitespace.
     */


    function printBlockString(value) {
      var indentation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var preferMultipleLines = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var isSingleLine = value.indexOf('\n') === -1;
      var hasLeadingSpace = value[0] === ' ' || value[0] === '\t';
      var hasTrailingQuote = value[value.length - 1] === '"';
      var printAsMultipleLines = !isSingleLine || hasTrailingQuote || preferMultipleLines;
      var result = ''; // Format a multi-line block quote to account for leading space.

      if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
        result += '\n' + indentation;
      }

      result += indentation ? value.replace(/\n/g, '\n' + indentation) : value;

      if (printAsMultipleLines) {
        result += '\n';
      }

      return '"""' + result.replace(/"""/g, '\\"""') + '"""';
    }

    /**
     * An exported enum describing the different kinds of tokens that the
     * lexer emits.
     */
    var TokenKind = Object.freeze({
      SOF: '<SOF>',
      EOF: '<EOF>',
      BANG: '!',
      DOLLAR: '$',
      AMP: '&',
      PAREN_L: '(',
      PAREN_R: ')',
      SPREAD: '...',
      COLON: ':',
      EQUALS: '=',
      AT: '@',
      BRACKET_L: '[',
      BRACKET_R: ']',
      BRACE_L: '{',
      PIPE: '|',
      BRACE_R: '}',
      NAME: 'Name',
      INT: 'Int',
      FLOAT: 'Float',
      STRING: 'String',
      BLOCK_STRING: 'BlockString',
      COMMENT: 'Comment'
    });
    /**
     * The enum type representing the token kinds values.
     */

    /**
     * Given a Source object, this returns a Lexer for that source.
     * A Lexer is a stateful stream generator in that every time
     * it is advanced, it returns the next token in the Source. Assuming the
     * source lexes, the final Token emitted by the lexer will be of kind
     * EOF, after which the lexer will repeatedly return the same EOF token
     * whenever called.
     */

    function createLexer(source, options) {
      var startOfFileToken = new Tok(TokenKind.SOF, 0, 0, 0, 0, null);
      var lexer = {
        source: source,
        options: options,
        lastToken: startOfFileToken,
        token: startOfFileToken,
        line: 1,
        lineStart: 0,
        advance: advanceLexer,
        lookahead: lookahead
      };
      return lexer;
    }

    function advanceLexer() {
      this.lastToken = this.token;
      var token = this.token = this.lookahead();
      return token;
    }

    function lookahead() {
      var token = this.token;

      if (token.kind !== TokenKind.EOF) {
        do {
          // Note: next is only mutable during parsing, so we cast to allow this.
          token = token.next || (token.next = readToken(this, token));
        } while (token.kind === TokenKind.COMMENT);
      }

      return token;
    }
    /**
     * Helper function for constructing the Token object.
     */

    function Tok(kind, start, end, line, column, prev, value) {
      this.kind = kind;
      this.start = start;
      this.end = end;
      this.line = line;
      this.column = column;
      this.value = value;
      this.prev = prev;
      this.next = null;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Tok, function () {
      return {
        kind: this.kind,
        value: this.value,
        line: this.line,
        column: this.column
      };
    });

    function printCharCode(code) {
      return (// NaN/undefined represents access beyond the end of the file.
        isNaN(code) ? TokenKind.EOF : // Trust JSON for ASCII.
        code < 0x007f ? JSON.stringify(String.fromCharCode(code)) : // Otherwise print the escaped form.
        "\"\\u".concat(('00' + code.toString(16).toUpperCase()).slice(-4), "\"")
      );
    }
    /**
     * Gets the next token from the source starting at the given position.
     *
     * This skips over whitespace until it finds the next lexable token, then lexes
     * punctuators immediately or calls the appropriate helper function for more
     * complicated tokens.
     */


    function readToken(lexer, prev) {
      var source = lexer.source;
      var body = source.body;
      var bodyLength = body.length;
      var pos = positionAfterWhitespace(body, prev.end, lexer);
      var line = lexer.line;
      var col = 1 + pos - lexer.lineStart;

      if (pos >= bodyLength) {
        return new Tok(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
      }

      var code = body.charCodeAt(pos); // SourceCharacter

      switch (code) {
        // !
        case 33:
          return new Tok(TokenKind.BANG, pos, pos + 1, line, col, prev);
        // #

        case 35:
          return readComment(source, pos, line, col, prev);
        // $

        case 36:
          return new Tok(TokenKind.DOLLAR, pos, pos + 1, line, col, prev);
        // &

        case 38:
          return new Tok(TokenKind.AMP, pos, pos + 1, line, col, prev);
        // (

        case 40:
          return new Tok(TokenKind.PAREN_L, pos, pos + 1, line, col, prev);
        // )

        case 41:
          return new Tok(TokenKind.PAREN_R, pos, pos + 1, line, col, prev);
        // .

        case 46:
          if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
            return new Tok(TokenKind.SPREAD, pos, pos + 3, line, col, prev);
          }

          break;
        // :

        case 58:
          return new Tok(TokenKind.COLON, pos, pos + 1, line, col, prev);
        // =

        case 61:
          return new Tok(TokenKind.EQUALS, pos, pos + 1, line, col, prev);
        // @

        case 64:
          return new Tok(TokenKind.AT, pos, pos + 1, line, col, prev);
        // [

        case 91:
          return new Tok(TokenKind.BRACKET_L, pos, pos + 1, line, col, prev);
        // ]

        case 93:
          return new Tok(TokenKind.BRACKET_R, pos, pos + 1, line, col, prev);
        // {

        case 123:
          return new Tok(TokenKind.BRACE_L, pos, pos + 1, line, col, prev);
        // |

        case 124:
          return new Tok(TokenKind.PIPE, pos, pos + 1, line, col, prev);
        // }

        case 125:
          return new Tok(TokenKind.BRACE_R, pos, pos + 1, line, col, prev);
        // A-Z _ a-z

        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 95:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          return readName(source, pos, line, col, prev);
        // - 0-9

        case 45:
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          return readNumber(source, pos, code, line, col, prev);
        // "

        case 34:
          if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
            return readBlockString(source, pos, line, col, prev, lexer);
          }

          return readString(source, pos, line, col, prev);
      }

      throw syntaxError(source, pos, unexpectedCharacterMessage(code));
    }
    /**
     * Report a message that an unexpected character was encountered.
     */


    function unexpectedCharacterMessage(code) {
      if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
        return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
      }

      if (code === 39) {
        // '
        return 'Unexpected single quote character (\'), did you mean to use a double quote (")?';
      }

      return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
    }
    /**
     * Reads from body starting at startPosition until it finds a non-whitespace
     * character, then returns the position of that character for lexing.
     */


    function positionAfterWhitespace(body, startPosition, lexer) {
      var bodyLength = body.length;
      var position = startPosition;

      while (position < bodyLength) {
        var code = body.charCodeAt(position); // tab | space | comma | BOM

        if (code === 9 || code === 32 || code === 44 || code === 0xfeff) {
          ++position;
        } else if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else {
          break;
        }
      }

      return position;
    }
    /**
     * Reads a comment token from the source file.
     *
     * #[\u0009\u0020-\uFFFF]*
     */


    function readComment(source, start, line, col, prev) {
      var body = source.body;
      var code;
      var position = start;

      do {
        code = body.charCodeAt(++position);
      } while (!isNaN(code) && ( // SourceCharacter but not LineTerminator
      code > 0x001f || code === 0x0009));

      return new Tok(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
    }
    /**
     * Reads a number token from the source file, either a float
     * or an int depending on whether a decimal point appears.
     *
     * Int:   -?(0|[1-9][0-9]*)
     * Float: -?(0|[1-9][0-9]*)(\.[0-9]+)?((E|e)(+|-)?[0-9]+)?
     */


    function readNumber(source, start, firstCode, line, col, prev) {
      var body = source.body;
      var code = firstCode;
      var position = start;
      var isFloat = false;

      if (code === 45) {
        // -
        code = body.charCodeAt(++position);
      }

      if (code === 48) {
        // 0
        code = body.charCodeAt(++position);

        if (code >= 48 && code <= 57) {
          throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
        }
      } else {
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 46) {
        // .
        isFloat = true;
        code = body.charCodeAt(++position);
        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      }

      if (code === 69 || code === 101) {
        // E e
        isFloat = true;
        code = body.charCodeAt(++position);

        if (code === 43 || code === 45) {
          // + -
          code = body.charCodeAt(++position);
        }

        position = readDigits(source, position, code);
        code = body.charCodeAt(position);
      } // Numbers cannot be followed by . or e


      if (code === 46 || code === 69 || code === 101) {
        throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
      }

      return new Tok(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
    }
    /**
     * Returns the new position in the source after reading digits.
     */


    function readDigits(source, start, firstCode) {
      var body = source.body;
      var position = start;
      var code = firstCode;

      if (code >= 48 && code <= 57) {
        // 0 - 9
        do {
          code = body.charCodeAt(++position);
        } while (code >= 48 && code <= 57); // 0 - 9


        return position;
      }

      throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
    }
    /**
     * Reads a string token from the source file.
     *
     * "([^"\\\u000A\u000D]|(\\(u[0-9a-fA-F]{4}|["\\/bfnrt])))*"
     */


    function readString(source, start, line, col, prev) {
      var body = source.body;
      var position = start + 1;
      var chunkStart = position;
      var code = 0;
      var value = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
      code !== 0x000a && code !== 0x000d) {
        // Closing Quote (")
        if (code === 34) {
          value += body.slice(chunkStart, position);
          return new Tok(TokenKind.STRING, start, position + 1, line, col, prev, value);
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        ++position;

        if (code === 92) {
          // \
          value += body.slice(chunkStart, position - 1);
          code = body.charCodeAt(position);

          switch (code) {
            case 34:
              value += '"';
              break;

            case 47:
              value += '/';
              break;

            case 92:
              value += '\\';
              break;

            case 98:
              value += '\b';
              break;

            case 102:
              value += '\f';
              break;

            case 110:
              value += '\n';
              break;

            case 114:
              value += '\r';
              break;

            case 116:
              value += '\t';
              break;

            case 117:
              {
                // uXXXX
                var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));

                if (charCode < 0) {
                  var invalidSequence = body.slice(position + 1, position + 5);
                  throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
                }

                value += String.fromCharCode(charCode);
                position += 4;
                break;
              }

            default:
              throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
          }

          ++position;
          chunkStart = position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Reads a block string token from the source file.
     *
     * """("?"?(\\"""|\\(?!=""")|[^"\\]))*"""
     */


    function readBlockString(source, start, line, col, prev, lexer) {
      var body = source.body;
      var position = start + 3;
      var chunkStart = position;
      var code = 0;
      var rawValue = '';

      while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
        // Closing Triple-Quote (""")
        if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          rawValue += body.slice(chunkStart, position);
          return new Tok(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
        } // SourceCharacter


        if (code < 0x0020 && code !== 0x0009 && code !== 0x000a && code !== 0x000d) {
          throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
        }

        if (code === 10) {
          // new line
          ++position;
          ++lexer.line;
          lexer.lineStart = position;
        } else if (code === 13) {
          // carriage return
          if (body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }

          ++lexer.line;
          lexer.lineStart = position;
        } else if ( // Escape Triple-Quote (\""")
        code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
          rawValue += body.slice(chunkStart, position) + '"""';
          position += 4;
          chunkStart = position;
        } else {
          ++position;
        }
      }

      throw syntaxError(source, position, 'Unterminated string.');
    }
    /**
     * Converts four hexadecimal chars to the integer that the
     * string represents. For example, uniCharCode('0','0','0','f')
     * will return 15, and uniCharCode('0','0','f','f') returns 255.
     *
     * Returns a negative number on error, if a char was invalid.
     *
     * This is implemented by noting that char2hex() returns -1 on error,
     * which means the result of ORing the char2hex() will also be negative.
     */


    function uniCharCode(a, b, c, d) {
      return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
    }
    /**
     * Converts a hex character to its integer value.
     * '0' becomes 0, '9' becomes 9
     * 'A' becomes 10, 'F' becomes 15
     * 'a' becomes 10, 'f' becomes 15
     *
     * Returns -1 on error.
     */


    function char2hex(a) {
      return a >= 48 && a <= 57 ? a - 48 // 0-9
      : a >= 65 && a <= 70 ? a - 55 // A-F
      : a >= 97 && a <= 102 ? a - 87 // a-f
      : -1;
    }
    /**
     * Reads an alphanumeric + underscore name from the source.
     *
     * [_A-Za-z][_0-9A-Za-z]*
     */


    function readName(source, start, line, col, prev) {
      var body = source.body;
      var bodyLength = body.length;
      var position = start + 1;
      var code = 0;

      while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
      code >= 48 && code <= 57 || // 0-9
      code >= 65 && code <= 90 || // A-Z
      code >= 97 && code <= 122) // a-z
      ) {
        ++position;
      }

      return new Tok(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
    }

    /**
     * The set of allowed directive location values.
     */
    var DirectiveLocation = Object.freeze({
      // Request Definitions
      QUERY: 'QUERY',
      MUTATION: 'MUTATION',
      SUBSCRIPTION: 'SUBSCRIPTION',
      FIELD: 'FIELD',
      FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION',
      FRAGMENT_SPREAD: 'FRAGMENT_SPREAD',
      INLINE_FRAGMENT: 'INLINE_FRAGMENT',
      VARIABLE_DEFINITION: 'VARIABLE_DEFINITION',
      // Type System Definitions
      SCHEMA: 'SCHEMA',
      SCALAR: 'SCALAR',
      OBJECT: 'OBJECT',
      FIELD_DEFINITION: 'FIELD_DEFINITION',
      ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION',
      INTERFACE: 'INTERFACE',
      UNION: 'UNION',
      ENUM: 'ENUM',
      ENUM_VALUE: 'ENUM_VALUE',
      INPUT_OBJECT: 'INPUT_OBJECT',
      INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION'
    });
    /**
     * The enum type representing the directive location values.
     */

    /**
     * Given a GraphQL source, parses it into a Document.
     * Throws GraphQLError if a syntax error is encountered.
     */
    function parse(source, options) {
      var parser = new Parser(source, options);
      return parser.parseDocument();
    }
    /**
     * Given a string containing a GraphQL value (ex. `[42]`), parse the AST for
     * that value.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Values directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: valueFromAST().
     */

    function parseValue(source, options) {
      var parser = new Parser(source, options);
      parser.expectToken(TokenKind.SOF);
      var value = parser.parseValueLiteral(false);
      parser.expectToken(TokenKind.EOF);
      return value;
    }
    /**
     * Given a string containing a GraphQL Type (ex. `[Int!]`), parse the AST for
     * that type.
     * Throws GraphQLError if a syntax error is encountered.
     *
     * This is useful within tools that operate upon GraphQL Types directly and
     * in isolation of complete GraphQL documents.
     *
     * Consider providing the results to the utility function: typeFromAST().
     */

    function parseType(source, options) {
      var parser = new Parser(source, options);
      parser.expectToken(TokenKind.SOF);
      var type = parser.parseTypeReference();
      parser.expectToken(TokenKind.EOF);
      return type;
    }

    var Parser =
    /*#__PURE__*/
    function () {
      function Parser(source, options) {
        var sourceObj = typeof source === 'string' ? new Source(source) : source;
        sourceObj instanceof Source || devAssert(0, "Must provide Source. Received: ".concat(inspect(sourceObj)));
        this._lexer = createLexer(sourceObj);
        this._options = options || {};
      }
      /**
       * Converts a name lex token into a name parse node.
       */


      var _proto = Parser.prototype;

      _proto.parseName = function parseName() {
        var token = this.expectToken(TokenKind.NAME);
        return {
          kind: Kind.NAME,
          value: token.value,
          loc: this.loc(token)
        };
      } // Implements the parsing rules in the Document section.

      /**
       * Document : Definition+
       */
      ;

      _proto.parseDocument = function parseDocument() {
        var start = this._lexer.token;
        return {
          kind: Kind.DOCUMENT,
          definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF),
          loc: this.loc(start)
        };
      }
      /**
       * Definition :
       *   - ExecutableDefinition
       *   - TypeSystemDefinition
       *   - TypeSystemExtension
       *
       * ExecutableDefinition :
       *   - OperationDefinition
       *   - FragmentDefinition
       */
      ;

      _proto.parseDefinition = function parseDefinition() {
        if (this.peek(TokenKind.NAME)) {
          switch (this._lexer.token.value) {
            case 'query':
            case 'mutation':
            case 'subscription':
              return this.parseOperationDefinition();

            case 'fragment':
              return this.parseFragmentDefinition();

            case 'schema':
            case 'scalar':
            case 'type':
            case 'interface':
            case 'union':
            case 'enum':
            case 'input':
            case 'directive':
              return this.parseTypeSystemDefinition();

            case 'extend':
              return this.parseTypeSystemExtension();
          }
        } else if (this.peek(TokenKind.BRACE_L)) {
          return this.parseOperationDefinition();
        } else if (this.peekDescription()) {
          return this.parseTypeSystemDefinition();
        }

        throw this.unexpected();
      } // Implements the parsing rules in the Operations section.

      /**
       * OperationDefinition :
       *  - SelectionSet
       *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
       */
      ;

      _proto.parseOperationDefinition = function parseOperationDefinition() {
        var start = this._lexer.token;

        if (this.peek(TokenKind.BRACE_L)) {
          return {
            kind: Kind.OPERATION_DEFINITION,
            operation: 'query',
            name: undefined,
            variableDefinitions: [],
            directives: [],
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        var operation = this.parseOperationType();
        var name;

        if (this.peek(TokenKind.NAME)) {
          name = this.parseName();
        }

        return {
          kind: Kind.OPERATION_DEFINITION,
          operation: operation,
          name: name,
          variableDefinitions: this.parseVariableDefinitions(),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * OperationType : one of query mutation subscription
       */
      ;

      _proto.parseOperationType = function parseOperationType() {
        var operationToken = this.expectToken(TokenKind.NAME);

        switch (operationToken.value) {
          case 'query':
            return 'query';

          case 'mutation':
            return 'mutation';

          case 'subscription':
            return 'subscription';
        }

        throw this.unexpected(operationToken);
      }
      /**
       * VariableDefinitions : ( VariableDefinition+ )
       */
      ;

      _proto.parseVariableDefinitions = function parseVariableDefinitions() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
      }
      /**
       * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseVariableDefinition = function parseVariableDefinition() {
        var start = this._lexer.token;
        return {
          kind: Kind.VARIABLE_DEFINITION,
          variable: this.parseVariable(),
          type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
          defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseValueLiteral(true) : undefined,
          directives: this.parseDirectives(true),
          loc: this.loc(start)
        };
      }
      /**
       * Variable : $ Name
       */
      ;

      _proto.parseVariable = function parseVariable() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.DOLLAR);
        return {
          kind: Kind.VARIABLE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      }
      /**
       * SelectionSet : { Selection+ }
       */
      ;

      _proto.parseSelectionSet = function parseSelectionSet() {
        var start = this._lexer.token;
        return {
          kind: Kind.SELECTION_SET,
          selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * Selection :
       *   - Field
       *   - FragmentSpread
       *   - InlineFragment
       */
      ;

      _proto.parseSelection = function parseSelection() {
        return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
      }
      /**
       * Field : Alias? Name Arguments? Directives? SelectionSet?
       *
       * Alias : Name :
       */
      ;

      _proto.parseField = function parseField() {
        var start = this._lexer.token;
        var nameOrAlias = this.parseName();
        var alias;
        var name;

        if (this.expectOptionalToken(TokenKind.COLON)) {
          alias = nameOrAlias;
          name = this.parseName();
        } else {
          name = nameOrAlias;
        }

        return {
          kind: Kind.FIELD,
          alias: alias,
          name: name,
          arguments: this.parseArguments(false),
          directives: this.parseDirectives(false),
          selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : undefined,
          loc: this.loc(start)
        };
      }
      /**
       * Arguments[Const] : ( Argument[?Const]+ )
       */
      ;

      _proto.parseArguments = function parseArguments(isConst) {
        var item = isConst ? this.parseConstArgument : this.parseArgument;
        return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
      }
      /**
       * Argument[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseArgument = function parseArgument() {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.ARGUMENT,
          name: name,
          value: this.parseValueLiteral(false),
          loc: this.loc(start)
        };
      };

      _proto.parseConstArgument = function parseConstArgument() {
        var start = this._lexer.token;
        return {
          kind: Kind.ARGUMENT,
          name: this.parseName(),
          value: (this.expectToken(TokenKind.COLON), this.parseValueLiteral(true)),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Fragments section.

      /**
       * Corresponds to both FragmentSpread and InlineFragment in the spec.
       *
       * FragmentSpread : ... FragmentName Directives?
       *
       * InlineFragment : ... TypeCondition? Directives? SelectionSet
       */
      ;

      _proto.parseFragment = function parseFragment() {
        var start = this._lexer.token;
        this.expectToken(TokenKind.SPREAD);
        var hasTypeCondition = this.expectOptionalKeyword('on');

        if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
          return {
            kind: Kind.FRAGMENT_SPREAD,
            name: this.parseFragmentName(),
            directives: this.parseDirectives(false),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: hasTypeCondition ? this.parseNamedType() : undefined,
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentDefinition :
       *   - fragment FragmentName on TypeCondition Directives? SelectionSet
       *
       * TypeCondition : NamedType
       */
      ;

      _proto.parseFragmentDefinition = function parseFragmentDefinition() {
        var start = this._lexer.token;
        this.expectKeyword('fragment'); // Experimental support for defining variables within fragments changes
        // the grammar of FragmentDefinition:
        //   - fragment FragmentName VariableDefinitions? on TypeCondition Directives? SelectionSet

        if (this._options.experimentalFragmentVariables) {
          return {
            kind: Kind.FRAGMENT_DEFINITION,
            name: this.parseFragmentName(),
            variableDefinitions: this.parseVariableDefinitions(),
            typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
            directives: this.parseDirectives(false),
            selectionSet: this.parseSelectionSet(),
            loc: this.loc(start)
          };
        }

        return {
          kind: Kind.FRAGMENT_DEFINITION,
          name: this.parseFragmentName(),
          typeCondition: (this.expectKeyword('on'), this.parseNamedType()),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet(),
          loc: this.loc(start)
        };
      }
      /**
       * FragmentName : Name but not `on`
       */
      ;

      _proto.parseFragmentName = function parseFragmentName() {
        if (this._lexer.token.value === 'on') {
          throw this.unexpected();
        }

        return this.parseName();
      } // Implements the parsing rules in the Values section.

      /**
       * Value[Const] :
       *   - [~Const] Variable
       *   - IntValue
       *   - FloatValue
       *   - StringValue
       *   - BooleanValue
       *   - NullValue
       *   - EnumValue
       *   - ListValue[?Const]
       *   - ObjectValue[?Const]
       *
       * BooleanValue : one of `true` `false`
       *
       * NullValue : `null`
       *
       * EnumValue : Name but not `true`, `false` or `null`
       */
      ;

      _proto.parseValueLiteral = function parseValueLiteral(isConst) {
        var token = this._lexer.token;

        switch (token.kind) {
          case TokenKind.BRACKET_L:
            return this.parseList(isConst);

          case TokenKind.BRACE_L:
            return this.parseObject(isConst);

          case TokenKind.INT:
            this._lexer.advance();

            return {
              kind: Kind.INT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.FLOAT:
            this._lexer.advance();

            return {
              kind: Kind.FLOAT,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.STRING:
          case TokenKind.BLOCK_STRING:
            return this.parseStringLiteral();

          case TokenKind.NAME:
            if (token.value === 'true' || token.value === 'false') {
              this._lexer.advance();

              return {
                kind: Kind.BOOLEAN,
                value: token.value === 'true',
                loc: this.loc(token)
              };
            } else if (token.value === 'null') {
              this._lexer.advance();

              return {
                kind: Kind.NULL,
                loc: this.loc(token)
              };
            }

            this._lexer.advance();

            return {
              kind: Kind.ENUM,
              value: token.value,
              loc: this.loc(token)
            };

          case TokenKind.DOLLAR:
            if (!isConst) {
              return this.parseVariable();
            }

            break;
        }

        throw this.unexpected();
      };

      _proto.parseStringLiteral = function parseStringLiteral() {
        var token = this._lexer.token;

        this._lexer.advance();

        return {
          kind: Kind.STRING,
          value: token.value,
          block: token.kind === TokenKind.BLOCK_STRING,
          loc: this.loc(token)
        };
      }
      /**
       * ListValue[Const] :
       *   - [ ]
       *   - [ Value[?Const]+ ]
       */
      ;

      _proto.parseList = function parseList(isConst) {
        var _this = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this.parseValueLiteral(isConst);
        };

        return {
          kind: Kind.LIST,
          values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectValue[Const] :
       *   - { }
       *   - { ObjectField[?Const]+ }
       */
      ;

      _proto.parseObject = function parseObject(isConst) {
        var _this2 = this;

        var start = this._lexer.token;

        var item = function item() {
          return _this2.parseObjectField(isConst);
        };

        return {
          kind: Kind.OBJECT,
          fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R),
          loc: this.loc(start)
        };
      }
      /**
       * ObjectField[Const] : Name : Value[?Const]
       */
      ;

      _proto.parseObjectField = function parseObjectField(isConst) {
        var start = this._lexer.token;
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        return {
          kind: Kind.OBJECT_FIELD,
          name: name,
          value: this.parseValueLiteral(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Directives section.

      /**
       * Directives[Const] : Directive[?Const]+
       */
      ;

      _proto.parseDirectives = function parseDirectives(isConst) {
        var directives = [];

        while (this.peek(TokenKind.AT)) {
          directives.push(this.parseDirective(isConst));
        }

        return directives;
      }
      /**
       * Directive[Const] : @ Name Arguments[?Const]?
       */
      ;

      _proto.parseDirective = function parseDirective(isConst) {
        var start = this._lexer.token;
        this.expectToken(TokenKind.AT);
        return {
          kind: Kind.DIRECTIVE,
          name: this.parseName(),
          arguments: this.parseArguments(isConst),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Types section.

      /**
       * Type :
       *   - NamedType
       *   - ListType
       *   - NonNullType
       */
      ;

      _proto.parseTypeReference = function parseTypeReference() {
        var start = this._lexer.token;
        var type;

        if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
          type = this.parseTypeReference();
          this.expectToken(TokenKind.BRACKET_R);
          type = {
            kind: Kind.LIST_TYPE,
            type: type,
            loc: this.loc(start)
          };
        } else {
          type = this.parseNamedType();
        }

        if (this.expectOptionalToken(TokenKind.BANG)) {
          return {
            kind: Kind.NON_NULL_TYPE,
            type: type,
            loc: this.loc(start)
          };
        }

        return type;
      }
      /**
       * NamedType : Name
       */
      ;

      _proto.parseNamedType = function parseNamedType() {
        var start = this._lexer.token;
        return {
          kind: Kind.NAMED_TYPE,
          name: this.parseName(),
          loc: this.loc(start)
        };
      } // Implements the parsing rules in the Type Definition section.

      /**
       * TypeSystemDefinition :
       *   - SchemaDefinition
       *   - TypeDefinition
       *   - DirectiveDefinition
       *
       * TypeDefinition :
       *   - ScalarTypeDefinition
       *   - ObjectTypeDefinition
       *   - InterfaceTypeDefinition
       *   - UnionTypeDefinition
       *   - EnumTypeDefinition
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemDefinition = function parseTypeSystemDefinition() {
        // Many definitions begin with a description and require a lookahead.
        var keywordToken = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaDefinition();

            case 'scalar':
              return this.parseScalarTypeDefinition();

            case 'type':
              return this.parseObjectTypeDefinition();

            case 'interface':
              return this.parseInterfaceTypeDefinition();

            case 'union':
              return this.parseUnionTypeDefinition();

            case 'enum':
              return this.parseEnumTypeDefinition();

            case 'input':
              return this.parseInputObjectTypeDefinition();

            case 'directive':
              return this.parseDirectiveDefinition();
          }
        }

        throw this.unexpected(keywordToken);
      };

      _proto.peekDescription = function peekDescription() {
        return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
      }
      /**
       * Description : StringValue
       */
      ;

      _proto.parseDescription = function parseDescription() {
        if (this.peekDescription()) {
          return this.parseStringLiteral();
        }
      }
      /**
       * SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
       */
      ;

      _proto.parseSchemaDefinition = function parseSchemaDefinition() {
        var start = this._lexer.token;
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
        return {
          kind: Kind.SCHEMA_DEFINITION,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * OperationTypeDefinition : OperationType : NamedType
       */
      ;

      _proto.parseOperationTypeDefinition = function parseOperationTypeDefinition() {
        var start = this._lexer.token;
        var operation = this.parseOperationType();
        this.expectToken(TokenKind.COLON);
        var type = this.parseNamedType();
        return {
          kind: Kind.OPERATION_TYPE_DEFINITION,
          operation: operation,
          type: type,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
       */
      ;

      _proto.parseScalarTypeDefinition = function parseScalarTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.SCALAR_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeDefinition :
       *   Description?
       *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseObjectTypeDefinition = function parseObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * ImplementsInterfaces :
       *   - implements `&`? NamedType
       *   - ImplementsInterfaces & NamedType
       */
      ;

      _proto.parseImplementsInterfaces = function parseImplementsInterfaces() {
        var types = [];

        if (this.expectOptionalKeyword('implements')) {
          // Optional leading ampersand
          this.expectOptionalToken(TokenKind.AMP);

          do {
            types.push(this.parseNamedType());
          } while (this.expectOptionalToken(TokenKind.AMP) || // Legacy support for the SDL?
          this._options.allowLegacySDLImplementsInterfaces && this.peek(TokenKind.NAME));
        }

        return types;
      }
      /**
       * FieldsDefinition : { FieldDefinition+ }
       */
      ;

      _proto.parseFieldsDefinition = function parseFieldsDefinition() {
        // Legacy support for the SDL?
        if (this._options.allowLegacySDLEmptyFields && this.peek(TokenKind.BRACE_L) && this._lexer.lookahead().kind === TokenKind.BRACE_R) {
          this._lexer.advance();

          this._lexer.advance();

          return [];
        }

        return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
      }
      /**
       * FieldDefinition :
       *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
       */
      ;

      _proto.parseFieldDefinition = function parseFieldDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.FIELD_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          type: type,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ArgumentsDefinition : ( InputValueDefinition+ )
       */
      ;

      _proto.parseArgumentDefs = function parseArgumentDefs() {
        return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
      }
      /**
       * InputValueDefinition :
       *   - Description? Name : Type DefaultValue? Directives[Const]?
       */
      ;

      _proto.parseInputValueDef = function parseInputValueDef() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        this.expectToken(TokenKind.COLON);
        var type = this.parseTypeReference();
        var defaultValue;

        if (this.expectOptionalToken(TokenKind.EQUALS)) {
          defaultValue = this.parseValueLiteral(true);
        }

        var directives = this.parseDirectives(true);
        return {
          kind: Kind.INPUT_VALUE_DEFINITION,
          description: description,
          name: name,
          type: type,
          defaultValue: defaultValue,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeDefinition :
       *   - Description? interface Name Directives[Const]? FieldsDefinition?
       */
      ;

      _proto.parseInterfaceTypeDefinition = function parseInterfaceTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('interface');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();
        return {
          kind: Kind.INTERFACE_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeDefinition :
       *   - Description? union Name Directives[Const]? UnionMemberTypes?
       */
      ;

      _proto.parseUnionTypeDefinition = function parseUnionTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();
        return {
          kind: Kind.UNION_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * UnionMemberTypes :
       *   - = `|`? NamedType
       *   - UnionMemberTypes | NamedType
       */
      ;

      _proto.parseUnionMemberTypes = function parseUnionMemberTypes() {
        var types = [];

        if (this.expectOptionalToken(TokenKind.EQUALS)) {
          // Optional leading pipe
          this.expectOptionalToken(TokenKind.PIPE);

          do {
            types.push(this.parseNamedType());
          } while (this.expectOptionalToken(TokenKind.PIPE));
        }

        return types;
      }
      /**
       * EnumTypeDefinition :
       *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
       */
      ;

      _proto.parseEnumTypeDefinition = function parseEnumTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();
        return {
          kind: Kind.ENUM_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * EnumValuesDefinition : { EnumValueDefinition+ }
       */
      ;

      _proto.parseEnumValuesDefinition = function parseEnumValuesDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
      }
      /**
       * EnumValueDefinition : Description? EnumValue Directives[Const]?
       *
       * EnumValue : Name
       */
      ;

      _proto.parseEnumValueDefinition = function parseEnumValueDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        return {
          kind: Kind.ENUM_VALUE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeDefinition :
       *   - Description? input Name Directives[Const]? InputFieldsDefinition?
       */
      ;

      _proto.parseInputObjectTypeDefinition = function parseInputObjectTypeDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();
        return {
          kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
          description: description,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InputFieldsDefinition : { InputValueDefinition+ }
       */
      ;

      _proto.parseInputFieldsDefinition = function parseInputFieldsDefinition() {
        return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
      }
      /**
       * TypeSystemExtension :
       *   - SchemaExtension
       *   - TypeExtension
       *
       * TypeExtension :
       *   - ScalarTypeExtension
       *   - ObjectTypeExtension
       *   - InterfaceTypeExtension
       *   - UnionTypeExtension
       *   - EnumTypeExtension
       *   - InputObjectTypeDefinition
       */
      ;

      _proto.parseTypeSystemExtension = function parseTypeSystemExtension() {
        var keywordToken = this._lexer.lookahead();

        if (keywordToken.kind === TokenKind.NAME) {
          switch (keywordToken.value) {
            case 'schema':
              return this.parseSchemaExtension();

            case 'scalar':
              return this.parseScalarTypeExtension();

            case 'type':
              return this.parseObjectTypeExtension();

            case 'interface':
              return this.parseInterfaceTypeExtension();

            case 'union':
              return this.parseUnionTypeExtension();

            case 'enum':
              return this.parseEnumTypeExtension();

            case 'input':
              return this.parseInputObjectTypeExtension();
          }
        }

        throw this.unexpected(keywordToken);
      }
      /**
       * SchemaExtension :
       *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
       *  - extend schema Directives[Const]
       */
      ;

      _proto.parseSchemaExtension = function parseSchemaExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('schema');
        var directives = this.parseDirectives(true);
        var operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);

        if (directives.length === 0 && operationTypes.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCHEMA_EXTENSION,
          directives: directives,
          operationTypes: operationTypes,
          loc: this.loc(start)
        };
      }
      /**
       * ScalarTypeExtension :
       *   - extend scalar Name Directives[Const]
       */
      ;

      _proto.parseScalarTypeExtension = function parseScalarTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('scalar');
        var name = this.parseName();
        var directives = this.parseDirectives(true);

        if (directives.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.SCALAR_TYPE_EXTENSION,
          name: name,
          directives: directives,
          loc: this.loc(start)
        };
      }
      /**
       * ObjectTypeExtension :
       *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend type Name ImplementsInterfaces? Directives[Const]
       *  - extend type Name ImplementsInterfaces
       */
      ;

      _proto.parseObjectTypeExtension = function parseObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('type');
        var name = this.parseName();
        var interfaces = this.parseImplementsInterfaces();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.OBJECT_TYPE_EXTENSION,
          name: name,
          interfaces: interfaces,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * InterfaceTypeExtension :
       *   - extend interface Name Directives[Const]? FieldsDefinition
       *   - extend interface Name Directives[Const]
       */
      ;

      _proto.parseInterfaceTypeExtension = function parseInterfaceTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('interface');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseFieldsDefinition();

        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INTERFACE_TYPE_EXTENSION,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * UnionTypeExtension :
       *   - extend union Name Directives[Const]? UnionMemberTypes
       *   - extend union Name Directives[Const]
       */
      ;

      _proto.parseUnionTypeExtension = function parseUnionTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('union');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var types = this.parseUnionMemberTypes();

        if (directives.length === 0 && types.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.UNION_TYPE_EXTENSION,
          name: name,
          directives: directives,
          types: types,
          loc: this.loc(start)
        };
      }
      /**
       * EnumTypeExtension :
       *   - extend enum Name Directives[Const]? EnumValuesDefinition
       *   - extend enum Name Directives[Const]
       */
      ;

      _proto.parseEnumTypeExtension = function parseEnumTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('enum');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var values = this.parseEnumValuesDefinition();

        if (directives.length === 0 && values.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.ENUM_TYPE_EXTENSION,
          name: name,
          directives: directives,
          values: values,
          loc: this.loc(start)
        };
      }
      /**
       * InputObjectTypeExtension :
       *   - extend input Name Directives[Const]? InputFieldsDefinition
       *   - extend input Name Directives[Const]
       */
      ;

      _proto.parseInputObjectTypeExtension = function parseInputObjectTypeExtension() {
        var start = this._lexer.token;
        this.expectKeyword('extend');
        this.expectKeyword('input');
        var name = this.parseName();
        var directives = this.parseDirectives(true);
        var fields = this.parseInputFieldsDefinition();

        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }

        return {
          kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
          name: name,
          directives: directives,
          fields: fields,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveDefinition :
       *   - Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations
       */
      ;

      _proto.parseDirectiveDefinition = function parseDirectiveDefinition() {
        var start = this._lexer.token;
        var description = this.parseDescription();
        this.expectKeyword('directive');
        this.expectToken(TokenKind.AT);
        var name = this.parseName();
        var args = this.parseArgumentDefs();
        var repeatable = this.expectOptionalKeyword('repeatable');
        this.expectKeyword('on');
        var locations = this.parseDirectiveLocations();
        return {
          kind: Kind.DIRECTIVE_DEFINITION,
          description: description,
          name: name,
          arguments: args,
          repeatable: repeatable,
          locations: locations,
          loc: this.loc(start)
        };
      }
      /**
       * DirectiveLocations :
       *   - `|`? DirectiveLocation
       *   - DirectiveLocations | DirectiveLocation
       */
      ;

      _proto.parseDirectiveLocations = function parseDirectiveLocations() {
        // Optional leading pipe
        this.expectOptionalToken(TokenKind.PIPE);
        var locations = [];

        do {
          locations.push(this.parseDirectiveLocation());
        } while (this.expectOptionalToken(TokenKind.PIPE));

        return locations;
      }
      /*
       * DirectiveLocation :
       *   - ExecutableDirectiveLocation
       *   - TypeSystemDirectiveLocation
       *
       * ExecutableDirectiveLocation : one of
       *   `QUERY`
       *   `MUTATION`
       *   `SUBSCRIPTION`
       *   `FIELD`
       *   `FRAGMENT_DEFINITION`
       *   `FRAGMENT_SPREAD`
       *   `INLINE_FRAGMENT`
       *
       * TypeSystemDirectiveLocation : one of
       *   `SCHEMA`
       *   `SCALAR`
       *   `OBJECT`
       *   `FIELD_DEFINITION`
       *   `ARGUMENT_DEFINITION`
       *   `INTERFACE`
       *   `UNION`
       *   `ENUM`
       *   `ENUM_VALUE`
       *   `INPUT_OBJECT`
       *   `INPUT_FIELD_DEFINITION`
       */
      ;

      _proto.parseDirectiveLocation = function parseDirectiveLocation() {
        var start = this._lexer.token;
        var name = this.parseName();

        if (DirectiveLocation[name.value] !== undefined) {
          return name;
        }

        throw this.unexpected(start);
      } // Core parsing utility functions

      /**
       * Returns a location object, used to identify the place in
       * the source that created a given parsed object.
       */
      ;

      _proto.loc = function loc(startToken) {
        if (!this._options.noLocation) {
          return new Loc(startToken, this._lexer.lastToken, this._lexer.source);
        }
      }
      /**
       * Determines if the next token is of a given kind
       */
      ;

      _proto.peek = function peek(kind) {
        return this._lexer.token.kind === kind;
      }
      /**
       * If the next token is of the given kind, return that token after advancing
       * the lexer. Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectToken = function expectToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        throw syntaxError(this._lexer.source, token.start, "Expected ".concat(kind, ", found ").concat(getTokenDesc(token)));
      }
      /**
       * If the next token is of the given kind, return that token after advancing
       * the lexer. Otherwise, do not change the parser state and return undefined.
       */
      ;

      _proto.expectOptionalToken = function expectOptionalToken(kind) {
        var token = this._lexer.token;

        if (token.kind === kind) {
          this._lexer.advance();

          return token;
        }

        return undefined;
      }
      /**
       * If the next token is a given keyword, advance the lexer.
       * Otherwise, do not change the parser state and throw an error.
       */
      ;

      _proto.expectKeyword = function expectKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();
        } else {
          throw syntaxError(this._lexer.source, token.start, "Expected \"".concat(value, "\", found ").concat(getTokenDesc(token)));
        }
      }
      /**
       * If the next token is a given keyword, return "true" after advancing
       * the lexer. Otherwise, do not change the parser state and return "false".
       */
      ;

      _proto.expectOptionalKeyword = function expectOptionalKeyword(value) {
        var token = this._lexer.token;

        if (token.kind === TokenKind.NAME && token.value === value) {
          this._lexer.advance();

          return true;
        }

        return false;
      }
      /**
       * Helper function for creating an error when an unexpected lexed token
       * is encountered.
       */
      ;

      _proto.unexpected = function unexpected(atToken) {
        var token = atToken || this._lexer.token;
        return syntaxError(this._lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token)));
      }
      /**
       * Returns a possibly empty list of parse nodes, determined by
       * the parseFn. This list begins with a lex token of openKind
       * and ends with a lex token of closeKind. Advances the parser
       * to the next lex token after the closing token.
       */
      ;

      _proto.any = function any(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        while (!this.expectOptionalToken(closeKind)) {
          nodes.push(parseFn.call(this));
        }

        return nodes;
      }
      /**
       * Returns a list of parse nodes, determined by the parseFn.
       * It can be empty only if open token is missing otherwise it will always
       * return non-empty list that begins with a lex token of openKind and ends
       * with a lex token of closeKind. Advances the parser to the next lex token
       * after the closing token.
       */
      ;

      _proto.optionalMany = function optionalMany(openKind, parseFn, closeKind) {
        if (this.expectOptionalToken(openKind)) {
          var nodes = [];

          do {
            nodes.push(parseFn.call(this));
          } while (!this.expectOptionalToken(closeKind));

          return nodes;
        }

        return [];
      }
      /**
       * Returns a non-empty list of parse nodes, determined by
       * the parseFn. This list begins with a lex token of openKind
       * and ends with a lex token of closeKind. Advances the parser
       * to the next lex token after the closing token.
       */
      ;

      _proto.many = function many(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        var nodes = [];

        do {
          nodes.push(parseFn.call(this));
        } while (!this.expectOptionalToken(closeKind));

        return nodes;
      };

      return Parser;
    }();

    function Loc(startToken, endToken, source) {
      this.start = startToken.start;
      this.end = endToken.end;
      this.startToken = startToken;
      this.endToken = endToken;
      this.source = source;
    } // Print a simplified form when appearing in JSON/util.inspect.


    defineToJSON(Loc, function () {
      return {
        start: this.start,
        end: this.end
      };
    });
    /**
     * A helper function to describe a token as a string for debugging
     */

    function getTokenDesc(token) {
      var value = token.value;
      return value ? "".concat(token.kind, " \"").concat(value, "\"") : token.kind;
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        parse: parse,
        parseValue: parseValue,
        parseType: parseType
    });

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var parser$1 = getCjsExportFromNamespace(parser);

    var parse$1 = parser$1.parse;

    // Strip insignificant whitespace
    // Note that this could do a lot more, such as reorder fields etc.
    function normalize(string) {
      return string.replace(/[\s,]+/g, ' ').trim();
    }

    // A map docString -> graphql document
    var docCache = {};

    // A map fragmentName -> [normalized source]
    var fragmentSourceMap = {};

    function cacheKeyFromLoc(loc) {
      return normalize(loc.source.body.substring(loc.start, loc.end));
    }

    // For testing.
    function resetCaches() {
      docCache = {};
      fragmentSourceMap = {};
    }

    // Take a unstripped parsed document (query/mutation or even fragment), and
    // check all fragment definitions, checking for name->source uniqueness.
    // We also want to make sure only unique fragments exist in the document.
    var printFragmentWarnings = true;
    function processFragments(ast) {
      var astFragmentMap = {};
      var definitions = [];

      for (var i = 0; i < ast.definitions.length; i++) {
        var fragmentDefinition = ast.definitions[i];

        if (fragmentDefinition.kind === 'FragmentDefinition') {
          var fragmentName = fragmentDefinition.name.value;
          var sourceKey = cacheKeyFromLoc(fragmentDefinition.loc);

          // We know something about this fragment
          if (fragmentSourceMap.hasOwnProperty(fragmentName) && !fragmentSourceMap[fragmentName][sourceKey]) {

            // this is a problem because the app developer is trying to register another fragment with
            // the same name as one previously registered. So, we tell them about it.
            if (printFragmentWarnings) {
              console.warn("Warning: fragment with name " + fragmentName + " already exists.\n"
                + "graphql-tag enforces all fragment names across your application to be unique; read more about\n"
                + "this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names");
            }

            fragmentSourceMap[fragmentName][sourceKey] = true;

          } else if (!fragmentSourceMap.hasOwnProperty(fragmentName)) {
            fragmentSourceMap[fragmentName] = {};
            fragmentSourceMap[fragmentName][sourceKey] = true;
          }

          if (!astFragmentMap[sourceKey]) {
            astFragmentMap[sourceKey] = true;
            definitions.push(fragmentDefinition);
          }
        } else {
          definitions.push(fragmentDefinition);
        }
      }

      ast.definitions = definitions;
      return ast;
    }

    function disableFragmentWarnings() {
      printFragmentWarnings = false;
    }

    function stripLoc(doc, removeLocAtThisLevel) {
      var docType = Object.prototype.toString.call(doc);

      if (docType === '[object Array]') {
        return doc.map(function (d) {
          return stripLoc(d, removeLocAtThisLevel);
        });
      }

      if (docType !== '[object Object]') {
        throw new Error('Unexpected input.');
      }

      // We don't want to remove the root loc field so we can use it
      // for fragment substitution (see below)
      if (removeLocAtThisLevel && doc.loc) {
        delete doc.loc;
      }

      // https://github.com/apollographql/graphql-tag/issues/40
      if (doc.loc) {
        delete doc.loc.startToken;
        delete doc.loc.endToken;
      }

      var keys = Object.keys(doc);
      var key;
      var value;
      var valueType;

      for (key in keys) {
        if (keys.hasOwnProperty(key)) {
          value = doc[keys[key]];
          valueType = Object.prototype.toString.call(value);

          if (valueType === '[object Object]' || valueType === '[object Array]') {
            doc[keys[key]] = stripLoc(value, true);
          }
        }
      }

      return doc;
    }

    var experimentalFragmentVariables = false;
    function parseDocument(doc) {
      var cacheKey = normalize(doc);

      if (docCache[cacheKey]) {
        return docCache[cacheKey];
      }

      var parsed = parse$1(doc, { experimentalFragmentVariables: experimentalFragmentVariables });
      if (!parsed || parsed.kind !== 'Document') {
        throw new Error('Not a valid GraphQL document.');
      }

      // check that all "new" fragments inside the documents are consistent with
      // existing fragments of the same name
      parsed = processFragments(parsed);
      parsed = stripLoc(parsed, false);
      docCache[cacheKey] = parsed;

      return parsed;
    }

    function enableExperimentalFragmentVariables() {
      experimentalFragmentVariables = true;
    }

    function disableExperimentalFragmentVariables() {
      experimentalFragmentVariables = false;
    }

    // XXX This should eventually disallow arbitrary string interpolation, like Relay does
    function gql(/* arguments */) {
      var args = Array.prototype.slice.call(arguments);

      var literals = args[0];

      // We always get literals[0] and then matching post literals for each arg given
      var result = (typeof(literals) === "string") ? literals : literals[0];

      for (var i = 1; i < args.length; i++) {
        if (args[i] && args[i].kind && args[i].kind === 'Document') {
          result += args[i].loc.source.body;
        } else {
          result += args[i];
        }

        result += literals[i];
      }

      return parseDocument(result);
    }

    // Support typescript, which isn't as nice as Babel about default exports
    gql.default = gql;
    gql.resetCaches = resetCaches;
    gql.disableFragmentWarnings = disableFragmentWarnings;
    gql.enableExperimentalFragmentVariables = enableExperimentalFragmentVariables;
    gql.disableExperimentalFragmentVariables = disableExperimentalFragmentVariables;

    var src = gql;

    /* ************ folderPath Queries ************ */
    const GET_CHILD_FILES = src`
  query filePathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      files {
        filePath
  }}}`;
    const GET_CHILD_FOLDERS = src`
  query folderPathsInFolder($folderPath: String) {
    folder(folderPath: $folderPath) {
      folders {
        folderPath
  }}}`;
    /* ************ filePath Queries ************ */
    const GET_FILE = src`
  query file($filePath: String) {
    file(filePath: $filePath) {
      contents
  }}`;
    const GET_TAGS = src`
 query tagsAssignedToFile($filePath: String) {
   file(filePath: $filePath) {
     tags {
       tagName
  }}}`;
    /* ************ tagName Queries ************ */
    const SEARCH_TAGS = src`
  query filesTagged($tagNames: [String]) {
    filesTagged(tagNames: $tagNames) {
      filePath
    }}`;
    /* ************ Mutations ************ */
    const ASSIGN_TAG = src`
  mutation tagFile($filePath: String, $tagName: String) {
    tagFile(filePath: $filePath, tagName: $tagName) {
      filePath,
      tagNames
  }}`;
    const UNASSIGN_TAG = src`
 mutation untagFile($filePath: String, $tagName: String) {
   untagFile(filePath: $filePath, tagName: $tagName) {
     filePath,
     tagNames
  }}`;

    /* src/components/header/SearchBar.svelte generated by Svelte v3.19.1 */
    const file = "src/components/header/SearchBar.svelte";

    function create_fragment(ctx) {
    	let div;
    	let input;
    	let t0;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Search";
    			add_location(input, file, 12, 2, 317);
    			add_location(button, file, 13, 2, 340);
    			add_location(div, file, 11, 0, 309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, button);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $searchArray;
    	let $searchMode;
    	validate_store(searchArray, "searchArray");
    	component_subscribe($$self, searchArray, $$value => $$invalidate(2, $searchArray = $$value));
    	validate_store(searchMode, "searchMode");
    	component_subscribe($$self, searchMode, $$value => $$invalidate(3, $searchMode = $$value));
    	let { value } = $$props;

    	function submit(inputString) {
    		set_store_value(searchArray, $searchArray = inputString.split(",").map(word => word.trim()).filter(x => x));
    		set_store_value(searchMode, $searchMode = true);
    	}

    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		($$invalidate(0, value), $$invalidate(3, $searchMode));
    	}

    	const click_handler = () => submit(value);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		searchArray,
    		searchMode,
    		value,
    		submit,
    		$searchArray,
    		$searchMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$searchMode*/ 8) {
    			 if (!$searchMode) {
    				$$invalidate(0, value = "");
    				set_store_value(searchArray, $searchArray = []);
    			}
    		}
    	};

    	return [value, submit, $searchArray, $searchMode, input_input_handler, click_handler];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<SearchBar> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/main/TagsDisplay.svelte generated by Svelte v3.19.1 */
    const file$1 = "src/components/main/TagsDisplay.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (32:4) {#each tagNames as tagName}
    function create_each_block(ctx) {
    	let li;
    	let t_value = /*tagName*/ ctx[6] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*tagName*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-1mdptjb");
    			toggle_class(li, "searched", /*$searchArray*/ ctx[1].includes(/*tagName*/ ctx[6]));
    			add_location(li, file$1, 32, 4, 969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tagNames*/ 1 && t_value !== (t_value = /*tagName*/ ctx[6] + "")) set_data_dev(t, t_value);

    			if (dirty & /*$searchArray, tagNames*/ 3) {
    				toggle_class(li, "searched", /*$searchArray*/ ctx[1].includes(/*tagName*/ ctx[6]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(32:4) {#each tagNames as tagName}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let ul;
    	let each_value = /*tagNames*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file$1, 30, 2, 928);
    			add_location(div, file$1, 29, 0, 920);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$searchArray, tagNames, tagSelect*/ 7) {
    				each_value = /*tagNames*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $searchMode;
    	let $searchArray;
    	let $searchString;
    	validate_store(searchMode, "searchMode");
    	component_subscribe($$self, searchMode, $$value => $$invalidate(3, $searchMode = $$value));
    	validate_store(searchArray, "searchArray");
    	component_subscribe($$self, searchArray, $$value => $$invalidate(1, $searchArray = $$value));
    	validate_store(searchString, "searchString");
    	component_subscribe($$self, searchString, $$value => $$invalidate(4, $searchString = $$value));
    	let { tagNames = ["No tags were set"] } = $$props;

    	// from SO to remove text-select on shift-click
    	["keyup", "keydown"].forEach(event => {
    		window.addEventListener(event, e => {
    			document.onselectstart = function () {
    				return !(e.key == "Shift" && e.shiftKey);
    			};
    		});
    	});

    	function tagSelect(e, tagName) {
    		set_store_value(searchMode, $searchMode = true);

    		if (e.shiftKey) {
    			if ($searchArray.includes(tagName)) {
    				set_store_value(searchArray, $searchArray = $searchArray.filter(t => t !== tagName));
    				set_store_value(searchString, $searchString = $searchArray.join(", "));
    			} else {
    				set_store_value(searchArray, $searchArray = $searchArray.concat(tagName));
    				set_store_value(searchString, $searchString = $searchString + `, ${tagName}`);
    			}
    		} else {
    			set_store_value(searchArray, $searchArray = [tagName]);
    			set_store_value(searchString, $searchString = tagName);
    		}
    	}

    	const writable_props = ["tagNames"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TagsDisplay> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (tagName, e) => tagSelect(e, tagName);

    	$$self.$set = $$props => {
    		if ("tagNames" in $$props) $$invalidate(0, tagNames = $$props.tagNames);
    	};

    	$$self.$capture_state = () => ({
    		getClient,
    		query,
    		GET_TAGS,
    		searchArray,
    		searchMode,
    		searchString,
    		tagNames,
    		tagSelect,
    		window,
    		document,
    		$searchMode,
    		$searchArray,
    		$searchString
    	});

    	$$self.$inject_state = $$props => {
    		if ("tagNames" in $$props) $$invalidate(0, tagNames = $$props.tagNames);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tagNames, $searchArray, tagSelect, $searchMode, $searchString, click_handler];
    }

    class TagsDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { tagNames: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TagsDisplay",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get tagNames() {
    		throw new Error("<TagsDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tagNames(value) {
    		throw new Error("<TagsDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/main/TaggingBox.svelte generated by Svelte v3.19.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/main/TaggingBox.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let input;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Del";
    			add_location(input, file$2, 46, 2, 1267);
    			add_location(button0, file$2, 47, 2, 1290);
    			add_location(button1, file$2, 48, 2, 1344);
    			attr_dev(div, "class", "svelte-xnoqet");
    			add_location(div, file$2, 45, 0, 1259);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(div, t2);
    			append_dev(div, button1);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    				listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[10], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { filePath } = $$props;
    	let { updateTags } = $$props;
    	let value = "";
    	const client = getClient();

    	async function assignTag(tagName) {
    		try {
    			await mutate(client, {
    				mutation: ASSIGN_TAG,
    				variables: { filePath, tagName }
    			});
    		} catch(error) {
    			console.log("error! assignTag()");
    		}
    	}

    	async function unassignTag(tagName) {
    		try {
    			await mutate(client, {
    				mutation: UNASSIGN_TAG,
    				variables: { filePath, tagName }
    			});
    		} catch(error) {
    			console.log("unassignTag() error!");
    		}
    	}

    	function onAdd(inputString) {
    		const tagNames = inputString.split(",").map(t => t.trim());
    		console.log(tagNames);

    		// if array has a first string with content
    		if (tagNames.length && tagNames[0].length) {
    			tagNames.forEach(tagName => {
    				assignTag(tagName);
    				console.log(tagName);
    				updateTags();
    			});
    		}

    		$$invalidate(0, value = "");
    	}

    	function onDel(inputString) {
    		unassignTag(inputString);
    		$$invalidate(0, value = "");
    		updateTags();
    	}

    	const writable_props = ["filePath", "updateTags"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TaggingBox> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const click_handler = () => onAdd(value);
    	const click_handler_1 = () => onDel(value);

    	$$self.$set = $$props => {
    		if ("filePath" in $$props) $$invalidate(3, filePath = $$props.filePath);
    		if ("updateTags" in $$props) $$invalidate(4, updateTags = $$props.updateTags);
    	};

    	$$self.$capture_state = () => ({
    		getClient,
    		mutate,
    		ASSIGN_TAG,
    		UNASSIGN_TAG,
    		fileFocus,
    		searchArray,
    		filePath,
    		updateTags,
    		value,
    		client,
    		assignTag,
    		unassignTag,
    		onAdd,
    		onDel,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("filePath" in $$props) $$invalidate(3, filePath = $$props.filePath);
    		if ("updateTags" in $$props) $$invalidate(4, updateTags = $$props.updateTags);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			 $$invalidate(0, value = value.toLowerCase());
    		}

    		if ($$self.$$.dirty & /*value*/ 1) {
    			 console.log(value);
    		}
    	};

    	return [
    		value,
    		onAdd,
    		onDel,
    		filePath,
    		updateTags,
    		client,
    		assignTag,
    		unassignTag,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class TaggingBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { filePath: 3, updateTags: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TaggingBox",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filePath*/ ctx[3] === undefined && !("filePath" in props)) {
    			console_1.warn("<TaggingBox> was created without expected prop 'filePath'");
    		}

    		if (/*updateTags*/ ctx[4] === undefined && !("updateTags" in props)) {
    			console_1.warn("<TaggingBox> was created without expected prop 'updateTags'");
    		}
    	}

    	get filePath() {
    		throw new Error("<TaggingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filePath(value) {
    		throw new Error("<TaggingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateTags() {
    		throw new Error("<TaggingBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateTags(value) {
    		throw new Error("<TaggingBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/main/MetaDisplay.svelte generated by Svelte v3.19.1 */
    const file$3 = "src/components/main/MetaDisplay.svelte";

    // (23:2) {:catch}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "error!";
    			add_location(p, file$3, 23, 4, 654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(23:2) {:catch}",
    		ctx
    	});

    	return block;
    }

    // (19:2) {:then qResult}
    function create_then_block(ctx) {
    	let section;
    	let current;

    	const tagsdisplay = new TagsDisplay({
    			props: {
    				tagNames: /*qResult*/ ctx[5].data.file.tags.map(func)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(tagsdisplay.$$.fragment);
    			attr_dev(section, "id", "TagsDisplay");
    			attr_dev(section, "class", "svelte-p3u7b4");
    			add_location(section, file$3, 19, 4, 517);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(tagsdisplay, section, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tagsdisplay_changes = {};
    			if (dirty & /*$qData*/ 2) tagsdisplay_changes.tagNames = /*qResult*/ ctx[5].data.file.tags.map(func);
    			tagsdisplay.$set(tagsdisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tagsdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tagsdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(tagsdisplay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(19:2) {:then qResult}",
    		ctx
    	});

    	return block;
    }

    // (17:17)      <p>loading...</p>   {:then qResult}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading...";
    			add_location(p, file$3, 17, 4, 477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(17:17)      <p>loading...</p>   {:then qResult}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let promise;
    	let t;
    	let section;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$qData*/ ctx[1], info);

    	const taggingbox = new TaggingBox({
    			props: {
    				filePath: /*filePath*/ ctx[0],
    				updateTags: /*updateTags*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			t = space();
    			section = element("section");
    			create_component(taggingbox.$$.fragment);
    			attr_dev(section, "id", "TaggingBox");
    			attr_dev(section, "class", "svelte-p3u7b4");
    			add_location(section, file$3, 25, 2, 681);
    			attr_dev(div, "class", "svelte-p3u7b4");
    			add_location(div, file$3, 15, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = t;
    			append_dev(div, t);
    			append_dev(div, section);
    			mount_component(taggingbox, section, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$qData*/ 2 && promise !== (promise = /*$qData*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[5] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const taggingbox_changes = {};
    			if (dirty & /*filePath*/ 1) taggingbox_changes.filePath = /*filePath*/ ctx[0];
    			taggingbox.$set(taggingbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(taggingbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(taggingbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(taggingbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = t => t.tagName;

    function instance$3($$self, $$props, $$invalidate) {
    	let $qData;
    	let { filePath } = $$props;
    	const client = getClient();
    	const qData = query(client, { query: GET_TAGS, variables: { filePath } });
    	validate_store(qData, "qData");
    	component_subscribe($$self, qData, value => $$invalidate(1, $qData = value));

    	function updateTags() {
    		qData.refetch({ filePath });
    	}

    	const writable_props = ["filePath"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MetaDisplay> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("filePath" in $$props) $$invalidate(0, filePath = $$props.filePath);
    	};

    	$$self.$capture_state = () => ({
    		getClient,
    		query,
    		GET_TAGS,
    		TagsDisplay,
    		TaggingBox,
    		filePath,
    		client,
    		qData,
    		updateTags,
    		$qData
    	});

    	$$self.$inject_state = $$props => {
    		if ("filePath" in $$props) $$invalidate(0, filePath = $$props.filePath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filePath*/ 1) {
    			 qData.refetch({ filePath });
    		}
    	};

    	return [filePath, $qData, qData, updateTags];
    }

    class MetaDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { filePath: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MetaDisplay",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filePath*/ ctx[0] === undefined && !("filePath" in props)) {
    			console.warn("<MetaDisplay> was created without expected prop 'filePath'");
    		}
    	}

    	get filePath() {
    		throw new Error("<MetaDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filePath(value) {
    		throw new Error("<MetaDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const img = "data:image/gif;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    const img$1 = "data:image/jpeg;base64,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QAAAAAJJJJJba2kkkkk23tbbbIAS0knuWk20qQAbJLbJLZJM9t/0kk0E2wAASSAS20gCSSAAAASSSQAAAAAAAJJJJJJJbe220kkkktJbbYACW0lq0m2kyACZJbZJbJLntv8ApJNoNsgAAkgAttIEkkgoJBIttgAAAAAAAASSSSSSSST/APbbbSSS0kktAAAbbXqTbSZABIktsktkl/2//SSbQbYAAJJALaSBJJLbSCTbaSSSQBJJJJNtttttttskm23/AO22kl7JISQAE23Ym2sSACQNbZJbJbft/wBJJtploAAkkAtpIEkktpJJttJJJJJMkkEG3/8A/wD/AP8A/tttv2222/bbXtsBJJICbczbWZAJICtsltktu2/6STbTLAABJALbSBJJAaSSbSSSSSTbbbQEm022222223//AP8A+2Tbbf8Af9pABJJCSU7azIRJACMklklt23/SSbW1oABJIJbSBJIACSTbSSSSTbbbbSQkm27X/bb+2222/wD/AO22Tbb/AFJJABJLSU/SZCZIABMlsktk2/ySba39khJIBbSBJIAASTbSSSTbbbbSSSyUpbrbbbbbbbf222//AL/bdtsASSQCSWl+kyE2QACQLZJbJP8ApJNtb/ySkgEtpEkgAAJNpJJJttttJJZJf++222m0stttttttZbf/AP8Ab+0gACSQCW39mQmyAESAbJLZLf0km2v/AKSEkC2pAkgAAAtpJJNtttJLJL//AP220kkkkkktsobbbaSW23/bbbAABJJATe3ITbASJAJElslv6Sba3/2gJIttkltAAJLaSSTb/wDttkv/AP7bbbbSSSSSSSSSSSSVttbZbZJtskgAEkhJ78JtoDEgEkG2S27JNtb/AG0JIFtkk/2iRtm223//APtst/8A7bbbbbbbySSWySSSSSSS3vv7ZJJJskkAAElJfzNtJYkBsgGyW2ZJtr/7ZEkS2yS/bRG2Tbb/AP8A9tt//ttttttt/wD+222222222ySSS9/9tpJJIkkkAAkpebtpJEgNsAkS2zJNrf8A2zZAtskn+STtkk2//wD9sv8A/bbbbbf/AP8A/wD/ANtttttttttttkm2TbbbaSAJJIAALc27SSJAbaBIBsk2bX/+2bYNtkl+yTtskm//APtsn/ttttt//wD/AP8A/wDbSSSaSSW222223pJJJtttIAAkkgANbf5JEgFtIkAkSX9r/wC2TbFtkk/2Sdskkt/+2y/+2223/wD/AP8A/wBtttpJNttttttpLbSS22kkk22yAACSQAlv9kmQC2kyASRLe1/9tm2rbJJ9knbJJLbftkv9tttv/wD/AP8AttttttpJtt//ALbbbbJIBNtttJJJtkgAEkgJf7bNgFtJsAkgE3r/AO2bbStkl+yZtkkttsmS/wBttt//AP8A+22222//AP7b/wD/AP8A/wD9tJJJJJNtttJJIAkgAEkp/bbsAtpNgEkAEDf7ZNtpeST/ACTtkklt+kS/2223/wD/APbbbbf/AP8A/wD+3/8A/wD/ANtttttJJJJJNttJIAAkAAkv/bf4FtJvAkgEgFvbZtrL6S/5J2ySW34pr/bbb/8A/wDtttt//wD/AP8AttpNttskk222222+0kkk222gAASQAbbtv9i2k38SQCQCWls38t9t/smbJJbfpAAdttv/AP8A2223/wD/AP8A22220mmCCSSSSSTbbb//AGkkk22wAAASBJJt/t60m/mSASASUkv3t/tv8k7ZJLbvEASwNv8A/wD222//AP8A7bbbbf8ABBkttttskySSTf8A/wD9pJJNskAAA2S7b/b+ZN/okAkAkhJtpb7bfZb2SSW/ZAAFtH//AO223/8A/tttv/8A9tm2222222222ybZbb//APaSSSJJAEltv2+3+l7+RIAIBJATbRJSW/yfsklt26QALbaf+223/wD9ttt/22//AP2222kAEA22222zbbbf/wD+SQANskkt/wB9t/pb3iUAQCQAG2iQkm3t7ZJLft7AAW223Ntt/wD/AGySbb//AP22AAAAAAAAAAAbbbf/ALbbf/8A6QAlpMkk3/2/2tkhKSIBJABKRKSTbSTAklu23gALbbbWk/f6SW3/AP8A/tpJAAAAAAAAAAAAAAE3/wD/ANttv/8AySS0mSTb7f7eyW0JMAkgAgIlJNtpJoAEtJJ4AFttt/wklrbbf/8A7aSSSAAJbbbbbbbaSAAAG2//AP8Abbf+2ySS02Tbb/bfS2yJpEkAEAkpJttJtIAlpJPAAFsdvyykgST/AP8A2kkkACW2222222222222ktttt/8A/bbe22ySWm/bf/b7W2S3okgAgElJNtJNpJktJNAAAtQeuSQhIS220BIAEltttttttNttttttttv/AO22TbbW0kttkklpe/8At/vbJbZCQAQCSEm2kmkk22kmwAAWqtthJYFLbaAAAW22222kkkkkkkkkkkm23/8AsAABNttSSS22SSEv/bf72S2yWwAgEkANtJNJNtpJtgAAtqbf+SS+22AABttttpJJJJJJJJJJJJJJbZMkkkgABNsASSW22SQl7b/fyW2WmSUAkgEtpJpJtpJNsAAAs7bf66S20AABtttpJJJJJJJJJJJNO220BJJJkkkkAJEkgSS22/yELf7/AGtslMkskJABJSTSTbSTbaQABby2/wD8pLEAAW220kkkkkkkkm23bbaSSSSkkkkkSSSQAASQBJLb/wCQJ/b7e2S2S+SWyAkBJpJtpJtpJAAFpbf/AP8AJJAAW22kkkkkkmz/AOyyQAAAAAEltJJJJJIkkkAAEkASTb/aJpf7eyUyX7S2SW0AtJttJNtAIAAlLbf/AP2UnzbbSSSSSbftskEAAAAAAAAACbbaSSSSSJJJAABIAm23abab230pkv21sEtslo2baSba3SAAEG2//wD/AOSbVtJJJ922wAAAAAAAAAAAAAJJJJttpJJJAkkkAAklpJJtlNpb/UyX7b+CW2S2Sf8A2zbQ6QAA+CXbP/8Aits9ttbbSAAAAAASSSSSSSSS20kkkk22kkkACSSQAAW0kk0m0k395L9t+hLbJbJD/tv/AJlpAAvBYwA5/bjb2IkkgAAAAAkkkkkkkkkltttttJJJJtpAAAAkkkAJtpJJMpJtp6X7b9IW2S2SG3bf71tIAHsJfAAA/b7bbkkgAAAEkkkkkktttttIEkkkklpJJJskkgAAEklJNtJJkpJtJh/7f5G2yWyC2yb/AHPbSAJJAdAAAAG3W2pIAAAJJJJJLaSSSSSQAAAAJJJJJSSQAJJIAABLSSbaSYATaTALW/yNm1tkltklu6LbSAtISwAAAA23W2wAABJJJJaSSSSSSSSSSQAAAABJJJJJIAJJIAAbaSTbSQAbSYBITaRs2/sktslsk7bbSHJIGwAAAAG282oAJJJJLSSSSSSSSAAAAAQAAAAAJJBJJIAJJICTbSSTaQJKTABILaR23/0hsktkg7bbQEJIW6AAABm242upJJJSSSSSSSSSSCCAAAAAAAAAAAAJJJAAJJSSbbSSbBIQRAJILSTSb+0NslsljbbabwJAG0AAAAG2+kl7baSSSSSSTbbZJJJJJJJAAAAAAAABJJJABbbSTbaSYDCQIBJAISaTbSTUktkhpbbbaAJIG4AAAG223UkOAACQAAJJJJJJJJJJJJJJJBBJAAAABJJICbbaSbbSSTTbAJIBIDSTaSbTJMljLbbbAAJAW8AAAI223WkqAAAAJJJJJJbaSSSSbbbZJJJJJIAAAAJLSSbbW2/9yaTawJAJIJSbSTYTYBN5LbbcABJA24AABI222+kpgABJJJJbSSSSSabbaSSSAAABJJIAAABb+2f/ANtvpbkm1vyASASQ2km0m0mEyS22oAACQAtwAANtttupJEASSSWkkkkm22222222ySQAAASSSABtv/8Ab/8A22kktza3+0JIJIBaTbTaSczJLbZIABJC22wAA2222zEkLJJKSSSbbbbbbbbbbZJBJJJAEltsk223/wDt/wD7ySSWN7/7MpEkAEJtptJLhsktqsgAEkLbdAAibbbbcSWMtJJJttttJAAAAAAAASW222ySSW37bbb/AP23/tkkkrW/2bBskgJAbTbSQiTJLUpIAAJAW3AAJ22223ukgSSbbbaSAASAAEkkkkkklttttkk//wDtttv/APaW2ySSrf7dpWyW0AEhtpN5JskpAkgAEkLbYAAjbbbbbySapttpAIbbSSSSSSSSSSSSS2227b//AP2223//AJLbZJLP9u0n9LaAnpKUlRkmySYCSAACQNt8AftttttuJJSXZJJJJJJJJJJJJJJJJJJJJf8Abbf/AP8A9ttpf/JbbJJL9m0/trQG9JbIupEkyeACSAASRttsAXttttttZJDpJJJJJJJbbbbbbZJJJJJJNv8A7bbf/wD+3kkv/ktJAJIHaX+38CektsukkSbOgAJIABJA22QP+222222Ukkkkkklttttttttttttkk2222/8A9tt//wC2yQEsAkkpkAlb/b/IHSW2X6SRJLsAAkgAAkjbYAn/AG22222skukkltttttttttttttt/+22yW23/ANkkiSSAJLSAE22ASQG1v0mpLbJdJJEkySACSAACSltgSf8AbbbbbbaS6SW2222222WSSy23/wD/AP8AvJJJJJb/ALABJIAElpCALQBIBbSe2e3tkIkkkyZJIAJIAAJCW2A//wBtttttstJTbbbbbJJttttttskkkkm23/tttsyAACSQAJL2QAUCQCQk0AUt/oVJJJEoSSACSAACSBtgT/8AbbbbbbaSR+22STbbJJJJJJJJJJJJJNJv7aSBkgAEkgAb/kgAEgEgFtAtJtp/SSSRYEkgAEkAAkhbYD//AG222222EksSSSSSSSSSSSSSSSSSSSSSTZskkAZAAJJKS2/JALIJAJIAKSbTp2kklwBJIABJAABIG33v/wDttttttypJkkkkkm222222220kkkkkkSSSZJJASAAW20kt2Un8CACQAWk2lSfpJKfISSAASQAASQNt/wD/AO2222220ksySSbbbbbbbbbbbbbbSAAABJJJkkgJLQbbb+2S++28hIAICbbZJOklxsAJJAAJAABJA23/AP8A/bbbbbbvSRJtttpJJJJJJJJNtkkgAAAAEkkySSb/AN2zbbSTtu3+lsBIBLRZJOkgdsAJJAAJIABJB6H/AP8A/bbbbbbfSQ9tpJJJJJJJJJAEkkkkkASSS2mktpJJttJNtoA2bfb+SWy0Bskk6Ty22AkkAAkgAEl0Ay//AP8Atttttt1JK0kkkkkkgAAAJJJbbbbbJIAACE220kk22kmQAAZvt/trZLZaSSdpBJbYISQACSAAAMAACf8A/wC222222skqkEgkkkkkkkkkkkkltttskiSSSbbbaSTbgBIABn+/+3/kt/JJJ0qEltgBJIAJIAAKwAABP/8A9tttttvpJFJJJJJJJNpJJJJJJJLbf/a20kk2220l7ZACQABdv9t/v7qSSSbtZJbZASSACSQAAwAAAT//AP7bbbbb6SVSSSbbbbbbbbbaSSSbZSW22tpJJNNtAW2wAkAAgP7b/f8AObJJJPBEltsBJIABJIAPAAAB/wD/AP7bbbbbeSWyTbb/AP8A/wD/AP8A/wD/AP7JIAAEtttbaSTbIAAtpABJSYTa2+/2aTJJJJ7QktsBJJAAJIABAAAAH/8A/wDbbbbbcaSrb/8A/wD/AP8A+/8AwSSSSSSAABLbaaAASSQAASQk22kG0hWm3xEySSSTrlLbACSQACSAAYAAAN//AP8A+222222kk/8A9tsAAAAAAAASSSSSAAACSSQAASSAAS2km202kCQWmskmSSST9FY/YCSQAASQACQAAtv/AP8A/wBtttttJJAAAAAAAAAAAAAACSSSSAAASSSQQCSAAm20k20WkSAWl8gkySSTtJJEOESSAASSAAdjRtt//wD/AO22220ElQAAAAAAAAAAAAAABJJIIAAAJJJIBLaSTbSSbTCBILSTXQTZJJO0kkibg6YABJIAAJIW22//AP8A/bbbbbaSYAAAkkkkkkAAAAAEgkkkAAAkktpJNtJJtpJANIkEpJkHjNkkk6SSSZJsjDpAkgAAkkLbbf8A/wD/APbbbd6SAkkkkkkkkkkkAAAAAEkkkAANpttJJf8A22/sgKSbRIAZBqwPJJP0kkkSTJLawpJAAgJI223/AP8A/wD22222kvpJJJJJJJJJJJJIAAABNtu2222//wBtv/pLbYCk20mASASfcFVydJJJMk2SW22urCACSBttv/8A/wD/AP8Abb7bQkkkkkgAkkkkkkkgAALb/wD+2W23/wDtpZJJbZAk2k2kyAQAQW/FUXpJMk2SW222kuvwSQtttv8A/wD/AP8A/wC3W2SAAAAEgAAAALbbbbaSW3//ANtttv7JLLJJLbJu0m0m2kQASASSZUcTokmyS222kgAeniFttt//AP8A/wD/AP7bbYSSSSTbbJJJJN9tttpLb/8A+2klttsktkkts0s2/wA20m0iQCQASI1KHFGyS2220gAAW/ndttv/AP8A/wD/AP8AI24W22yWSSSSSSSSbbf/ANttrbJJJLbbJIQAF/8AWwEbf7ftJtAkAkgEgBdbu8ltttIAAFttrULbb/8A/wD/AP8A422iSSSSSSSSSSSW3/8A/wCSSW3pIAAkkAAEpJb/AFoIkv2ZAl+3/QJAJIBIIFc6fLbaSAALbbbb1S23/wD/AP8A623m222222222222lNJJAAAIKSQABJJAALSSX9gIktkKUv2/4Bs0tktsktk9aeFLSAABbbbb0l0g/wD/AP8A3G2Q222ykkkkkkkkkttJJJAABaSQSSbYAJSST7TIlslIF+27QNk3/wBiTJLZACLxk+EgAC22235JJLq//wDbbb623/8A/wDttttttpJJbSSQAAW0kkkk2AAWkgLJZCTISBbJ+kTZv/syRLbJACSAYvZ1EgW222/pJJJZh7ttu3//AP8A/wD/AP8A+22220kkJJbSSbaSSSTaW1NgAslktktkJEloBe2/2RIl/wBkk0AAZfxfJUQW2229JJJJJJJJtb//AP8A/wC+2+20kkkkkk33/tt/ttttbbJbbABrJLZLZLYCZLQAe8mQJf8AZJoAEq3Opl8JSqFtt6ySSSSSSSQCSWSS3/8A/wD/APSaSSST/wD+23//APJJLbJLbAJLt7JbJbJCZLZLaBLZt/kk39J/vQ9VPtu0ffkW35JJJJJJJcNttttv/wD/AP8A/wCSSSSTf/2S2222SSW2yW2SWy36Wy2yWyWySkCSyW2wJv8A23+o/eZ+23/2CPVRfskkkkkku2222222/wD/AP8A/kkkkkttsktttkkktpltklkJEl+9ktslslpAlkltkAtsltkjeij22/8A/tJyWTafZJLfpLP/APfbbbbb/wDftskkkkkttskltskABJEtstlJEtkpS9ktklsktktsgBtkttstEVVsltskkkksbFq/8t7/AK/LbbbbbZJJbbTbSQAAACW0lm2wAASQLfumSBbJaALdvwCTJLJLZJLZLbbLHdVXpbbZJJLaaSSAEUXi2kySSSSSSSQACSSSSSSAEm20lu22AAG9rbKmyBbJSAbJLYm9JbASQJLZKSADd791SSAAAASSSSSACeQcS2SSSSSSSSbZJA2S2QAAAk22ls22kgCZJbYm2k2mwCbJLASJJfsyAJbZSQABEJ9zW2kgCCSSSAJJbbbaSSSSSSSDbbJJJNm22yAAAk22kICSSQAS2ASm0m0m0m0CQCSJLbKSFt/9SQAAWb9gW2kgAAS22kpJJLbQSSSCSSQASS2kkkk22220kACWyABbaSACSC1C0m02km0m0iQCQEyAASQC2km0sZ9w20kkACW22kkkm2yASSSSSSSACSW0kkAAACSSAAASyAALaSAm2m03t/Ymk2kmk20kwCSASSAW0ASSgati2AAm2220kEkm220kkkkktkkkkkkySSAAACSSQAAC2QAS20km2m03t9JWt/t2k20k0m2kySCWgASbsIviwAASSQAAASSSQkkstltttttskkltySQAAASSTIEv/tpL/wDbb/bbWS2StL/6W5P7bfb/AGybabaSZJmLj+KAAJJJAAABJNO222222222222223ttkkkn/wD/ALbbb/baS/8A2yTckgFsktG/0tib+3/2b22/+3+22/zCp+220xJttkkklttttkkkkkkkkkknv/8A/wDbbbf/AP8Atttv9ttt/wD7JN2SuSkAkEyS2J/beyVpbf7bfbbf/PyH/bbbb/8A+222/wD/AP8A+2222222W222/wD/AP8A+222/wD/APJJJN23bf8A+ySZkhG7QJltAJAJC9sja230ltSW/wD9Lcetttt//wDbbbf/AP8A/ttttttttttttlt//wD/AG222/7aSSTZICTbbEpIAJG7SLX8AJBtkhIBKSTQAISSbaUOhxySSbbaSSTbbbaSSSSSSSSSSW222QBJJJkkkttskiTJJAAJskpIAIz/ANyQfkm07JCSARJLSACZJv253ecMlJbbbJJOSSSAJppJJJJJJJJJJJNgSSSRJJLbbZJASSSACbZKSkmkSAUl3tvxDtm2AZJbQASQJbYVPeWclJbbZJJKSSQBtpJJJZbbbZJJJJIICSSSJJJbbZJAQSSAD/8Abf7bppJtAkJNotpL/wC92/8A5ISRLbYMfuWMJLbbJJJSSSQABIJIbbbbbbZJJJJJJbbbbbJJJbbpt+2kk20k2kmmkm0m0mQC2km02Uk20k0EmyAJleUPbaABKaSbBBAAACCSSSSSSSSSSAAAAAAASU0kk2/tt+2kk20k2wD/xAAuEQABAgIHCAMBAQEBAAAAAAABABEhMSAwQVFhcYFAUGCRobHB0RDh8HDxgLD/2gAIAQMBAT8Q/wDHxH/cA4MGDXInlZqRkhRGHQeCjBHBwA9Q3ZQYnkZg5HxP+Ngo3JkAgo8Rkxx5UDB0UwVNuUjcbj4Nuf8AGQcDkyCn/KZuwHk20gJOUCEfxBMG8e7Dj/FxgbkyCmsKeGA8modQ248jUdQP4sBAclThl0wHk1TCLBkbNC/T+KASAHJQWhy/NbzVw4jFoZ+Dp/EwCSwQxAYpD8nWEQHBgVbLOlh1H8SYAWEXffauk7F3B7jlxwdpgB4Bdice1QAHMkVYOch/iMMcbjOjYPOth0KIgMRA5j+HwYY2LsTjddUEp2ATIlc9/AJBcK5d1F/ujDiEWon4PP8AhzbByeT4FQQGYBXRCQ8nHtQA7BCMo0GYFg0mNQ/8NgAwseT4FQAHMkayPXH1SdDsiMv970WfxDI+ojT+FwIcAvxOF19IfBLTT972+qZ7gnlagQQ4oM6jPkfRbmf4U5AsIvxOHepiiwtN+GV9S1FOD1QlwgQcip2JN96z/hByAYZD8l3QAAYVDLnzPj3VMIMoPX7GizyEBzEuYhp/BygFB+aIAAwlUT/iN33VykrxLc7aArfIhmIjqmIgf4KaVh+DK8oAAMBUAtH0/WIkkuaxxLYjO39hRfhWLO3rHXhg7skkDrgPJQ0JgKhkiJS9/poiI5NFwnT0poAQQyjQfhWLK0co6fwOV8Jm/AeUDjYCQqHaYkyCJzuTQJai6Bei9nPsNAgGBRLPBhkYj1p/AXYYBM+B+gh0DASFRytC9HxYmiTTBoOBIwORossjAcjLke/ER264IzPgY9kBCYKgkT+9iiakUHsZiB0oSsQb9lNT4SIOY4+aIgEz4GKARsFQSnYBWEBIXfdIyrURS7hRZ1CE5j2O3HsuQTN32h0bAVBARgFdkJDyce1M1ogpgQBlooM/iGY9y148l5Ambh7uQ+NgOuJqAA5kj2Q64+qg1yEXMeaLMCwazGhfpx1zIG4fpIEHDubzUEsnb3t9VJlUiiUBZ2tRAHFCHEYtDPwdE3HAMPM2AXoOHmbSbzUxZYWm/DK+qMqgU41nBpZ60oGQHBgVbPOlh5cbig49ALyhzWNpNSy58z491ZrzSDKD11oydi7g9xy42HxuT0xKt82m81Ld/EbvusKNMVF4tudCyedbDoUVAYiBzHGgKNyfzlTNlM3/AFUgtN0/WIkkudjFS4FbEZj67UYcQi1E+cDz4zARuSppCmf1lSwREpeyiIjk1xpBUicwRQjKNBmBYNJjUPxkNAck2ZnM+BhUv0xJkEbncmvM9gcSnJkfuiywiiMj6LjTjAdA5Mk5jE5nwMKnlaF6PixOygq3hlI5H89FnEZ8j6LdeLwcbkyCm4KZuwFSSL/exswVjG8xA6fVAcMCGORU7Um+9RHi0YG5KnELpgKklOwCdiQkNmAVsay7rKLJIRMxLmIaJuKwIDkqasumA81JwRgFckJDyf0NnAVpCEwIIi2gC3yIZiI6ogiB4qBEAA5KCwOXT7qQA5RbJdcfWyH5FfOcx5ovwvKt6x14pAJLBCADjkLvupdk5c9vrZTLYhxFna1AAESoPwLFlaOUdOKJpiA4Rd91UaWFpvw97MZfI2CJJwaWetKBAM0azwYZGI9acTwYsAuxONUw5Y2nx72c/A2FjeRgfHWizyMByMuR78TQYo2C7E41TF7Fh97QdkPDORzFCXCDKfGRB04kkCyHk+KodpumKJJLnaDLZDmUpMx9dqNiKE5j2O3EcAKFg8nxVXrKQR0Ryd2gGcIoKlGg3eIZiXOWvEUKLAL8ThVF3+yJZ53e4FZEZH770WYFg1mND43225XoDgF/13qj08ArLVgu3hcBbkfz0YERi0M/B04SatKYHhF/13QAAYVIAcyR2xJL3tTj4PszCDOA+OlAiA4KI+10sPLh0zRD1+kAAYSqn70E8frajRA7JEsoNbPVGCNi8HuOXAbbC1QWRh1wyQAAYCqmiNp8bUVMHYwSC4mhgLe9tCyWNrYdCjobEQOY3W277JOeOCGBMBVQqZL2iSS52o1A2NolzHmjdZHqJ84HnuZk28G+AkZIVsastmyGQ/PvYQZZ+KEIJGg3iwZizUONwsm3Q1cASYIpuw1tNWZIggsdxjZIin2WeqLLCKIyPouOBm2F7CWQXesGIEDP3tYbYexkYHX7otcyfI+i3XeDJtzMOvUitMTGHpRQBmHpEWBjjtBD1AbK8M5HMfnoCZgQxyKnIk33qI8LSVlBXjWB1JWZfmRfb9eleDKP2iLA2eykPSA2Z6OXcPqiwScWYl0hpvxtqcwk2ToekNiCsDq4GUPpF9vselfDKP2iEwNsTUAA2cZnCKlgGgO0yIZiI6oggsZ73bYmrIipREEf9SB2USwOpKzL8yJ7fY9KcOyj9oCTA26njLIjI/fei4je629Y68LEgMkMsRN9z2hLjjaBbA6kLMvzITy+x6UwflH7RBJjA7muEtytQLig9gsXkcu3C5R0h0BRqAQcHMldDNBBwU+0DmEHNSkNl+ZC+X69KePyj9oggsdxtIM4PXSgQ81cMDDIy9acMTsh5HRE4Ic+QVe7NF9SmJbNR8n2kYwg5qShskLa5qePyiiCCx29pKUGtnrWixiMByMuR77hbfcgKCnFEyMjD9C/0VAyj0VrApBFPtABhHNSkaChJJzgpwekeyIYsdrBILhBvTvbQkwgymxkx04fmhlazq4K0mUfLzVhCipw6qSB2QAxG0AWEc1IRyH2hJBzh7U7dI9kYFjtDBFsR5o2AITmPY7cRgtEKRFASIicE34SpmXzQPWrnZoS5On2cOwjmrfZD7Qsg5w9qfukeyw2Q9gEMUg0GDnMZiXOWu623C22SQoKcUTIycOx0UjfnFB22StAM1Iop9nkcVb7J9qVBzh7U/dI9tiejn2GjCQsGsxoeK5oZWs6uCLtZT37qQAeiJlI6qTKBdPs0virbfmKlAentTt79q7BBhzl1o3lR6W+9OEW24FohSIoCRTaCKPCVNCDmrhZKRszggjgvs8tirb/AJipRHp7U/8Av2qgSIhYggGgAgHBRj9qGVnStZMm+G4ikhQU4ouRP3a6KRuzigvGpuWzUoin2aURUcM9XdSqPRT379qYkOXCi4M48eRy43MgACgoKInCmj3QMo9FJhHVSYT7NKoq3P5igpRzh7U/flFEMz5FAmMP4CAACQo2IxvR0KOhsRA5jfDJkybcDbWECCHyCfgRAcoD3qwBRc4dVIueCAGIT7a2yO8T5wPPejcBBHkghRJsj4kCAzii5EMZfRXmzX0auNmh7k6faYAEYGk+j8CtvEYk/Lp06dHSpgZWs6uSfuCx5K2kc0BKOUFagfsFJop9lIBDFFvYR66bmZNuBk27QiNBinKSKOqBaIUiQGRFTgvdCkQHoiZw6qQPZAg7E5LgPRvHBbbqFviA6AARKcp3ULca+SFBziiJECw6spkQc0H0q52cEEcnT1rdJ3PB7bmBgQDoBvg/MtSaqmBlazq5IIuGHkrYRjFA+NTMtmpJFPUiZyYOU+p4AZNsTJtwgwhB8n5OIbOIRCkSAyI6cF/tCClB6KTSOqkSn+XRURykLsT+iiSRJmd9sm2xkybawQ+T8BFCMNskxQU4oiRW2CnQnNkOgAeaDMGMPaJJOZ7QybbGTJt0smTbGDkBTIfJ+Ai/hNkyZMmqxcfgKIROfA7Jk20Mm3iyZMmTIYfiKIRvmfwNtlD4RRCJyNNkyZMm4bbeUx+IoyHFbbuCBpzYzhxg26RWT5PzBkbYyagyZN8smTfDJvhuLAhpiY+PG20GBCkXVxeybdQUjgH8YAcoTQohHJ/GBgUyFEKUMOMW3PL+I48m3UZvE/8A/8QALREBAAIBAgQFAwUBAQEAAAAAAQARMSFBIDBAYBBQUWFxcLHBodHh8PGBkbD/2gAIAQIBAT8Q/wDoOuVqe2P/AGbIfrLH2f5h9v8Af6NgFKCO4/u+f24DSUkOjQP7Z5XfdyJKCVg0H9t4jDakIH/vz5NfeIBTQj7A/X35GiOHR/D9FlBbiI9h+vKpVyaPU332oFsZ/wC7l6lx923SX3+tZlz/AEfxzBUJmGBv9Ebn68e/8c7M/J+fojr203fX+ORmDzO8LibQRLMfQ/VPpu/jkIqIHz8bNmOHUOfs27svyK23+X8cgFaIB9+ABTERp4Ke8Oj9Dabf5fxyKuVbc8WrwvUDD8nmVy5fa+qfXd/HJz3PHcHDcLD9zyy+3tY2u76fzyadXJ1n14HLIQRxP0Iq/wCD+ejT/g8Nje2p9B6n+L+Yt6vIt9DmWBwfqD8fQYD/AJoqtvIznHNsDhUY50ftyr76E7j9Iqrc8i7riYxw0ymVxClREaeCjHGj9voGVBl+kRKa8hH7QAKOALlcCRK4aPc4MT3lz87/AEBoBlj94yS15DuiAKOEONOC5OGhPfU/v9x9APVCwR0lryEVEIUcJ0KseYgFge/rju4Iga15CKiGaOIzzVlvThuVn7H+e/bC52I6fXkArRAPvxnNIOjLA4KBYw/Hfm/TYj19eQFyrbnkHOYuFUrk0f78d9f+FD1iXk+c55JnkvDcHDqXH3bd8/348r9Tq5RyHjqt68AqshgN/oD2Obrqn/B4cj8n572Sz/8AChyb9WOacbyLY4HA7QRLMdiX019U/wAcvrGxyc5xzjieTYcLWufs27zRPpLC42OTZ9oFaHOMcS5KCUxEaeCrXDo95IEoJ7QMHJRwAKOkPLofdw0Czh+TvB0lBPTAwcl3RAFHkBYHDcLD9zu9ElBKAYclFRCFHTHoBYshAE4e6b4AFuI20OSiohmjpi83WPThuT21Pz2lfVKBbHf+jkgrRAPv0ZngXm5lwcH9l07rUC2Ov93JzKtuekPF5+LhVI50ft2Jcvob6Na1Zb/1crOc9KZ6JYEdOCpHGj9u6fZH3/jlV6umPF6Ci3rw/rL8+V34XL8b8rvl6lNN315W66c8HphqT31P7/cdzahtN3lX6sdQdIuDgQcxCLA9yWW3y8rOcdSZ8HorPY4bBbfZ/nuOm2+XlI/aABR5aQSmBVPBULGH47i1Ta7vKd0QBR5fQ8KjvJo9iXL6vLNd305SKiGaPMLA4da4+7bzm5fhfkfvn7fzysyj79VUtK6b/q8Ao2QSO/lNy5fhfmFX/NFvV5VGrPVHAqPSNZ9OHM/k/PbgD/NFVt5Vmrqhxp0lwcCkdoIlmO2hqyRVW8q9rjqzHITo8fC1Pn7O2Rt3isuXUHmygkSmuCiXDo9sKBbE8vnpKLevDULOHten3I7bzCq3VrrFzw2Cw/fte6npHPOBEG8dQNchdLcHAhDJAE79rZoKRzxTEBh6iD7wRx0pSXwr01lvThsT21O1qL+s2XRimIDvD1EH3hrjpha9OglMRU8FD/dT47V0iJWjH1GOmFMQGA3IPvM48q1DhUA50ft2sOszEGmbsIjT1ApiAwG5B95nya4OGgHDp+3m1y5cuXLl9WTTNWNYDoIDhgdoidSKYgMBuQffyTXfXhqf/fz2xhUVlUBjWEwiu0fQxOKM9SKYgcBuQffyDWfThoT31O3MkRONILDAZIvJHYYhiJZOpEYgcBuQfD1twcCickIsD2+jIitqnqoDaDsimIrZieSV1AjDA8wG5BcPU2Bwrhbfbsm5fUuuZsk2TAY1jmEXj6WI7RRnqBGGB5gmSC4eloJEprgqNm/x3RkiJxpBYYPJE7RGzEcRLJ1BgMDzrA3ILh6Ki3rw0V5NPIbly5cuXLly+wkZEVtU9VAbQdkUxHYiOTqDEYDMEzME86x4dTY+7bue+Q65mwTZMDjWMQXi9mI7REz0+EYDMEyQwnlilOAUbIJHfsW/LskRONIDDB5InaJ2YnFGTp8IwGYJmYB48/Dkfyfnsq5flhF3ERhIrkjsMQxEMnT4RgGYbhB9570I01Yt8KEdoILMdoXL8lyxj4PhUE6EcgriL2YntK67U+fs6S5cuXLl9h31k+FeJs+GSInGkFhhcwvaPpYntFGeqrfR072WOCpUqDRxIyIjaeiwW1zdETsxHESydMNYlL6zvXM4EErNGHlczYIjDB418MUxHaYnk6Owe197gERh4DU125+SIvjSOwzeQn2i9mI7REzzs3z+DvXW4qIt8O7o0OSI2j6GejubgqJ2YjFGTlU97696vUx2+J44dQRkiMMHjXwhbDEsRyDhsDAVod6rSPieJ1/PWZQi8aR2GIzDbdFc6TVXWBRR3q6DMI8LB3zvr80xjxCj5ncuXLl+N9pXLly/C+N+A8LNPwfRqPCwUB9GNngeHL9GciZR4TZPfue5fmVnxC/oyZOMNPfl9a9XjD9H0HuXy75odTyLl+Fy5cuXLl8q5cuXLly5fBcuX2HcuX5W4mEeI5d7X431+SYx4hq+e4bly+vuXx3zzGPEfMV+Fy5cuXLly5cuXLly5fbJeLB3P//EAC0QAQABAgMGBgMBAQEBAAAAAAERACExQVEgYXGBkaEwQFBgscEQ0fBw4fGA/9oACAEBAAE/EPRY8SP85j/U4qKj3NHjxUemx7vj1aP9/jZj3Kemx4kexo9APZMeBFRUVFR/gEeXio9ox7Lj/HY/+OY9Xio9aj3DFRUbUerR6XHsGPbke9o9Ij/Ho/xptmPVHVTm3b5funkDjNUdmo2oYqycT0OPfAYDSrApgr3+P9bC13WSrPBcTeebj1WPZJpzyqoYSz/q7/jadUuRKtdrbUeWjz0VHuIC55TKobJ9/wCXf8eBCvHKHJ8lFR6JFR7GjzB4DSjYKvTTcxWr/W8KbU9fM+nuM9RIsCUYAq+lFhsvV+jw5RLMHBh9nP8AxNCIAlVgCnlFHBeru0OfDw1LhJHRrCQkQyczr/iKgKoASrlTIqBu6teGhz8aVTD/AL/Xf/EN9Sm2tjN+vnwHbDA5VoFFJKSRegMc6hpki0+OZzDZ3h0amZ0oEkhI6n+H8OE+w/k8Mdt9zwHy6BrRyx7hh8Jvxe34Ms6BIHETMolOyGOez0zOZls3el+ph9n+HcMge03fPDHbjAma61eUIRf1Du30j8jFhyHCHBvU3Oz3jGxeqO7YPWPeJ5yBoIHobtXwDdiClTgBWIsiXBpddXlhjs2UCt6S7nZsCzU9Mk5L+Hn7iPSYuBs7Pt5eACAKrAGdALNx5n2z0w121WF+3I3XW3OmbkQiXHYkNZngf8n0yNiPLx6LHnuAMzDc36uXx4GMOIfDpdhljjh4FtF2MDJ632DfQIO8rCTA3bvZEehHnuFWHab9+XHDwOHsfIWmhnjhE+Ddoa3i5PS+ymFc5bj3+fNR7PPPRtCn2G/440vgYtLJsZm7nfr4agBCEcE0qBTctzd+x7bCXODA1VmrODJk+TioqPOx6SeIHnhDfCxk/nKlVlZd/gB7kWSWTdq8jcZFgCAGAGR4l95ZDXdcmTk2ZOTe8Mu1uXjx7Aj1UUAsu4w/ehzpVKqqyqyvgOcARivm+DlQIVDQAy2DaTIwN64UkKtL6hKHKHSerCoXjHCeQ7WN+G72DyYeVTclHRGHYikg58cnr8/4HIwS4g1d+h/LpFLKrKuvgX/wWPBob2XWi2xj+XVc3YUtvGeA3vYFypI6QYg7jN3t/wATSg2lEI8awBMWkm7Ec5N1LWTEU3u5vOcbNuqFHKw9SHk7CQRhM6HMugY/iPYcVHmzyEeQsoHIxDq/RTlkSplXwBIhuDinfoZ1CcmLxSZrsnsdgNhCuVuR12p7kBhX9lnTaJIFYGW6dMnlP5sjLe6RxJOezMCx55j2+PXY9h2vllMBq/WdJgdKYr4GKXKcUmQVI8zU4p+jLZbmDU3F2pSWVtUv3tqErFJAmJxO8OVbn2gCR6bF817oxDkyctjCzA3010m4D61HsSEEHv4G9u+adu+UxXwENtgGWq6BrRiCEx3+gZG0puI3GfgyGhc4yj5hy2L9E5jFgOhh67Mgrs8T/vz7ePPyGAv/AFd3zTg3ymfgBBUNdVgYxFl9Tu3021K3HbwVKYHONz62J5XuzRCVeqRPRk8yHnsSuhOa/p5eyo9StUzRjvd1JRfK/wBl4Bv1ASpwArESRxA5d+rywx2zA3vbwUCXYtQfLZYKRtal10k5GzJCe04PSPYUesaMRJdfRq1n905G40PABQBVwChEneEfbPTDXwWNxYevwbyiBp9wtmI7EHJuuoUmBSJiJibEslqDgw+zn75xFlibv9atdoMgyDQ8HGHENgyLsMsccPBhwnuzKdvBgNq2GPGI51jfXas6RkFjCesOwUOEkTJrVWEMnM6+1TYjwjyUVFIUlwPF6H7yqQIrAYDQ3eCe7Y+UtNDPHDHwhQwKuZFLiJI7ePexUyIX48nbvyYVihg+XI2Z18P+p8PXzUVFRUVHthy1sAxehSJL4BgNDwcbtk2Mzdzvhr4mBxKtlHY2bSolABKuRQuCAMzV31O2gkIJmOdMUJNtbn6cti6peTUzOlInAFajh5GKjyMe0YCwsBitDfTlIyHA6H7z8E/egySybtXkXwOg4BADADI8TCrBRP8Ac47VjtXiyLHsebwc3Le+u5WbK/Et1MPs8SPNx7M3CZYrob6wnhY2x/er4LOFUOK+Z7HKQQqGgBl41o4BOh8m1nrgFzAOk+CAhebic+WPKo3DHeMbF2I7rg9YqMtuKjyMeDHrkeAeHn51quhq1oZUlh+9Xwbl4LHh0NVkUW2MP5dVzfHjQs/mH+tmTINFkXfQecUGE4AsCwdPCz8hGQfcOjsFqn5knLfuzz2Y91hfLd+jVq7TPHU7/BBiCycU/RnWqszxSZr/AM8hZTHHiNljJsyZYWcWDm8P7cA4OZJz2ZeWJ4H/ACe34j3HFRUeAEkspU1RbwN7v+PBxU5VxSZBUq7NyNU/Rl5G0P0y7CKXgZpg7tQdQwxEvsZefiacD8AVzlLlGw1kGDvKwqAN273abcspgFQAl9/5d/x4Ln3wHddAzatggMd1oaDI5+SsNnvH7GxdFxLBNDoS4x4sfIwXFVuizydmUdzluPf5qPdYYTyjYKu/bexWrfuy8EMKhrqsK2IsD6nd5eTt3GHyk7Lsad6N4xh4EOXimpYdgohOlSBqwXiLmI7D3SEDqrNCJIyODr7qMsaUQBrV5K5Sy9X0eCF9QEqcAKxwkcTQ79Xlx8nuP7N9KcfwNlaMseHcsOdYsvjXcSwOa/k6bMrp6Jk9LcvdKIAJVYA1qUiqQwVq7tDnw8AFAErgFHziAPt2w18ruj/5LVM1TipxUeOgmJhOTdckKfc0jESybFrQJ8cnr8+sx6eoFUAJVbBTIiNd1au7Q5+FBu8BsGRdhljjEeV3RnvppyyIAzaMolWYONc0+Qw+YBgCx+HYJBGEzKKdwHCx/fP2+beBLYNalNseJ/nPwguPCfKWmhnjhjMs+WMnr8ymg6ZNWp4oOdcfIYrsNxYLOcuYbMxbDnmPb49zZJFj7T+Tw8LFmd2vp3w18xIGAnfTRZ8H8Hp5H3qzBzG4dLnLYeywG+n0knAfccVwxg7D+TwxnwcfREs6F+XLjQ4XAQAwA08xIP6qjOomwDe5/R5Jn1JM0s8tkm/dnifp+fcQTXDPZ0N2rnU+DfNQQMDRvdsayNLGH9n5lwOiZVZEzKmAGZieYdIo1oEdwA+PJANPCFIn7oQo4wDE7EhoTzn9PL3F1tbqPt5eEG0MSbwv1m1Fe2LxWov/AD0/NCiaFnnskhJ7Lg9I9Bio9e4XTsNx11csK4eCzmE+RdAxWow40K/6DI+19QucLgrh1uc6SGEjYkGtdDD7Oft/hjI6Tfvy44eCb9QEqcAKZDZzeGl+XN4Hmtw7V1lqa+8J1BKBOuDKcoNZDk4OvlbdGFYEtnKXJNhUUSRMmoQMRDJzOs+zzxuGWPYfyOPh2S5wLpm7x0N7bzBTqSqAXoMFvW0HGsVCSV3qXWppmNYtPxdvuoUqibukuPcyb8vKSsyJjFdj8PLZmF/xCfD19nHjQrgLeX+cqx8K/SsiwM5oy1dxfHHzLk31r4EG9ScB1201Xz3BmdYw4Rp5MMTyMEbJU+6INm3XMTYutMiamZ0pywQmo4e2okJCVxjq79DnV1VVVlVlXXwmQkjQtPIu/PQndQNiACADADTzIShrSslu3lnInnth8DjQMic6hFI55Vj1JNyeTxQsBpdfydNm8Uv1MPs6e2SQDpGbq7ipY6ZeKcXwzUBltQl6WOXmlQpiClO6lSvgWhTLx8m40xAXiLkg0zVp2SMJsThR0VweTFYY+dio/EermJYVkGNG3Evj39mvhoApIMpTVCRDMSTzRYThN6MeHpiDt4AkwM9X68pbglIwBbqs83ZkRkHKfsh5+13jz+jasdK1oueL4ly6PwZTcky1LccGHzWcvswDB6kuvgREsecn4flOqUpRc5y5xsydszwP2T28nHsRZ6wXSXenbHin2shWDTEOclDovVdD7CjrRlz1PMPTdLk4uGI7lpzQ8YR/Y7a7YqS8EdK/lE1fyffg5MnLYaiCJvKwJkDTU5NvxHtQIT/IKDXR44s4wSupUKCOT77Pelwk1/udagC7zffc71Ik8mep5UJHUhZyhy0cTfhTnPGJLXAThsvXMJhckZcePDy2nEjNPqHV2ZC3OS4nWOvsk8Vjy1Z5CdI61OWxv+lHkiwDghHMqIJnku7HvWHxf9jrUQX+b77nejD3gM9TyWNgMqcmnQnD7Ad6LxCc7LRCrNivU+qC1g2hdTJcA8vEEY7khoQ7htYz4OOwl9sDqrPahEEZG4mZ7VN8CTMtDucP/KTgQSyigTgMtfLQxnMrqVEDByffj3psLNf7HWo0Cua7sO9Bn3AA6npWGcSGldzs2UqpTkZuluXtZhCES2HR0dHruTlEAhGoI6f7ogAOY+Y3gPa6lQIJyffZ702NWTv441GiPNdzbvRhHwAOp6MEWMs0ud1udBQCJZHLYthdQyevz7IPHvwAi34bpubUmGO8i03/AKTSoELCYdSrUe9Y1qxpZQkiJuqfMb5HtdqgQ/kuxD3qK1X/AGHOowe5SurbvRRZwEOp6HZsO3gLh7nmbAqEYTOjmcBuiz++ftY/EOfwsByXqfWOSfQ/NTichYekKcWTNR1wrQzcml+1Vi6W5Rk8MfM7yIpdqiABkF0Q96itUEHY+aihHlL6tu9DkPBYPM8/fcexi4T0h2U/7Dlse3x64+fliJtpUousR3kGpxRyJOk371LJmku5J3qzmGk9ZUtksrvmuxBasG8UmsV26anzG+RDLtUcFMgXohqLT6U9GHvUWNdZ/TvREz4JI8zzYFhImCOJTiluzm3XRNhbrYb6SuScB9cfQizJaokfuF1xqfX2aR0lRpdKV3E/FTrMsl249qtvoh7GsEDvIpXYL1mS0bUIkjPmLp2xaXSo4AZFPYaikmjPRh7tRIr139O9AbiYJI8/MY8Ta1XXJk5mzP29PE/T8+45bxkh0anHXCroW7VPqOhPUip5yJYekKabPmodcKxEncoM3iq1E3IoGQG5qfLz/wDvpdKiTTRT1g1GI9COjD81Ej3O+pSAYVgLjz8piySerJ5MPKpby6YMOxNCE85j++XucUImzlU2tsR3kGp1ayAdBv3q/EaS7knerEgZcesqlCQxGaFYXeorFS7yuxQ1Pl5QWZvB5FRZm6x1QqNXOQ6DD81FA1g/YhQiBdYJcefkbAEmGUA9SXXYKnqnseD0jp7qLMlqgDt0urU8ss2jpIoMuiK7pfFOqRsj249qcX1SOzWBT0pX7+sRTosUI+XFZhhg8TBqMHmvmIVGKWS+h+ajCcw7QhWIJccHLxcXH9BxPTZv3B9D/wBHP3fLeckOjU+6gVdrdqmVjQnqQ1KpyVh6QptgTNTqwrF0d5SMU3qawIrSygJQm58u+MJkgPLCooc09wh8VEIGYF8NR4ow7QhWU5OeXgqDEIDmONMjMybnJPrYVFRImTUBWMhlmOvpUeyBQgWNKk1JiO8g1Nr2QDoN+9TydpP7DvUmEZcesqWJUxDQMF3qsTT3KInhjU+WeEAzR0YVE5jPeofFRqdioXw9qjx9h29BrKctdlwprww85v3nZnE/1A+Hk+9izJZqIfwNUoSOJjSFhcDTmbxKXz1FW8Ldd812bLV8FM1ie3TU+WcIYzXZhUOZke5Q+KKBZzId4agTRUJzSO9RhWp++prIXEDqFoNC7SqmEYqsrs3uUFNTM6VHgYmo3PYp6j/URL6puq+rsqRiJpujhTGJzKDGUA4qwUkD8y92FfIEj4pXUC9YMR0bUBJGTdU+dnVlepc+zp7OPSNyl2X7oPwyUV4KHSrO4/AaleFBqSUmMHUg1KuXAHSb96lkbQv2HepIMZXelSSQmJer9gqxWfcijpI3M1PmZiR3bDvHvbnv4Sh+b3H5WAf0E0bBZks1BDbruak1xm4dGSrpRow7y+KdYdkuzHtW8YBPmgdUUVmB3k12GGp8qxIiMiUB+U+KX7z7iPJ79N6r9UfxIgFXACjBQHOyp+PA0yAchUzx+mj78JW45IOjUgrNVdrdqkF/QjqQ1JQJh8BCnmOM37sKwC+jSez3rNxosUIknkoIsvdZ+/Zh6T/PAL90aAOuvQCuatEgTlSSEUZhEkC41Em40SHjClhQqSX2MHUIallvIHpXd6kkLQP2HepMUfwSpIopiRNDghvU1kFaCKFkBuZqfFlz0elEVH4io9jznR6AUXDddoTDMaUKw/hoHI5qlPx5IsyWahgt18qlVBmodGSluk6Rfk+KQYFkuyz2rf1pD3oeA71FYuO5Q3SGp8FFiF8hsdg92xthKFQbe16qYhdo2KFYfw0WtY92oqPKo3HJB0aklhqr6dqll/QjqQ0uqJh8BD5qSh2bPVhXZvs1iV8JKxGOkw1OwAVN/wCTV+KBsAAwAwPKx7CPOjKXK9CYzVzZqEChY/HB+HCpC0Pl82KYKcKm11jB1CGpBZyB6V3ergNoH7DvSLBGYPQaLclIpqe/6JaNDbKOwXebQYXgEAbj3r/S0qnLQqKo2PxMPxgqJaDt6DHr2XgnkYqPPcah1t91fNKiqFj8TD8YakGkOx/h0VH4j8x+I/Ee/wDKP1Uqd9RVCxscNbzPk/wQ8U2/4WCallvq0o7FQVvmT3/xji3pgPur9q0LNm3CJoue5zxT0ST/AKA/4qKk2UbbDdV8FB/jHDv6y/dR8GjZWA2Eg1j19Sio9zf3xBUPDoWVg2EBah3/AMYibV/doY+qhoNmyxawfD/jFgd9L+cKtQUCxRrD+HCuNm9v++8T0f8A8sga5AqKo2KNYfw4VNphfH+Mbiy62+6lO6oqjY/HB+MFSaD7f4xxp64/VTr+KFj8cH4wVEtC9bj26wGRei0STvoUYD8cH4w053KHY9z/AP/Z";

    /* src/components/main/Slide.svelte generated by Svelte v3.19.1 */
    const file$4 = "src/components/main/Slide.svelte";

    // (21:2) {:catch error}
    function create_catch_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = img$1)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*error*/ ctx[5].message);
    			attr_dev(img, "class", "system svelte-1f6j6fs");
    			add_location(img, file$4, 21, 2, 676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$qData*/ 1 && img_alt_value !== (img_alt_value = /*error*/ ctx[5].message)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(21:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {:then qResult}
    function create_then_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "data:image/gif;base64," + /*qResult*/ ctx[4].data.file.contents)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Image fetched from graphql endpoint");
    			attr_dev(img, "class", "svelte-1f6j6fs");
    			add_location(img, file$4, 17, 2, 537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$qData*/ 1 && img.src !== (img_src_value = "data:image/gif;base64," + /*qResult*/ ctx[4].data.file.contents)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(17:2) {:then qResult}",
    		ctx
    	});

    	return block;
    }

    // (13:17)    <img src={spinner}
    function create_pending_block$1(ctx) {
    	let img$1;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img$1 = element("img");
    			if (img$1.src !== (img_src_value = img)) attr_dev(img$1, "src", img_src_value);
    			attr_dev(img$1, "alt", "The image is being loaded...");
    			attr_dev(img$1, "class", "system svelte-1f6j6fs");
    			add_location(img$1, file$4, 13, 2, 439);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img$1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img$1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(13:17)    <img src={spinner}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 4,
    		error: 5
    	};

    	handle_promise(promise = /*$qData*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "className svelte-1f6j6fs");
    			add_location(div, file$4, 11, 0, 397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$qData*/ 1 && promise !== (promise = /*$qData*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[4] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $qData;
    	let { filePath } = $$props;
    	const client = getClient();
    	const qData = query(client, { query: GET_FILE, variables: { filePath } });
    	validate_store(qData, "qData");
    	component_subscribe($$self, qData, value => $$invalidate(0, $qData = value));
    	const writable_props = ["filePath"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slide> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("filePath" in $$props) $$invalidate(2, filePath = $$props.filePath);
    	};

    	$$self.$capture_state = () => ({
    		getClient,
    		query,
    		spinner: img,
    		warning: img$1,
    		GET_FILE,
    		filePath,
    		client,
    		qData,
    		$qData
    	});

    	$$self.$inject_state = $$props => {
    		if ("filePath" in $$props) $$invalidate(2, filePath = $$props.filePath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filePath*/ 4) {
    			 qData.refetch({ filePath });
    		}
    	};

    	return [$qData, qData, filePath];
    }

    class Slide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { filePath: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slide",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filePath*/ ctx[2] === undefined && !("filePath" in props)) {
    			console.warn("<Slide> was created without expected prop 'filePath'");
    		}
    	}

    	get filePath() {
    		throw new Error("<Slide>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filePath(value) {
    		throw new Error("<Slide>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function folderPathToBreadMap(folderPath) {
      const folderNames = folderPath.split('/');
      folderNames.shift();
      const folderPaths = [];
      folderNames.forEach((folderName, index) => {
        const parent = index ? folderPaths[index - 1] : '';
        folderPaths.push( `${parent}/${folderName}` );
      });
      const folders = new Map();
      folderNames.forEach((folderName, i) => {
        folders.set(folderName, folderPaths[i]);
      });
      return folders;
    }

    /* src/components/header/SubFolderSelector.svelte generated by Svelte v3.19.1 */
    const file$5 = "src/components/header/SubFolderSelector.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (26:0) {:catch error}
    function create_catch_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "error!";
    			add_location(p, file$5, 26, 2, 839);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(26:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {:then qResult}
    function create_then_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*qResult*/ ctx[5].data.folder.folders.length && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*qResult*/ ctx[5].data.folder.folders.length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(14:0) {:then qResult}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#if qResult.data.folder.folders.length}
    function create_if_block(ctx) {
    	let select;
    	let option;
    	let each_value = /*qResult*/ ctx[5].data.folder.folders;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "subfolders";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.disabled = true;
    			option.__value = "subfolders";
    			option.value = option.__value;
    			add_location(option, file$5, 16, 6, 497);
    			attr_dev(select, "name", "subfolders");
    			add_location(select, file$5, 15, 4, 464);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$qData, $folderFocus*/ 3) {
    				each_value = /*qResult*/ ctx[5].data.folder.folders;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(15:2) {#if qResult.data.folder.folders.length}",
    		ctx
    	});

    	return block;
    }

    // (18:6) {#each qResult.data.folder.folders as folder}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*folder*/ ctx[7].folderPath.slice(/*folder*/ ctx[7].folderPath.lastIndexOf("/") + 1) + "";
    	let t0;
    	let t1;
    	let option_value_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*folder*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*folder*/ ctx[7].folderPath;
    			option.value = option.__value;
    			add_location(option, file$5, 18, 8, 594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			dispose = listen_dev(option, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$qData*/ 2 && t0_value !== (t0_value = /*folder*/ ctx[7].folderPath.slice(/*folder*/ ctx[7].folderPath.lastIndexOf("/") + 1) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$qData*/ 2 && option_value_value !== (option_value_value = /*folder*/ ctx[7].folderPath)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(18:6) {#each qResult.data.folder.folders as folder}",
    		ctx
    	});

    	return block;
    }

    // (12:15)    <p>loading...</p> {:then qResult}
    function create_pending_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading...";
    			add_location(p, file$5, 12, 2, 383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(12:15)    <p>loading...</p> {:then qResult}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 5,
    		error: 6
    	};

    	handle_promise(promise = /*$qData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$qData*/ 2 && promise !== (promise = /*$qData*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[5] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $folderFocus;
    	let $qData;
    	validate_store(folderFocus, "folderFocus");
    	component_subscribe($$self, folderFocus, $$value => $$invalidate(0, $folderFocus = $$value));
    	const client = getClient();

    	const qData = query(client, {
    		query: GET_CHILD_FOLDERS,
    		variables: { folderPath: $folderFocus }
    	});

    	validate_store(qData, "qData");
    	component_subscribe($$self, qData, value => $$invalidate(1, $qData = value));
    	const click_handler = folder => set_store_value(folderFocus, $folderFocus = folder.folderPath);

    	$$self.$capture_state = () => ({
    		getClient,
    		query,
    		GET_CHILD_FOLDERS,
    		folderFocus,
    		client,
    		qData,
    		$folderFocus,
    		$qData
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$folderFocus*/ 1) {
    			 qData.refetch({ folderPath: $folderFocus });
    		}
    	};

    	return [$folderFocus, $qData, qData, client, click_handler];
    }

    class SubFolderSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubFolderSelector",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/header/BreadCrumbs.svelte generated by Svelte v3.19.1 */
    const file$6 = "src/components/header/BreadCrumbs.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (11:2) {#each [...folders] as [folderName, folderPath]}
    function create_each_block$2(ctx) {
    	let li;
    	let button;
    	let t_value = /*folderName*/ ctx[4] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*folderPath*/ ctx[5], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t = text(t_value);
    			toggle_class(button, "active", /*folderPath*/ ctx[5] === /*$folderFocus*/ ctx[1]);
    			add_location(button, file$6, 12, 4, 368);
    			add_location(li, file$6, 11, 2, 359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*folders*/ 1 && t_value !== (t_value = /*folderName*/ ctx[4] + "")) set_data_dev(t, t_value);

    			if (dirty & /*folders, $folderFocus*/ 3) {
    				toggle_class(button, "active", /*folderPath*/ ctx[5] === /*$folderFocus*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(11:2) {#each [...folders] as [folderName, folderPath]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let ul;
    	let t;
    	let current;
    	let each_value = [.../*folders*/ ctx[0]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const subfolderselector = new SubFolderSelector({ $$inline: true });

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(subfolderselector.$$.fragment);
    			attr_dev(ul, "class", "svelte-rwu6ey");
    			add_location(ul, file$6, 9, 0, 301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t);
    			mount_component(subfolderselector, ul, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*folders, $folderFocus, $searchMode*/ 7) {
    				each_value = [.../*folders*/ ctx[0]];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subfolderselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subfolderselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			destroy_component(subfolderselector);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $folderFocus;
    	let $searchMode;
    	validate_store(folderFocus, "folderFocus");
    	component_subscribe($$self, folderFocus, $$value => $$invalidate(1, $folderFocus = $$value));
    	validate_store(searchMode, "searchMode");
    	component_subscribe($$self, searchMode, $$value => $$invalidate(2, $searchMode = $$value));

    	const click_handler = folderPath => {
    		set_store_value(folderFocus, $folderFocus = folderPath);
    		set_store_value(searchMode, $searchMode = false);
    	};

    	$$self.$capture_state = () => ({
    		folderPathToBreadMap,
    		folderFocus,
    		searchMode,
    		SubFolderSelector,
    		folders,
    		$folderFocus,
    		$searchMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("folders" in $$props) $$invalidate(0, folders = $$props.folders);
    	};

    	let folders;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$folderFocus*/ 2) {
    			 $$invalidate(0, folders = folderPathToBreadMap($folderFocus));
    		}

    		if ($$self.$$.dirty & /*$folderFocus*/ 2) {
    			 {
    				set_store_value(searchMode, $searchMode = false);
    			}
    		}
    	};

    	return [folders, $folderFocus, $searchMode, click_handler];
    }

    class BreadCrumbs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BreadCrumbs",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    function nestify(arr, pageSize) {
      const arrCopy = [...arr];
      const pages = [];
      while (arrCopy.length) {
        let slots = [];
        for (let slot = 0; slot < pageSize; slot++) {
          let first = arrCopy.shift();
          if (first) { slots.push(first); }
        }
        pages.push(slots);
      }
      if (!pages.length || !pages[0].length) { 
        pages.push([]); 
      }
      return pages;
    }

    /* src/components/footer/SiblingsRibbon.svelte generated by Svelte v3.19.1 */
    const file$7 = "src/components/footer/SiblingsRibbon.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (15:2) {#if siblings[pageNum] }
    function create_if_block$1(ctx) {
    	let ul;
    	let current;
    	let each_value = /*siblings*/ ctx[2][/*pageNum*/ ctx[0]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(ul, "class", "svelte-1ol8ex5");
    			add_location(ul, file$7, 15, 2, 453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$fileFocus, siblings, pageNum*/ 7) {
    				each_value = /*siblings*/ ctx[2][/*pageNum*/ ctx[0]];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!each_value.length && each_1_else) {
    				each_1_else.p(ctx, dirty);
    			} else if (!each_value.length) {
    				each_1_else = create_else_block(ctx);
    				each_1_else.c();
    				each_1_else.m(ul, null);
    			} else if (each_1_else) {
    				each_1_else.d(1);
    				each_1_else = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:2) {#if siblings[pageNum] }",
    		ctx
    	});

    	return block;
    }

    // (23:4) {:else}
    function create_else_block(ctx) {
    	let li;
    	let p;

    	const block = {
    		c: function create() {
    			li = element("li");
    			p = element("p");
    			p.textContent = "No images in this folder!";
    			add_location(p, file$7, 22, 35, 673);
    			attr_dev(li, "class", "svelte-1ol8ex5");
    			toggle_class(li, "active", true);
    			add_location(li, file$7, 22, 11, 649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(23:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#each siblings[pageNum] as filePath}
    function create_each_block$3(ctx) {
    	let li;
    	let t;
    	let current;
    	let dispose;

    	const slide = new Slide({
    			props: { filePath: /*filePath*/ ctx[9] },
    			$$inline: true
    		});

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[7](/*filePath*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(slide.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "svelte-1ol8ex5");
    			toggle_class(li, "active", /*$fileFocus*/ ctx[1] === /*filePath*/ ctx[9]);
    			add_location(li, file$7, 17, 4, 504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(slide, li, null);
    			append_dev(li, t);
    			current = true;
    			dispose = listen_dev(li, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const slide_changes = {};
    			if (dirty & /*pageNum*/ 1) slide_changes.filePath = /*filePath*/ ctx[9];
    			slide.$set(slide_changes);

    			if (dirty & /*$fileFocus, siblings, pageNum*/ 7) {
    				toggle_class(li, "active", /*$fileFocus*/ ctx[1] === /*filePath*/ ctx[9]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(slide);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(17:4) {#each siblings[pageNum] as filePath}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let t2;
    	let button1;
    	let current;
    	let dispose;
    	let if_block = /*siblings*/ ctx[2][/*pageNum*/ ctx[0]] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = `${"<"}`;
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = `${">"}`;
    			add_location(button0, file$7, 11, 2, 327);
    			add_location(button1, file$7, 26, 2, 741);
    			attr_dev(nav, "class", "svelte-1ol8ex5");
    			add_location(nav, file$7, 10, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			if (if_block) if_block.m(nav, null);
    			append_dev(nav, t2);
    			append_dev(nav, button1);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(button1, "click", /*click_handler_2*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*siblings*/ ctx[2][/*pageNum*/ ctx[0]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(nav, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $fileFocus;
    	validate_store(fileFocus, "fileFocus");
    	component_subscribe($$self, fileFocus, $$value => $$invalidate(1, $fileFocus = $$value));
    	let { pageSize = 5 } = $$props;
    	let { pageNum = 0 } = $$props;
    	let { filePaths } = $$props;
    	const siblings = nestify(filePaths, pageSize);
    	const numPages = siblings.length;
    	const writable_props = ["pageSize", "pageNum", "filePaths"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SiblingsRibbon> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, pageNum = (pageNum - 1 + numPages) % numPages);
    	const click_handler_1 = filePath => set_store_value(fileFocus, $fileFocus = filePath);
    	const click_handler_2 = () => $$invalidate(0, pageNum = (pageNum + 1) % numPages);

    	$$self.$set = $$props => {
    		if ("pageSize" in $$props) $$invalidate(4, pageSize = $$props.pageSize);
    		if ("pageNum" in $$props) $$invalidate(0, pageNum = $$props.pageNum);
    		if ("filePaths" in $$props) $$invalidate(5, filePaths = $$props.filePaths);
    	};

    	$$self.$capture_state = () => ({
    		nestify,
    		Slide,
    		fileFocus,
    		pageSize,
    		pageNum,
    		filePaths,
    		siblings,
    		numPages,
    		$fileFocus
    	});

    	$$self.$inject_state = $$props => {
    		if ("pageSize" in $$props) $$invalidate(4, pageSize = $$props.pageSize);
    		if ("pageNum" in $$props) $$invalidate(0, pageNum = $$props.pageNum);
    		if ("filePaths" in $$props) $$invalidate(5, filePaths = $$props.filePaths);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pageNum,
    		$fileFocus,
    		siblings,
    		numPages,
    		pageSize,
    		filePaths,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class SiblingsRibbon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { pageSize: 4, pageNum: 0, filePaths: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SiblingsRibbon",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filePaths*/ ctx[5] === undefined && !("filePaths" in props)) {
    			console.warn("<SiblingsRibbon> was created without expected prop 'filePaths'");
    		}
    	}

    	get pageSize() {
    		throw new Error("<SiblingsRibbon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pageSize(value) {
    		throw new Error("<SiblingsRibbon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pageNum() {
    		throw new Error("<SiblingsRibbon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pageNum(value) {
    		throw new Error("<SiblingsRibbon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filePaths() {
    		throw new Error("<SiblingsRibbon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filePaths(value) {
    		throw new Error("<SiblingsRibbon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.1 */

    const { console: console_1$1 } = globals;
    const file$8 = "src/App.svelte";

    // (23:6) {:else}
    function create_else_block$1(ctx) {
    	let header;
    	let updating_value;
    	let t0;
    	let t1;
    	let t2;
    	let main;
    	let section0;
    	let t3;
    	let section1;
    	let t4;
    	let footer;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let dispose;

    	function searchbar_value_binding(value) {
    		/*searchbar_value_binding*/ ctx[12].call(null, value);
    	}

    	let searchbar_props = {};

    	if (/*$searchString*/ ctx[1] !== void 0) {
    		searchbar_props.value = /*$searchString*/ ctx[1];
    	}

    	const searchbar = new SearchBar({ props: searchbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(searchbar, "value", searchbar_value_binding));
    	let if_block0 = /*$searchMode*/ ctx[3] && create_if_block_2(ctx);
    	const breadcrumbs = new BreadCrumbs({ $$inline: true });

    	const metadisplay = new MetaDisplay({
    			props: { filePath: /*$fileFocus*/ ctx[2] },
    			$$inline: true
    		});

    	const slide = new Slide({
    			props: { filePath: /*$fileFocus*/ ctx[2] },
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$searchMode*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(searchbar.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			create_component(breadcrumbs.$$.fragment);
    			t2 = space();
    			main = element("main");
    			section0 = element("section");
    			create_component(metadisplay.$$.fragment);
    			t3 = space();
    			section1 = element("section");
    			create_component(slide.$$.fragment);
    			t4 = space();
    			footer = element("footer");
    			if_block1.c();
    			attr_dev(header, "class", "svelte-176p171");
    			add_location(header, file$8, 23, 0, 1085);
    			attr_dev(section0, "id", "MetaDisplay");
    			attr_dev(section0, "class", "svelte-176p171");
    			add_location(section0, file$8, 29, 1, 1215);
    			attr_dev(section1, "id", "SlideViewer");
    			attr_dev(section1, "class", "svelte-176p171");
    			add_location(section1, file$8, 30, 1, 1289);
    			attr_dev(main, "class", "svelte-176p171");
    			add_location(main, file$8, 28, 0, 1207);
    			attr_dev(footer, "class", "svelte-176p171");
    			add_location(footer, file$8, 33, 0, 1399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(searchbar, header, null);
    			append_dev(header, t0);
    			if (if_block0) if_block0.m(header, null);
    			append_dev(header, t1);
    			mount_component(breadcrumbs, header, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);
    			mount_component(metadisplay, section0, null);
    			append_dev(main, t3);
    			append_dev(main, section1);
    			mount_component(slide, section1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, footer, anchor);
    			if_blocks[current_block_type_index].m(footer, null);
    			current = true;
    			dispose = listen_dev(section1, "click", /*click_handler_1*/ ctx[13], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			const searchbar_changes = {};

    			if (!updating_value && dirty & /*$searchString*/ 2) {
    				updating_value = true;
    				searchbar_changes.value = /*$searchString*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			searchbar.$set(searchbar_changes);

    			if (/*$searchMode*/ ctx[3]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(header, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const metadisplay_changes = {};
    			if (dirty & /*$fileFocus*/ 4) metadisplay_changes.filePath = /*$fileFocus*/ ctx[2];
    			metadisplay.$set(metadisplay_changes);
    			const slide_changes = {};
    			if (dirty & /*$fileFocus*/ 4) slide_changes.filePath = /*$fileFocus*/ ctx[2];
    			slide.$set(slide_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(footer, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(breadcrumbs.$$.fragment, local);
    			transition_in(metadisplay.$$.fragment, local);
    			transition_in(slide.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(breadcrumbs.$$.fragment, local);
    			transition_out(metadisplay.$$.fragment, local);
    			transition_out(slide.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(searchbar);
    			if (if_block0) if_block0.d();
    			destroy_component(breadcrumbs);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			destroy_component(metadisplay);
    			destroy_component(slide);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(footer);
    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(23:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if fullScreen}
    function create_if_block$2(ctx) {
    	let div;
    	let current;
    	let dispose;

    	const slide = new Slide({
    			props: { filePath: /*$fileFocus*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(slide.$$.fragment);
    			attr_dev(div, "id", "FullScreen");
    			add_location(div, file$8, 20, 17, 983);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(slide, div, null);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler*/ ctx[11], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			const slide_changes = {};
    			if (dirty & /*$fileFocus*/ 4) slide_changes.filePath = /*$fileFocus*/ ctx[2];
    			slide.$set(slide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(slide);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(21:0) {#if fullScreen}",
    		ctx
    	});

    	return block;
    }

    // (26:1) {#if $searchMode}
    function create_if_block_2(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Search Mode";
    			add_location(h2, file$8, 25, 18, 1154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(26:1) {#if $searchMode}",
    		ctx
    	});

    	return block;
    }

    // (40:1) {:else}
    function create_else_block_1(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block_1,
    		value: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$qData*/ ctx[5], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$qData*/ 32 && promise !== (promise = /*$qData*/ ctx[5]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[15] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(40:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:1) {#if $searchMode}
    function create_if_block_1(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 14,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$searchData*/ ctx[4], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$searchData*/ 16 && promise !== (promise = /*$searchData*/ ctx[4]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[14] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(35:1) {#if $searchMode}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>  import {setClient, query}
    function create_catch_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>  import {setClient, query}",
    		ctx
    	});

    	return block;
    }

    // (41:30)     <SiblingsRibbon pageSize={3}
    function create_then_block_1(ctx) {
    	let current;

    	const siblingsribbon = new SiblingsRibbon({
    			props: {
    				pageSize: 3,
    				filePaths: /*qResult*/ ctx[15].data.folder.files.map(func_1)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(siblingsribbon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(siblingsribbon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const siblingsribbon_changes = {};
    			if (dirty & /*$qData*/ 32) siblingsribbon_changes.filePaths = /*qResult*/ ctx[15].data.folder.files.map(func_1);
    			siblingsribbon.$set(siblingsribbon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(siblingsribbon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(siblingsribbon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(siblingsribbon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(41:30)     <SiblingsRibbon pageSize={3}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>  import {setClient, query}
    function create_pending_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(1:0) <script>  import {setClient, query}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>  import {setClient, query}
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>  import {setClient, query}",
    		ctx
    	});

    	return block;
    }

    // (36:40)     <SiblingsRibbon pageSize={3}
    function create_then_block$3(ctx) {
    	let current;

    	const siblingsribbon = new SiblingsRibbon({
    			props: {
    				pageSize: 3,
    				filePaths: /*searchResult*/ ctx[14].data.filesTagged.map(func$1)
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(siblingsribbon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(siblingsribbon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const siblingsribbon_changes = {};
    			if (dirty & /*$searchData*/ 16) siblingsribbon_changes.filePaths = /*searchResult*/ ctx[14].data.filesTagged.map(func$1);
    			siblingsribbon.$set(siblingsribbon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(siblingsribbon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(siblingsribbon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(siblingsribbon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(36:40)     <SiblingsRibbon pageSize={3}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>  import {setClient, query}
    function create_pending_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <script>  import {setClient, query}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*fullScreen*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = f => f.filePath;
    const func_1 = f => f.filePath;

    function instance$8($$self, $$props, $$invalidate) {
    	let $folderFocus;
    	let $searchArray;
    	let $searchString;
    	let $fileFocus;
    	let $searchMode;
    	let $searchData;
    	let $qData;
    	validate_store(folderFocus, "folderFocus");
    	component_subscribe($$self, folderFocus, $$value => $$invalidate(9, $folderFocus = $$value));
    	validate_store(searchArray, "searchArray");
    	component_subscribe($$self, searchArray, $$value => $$invalidate(10, $searchArray = $$value));
    	validate_store(searchString, "searchString");
    	component_subscribe($$self, searchString, $$value => $$invalidate(1, $searchString = $$value));
    	validate_store(fileFocus, "fileFocus");
    	component_subscribe($$self, fileFocus, $$value => $$invalidate(2, $fileFocus = $$value));
    	validate_store(searchMode, "searchMode");
    	component_subscribe($$self, searchMode, $$value => $$invalidate(3, $searchMode = $$value));
    	let { client } = $$props;
    	setClient(client);

    	let qData = query(client, {
    		query: GET_CHILD_FILES,
    		variables: { folderPath: $folderFocus }
    	});

    	validate_store(qData, "qData");
    	component_subscribe($$self, qData, value => $$invalidate(5, $qData = value));

    	let searchData = query(client, {
    		query: SEARCH_TAGS,
    		variables: { tagNames: $searchArray }
    	});

    	validate_store(searchData, "searchData");
    	component_subscribe($$self, searchData, value => $$invalidate(4, $searchData = value));
    	let fullScreen = false;
    	const writable_props = ["client"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, fullScreen = false);

    	function searchbar_value_binding(value) {
    		$searchString = value;
    		searchString.set($searchString);
    	}

    	const click_handler_1 = () => $$invalidate(0, fullScreen = true);

    	$$self.$set = $$props => {
    		if ("client" in $$props) $$invalidate(8, client = $$props.client);
    	};

    	$$self.$capture_state = () => ({
    		setClient,
    		query,
    		fileFocus,
    		folderFocus,
    		searchArray,
    		searchMode,
    		searchString,
    		GET_CHILD_FILES,
    		SEARCH_TAGS,
    		SearchBar,
    		MetaDisplay,
    		Slide,
    		BreadCrumbs,
    		SiblingsRibbon,
    		client,
    		qData,
    		searchData,
    		fullScreen,
    		$folderFocus,
    		$searchArray,
    		console,
    		$searchString,
    		$fileFocus,
    		$searchMode,
    		$searchData,
    		$qData
    	});

    	$$self.$inject_state = $$props => {
    		if ("client" in $$props) $$invalidate(8, client = $$props.client);
    		if ("qData" in $$props) $$invalidate(6, qData = $$props.qData);
    		if ("searchData" in $$props) $$invalidate(7, searchData = $$props.searchData);
    		if ("fullScreen" in $$props) $$invalidate(0, fullScreen = $$props.fullScreen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$folderFocus*/ 512) {
    			 qData.refetch({ folderPath: $folderFocus });
    		}

    		if ($$self.$$.dirty & /*$searchArray*/ 1024) {
    			 searchData.refetch({ tagNames: $searchArray });
    		}

    		if ($$self.$$.dirty & /*$searchArray*/ 1024) {
    			 console.log($searchArray);
    		}

    		if ($$self.$$.dirty & /*$searchString*/ 2) {
    			 console.log($searchString);
    		}
    	};

    	return [
    		fullScreen,
    		$searchString,
    		$fileFocus,
    		$searchMode,
    		$searchData,
    		$qData,
    		qData,
    		searchData,
    		client,
    		$folderFocus,
    		$searchArray,
    		click_handler,
    		searchbar_value_binding,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { client: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*client*/ ctx[8] === undefined && !("client" in props)) {
    			console_1$1.warn("<App> was created without expected prop 'client'");
    		}
    	}

    	get client() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set client(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function queryFromPojo(obj) {
        var op = {
            kind: 'OperationDefinition',
            operation: 'query',
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [op],
        };
        return out;
    }
    function fragmentFromPojo(obj, typename) {
        var frag = {
            kind: 'FragmentDefinition',
            typeCondition: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: typename || '__FakeType',
                },
            },
            name: {
                kind: 'Name',
                value: 'GeneratedClientQuery',
            },
            selectionSet: selectionSetFromObj(obj),
        };
        var out = {
            kind: 'Document',
            definitions: [frag],
        };
        return out;
    }
    function selectionSetFromObj(obj) {
        if (typeof obj === 'number' ||
            typeof obj === 'boolean' ||
            typeof obj === 'string' ||
            typeof obj === 'undefined' ||
            obj === null) {
            return null;
        }
        if (Array.isArray(obj)) {
            return selectionSetFromObj(obj[0]);
        }
        var selections = [];
        Object.keys(obj).forEach(function (key) {
            var nestedSelSet = selectionSetFromObj(obj[key]);
            var field = {
                kind: 'Field',
                name: {
                    kind: 'Name',
                    value: key,
                },
                selectionSet: nestedSelSet || undefined,
            };
            selections.push(field);
        });
        var selectionSet = {
            kind: 'SelectionSet',
            selections: selections,
        };
        return selectionSet;
    }
    var justTypenameQuery = {
        kind: 'Document',
        definitions: [
            {
                kind: 'OperationDefinition',
                operation: 'query',
                name: null,
                variableDefinitions: null,
                directives: [],
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                        {
                            kind: 'Field',
                            alias: null,
                            name: {
                                kind: 'Name',
                                value: '__typename',
                            },
                            arguments: [],
                            directives: [],
                            selectionSet: null,
                        },
                    ],
                },
            },
        ],
    };

    var ApolloCache = (function () {
        function ApolloCache() {
        }
        ApolloCache.prototype.transformDocument = function (document) {
            return document;
        };
        ApolloCache.prototype.transformForLink = function (document) {
            return document;
        };
        ApolloCache.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: options.query,
                variables: options.variables,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.read({
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
                variables: options.variables,
                rootId: options.id,
                optimistic: optimistic,
            });
        };
        ApolloCache.prototype.writeQuery = function (options) {
            this.write({
                dataId: 'ROOT_QUERY',
                result: options.data,
                query: options.query,
                variables: options.variables,
            });
        };
        ApolloCache.prototype.writeFragment = function (options) {
            this.write({
                dataId: options.id,
                result: options.data,
                variables: options.variables,
                query: getFragmentQueryDocument(options.fragment, options.fragmentName),
            });
        };
        ApolloCache.prototype.writeData = function (_a) {
            var id = _a.id, data = _a.data;
            if (typeof id !== 'undefined') {
                var typenameResult = null;
                try {
                    typenameResult = this.read({
                        rootId: id,
                        optimistic: false,
                        query: justTypenameQuery,
                    });
                }
                catch (e) {
                }
                var __typename = (typenameResult && typenameResult.__typename) || '__ClientData';
                var dataToWrite = Object.assign({ __typename: __typename }, data);
                this.writeFragment({
                    id: id,
                    fragment: fragmentFromPojo(dataToWrite, __typename),
                    data: dataToWrite,
                });
            }
            else {
                this.writeQuery({ query: queryFromPojo(data), data: data });
            }
        };
        return ApolloCache;
    }());
    //# sourceMappingURL=bundle.esm.js.map

    // This currentContext variable will only be used if the makeSlotClass
    // function is called, which happens only if this is the first copy of the
    // @wry/context package to be imported.
    var currentContext = null;
    // This unique internal object is used to denote the absence of a value
    // for a given Slot, and is never exposed to outside code.
    var MISSING_VALUE = {};
    var idCounter = 1;
    // Although we can't do anything about the cost of duplicated code from
    // accidentally bundling multiple copies of the @wry/context package, we can
    // avoid creating the Slot class more than once using makeSlotClass.
    var makeSlotClass = function () { return /** @class */ (function () {
        function Slot() {
            // If you have a Slot object, you can find out its slot.id, but you cannot
            // guess the slot.id of a Slot you don't have access to, thanks to the
            // randomized suffix.
            this.id = [
                "slot",
                idCounter++,
                Date.now(),
                Math.random().toString(36).slice(2),
            ].join(":");
        }
        Slot.prototype.hasValue = function () {
            for (var context_1 = currentContext; context_1; context_1 = context_1.parent) {
                // We use the Slot object iself as a key to its value, which means the
                // value cannot be obtained without a reference to the Slot object.
                if (this.id in context_1.slots) {
                    var value = context_1.slots[this.id];
                    if (value === MISSING_VALUE)
                        break;
                    if (context_1 !== currentContext) {
                        // Cache the value in currentContext.slots so the next lookup will
                        // be faster. This caching is safe because the tree of contexts and
                        // the values of the slots are logically immutable.
                        currentContext.slots[this.id] = value;
                    }
                    return true;
                }
            }
            if (currentContext) {
                // If a value was not found for this Slot, it's never going to be found
                // no matter how many times we look it up, so we might as well cache
                // the absence of the value, too.
                currentContext.slots[this.id] = MISSING_VALUE;
            }
            return false;
        };
        Slot.prototype.getValue = function () {
            if (this.hasValue()) {
                return currentContext.slots[this.id];
            }
        };
        Slot.prototype.withValue = function (value, callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            var _a;
            var slots = (_a = {
                    __proto__: null
                },
                _a[this.id] = value,
                _a);
            var parent = currentContext;
            currentContext = { parent: parent, slots: slots };
            try {
                // Function.prototype.apply allows the arguments array argument to be
                // omitted or undefined, so args! is fine here.
                return callback.apply(thisArg, args);
            }
            finally {
                currentContext = parent;
            }
        };
        // Capture the current context and wrap a callback function so that it
        // reestablishes the captured context when called.
        Slot.bind = function (callback) {
            var context = currentContext;
            return function () {
                var saved = currentContext;
                try {
                    currentContext = context;
                    return callback.apply(this, arguments);
                }
                finally {
                    currentContext = saved;
                }
            };
        };
        // Immediately run a callback function without any captured context.
        Slot.noContext = function (callback, 
        // Given the prevalence of arrow functions, specifying arguments is likely
        // to be much more common than specifying `this`, hence this ordering:
        args, thisArg) {
            if (currentContext) {
                var saved = currentContext;
                try {
                    currentContext = null;
                    // Function.prototype.apply allows the arguments array argument to be
                    // omitted or undefined, so args! is fine here.
                    return callback.apply(thisArg, args);
                }
                finally {
                    currentContext = saved;
                }
            }
            else {
                return callback.apply(thisArg, args);
            }
        };
        return Slot;
    }()); };
    // We store a single global implementation of the Slot class as a permanent
    // non-enumerable symbol property of the Array constructor. This obfuscation
    // does nothing to prevent access to the Slot class, but at least it ensures
    // the implementation (i.e. currentContext) cannot be tampered with, and all
    // copies of the @wry/context package (hopefully just one) will share the
    // same Slot implementation. Since the first copy of the @wry/context package
    // to be imported wins, this technique imposes a very high cost for any
    // future breaking changes to the Slot class.
    var globalKey = "@wry/context:Slot";
    var host = Array;
    var Slot = host[globalKey] || function () {
        var Slot = makeSlotClass();
        try {
            Object.defineProperty(host, globalKey, {
                value: host[globalKey] = Slot,
                enumerable: false,
                writable: false,
                configurable: false,
            });
        }
        finally {
            return Slot;
        }
    }();

    var bind$1 = Slot.bind, noContext = Slot.noContext;
    //# sourceMappingURL=context.esm.js.map

    function defaultDispose() { }
    var Cache = /** @class */ (function () {
        function Cache(max, dispose) {
            if (max === void 0) { max = Infinity; }
            if (dispose === void 0) { dispose = defaultDispose; }
            this.max = max;
            this.dispose = dispose;
            this.map = new Map();
            this.newest = null;
            this.oldest = null;
        }
        Cache.prototype.has = function (key) {
            return this.map.has(key);
        };
        Cache.prototype.get = function (key) {
            var entry = this.getEntry(key);
            return entry && entry.value;
        };
        Cache.prototype.getEntry = function (key) {
            var entry = this.map.get(key);
            if (entry && entry !== this.newest) {
                var older = entry.older, newer = entry.newer;
                if (newer) {
                    newer.older = older;
                }
                if (older) {
                    older.newer = newer;
                }
                entry.older = this.newest;
                entry.older.newer = entry;
                entry.newer = null;
                this.newest = entry;
                if (entry === this.oldest) {
                    this.oldest = newer;
                }
            }
            return entry;
        };
        Cache.prototype.set = function (key, value) {
            var entry = this.getEntry(key);
            if (entry) {
                return entry.value = value;
            }
            entry = {
                key: key,
                value: value,
                newer: null,
                older: this.newest
            };
            if (this.newest) {
                this.newest.newer = entry;
            }
            this.newest = entry;
            this.oldest = this.oldest || entry;
            this.map.set(key, entry);
            return entry.value;
        };
        Cache.prototype.clean = function () {
            while (this.oldest && this.map.size > this.max) {
                this.delete(this.oldest.key);
            }
        };
        Cache.prototype.delete = function (key) {
            var entry = this.map.get(key);
            if (entry) {
                if (entry === this.newest) {
                    this.newest = entry.older;
                }
                if (entry === this.oldest) {
                    this.oldest = entry.newer;
                }
                if (entry.newer) {
                    entry.newer.older = entry.older;
                }
                if (entry.older) {
                    entry.older.newer = entry.newer;
                }
                this.map.delete(key);
                this.dispose(entry.value, key);
                return true;
            }
            return false;
        };
        return Cache;
    }());

    var parentEntrySlot = new Slot();

    var reusableEmptyArray = [];
    var emptySetPool = [];
    var POOL_TARGET_SIZE = 100;
    // Since this package might be used browsers, we should avoid using the
    // Node built-in assert module.
    function assert(condition, optionalMessage) {
        if (!condition) {
            throw new Error(optionalMessage || "assertion failure");
        }
    }
    function valueIs(a, b) {
        var len = a.length;
        return (
        // Unknown values are not equal to each other.
        len > 0 &&
            // Both values must be ordinary (or both exceptional) to be equal.
            len === b.length &&
            // The underlying value or exception must be the same.
            a[len - 1] === b[len - 1]);
    }
    function valueGet(value) {
        switch (value.length) {
            case 0: throw new Error("unknown value");
            case 1: return value[0];
            case 2: throw value[1];
        }
    }
    function valueCopy(value) {
        return value.slice(0);
    }
    var Entry = /** @class */ (function () {
        function Entry(fn, args) {
            this.fn = fn;
            this.args = args;
            this.parents = new Set();
            this.childValues = new Map();
            // When this Entry has children that are dirty, this property becomes
            // a Set containing other Entry objects, borrowed from emptySetPool.
            // When the set becomes empty, it gets recycled back to emptySetPool.
            this.dirtyChildren = null;
            this.dirty = true;
            this.recomputing = false;
            this.value = [];
            ++Entry.count;
        }
        // This is the most important method of the Entry API, because it
        // determines whether the cached this.value can be returned immediately,
        // or must be recomputed. The overall performance of the caching system
        // depends on the truth of the following observations: (1) this.dirty is
        // usually false, (2) this.dirtyChildren is usually null/empty, and thus
        // (3) valueGet(this.value) is usually returned without recomputation.
        Entry.prototype.recompute = function () {
            assert(!this.recomputing, "already recomputing");
            if (!rememberParent(this) && maybeReportOrphan(this)) {
                // The recipient of the entry.reportOrphan callback decided to dispose
                // of this orphan entry by calling entry.dispose(), so we don't need to
                // (and should not) proceed with the recomputation.
                return void 0;
            }
            return mightBeDirty(this)
                ? reallyRecompute(this)
                : valueGet(this.value);
        };
        Entry.prototype.setDirty = function () {
            if (this.dirty)
                return;
            this.dirty = true;
            this.value.length = 0;
            reportDirty(this);
            // We can go ahead and unsubscribe here, since any further dirty
            // notifications we receive will be redundant, and unsubscribing may
            // free up some resources, e.g. file watchers.
            maybeUnsubscribe(this);
        };
        Entry.prototype.dispose = function () {
            var _this = this;
            forgetChildren(this).forEach(maybeReportOrphan);
            maybeUnsubscribe(this);
            // Because this entry has been kicked out of the cache (in index.js),
            // we've lost the ability to find out if/when this entry becomes dirty,
            // whether that happens through a subscription, because of a direct call
            // to entry.setDirty(), or because one of its children becomes dirty.
            // Because of this loss of future information, we have to assume the
            // worst (that this entry might have become dirty very soon), so we must
            // immediately mark this entry's parents as dirty. Normally we could
            // just call entry.setDirty() rather than calling parent.setDirty() for
            // each parent, but that would leave this entry in parent.childValues
            // and parent.dirtyChildren, which would prevent the child from being
            // truly forgotten.
            this.parents.forEach(function (parent) {
                parent.setDirty();
                forgetChild(parent, _this);
            });
        };
        Entry.count = 0;
        return Entry;
    }());
    function rememberParent(child) {
        var parent = parentEntrySlot.getValue();
        if (parent) {
            child.parents.add(parent);
            if (!parent.childValues.has(child)) {
                parent.childValues.set(child, []);
            }
            if (mightBeDirty(child)) {
                reportDirtyChild(parent, child);
            }
            else {
                reportCleanChild(parent, child);
            }
            return parent;
        }
    }
    function reallyRecompute(entry) {
        // Since this recomputation is likely to re-remember some of this
        // entry's children, we forget our children here but do not call
        // maybeReportOrphan until after the recomputation finishes.
        var originalChildren = forgetChildren(entry);
        // Set entry as the parent entry while calling recomputeNewValue(entry).
        parentEntrySlot.withValue(entry, recomputeNewValue, [entry]);
        if (maybeSubscribe(entry)) {
            // If we successfully recomputed entry.value and did not fail to
            // (re)subscribe, then this Entry is no longer explicitly dirty.
            setClean(entry);
        }
        // Now that we've had a chance to re-remember any children that were
        // involved in the recomputation, we can safely report any orphan
        // children that remain.
        originalChildren.forEach(maybeReportOrphan);
        return valueGet(entry.value);
    }
    function recomputeNewValue(entry) {
        entry.recomputing = true;
        // Set entry.value as unknown.
        entry.value.length = 0;
        try {
            // If entry.fn succeeds, entry.value will become a normal Value.
            entry.value[0] = entry.fn.apply(null, entry.args);
        }
        catch (e) {
            // If entry.fn throws, entry.value will become exceptional.
            entry.value[1] = e;
        }
        // Either way, this line is always reached.
        entry.recomputing = false;
    }
    function mightBeDirty(entry) {
        return entry.dirty || !!(entry.dirtyChildren && entry.dirtyChildren.size);
    }
    function setClean(entry) {
        entry.dirty = false;
        if (mightBeDirty(entry)) {
            // This Entry may still have dirty children, in which case we can't
            // let our parents know we're clean just yet.
            return;
        }
        reportClean(entry);
    }
    function reportDirty(child) {
        child.parents.forEach(function (parent) { return reportDirtyChild(parent, child); });
    }
    function reportClean(child) {
        child.parents.forEach(function (parent) { return reportCleanChild(parent, child); });
    }
    // Let a parent Entry know that one of its children may be dirty.
    function reportDirtyChild(parent, child) {
        // Must have called rememberParent(child) before calling
        // reportDirtyChild(parent, child).
        assert(parent.childValues.has(child));
        assert(mightBeDirty(child));
        if (!parent.dirtyChildren) {
            parent.dirtyChildren = emptySetPool.pop() || new Set;
        }
        else if (parent.dirtyChildren.has(child)) {
            // If we already know this child is dirty, then we must have already
            // informed our own parents that we are dirty, so we can terminate
            // the recursion early.
            return;
        }
        parent.dirtyChildren.add(child);
        reportDirty(parent);
    }
    // Let a parent Entry know that one of its children is no longer dirty.
    function reportCleanChild(parent, child) {
        // Must have called rememberChild(child) before calling
        // reportCleanChild(parent, child).
        assert(parent.childValues.has(child));
        assert(!mightBeDirty(child));
        var childValue = parent.childValues.get(child);
        if (childValue.length === 0) {
            parent.childValues.set(child, valueCopy(child.value));
        }
        else if (!valueIs(childValue, child.value)) {
            parent.setDirty();
        }
        removeDirtyChild(parent, child);
        if (mightBeDirty(parent)) {
            return;
        }
        reportClean(parent);
    }
    function removeDirtyChild(parent, child) {
        var dc = parent.dirtyChildren;
        if (dc) {
            dc.delete(child);
            if (dc.size === 0) {
                if (emptySetPool.length < POOL_TARGET_SIZE) {
                    emptySetPool.push(dc);
                }
                parent.dirtyChildren = null;
            }
        }
    }
    // If the given entry has a reportOrphan method, and no remaining parents,
    // call entry.reportOrphan and return true iff it returns true. The
    // reportOrphan function should return true to indicate entry.dispose()
    // has been called, and the entry has been removed from any other caches
    // (see index.js for the only current example).
    function maybeReportOrphan(entry) {
        return entry.parents.size === 0 &&
            typeof entry.reportOrphan === "function" &&
            entry.reportOrphan() === true;
    }
    // Removes all children from this entry and returns an array of the
    // removed children.
    function forgetChildren(parent) {
        var children = reusableEmptyArray;
        if (parent.childValues.size > 0) {
            children = [];
            parent.childValues.forEach(function (_value, child) {
                forgetChild(parent, child);
                children.push(child);
            });
        }
        // After we forget all our children, this.dirtyChildren must be empty
        // and therefore must have been reset to null.
        assert(parent.dirtyChildren === null);
        return children;
    }
    function forgetChild(parent, child) {
        child.parents.delete(parent);
        parent.childValues.delete(child);
        removeDirtyChild(parent, child);
    }
    function maybeSubscribe(entry) {
        if (typeof entry.subscribe === "function") {
            try {
                maybeUnsubscribe(entry); // Prevent double subscriptions.
                entry.unsubscribe = entry.subscribe.apply(null, entry.args);
            }
            catch (e) {
                // If this Entry has a subscribe function and it threw an exception
                // (or an unsubscribe function it previously returned now throws),
                // return false to indicate that we were not able to subscribe (or
                // unsubscribe), and this Entry should remain dirty.
                entry.setDirty();
                return false;
            }
        }
        // Returning true indicates either that there was no entry.subscribe
        // function or that it succeeded.
        return true;
    }
    function maybeUnsubscribe(entry) {
        var unsubscribe = entry.unsubscribe;
        if (typeof unsubscribe === "function") {
            entry.unsubscribe = void 0;
            unsubscribe();
        }
    }

    // A trie data structure that holds object keys weakly, yet can also hold
    // non-object keys, unlike the native `WeakMap`.
    var KeyTrie = /** @class */ (function () {
        function KeyTrie(weakness) {
            this.weakness = weakness;
        }
        KeyTrie.prototype.lookup = function () {
            var array = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                array[_i] = arguments[_i];
            }
            return this.lookupArray(array);
        };
        KeyTrie.prototype.lookupArray = function (array) {
            var node = this;
            array.forEach(function (key) { return node = node.getChildTrie(key); });
            return node.data || (node.data = Object.create(null));
        };
        KeyTrie.prototype.getChildTrie = function (key) {
            var map = this.weakness && isObjRef(key)
                ? this.weak || (this.weak = new WeakMap())
                : this.strong || (this.strong = new Map());
            var child = map.get(key);
            if (!child)
                map.set(key, child = new KeyTrie(this.weakness));
            return child;
        };
        return KeyTrie;
    }());
    function isObjRef(value) {
        switch (typeof value) {
            case "object":
                if (value === null)
                    break;
            // Fall through to return true...
            case "function":
                return true;
        }
        return false;
    }

    // The defaultMakeCacheKey function is remarkably powerful, because it gives
    // a unique object for any shallow-identical list of arguments. If you need
    // to implement a custom makeCacheKey function, you may find it helpful to
    // delegate the final work to defaultMakeCacheKey, which is why we export it
    // here. However, you may want to avoid defaultMakeCacheKey if your runtime
    // does not support WeakMap, or you have the ability to return a string key.
    // In those cases, just write your own custom makeCacheKey functions.
    var keyTrie = new KeyTrie(typeof WeakMap === "function");
    function defaultMakeCacheKey() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return keyTrie.lookupArray(args);
    }
    var caches = new Set();
    function wrap(originalFunction, options) {
        if (options === void 0) { options = Object.create(null); }
        var cache = new Cache(options.max || Math.pow(2, 16), function (entry) { return entry.dispose(); });
        var disposable = !!options.disposable;
        var makeCacheKey = options.makeCacheKey || defaultMakeCacheKey;
        function optimistic() {
            if (disposable && !parentEntrySlot.hasValue()) {
                // If there's no current parent computation, and this wrapped
                // function is disposable (meaning we don't care about entry.value,
                // just dependency tracking), then we can short-cut everything else
                // in this function, because entry.recompute() is going to recycle
                // the entry object without recomputing anything, anyway.
                return void 0;
            }
            var key = makeCacheKey.apply(null, arguments);
            if (key === void 0) {
                return originalFunction.apply(null, arguments);
            }
            var args = Array.prototype.slice.call(arguments);
            var entry = cache.get(key);
            if (entry) {
                entry.args = args;
            }
            else {
                entry = new Entry(originalFunction, args);
                cache.set(key, entry);
                entry.subscribe = options.subscribe;
                if (disposable) {
                    entry.reportOrphan = function () { return cache.delete(key); };
                }
            }
            var value = entry.recompute();
            // Move this entry to the front of the least-recently used queue,
            // since we just finished computing its value.
            cache.set(key, entry);
            caches.add(cache);
            // Clean up any excess entries in the cache, but only if there is no
            // active parent entry, meaning we're not in the middle of a larger
            // computation that might be flummoxed by the cleaning.
            if (!parentEntrySlot.hasValue()) {
                caches.forEach(function (cache) { return cache.clean(); });
                caches.clear();
            }
            // If options.disposable is truthy, the caller of wrap is telling us
            // they don't care about the result of entry.recompute(), so we should
            // avoid returning the value, so it won't be accidentally used.
            return disposable ? void 0 : value;
        }
        optimistic.dirty = function () {
            var key = makeCacheKey.apply(null, arguments);
            var child = key !== void 0 && cache.get(key);
            if (child) {
                child.setDirty();
            }
        };
        return optimistic;
    }
    //# sourceMappingURL=bundle.esm.js.map

    var haveWarned = false;
    function shouldWarn() {
        var answer = !haveWarned;
        if (!isTest()) {
            haveWarned = true;
        }
        return answer;
    }
    var HeuristicFragmentMatcher = (function () {
        function HeuristicFragmentMatcher() {
        }
        HeuristicFragmentMatcher.prototype.ensureReady = function () {
            return Promise.resolve();
        };
        HeuristicFragmentMatcher.prototype.canBypassInit = function () {
            return true;
        };
        HeuristicFragmentMatcher.prototype.match = function (idValue, typeCondition, context) {
            var obj = context.store.get(idValue.id);
            var isRootQuery = idValue.id === 'ROOT_QUERY';
            if (!obj) {
                return isRootQuery;
            }
            var _a = obj.__typename, __typename = _a === void 0 ? isRootQuery && 'Query' : _a;
            if (!__typename) {
                if (shouldWarn()) {
                    process.env.NODE_ENV === "production" || invariant.warn("You're using fragments in your queries, but either don't have the addTypename:\n  true option set in Apollo Client, or you are trying to write a fragment to the store without the __typename.\n   Please turn on the addTypename option and include __typename when writing fragments so that Apollo Client\n   can accurately match fragments.");
                    process.env.NODE_ENV === "production" || invariant.warn('Could not find __typename on Fragment ', typeCondition, obj);
                    process.env.NODE_ENV === "production" || invariant.warn("DEPRECATION WARNING: using fragments without __typename is unsupported behavior " +
                        "and will be removed in future versions of Apollo client. You should fix this and set addTypename to true now.");
                }
                return 'heuristic';
            }
            if (__typename === typeCondition) {
                return true;
            }
            if (shouldWarn()) {
                process.env.NODE_ENV === "production" || invariant.error('You are using the simple (heuristic) fragment matcher, but your ' +
                    'queries contain union or interface types. Apollo Client will not be ' +
                    'able to accurately map fragments. To make this error go away, use ' +
                    'the `IntrospectionFragmentMatcher` as described in the docs: ' +
                    'https://www.apollographql.com/docs/react/advanced/fragments.html#fragment-matcher');
            }
            return 'heuristic';
        };
        return HeuristicFragmentMatcher;
    }());

    var hasOwn = Object.prototype.hasOwnProperty;
    var DepTrackingCache = (function () {
        function DepTrackingCache(data) {
            var _this = this;
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
            this.depend = wrap(function (dataId) { return _this.data[dataId]; }, {
                disposable: true,
                makeCacheKey: function (dataId) {
                    return dataId;
                },
            });
        }
        DepTrackingCache.prototype.toObject = function () {
            return this.data;
        };
        DepTrackingCache.prototype.get = function (dataId) {
            this.depend(dataId);
            return this.data[dataId];
        };
        DepTrackingCache.prototype.set = function (dataId, value) {
            var oldValue = this.data[dataId];
            if (value !== oldValue) {
                this.data[dataId] = value;
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.delete = function (dataId) {
            if (hasOwn.call(this.data, dataId)) {
                delete this.data[dataId];
                this.depend.dirty(dataId);
            }
        };
        DepTrackingCache.prototype.clear = function () {
            this.replace(null);
        };
        DepTrackingCache.prototype.replace = function (newData) {
            var _this = this;
            if (newData) {
                Object.keys(newData).forEach(function (dataId) {
                    _this.set(dataId, newData[dataId]);
                });
                Object.keys(this.data).forEach(function (dataId) {
                    if (!hasOwn.call(newData, dataId)) {
                        _this.delete(dataId);
                    }
                });
            }
            else {
                Object.keys(this.data).forEach(function (dataId) {
                    _this.delete(dataId);
                });
            }
        };
        return DepTrackingCache;
    }());
    function defaultNormalizedCacheFactory(seed) {
        return new DepTrackingCache(seed);
    }

    var StoreReader = (function () {
        function StoreReader(_a) {
            var _this = this;
            var _b = _a === void 0 ? {} : _a, _c = _b.cacheKeyRoot, cacheKeyRoot = _c === void 0 ? new KeyTrie(canUseWeakMap) : _c, _d = _b.freezeResults, freezeResults = _d === void 0 ? false : _d;
            var _e = this, executeStoreQuery = _e.executeStoreQuery, executeSelectionSet = _e.executeSelectionSet, executeSubSelectedArray = _e.executeSubSelectedArray;
            this.freezeResults = freezeResults;
            this.executeStoreQuery = wrap(function (options) {
                return executeStoreQuery.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, fragmentMatcher = _a.fragmentMatcher;
                    if (contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(contextValue.store, query, fragmentMatcher, JSON.stringify(variableValues), rootValue.id);
                    }
                }
            });
            this.executeSelectionSet = wrap(function (options) {
                return executeSelectionSet.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, selectionSet, execContext.fragmentMatcher, JSON.stringify(execContext.variableValues), rootValue.id);
                    }
                }
            });
            this.executeSubSelectedArray = wrap(function (options) {
                return executeSubSelectedArray.call(_this, options);
            }, {
                makeCacheKey: function (_a) {
                    var field = _a.field, array = _a.array, execContext = _a.execContext;
                    if (execContext.contextValue.store instanceof DepTrackingCache) {
                        return cacheKeyRoot.lookup(execContext.contextValue.store, field, array, JSON.stringify(execContext.variableValues));
                    }
                }
            });
        }
        StoreReader.prototype.readQueryFromStore = function (options) {
            return this.diffQueryAgainstStore(__assign(__assign({}, options), { returnPartialData: false })).result;
        };
        StoreReader.prototype.diffQueryAgainstStore = function (_a) {
            var store = _a.store, query = _a.query, variables = _a.variables, previousResult = _a.previousResult, _b = _a.returnPartialData, returnPartialData = _b === void 0 ? true : _b, _c = _a.rootId, rootId = _c === void 0 ? 'ROOT_QUERY' : _c, fragmentMatcherFunction = _a.fragmentMatcherFunction, config = _a.config;
            var queryDefinition = getQueryDefinition(query);
            variables = assign({}, getDefaultValues(queryDefinition), variables);
            var context = {
                store: store,
                dataIdFromObject: config && config.dataIdFromObject,
                cacheRedirects: (config && config.cacheRedirects) || {},
            };
            var execResult = this.executeStoreQuery({
                query: query,
                rootValue: {
                    type: 'id',
                    id: rootId,
                    generated: true,
                    typename: 'Query',
                },
                contextValue: context,
                variableValues: variables,
                fragmentMatcher: fragmentMatcherFunction,
            });
            var hasMissingFields = execResult.missing && execResult.missing.length > 0;
            if (hasMissingFields && !returnPartialData) {
                execResult.missing.forEach(function (info) {
                    if (info.tolerable)
                        return;
                    throw process.env.NODE_ENV === "production" ? new InvariantError(8) : new InvariantError("Can't find field " + info.fieldName + " on object " + JSON.stringify(info.object, null, 2) + ".");
                });
            }
            if (previousResult) {
                if (equal(previousResult, execResult.result)) {
                    execResult.result = previousResult;
                }
            }
            return {
                result: execResult.result,
                complete: !hasMissingFields,
            };
        };
        StoreReader.prototype.executeStoreQuery = function (_a) {
            var query = _a.query, rootValue = _a.rootValue, contextValue = _a.contextValue, variableValues = _a.variableValues, _b = _a.fragmentMatcher, fragmentMatcher = _b === void 0 ? defaultFragmentMatcher : _b;
            var mainDefinition = getMainDefinition(query);
            var fragments = getFragmentDefinitions(query);
            var fragmentMap = createFragmentMap(fragments);
            var execContext = {
                query: query,
                fragmentMap: fragmentMap,
                contextValue: contextValue,
                variableValues: variableValues,
                fragmentMatcher: fragmentMatcher,
            };
            return this.executeSelectionSet({
                selectionSet: mainDefinition.selectionSet,
                rootValue: rootValue,
                execContext: execContext,
            });
        };
        StoreReader.prototype.executeSelectionSet = function (_a) {
            var _this = this;
            var selectionSet = _a.selectionSet, rootValue = _a.rootValue, execContext = _a.execContext;
            var fragmentMap = execContext.fragmentMap, contextValue = execContext.contextValue, variables = execContext.variableValues;
            var finalResult = { result: null };
            var objectsToMerge = [];
            var object = contextValue.store.get(rootValue.id);
            var typename = (object && object.__typename) ||
                (rootValue.id === 'ROOT_QUERY' && 'Query') ||
                void 0;
            function handleMissing(result) {
                var _a;
                if (result.missing) {
                    finalResult.missing = finalResult.missing || [];
                    (_a = finalResult.missing).push.apply(_a, result.missing);
                }
                return result.result;
            }
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var fieldResult = handleMissing(_this.executeField(object, typename, selection, execContext));
                    if (typeof fieldResult !== 'undefined') {
                        objectsToMerge.push((_a = {},
                            _a[resultKeyNameFromField(selection)] = fieldResult,
                            _a));
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = fragmentMap[selection.name.value];
                        if (!fragment) {
                            throw process.env.NODE_ENV === "production" ? new InvariantError(9) : new InvariantError("No fragment named " + selection.name.value);
                        }
                    }
                    var typeCondition = fragment.typeCondition && fragment.typeCondition.name.value;
                    var match = !typeCondition ||
                        execContext.fragmentMatcher(rootValue, typeCondition, contextValue);
                    if (match) {
                        var fragmentExecResult = _this.executeSelectionSet({
                            selectionSet: fragment.selectionSet,
                            rootValue: rootValue,
                            execContext: execContext,
                        });
                        if (match === 'heuristic' && fragmentExecResult.missing) {
                            fragmentExecResult = __assign(__assign({}, fragmentExecResult), { missing: fragmentExecResult.missing.map(function (info) {
                                    return __assign(__assign({}, info), { tolerable: true });
                                }) });
                        }
                        objectsToMerge.push(handleMissing(fragmentExecResult));
                    }
                }
            });
            finalResult.result = mergeDeepArray(objectsToMerge);
            if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                Object.freeze(finalResult.result);
            }
            return finalResult;
        };
        StoreReader.prototype.executeField = function (object, typename, field, execContext) {
            var variables = execContext.variableValues, contextValue = execContext.contextValue;
            var fieldName = field.name.value;
            var args = argumentsObjectFromField(field, variables);
            var info = {
                resultKey: resultKeyNameFromField(field),
                directives: getDirectiveInfoFromField(field, variables),
            };
            var readStoreResult = readStoreResolver(object, typename, fieldName, args, contextValue, info);
            if (Array.isArray(readStoreResult.result)) {
                return this.combineExecResults(readStoreResult, this.executeSubSelectedArray({
                    field: field,
                    array: readStoreResult.result,
                    execContext: execContext,
                }));
            }
            if (!field.selectionSet) {
                assertSelectionSetForIdValue(field, readStoreResult.result);
                if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                    maybeDeepFreeze(readStoreResult);
                }
                return readStoreResult;
            }
            if (readStoreResult.result == null) {
                return readStoreResult;
            }
            return this.combineExecResults(readStoreResult, this.executeSelectionSet({
                selectionSet: field.selectionSet,
                rootValue: readStoreResult.result,
                execContext: execContext,
            }));
        };
        StoreReader.prototype.combineExecResults = function () {
            var execResults = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                execResults[_i] = arguments[_i];
            }
            var missing;
            execResults.forEach(function (execResult) {
                if (execResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, execResult.missing);
                }
            });
            return {
                result: execResults.pop().result,
                missing: missing,
            };
        };
        StoreReader.prototype.executeSubSelectedArray = function (_a) {
            var _this = this;
            var field = _a.field, array = _a.array, execContext = _a.execContext;
            var missing;
            function handleMissing(childResult) {
                if (childResult.missing) {
                    missing = missing || [];
                    missing.push.apply(missing, childResult.missing);
                }
                return childResult.result;
            }
            array = array.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return handleMissing(_this.executeSubSelectedArray({
                        field: field,
                        array: item,
                        execContext: execContext,
                    }));
                }
                if (field.selectionSet) {
                    return handleMissing(_this.executeSelectionSet({
                        selectionSet: field.selectionSet,
                        rootValue: item,
                        execContext: execContext,
                    }));
                }
                assertSelectionSetForIdValue(field, item);
                return item;
            });
            if (this.freezeResults && process.env.NODE_ENV !== 'production') {
                Object.freeze(array);
            }
            return { result: array, missing: missing };
        };
        return StoreReader;
    }());
    function assertSelectionSetForIdValue(field, value) {
        if (!field.selectionSet && isIdValue(value)) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(10) : new InvariantError("Missing selection set for object of type " + value.typename + " returned for query field " + field.name.value);
        }
    }
    function defaultFragmentMatcher() {
        return true;
    }
    function readStoreResolver(object, typename, fieldName, args, context, _a) {
        var resultKey = _a.resultKey, directives = _a.directives;
        var storeKeyName = fieldName;
        if (args || directives) {
            storeKeyName = getStoreKeyName(storeKeyName, args, directives);
        }
        var fieldValue = void 0;
        if (object) {
            fieldValue = object[storeKeyName];
            if (typeof fieldValue === 'undefined' &&
                context.cacheRedirects &&
                typeof typename === 'string') {
                var type = context.cacheRedirects[typename];
                if (type) {
                    var resolver = type[fieldName];
                    if (resolver) {
                        fieldValue = resolver(object, args, {
                            getCacheKey: function (storeObj) {
                                var id = context.dataIdFromObject(storeObj);
                                return id && toIdValue({
                                    id: id,
                                    typename: storeObj.__typename,
                                });
                            },
                        });
                    }
                }
            }
        }
        if (typeof fieldValue === 'undefined') {
            return {
                result: fieldValue,
                missing: [{
                        object: object,
                        fieldName: storeKeyName,
                        tolerable: false,
                    }],
            };
        }
        if (isJsonValue(fieldValue)) {
            fieldValue = fieldValue.json;
        }
        return {
            result: fieldValue,
        };
    }

    var ObjectCache = (function () {
        function ObjectCache(data) {
            if (data === void 0) { data = Object.create(null); }
            this.data = data;
        }
        ObjectCache.prototype.toObject = function () {
            return this.data;
        };
        ObjectCache.prototype.get = function (dataId) {
            return this.data[dataId];
        };
        ObjectCache.prototype.set = function (dataId, value) {
            this.data[dataId] = value;
        };
        ObjectCache.prototype.delete = function (dataId) {
            this.data[dataId] = void 0;
        };
        ObjectCache.prototype.clear = function () {
            this.data = Object.create(null);
        };
        ObjectCache.prototype.replace = function (newData) {
            this.data = newData || Object.create(null);
        };
        return ObjectCache;
    }());

    var WriteError = (function (_super) {
        __extends(WriteError, _super);
        function WriteError() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = 'WriteError';
            return _this;
        }
        return WriteError;
    }(Error));
    function enhanceErrorWithDocument(error, document) {
        var enhancedError = new WriteError("Error writing result to store for query:\n " + JSON.stringify(document));
        enhancedError.message += '\n' + error.message;
        enhancedError.stack = error.stack;
        return enhancedError;
    }
    var StoreWriter = (function () {
        function StoreWriter() {
        }
        StoreWriter.prototype.writeQueryToStore = function (_a) {
            var query = _a.query, result = _a.result, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            return this.writeResultToStore({
                dataId: 'ROOT_QUERY',
                result: result,
                document: query,
                store: store,
                variables: variables,
                dataIdFromObject: dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
        };
        StoreWriter.prototype.writeResultToStore = function (_a) {
            var dataId = _a.dataId, result = _a.result, document = _a.document, _b = _a.store, store = _b === void 0 ? defaultNormalizedCacheFactory() : _b, variables = _a.variables, dataIdFromObject = _a.dataIdFromObject, fragmentMatcherFunction = _a.fragmentMatcherFunction;
            var operationDefinition = getOperationDefinition(document);
            try {
                return this.writeSelectionSetToStore({
                    result: result,
                    dataId: dataId,
                    selectionSet: operationDefinition.selectionSet,
                    context: {
                        store: store,
                        processedData: {},
                        variables: assign({}, getDefaultValues(operationDefinition), variables),
                        dataIdFromObject: dataIdFromObject,
                        fragmentMap: createFragmentMap(getFragmentDefinitions(document)),
                        fragmentMatcherFunction: fragmentMatcherFunction,
                    },
                });
            }
            catch (e) {
                throw enhanceErrorWithDocument(e, document);
            }
        };
        StoreWriter.prototype.writeSelectionSetToStore = function (_a) {
            var _this = this;
            var result = _a.result, dataId = _a.dataId, selectionSet = _a.selectionSet, context = _a.context;
            var variables = context.variables, store = context.store, fragmentMap = context.fragmentMap;
            selectionSet.selections.forEach(function (selection) {
                var _a;
                if (!shouldInclude(selection, variables)) {
                    return;
                }
                if (isField(selection)) {
                    var resultFieldKey = resultKeyNameFromField(selection);
                    var value = result[resultFieldKey];
                    if (typeof value !== 'undefined') {
                        _this.writeFieldToStore({
                            dataId: dataId,
                            value: value,
                            field: selection,
                            context: context,
                        });
                    }
                    else {
                        var isDefered = false;
                        var isClient = false;
                        if (selection.directives && selection.directives.length) {
                            isDefered = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'defer'; });
                            isClient = selection.directives.some(function (directive) { return directive.name && directive.name.value === 'client'; });
                        }
                        if (!isDefered && !isClient && context.fragmentMatcherFunction) {
                            process.env.NODE_ENV === "production" || invariant.warn("Missing field " + resultFieldKey + " in " + JSON.stringify(result, null, 2).substring(0, 100));
                        }
                    }
                }
                else {
                    var fragment = void 0;
                    if (isInlineFragment(selection)) {
                        fragment = selection;
                    }
                    else {
                        fragment = (fragmentMap || {})[selection.name.value];
                        process.env.NODE_ENV === "production" ? invariant(fragment, 4) : invariant(fragment, "No fragment named " + selection.name.value + ".");
                    }
                    var matches = true;
                    if (context.fragmentMatcherFunction && fragment.typeCondition) {
                        var id = dataId || 'self';
                        var idValue = toIdValue({ id: id, typename: undefined });
                        var fakeContext = {
                            store: new ObjectCache((_a = {}, _a[id] = result, _a)),
                            cacheRedirects: {},
                        };
                        var match = context.fragmentMatcherFunction(idValue, fragment.typeCondition.name.value, fakeContext);
                        if (!isProduction() && match === 'heuristic') {
                            process.env.NODE_ENV === "production" || invariant.error('WARNING: heuristic fragment matching going on!');
                        }
                        matches = !!match;
                    }
                    if (matches) {
                        _this.writeSelectionSetToStore({
                            result: result,
                            selectionSet: fragment.selectionSet,
                            dataId: dataId,
                            context: context,
                        });
                    }
                }
            });
            return store;
        };
        StoreWriter.prototype.writeFieldToStore = function (_a) {
            var _b;
            var field = _a.field, value = _a.value, dataId = _a.dataId, context = _a.context;
            var variables = context.variables, dataIdFromObject = context.dataIdFromObject, store = context.store;
            var storeValue;
            var storeObject;
            var storeFieldName = storeKeyNameFromField(field, variables);
            if (!field.selectionSet || value === null) {
                storeValue =
                    value != null && typeof value === 'object'
                        ?
                            { type: 'json', json: value }
                        :
                            value;
            }
            else if (Array.isArray(value)) {
                var generatedId = dataId + "." + storeFieldName;
                storeValue = this.processArrayValue(value, generatedId, field.selectionSet, context);
            }
            else {
                var valueDataId = dataId + "." + storeFieldName;
                var generated = true;
                if (!isGeneratedId(valueDataId)) {
                    valueDataId = '$' + valueDataId;
                }
                if (dataIdFromObject) {
                    var semanticId = dataIdFromObject(value);
                    process.env.NODE_ENV === "production" ? invariant(!semanticId || !isGeneratedId(semanticId), 5) : invariant(!semanticId || !isGeneratedId(semanticId), 'IDs returned by dataIdFromObject cannot begin with the "$" character.');
                    if (semanticId ||
                        (typeof semanticId === 'number' && semanticId === 0)) {
                        valueDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(valueDataId, field, context.processedData)) {
                    this.writeSelectionSetToStore({
                        dataId: valueDataId,
                        result: value,
                        selectionSet: field.selectionSet,
                        context: context,
                    });
                }
                var typename = value.__typename;
                storeValue = toIdValue({ id: valueDataId, typename: typename }, generated);
                storeObject = store.get(dataId);
                var escapedId = storeObject && storeObject[storeFieldName];
                if (escapedId !== storeValue && isIdValue(escapedId)) {
                    var hadTypename = escapedId.typename !== undefined;
                    var hasTypename = typename !== undefined;
                    var typenameChanged = hadTypename && hasTypename && escapedId.typename !== typename;
                    process.env.NODE_ENV === "production" ? invariant(!generated || escapedId.generated || typenameChanged, 6) : invariant(!generated || escapedId.generated || typenameChanged, "Store error: the application attempted to write an object with no provided id but the store already contains an id of " + escapedId.id + " for this object. The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                    process.env.NODE_ENV === "production" ? invariant(!hadTypename || hasTypename, 7) : invariant(!hadTypename || hasTypename, "Store error: the application attempted to write an object with no provided typename but the store already contains an object with typename of " + escapedId.typename + " for the object of id " + escapedId.id + ". The selectionSet that was trying to be written is:\n" + JSON.stringify(field));
                    if (escapedId.generated) {
                        if (typenameChanged) {
                            if (!generated) {
                                store.delete(escapedId.id);
                            }
                        }
                        else {
                            mergeWithGenerated(escapedId.id, storeValue.id, store);
                        }
                    }
                }
            }
            storeObject = store.get(dataId);
            if (!storeObject || !equal(storeValue, storeObject[storeFieldName])) {
                store.set(dataId, __assign(__assign({}, storeObject), (_b = {}, _b[storeFieldName] = storeValue, _b)));
            }
        };
        StoreWriter.prototype.processArrayValue = function (value, generatedId, selectionSet, context) {
            var _this = this;
            return value.map(function (item, index) {
                if (item === null) {
                    return null;
                }
                var itemDataId = generatedId + "." + index;
                if (Array.isArray(item)) {
                    return _this.processArrayValue(item, itemDataId, selectionSet, context);
                }
                var generated = true;
                if (context.dataIdFromObject) {
                    var semanticId = context.dataIdFromObject(item);
                    if (semanticId) {
                        itemDataId = semanticId;
                        generated = false;
                    }
                }
                if (!isDataProcessed(itemDataId, selectionSet, context.processedData)) {
                    _this.writeSelectionSetToStore({
                        dataId: itemDataId,
                        result: item,
                        selectionSet: selectionSet,
                        context: context,
                    });
                }
                return toIdValue({ id: itemDataId, typename: item.__typename }, generated);
            });
        };
        return StoreWriter;
    }());
    function isGeneratedId(id) {
        return id[0] === '$';
    }
    function mergeWithGenerated(generatedKey, realKey, cache) {
        if (generatedKey === realKey) {
            return false;
        }
        var generated = cache.get(generatedKey);
        var real = cache.get(realKey);
        var madeChanges = false;
        Object.keys(generated).forEach(function (key) {
            var value = generated[key];
            var realValue = real[key];
            if (isIdValue(value) &&
                isGeneratedId(value.id) &&
                isIdValue(realValue) &&
                !equal(value, realValue) &&
                mergeWithGenerated(value.id, realValue.id, cache)) {
                madeChanges = true;
            }
        });
        cache.delete(generatedKey);
        var newRealValue = __assign(__assign({}, generated), real);
        if (equal(newRealValue, real)) {
            return madeChanges;
        }
        cache.set(realKey, newRealValue);
        return true;
    }
    function isDataProcessed(dataId, field, processedData) {
        if (!processedData) {
            return false;
        }
        if (processedData[dataId]) {
            if (processedData[dataId].indexOf(field) >= 0) {
                return true;
            }
            else {
                processedData[dataId].push(field);
            }
        }
        else {
            processedData[dataId] = [field];
        }
        return false;
    }

    var defaultConfig = {
        fragmentMatcher: new HeuristicFragmentMatcher(),
        dataIdFromObject: defaultDataIdFromObject,
        addTypename: true,
        resultCaching: true,
        freezeResults: false,
    };
    function defaultDataIdFromObject(result) {
        if (result.__typename) {
            if (result.id !== undefined) {
                return result.__typename + ":" + result.id;
            }
            if (result._id !== undefined) {
                return result.__typename + ":" + result._id;
            }
        }
        return null;
    }
    var hasOwn$1 = Object.prototype.hasOwnProperty;
    var OptimisticCacheLayer = (function (_super) {
        __extends(OptimisticCacheLayer, _super);
        function OptimisticCacheLayer(optimisticId, parent, transaction) {
            var _this = _super.call(this, Object.create(null)) || this;
            _this.optimisticId = optimisticId;
            _this.parent = parent;
            _this.transaction = transaction;
            return _this;
        }
        OptimisticCacheLayer.prototype.toObject = function () {
            return __assign(__assign({}, this.parent.toObject()), this.data);
        };
        OptimisticCacheLayer.prototype.get = function (dataId) {
            return hasOwn$1.call(this.data, dataId)
                ? this.data[dataId]
                : this.parent.get(dataId);
        };
        return OptimisticCacheLayer;
    }(ObjectCache));
    var InMemoryCache = (function (_super) {
        __extends(InMemoryCache, _super);
        function InMemoryCache(config) {
            if (config === void 0) { config = {}; }
            var _this = _super.call(this) || this;
            _this.watches = new Set();
            _this.typenameDocumentCache = new Map();
            _this.cacheKeyRoot = new KeyTrie(canUseWeakMap);
            _this.silenceBroadcast = false;
            _this.config = __assign(__assign({}, defaultConfig), config);
            if (_this.config.customResolvers) {
                process.env.NODE_ENV === "production" || invariant.warn('customResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating customResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.customResolvers;
            }
            if (_this.config.cacheResolvers) {
                process.env.NODE_ENV === "production" || invariant.warn('cacheResolvers have been renamed to cacheRedirects. Please update your config as we will be deprecating cacheResolvers in the next major version.');
                _this.config.cacheRedirects = _this.config.cacheResolvers;
            }
            _this.addTypename = !!_this.config.addTypename;
            _this.data = _this.config.resultCaching
                ? new DepTrackingCache()
                : new ObjectCache();
            _this.optimisticData = _this.data;
            _this.storeWriter = new StoreWriter();
            _this.storeReader = new StoreReader({
                cacheKeyRoot: _this.cacheKeyRoot,
                freezeResults: config.freezeResults,
            });
            var cache = _this;
            var maybeBroadcastWatch = cache.maybeBroadcastWatch;
            _this.maybeBroadcastWatch = wrap(function (c) {
                return maybeBroadcastWatch.call(_this, c);
            }, {
                makeCacheKey: function (c) {
                    if (c.optimistic) {
                        return;
                    }
                    if (c.previousResult) {
                        return;
                    }
                    if (cache.data instanceof DepTrackingCache) {
                        return cache.cacheKeyRoot.lookup(c.query, JSON.stringify(c.variables));
                    }
                }
            });
            return _this;
        }
        InMemoryCache.prototype.restore = function (data) {
            if (data)
                this.data.replace(data);
            return this;
        };
        InMemoryCache.prototype.extract = function (optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return (optimistic ? this.optimisticData : this.data).toObject();
        };
        InMemoryCache.prototype.read = function (options) {
            if (typeof options.rootId === 'string' &&
                typeof this.data.get(options.rootId) === 'undefined') {
                return null;
            }
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.readQueryFromStore({
                store: options.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(options.query),
                variables: options.variables,
                rootId: options.rootId,
                fragmentMatcherFunction: fragmentMatcherFunction,
                previousResult: options.previousResult,
                config: this.config,
            }) || null;
        };
        InMemoryCache.prototype.write = function (write) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            this.storeWriter.writeResultToStore({
                dataId: write.dataId,
                result: write.result,
                variables: write.variables,
                document: this.transformDocument(write.query),
                store: this.data,
                dataIdFromObject: this.config.dataIdFromObject,
                fragmentMatcherFunction: fragmentMatcherFunction,
            });
            this.broadcastWatches();
        };
        InMemoryCache.prototype.diff = function (query) {
            var fragmentMatcher = this.config.fragmentMatcher;
            var fragmentMatcherFunction = fragmentMatcher && fragmentMatcher.match;
            return this.storeReader.diffQueryAgainstStore({
                store: query.optimistic ? this.optimisticData : this.data,
                query: this.transformDocument(query.query),
                variables: query.variables,
                returnPartialData: query.returnPartialData,
                previousResult: query.previousResult,
                fragmentMatcherFunction: fragmentMatcherFunction,
                config: this.config,
            });
        };
        InMemoryCache.prototype.watch = function (watch) {
            var _this = this;
            this.watches.add(watch);
            return function () {
                _this.watches.delete(watch);
            };
        };
        InMemoryCache.prototype.evict = function (query) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("eviction is not implemented on InMemory Cache");
        };
        InMemoryCache.prototype.reset = function () {
            this.data.clear();
            this.broadcastWatches();
            return Promise.resolve();
        };
        InMemoryCache.prototype.removeOptimistic = function (idToRemove) {
            var toReapply = [];
            var removedCount = 0;
            var layer = this.optimisticData;
            while (layer instanceof OptimisticCacheLayer) {
                if (layer.optimisticId === idToRemove) {
                    ++removedCount;
                }
                else {
                    toReapply.push(layer);
                }
                layer = layer.parent;
            }
            if (removedCount > 0) {
                this.optimisticData = layer;
                while (toReapply.length > 0) {
                    var layer_1 = toReapply.pop();
                    this.performTransaction(layer_1.transaction, layer_1.optimisticId);
                }
                this.broadcastWatches();
            }
        };
        InMemoryCache.prototype.performTransaction = function (transaction, optimisticId) {
            var _a = this, data = _a.data, silenceBroadcast = _a.silenceBroadcast;
            this.silenceBroadcast = true;
            if (typeof optimisticId === 'string') {
                this.data = this.optimisticData = new OptimisticCacheLayer(optimisticId, this.optimisticData, transaction);
            }
            try {
                transaction(this);
            }
            finally {
                this.silenceBroadcast = silenceBroadcast;
                this.data = data;
            }
            this.broadcastWatches();
        };
        InMemoryCache.prototype.recordOptimisticTransaction = function (transaction, id) {
            return this.performTransaction(transaction, id);
        };
        InMemoryCache.prototype.transformDocument = function (document) {
            if (this.addTypename) {
                var result = this.typenameDocumentCache.get(document);
                if (!result) {
                    result = addTypenameToDocument(document);
                    this.typenameDocumentCache.set(document, result);
                    this.typenameDocumentCache.set(result, result);
                }
                return result;
            }
            return document;
        };
        InMemoryCache.prototype.broadcastWatches = function () {
            var _this = this;
            if (!this.silenceBroadcast) {
                this.watches.forEach(function (c) { return _this.maybeBroadcastWatch(c); });
            }
        };
        InMemoryCache.prototype.maybeBroadcastWatch = function (c) {
            c.callback(this.diff({
                query: c.query,
                variables: c.variables,
                previousResult: c.previousResult && c.previousResult(),
                optimistic: c.optimistic,
            }));
        };
        return InMemoryCache;
    }(ApolloCache));
    //# sourceMappingURL=bundle.esm.js.map

    var Observable_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Observable = void 0;

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    // === Symbol Support ===
    var hasSymbols = function () {
      return typeof Symbol === 'function';
    };

    var hasSymbol = function (name) {
      return hasSymbols() && Boolean(Symbol[name]);
    };

    var getSymbol = function (name) {
      return hasSymbol(name) ? Symbol[name] : '@@' + name;
    };

    if (hasSymbols() && !hasSymbol('observable')) {
      Symbol.observable = Symbol('observable');
    }

    var SymbolIterator = getSymbol('iterator');
    var SymbolObservable = getSymbol('observable');
    var SymbolSpecies = getSymbol('species'); // === Abstract Operations ===

    function getMethod(obj, key) {
      var value = obj[key];
      if (value == null) return undefined;
      if (typeof value !== 'function') throw new TypeError(value + ' is not a function');
      return value;
    }

    function getSpecies(obj) {
      var ctor = obj.constructor;

      if (ctor !== undefined) {
        ctor = ctor[SymbolSpecies];

        if (ctor === null) {
          ctor = undefined;
        }
      }

      return ctor !== undefined ? ctor : Observable;
    }

    function isObservable(x) {
      return x instanceof Observable; // SPEC: Brand check
    }

    function hostReportError(e) {
      if (hostReportError.log) {
        hostReportError.log(e);
      } else {
        setTimeout(function () {
          throw e;
        });
      }
    }

    function enqueue(fn) {
      Promise.resolve().then(function () {
        try {
          fn();
        } catch (e) {
          hostReportError(e);
        }
      });
    }

    function cleanupSubscription(subscription) {
      var cleanup = subscription._cleanup;
      if (cleanup === undefined) return;
      subscription._cleanup = undefined;

      if (!cleanup) {
        return;
      }

      try {
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          var unsubscribe = getMethod(cleanup, 'unsubscribe');

          if (unsubscribe) {
            unsubscribe.call(cleanup);
          }
        }
      } catch (e) {
        hostReportError(e);
      }
    }

    function closeSubscription(subscription) {
      subscription._observer = undefined;
      subscription._queue = undefined;
      subscription._state = 'closed';
    }

    function flushSubscription(subscription) {
      var queue = subscription._queue;

      if (!queue) {
        return;
      }

      subscription._queue = undefined;
      subscription._state = 'ready';

      for (var i = 0; i < queue.length; ++i) {
        notifySubscription(subscription, queue[i].type, queue[i].value);
        if (subscription._state === 'closed') break;
      }
    }

    function notifySubscription(subscription, type, value) {
      subscription._state = 'running';
      var observer = subscription._observer;

      try {
        var m = getMethod(observer, type);

        switch (type) {
          case 'next':
            if (m) m.call(observer, value);
            break;

          case 'error':
            closeSubscription(subscription);
            if (m) m.call(observer, value);else throw value;
            break;

          case 'complete':
            closeSubscription(subscription);
            if (m) m.call(observer);
            break;
        }
      } catch (e) {
        hostReportError(e);
      }

      if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
    }

    function onNotify(subscription, type, value) {
      if (subscription._state === 'closed') return;

      if (subscription._state === 'buffering') {
        subscription._queue.push({
          type: type,
          value: value
        });

        return;
      }

      if (subscription._state !== 'ready') {
        subscription._state = 'buffering';
        subscription._queue = [{
          type: type,
          value: value
        }];
        enqueue(function () {
          return flushSubscription(subscription);
        });
        return;
      }

      notifySubscription(subscription, type, value);
    }

    var Subscription =
    /*#__PURE__*/
    function () {
      function Subscription(observer, subscriber) {
        _classCallCheck(this, Subscription);

        // ASSERT: observer is an object
        // ASSERT: subscriber is callable
        this._cleanup = undefined;
        this._observer = observer;
        this._queue = undefined;
        this._state = 'initializing';
        var subscriptionObserver = new SubscriptionObserver(this);

        try {
          this._cleanup = subscriber.call(undefined, subscriptionObserver);
        } catch (e) {
          subscriptionObserver.error(e);
        }

        if (this._state === 'initializing') this._state = 'ready';
      }

      _createClass(Subscription, [{
        key: "unsubscribe",
        value: function unsubscribe() {
          if (this._state !== 'closed') {
            closeSubscription(this);
            cleanupSubscription(this);
          }
        }
      }, {
        key: "closed",
        get: function () {
          return this._state === 'closed';
        }
      }]);

      return Subscription;
    }();

    var SubscriptionObserver =
    /*#__PURE__*/
    function () {
      function SubscriptionObserver(subscription) {
        _classCallCheck(this, SubscriptionObserver);

        this._subscription = subscription;
      }

      _createClass(SubscriptionObserver, [{
        key: "next",
        value: function next(value) {
          onNotify(this._subscription, 'next', value);
        }
      }, {
        key: "error",
        value: function error(value) {
          onNotify(this._subscription, 'error', value);
        }
      }, {
        key: "complete",
        value: function complete() {
          onNotify(this._subscription, 'complete');
        }
      }, {
        key: "closed",
        get: function () {
          return this._subscription._state === 'closed';
        }
      }]);

      return SubscriptionObserver;
    }();

    var Observable =
    /*#__PURE__*/
    function () {
      function Observable(subscriber) {
        _classCallCheck(this, Observable);

        if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');
        if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');
        this._subscriber = subscriber;
      }

      _createClass(Observable, [{
        key: "subscribe",
        value: function subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            observer = {
              next: observer,
              error: arguments[1],
              complete: arguments[2]
            };
          }

          return new Subscription(observer, this._subscriber);
        }
      }, {
        key: "forEach",
        value: function forEach(fn) {
          var _this = this;

          return new Promise(function (resolve, reject) {
            if (typeof fn !== 'function') {
              reject(new TypeError(fn + ' is not a function'));
              return;
            }

            function done() {
              subscription.unsubscribe();
              resolve();
            }

            var subscription = _this.subscribe({
              next: function (value) {
                try {
                  fn(value, done);
                } catch (e) {
                  reject(e);
                  subscription.unsubscribe();
                }
              },
              error: reject,
              complete: resolve
            });
          });
        }
      }, {
        key: "map",
        value: function map(fn) {
          var _this2 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this2.subscribe({
              next: function (value) {
                try {
                  value = fn(value);
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "filter",
        value: function filter(fn) {
          var _this3 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            return _this3.subscribe({
              next: function (value) {
                try {
                  if (!fn(value)) return;
                } catch (e) {
                  return observer.error(e);
                }

                observer.next(value);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "reduce",
        value: function reduce(fn) {
          var _this4 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          var hasSeed = arguments.length > 1;
          var hasValue = false;
          var seed = arguments[1];
          var acc = seed;
          return new C(function (observer) {
            return _this4.subscribe({
              next: function (value) {
                var first = !hasValue;
                hasValue = true;

                if (!first || hasSeed) {
                  try {
                    acc = fn(acc, value);
                  } catch (e) {
                    return observer.error(e);
                  }
                } else {
                  acc = value;
                }
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));
                observer.next(acc);
                observer.complete();
              }
            });
          });
        }
      }, {
        key: "concat",
        value: function concat() {
          var _this5 = this;

          for (var _len = arguments.length, sources = new Array(_len), _key = 0; _key < _len; _key++) {
            sources[_key] = arguments[_key];
          }

          var C = getSpecies(this);
          return new C(function (observer) {
            var subscription;
            var index = 0;

            function startNext(next) {
              subscription = next.subscribe({
                next: function (v) {
                  observer.next(v);
                },
                error: function (e) {
                  observer.error(e);
                },
                complete: function () {
                  if (index === sources.length) {
                    subscription = undefined;
                    observer.complete();
                  } else {
                    startNext(C.from(sources[index++]));
                  }
                }
              });
            }

            startNext(_this5);
            return function () {
              if (subscription) {
                subscription.unsubscribe();
                subscription = undefined;
              }
            };
          });
        }
      }, {
        key: "flatMap",
        value: function flatMap(fn) {
          var _this6 = this;

          if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');
          var C = getSpecies(this);
          return new C(function (observer) {
            var subscriptions = [];

            var outer = _this6.subscribe({
              next: function (value) {
                if (fn) {
                  try {
                    value = fn(value);
                  } catch (e) {
                    return observer.error(e);
                  }
                }

                var inner = C.from(value).subscribe({
                  next: function (value) {
                    observer.next(value);
                  },
                  error: function (e) {
                    observer.error(e);
                  },
                  complete: function () {
                    var i = subscriptions.indexOf(inner);
                    if (i >= 0) subscriptions.splice(i, 1);
                    completeIfDone();
                  }
                });
                subscriptions.push(inner);
              },
              error: function (e) {
                observer.error(e);
              },
              complete: function () {
                completeIfDone();
              }
            });

            function completeIfDone() {
              if (outer.closed && subscriptions.length === 0) observer.complete();
            }

            return function () {
              subscriptions.forEach(function (s) {
                return s.unsubscribe();
              });
              outer.unsubscribe();
            };
          });
        }
      }, {
        key: SymbolObservable,
        value: function () {
          return this;
        }
      }], [{
        key: "from",
        value: function from(x) {
          var C = typeof this === 'function' ? this : Observable;
          if (x == null) throw new TypeError(x + ' is not an object');
          var method = getMethod(x, SymbolObservable);

          if (method) {
            var observable = method.call(x);
            if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');
            if (isObservable(observable) && observable.constructor === C) return observable;
            return new C(function (observer) {
              return observable.subscribe(observer);
            });
          }

          if (hasSymbol('iterator')) {
            method = getMethod(x, SymbolIterator);

            if (method) {
              return new C(function (observer) {
                enqueue(function () {
                  if (observer.closed) return;
                  var _iteratorNormalCompletion = true;
                  var _didIteratorError = false;
                  var _iteratorError = undefined;

                  try {
                    for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      var _item = _step.value;
                      observer.next(_item);
                      if (observer.closed) return;
                    }
                  } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion && _iterator.return != null) {
                        _iterator.return();
                      }
                    } finally {
                      if (_didIteratorError) {
                        throw _iteratorError;
                      }
                    }
                  }

                  observer.complete();
                });
              });
            }
          }

          if (Array.isArray(x)) {
            return new C(function (observer) {
              enqueue(function () {
                if (observer.closed) return;

                for (var i = 0; i < x.length; ++i) {
                  observer.next(x[i]);
                  if (observer.closed) return;
                }

                observer.complete();
              });
            });
          }

          throw new TypeError(x + ' is not observable');
        }
      }, {
        key: "of",
        value: function of() {
          for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            items[_key2] = arguments[_key2];
          }

          var C = typeof this === 'function' ? this : Observable;
          return new C(function (observer) {
            enqueue(function () {
              if (observer.closed) return;

              for (var i = 0; i < items.length; ++i) {
                observer.next(items[i]);
                if (observer.closed) return;
              }

              observer.complete();
            });
          });
        }
      }, {
        key: SymbolSpecies,
        get: function () {
          return this;
        }
      }]);

      return Observable;
    }();

    exports.Observable = Observable;

    if (hasSymbols()) {
      Object.defineProperty(Observable, Symbol('extensions'), {
        value: {
          symbol: SymbolObservable,
          hostReportError: hostReportError
        },
        configurable: true
      });
    }
    });

    unwrapExports(Observable_1);
    var Observable_2 = Observable_1.Observable;

    var zenObservable = Observable_1.Observable;

    var Observable = zenObservable;
    //# sourceMappingURL=bundle.esm.js.map

    function validateOperation(operation) {
        var OPERATION_FIELDS = [
            'query',
            'operationName',
            'variables',
            'extensions',
            'context',
        ];
        for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
            var key = _a[_i];
            if (OPERATION_FIELDS.indexOf(key) < 0) {
                throw process.env.NODE_ENV === "production" ? new InvariantError(2) : new InvariantError("illegal argument: " + key);
            }
        }
        return operation;
    }
    var LinkError = (function (_super) {
        __extends(LinkError, _super);
        function LinkError(message, link) {
            var _this = _super.call(this, message) || this;
            _this.link = link;
            return _this;
        }
        return LinkError;
    }(Error));
    function isTerminating(link) {
        return link.request.length <= 1;
    }
    function fromError(errorValue) {
        return new Observable(function (observer) {
            observer.error(errorValue);
        });
    }
    function transformOperation(operation) {
        var transformedOperation = {
            variables: operation.variables || {},
            extensions: operation.extensions || {},
            operationName: operation.operationName,
            query: operation.query,
        };
        if (!transformedOperation.operationName) {
            transformedOperation.operationName =
                typeof transformedOperation.query !== 'string'
                    ? getOperationName(transformedOperation.query)
                    : '';
        }
        return transformedOperation;
    }
    function createOperation(starting, operation) {
        var context = __assign({}, starting);
        var setContext = function (next) {
            if (typeof next === 'function') {
                context = __assign({}, context, next(context));
            }
            else {
                context = __assign({}, context, next);
            }
        };
        var getContext = function () { return (__assign({}, context)); };
        Object.defineProperty(operation, 'setContext', {
            enumerable: false,
            value: setContext,
        });
        Object.defineProperty(operation, 'getContext', {
            enumerable: false,
            value: getContext,
        });
        Object.defineProperty(operation, 'toKey', {
            enumerable: false,
            value: function () { return getKey(operation); },
        });
        return operation;
    }
    function getKey(operation) {
        var query = operation.query, variables = operation.variables, operationName = operation.operationName;
        return JSON.stringify([operationName, query, variables]);
    }

    function passthrough(op, forward) {
        return forward ? forward(op) : Observable.of();
    }
    function toLink(handler) {
        return typeof handler === 'function' ? new ApolloLink(handler) : handler;
    }
    function empty$1() {
        return new ApolloLink(function () { return Observable.of(); });
    }
    function from(links) {
        if (links.length === 0)
            return empty$1();
        return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
    }
    function split(test, left, right) {
        var leftLink = toLink(left);
        var rightLink = toLink(right || new ApolloLink(passthrough));
        if (isTerminating(leftLink) && isTerminating(rightLink)) {
            return new ApolloLink(function (operation) {
                return test(operation)
                    ? leftLink.request(operation) || Observable.of()
                    : rightLink.request(operation) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return test(operation)
                    ? leftLink.request(operation, forward) || Observable.of()
                    : rightLink.request(operation, forward) || Observable.of();
            });
        }
    }
    var concat = function (first, second) {
        var firstLink = toLink(first);
        if (isTerminating(firstLink)) {
            process.env.NODE_ENV === "production" || invariant.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
            return firstLink;
        }
        var nextLink = toLink(second);
        if (isTerminating(nextLink)) {
            return new ApolloLink(function (operation) {
                return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable.of(); }) || Observable.of();
            });
        }
        else {
            return new ApolloLink(function (operation, forward) {
                return (firstLink.request(operation, function (op) {
                    return nextLink.request(op, forward) || Observable.of();
                }) || Observable.of());
            });
        }
    };
    var ApolloLink = (function () {
        function ApolloLink(request) {
            if (request)
                this.request = request;
        }
        ApolloLink.prototype.split = function (test, left, right) {
            return this.concat(split(test, left, right || new ApolloLink(passthrough)));
        };
        ApolloLink.prototype.concat = function (next) {
            return concat(this, next);
        };
        ApolloLink.prototype.request = function (operation, forward) {
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError('request is not implemented');
        };
        ApolloLink.empty = empty$1;
        ApolloLink.from = from;
        ApolloLink.split = split;
        ApolloLink.execute = execute;
        return ApolloLink;
    }());
    function execute(link, operation) {
        return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable.of());
    }
    //# sourceMappingURL=bundle.esm.js.map

    /**
     * Converts an AST into a string, using one set of reasonable
     * formatting rules.
     */

    function print(ast) {
      return visit(ast, {
        leave: printDocASTReducer
      });
    } // TODO: provide better type coverage in future

    var printDocASTReducer = {
      Name: function Name(node) {
        return node.value;
      },
      Variable: function Variable(node) {
        return '$' + node.name;
      },
      // Document
      Document: function Document(node) {
        return join(node.definitions, '\n\n') + '\n';
      },
      OperationDefinition: function OperationDefinition(node) {
        var op = node.operation;
        var name = node.name;
        var varDefs = wrap$1('(', join(node.variableDefinitions, ', '), ')');
        var directives = join(node.directives, ' ');
        var selectionSet = node.selectionSet; // Anonymous queries with no directives or variable definitions can use
        // the query short form.

        return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
      },
      VariableDefinition: function VariableDefinition(_ref) {
        var variable = _ref.variable,
            type = _ref.type,
            defaultValue = _ref.defaultValue,
            directives = _ref.directives;
        return variable + ': ' + type + wrap$1(' = ', defaultValue) + wrap$1(' ', join(directives, ' '));
      },
      SelectionSet: function SelectionSet(_ref2) {
        var selections = _ref2.selections;
        return block(selections);
      },
      Field: function Field(_ref3) {
        var alias = _ref3.alias,
            name = _ref3.name,
            args = _ref3.arguments,
            directives = _ref3.directives,
            selectionSet = _ref3.selectionSet;
        return join([wrap$1('', alias, ': ') + name + wrap$1('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
      },
      Argument: function Argument(_ref4) {
        var name = _ref4.name,
            value = _ref4.value;
        return name + ': ' + value;
      },
      // Fragments
      FragmentSpread: function FragmentSpread(_ref5) {
        var name = _ref5.name,
            directives = _ref5.directives;
        return '...' + name + wrap$1(' ', join(directives, ' '));
      },
      InlineFragment: function InlineFragment(_ref6) {
        var typeCondition = _ref6.typeCondition,
            directives = _ref6.directives,
            selectionSet = _ref6.selectionSet;
        return join(['...', wrap$1('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
      },
      FragmentDefinition: function FragmentDefinition(_ref7) {
        var name = _ref7.name,
            typeCondition = _ref7.typeCondition,
            variableDefinitions = _ref7.variableDefinitions,
            directives = _ref7.directives,
            selectionSet = _ref7.selectionSet;
        return (// Note: fragment variable definitions are experimental and may be changed
          // or removed in the future.
          "fragment ".concat(name).concat(wrap$1('(', join(variableDefinitions, ', '), ')'), " ") + "on ".concat(typeCondition, " ").concat(wrap$1('', join(directives, ' '), ' ')) + selectionSet
        );
      },
      // Value
      IntValue: function IntValue(_ref8) {
        var value = _ref8.value;
        return value;
      },
      FloatValue: function FloatValue(_ref9) {
        var value = _ref9.value;
        return value;
      },
      StringValue: function StringValue(_ref10, key) {
        var value = _ref10.value,
            isBlockString = _ref10.block;
        return isBlockString ? printBlockString(value, key === 'description' ? '' : '  ') : JSON.stringify(value);
      },
      BooleanValue: function BooleanValue(_ref11) {
        var value = _ref11.value;
        return value ? 'true' : 'false';
      },
      NullValue: function NullValue() {
        return 'null';
      },
      EnumValue: function EnumValue(_ref12) {
        var value = _ref12.value;
        return value;
      },
      ListValue: function ListValue(_ref13) {
        var values = _ref13.values;
        return '[' + join(values, ', ') + ']';
      },
      ObjectValue: function ObjectValue(_ref14) {
        var fields = _ref14.fields;
        return '{' + join(fields, ', ') + '}';
      },
      ObjectField: function ObjectField(_ref15) {
        var name = _ref15.name,
            value = _ref15.value;
        return name + ': ' + value;
      },
      // Directive
      Directive: function Directive(_ref16) {
        var name = _ref16.name,
            args = _ref16.arguments;
        return '@' + name + wrap$1('(', join(args, ', '), ')');
      },
      // Type
      NamedType: function NamedType(_ref17) {
        var name = _ref17.name;
        return name;
      },
      ListType: function ListType(_ref18) {
        var type = _ref18.type;
        return '[' + type + ']';
      },
      NonNullType: function NonNullType(_ref19) {
        var type = _ref19.type;
        return type + '!';
      },
      // Type System Definitions
      SchemaDefinition: function SchemaDefinition(_ref20) {
        var directives = _ref20.directives,
            operationTypes = _ref20.operationTypes;
        return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
        var operation = _ref21.operation,
            type = _ref21.type;
        return operation + ': ' + type;
      },
      ScalarTypeDefinition: addDescription(function (_ref22) {
        var name = _ref22.name,
            directives = _ref22.directives;
        return join(['scalar', name, join(directives, ' ')], ' ');
      }),
      ObjectTypeDefinition: addDescription(function (_ref23) {
        var name = _ref23.name,
            interfaces = _ref23.interfaces,
            directives = _ref23.directives,
            fields = _ref23.fields;
        return join(['type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      }),
      FieldDefinition: addDescription(function (_ref24) {
        var name = _ref24.name,
            args = _ref24.arguments,
            type = _ref24.type,
            directives = _ref24.directives;
        return name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + ': ' + type + wrap$1(' ', join(directives, ' '));
      }),
      InputValueDefinition: addDescription(function (_ref25) {
        var name = _ref25.name,
            type = _ref25.type,
            defaultValue = _ref25.defaultValue,
            directives = _ref25.directives;
        return join([name + ': ' + type, wrap$1('= ', defaultValue), join(directives, ' ')], ' ');
      }),
      InterfaceTypeDefinition: addDescription(function (_ref26) {
        var name = _ref26.name,
            directives = _ref26.directives,
            fields = _ref26.fields;
        return join(['interface', name, join(directives, ' '), block(fields)], ' ');
      }),
      UnionTypeDefinition: addDescription(function (_ref27) {
        var name = _ref27.name,
            directives = _ref27.directives,
            types = _ref27.types;
        return join(['union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      }),
      EnumTypeDefinition: addDescription(function (_ref28) {
        var name = _ref28.name,
            directives = _ref28.directives,
            values = _ref28.values;
        return join(['enum', name, join(directives, ' '), block(values)], ' ');
      }),
      EnumValueDefinition: addDescription(function (_ref29) {
        var name = _ref29.name,
            directives = _ref29.directives;
        return join([name, join(directives, ' ')], ' ');
      }),
      InputObjectTypeDefinition: addDescription(function (_ref30) {
        var name = _ref30.name,
            directives = _ref30.directives,
            fields = _ref30.fields;
        return join(['input', name, join(directives, ' '), block(fields)], ' ');
      }),
      DirectiveDefinition: addDescription(function (_ref31) {
        var name = _ref31.name,
            args = _ref31.arguments,
            repeatable = _ref31.repeatable,
            locations = _ref31.locations;
        return 'directive @' + name + (hasMultilineItems(args) ? wrap$1('(\n', indent(join(args, '\n')), '\n)') : wrap$1('(', join(args, ', '), ')')) + (repeatable ? ' repeatable' : '') + ' on ' + join(locations, ' | ');
      }),
      SchemaExtension: function SchemaExtension(_ref32) {
        var directives = _ref32.directives,
            operationTypes = _ref32.operationTypes;
        return join(['extend schema', join(directives, ' '), block(operationTypes)], ' ');
      },
      ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
        var name = _ref33.name,
            directives = _ref33.directives;
        return join(['extend scalar', name, join(directives, ' ')], ' ');
      },
      ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
        var name = _ref34.name,
            interfaces = _ref34.interfaces,
            directives = _ref34.directives,
            fields = _ref34.fields;
        return join(['extend type', name, wrap$1('implements ', join(interfaces, ' & ')), join(directives, ' '), block(fields)], ' ');
      },
      InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
        var name = _ref35.name,
            directives = _ref35.directives,
            fields = _ref35.fields;
        return join(['extend interface', name, join(directives, ' '), block(fields)], ' ');
      },
      UnionTypeExtension: function UnionTypeExtension(_ref36) {
        var name = _ref36.name,
            directives = _ref36.directives,
            types = _ref36.types;
        return join(['extend union', name, join(directives, ' '), types && types.length !== 0 ? '= ' + join(types, ' | ') : ''], ' ');
      },
      EnumTypeExtension: function EnumTypeExtension(_ref37) {
        var name = _ref37.name,
            directives = _ref37.directives,
            values = _ref37.values;
        return join(['extend enum', name, join(directives, ' '), block(values)], ' ');
      },
      InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
        var name = _ref38.name,
            directives = _ref38.directives,
            fields = _ref38.fields;
        return join(['extend input', name, join(directives, ' '), block(fields)], ' ');
      }
    };

    function addDescription(cb) {
      return function (node) {
        return join([node.description, cb(node)], '\n');
      };
    }
    /**
     * Given maybeArray, print an empty string if it is null or empty, otherwise
     * print all items together separated by separator if provided
     */


    function join(maybeArray, separator) {
      return maybeArray ? maybeArray.filter(function (x) {
        return x;
      }).join(separator || '') : '';
    }
    /**
     * Given array, print each item on its own line, wrapped in an
     * indented "{ }" block.
     */


    function block(array) {
      return array && array.length !== 0 ? '{\n' + indent(join(array, '\n')) + '\n}' : '';
    }
    /**
     * If maybeString is not null or empty, then wrap with start and end, otherwise
     * print an empty string.
     */


    function wrap$1(start, maybeString, end) {
      return maybeString ? start + maybeString + (end || '') : '';
    }

    function indent(maybeString) {
      return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
    }

    function isMultiline(string) {
      return string.indexOf('\n') !== -1;
    }

    function hasMultilineItems(maybeArray) {
      return maybeArray && maybeArray.some(isMultiline);
    }

    var defaultHttpOptions = {
        includeQuery: true,
        includeExtensions: false,
    };
    var defaultHeaders = {
        accept: '*/*',
        'content-type': 'application/json',
    };
    var defaultOptions = {
        method: 'POST',
    };
    var fallbackHttpConfig = {
        http: defaultHttpOptions,
        headers: defaultHeaders,
        options: defaultOptions,
    };
    var throwServerError = function (response, result, message) {
        var error = new Error(message);
        error.name = 'ServerError';
        error.response = response;
        error.statusCode = response.status;
        error.result = result;
        throw error;
    };
    var parseAndCheckHttpResponse = function (operations) { return function (response) {
        return (response
            .text()
            .then(function (bodyText) {
            try {
                return JSON.parse(bodyText);
            }
            catch (err) {
                var parseError = err;
                parseError.name = 'ServerParseError';
                parseError.response = response;
                parseError.statusCode = response.status;
                parseError.bodyText = bodyText;
                return Promise.reject(parseError);
            }
        })
            .then(function (result) {
            if (response.status >= 300) {
                throwServerError(response, result, "Response not successful: Received status code " + response.status);
            }
            if (!Array.isArray(result) &&
                !result.hasOwnProperty('data') &&
                !result.hasOwnProperty('errors')) {
                throwServerError(response, result, "Server response was missing for query '" + (Array.isArray(operations)
                    ? operations.map(function (op) { return op.operationName; })
                    : operations.operationName) + "'.");
            }
            return result;
        }));
    }; };
    var checkFetcher = function (fetcher) {
        if (!fetcher && typeof fetch === 'undefined') {
            var library = 'unfetch';
            if (typeof window === 'undefined')
                library = 'node-fetch';
            throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("\nfetch is not found globally and no fetcher passed, to fix pass a fetch for\nyour environment like https://www.npmjs.com/package/" + library + ".\n\nFor example:\nimport fetch from '" + library + "';\nimport { createHttpLink } from 'apollo-link-http';\n\nconst link = createHttpLink({ uri: '/graphql', fetch: fetch });");
        }
    };
    var createSignalIfSupported = function () {
        if (typeof AbortController === 'undefined')
            return { controller: false, signal: false };
        var controller = new AbortController();
        var signal = controller.signal;
        return { controller: controller, signal: signal };
    };
    var selectHttpOptionsAndBody = function (operation, fallbackConfig) {
        var configs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            configs[_i - 2] = arguments[_i];
        }
        var options = __assign({}, fallbackConfig.options, { headers: fallbackConfig.headers, credentials: fallbackConfig.credentials });
        var http = fallbackConfig.http;
        configs.forEach(function (config) {
            options = __assign({}, options, config.options, { headers: __assign({}, options.headers, config.headers) });
            if (config.credentials)
                options.credentials = config.credentials;
            http = __assign({}, http, config.http);
        });
        var operationName = operation.operationName, extensions = operation.extensions, variables = operation.variables, query = operation.query;
        var body = { operationName: operationName, variables: variables };
        if (http.includeExtensions)
            body.extensions = extensions;
        if (http.includeQuery)
            body.query = print(query);
        return {
            options: options,
            body: body,
        };
    };
    var serializeFetchParameter = function (p, label) {
        var serialized;
        try {
            serialized = JSON.stringify(p);
        }
        catch (e) {
            var parseError = process.env.NODE_ENV === "production" ? new InvariantError(2) : new InvariantError("Network request failed. " + label + " is not serializable: " + e.message);
            parseError.parseError = e;
            throw parseError;
        }
        return serialized;
    };
    var selectURI = function (operation, fallbackURI) {
        var context = operation.getContext();
        var contextURI = context.uri;
        if (contextURI) {
            return contextURI;
        }
        else if (typeof fallbackURI === 'function') {
            return fallbackURI(operation);
        }
        else {
            return fallbackURI || '/graphql';
        }
    };
    //# sourceMappingURL=bundle.esm.js.map

    var createHttpLink = function (linkOptions) {
        if (linkOptions === void 0) { linkOptions = {}; }
        var _a = linkOptions.uri, uri = _a === void 0 ? '/graphql' : _a, fetcher = linkOptions.fetch, includeExtensions = linkOptions.includeExtensions, useGETForQueries = linkOptions.useGETForQueries, requestOptions = __rest(linkOptions, ["uri", "fetch", "includeExtensions", "useGETForQueries"]);
        checkFetcher(fetcher);
        if (!fetcher) {
            fetcher = fetch;
        }
        var linkConfig = {
            http: { includeExtensions: includeExtensions },
            options: requestOptions.fetchOptions,
            credentials: requestOptions.credentials,
            headers: requestOptions.headers,
        };
        return new ApolloLink(function (operation) {
            var chosenURI = selectURI(operation, uri);
            var context = operation.getContext();
            var clientAwarenessHeaders = {};
            if (context.clientAwareness) {
                var _a = context.clientAwareness, name_1 = _a.name, version = _a.version;
                if (name_1) {
                    clientAwarenessHeaders['apollographql-client-name'] = name_1;
                }
                if (version) {
                    clientAwarenessHeaders['apollographql-client-version'] = version;
                }
            }
            var contextHeaders = __assign({}, clientAwarenessHeaders, context.headers);
            var contextConfig = {
                http: context.http,
                options: context.fetchOptions,
                credentials: context.credentials,
                headers: contextHeaders,
            };
            var _b = selectHttpOptionsAndBody(operation, fallbackHttpConfig, linkConfig, contextConfig), options = _b.options, body = _b.body;
            var controller;
            if (!options.signal) {
                var _c = createSignalIfSupported(), _controller = _c.controller, signal = _c.signal;
                controller = _controller;
                if (controller)
                    options.signal = signal;
            }
            var definitionIsMutation = function (d) {
                return d.kind === 'OperationDefinition' && d.operation === 'mutation';
            };
            if (useGETForQueries &&
                !operation.query.definitions.some(definitionIsMutation)) {
                options.method = 'GET';
            }
            if (options.method === 'GET') {
                var _d = rewriteURIForGET(chosenURI, body), newURI = _d.newURI, parseError = _d.parseError;
                if (parseError) {
                    return fromError(parseError);
                }
                chosenURI = newURI;
            }
            else {
                try {
                    options.body = serializeFetchParameter(body, 'Payload');
                }
                catch (parseError) {
                    return fromError(parseError);
                }
            }
            return new Observable(function (observer) {
                fetcher(chosenURI, options)
                    .then(function (response) {
                    operation.setContext({ response: response });
                    return response;
                })
                    .then(parseAndCheckHttpResponse(operation))
                    .then(function (result) {
                    observer.next(result);
                    observer.complete();
                    return result;
                })
                    .catch(function (err) {
                    if (err.name === 'AbortError')
                        return;
                    if (err.result && err.result.errors && err.result.data) {
                        observer.next(err.result);
                    }
                    observer.error(err);
                });
                return function () {
                    if (controller)
                        controller.abort();
                };
            });
        });
    };
    function rewriteURIForGET(chosenURI, body) {
        var queryParams = [];
        var addQueryParam = function (key, value) {
            queryParams.push(key + "=" + encodeURIComponent(value));
        };
        if ('query' in body) {
            addQueryParam('query', body.query);
        }
        if (body.operationName) {
            addQueryParam('operationName', body.operationName);
        }
        if (body.variables) {
            var serializedVariables = void 0;
            try {
                serializedVariables = serializeFetchParameter(body.variables, 'Variables map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('variables', serializedVariables);
        }
        if (body.extensions) {
            var serializedExtensions = void 0;
            try {
                serializedExtensions = serializeFetchParameter(body.extensions, 'Extensions map');
            }
            catch (parseError) {
                return { parseError: parseError };
            }
            addQueryParam('extensions', serializedExtensions);
        }
        var fragment = '', preFragment = chosenURI;
        var fragmentStart = chosenURI.indexOf('#');
        if (fragmentStart !== -1) {
            fragment = chosenURI.substr(fragmentStart);
            preFragment = chosenURI.substr(0, fragmentStart);
        }
        var queryParamsPrefix = preFragment.indexOf('?') === -1 ? '?' : '&';
        var newURI = preFragment + queryParamsPrefix + queryParams.join('&') + fragment;
        return { newURI: newURI };
    }
    var HttpLink = (function (_super) {
        __extends(HttpLink, _super);
        function HttpLink(opts) {
            return _super.call(this, createHttpLink(opts).request) || this;
        }
        return HttpLink;
    }(ApolloLink));
    //# sourceMappingURL=bundle.esm.js.map

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {
    			result = Symbol('observable');
    			Symbol.observable = result;
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    var result = symbolObservablePonyfill(root);

    var NetworkStatus;
    (function (NetworkStatus) {
        NetworkStatus[NetworkStatus["loading"] = 1] = "loading";
        NetworkStatus[NetworkStatus["setVariables"] = 2] = "setVariables";
        NetworkStatus[NetworkStatus["fetchMore"] = 3] = "fetchMore";
        NetworkStatus[NetworkStatus["refetch"] = 4] = "refetch";
        NetworkStatus[NetworkStatus["poll"] = 6] = "poll";
        NetworkStatus[NetworkStatus["ready"] = 7] = "ready";
        NetworkStatus[NetworkStatus["error"] = 8] = "error";
    })(NetworkStatus || (NetworkStatus = {}));
    function isNetworkRequestInFlight(networkStatus) {
        return networkStatus < 7;
    }

    var Observable$1 = (function (_super) {
        __extends(Observable, _super);
        function Observable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Observable.prototype[result] = function () {
            return this;
        };
        Observable.prototype['@@observable'] = function () {
            return this;
        };
        return Observable;
    }(Observable));

    function isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function isApolloError(err) {
        return err.hasOwnProperty('graphQLErrors');
    }
    var generateErrorMessage = function (err) {
        var message = '';
        if (isNonEmptyArray(err.graphQLErrors)) {
            err.graphQLErrors.forEach(function (graphQLError) {
                var errorMessage = graphQLError
                    ? graphQLError.message
                    : 'Error message not found.';
                message += "GraphQL error: " + errorMessage + "\n";
            });
        }
        if (err.networkError) {
            message += 'Network error: ' + err.networkError.message + '\n';
        }
        message = message.replace(/\n$/, '');
        return message;
    };
    var ApolloError = (function (_super) {
        __extends(ApolloError, _super);
        function ApolloError(_a) {
            var graphQLErrors = _a.graphQLErrors, networkError = _a.networkError, errorMessage = _a.errorMessage, extraInfo = _a.extraInfo;
            var _this = _super.call(this, errorMessage) || this;
            _this.graphQLErrors = graphQLErrors || [];
            _this.networkError = networkError || null;
            if (!errorMessage) {
                _this.message = generateErrorMessage(_this);
            }
            else {
                _this.message = errorMessage;
            }
            _this.extraInfo = extraInfo;
            _this.__proto__ = ApolloError.prototype;
            return _this;
        }
        return ApolloError;
    }(Error));

    var FetchType;
    (function (FetchType) {
        FetchType[FetchType["normal"] = 1] = "normal";
        FetchType[FetchType["refetch"] = 2] = "refetch";
        FetchType[FetchType["poll"] = 3] = "poll";
    })(FetchType || (FetchType = {}));

    var hasError = function (storeValue, policy) {
        if (policy === void 0) { policy = 'none'; }
        return storeValue && (storeValue.networkError ||
            (policy === 'none' && isNonEmptyArray(storeValue.graphQLErrors)));
    };
    var ObservableQuery = (function (_super) {
        __extends(ObservableQuery, _super);
        function ObservableQuery(_a) {
            var queryManager = _a.queryManager, options = _a.options, _b = _a.shouldSubscribe, shouldSubscribe = _b === void 0 ? true : _b;
            var _this = _super.call(this, function (observer) {
                return _this.onSubscribe(observer);
            }) || this;
            _this.observers = new Set();
            _this.subscriptions = new Set();
            _this.isTornDown = false;
            _this.options = options;
            _this.variables = options.variables || {};
            _this.queryId = queryManager.generateQueryId();
            _this.shouldSubscribe = shouldSubscribe;
            var opDef = getOperationDefinition(options.query);
            _this.queryName = opDef && opDef.name && opDef.name.value;
            _this.queryManager = queryManager;
            return _this;
        }
        ObservableQuery.prototype.result = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var observer = {
                    next: function (result) {
                        resolve(result);
                        _this.observers.delete(observer);
                        if (!_this.observers.size) {
                            _this.queryManager.removeQuery(_this.queryId);
                        }
                        setTimeout(function () {
                            subscription.unsubscribe();
                        }, 0);
                    },
                    error: reject,
                };
                var subscription = _this.subscribe(observer);
            });
        };
        ObservableQuery.prototype.currentResult = function () {
            var result = this.getCurrentResult();
            if (result.data === undefined) {
                result.data = {};
            }
            return result;
        };
        ObservableQuery.prototype.getCurrentResult = function () {
            if (this.isTornDown) {
                var lastResult = this.lastResult;
                return {
                    data: !this.lastError && lastResult && lastResult.data || void 0,
                    error: this.lastError,
                    loading: false,
                    networkStatus: NetworkStatus.error,
                };
            }
            var _a = this.queryManager.getCurrentQueryResult(this), data = _a.data, partial = _a.partial;
            var queryStoreValue = this.queryManager.queryStore.get(this.queryId);
            var result;
            var fetchPolicy = this.options.fetchPolicy;
            var isNetworkFetchPolicy = fetchPolicy === 'network-only' ||
                fetchPolicy === 'no-cache';
            if (queryStoreValue) {
                var networkStatus = queryStoreValue.networkStatus;
                if (hasError(queryStoreValue, this.options.errorPolicy)) {
                    return {
                        data: void 0,
                        loading: false,
                        networkStatus: networkStatus,
                        error: new ApolloError({
                            graphQLErrors: queryStoreValue.graphQLErrors,
                            networkError: queryStoreValue.networkError,
                        }),
                    };
                }
                if (queryStoreValue.variables) {
                    this.options.variables = __assign(__assign({}, this.options.variables), queryStoreValue.variables);
                    this.variables = this.options.variables;
                }
                result = {
                    data: data,
                    loading: isNetworkRequestInFlight(networkStatus),
                    networkStatus: networkStatus,
                };
                if (queryStoreValue.graphQLErrors && this.options.errorPolicy === 'all') {
                    result.errors = queryStoreValue.graphQLErrors;
                }
            }
            else {
                var loading = isNetworkFetchPolicy ||
                    (partial && fetchPolicy !== 'cache-only');
                result = {
                    data: data,
                    loading: loading,
                    networkStatus: loading ? NetworkStatus.loading : NetworkStatus.ready,
                };
            }
            if (!partial) {
                this.updateLastResult(__assign(__assign({}, result), { stale: false }));
            }
            return __assign(__assign({}, result), { partial: partial });
        };
        ObservableQuery.prototype.isDifferentFromLastResult = function (newResult) {
            var snapshot = this.lastResultSnapshot;
            return !(snapshot &&
                newResult &&
                snapshot.networkStatus === newResult.networkStatus &&
                snapshot.stale === newResult.stale &&
                equal(snapshot.data, newResult.data));
        };
        ObservableQuery.prototype.getLastResult = function () {
            return this.lastResult;
        };
        ObservableQuery.prototype.getLastError = function () {
            return this.lastError;
        };
        ObservableQuery.prototype.resetLastResults = function () {
            delete this.lastResult;
            delete this.lastResultSnapshot;
            delete this.lastError;
            this.isTornDown = false;
        };
        ObservableQuery.prototype.resetQueryStoreErrors = function () {
            var queryStore = this.queryManager.queryStore.get(this.queryId);
            if (queryStore) {
                queryStore.networkError = null;
                queryStore.graphQLErrors = [];
            }
        };
        ObservableQuery.prototype.refetch = function (variables) {
            var fetchPolicy = this.options.fetchPolicy;
            if (fetchPolicy === 'cache-only') {
                return Promise.reject(process.env.NODE_ENV === "production" ? new InvariantError(3) : new InvariantError('cache-only fetchPolicy option should not be used together with query refetch.'));
            }
            if (fetchPolicy !== 'no-cache' &&
                fetchPolicy !== 'cache-and-network') {
                fetchPolicy = 'network-only';
            }
            if (!equal(this.variables, variables)) {
                this.variables = __assign(__assign({}, this.variables), variables);
            }
            if (!equal(this.options.variables, this.variables)) {
                this.options.variables = __assign(__assign({}, this.options.variables), this.variables);
            }
            return this.queryManager.fetchQuery(this.queryId, __assign(__assign({}, this.options), { fetchPolicy: fetchPolicy }), FetchType.refetch);
        };
        ObservableQuery.prototype.fetchMore = function (fetchMoreOptions) {
            var _this = this;
            process.env.NODE_ENV === "production" ? invariant(fetchMoreOptions.updateQuery, 4) : invariant(fetchMoreOptions.updateQuery, 'updateQuery option is required. This function defines how to update the query data with the new results.');
            var combinedOptions = __assign(__assign({}, (fetchMoreOptions.query ? fetchMoreOptions : __assign(__assign(__assign({}, this.options), fetchMoreOptions), { variables: __assign(__assign({}, this.variables), fetchMoreOptions.variables) }))), { fetchPolicy: 'network-only' });
            var qid = this.queryManager.generateQueryId();
            return this.queryManager
                .fetchQuery(qid, combinedOptions, FetchType.normal, this.queryId)
                .then(function (fetchMoreResult) {
                _this.updateQuery(function (previousResult) {
                    return fetchMoreOptions.updateQuery(previousResult, {
                        fetchMoreResult: fetchMoreResult.data,
                        variables: combinedOptions.variables,
                    });
                });
                _this.queryManager.stopQuery(qid);
                return fetchMoreResult;
            }, function (error) {
                _this.queryManager.stopQuery(qid);
                throw error;
            });
        };
        ObservableQuery.prototype.subscribeToMore = function (options) {
            var _this = this;
            var subscription = this.queryManager
                .startGraphQLSubscription({
                query: options.document,
                variables: options.variables,
            })
                .subscribe({
                next: function (subscriptionData) {
                    var updateQuery = options.updateQuery;
                    if (updateQuery) {
                        _this.updateQuery(function (previous, _a) {
                            var variables = _a.variables;
                            return updateQuery(previous, {
                                subscriptionData: subscriptionData,
                                variables: variables,
                            });
                        });
                    }
                },
                error: function (err) {
                    if (options.onError) {
                        options.onError(err);
                        return;
                    }
                    process.env.NODE_ENV === "production" || invariant.error('Unhandled GraphQL subscription error', err);
                },
            });
            this.subscriptions.add(subscription);
            return function () {
                if (_this.subscriptions.delete(subscription)) {
                    subscription.unsubscribe();
                }
            };
        };
        ObservableQuery.prototype.setOptions = function (opts) {
            var oldFetchPolicy = this.options.fetchPolicy;
            this.options = __assign(__assign({}, this.options), opts);
            if (opts.pollInterval) {
                this.startPolling(opts.pollInterval);
            }
            else if (opts.pollInterval === 0) {
                this.stopPolling();
            }
            var fetchPolicy = opts.fetchPolicy;
            return this.setVariables(this.options.variables, oldFetchPolicy !== fetchPolicy && (oldFetchPolicy === 'cache-only' ||
                oldFetchPolicy === 'standby' ||
                fetchPolicy === 'network-only'), opts.fetchResults);
        };
        ObservableQuery.prototype.setVariables = function (variables, tryFetch, fetchResults) {
            if (tryFetch === void 0) { tryFetch = false; }
            if (fetchResults === void 0) { fetchResults = true; }
            this.isTornDown = false;
            variables = variables || this.variables;
            if (!tryFetch && equal(variables, this.variables)) {
                return this.observers.size && fetchResults
                    ? this.result()
                    : Promise.resolve();
            }
            this.variables = this.options.variables = variables;
            if (!this.observers.size) {
                return Promise.resolve();
            }
            return this.queryManager.fetchQuery(this.queryId, this.options);
        };
        ObservableQuery.prototype.updateQuery = function (mapFn) {
            var queryManager = this.queryManager;
            var _a = queryManager.getQueryWithPreviousResult(this.queryId), previousResult = _a.previousResult, variables = _a.variables, document = _a.document;
            var newResult = tryFunctionOrLogError(function () {
                return mapFn(previousResult, { variables: variables });
            });
            if (newResult) {
                queryManager.dataStore.markUpdateQueryResult(document, variables, newResult);
                queryManager.broadcastQueries();
            }
        };
        ObservableQuery.prototype.stopPolling = function () {
            this.queryManager.stopPollingQuery(this.queryId);
            this.options.pollInterval = undefined;
        };
        ObservableQuery.prototype.startPolling = function (pollInterval) {
            assertNotCacheFirstOrOnly(this);
            this.options.pollInterval = pollInterval;
            this.queryManager.startPollingQuery(this.options, this.queryId);
        };
        ObservableQuery.prototype.updateLastResult = function (newResult) {
            var previousResult = this.lastResult;
            this.lastResult = newResult;
            this.lastResultSnapshot = this.queryManager.assumeImmutableResults
                ? newResult
                : cloneDeep(newResult);
            return previousResult;
        };
        ObservableQuery.prototype.onSubscribe = function (observer) {
            var _this = this;
            try {
                var subObserver = observer._subscription._observer;
                if (subObserver && !subObserver.error) {
                    subObserver.error = defaultSubscriptionObserverErrorCallback;
                }
            }
            catch (_a) { }
            var first = !this.observers.size;
            this.observers.add(observer);
            if (observer.next && this.lastResult)
                observer.next(this.lastResult);
            if (observer.error && this.lastError)
                observer.error(this.lastError);
            if (first) {
                this.setUpQuery();
            }
            return function () {
                if (_this.observers.delete(observer) && !_this.observers.size) {
                    _this.tearDownQuery();
                }
            };
        };
        ObservableQuery.prototype.setUpQuery = function () {
            var _this = this;
            var _a = this, queryManager = _a.queryManager, queryId = _a.queryId;
            if (this.shouldSubscribe) {
                queryManager.addObservableQuery(queryId, this);
            }
            if (this.options.pollInterval) {
                assertNotCacheFirstOrOnly(this);
                queryManager.startPollingQuery(this.options, queryId);
            }
            var onError = function (error) {
                _this.updateLastResult(__assign(__assign({}, _this.lastResult), { errors: error.graphQLErrors, networkStatus: NetworkStatus.error, loading: false }));
                iterateObserversSafely(_this.observers, 'error', _this.lastError = error);
            };
            queryManager.observeQuery(queryId, this.options, {
                next: function (result) {
                    if (_this.lastError || _this.isDifferentFromLastResult(result)) {
                        var previousResult_1 = _this.updateLastResult(result);
                        var _a = _this.options, query_1 = _a.query, variables = _a.variables, fetchPolicy_1 = _a.fetchPolicy;
                        if (queryManager.transform(query_1).hasClientExports) {
                            queryManager.getLocalState().addExportedVariables(query_1, variables).then(function (variables) {
                                var previousVariables = _this.variables;
                                _this.variables = _this.options.variables = variables;
                                if (!result.loading &&
                                    previousResult_1 &&
                                    fetchPolicy_1 !== 'cache-only' &&
                                    queryManager.transform(query_1).serverQuery &&
                                    !equal(previousVariables, variables)) {
                                    _this.refetch();
                                }
                                else {
                                    iterateObserversSafely(_this.observers, 'next', result);
                                }
                            });
                        }
                        else {
                            iterateObserversSafely(_this.observers, 'next', result);
                        }
                    }
                },
                error: onError,
            }).catch(onError);
        };
        ObservableQuery.prototype.tearDownQuery = function () {
            var queryManager = this.queryManager;
            this.isTornDown = true;
            queryManager.stopPollingQuery(this.queryId);
            this.subscriptions.forEach(function (sub) { return sub.unsubscribe(); });
            this.subscriptions.clear();
            queryManager.removeObservableQuery(this.queryId);
            queryManager.stopQuery(this.queryId);
            this.observers.clear();
        };
        return ObservableQuery;
    }(Observable$1));
    function defaultSubscriptionObserverErrorCallback(error) {
        process.env.NODE_ENV === "production" || invariant.error('Unhandled error', error.message, error.stack);
    }
    function iterateObserversSafely(observers, method, argument) {
        var observersWithMethod = [];
        observers.forEach(function (obs) { return obs[method] && observersWithMethod.push(obs); });
        observersWithMethod.forEach(function (obs) { return obs[method](argument); });
    }
    function assertNotCacheFirstOrOnly(obsQuery) {
        var fetchPolicy = obsQuery.options.fetchPolicy;
        process.env.NODE_ENV === "production" ? invariant(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only', 5) : invariant(fetchPolicy !== 'cache-first' && fetchPolicy !== 'cache-only', 'Queries that specify the cache-first and cache-only fetchPolicies cannot also be polling queries.');
    }

    var MutationStore = (function () {
        function MutationStore() {
            this.store = {};
        }
        MutationStore.prototype.getStore = function () {
            return this.store;
        };
        MutationStore.prototype.get = function (mutationId) {
            return this.store[mutationId];
        };
        MutationStore.prototype.initMutation = function (mutationId, mutation, variables) {
            this.store[mutationId] = {
                mutation: mutation,
                variables: variables || {},
                loading: true,
                error: null,
            };
        };
        MutationStore.prototype.markMutationError = function (mutationId, error) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = error;
            }
        };
        MutationStore.prototype.markMutationResult = function (mutationId) {
            var mutation = this.store[mutationId];
            if (mutation) {
                mutation.loading = false;
                mutation.error = null;
            }
        };
        MutationStore.prototype.reset = function () {
            this.store = {};
        };
        return MutationStore;
    }());

    var QueryStore = (function () {
        function QueryStore() {
            this.store = {};
        }
        QueryStore.prototype.getStore = function () {
            return this.store;
        };
        QueryStore.prototype.get = function (queryId) {
            return this.store[queryId];
        };
        QueryStore.prototype.initQuery = function (query) {
            var previousQuery = this.store[query.queryId];
            process.env.NODE_ENV === "production" ? invariant(!previousQuery ||
                previousQuery.document === query.document ||
                equal(previousQuery.document, query.document), 19) : invariant(!previousQuery ||
                previousQuery.document === query.document ||
                equal(previousQuery.document, query.document), 'Internal Error: may not update existing query string in store');
            var isSetVariables = false;
            var previousVariables = null;
            if (query.storePreviousVariables &&
                previousQuery &&
                previousQuery.networkStatus !== NetworkStatus.loading) {
                if (!equal(previousQuery.variables, query.variables)) {
                    isSetVariables = true;
                    previousVariables = previousQuery.variables;
                }
            }
            var networkStatus;
            if (isSetVariables) {
                networkStatus = NetworkStatus.setVariables;
            }
            else if (query.isPoll) {
                networkStatus = NetworkStatus.poll;
            }
            else if (query.isRefetch) {
                networkStatus = NetworkStatus.refetch;
            }
            else {
                networkStatus = NetworkStatus.loading;
            }
            var graphQLErrors = [];
            if (previousQuery && previousQuery.graphQLErrors) {
                graphQLErrors = previousQuery.graphQLErrors;
            }
            this.store[query.queryId] = {
                document: query.document,
                variables: query.variables,
                previousVariables: previousVariables,
                networkError: null,
                graphQLErrors: graphQLErrors,
                networkStatus: networkStatus,
                metadata: query.metadata,
            };
            if (typeof query.fetchMoreForQueryId === 'string' &&
                this.store[query.fetchMoreForQueryId]) {
                this.store[query.fetchMoreForQueryId].networkStatus =
                    NetworkStatus.fetchMore;
            }
        };
        QueryStore.prototype.markQueryResult = function (queryId, result, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = null;
            this.store[queryId].graphQLErrors = isNonEmptyArray(result.errors) ? result.errors : [];
            this.store[queryId].previousVariables = null;
            this.store[queryId].networkStatus = NetworkStatus.ready;
            if (typeof fetchMoreForQueryId === 'string' &&
                this.store[fetchMoreForQueryId]) {
                this.store[fetchMoreForQueryId].networkStatus = NetworkStatus.ready;
            }
        };
        QueryStore.prototype.markQueryError = function (queryId, error, fetchMoreForQueryId) {
            if (!this.store || !this.store[queryId])
                return;
            this.store[queryId].networkError = error;
            this.store[queryId].networkStatus = NetworkStatus.error;
            if (typeof fetchMoreForQueryId === 'string') {
                this.markQueryResultClient(fetchMoreForQueryId, true);
            }
        };
        QueryStore.prototype.markQueryResultClient = function (queryId, complete) {
            var storeValue = this.store && this.store[queryId];
            if (storeValue) {
                storeValue.networkError = null;
                storeValue.previousVariables = null;
                if (complete) {
                    storeValue.networkStatus = NetworkStatus.ready;
                }
            }
        };
        QueryStore.prototype.stopQuery = function (queryId) {
            delete this.store[queryId];
        };
        QueryStore.prototype.reset = function (observableQueryIds) {
            var _this = this;
            Object.keys(this.store).forEach(function (queryId) {
                if (observableQueryIds.indexOf(queryId) < 0) {
                    _this.stopQuery(queryId);
                }
                else {
                    _this.store[queryId].networkStatus = NetworkStatus.loading;
                }
            });
        };
        return QueryStore;
    }());

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    var LocalState = (function () {
        function LocalState(_a) {
            var cache = _a.cache, client = _a.client, resolvers = _a.resolvers, fragmentMatcher = _a.fragmentMatcher;
            this.cache = cache;
            if (client) {
                this.client = client;
            }
            if (resolvers) {
                this.addResolvers(resolvers);
            }
            if (fragmentMatcher) {
                this.setFragmentMatcher(fragmentMatcher);
            }
        }
        LocalState.prototype.addResolvers = function (resolvers) {
            var _this = this;
            this.resolvers = this.resolvers || {};
            if (Array.isArray(resolvers)) {
                resolvers.forEach(function (resolverGroup) {
                    _this.resolvers = mergeDeep(_this.resolvers, resolverGroup);
                });
            }
            else {
                this.resolvers = mergeDeep(this.resolvers, resolvers);
            }
        };
        LocalState.prototype.setResolvers = function (resolvers) {
            this.resolvers = {};
            this.addResolvers(resolvers);
        };
        LocalState.prototype.getResolvers = function () {
            return this.resolvers || {};
        };
        LocalState.prototype.runResolvers = function (_a) {
            var document = _a.document, remoteResult = _a.remoteResult, context = _a.context, variables = _a.variables, _b = _a.onlyRunForcedResolvers, onlyRunForcedResolvers = _b === void 0 ? false : _b;
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_c) {
                    if (document) {
                        return [2, this.resolveDocument(document, remoteResult.data, context, variables, this.fragmentMatcher, onlyRunForcedResolvers).then(function (localResult) { return (__assign(__assign({}, remoteResult), { data: localResult.result })); })];
                    }
                    return [2, remoteResult];
                });
            });
        };
        LocalState.prototype.setFragmentMatcher = function (fragmentMatcher) {
            this.fragmentMatcher = fragmentMatcher;
        };
        LocalState.prototype.getFragmentMatcher = function () {
            return this.fragmentMatcher;
        };
        LocalState.prototype.clientQuery = function (document) {
            if (hasDirectives(['client'], document)) {
                if (this.resolvers) {
                    return document;
                }
                process.env.NODE_ENV === "production" || invariant.warn('Found @client directives in a query but no ApolloClient resolvers ' +
                    'were specified. This means ApolloClient local resolver handling ' +
                    'has been disabled, and @client directives will be passed through ' +
                    'to your link chain.');
            }
            return null;
        };
        LocalState.prototype.serverQuery = function (document) {
            return this.resolvers ? removeClientSetsFromDocument(document) : document;
        };
        LocalState.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var cache = this.cache;
            var newContext = __assign(__assign({}, context), { cache: cache, getCacheKey: function (obj) {
                    if (cache.config) {
                        return cache.config.dataIdFromObject(obj);
                    }
                    else {
                        process.env.NODE_ENV === "production" ? invariant(false, 6) : invariant(false, 'To use context.getCacheKey, you need to use a cache that has ' +
                            'a configurable dataIdFromObject, like apollo-cache-inmemory.');
                    }
                } });
            return newContext;
        };
        LocalState.prototype.addExportedVariables = function (document, variables, context) {
            if (variables === void 0) { variables = {}; }
            if (context === void 0) { context = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (document) {
                        return [2, this.resolveDocument(document, this.buildRootValueFromCache(document, variables) || {}, this.prepareContext(context), variables).then(function (data) { return (__assign(__assign({}, variables), data.exportedVariables)); })];
                    }
                    return [2, __assign({}, variables)];
                });
            });
        };
        LocalState.prototype.shouldForceResolvers = function (document) {
            var forceResolvers = false;
            visit(document, {
                Directive: {
                    enter: function (node) {
                        if (node.name.value === 'client' && node.arguments) {
                            forceResolvers = node.arguments.some(function (arg) {
                                return arg.name.value === 'always' &&
                                    arg.value.kind === 'BooleanValue' &&
                                    arg.value.value === true;
                            });
                            if (forceResolvers) {
                                return BREAK;
                            }
                        }
                    },
                },
            });
            return forceResolvers;
        };
        LocalState.prototype.buildRootValueFromCache = function (document, variables) {
            return this.cache.diff({
                query: buildQueryFromSelectionSet(document),
                variables: variables,
                returnPartialData: true,
                optimistic: false,
            }).result;
        };
        LocalState.prototype.resolveDocument = function (document, rootValue, context, variables, fragmentMatcher, onlyRunForcedResolvers) {
            if (context === void 0) { context = {}; }
            if (variables === void 0) { variables = {}; }
            if (fragmentMatcher === void 0) { fragmentMatcher = function () { return true; }; }
            if (onlyRunForcedResolvers === void 0) { onlyRunForcedResolvers = false; }
            return __awaiter(this, void 0, void 0, function () {
                var mainDefinition, fragments, fragmentMap, definitionOperation, defaultOperationType, _a, cache, client, execContext;
                return __generator(this, function (_b) {
                    mainDefinition = getMainDefinition(document);
                    fragments = getFragmentDefinitions(document);
                    fragmentMap = createFragmentMap(fragments);
                    definitionOperation = mainDefinition
                        .operation;
                    defaultOperationType = definitionOperation
                        ? capitalizeFirstLetter(definitionOperation)
                        : 'Query';
                    _a = this, cache = _a.cache, client = _a.client;
                    execContext = {
                        fragmentMap: fragmentMap,
                        context: __assign(__assign({}, context), { cache: cache,
                            client: client }),
                        variables: variables,
                        fragmentMatcher: fragmentMatcher,
                        defaultOperationType: defaultOperationType,
                        exportedVariables: {},
                        onlyRunForcedResolvers: onlyRunForcedResolvers,
                    };
                    return [2, this.resolveSelectionSet(mainDefinition.selectionSet, rootValue, execContext).then(function (result) { return ({
                            result: result,
                            exportedVariables: execContext.exportedVariables,
                        }); })];
                });
            });
        };
        LocalState.prototype.resolveSelectionSet = function (selectionSet, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var fragmentMap, context, variables, resultsToMerge, execute;
                var _this = this;
                return __generator(this, function (_a) {
                    fragmentMap = execContext.fragmentMap, context = execContext.context, variables = execContext.variables;
                    resultsToMerge = [rootValue];
                    execute = function (selection) { return __awaiter(_this, void 0, void 0, function () {
                        var fragment, typeCondition;
                        return __generator(this, function (_a) {
                            if (!shouldInclude(selection, variables)) {
                                return [2];
                            }
                            if (isField(selection)) {
                                return [2, this.resolveField(selection, rootValue, execContext).then(function (fieldResult) {
                                        var _a;
                                        if (typeof fieldResult !== 'undefined') {
                                            resultsToMerge.push((_a = {},
                                                _a[resultKeyNameFromField(selection)] = fieldResult,
                                                _a));
                                        }
                                    })];
                            }
                            if (isInlineFragment(selection)) {
                                fragment = selection;
                            }
                            else {
                                fragment = fragmentMap[selection.name.value];
                                process.env.NODE_ENV === "production" ? invariant(fragment, 7) : invariant(fragment, "No fragment named " + selection.name.value);
                            }
                            if (fragment && fragment.typeCondition) {
                                typeCondition = fragment.typeCondition.name.value;
                                if (execContext.fragmentMatcher(rootValue, typeCondition, context)) {
                                    return [2, this.resolveSelectionSet(fragment.selectionSet, rootValue, execContext).then(function (fragmentResult) {
                                            resultsToMerge.push(fragmentResult);
                                        })];
                                }
                            }
                            return [2];
                        });
                    }); };
                    return [2, Promise.all(selectionSet.selections.map(execute)).then(function () {
                            return mergeDeepArray(resultsToMerge);
                        })];
                });
            });
        };
        LocalState.prototype.resolveField = function (field, rootValue, execContext) {
            return __awaiter(this, void 0, void 0, function () {
                var variables, fieldName, aliasedFieldName, aliasUsed, defaultResult, resultPromise, resolverType, resolverMap, resolve;
                var _this = this;
                return __generator(this, function (_a) {
                    variables = execContext.variables;
                    fieldName = field.name.value;
                    aliasedFieldName = resultKeyNameFromField(field);
                    aliasUsed = fieldName !== aliasedFieldName;
                    defaultResult = rootValue[aliasedFieldName] || rootValue[fieldName];
                    resultPromise = Promise.resolve(defaultResult);
                    if (!execContext.onlyRunForcedResolvers ||
                        this.shouldForceResolvers(field)) {
                        resolverType = rootValue.__typename || execContext.defaultOperationType;
                        resolverMap = this.resolvers && this.resolvers[resolverType];
                        if (resolverMap) {
                            resolve = resolverMap[aliasUsed ? fieldName : aliasedFieldName];
                            if (resolve) {
                                resultPromise = Promise.resolve(resolve(rootValue, argumentsObjectFromField(field, variables), execContext.context, { field: field, fragmentMap: execContext.fragmentMap }));
                            }
                        }
                    }
                    return [2, resultPromise.then(function (result) {
                            if (result === void 0) { result = defaultResult; }
                            if (field.directives) {
                                field.directives.forEach(function (directive) {
                                    if (directive.name.value === 'export' && directive.arguments) {
                                        directive.arguments.forEach(function (arg) {
                                            if (arg.name.value === 'as' && arg.value.kind === 'StringValue') {
                                                execContext.exportedVariables[arg.value.value] = result;
                                            }
                                        });
                                    }
                                });
                            }
                            if (!field.selectionSet) {
                                return result;
                            }
                            if (result == null) {
                                return result;
                            }
                            if (Array.isArray(result)) {
                                return _this.resolveSubSelectedArray(field, result, execContext);
                            }
                            if (field.selectionSet) {
                                return _this.resolveSelectionSet(field.selectionSet, result, execContext);
                            }
                        })];
                });
            });
        };
        LocalState.prototype.resolveSubSelectedArray = function (field, result, execContext) {
            var _this = this;
            return Promise.all(result.map(function (item) {
                if (item === null) {
                    return null;
                }
                if (Array.isArray(item)) {
                    return _this.resolveSubSelectedArray(field, item, execContext);
                }
                if (field.selectionSet) {
                    return _this.resolveSelectionSet(field.selectionSet, item, execContext);
                }
            }));
        };
        return LocalState;
    }());

    function multiplex(inner) {
        var observers = new Set();
        var sub = null;
        return new Observable$1(function (observer) {
            observers.add(observer);
            sub = sub || inner.subscribe({
                next: function (value) {
                    observers.forEach(function (obs) { return obs.next && obs.next(value); });
                },
                error: function (error) {
                    observers.forEach(function (obs) { return obs.error && obs.error(error); });
                },
                complete: function () {
                    observers.forEach(function (obs) { return obs.complete && obs.complete(); });
                },
            });
            return function () {
                if (observers.delete(observer) && !observers.size && sub) {
                    sub.unsubscribe();
                    sub = null;
                }
            };
        });
    }
    function asyncMap(observable, mapFn) {
        return new Observable$1(function (observer) {
            var next = observer.next, error = observer.error, complete = observer.complete;
            var activeNextCount = 0;
            var completed = false;
            var handler = {
                next: function (value) {
                    ++activeNextCount;
                    new Promise(function (resolve) {
                        resolve(mapFn(value));
                    }).then(function (result) {
                        --activeNextCount;
                        next && next.call(observer, result);
                        completed && handler.complete();
                    }, function (e) {
                        --activeNextCount;
                        error && error.call(observer, e);
                    });
                },
                error: function (e) {
                    error && error.call(observer, e);
                },
                complete: function () {
                    completed = true;
                    if (!activeNextCount) {
                        complete && complete.call(observer);
                    }
                },
            };
            var sub = observable.subscribe(handler);
            return function () { return sub.unsubscribe(); };
        });
    }

    var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
    var QueryManager = (function () {
        function QueryManager(_a) {
            var link = _a.link, _b = _a.queryDeduplication, queryDeduplication = _b === void 0 ? false : _b, store = _a.store, _c = _a.onBroadcast, onBroadcast = _c === void 0 ? function () { return undefined; } : _c, _d = _a.ssrMode, ssrMode = _d === void 0 ? false : _d, _e = _a.clientAwareness, clientAwareness = _e === void 0 ? {} : _e, localState = _a.localState, assumeImmutableResults = _a.assumeImmutableResults;
            this.mutationStore = new MutationStore();
            this.queryStore = new QueryStore();
            this.clientAwareness = {};
            this.idCounter = 1;
            this.queries = new Map();
            this.fetchQueryRejectFns = new Map();
            this.transformCache = new (canUseWeakMap ? WeakMap : Map)();
            this.inFlightLinkObservables = new Map();
            this.pollingInfoByQueryId = new Map();
            this.link = link;
            this.queryDeduplication = queryDeduplication;
            this.dataStore = store;
            this.onBroadcast = onBroadcast;
            this.clientAwareness = clientAwareness;
            this.localState = localState || new LocalState({ cache: store.getCache() });
            this.ssrMode = ssrMode;
            this.assumeImmutableResults = !!assumeImmutableResults;
        }
        QueryManager.prototype.stop = function () {
            var _this = this;
            this.queries.forEach(function (_info, queryId) {
                _this.stopQueryNoBroadcast(queryId);
            });
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject(process.env.NODE_ENV === "production" ? new InvariantError(8) : new InvariantError('QueryManager stopped while query was in flight'));
            });
        };
        QueryManager.prototype.mutate = function (_a) {
            var mutation = _a.mutation, variables = _a.variables, optimisticResponse = _a.optimisticResponse, updateQueriesByName = _a.updateQueries, _b = _a.refetchQueries, refetchQueries = _b === void 0 ? [] : _b, _c = _a.awaitRefetchQueries, awaitRefetchQueries = _c === void 0 ? false : _c, updateWithProxyFn = _a.update, _d = _a.errorPolicy, errorPolicy = _d === void 0 ? 'none' : _d, fetchPolicy = _a.fetchPolicy, _e = _a.context, context = _e === void 0 ? {} : _e;
            return __awaiter(this, void 0, void 0, function () {
                var mutationId, generateUpdateQueriesInfo, self;
                var _this = this;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            process.env.NODE_ENV === "production" ? invariant(mutation, 9) : invariant(mutation, 'mutation option is required. You must specify your GraphQL document in the mutation option.');
                            process.env.NODE_ENV === "production" ? invariant(!fetchPolicy || fetchPolicy === 'no-cache', 10) : invariant(!fetchPolicy || fetchPolicy === 'no-cache', "Mutations only support a 'no-cache' fetchPolicy. If you don't want to disable the cache, remove your fetchPolicy setting to proceed with the default mutation behavior.");
                            mutationId = this.generateQueryId();
                            mutation = this.transform(mutation).document;
                            this.setQuery(mutationId, function () { return ({ document: mutation }); });
                            variables = this.getVariables(mutation, variables);
                            if (!this.transform(mutation).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(mutation, variables, context)];
                        case 1:
                            variables = _f.sent();
                            _f.label = 2;
                        case 2:
                            generateUpdateQueriesInfo = function () {
                                var ret = {};
                                if (updateQueriesByName) {
                                    _this.queries.forEach(function (_a, queryId) {
                                        var observableQuery = _a.observableQuery;
                                        if (observableQuery) {
                                            var queryName = observableQuery.queryName;
                                            if (queryName &&
                                                hasOwnProperty$2.call(updateQueriesByName, queryName)) {
                                                ret[queryId] = {
                                                    updater: updateQueriesByName[queryName],
                                                    query: _this.queryStore.get(queryId),
                                                };
                                            }
                                        }
                                    });
                                }
                                return ret;
                            };
                            this.mutationStore.initMutation(mutationId, mutation, variables);
                            this.dataStore.markMutationInit({
                                mutationId: mutationId,
                                document: mutation,
                                variables: variables,
                                updateQueries: generateUpdateQueriesInfo(),
                                update: updateWithProxyFn,
                                optimisticResponse: optimisticResponse,
                            });
                            this.broadcastQueries();
                            self = this;
                            return [2, new Promise(function (resolve, reject) {
                                    var storeResult;
                                    var error;
                                    self.getObservableFromLink(mutation, __assign(__assign({}, context), { optimisticResponse: optimisticResponse }), variables, false).subscribe({
                                        next: function (result) {
                                            if (graphQLResultHasError(result) && errorPolicy === 'none') {
                                                error = new ApolloError({
                                                    graphQLErrors: result.errors,
                                                });
                                                return;
                                            }
                                            self.mutationStore.markMutationResult(mutationId);
                                            if (fetchPolicy !== 'no-cache') {
                                                self.dataStore.markMutationResult({
                                                    mutationId: mutationId,
                                                    result: result,
                                                    document: mutation,
                                                    variables: variables,
                                                    updateQueries: generateUpdateQueriesInfo(),
                                                    update: updateWithProxyFn,
                                                });
                                            }
                                            storeResult = result;
                                        },
                                        error: function (err) {
                                            self.mutationStore.markMutationError(mutationId, err);
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            self.setQuery(mutationId, function () { return ({ document: null }); });
                                            reject(new ApolloError({
                                                networkError: err,
                                            }));
                                        },
                                        complete: function () {
                                            if (error) {
                                                self.mutationStore.markMutationError(mutationId, error);
                                            }
                                            self.dataStore.markMutationComplete({
                                                mutationId: mutationId,
                                                optimisticResponse: optimisticResponse,
                                            });
                                            self.broadcastQueries();
                                            if (error) {
                                                reject(error);
                                                return;
                                            }
                                            if (typeof refetchQueries === 'function') {
                                                refetchQueries = refetchQueries(storeResult);
                                            }
                                            var refetchQueryPromises = [];
                                            if (isNonEmptyArray(refetchQueries)) {
                                                refetchQueries.forEach(function (refetchQuery) {
                                                    if (typeof refetchQuery === 'string') {
                                                        self.queries.forEach(function (_a) {
                                                            var observableQuery = _a.observableQuery;
                                                            if (observableQuery &&
                                                                observableQuery.queryName === refetchQuery) {
                                                                refetchQueryPromises.push(observableQuery.refetch());
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        var queryOptions = {
                                                            query: refetchQuery.query,
                                                            variables: refetchQuery.variables,
                                                            fetchPolicy: 'network-only',
                                                        };
                                                        if (refetchQuery.context) {
                                                            queryOptions.context = refetchQuery.context;
                                                        }
                                                        refetchQueryPromises.push(self.query(queryOptions));
                                                    }
                                                });
                                            }
                                            Promise.all(awaitRefetchQueries ? refetchQueryPromises : []).then(function () {
                                                self.setQuery(mutationId, function () { return ({ document: null }); });
                                                if (errorPolicy === 'ignore' &&
                                                    storeResult &&
                                                    graphQLResultHasError(storeResult)) {
                                                    delete storeResult.errors;
                                                }
                                                resolve(storeResult);
                                            });
                                        },
                                    });
                                })];
                    }
                });
            });
        };
        QueryManager.prototype.fetchQuery = function (queryId, options, fetchType, fetchMoreForQueryId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, metadata, _b, fetchPolicy, _c, context, query, variables, storeResult, isNetworkOnly, needToFetch, _d, complete, result, shouldFetch, requestId, cancel, networkResult;
                var _this = this;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _a = options.metadata, metadata = _a === void 0 ? null : _a, _b = options.fetchPolicy, fetchPolicy = _b === void 0 ? 'cache-first' : _b, _c = options.context, context = _c === void 0 ? {} : _c;
                            query = this.transform(options.query).document;
                            variables = this.getVariables(query, options.variables);
                            if (!this.transform(query).hasClientExports) return [3, 2];
                            return [4, this.localState.addExportedVariables(query, variables, context)];
                        case 1:
                            variables = _e.sent();
                            _e.label = 2;
                        case 2:
                            options = __assign(__assign({}, options), { variables: variables });
                            isNetworkOnly = fetchPolicy === 'network-only' || fetchPolicy === 'no-cache';
                            needToFetch = isNetworkOnly;
                            if (!isNetworkOnly) {
                                _d = this.dataStore.getCache().diff({
                                    query: query,
                                    variables: variables,
                                    returnPartialData: true,
                                    optimistic: false,
                                }), complete = _d.complete, result = _d.result;
                                needToFetch = !complete || fetchPolicy === 'cache-and-network';
                                storeResult = result;
                            }
                            shouldFetch = needToFetch && fetchPolicy !== 'cache-only' && fetchPolicy !== 'standby';
                            if (hasDirectives(['live'], query))
                                shouldFetch = true;
                            requestId = this.idCounter++;
                            cancel = fetchPolicy !== 'no-cache'
                                ? this.updateQueryWatch(queryId, query, options)
                                : undefined;
                            this.setQuery(queryId, function () { return ({
                                document: query,
                                lastRequestId: requestId,
                                invalidated: true,
                                cancel: cancel,
                            }); });
                            this.invalidate(fetchMoreForQueryId);
                            this.queryStore.initQuery({
                                queryId: queryId,
                                document: query,
                                storePreviousVariables: shouldFetch,
                                variables: variables,
                                isPoll: fetchType === FetchType.poll,
                                isRefetch: fetchType === FetchType.refetch,
                                metadata: metadata,
                                fetchMoreForQueryId: fetchMoreForQueryId,
                            });
                            this.broadcastQueries();
                            if (shouldFetch) {
                                networkResult = this.fetchRequest({
                                    requestId: requestId,
                                    queryId: queryId,
                                    document: query,
                                    options: options,
                                    fetchMoreForQueryId: fetchMoreForQueryId,
                                }).catch(function (error) {
                                    if (isApolloError(error)) {
                                        throw error;
                                    }
                                    else {
                                        if (requestId >= _this.getQuery(queryId).lastRequestId) {
                                            _this.queryStore.markQueryError(queryId, error, fetchMoreForQueryId);
                                            _this.invalidate(queryId);
                                            _this.invalidate(fetchMoreForQueryId);
                                            _this.broadcastQueries();
                                        }
                                        throw new ApolloError({ networkError: error });
                                    }
                                });
                                if (fetchPolicy !== 'cache-and-network') {
                                    return [2, networkResult];
                                }
                                networkResult.catch(function () { });
                            }
                            this.queryStore.markQueryResultClient(queryId, !shouldFetch);
                            this.invalidate(queryId);
                            this.invalidate(fetchMoreForQueryId);
                            if (this.transform(query).hasForcedResolvers) {
                                return [2, this.localState.runResolvers({
                                        document: query,
                                        remoteResult: { data: storeResult },
                                        context: context,
                                        variables: variables,
                                        onlyRunForcedResolvers: true,
                                    }).then(function (result) {
                                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                                        _this.broadcastQueries();
                                        return result;
                                    })];
                            }
                            this.broadcastQueries();
                            return [2, { data: storeResult }];
                    }
                });
            });
        };
        QueryManager.prototype.markQueryResult = function (queryId, result, _a, fetchMoreForQueryId) {
            var fetchPolicy = _a.fetchPolicy, variables = _a.variables, errorPolicy = _a.errorPolicy;
            if (fetchPolicy === 'no-cache') {
                this.setQuery(queryId, function () { return ({
                    newData: { result: result.data, complete: true },
                }); });
            }
            else {
                this.dataStore.markQueryResult(result, this.getQuery(queryId).document, variables, fetchMoreForQueryId, errorPolicy === 'ignore' || errorPolicy === 'all');
            }
        };
        QueryManager.prototype.queryListenerForObserver = function (queryId, options, observer) {
            var _this = this;
            function invoke(method, argument) {
                if (observer[method]) {
                    try {
                        observer[method](argument);
                    }
                    catch (e) {
                        process.env.NODE_ENV === "production" || invariant.error(e);
                    }
                }
                else if (method === 'error') {
                    process.env.NODE_ENV === "production" || invariant.error(argument);
                }
            }
            return function (queryStoreValue, newData) {
                _this.invalidate(queryId, false);
                if (!queryStoreValue)
                    return;
                var _a = _this.getQuery(queryId), observableQuery = _a.observableQuery, document = _a.document;
                var fetchPolicy = observableQuery
                    ? observableQuery.options.fetchPolicy
                    : options.fetchPolicy;
                if (fetchPolicy === 'standby')
                    return;
                var loading = isNetworkRequestInFlight(queryStoreValue.networkStatus);
                var lastResult = observableQuery && observableQuery.getLastResult();
                var networkStatusChanged = !!(lastResult &&
                    lastResult.networkStatus !== queryStoreValue.networkStatus);
                var shouldNotifyIfLoading = options.returnPartialData ||
                    (!newData && queryStoreValue.previousVariables) ||
                    (networkStatusChanged && options.notifyOnNetworkStatusChange) ||
                    fetchPolicy === 'cache-only' ||
                    fetchPolicy === 'cache-and-network';
                if (loading && !shouldNotifyIfLoading) {
                    return;
                }
                var hasGraphQLErrors = isNonEmptyArray(queryStoreValue.graphQLErrors);
                var errorPolicy = observableQuery
                    && observableQuery.options.errorPolicy
                    || options.errorPolicy
                    || 'none';
                if (errorPolicy === 'none' && hasGraphQLErrors || queryStoreValue.networkError) {
                    return invoke('error', new ApolloError({
                        graphQLErrors: queryStoreValue.graphQLErrors,
                        networkError: queryStoreValue.networkError,
                    }));
                }
                try {
                    var data = void 0;
                    var isMissing = void 0;
                    if (newData) {
                        if (fetchPolicy !== 'no-cache' && fetchPolicy !== 'network-only') {
                            _this.setQuery(queryId, function () { return ({ newData: null }); });
                        }
                        data = newData.result;
                        isMissing = !newData.complete;
                    }
                    else {
                        var lastError = observableQuery && observableQuery.getLastError();
                        var errorStatusChanged = errorPolicy !== 'none' &&
                            (lastError && lastError.graphQLErrors) !==
                                queryStoreValue.graphQLErrors;
                        if (lastResult && lastResult.data && !errorStatusChanged) {
                            data = lastResult.data;
                            isMissing = false;
                        }
                        else {
                            var diffResult = _this.dataStore.getCache().diff({
                                query: document,
                                variables: queryStoreValue.previousVariables ||
                                    queryStoreValue.variables,
                                returnPartialData: true,
                                optimistic: true,
                            });
                            data = diffResult.result;
                            isMissing = !diffResult.complete;
                        }
                    }
                    var stale = isMissing && !(options.returnPartialData ||
                        fetchPolicy === 'cache-only');
                    var resultFromStore = {
                        data: stale ? lastResult && lastResult.data : data,
                        loading: loading,
                        networkStatus: queryStoreValue.networkStatus,
                        stale: stale,
                    };
                    if (errorPolicy === 'all' && hasGraphQLErrors) {
                        resultFromStore.errors = queryStoreValue.graphQLErrors;
                    }
                    invoke('next', resultFromStore);
                }
                catch (networkError) {
                    invoke('error', new ApolloError({ networkError: networkError }));
                }
            };
        };
        QueryManager.prototype.transform = function (document) {
            var transformCache = this.transformCache;
            if (!transformCache.has(document)) {
                var cache = this.dataStore.getCache();
                var transformed = cache.transformDocument(document);
                var forLink = removeConnectionDirectiveFromDocument(cache.transformForLink(transformed));
                var clientQuery = this.localState.clientQuery(transformed);
                var serverQuery = this.localState.serverQuery(forLink);
                var cacheEntry_1 = {
                    document: transformed,
                    hasClientExports: hasClientExports(transformed),
                    hasForcedResolvers: this.localState.shouldForceResolvers(transformed),
                    clientQuery: clientQuery,
                    serverQuery: serverQuery,
                    defaultVars: getDefaultValues(getOperationDefinition(transformed)),
                };
                var add = function (doc) {
                    if (doc && !transformCache.has(doc)) {
                        transformCache.set(doc, cacheEntry_1);
                    }
                };
                add(document);
                add(transformed);
                add(clientQuery);
                add(serverQuery);
            }
            return transformCache.get(document);
        };
        QueryManager.prototype.getVariables = function (document, variables) {
            return __assign(__assign({}, this.transform(document).defaultVars), variables);
        };
        QueryManager.prototype.watchQuery = function (options, shouldSubscribe) {
            if (shouldSubscribe === void 0) { shouldSubscribe = true; }
            process.env.NODE_ENV === "production" ? invariant(options.fetchPolicy !== 'standby', 11) : invariant(options.fetchPolicy !== 'standby', 'client.watchQuery cannot be called with fetchPolicy set to "standby"');
            options.variables = this.getVariables(options.query, options.variables);
            if (typeof options.notifyOnNetworkStatusChange === 'undefined') {
                options.notifyOnNetworkStatusChange = false;
            }
            var transformedOptions = __assign({}, options);
            return new ObservableQuery({
                queryManager: this,
                options: transformedOptions,
                shouldSubscribe: shouldSubscribe,
            });
        };
        QueryManager.prototype.query = function (options) {
            var _this = this;
            process.env.NODE_ENV === "production" ? invariant(options.query, 12) : invariant(options.query, 'query option is required. You must specify your GraphQL document ' +
                'in the query option.');
            process.env.NODE_ENV === "production" ? invariant(options.query.kind === 'Document', 13) : invariant(options.query.kind === 'Document', 'You must wrap the query string in a "gql" tag.');
            process.env.NODE_ENV === "production" ? invariant(!options.returnPartialData, 14) : invariant(!options.returnPartialData, 'returnPartialData option only supported on watchQuery.');
            process.env.NODE_ENV === "production" ? invariant(!options.pollInterval, 15) : invariant(!options.pollInterval, 'pollInterval option only supported on watchQuery.');
            return new Promise(function (resolve, reject) {
                var watchedQuery = _this.watchQuery(options, false);
                _this.fetchQueryRejectFns.set("query:" + watchedQuery.queryId, reject);
                watchedQuery
                    .result()
                    .then(resolve, reject)
                    .then(function () {
                    return _this.fetchQueryRejectFns.delete("query:" + watchedQuery.queryId);
                });
            });
        };
        QueryManager.prototype.generateQueryId = function () {
            return String(this.idCounter++);
        };
        QueryManager.prototype.stopQueryInStore = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryInStoreNoBroadcast = function (queryId) {
            this.stopPollingQuery(queryId);
            this.queryStore.stopQuery(queryId);
            this.invalidate(queryId);
        };
        QueryManager.prototype.addQueryListener = function (queryId, listener) {
            this.setQuery(queryId, function (_a) {
                var listeners = _a.listeners;
                listeners.add(listener);
                return { invalidated: false };
            });
        };
        QueryManager.prototype.updateQueryWatch = function (queryId, document, options) {
            var _this = this;
            var cancel = this.getQuery(queryId).cancel;
            if (cancel)
                cancel();
            var previousResult = function () {
                var previousResult = null;
                var observableQuery = _this.getQuery(queryId).observableQuery;
                if (observableQuery) {
                    var lastResult = observableQuery.getLastResult();
                    if (lastResult) {
                        previousResult = lastResult.data;
                    }
                }
                return previousResult;
            };
            return this.dataStore.getCache().watch({
                query: document,
                variables: options.variables,
                optimistic: true,
                previousResult: previousResult,
                callback: function (newData) {
                    _this.setQuery(queryId, function () { return ({ invalidated: true, newData: newData }); });
                },
            });
        };
        QueryManager.prototype.addObservableQuery = function (queryId, observableQuery) {
            this.setQuery(queryId, function () { return ({ observableQuery: observableQuery }); });
        };
        QueryManager.prototype.removeObservableQuery = function (queryId) {
            var cancel = this.getQuery(queryId).cancel;
            this.setQuery(queryId, function () { return ({ observableQuery: null }); });
            if (cancel)
                cancel();
        };
        QueryManager.prototype.clearStore = function () {
            this.fetchQueryRejectFns.forEach(function (reject) {
                reject(process.env.NODE_ENV === "production" ? new InvariantError(16) : new InvariantError('Store reset while query was in flight (not completed in link chain)'));
            });
            var resetIds = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery)
                    resetIds.push(queryId);
            });
            this.queryStore.reset(resetIds);
            this.mutationStore.reset();
            return this.dataStore.reset();
        };
        QueryManager.prototype.resetStore = function () {
            var _this = this;
            return this.clearStore().then(function () {
                return _this.reFetchObservableQueries();
            });
        };
        QueryManager.prototype.reFetchObservableQueries = function (includeStandby) {
            var _this = this;
            if (includeStandby === void 0) { includeStandby = false; }
            var observableQueryPromises = [];
            this.queries.forEach(function (_a, queryId) {
                var observableQuery = _a.observableQuery;
                if (observableQuery) {
                    var fetchPolicy = observableQuery.options.fetchPolicy;
                    observableQuery.resetLastResults();
                    if (fetchPolicy !== 'cache-only' &&
                        (includeStandby || fetchPolicy !== 'standby')) {
                        observableQueryPromises.push(observableQuery.refetch());
                    }
                    _this.setQuery(queryId, function () { return ({ newData: null }); });
                    _this.invalidate(queryId);
                }
            });
            this.broadcastQueries();
            return Promise.all(observableQueryPromises);
        };
        QueryManager.prototype.observeQuery = function (queryId, options, observer) {
            this.addQueryListener(queryId, this.queryListenerForObserver(queryId, options, observer));
            return this.fetchQuery(queryId, options);
        };
        QueryManager.prototype.startQuery = function (queryId, options, listener) {
            process.env.NODE_ENV === "production" || invariant.warn("The QueryManager.startQuery method has been deprecated");
            this.addQueryListener(queryId, listener);
            this.fetchQuery(queryId, options)
                .catch(function () { return undefined; });
            return queryId;
        };
        QueryManager.prototype.startGraphQLSubscription = function (_a) {
            var _this = this;
            var query = _a.query, fetchPolicy = _a.fetchPolicy, variables = _a.variables;
            query = this.transform(query).document;
            variables = this.getVariables(query, variables);
            var makeObservable = function (variables) {
                return _this.getObservableFromLink(query, {}, variables, false).map(function (result) {
                    if (!fetchPolicy || fetchPolicy !== 'no-cache') {
                        _this.dataStore.markSubscriptionResult(result, query, variables);
                        _this.broadcastQueries();
                    }
                    if (graphQLResultHasError(result)) {
                        throw new ApolloError({
                            graphQLErrors: result.errors,
                        });
                    }
                    return result;
                });
            };
            if (this.transform(query).hasClientExports) {
                var observablePromise_1 = this.localState.addExportedVariables(query, variables).then(makeObservable);
                return new Observable$1(function (observer) {
                    var sub = null;
                    observablePromise_1.then(function (observable) { return sub = observable.subscribe(observer); }, observer.error);
                    return function () { return sub && sub.unsubscribe(); };
                });
            }
            return makeObservable(variables);
        };
        QueryManager.prototype.stopQuery = function (queryId) {
            this.stopQueryNoBroadcast(queryId);
            this.broadcastQueries();
        };
        QueryManager.prototype.stopQueryNoBroadcast = function (queryId) {
            this.stopQueryInStoreNoBroadcast(queryId);
            this.removeQuery(queryId);
        };
        QueryManager.prototype.removeQuery = function (queryId) {
            this.fetchQueryRejectFns.delete("query:" + queryId);
            this.fetchQueryRejectFns.delete("fetchRequest:" + queryId);
            this.getQuery(queryId).subscriptions.forEach(function (x) { return x.unsubscribe(); });
            this.queries.delete(queryId);
        };
        QueryManager.prototype.getCurrentQueryResult = function (observableQuery, optimistic) {
            if (optimistic === void 0) { optimistic = true; }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query, fetchPolicy = _a.fetchPolicy, returnPartialData = _a.returnPartialData;
            var lastResult = observableQuery.getLastResult();
            var newData = this.getQuery(observableQuery.queryId).newData;
            if (newData && newData.complete) {
                return { data: newData.result, partial: false };
            }
            if (fetchPolicy === 'no-cache' || fetchPolicy === 'network-only') {
                return { data: undefined, partial: false };
            }
            var _b = this.dataStore.getCache().diff({
                query: query,
                variables: variables,
                previousResult: lastResult ? lastResult.data : undefined,
                returnPartialData: true,
                optimistic: optimistic,
            }), result = _b.result, complete = _b.complete;
            return {
                data: (complete || returnPartialData) ? result : void 0,
                partial: !complete,
            };
        };
        QueryManager.prototype.getQueryWithPreviousResult = function (queryIdOrObservable) {
            var observableQuery;
            if (typeof queryIdOrObservable === 'string') {
                var foundObserveableQuery = this.getQuery(queryIdOrObservable).observableQuery;
                process.env.NODE_ENV === "production" ? invariant(foundObserveableQuery, 17) : invariant(foundObserveableQuery, "ObservableQuery with this id doesn't exist: " + queryIdOrObservable);
                observableQuery = foundObserveableQuery;
            }
            else {
                observableQuery = queryIdOrObservable;
            }
            var _a = observableQuery.options, variables = _a.variables, query = _a.query;
            return {
                previousResult: this.getCurrentQueryResult(observableQuery, false).data,
                variables: variables,
                document: query,
            };
        };
        QueryManager.prototype.broadcastQueries = function () {
            var _this = this;
            this.onBroadcast();
            this.queries.forEach(function (info, id) {
                if (info.invalidated) {
                    info.listeners.forEach(function (listener) {
                        if (listener) {
                            listener(_this.queryStore.get(id), info.newData);
                        }
                    });
                }
            });
        };
        QueryManager.prototype.getLocalState = function () {
            return this.localState;
        };
        QueryManager.prototype.getObservableFromLink = function (query, context, variables, deduplication) {
            var _this = this;
            if (deduplication === void 0) { deduplication = this.queryDeduplication; }
            var observable;
            var serverQuery = this.transform(query).serverQuery;
            if (serverQuery) {
                var _a = this, inFlightLinkObservables_1 = _a.inFlightLinkObservables, link = _a.link;
                var operation = {
                    query: serverQuery,
                    variables: variables,
                    operationName: getOperationName(serverQuery) || void 0,
                    context: this.prepareContext(__assign(__assign({}, context), { forceFetch: !deduplication })),
                };
                context = operation.context;
                if (deduplication) {
                    var byVariables_1 = inFlightLinkObservables_1.get(serverQuery) || new Map();
                    inFlightLinkObservables_1.set(serverQuery, byVariables_1);
                    var varJson_1 = JSON.stringify(variables);
                    observable = byVariables_1.get(varJson_1);
                    if (!observable) {
                        byVariables_1.set(varJson_1, observable = multiplex(execute(link, operation)));
                        var cleanup = function () {
                            byVariables_1.delete(varJson_1);
                            if (!byVariables_1.size)
                                inFlightLinkObservables_1.delete(serverQuery);
                            cleanupSub_1.unsubscribe();
                        };
                        var cleanupSub_1 = observable.subscribe({
                            next: cleanup,
                            error: cleanup,
                            complete: cleanup,
                        });
                    }
                }
                else {
                    observable = multiplex(execute(link, operation));
                }
            }
            else {
                observable = Observable$1.of({ data: {} });
                context = this.prepareContext(context);
            }
            var clientQuery = this.transform(query).clientQuery;
            if (clientQuery) {
                observable = asyncMap(observable, function (result) {
                    return _this.localState.runResolvers({
                        document: clientQuery,
                        remoteResult: result,
                        context: context,
                        variables: variables,
                    });
                });
            }
            return observable;
        };
        QueryManager.prototype.fetchRequest = function (_a) {
            var _this = this;
            var requestId = _a.requestId, queryId = _a.queryId, document = _a.document, options = _a.options, fetchMoreForQueryId = _a.fetchMoreForQueryId;
            var variables = options.variables, _b = options.errorPolicy, errorPolicy = _b === void 0 ? 'none' : _b, fetchPolicy = options.fetchPolicy;
            var resultFromStore;
            var errorsFromStore;
            return new Promise(function (resolve, reject) {
                var observable = _this.getObservableFromLink(document, options.context, variables);
                var fqrfId = "fetchRequest:" + queryId;
                _this.fetchQueryRejectFns.set(fqrfId, reject);
                var cleanup = function () {
                    _this.fetchQueryRejectFns.delete(fqrfId);
                    _this.setQuery(queryId, function (_a) {
                        var subscriptions = _a.subscriptions;
                        subscriptions.delete(subscription);
                    });
                };
                var subscription = observable.map(function (result) {
                    if (requestId >= _this.getQuery(queryId).lastRequestId) {
                        _this.markQueryResult(queryId, result, options, fetchMoreForQueryId);
                        _this.queryStore.markQueryResult(queryId, result, fetchMoreForQueryId);
                        _this.invalidate(queryId);
                        _this.invalidate(fetchMoreForQueryId);
                        _this.broadcastQueries();
                    }
                    if (errorPolicy === 'none' && isNonEmptyArray(result.errors)) {
                        return reject(new ApolloError({
                            graphQLErrors: result.errors,
                        }));
                    }
                    if (errorPolicy === 'all') {
                        errorsFromStore = result.errors;
                    }
                    if (fetchMoreForQueryId || fetchPolicy === 'no-cache') {
                        resultFromStore = result.data;
                    }
                    else {
                        var _a = _this.dataStore.getCache().diff({
                            variables: variables,
                            query: document,
                            optimistic: false,
                            returnPartialData: true,
                        }), result_1 = _a.result, complete = _a.complete;
                        if (complete || options.returnPartialData) {
                            resultFromStore = result_1;
                        }
                    }
                }).subscribe({
                    error: function (error) {
                        cleanup();
                        reject(error);
                    },
                    complete: function () {
                        cleanup();
                        resolve({
                            data: resultFromStore,
                            errors: errorsFromStore,
                            loading: false,
                            networkStatus: NetworkStatus.ready,
                            stale: false,
                        });
                    },
                });
                _this.setQuery(queryId, function (_a) {
                    var subscriptions = _a.subscriptions;
                    subscriptions.add(subscription);
                });
            });
        };
        QueryManager.prototype.getQuery = function (queryId) {
            return (this.queries.get(queryId) || {
                listeners: new Set(),
                invalidated: false,
                document: null,
                newData: null,
                lastRequestId: 1,
                observableQuery: null,
                subscriptions: new Set(),
            });
        };
        QueryManager.prototype.setQuery = function (queryId, updater) {
            var prev = this.getQuery(queryId);
            var newInfo = __assign(__assign({}, prev), updater(prev));
            this.queries.set(queryId, newInfo);
        };
        QueryManager.prototype.invalidate = function (queryId, invalidated) {
            if (invalidated === void 0) { invalidated = true; }
            if (queryId) {
                this.setQuery(queryId, function () { return ({ invalidated: invalidated }); });
            }
        };
        QueryManager.prototype.prepareContext = function (context) {
            if (context === void 0) { context = {}; }
            var newContext = this.localState.prepareContext(context);
            return __assign(__assign({}, newContext), { clientAwareness: this.clientAwareness });
        };
        QueryManager.prototype.checkInFlight = function (queryId) {
            var query = this.queryStore.get(queryId);
            return (query &&
                query.networkStatus !== NetworkStatus.ready &&
                query.networkStatus !== NetworkStatus.error);
        };
        QueryManager.prototype.startPollingQuery = function (options, queryId, listener) {
            var _this = this;
            var pollInterval = options.pollInterval;
            process.env.NODE_ENV === "production" ? invariant(pollInterval, 18) : invariant(pollInterval, 'Attempted to start a polling query without a polling interval.');
            if (!this.ssrMode) {
                var info = this.pollingInfoByQueryId.get(queryId);
                if (!info) {
                    this.pollingInfoByQueryId.set(queryId, (info = {}));
                }
                info.interval = pollInterval;
                info.options = __assign(__assign({}, options), { fetchPolicy: 'network-only' });
                var maybeFetch_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        if (_this.checkInFlight(queryId)) {
                            poll_1();
                        }
                        else {
                            _this.fetchQuery(queryId, info.options, FetchType.poll).then(poll_1, poll_1);
                        }
                    }
                };
                var poll_1 = function () {
                    var info = _this.pollingInfoByQueryId.get(queryId);
                    if (info) {
                        clearTimeout(info.timeout);
                        info.timeout = setTimeout(maybeFetch_1, info.interval);
                    }
                };
                if (listener) {
                    this.addQueryListener(queryId, listener);
                }
                poll_1();
            }
            return queryId;
        };
        QueryManager.prototype.stopPollingQuery = function (queryId) {
            this.pollingInfoByQueryId.delete(queryId);
        };
        return QueryManager;
    }());

    var DataStore = (function () {
        function DataStore(initialCache) {
            this.cache = initialCache;
        }
        DataStore.prototype.getCache = function () {
            return this.cache;
        };
        DataStore.prototype.markQueryResult = function (result, document, variables, fetchMoreForQueryId, ignoreErrors) {
            if (ignoreErrors === void 0) { ignoreErrors = false; }
            var writeWithErrors = !graphQLResultHasError(result);
            if (ignoreErrors && graphQLResultHasError(result) && result.data) {
                writeWithErrors = true;
            }
            if (!fetchMoreForQueryId && writeWithErrors) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_QUERY',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markSubscriptionResult = function (result, document, variables) {
            if (!graphQLResultHasError(result)) {
                this.cache.write({
                    result: result.data,
                    dataId: 'ROOT_SUBSCRIPTION',
                    query: document,
                    variables: variables,
                });
            }
        };
        DataStore.prototype.markMutationInit = function (mutation) {
            var _this = this;
            if (mutation.optimisticResponse) {
                var optimistic_1;
                if (typeof mutation.optimisticResponse === 'function') {
                    optimistic_1 = mutation.optimisticResponse(mutation.variables);
                }
                else {
                    optimistic_1 = mutation.optimisticResponse;
                }
                this.cache.recordOptimisticTransaction(function (c) {
                    var orig = _this.cache;
                    _this.cache = c;
                    try {
                        _this.markMutationResult({
                            mutationId: mutation.mutationId,
                            result: { data: optimistic_1 },
                            document: mutation.document,
                            variables: mutation.variables,
                            updateQueries: mutation.updateQueries,
                            update: mutation.update,
                        });
                    }
                    finally {
                        _this.cache = orig;
                    }
                }, mutation.mutationId);
            }
        };
        DataStore.prototype.markMutationResult = function (mutation) {
            var _this = this;
            if (!graphQLResultHasError(mutation.result)) {
                var cacheWrites_1 = [{
                        result: mutation.result.data,
                        dataId: 'ROOT_MUTATION',
                        query: mutation.document,
                        variables: mutation.variables,
                    }];
                var updateQueries_1 = mutation.updateQueries;
                if (updateQueries_1) {
                    Object.keys(updateQueries_1).forEach(function (id) {
                        var _a = updateQueries_1[id], query = _a.query, updater = _a.updater;
                        var _b = _this.cache.diff({
                            query: query.document,
                            variables: query.variables,
                            returnPartialData: true,
                            optimistic: false,
                        }), currentQueryResult = _b.result, complete = _b.complete;
                        if (complete) {
                            var nextQueryResult = tryFunctionOrLogError(function () {
                                return updater(currentQueryResult, {
                                    mutationResult: mutation.result,
                                    queryName: getOperationName(query.document) || undefined,
                                    queryVariables: query.variables,
                                });
                            });
                            if (nextQueryResult) {
                                cacheWrites_1.push({
                                    result: nextQueryResult,
                                    dataId: 'ROOT_QUERY',
                                    query: query.document,
                                    variables: query.variables,
                                });
                            }
                        }
                    });
                }
                this.cache.performTransaction(function (c) {
                    cacheWrites_1.forEach(function (write) { return c.write(write); });
                    var update = mutation.update;
                    if (update) {
                        tryFunctionOrLogError(function () { return update(c, mutation.result); });
                    }
                });
            }
        };
        DataStore.prototype.markMutationComplete = function (_a) {
            var mutationId = _a.mutationId, optimisticResponse = _a.optimisticResponse;
            if (optimisticResponse) {
                this.cache.removeOptimistic(mutationId);
            }
        };
        DataStore.prototype.markUpdateQueryResult = function (document, variables, newResult) {
            this.cache.write({
                result: newResult,
                dataId: 'ROOT_QUERY',
                variables: variables,
                query: document,
            });
        };
        DataStore.prototype.reset = function () {
            return this.cache.reset();
        };
        return DataStore;
    }());

    var version = "2.6.8";

    var hasSuggestedDevtools = false;
    var ApolloClient = (function () {
        function ApolloClient(options) {
            var _this = this;
            this.defaultOptions = {};
            this.resetStoreCallbacks = [];
            this.clearStoreCallbacks = [];
            var cache = options.cache, _a = options.ssrMode, ssrMode = _a === void 0 ? false : _a, _b = options.ssrForceFetchDelay, ssrForceFetchDelay = _b === void 0 ? 0 : _b, connectToDevTools = options.connectToDevTools, _c = options.queryDeduplication, queryDeduplication = _c === void 0 ? true : _c, defaultOptions = options.defaultOptions, _d = options.assumeImmutableResults, assumeImmutableResults = _d === void 0 ? false : _d, resolvers = options.resolvers, typeDefs = options.typeDefs, fragmentMatcher = options.fragmentMatcher, clientAwarenessName = options.name, clientAwarenessVersion = options.version;
            var link = options.link;
            if (!link && resolvers) {
                link = ApolloLink.empty();
            }
            if (!link || !cache) {
                throw process.env.NODE_ENV === "production" ? new InvariantError(1) : new InvariantError("In order to initialize Apollo Client, you must specify 'link' and 'cache' properties in the options object.\n" +
                    "These options are part of the upgrade requirements when migrating from Apollo Client 1.x to Apollo Client 2.x.\n" +
                    "For more information, please visit: https://www.apollographql.com/docs/tutorial/client.html#apollo-client-setup");
            }
            this.link = link;
            this.cache = cache;
            this.store = new DataStore(cache);
            this.disableNetworkFetches = ssrMode || ssrForceFetchDelay > 0;
            this.queryDeduplication = queryDeduplication;
            this.defaultOptions = defaultOptions || {};
            this.typeDefs = typeDefs;
            if (ssrForceFetchDelay) {
                setTimeout(function () { return (_this.disableNetworkFetches = false); }, ssrForceFetchDelay);
            }
            this.watchQuery = this.watchQuery.bind(this);
            this.query = this.query.bind(this);
            this.mutate = this.mutate.bind(this);
            this.resetStore = this.resetStore.bind(this);
            this.reFetchObservableQueries = this.reFetchObservableQueries.bind(this);
            var defaultConnectToDevTools = process.env.NODE_ENV !== 'production' &&
                typeof window !== 'undefined' &&
                !window.__APOLLO_CLIENT__;
            if (typeof connectToDevTools === 'undefined'
                ? defaultConnectToDevTools
                : connectToDevTools && typeof window !== 'undefined') {
                window.__APOLLO_CLIENT__ = this;
            }
            if (!hasSuggestedDevtools && process.env.NODE_ENV !== 'production') {
                hasSuggestedDevtools = true;
                if (typeof window !== 'undefined' &&
                    window.document &&
                    window.top === window.self) {
                    if (typeof window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
                        if (window.navigator &&
                            window.navigator.userAgent &&
                            window.navigator.userAgent.indexOf('Chrome') > -1) {
                            console.debug('Download the Apollo DevTools ' +
                                'for a better development experience: ' +
                                'https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm');
                        }
                    }
                }
            }
            this.version = version;
            this.localState = new LocalState({
                cache: cache,
                client: this,
                resolvers: resolvers,
                fragmentMatcher: fragmentMatcher,
            });
            this.queryManager = new QueryManager({
                link: this.link,
                store: this.store,
                queryDeduplication: queryDeduplication,
                ssrMode: ssrMode,
                clientAwareness: {
                    name: clientAwarenessName,
                    version: clientAwarenessVersion,
                },
                localState: this.localState,
                assumeImmutableResults: assumeImmutableResults,
                onBroadcast: function () {
                    if (_this.devToolsHookCb) {
                        _this.devToolsHookCb({
                            action: {},
                            state: {
                                queries: _this.queryManager.queryStore.getStore(),
                                mutations: _this.queryManager.mutationStore.getStore(),
                            },
                            dataWithOptimisticResults: _this.cache.extract(true),
                        });
                    }
                },
            });
        }
        ApolloClient.prototype.stop = function () {
            this.queryManager.stop();
        };
        ApolloClient.prototype.watchQuery = function (options) {
            if (this.defaultOptions.watchQuery) {
                options = __assign(__assign({}, this.defaultOptions.watchQuery), options);
            }
            if (this.disableNetworkFetches &&
                (options.fetchPolicy === 'network-only' ||
                    options.fetchPolicy === 'cache-and-network')) {
                options = __assign(__assign({}, options), { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.watchQuery(options);
        };
        ApolloClient.prototype.query = function (options) {
            if (this.defaultOptions.query) {
                options = __assign(__assign({}, this.defaultOptions.query), options);
            }
            process.env.NODE_ENV === "production" ? invariant(options.fetchPolicy !== 'cache-and-network', 2) : invariant(options.fetchPolicy !== 'cache-and-network', 'The cache-and-network fetchPolicy does not work with client.query, because ' +
                'client.query can only return a single result. Please use client.watchQuery ' +
                'to receive multiple results from the cache and the network, or consider ' +
                'using a different fetchPolicy, such as cache-first or network-only.');
            if (this.disableNetworkFetches && options.fetchPolicy === 'network-only') {
                options = __assign(__assign({}, options), { fetchPolicy: 'cache-first' });
            }
            return this.queryManager.query(options);
        };
        ApolloClient.prototype.mutate = function (options) {
            if (this.defaultOptions.mutate) {
                options = __assign(__assign({}, this.defaultOptions.mutate), options);
            }
            return this.queryManager.mutate(options);
        };
        ApolloClient.prototype.subscribe = function (options) {
            return this.queryManager.startGraphQLSubscription(options);
        };
        ApolloClient.prototype.readQuery = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readQuery(options, optimistic);
        };
        ApolloClient.prototype.readFragment = function (options, optimistic) {
            if (optimistic === void 0) { optimistic = false; }
            return this.cache.readFragment(options, optimistic);
        };
        ApolloClient.prototype.writeQuery = function (options) {
            var result = this.cache.writeQuery(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeFragment = function (options) {
            var result = this.cache.writeFragment(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.writeData = function (options) {
            var result = this.cache.writeData(options);
            this.queryManager.broadcastQueries();
            return result;
        };
        ApolloClient.prototype.__actionHookForDevTools = function (cb) {
            this.devToolsHookCb = cb;
        };
        ApolloClient.prototype.__requestRaw = function (payload) {
            return execute(this.link, payload);
        };
        ApolloClient.prototype.initQueryManager = function () {
            process.env.NODE_ENV === "production" || invariant.warn('Calling the initQueryManager method is no longer necessary, ' +
                'and it will be removed from ApolloClient in version 3.0.');
            return this.queryManager;
        };
        ApolloClient.prototype.resetStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.resetStoreCallbacks.map(function (fn) { return fn(); })); })
                .then(function () { return _this.reFetchObservableQueries(); });
        };
        ApolloClient.prototype.clearStore = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () { return _this.queryManager.clearStore(); })
                .then(function () { return Promise.all(_this.clearStoreCallbacks.map(function (fn) { return fn(); })); });
        };
        ApolloClient.prototype.onResetStore = function (cb) {
            var _this = this;
            this.resetStoreCallbacks.push(cb);
            return function () {
                _this.resetStoreCallbacks = _this.resetStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.onClearStore = function (cb) {
            var _this = this;
            this.clearStoreCallbacks.push(cb);
            return function () {
                _this.clearStoreCallbacks = _this.clearStoreCallbacks.filter(function (c) { return c !== cb; });
            };
        };
        ApolloClient.prototype.reFetchObservableQueries = function (includeStandby) {
            return this.queryManager.reFetchObservableQueries(includeStandby);
        };
        ApolloClient.prototype.extract = function (optimistic) {
            return this.cache.extract(optimistic);
        };
        ApolloClient.prototype.restore = function (serializedState) {
            return this.cache.restore(serializedState);
        };
        ApolloClient.prototype.addResolvers = function (resolvers) {
            this.localState.addResolvers(resolvers);
        };
        ApolloClient.prototype.setResolvers = function (resolvers) {
            this.localState.setResolvers(resolvers);
        };
        ApolloClient.prototype.getResolvers = function () {
            return this.localState.getResolvers();
        };
        ApolloClient.prototype.setLocalStateFragmentMatcher = function (fragmentMatcher) {
            this.localState.setFragmentMatcher(fragmentMatcher);
        };
        return ApolloClient;
    }());
    //# sourceMappingURL=bundle.esm.js.map

    const cache = new InMemoryCache();

    const link = new HttpLink({
      uri: 'http://localhost:4000/graphql', useGETForQueries: true});
    const client = new ApolloClient({ cache, link });
    // setClient(client);

    const app = new App({
      target: document.body,
      props: {
        client: client
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
