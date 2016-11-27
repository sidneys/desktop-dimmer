/*!
 * ==========================================================
 *  COLOR PICKER PLUGIN 1.2.2
 * ==========================================================
 * Author: Taufik Nurrohman <https://github.com/tovic>
 * License: MIT
 * ----------------------------------------------------------
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);

    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();

    } else {
        // Browser globals (root is window)
        root.CP = factory();
    }
}(this, function () {

    /**
     * Color Picker Widget
     *
     * @class CP
     *
     * @param {HTMLElement} target
     * @param {Object} events
     */
    var CP = function(target, events) {

        var w = window,
            d = document,
            $ = this,
            $$ = CP.prototype,
            _ = false,
            hooks = {},
            picker = d.createElement('div'),
            on_down = 'touchstart mousedown',
            on_move = 'touchmove mousemove',
            on_up = 'touchend mouseup',
            on_resize = 'orientationchange resize';

        // return a new instance if `CP` was called without the `new` operator
        if (!($ instanceof CP)) {
            return new CP(target, events);
        }

        // access color picker instance from `this` scope with `this.CP`
        target.CP = $;

        // store color picker instance to `CP.__instance__`
        CP.__instance__[target.id || target.name || Object.keys(CP.__instance__).length] = $;

        function is_set(x) {
            return typeof x !== "undefined";
        }

        function is_string(x) {
            return typeof x === "string";
        }

        function edge(a, b, c) {
            if (a < b) return b;
            if (a > c) return c;
            return a;
        }

        function num(i, j) {
            return parseInt(i, j || 10);
        }

        function round(i) {
            return Math.round(i);
        }

        // trigger color picker panel on click by default
        if (!is_set(events)) {
            events = on_down;
        }

        // [h, s, v] ... 0 <= h, s, v <= 1
        function HSV2RGB(a) {
            var h = +a[0],
                s = +a[1],
                v = +a[2],
                r, g, b, i, f, p, q, t;
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            i = i || 0;
            q = q || 0;
            t = t || 0;
            switch (i % 6) {
                case 0:
                    r = v, g = t, b = p;
                    break;
                case 1:
                    r = q, g = v, b = p;
                    break;
                case 2:
                    r = p, g = v, b = t;
                    break;
                case 3:
                    r = p, g = q, b = v;
                    break;
                case 4:
                    r = t, g = p, b = v;
                    break;
                case 5:
                    r = v, g = p, b = q;
                    break;
            }
            return [round(r * 255), round(g * 255), round(b * 255)];
        }

        function HSV2HEX(a) {
            return RGB2HEX(HSV2RGB(a));
        }

        // [r, g, b] ... 0 <= r, g, b <= 255
        function RGB2HSV(a) {
            var r = +a[0],
                g = +a[1],
                b = +a[2],
                max = Math.max(r, g, b),
                min = Math.min(r, g, b),
                d = max - min,
                h, s = (max === 0 ? 0 : d / max),
                v = max / 255;
            switch (max) {
                case min:
                    h = 0;
                    break;
                case r:
                    h = (g - b) + d * (g < b ? 6 : 0);
                    h /= 6 * d;
                    break;
                case g:
                    h = (b - r) + d * 2;
                    h /= 6 * d;
                    break;
                case b:
                    h = (r - g) + d * 4;
                    h /= 6 * d;
                    break;
            }
            return [h, s, v];
        }

        function RGB2HEX(a) {
            var s = +a[2] | (+a[1] << 8) | (+a[0] << 16);
            s = '000000' + s.toString(16);
            return s.slice(-6);
        }

        // rrggbb or rgb
        function HEX2HSV(s) {
            return RGB2HSV(HEX2RGB(s));
        }

        function HEX2RGB(s) {
            if (s.length === 3) {
                s = s.replace(/./g, '$&$&');
            }
            return [num(s[0] + s[1], 16), num(s[2] + s[3], 16), num(s[4] + s[5], 16)];
        }

        // convert range from `0` to `360` and `0` to `100` in color into range from `0` to `1`
        function _2HSV_pri(a) {
            return [+a[0] / 360, +a[1] / 100, +a[2] / 100];
        }

        // convert range from `0` to `1` into `0` to `360` and `0` to `100` in color
        function _2HSV_pub(a) {
            return [round(+a[0] * 360), round(+a[1] * 100), round(+a[2] * 100)];
        }

        // convert range from `0` to `255` in color into range from `0` to `1`
        function _2RGB_pri(a) {
            return [+a[0] / 255, +a[1] / 255, +a[2] / 255];
        }

        // *
        $$.parse = function(x) {
            if (typeof x === "object") return x;
            var rgb = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*$/i.exec(x),
                hsv = /\s*hsv\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)\s*$/i.exec(x),
                hex = x[0] === '#' && x.match(/^#([\da-f]{3}|[\da-f]{6})$/);
            if (hex) {
                return HEX2HSV(x.slice(1));
            } else if (hsv) {
                return _2HSV_pri([+hsv[1], +hsv[2], +hsv[3]]);
            } else if (rgb) {
                return RGB2HSV([+rgb[1], +rgb[2], +rgb[3]]);
            }
            return [0, 1, 1]; // default is red
        };

        // add event
        function on(ev, el, fn) {
            ev = ev.split(/\s+/);
            for (var i = 0, ien = ev.length; i < ien; ++i) {
                el.addEventListener(ev[i], fn, false);
            }
        }

        // remove event
        function off(ev, el, fn) {
            ev = ev.split(/\s+/);
            for (var i = 0, ien = ev.length; i < ien; ++i) {
                el.removeEventListener(ev[i], fn);
            }
        }

        // get mouse/finger coordinate
        function point(el, e) {
            var x = !!e.touches ? e.touches[0].pageX : e.pageX,
                y = !!e.touches ? e.touches[0].pageY : e.pageY,
                left = offset(el).l,
                top = offset(el).t;
            while (el = el.offsetParent) {
                left += offset(el).l;
                top += offset(el).t;
            }
            return {
                x: x - left,
                y: y - top
            };
        }

        // get position
        function offset(el) {
            return {
                l: el.offsetLeft,
                t: el.offsetTop
            };
        }

        // get closest parent
        function closest(a, b) {
            while ((a = a.parentElement) && a !== b);
            return a;
        }

        // prevent default
        function prevent(e) {
            if (e) e.preventDefault();
        }

        // get dimension
        function size(el) {
            return {
                w: el.offsetWidth,
                h: el.offsetHeight
            };
        }

        // get color data
        function get_data(a) {
            return _ || (is_set(a) ? a : false);
        }

        // set color data
        function set_data(a) {
            _ = a;
        }

        // add hook
        function add(ev, fn, id) {
            if (!is_set(ev)) return hooks;
            if (!is_set(fn)) return hooks[ev];
            if (!is_set(hooks[ev])) hooks[ev] = {};
            if (!is_set(id)) id = Object.keys(hooks[ev]).length;
            return hooks[ev][id] = fn, $;
        }

        // remove hook
        function remove(ev, id) {
            if (!is_set(ev)) return hooks = {}, $;
            if (!is_set(id)) return hooks[ev] = {}, $;
            return delete hooks[ev][id], $;
        }

        // trigger hook
        function trigger(ev, a, id) {
            if (!is_set(hooks[ev])) return $;
            if (!is_set(id)) {
                for (var i in hooks[ev]) {
                    hooks[ev][i].apply($, a);
                }
            } else {
                if (is_set(hooks[ev][id])) {
                    hooks[ev][id].apply($, a);
                }
            }
            return $;
        }

        // initialize data ...
        set_data($.parse(target.getAttribute('data-color') || target.value || [0, 1, 1]));

        // generate color picker pane ...
        picker.className = 'color-picker';
        picker.innerHTML = '<div class="color-picker-control"><span class="color-picker-h"><i></i></span><span class="color-picker-sv"><i></i></span></div>';
        var b = d.body,
            h = d.documentElement,
            c = picker.firstChild.children,
            HSV = get_data([0, 1, 1]), // default is red
            H = c[0],
            SV = c[1],
            H_point = H.firstChild,
            SV_point = SV.firstChild,
            start_H = false,
            start_SV = false,
            drag_H = false,
            drag_SV = false,
            left = 0,
            top = 0,
            P_W = 0,
            P_H = 0,
            v = HSV2HEX(HSV),
            set, exit;

        // on update ...
        function trigger_(k, x) {
            if (!k || k === "h") {
                trigger("change:h", x);
            }
            if (!k || k === "sv") {
                trigger("change:sv", x);
            }
            trigger("change", x);
        }

        // delay
        function delay(fn, t) {
            return setTimeout(fn, t);
        }

        // is visible?
        function visible() {
            return picker.parentNode;
        }

        // fit to window
        function fit() {
            var w_W = /* w.innerWidth */ size(h).w,
                w_H = w.innerHeight,
                w_L = Math.max(b.scrollLeft, h.scrollLeft),
                w_T = Math.max(b.scrollTop, h.scrollTop),
                width = w_W + w_L,
                height = w_H + w_T;
            left = offset(target).l;
            top = offset(target).t + size(target).h;
            if (left + P_W > width) {
                left = width - P_W;
            }
            if (top + P_H > height) {
                top = height - P_H;
            }
            picker.style.left = left + 'px';
            picker.style.top = top + 'px';
            return trigger("fit", [$]), $;
        };

        // create
        function create(first, bucket) {
            if (!first) {
                (bucket || b).appendChild(picker), $.visible = true;
            }
            P_W = size(picker).w;
            P_H = size(picker).h;
            var H_H = size(H).h,
                SV_W = size(SV).w,
                SV_H = size(SV).h,
                H_point_H = size(H_point).h,
                SV_point_W = size(SV_point).w,
                SV_point_H = size(SV_point).h;
            if (first) {
                picker.style.left = picker.style.top = '-9999px';
                function click(e) {
                    var t = e.target,
                        is_target = t === target || closest(t, target) === target;
                    if (is_target) {
                        create();
                    } else {
                        exit();
                    }
                    trigger(is_target ? "enter" : "exit", [$]);
                }
                if (events !== false) {
                    on(events, target, click);
                }
                $.add = function() {
                    return create(1), trigger("create", [$]), $;
                };
                $.destroy = function() {
                    if (events !== false) {
                        off(events, target, click);
                    }
                    exit(), set_data(false);
                    return trigger("destroy", [$]), $;
                };
            } else {
                fit();
            }
            set = function() {
                HSV = get_data(HSV), color();
                H_point.style.top = (H_H - (H_point_H / 2) - (H_H * +HSV[0])) + 'px';
                SV_point.style.right = (SV_W - (SV_point_W / 2) - (SV_W * +HSV[1])) + 'px';
                SV_point.style.top = (SV_H - (SV_point_H / 2) - (SV_H * +HSV[2])) + 'px';
            };
            exit = function(e) {
                if (visible()) {
                    visible().removeChild(picker);
                    $.visible = false;
                }
                off(on_down, H, down_H);
                off(on_down, SV, down_SV);
                off(on_move, d, move);
                off(on_up, d, stop);
                off(on_resize, w, fit);
                return $;
            };
            function color(e) {
                var a = HSV2RGB(HSV),
                    b = HSV2RGB([HSV[0], 1, 1]);
                SV.style.backgroundColor = 'rgb(' + b.join(',') + ')';
                set_data(HSV);
                prevent(e);
            };
            set();
            function do_H(e) {
                var y = edge(point(H, e).y, 0, H_H);
                HSV[0] = (H_H - y) / H_H;
                H_point.style.top = (y - (H_point_H / 2)) + 'px';
                color(e);
            }
            function do_SV(e) {
                var o = point(SV, e),
                    x = edge(o.x, 0, SV_W),
                    y = edge(o.y, 0, SV_H);
                HSV[1] = 1 - ((SV_W - x) / SV_W);
                HSV[2] = (SV_H - y) / SV_H;
                SV_point.style.right = (SV_W - x - (SV_point_W / 2)) + 'px';
                SV_point.style.top = (y - (SV_point_H / 2)) + 'px';
                color(e);
            }
            function move(e) {
                if (drag_H) {
                    do_H(e), v = HSV2HEX(HSV);
                    if (!start_H) {
                        trigger("drag:h", [v, $]);
                        trigger("drag", [v, $]);
                        trigger_("h", [v, $]);
                    }
                }
                if (drag_SV) {
                    do_SV(e), v = HSV2HEX(HSV);
                    if (!start_SV) {
                        trigger("drag:sv", [v, $]);
                        trigger("drag", [v, $]);
                        trigger_("sv", [v, $]);
                    }
                }
                start_H = false,
                    start_SV = false;
            }
            function stop(e) {
                var t = e.target,
                    k = drag_H ? "h" : "sv",
                    a = [HSV2HEX(HSV), $],
                    is_target = t === target || closest(t, target) === target,
                    is_picker = t === picker || closest(t, picker) === picker;
                if (!is_target && !is_picker) {
                    // click outside the target or picker element to exit
                    if (visible() && events !== false) exit(), trigger("exit", [$]), trigger_(0, a);
                } else {
                    if (is_picker) {
                        trigger("stop:" + k, a);
                        trigger("stop", a);
                        trigger_(k, a);
                    }
                }
                drag_H = false,
                    drag_SV = false;
            }
            function down_H(e) {
                start_H = true,
                    drag_H = true,
                    move(e), prevent(e);
                trigger("start:h", [v, $]);
                trigger("start", [v, $]);
                trigger_("h", [v, $]);
            }
            function down_SV(e) {
                start_SV = true,
                    drag_SV = true,
                    move(e), prevent(e);
                trigger("start:sv", [v, $]);
                trigger("start", [v, $]);
                trigger_("sv", [v, $]);
            }
            if (!first) {
                on(on_down, H, down_H);
                on(on_down, SV, down_SV);
                on(on_move, d, move);
                on(on_up, d, stop);
                on(on_resize, w, fit);
            }
        } create(1);

        delay(function() {
            var a = [HSV2HEX(HSV), $];
            trigger("create", a);
            trigger_(0, a);
        }, 0);

        // register to global ...
        $.target = target;
        $.picker = picker;
        $.visible = false;
        $.on = add;
        $.off = remove;
        $.trigger = trigger;
        $.fit = fit;
        $.set = function(a) {
            if (!is_set(a)) return get_data();
            if (is_string(a)) {
                a = $.parse(a);
            }
            return set_data(a), set(), $;
        };
        $$._HSV2RGB = HSV2RGB;
        $$._HSV2HEX = HSV2HEX;
        $$._RGB2HSV = RGB2HSV;
        $$._HEX2HSV = HEX2HSV;
        $$._HEX2RGB = function(a) {
            return _2RGB_pri(HEX2RGB(a));
        };
        $$.HSV2RGB = function(a) {
            return HSV2RGB(_2HSV_pri(a));
        };
        $$.HSV2HEX = function(a) {
            return HSV2HEX(_2HSV_pri(a));
        };
        $$.RGB2HSV = function(a) {
            return _2HSV_pub(RGB2HSV(a));
        };
        $$.RGB2HEX = RGB2HEX;
        $$.HEX2HSV = function(s) {
            return _2HSV_pub(HEX2HSV(s));
        };
        $$.HEX2RGB = HEX2RGB;
        $.hooks = hooks;
        $.enter = function(bucket) {
            return create(0, bucket);
        };
        $.exit = exit;

        // return the global object
        return $;
    };

    //---------------------------
    // Add class statics
    //---------------------------

    // plugin version
    CP.version = '1.2.2';

    // collect all instance(s)
    CP.__instance__ = {};

    // plug to all instance(s)
    CP.each = function(fn, t) {
        return setTimeout(function() {
            var ins = CP.__instance__, i;
            for (i in ins) {
                fn(ins[i], i, ins);
            }
        }, t === 0 ? 0 : (t || 1)), CP;
    };

    return CP;
}));

