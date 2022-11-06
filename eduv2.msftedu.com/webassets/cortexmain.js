var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.ResizeObserver = factory());
}(this, (function () {
    'use strict';
    var MapShim = (function () {
        if (typeof Map !== 'undefined') {
            return Map;
        }
        function getIndex(arr, key) {
            var result = -1;
            arr.some(function (entry, index) {
                if (entry[0] === key) {
                    result = index;
                    return true;
                }
                return false;
            });
            return result;
        }
        return (function () {
            function anonymous() {
                this.__entries__ = [];
            }
            var prototypeAccessors = { size: { configurable: true } };
            prototypeAccessors.size.get = function () {
                return this.__entries__.length;
            };
            anonymous.prototype.get = function (key) {
                var index = getIndex(this.__entries__, key);
                var entry = this.__entries__[index];
                return entry && entry[1];
            };
            anonymous.prototype.set = function (key, value) {
                var index = getIndex(this.__entries__, key);
                if (~index) {
                    this.__entries__[index][1] = value;
                }
                else {
                    this.__entries__.push([key, value]);
                }
            };
            anonymous.prototype.delete = function (key) {
                var entries = this.__entries__;
                var index = getIndex(entries, key);
                if (~index) {
                    entries.splice(index, 1);
                }
            };
            anonymous.prototype.has = function (key) {
                return !!~getIndex(this.__entries__, key);
            };
            anonymous.prototype.clear = function () {
                this.__entries__.splice(0);
            };
            anonymous.prototype.forEach = function (callback, ctx) {
                var this$1 = this;
                if (ctx === void 0)
                    ctx = null;
                for (var i = 0, list = this$1.__entries__; i < list.length; i += 1) {
                    var entry = list[i];
                    callback.call(ctx, entry[1], entry[0]);
                }
            };
            Object.defineProperties(anonymous.prototype, prototypeAccessors);
            return anonymous;
        }());
    })();
    var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;
    var global$1 = (function () {
        if (typeof global !== 'undefined' && global.Math === Math) {
            return global;
        }
        if (typeof self !== 'undefined' && self.Math === Math) {
            return self;
        }
        if (typeof window !== 'undefined' && window.Math === Math) {
            return window;
        }
        return Function('return this')();
    })();
    var requestAnimationFrame$1 = (function () {
        if (typeof requestAnimationFrame === 'function') {
            return requestAnimationFrame.bind(global$1);
        }
        return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
    })();
    var trailingTimeout = 2;
    var throttle = function (callback, delay) {
        var leadingCall = false, trailingCall = false, lastCallTime = 0;
        function resolvePending() {
            if (leadingCall) {
                leadingCall = false;
                callback();
            }
            if (trailingCall) {
                proxy();
            }
        }
        function timeoutCallback() {
            requestAnimationFrame$1(resolvePending);
        }
        function proxy() {
            var timeStamp = Date.now();
            if (leadingCall) {
                if (timeStamp - lastCallTime < trailingTimeout) {
                    return;
                }
                trailingCall = true;
            }
            else {
                leadingCall = true;
                trailingCall = false;
                setTimeout(timeoutCallback, delay);
            }
            lastCallTime = timeStamp;
        }
        return proxy;
    };
    var REFRESH_DELAY = 20;
    var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
    var mutationObserverSupported = typeof MutationObserver !== 'undefined';
    var ResizeObserverController = function () {
        this.connected_ = false;
        this.mutationEventsAdded_ = false;
        this.mutationsObserver_ = null;
        this.observers_ = [];
        this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
        this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
    };
    ResizeObserverController.prototype.addObserver = function (observer) {
        if (!~this.observers_.indexOf(observer)) {
            this.observers_.push(observer);
        }
        if (!this.connected_) {
            this.connect_();
        }
    };
    ResizeObserverController.prototype.removeObserver = function (observer) {
        var observers = this.observers_;
        var index = observers.indexOf(observer);
        if (~index) {
            observers.splice(index, 1);
        }
        if (!observers.length && this.connected_) {
            this.disconnect_();
        }
    };
    ResizeObserverController.prototype.refresh = function () {
        var changesDetected = this.updateObservers_();
        if (changesDetected) {
            this.refresh();
        }
    };
    ResizeObserverController.prototype.updateObservers_ = function () {
        var activeObservers = this.observers_.filter(function (observer) {
            return observer.gatherActive(), observer.hasActive();
        });
        activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
        return activeObservers.length > 0;
    };
    ResizeObserverController.prototype.connect_ = function () {
        if (!isBrowser || this.connected_) {
            return;
        }
        document.addEventListener('transitionend', this.onTransitionEnd_);
        window.addEventListener('resize', this.refresh);
        if (mutationObserverSupported) {
            this.mutationsObserver_ = new MutationObserver(this.refresh);
            this.mutationsObserver_.observe(document, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        else {
            document.addEventListener('DOMSubtreeModified', this.refresh);
            this.mutationEventsAdded_ = true;
        }
        this.connected_ = true;
    };
    ResizeObserverController.prototype.disconnect_ = function () {
        if (!isBrowser || !this.connected_) {
            return;
        }
        document.removeEventListener('transitionend', this.onTransitionEnd_);
        window.removeEventListener('resize', this.refresh);
        if (this.mutationsObserver_) {
            this.mutationsObserver_.disconnect();
        }
        if (this.mutationEventsAdded_) {
            document.removeEventListener('DOMSubtreeModified', this.refresh);
        }
        this.mutationsObserver_ = null;
        this.mutationEventsAdded_ = false;
        this.connected_ = false;
    };
    ResizeObserverController.prototype.onTransitionEnd_ = function (ref) {
        var propertyName = ref.propertyName;
        if (propertyName === void 0)
            propertyName = '';
        var isReflowProperty = transitionKeys.some(function (key) {
            return !!~propertyName.indexOf(key);
        });
        if (isReflowProperty) {
            this.refresh();
        }
    };
    ResizeObserverController.getInstance = function () {
        if (!this.instance_) {
            this.instance_ = new ResizeObserverController();
        }
        return this.instance_;
    };
    ResizeObserverController.instance_ = null;
    var defineConfigurable = (function (target, props) {
        for (var i = 0, list = Object.keys(props); i < list.length; i += 1) {
            var key = list[i];
            Object.defineProperty(target, key, {
                value: props[key],
                enumerable: false,
                writable: false,
                configurable: true
            });
        }
        return target;
    });
    var getWindowOf = (function (target) {
        var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
        return ownerGlobal || global$1;
    });
    var emptyRect = createRectInit(0, 0, 0, 0);
    function toFloat(value) {
        return parseFloat(value) || 0;
    }
    function getBordersSize(styles) {
        var positions = [], len = arguments.length - 1;
        while (len-- > 0)
            positions[len] = arguments[len + 1];
        return positions.reduce(function (size, position) {
            var value = styles['border-' + position + '-width'];
            return size + toFloat(value);
        }, 0);
    }
    function getPaddings(styles) {
        var positions = ['top', 'right', 'bottom', 'left'];
        var paddings = {};
        for (var i = 0, list = positions; i < list.length; i += 1) {
            var position = list[i];
            var value = styles['padding-' + position];
            paddings[position] = toFloat(value);
        }
        return paddings;
    }
    function getSVGContentRect(target) {
        var bbox = target.getBBox();
        return createRectInit(0, 0, bbox.width, bbox.height);
    }
    function getHTMLElementContentRect(target) {
        var clientWidth = target.clientWidth;
        var clientHeight = target.clientHeight;
        if (!clientWidth && !clientHeight) {
            return emptyRect;
        }
        var styles = getWindowOf(target).getComputedStyle(target);
        var paddings = getPaddings(styles);
        var horizPad = paddings.left + paddings.right;
        var vertPad = paddings.top + paddings.bottom;
        var width = toFloat(styles.width), height = toFloat(styles.height);
        if (styles.boxSizing === 'border-box') {
            if (Math.round(width + horizPad) !== clientWidth) {
                width -= getBordersSize(styles, 'left', 'right') + horizPad;
            }
            if (Math.round(height + vertPad) !== clientHeight) {
                height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
            }
        }
        if (!isDocumentElement(target)) {
            var vertScrollbar = Math.round(width + horizPad) - clientWidth;
            var horizScrollbar = Math.round(height + vertPad) - clientHeight;
            if (Math.abs(vertScrollbar) !== 1) {
                width -= vertScrollbar;
            }
            if (Math.abs(horizScrollbar) !== 1) {
                height -= horizScrollbar;
            }
        }
        return createRectInit(paddings.left, paddings.top, width, height);
    }
    var isSVGGraphicsElement = (function () {
        if (typeof SVGGraphicsElement !== 'undefined') {
            return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
        }
        return function (target) { return target instanceof getWindowOf(target).SVGElement && typeof target.getBBox === 'function'; };
    })();
    function isDocumentElement(target) {
        return target === getWindowOf(target).document.documentElement;
    }
    function getContentRect(target) {
        if (!isBrowser) {
            return emptyRect;
        }
        if (isSVGGraphicsElement(target)) {
            return getSVGContentRect(target);
        }
        return getHTMLElementContentRect(target);
    }
    function createReadOnlyRect(ref) {
        var x = ref.x;
        var y = ref.y;
        var width = ref.width;
        var height = ref.height;
        var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
        var rect = Object.create(Constr.prototype);
        defineConfigurable(rect, {
            x: x, y: y, width: width, height: height,
            top: y,
            right: x + width,
            bottom: height + y,
            left: x
        });
        return rect;
    }
    function createRectInit(x, y, width, height) {
        return { x: x, y: y, width: width, height: height };
    }
    var ResizeObservation = function (target) {
        this.broadcastWidth = 0;
        this.broadcastHeight = 0;
        this.contentRect_ = createRectInit(0, 0, 0, 0);
        this.target = target;
    };
    ResizeObservation.prototype.isActive = function () {
        var rect = getContentRect(this.target);
        this.contentRect_ = rect;
        return rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight;
    };
    ResizeObservation.prototype.broadcastRect = function () {
        var rect = this.contentRect_;
        this.broadcastWidth = rect.width;
        this.broadcastHeight = rect.height;
        return rect;
    };
    var ResizeObserverEntry = function (target, rectInit) {
        var contentRect = createReadOnlyRect(rectInit);
        defineConfigurable(this, { target: target, contentRect: contentRect });
    };
    var ResizeObserverSPI = function (callback, controller, callbackCtx) {
        this.activeObservations_ = [];
        this.observations_ = new MapShim();
        if (typeof callback !== 'function') {
            throw new TypeError('The callback provided as parameter 1 is not a function.');
        }
        this.callback_ = callback;
        this.controller_ = controller;
        this.callbackCtx_ = callbackCtx;
    };
    ResizeObserverSPI.prototype.observe = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        if (observations.has(target)) {
            return;
        }
        observations.set(target, new ResizeObservation(target));
        this.controller_.addObserver(this);
        this.controller_.refresh();
    };
    ResizeObserverSPI.prototype.unobserve = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        if (!observations.has(target)) {
            return;
        }
        observations.delete(target);
        if (!observations.size) {
            this.controller_.removeObserver(this);
        }
    };
    ResizeObserverSPI.prototype.disconnect = function () {
        this.clearActive();
        this.observations_.clear();
        this.controller_.removeObserver(this);
    };
    ResizeObserverSPI.prototype.gatherActive = function () {
        var this$1 = this;
        this.clearActive();
        this.observations_.forEach(function (observation) {
            if (observation.isActive()) {
                this$1.activeObservations_.push(observation);
            }
        });
    };
    ResizeObserverSPI.prototype.broadcastActive = function () {
        if (!this.hasActive()) {
            return;
        }
        var ctx = this.callbackCtx_;
        var entries = this.activeObservations_.map(function (observation) {
            return new ResizeObserverEntry(observation.target, observation.broadcastRect());
        });
        this.callback_.call(ctx, entries, ctx);
        this.clearActive();
    };
    ResizeObserverSPI.prototype.clearActive = function () {
        this.activeObservations_.splice(0);
    };
    ResizeObserverSPI.prototype.hasActive = function () {
        return this.activeObservations_.length > 0;
    };
    var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
    var ResizeObserver = function (callback) {
        if (!(this instanceof ResizeObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        var controller = ResizeObserverController.getInstance();
        var observer = new ResizeObserverSPI(callback, controller, this);
        observers.set(this, observer);
    };
    ['observe', 'unobserve', 'disconnect'].forEach(function (method) {
        ResizeObserver.prototype[method] = function () {
            return (ref = observers.get(this))[method].apply(ref, arguments);
            var ref;
        };
    });
    var index = (function () {
        if (typeof global$1.ResizeObserver !== 'undefined') {
            return global$1.ResizeObserver;
        }
        global$1.ResizeObserver = ResizeObserver;
        return ResizeObserver;
    })();
    return index;
})));
var Cortex;
(function (Cortex) {
    var Components;
    (function (Components) {
        var OnePlayer;
        (function (OnePlayer) {
            OnePlayer.players = new Array();
            function Init(controlId) {
                $(document).ready(function () {
                    InitPlayer();
                });
            }
            OnePlayer.Init = Init;
            function InitPlayer() {
                for (var i = 0; i < OnePlayer.players.length; i++) {
                    var thisPlayer = OnePlayer.players[i];
                    MsOnePlayer.render(thisPlayer.containerId, thisPlayer, function (player) {
                        player.addPlayerEventListener(function (e) {
                        });
                    });
                }
                ;
                ResizeVideo();
                $(window).on('resize', function () {
                    ResizeVideo();
                });
            }
            OnePlayer.InitPlayer = InitPlayer;
            function ResizeVideo(containerID) {
                var videoContainers, x, y;
                videoContainers = $('.onePlayerContainer');
                if (videoContainers != undefined) {
                    videoContainers.each(function () {
                        var thisContainer = $(this);
                        calculateVideoResize(thisContainer, x, y);
                    });
                }
            }
            OnePlayer.ResizeVideo = ResizeVideo;
            function calculateVideoResize(thisContainer, x, y) {
                if (thisContainer.hasClass("Wide16_9")) {
                    x = thisContainer.width();
                    y = x / 16 * 9;
                    thisContainer.height(y);
                }
                else if (thisContainer.hasClass("Wide21_9")) {
                    x = thisContainer.width();
                    y = x / 21 * 9;
                    thisContainer.height(y);
                }
                else if (thisContainer.hasClass("CustomWide21_7")) {
                    x = thisContainer.width();
                    y = x / 21 * 7.88;
                    thisContainer.height(y);
                }
                else {
                    x = thisContainer.width();
                    y = x / 4 * 3;
                    thisContainer.height(y);
                }
            }
            OnePlayer.calculateVideoResize = calculateVideoResize;
            function AddVideoPlayer(title, containerId, autoplay, mute, loop, playFullScreen, market, videoId, maskLevel) {
                if (title === void 0) { title = ''; }
                var playerData = {
                    containerId: containerId,
                    options: {
                        autoplay: autoplay,
                        mute: mute,
                        loop: loop,
                        playFullScreen: playFullScreen,
                        market: market,
                        maskLevel: maskLevel
                    },
                    metadata: {
                        title: title,
                        videoId: videoId
                    }
                };
                OnePlayer.players.push(playerData);
            }
            OnePlayer.AddVideoPlayer = AddVideoPlayer;
            function PlayVideo(el, videoId, scrollOption) {
                el.preventDefault();
                var currentVideoId = videoId;
                OnePlayer.players.forEach(function (player) {
                    if (player.containerId === currentVideoId) {
                        player.options.autoplay = true;
                        InitPlayer();
                    }
                });
                if (scrollOption) {
                    $('html,body').animate({ scrollTop: $('#' + videoId).offset().top - 50 }, 'slow');
                }
            }
            OnePlayer.PlayVideo = PlayVideo;
        })(OnePlayer = Components.OnePlayer || (Components.OnePlayer = {}));
        var OnePlayerSwitch;
        (function (OnePlayerSwitch) {
            var tabs;
            function SwitchVideo(index) {
                var containerId = tabs[index].oneplayer.containerId;
                var id = containerId + "-oneplayer";
                var $current = $("#".concat(containerId));
                var $oneplayer = $("#".concat(id));
                var src = $oneplayer.attr('src');
                $oneplayer.attr('src', src);
                tabs.forEach(function (_a) {
                    var containerId = _a.oneplayer.containerId;
                    var $container = $("#".concat(containerId));
                    OnePlayer.players.forEach(function (_, index) {
                        OnePlayer.players[index].options.autoplay = false;
                    });
                    $container.addClass("visuallyhidden");
                });
                $current.removeClass("visuallyhidden");
                Cortex.Components.OnePlayer.PlayVideo(new Event(''), containerId, true);
            }
            var defaultOptions = {
                autoplay: false,
                mute: false,
                loop: false,
                playFullScreen: false,
                market: "en-US",
                maskLevel: '0'
            };
            function Init(_tabs) {
                function start() {
                    tabs = _tabs;
                    tabs.forEach(function (tab, index) {
                        var link = tab.link, _a = tab.oneplayer, containerId = _a.containerId, _b = _a.metadata, _c = _b.title, title = _c === void 0 ? '' : _c, videoId = _b.videoId, _d = _a.options, _e = _d === void 0 ? defaultOptions : _d, _f = _e.autoplay, autoplay = _f === void 0 ? false : _f, _g = _e.mute, mute = _g === void 0 ? false : _g, _h = _e.loop, loop = _h === void 0 ? false : _h, _j = _e.playFullScreen, playFullScreen = _j === void 0 ? false : _j, _k = _e.market, market = _k === void 0 ? "en-US" : _k, _l = _e.maskLevel, maskLevel = _l === void 0 ? '0' : _l;
                        Cortex.Components.OnePlayer.AddVideoPlayer(title, containerId, autoplay, mute, loop, playFullScreen, market, videoId, maskLevel);
                        $("#".concat(link)).on('click', function (e) {
                            e.preventDefault();
                            SwitchVideo(index);
                        });
                    });
                }
                $(document).ready(start);
            }
            OnePlayerSwitch.Init = Init;
        })(OnePlayerSwitch = Components.OnePlayerSwitch || (Components.OnePlayerSwitch = {}));
        var OfficeSignup;
        (function (OfficeSignup) {
            function Init(formID) {
                if ($('#' + formID).length) {
                    $("#".concat(formID, " .c-text-field")).on('keydown', function (e) {
                        if (e.keyCode === $.ui.keyCode.ENTER) {
                            e.preventDefault();
                            e.stopPropagation();
                            $("#".concat(formID, " .cc-office-signup-submit")).trigger('click');
                        }
                    });
                    $("#".concat(formID, " .cc-office-signup-submit")).on('click keyup', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (Cortex.Utilities.elementSelected(e)) {
                            if (FormIsValid(formID)) {
                                $("#".concat(formID)).submit();
                            }
                            else {
                                $("#".concat(formID, " .c-text-field")).focus();
                            }
                        }
                    });
                }
            }
            OfficeSignup.Init = Init;
            function FormIsValid(formID) {
                var valid = true;
                $("#".concat(formID, " .pmgJS-EmailValidationError")).hide();
                $("#".concat(formID, " .pmgJS-EmailDomainError")).hide();
                var emailBox = $("#".concat(formID, " .c-text-field"));
                var reg = new RegExp("^(?!^[.])([-'a-zA-Z0-9_]+\\.)*[-'a-zA-Z0-9_]+@(?!\\.+)([-a-zA-Z0-9]+\\.)+[a-zA-Z]{2,}$");
                if (emailBox.val().length == 0) {
                    valid = false;
                    $("#".concat(formID, " .pmgJS-EmailDomainError")).show();
                }
                if (!reg.test(emailBox.val())) {
                    valid = false;
                    $("#".concat(formID, " .pmgJS-EmailValidationError")).show();
                }
                return valid;
            }
            OfficeSignup.FormIsValid = FormIsValid;
        })(OfficeSignup = Components.OfficeSignup || (Components.OfficeSignup = {}));
        function IframeDemo() {
            var iframe = document.querySelector("#teams-demo-frame");
            if (iframe === null) {
                return;
            }
            var iwindow = window.innerWidth;
            var height = (iwindow * 16 / 9);
            height -= (height / 100 * 1);
            iframe.height = (iwindow / 16 * 9).toString();
        }
        Components.IframeDemo = IframeDemo;
        var HowToBuyModule;
        (function (HowToBuyModule) {
            var previousWidth, currentWidth;
            function init() {
                if ($('.Ctex-HowToBuy-Expanding-Products').length > 0) {
                    previousWidth = $(window).width();
                    findTextHeight();
                    $(window).resize(function () {
                        currentWidth = $(window).width();
                        if (currentWidth !== previousWidth) {
                            previousWidth = currentWidth;
                            resizeHowToBuy();
                        }
                    });
                    $('my-app .ng-valid').on("click keypress", function () {
                        setTimeout(function () {
                            $('my-app .c-action-trigger, my-app .c-button:not(.active .c-button), #DevicesClearAllButton, #DevicesFilterButton, my-app .ng-valid').on("click keypress", function () {
                                $('.Ctex-HowToBuy-Expanding-Products > div > div div > a, .Ctex-HowToBuy-Expanding-Products .closeButton').off("click keypress", encapsulateHTBModule);
                                $('.Ctex-HowToBuy-Expanding-Products > div > div div > a, .Ctex-HowToBuy-Expanding-Products .closeButton').on("click keypress", encapsulateHTBModule);
                            });
                        }, 500);
                    });
                    $(document).on("click keypress", ".Ctex-HowToBuy-Expanding-Products > div > div div > a, .Ctex-HowToBuy-Expanding-Products .closeButton", encapsulateHTBModule);
                    function encapsulateHTBModule(e) {
                        var code = e.keyCode || e.which, listItems = $('.Ctex-HowToBuy-Expanding-Products > div > div'), hiddenItems = $('.Ctex-HowToBuy-Expanding-Products > div > div [data-grid="col-12"]:last-of-type'), thisGrandParent = $(this).parent().parent(), thisLiCount = thisGrandParent.index();
                        if (code == 13 || code == 1) {
                            listItems.removeClass('ActiveItem');
                            thisGrandParent.addClass("ActiveItem");
                            $(".whiteCoverUp").css("background-color", "rgba(0,0,0,0)");
                            $(this).parent().find(".whiteCoverUp").css("background-color", "#fff");
                            if ($(this).hasClass('activeAnchor') || $(this).hasClass("closeButton")) {
                                if ($(this).hasClass("closeButton")) {
                                    thisGrandParent.slideUp(400, function () {
                                        listItems.height('');
                                        $(this).removeClass("active").addClass("hidden");
                                        $(".whiteCoverUp").css("background-color", "rgba(0,0,0,0)");
                                    }).parent().find("a").attr("aria-expanded", "false")[0].focus();
                                    thisGrandParent.parent().find(".show-details-link p").text("SHOW DETAILS");
                                    thisGrandParent.parent().find(".show-details-link p").toggleClass("ctex-glyph-downArrow");
                                    thisGrandParent.parent().find(".show-details-link p").toggleClass("ctex-glyph-upArrow");
                                    thisGrandParent.parent().find(".show-details-link p").css("display", "block");
                                }
                                else {
                                    if (thisGrandParent.find('.active').attr("id") === "DevicesClearAllButton") {
                                        $('.device-properties').find('.active').slideUp(400, function () {
                                            listItems.height('');
                                            $(this).removeClass("active").addClass("hidden");
                                            $(".whiteCoverUp").css("background-color", "rgba(0,0,0,0)");
                                        });
                                        $(this).attr("aria-expanded", "false");
                                    }
                                    thisGrandParent.find(".active").slideUp(400, function () {
                                        listItems.height('');
                                        $(this).removeClass("active").addClass("hidden");
                                        $(".whiteCoverUp").css("background-color", "rgba(0,0,0,0)");
                                    });
                                    $(this).attr("aria-expanded", "false");
                                }
                                listItems.removeClass('ActiveItem').find('a').removeClass("activeAnchor");
                                $(this).parent().find(".show-details-link p").text("SHOW DETAILS");
                                $(this).parent().find(".show-details-link p").toggleClass("ctex-glyph-downArrow");
                                $(this).parent().find(".show-details-link p").toggleClass("ctex-glyph-upArrow");
                                $(this).parent().find(".show-details-link p").css("display", "block");
                            }
                            else {
                                listItems.find('a').removeClass("activeAnchor");
                                $(this).addClass("activeAnchor");
                                $(this).attr("aria-expanded", "true");
                                hiddenItems.addClass("hidden").removeClass("active");
                                listItems.height('');
                                hiddenItems.hide();
                                var heightToOffset = $('.Ctex-HowToBuy-Expanding-Products').offset().top - $(this).offset().top, activeElement = $('.Ctex-HowToBuy-Expanding-Products > div > div a.activeAnchor');
                                sliceHowToBuy($(this), thisLiCount, listItems, thisGrandParent, activeElement.parent().parent().find('.hidden').height() + activeElement.height());
                                thisGrandParent.find(".hidden").removeClass("hidden").addClass("active").slideDown(400, function () {
                                    $(this).parent().find(".whiteCoverUp").css("background-color", "#fff");
                                });
                                htbSetHeight(heightToOffset, activeElement, false);
                                $(this)[0].scrollIntoView();
                                $(".show-details-link p").each(function () {
                                    $(this).text("SHOW DETAILS");
                                    if ($(this).hasClass("ctex-glyph-upArrow")) {
                                        $(this).removeClass("ctex-glyph-upArrow");
                                    }
                                    $(this).addClass("ctex-glyph-downArrow");
                                });
                                $(this).parent().find(".show-details-link p").text("HIDE DETAILS");
                                $(this).parent().find(".show-details-link p").toggleClass("ctex-glyph-downArrow");
                                $(this).parent().find(".show-details-link p").toggleClass("ctex-glyph-upArrow");
                                $(this).parent().find(".show-details-link p").css("display", "block");
                            }
                        }
                    }
                    ;
                    function resizeHowToBuy() {
                        var maxDivHeight = 0, maxActiveHeight = 0, getScreenWidth = window.innerWidth;
                        findTextHeight();
                        $('.Ctex-HowToBuy-Expanding-Products > div > div').each(function () {
                            if ($(this).attr('style')) {
                                if ($(this).find('a').height() > maxDivHeight) {
                                    maxDivHeight = $(this).find('a').height();
                                }
                                if ($(this).find('.active').height() > maxActiveHeight) {
                                    maxActiveHeight = $(this).find('.active').height();
                                }
                                $(this).height(maxDivHeight + maxActiveHeight);
                            }
                        });
                        $('.Ctex-HowToBuy-Expanding-Products li:not(.ActiveItem)').height('');
                        var thisItem = $('.Ctex-HowToBuy-Expanding-Products > div > div.ActiveItem div:first-of-type a'), thisLiCount = $('.Ctex-HowToBuy-Expanding-Products > div > div.ActiveItem').index(), listItems = $('.Ctex-HowToBuy-Expanding-Products > div > div'), thisGrandParent = $('.Ctex-HowToBuy-Expanding-Products > div > div.ActiveItem');
                        sliceHowToBuy(thisItem, thisLiCount, listItems, thisGrandParent, maxDivHeight + maxActiveHeight);
                        htbSetHeight(null, null, true);
                    }
                    ;
                    function htbSetHeight(heightToOffset, activeElement, isResize) {
                        var activeElementOffset = $('.Ctex-HowToBuy-Expanding-Products > div > div a.activeAnchor').offset(), activeElementHeight = $('.Ctex-HowToBuy-Expanding-Products > div > div a.activeAnchor').height();
                        if (isResize && activeElementOffset != null) {
                            var heightToOffsetResize = activeElementOffset.top - $('.Ctex-HowToBuy-Expanding-Products').offset().top, activeElementResize = $('.Ctex-HowToBuy-Expanding-Products > div > div a.activeAnchor');
                            activeElementResize.parent().parent().find('.active').css("top", heightToOffsetResize + activeElementHeight + 1);
                        }
                        else if (activeElementOffset != null) {
                            heightToOffset = activeElementOffset.top - $('.Ctex-HowToBuy-Expanding-Products').offset().top;
                            activeElement.parent().parent().find('.active').css("top", heightToOffset + activeElementHeight + 1);
                        }
                    }
                    function findTextHeight() {
                        var textHeight = 0, textItems = $('.Ctex-HowToBuy-Expanding-Products > div > div > div > a >  h3');
                        textItems.each(function () {
                            $(this).css('height', '');
                            if ($(this).outerHeight() > textHeight) {
                                textHeight = $(this).outerHeight();
                            }
                        });
                        textItems.each(function () {
                            $(this).css('height', textHeight);
                        });
                    }
                    function sliceHowToBuy(thisItem, thisLiCount, listItems, thisGrandParent, tempHeight) {
                        var getScreenWidth = window.innerWidth;
                        if ($('.Ctex-HowToBuy-Expanding-Products > .device-properties > div').find('a').hasClass("activeAnchor")) {
                            if (getScreenWidth <= 550 && getScreenWidth <= 1024) {
                                if (thisLiCount < 1) {
                                    listItems.slice(0, 1).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 1 && thisLiCount < 2) {
                                    listItems.slice(1, 2).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 2 && thisLiCount < 3) {
                                    listItems.slice(2, 3).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 3 && thisLiCount < 4) {
                                    listItems.slice(3, 4).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 4 && thisLiCount < 5) {
                                    listItems.slice(4, 5).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 5 && thisLiCount < 6) {
                                    listItems.slice(5, 6).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 6 && thisLiCount < 7) {
                                    listItems.slice(6, 7).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 7 && thisLiCount < 8) {
                                    listItems.slice(7, 8).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 8 && thisLiCount < 9) {
                                    listItems.slice(8, 9).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 9 && thisLiCount < 10) {
                                    listItems.slice(9, 10).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 10 && thisLiCount < 11) {
                                    listItems.slice(10, 11).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 11 && thisLiCount < 12) {
                                    listItems.slice(11, 12).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 13) {
                                    listItems.slice(12, 15).height(tempHeight + 100);
                                }
                            }
                            else if (getScreenWidth >= 550 && getScreenWidth <= 1024) {
                                if (thisLiCount < 2) {
                                    listItems.slice(0, 2).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 2 && thisLiCount < 4) {
                                    listItems.slice(2, 4).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 4 && thisLiCount < 6) {
                                    listItems.slice(4, 6).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 6 && thisLiCount < 8) {
                                    listItems.slice(6, 8).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 8 && thisLiCount < 10) {
                                    listItems.slice(8, 10).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 10 && thisLiCount < 12) {
                                    listItems.slice(10, 12).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 14) {
                                    listItems.slice(12, 14).height(tempHeight + 100);
                                }
                            }
                            else {
                                if (thisLiCount < 3) {
                                    listItems.slice(0, 3).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 3 && thisLiCount < 6) {
                                    listItems.slice(3, 6).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 6 && thisLiCount < 9) {
                                    listItems.slice(6, 9).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 9 && thisLiCount < 12) {
                                    listItems.slice(9, 12).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 15) {
                                    listItems.slice(12, 15).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 15 && thisLiCount < 18) {
                                    listItems.slice(15, 18).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 18 && thisLiCount < 21) {
                                    listItems.slice(18, 21).height(tempHeight + 50);
                                }
                            }
                        }
                        else if ($('.Ctex-HowToBuy-Expanding-Products > div > div').find('a').hasClass("activeAnchor")) {
                            if (getScreenWidth <= 768) {
                                if (thisLiCount < 2) {
                                    listItems.slice(0, 2).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 2 && thisLiCount < 4) {
                                    listItems.slice(2, 4).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 4 && thisLiCount < 6) {
                                    listItems.slice(4, 6).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 6 && thisLiCount < 8) {
                                    listItems.slice(6, 8).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 8 && thisLiCount < 10) {
                                    listItems.slice(8, 10).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 10 && thisLiCount < 12) {
                                    listItems.slice(10, 12).height(tempHeight + 100);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 13) {
                                    listItems.slice(12, 14).height(tempHeight + 100);
                                }
                            }
                            else if (getScreenWidth <= 940 && getScreenWidth >= 769) {
                                if (thisLiCount < 3) {
                                    listItems.slice(0, 3).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 3 && thisLiCount < 6) {
                                    listItems.slice(3, 6).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 6 && thisLiCount < 9) {
                                    listItems.slice(6, 9).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 9 && thisLiCount < 12) {
                                    listItems.slice(9, 12).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 15) {
                                    listItems.slice(12, 15).height(tempHeight + 50);
                                }
                            }
                            else {
                                if (thisLiCount < 4) {
                                    listItems.slice(0, 4).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 4 && thisLiCount < 8) {
                                    listItems.slice(4, 8).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 8 && thisLiCount < 12) {
                                    listItems.slice(8, 12).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 12 && thisLiCount < 15) {
                                    listItems.slice(12, 16).height(tempHeight + 50);
                                }
                                else if (thisLiCount >= 15 && thisLiCount < 19) {
                                    listItems.slice(16, 20).height(tempHeight + 50);
                                }
                            }
                        }
                    }
                }
            }
            HowToBuyModule.init = init;
        })(HowToBuyModule = Components.HowToBuyModule || (Components.HowToBuyModule = {}));
        var TeamsDemoParser;
        (function (TeamsDemoParser) {
            function Init(location) {
                var _a;
                if (location === void 0) { location = window.location.pathname; }
                var $iframe = document.getElementById("teams-demo-frame");
                if ($iframe === null) {
                    return;
                }
                var base = "https://octe.azurewebsites.net/Microsoft/viewer/394/index.html#";
                var returnUrl;
                location = location
                    .replace(/^\/en-us\/education\/interactive-demos\//, '')
                    .replace(/default.aspx/, '');
                var keys = {
                    "reading-progress-introduction": "/1/9",
                    "inform-instruction-insights": "/1/7",
                    "data-driven-insights": "/1/8",
                    "personalized-guidance-students": "/1/6",
                    "explore-inclusive-classroom": "/1/4",
                    "online-learning-microsoft-edge": "/1/5",
                    "educators-microsoft-teams": "/1/0",
                    "students-microsoft-teams": "/1/1",
                    "collaboration-engagement": "/1/2",
                    "manage-school-technology": "/1/3",
                    "migrate-identities-to-cloud": "/1/10",
                    "set-up-Microsoft-365": "/1/11",
                    "enroll-devices-at-scale": "/1/12",
                    "deploy-apps-and-policies": "/1/13",
                    "Microsoft-learn-demo": "/1/14",
                    "education-equity": "/1/15",
                };
                returnUrl = base + ((_a = keys[location]) !== null && _a !== void 0 ? _a : '');
                $iframe.src = returnUrl;
            }
            TeamsDemoParser.Init = Init;
        })(TeamsDemoParser = Components.TeamsDemoParser || (Components.TeamsDemoParser = {}));
        var QueryString;
        (function (QueryString) {
            function GetValue(name, url) {
                if (!url)
                    url = window.location.href;
                name = name.replace(/[\[\]]/g, '\\$&');
                var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(url);
                if (!results)
                    return null;
                if (!results[2])
                    return '';
                return decodeURIComponent(results[2].replace(/\+/g, ' '));
            }
            QueryString.GetValue = GetValue;
        })(QueryString = Components.QueryString || (Components.QueryString = {}));
        var Cookies;
        (function (Cookies) {
            function CreateCookie(name, value, days) {
                var expires;
                if (days) {
                    var date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                else {
                    expires = "";
                }
                document.cookie = name + "=" + value + expires + "; path=/";
            }
            Cookies.CreateCookie = CreateCookie;
            function GetCookie(c_name) {
                if (document.cookie.length > 0) {
                    var c_start = document.cookie.indexOf(c_name + "=");
                    if (c_start != -1) {
                        c_start = c_start + c_name.length + 1;
                        var c_end = document.cookie.indexOf(";", c_start);
                        if (c_end == -1) {
                            c_end = document.cookie.length;
                        }
                        return unescape(document.cookie.substring(c_start, c_end));
                    }
                }
                return "";
            }
            Cookies.GetCookie = GetCookie;
        })(Cookies = Components.Cookies || (Components.Cookies = {}));
        var SuperMosaic;
        (function (SuperMosaic) {
            function mobileTextBoxSwap() {
                var screensize = $(window).width();
                $(".topAlign").each(function (count, element) {
                    if (screensize <= 768) {
                        var container = $(element).parent();
                        var textBox = $(element);
                        $(element).remove();
                        container.prepend(textBox);
                    }
                    else {
                        var container = $(element).parent();
                        var textBox = $(element);
                        $(element).remove();
                        container.append(textBox);
                    }
                });
            }
            SuperMosaic.mobileTextBoxSwap = mobileTextBoxSwap;
            function superMosaicInit() {
                $(document).ready(function () {
                    mobileTextBoxSwap();
                    $(window).resize(function () {
                        mobileTextBoxSwap();
                    });
                });
            }
            SuperMosaic.superMosaicInit = superMosaicInit;
        })(SuperMosaic = Components.SuperMosaic || (Components.SuperMosaic = {}));
        var FeedHero;
        (function (FeedHero) {
            function Init() {
                $(".m-feed-hero-item").on("click", function () {
                    var target = getFeedHeroLinkTarget(".m-feed-hero-item a");
                    window.open($(".m-feed-hero-item a").prop("href"), target);
                });
                $(".f-active .m-feed-hero-item").on("click", function () {
                    var target = getFeedHeroLinkTarget(".m-feed-hero-item a");
                    window.open($(".f-active .m-feed-hero-item a").prop("href"), target);
                });
                $(".m-feed-hero-item a").on("click", function (e) {
                    e.stopPropagation();
                    return true;
                });
                function getFeedHeroLinkTarget(selector) {
                    var target = $(selector).prop("target");
                    var validatedTarget = target ? target : "_self";
                    return validatedTarget;
                }
            }
            FeedHero.Init = Init;
        })(FeedHero = Components.FeedHero || (Components.FeedHero = {}));
        var ResourceCenterPivot;
        (function (ResourceCenterPivot) {
            function Init() {
                $('#ResourceCenterPivotTabHeaderItem3').on("click", function () {
                    OpenNewTabOnSchoolStoriesTabClick();
                });
                $('#ResourceCenterPivotTabHeaderItem3').keydown(function (e) {
                    if (e.which == 13) {
                        OpenNewTabOnSchoolStoriesTabClick();
                    }
                });
                function OpenNewTabOnSchoolStoriesTabClick() {
                    window.open('https://customers.microsoft.com/en-us/search?sq=&ff=story_industry_friendlyname%26%3EPrimary%20and%20Secondary%20Education&p=0&so=story_publish_date%20desc', '_blank');
                }
            }
            ResourceCenterPivot.Init = Init;
        })(ResourceCenterPivot = Components.ResourceCenterPivot || (Components.ResourceCenterPivot = {}));
    })(Components = Cortex.Components || (Cortex.Components = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var Generic;
    (function (Generic) {
        function checkCanonical() {
            $(document).ready(function () {
                var _a;
                var hasCanon = document.head.querySelector("link[rel=canonical]") != null, hasNoIndex = (_a = document.head.querySelector("meta[name=robots]")) === null || _a === void 0 ? void 0 : _a.getAttribute("content").includes("noindex"), link = document.createElement("link"), defaultOrTrailingSlash = /(\/default.aspx)|(\/$)/gmi, linkHref = 'https://' + window.location.host + window.location.pathname.replace(defaultOrTrailingSlash, "");
                if (!hasCanon && !hasNoIndex) {
                    link.rel = "canonical";
                    link.href = linkHref.toLowerCase();
                    document.head.appendChild(link);
                }
                else if (hasCanon && hasNoIndex) {
                    document.head.querySelector("link[rel=canonical]").remove();
                }
            });
        }
        Generic.checkCanonical = checkCanonical;
        function calculateComponentLength() {
            var contentPlacements = document.getElementsByClassName('ctex-flex-container');
            if (contentPlacements.length > 0) {
                for (var i = 0; i < contentPlacements.length; i++) {
                    var count = contentPlacements[i].childElementCount;
                    contentPlacements[i].classList.add('ctex-' + count.toString() + 'up');
                }
            }
            var expandingTileContentPlacements = Array.prototype.slice.call(document.querySelectorAll('.Ctex-HowToBuy-Expanding-Products .ctex-flex-container'));
            if (expandingTileContentPlacements.length) {
                expandingTileContentPlacements.forEach(function (item) {
                    item.classList.add('wrap-exempt');
                });
            }
        }
        Generic.calculateComponentLength = calculateComponentLength;
        function fixFeatureBleed() {
            var maxHeight = 0, featureIsStacked, currentWidth = window.innerWidth, stackBreakpoint, elemHeight = 0;
            $('.m-feature.ctex-feature-bleed-fix, .c-feature.ctex-feature-bleed-fix').each(function (indexFeature) {
                var isVideo = false;
                if ($(this).hasClass("f-align-center")) {
                    return;
                }
                if ($(this).hasClass('c-feature')) {
                    stackBreakpoint = 1084;
                }
                else if ($(this).hasClass('m-feature')) {
                    stackBreakpoint = 768;
                }
                maxHeight = 0;
                if ($(this).find('.m-ambient-video').height() != null) {
                    elemHeight = $(this).find('.m-ambient-video').height();
                    isVideo = true;
                }
                else {
                    elemHeight = $(this).children('picture').find('img').height();
                }
                var contentHeight = $(this).children('div:not(.m-ambient-video)').height();
                maxHeight = elemHeight < contentHeight ? contentHeight : elemHeight;
                $(this).find('picture img, .m-ambient-video').removeClass('force-vertical-align').addClass('force-vertical-align');
                $(this).find('picture').css({
                    'height': 'inherit',
                    'position': 'relative'
                });
                featureIsStacked = currentWidth < stackBreakpoint ? true : false;
                $(this).children().each(function (childIndex) {
                    if (featureIsStacked) {
                        maxHeight = '100%';
                        if (isVideo) {
                            $(this).removeClass('force-vertical-align');
                        }
                        else {
                            $(this).find('img').removeClass('force-vertical-align');
                        }
                    }
                }).parent().height(maxHeight);
            });
        }
        Generic.fixFeatureBleed = fixFeatureBleed;
        function setLinkTargets() {
            $(document).ready(function () {
                var main = document.querySelector('main'), links = main.querySelectorAll('a');
                Array.prototype.slice.call(links).forEach(function (link) {
                    if (!link.href.match(/(microsoft.com\/education|\/[a-zA-Z]{2}-[a-zA-Z]{2}\/education\/|localhost|ms-p9-s3-|ms-p1-s3-|ms-p9-s2-)/)) {
                        if (link.href !== '#' && !link.href.includes("footnote")) {
                            link.setAttribute('target', '_blank');
                        }
                    }
                    else {
                        var linkURL = new URL(link.href).pathname.substring(1, 6);
                        if (document.body.dataset['locale'].toLowerCase() !== linkURL.toLowerCase() && !link.href.includes("footnote")) {
                            link.setAttribute('target', '_blank');
                        }
                        else {
                            link.removeAttribute('target');
                        }
                    }
                });
            });
        }
        Generic.setLinkTargets = setLinkTargets;
        function stripEmptyAttrs() {
            var main = document.querySelector("main"), els = main.querySelectorAll("img, a, button"), attrs = ["id", "aria-label", "onclick"], elArr;
            if (els.length) {
                elArr = Array.prototype.slice.call(els);
                elArr.forEach(function (el) {
                    attrs.forEach(function (attr) {
                        if (el.hasAttribute(attr) && el.attributes[attr].value == "") {
                            el.removeAttribute(attr);
                        }
                    });
                });
            }
        }
        Generic.stripEmptyAttrs = stripEmptyAttrs;
        function multiFeatureHandler() {
            if ($('.c-pivot ul li').length > 0) {
                var firstItem = $('.c-pivot ul li:first-of-type').attr("aria-controls").split(" ");
                firstItem.forEach(function (item) {
                    $("#" + item).attr("aria-hidden", "false");
                });
            }
            $('.c-pivot ul li').on("click keypress", function () {
                var targets = $(this).attr("aria-controls").split(" ");
                targets.forEach(function (target) {
                    $('.c-pivot span section').attr("aria-hidden", "true");
                    $("#" + target).attr("aria-hidden", "false");
                });
            });
            $('.f-multi-slide .c-flipper').on("click", function () {
                if ($('.c-pivot ul li').length) {
                    var targets = $('.c-pivot ul li.f-active').attr("aria-controls").split(" ");
                    targets.forEach(function (target) {
                        $('.c-pivot span section').attr("aria-hidden", "true");
                        $("#" + target).attr("aria-hidden", "false");
                    });
                }
            });
        }
        Generic.multiFeatureHandler = multiFeatureHandler;
        function MultiSlideCarousel() {
            if ($('.c-carousel.f-multi-slide')) {
                $('.c-carousel.f-multi-slide li:not(:first)').removeClass("f-active");
            }
        }
        Generic.MultiSlideCarousel = MultiSlideCarousel;
        function tabbedFeatureHandler() {
            $(document).ready(function () {
                var multifeatures = Array.prototype.slice.call(document.querySelectorAll('.m-multi-feature'));
                if (multifeatures.length > 0) {
                    multifeatures.forEach(function (multifeature) {
                        var uls = Array.prototype.slice.call(multifeature.querySelectorAll('ul'));
                        uls.forEach(function (ul) {
                            var lis = Array.prototype.slice.call(ul.querySelectorAll('li + li'));
                            lis.forEach(function (li) {
                                li.classList.remove('f-active');
                                var anchors = li.querySelectorAll('a');
                                if (anchors.length > 0) {
                                    anchors.forEach(function (anchor) {
                                        anchor.classList.remove('f-active');
                                    });
                                }
                            });
                        });
                    });
                }
            });
        }
        Generic.tabbedFeatureHandler = tabbedFeatureHandler;
        function navContentPlacementAccessibilityHandler() {
            var navContentPlacements = Array.prototype.slice.call(document.querySelectorAll('.nav-contentplacement'));
            if (navContentPlacements.length > 0) {
                navContentPlacements.forEach(function (navContentPlacement) {
                    var links = Array.prototype.slice.call(navContentPlacement.querySelectorAll('a'));
                    if (links.length > 0) {
                        links.forEach(function (link) {
                            link.setAttribute('aria-setsize', links.length);
                            link.setAttribute('aria-posinset', links.indexOf(link) + 1);
                        });
                    }
                });
            }
        }
        Generic.navContentPlacementAccessibilityHandler = navContentPlacementAccessibilityHandler;
        function bettCampaignPopup() {
            if ($(".pop-up")) {
                var width = window.innerWidth, imgTarget = $('.pop-up picture img, .pop-up picture source'), LargeImage = "https://cortexonemsedu.azureedge.net/assets/geo-triggered-banner-1920/1/1920_ad_geotargeted-bett.jpg", smallImage = "https://forrit-one-msedu-p1-consumables.azureedge.net/media/cd881d31-482c-4b06-802d-cbcc9b6e3183/539_ad_geotargeted-bett.jpg";
                window.onresize = function () {
                    width = window.innerWidth;
                    if (width <= 539) {
                        imgTarget.attr("src", smallImage);
                        imgTarget.attr("srcset", smallImage);
                    }
                    else {
                        imgTarget.attr("src", LargeImage);
                        imgTarget.attr("srcset", LargeImage);
                    }
                };
            }
        }
        Generic.bettCampaignPopup = bettCampaignPopup;
        function addHreflangTag() {
            var _a;
            var locale = (_a = document.head
                .querySelector('meta[name=\'og:locale\']')) === null || _a === void 0 ? void 0 : _a.getAttribute('content').toLowerCase();
            var link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = locale;
            link.href = window.location.href;
            document.head.appendChild(link);
        }
        Generic.addHreflangTag = addHreflangTag;
    })(Generic = Cortex.Generic || (Cortex.Generic = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var LiveChat;
    (function (LiveChat) {
        var LPinviteStyles = 'div[id^="messaging_agent_availability"] {display: none;}';
        function LPtoggleInvite(LPinviteStyles) {
            var css = document.createElement('style');
            css.type = 'text/css';
            css.appendChild(document.createTextNode(LPinviteStyles));
            document.getElementsByTagName("head")[0].appendChild(css);
        }
        function hideLivePersonElements() {
            $("#contact-us-chat-cta, #contact-us-chat-cta2, #contact-us-chat-cta3").hide();
            if ($("#widget-chat-container") && $("#widget-chat-container").length > 0) {
                $("#widget-chat-container").addClass("cw-list-item--hidden");
                $("#contact-us-chat-cta").removeClass('cw-action-trigger cw-hyperlink');
                $("#widget-chat-container").removeAttr("style");
            }
        }
        function showLivePersonElements() {
            LPtoggleInvite('div[id^="messaging_agent_availability"] {display: block;}');
            $("#contact-us-chat-cta, #contact-us-chat-cta2, #contact-us-chat-cta3").show();
            if ($("#widget-chat-container") && $("#widget-chat-container").length > 0) {
                $("#widget-chat-container").removeClass("cw-list-item--hidden");
                $("#contact-us-chat-cta").addClass('cw-action-trigger cw-hyperlink');
                $("#widget-chat-container").removeAttr("style");
            }
        }
        var Section;
        (function (Section) {
            Section[Section["enUS"] = 0] = "enUS";
            Section[Section["CloudPlatformUS"] = 1] = "CloudPlatformUS";
            Section[Section["EducationMarcom"] = 2] = "EducationMarcom";
        })(Section = LiveChat.Section || (LiveChat.Section = {}));
        function LocaleEnableMatch(currentLocale, localesToApply) {
            for (var idx = 0; idx < localesToApply.length; idx++) {
                if (localesToApply[idx].match(new RegExp(currentLocale, 'i')) != null) {
                    return true;
                }
            }
            return false;
        }
        LiveChat.LocaleEnableMatch = LocaleEnableMatch;
        function Apply(lpSectionCode, currentLocale, localesToApply) {
            LPtoggleInvite(LPinviteStyles);
            if (localesToApply) {
                if (!LocaleEnableMatch(currentLocale, localesToApply)) {
                    return;
                }
            }
            var lpSection, MSFTConfig = {
                coreData: {
                    siteID: '60270350'
                }
            };
            switch (lpSectionCode) {
                case Section.enUS:
                    lpSection = 'productivity-leadgen-en-us-education';
                    break;
                case Section.CloudPlatformUS:
                    lpSection = 'cloudplatform-leadgen-en-us-education';
                    break;
                case Section.EducationMarcom:
                    lpSection = 'education-marcom-en-us';
                    break;
            }
            var lpTag = lpTag || {}, lpMTagConfig = lpMTagConfig || {};
            lpTag.vars = lpTag.vars || [];
            lpTag.dbs = lpTag.dbs || [];
            lpTag.sdes = lpTag.sdes || [];
            lpTag.section = lpSection;
            window.lpTag = window.lpTag || {};
            if (typeof window.lpTag._tagCount === 'undefined') {
                window.lpTag = {
                    site: MSFTConfig.coreData.siteID || '',
                    section: lpTag.section || '',
                    autoStart: lpTag.autoStart === false ? false : true,
                    ovr: lpTag.ovr || {},
                    _v: '1.6.0',
                    _tagCount: 1,
                    protocol: 'https:',
                    events: {
                        bind: function (app, ev, fn) { lpTag.defer(function () { lpTag.events.bind(app, ev, fn); }, 0); },
                        trigger: function (app, ev, json) {
                            lpTag.defer(function () { lpTag.events.trigger(app, ev, json); }, 1);
                        }
                    },
                    defer: function (fn, fnType) {
                        if (fnType == 0) {
                            this._defB = this._defB || [];
                            this._defB.push(fn);
                        }
                        else if (fnType == 1) {
                            this._defT = this._defT || [];
                            this._defT.push(fn);
                        }
                        else {
                            this._defL = this._defL || [];
                            this._defL.push(fn);
                        }
                    },
                    load: function (src, chr, id) {
                        var t = this;
                        setTimeout(function () {
                            t._load(src, chr, id);
                        }, 0);
                    },
                    _load: function (src, chr, id) {
                        var url = src;
                        if (!src) {
                            url = this.protocol + '//' + ((this.ovr && this.ovr.domain) ? this.ovr.domain : 'lptag.liveperson.net') + '/tag/tag.js?site=' + this.site;
                        }
                        var s = document.createElement('script');
                        s.setAttribute('charset', chr ? chr : 'UTF-8');
                        if (id) {
                            s.setAttribute('id', id);
                        }
                        s.setAttribute('src', url);
                        document.getElementsByTagName('head').item(0).appendChild(s);
                    },
                    init: function () {
                        this._timing = this._timing || {};
                        this._timing.start = (new Date()).getTime();
                        var that = this;
                        if (window.attachEvent) {
                            window.attachEvent('onload', function () {
                                that._domReady('domReady');
                            });
                        }
                        else {
                            window.addEventListener('DOMContentLoaded', function () { that._domReady('contReady'); }, false);
                            window.addEventListener('load', function () { that._domReady('domReady'); }, false);
                        }
                        if (typeof (window._lptStop) == 'undefined') {
                            this.load();
                        }
                    }, start: function () { this.autoStart = true; }, _domReady: function (n) { if (!this.isDom) {
                        this.isDom = true;
                        this.events.trigger('LPT', 'DOM_READY', { t: n });
                    } this._timing[n] = (new Date()).getTime(); }, vars: lpTag.vars || [], dbs: lpTag.dbs || [], ctn: lpTag.ctn || [], sdes: lpTag.sdes || [], ev: lpTag.ev || []
                };
                lpTag = window.lpTag;
                lpTag.init();
            }
            else {
                window.lpTag._tagCount += 1;
            }
            function lpBindButton() {
                function lpButtonShow(eventData, eventInfo) {
                    var elements = document.getElementsByClassName("LPMcontainer");
                    var elementLength = elements.length;
                    for (var i = elementLength; i--;) {
                        var element = elements[i];
                        element.onclick = function () {
                            lpTag.sdes.push({
                                "type": "lead",
                                "lead": { "topic": "Education" }
                            });
                        };
                    }
                    if ($("#widget-chat-container") && $("#widget-chat-container").length > 0) {
                        $("#widget-chat-container").removeClass("cw-list-item--hidden");
                        $("#contact-us-chat-cta").addClass('cw-action-trigger cw-hyperlink');
                    }
                    $("#lpChatDynamics > div, #lpChatDynamics2 > div, #lpChatDynamics3 > div").removeAttr('tabindex');
                    $("#contact-us-chat-cta, #contact-us-chat-cta2, #contact-us-chat-cta3").attr('tabindex', '0');
                    $("#contact-us-chat-cta, #contact-us-chat-cta2").addClass('button-arrowlink');
                    $("#contact-us-chat-cta3").addClass('button-arrowlink button-arrowlink--black');
                    if ((typeof window["engagementFix"] !== 'undefined') && (lpTag.taglets.lpSecureStorage.getStorageType()['https://lpcdn.lpsnmedia.net']['monitoringSDK'] !== undefined)) {
                        lpTag.events.bind("LP_OFFERS", "OFFER_DISPLAY", lpButtonShow);
                        showLivePersonElements();
                    }
                    else {
                        hideLivePersonElements();
                    }
                }
                lpTag.events.bind("LP_OFFERS", "OFFER_DISPLAY", lpButtonShow);
            }
            lpTag.events.bind('LP_OFFERS', 'START', lpBindButton);
            console.log('chat start');
        }
        LiveChat.Apply = Apply;
    })(LiveChat = Cortex.LiveChat || (Cortex.LiveChat = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var LiveChatV2;
    (function (LiveChatV2) {
        function ValidateLiveChatConditions() {
            GetAgentAvailablityStatus()
                .done(function (response) {
                if (response.toUpperCase() == 'YES') {
                    console.log('Live Chat - agents availabile.');
                    $.ajax({
                        type: 'GET',
                        url: validateClientsLocationUrl,
                        success: function (result) {
                            if (result == 'US') {
                                console.log('Live Chat - available in region.');
                                console.log('Live Chat - initiate.');
                                Init();
                                console.log('Live Chat - initiated.');
                            }
                            else {
                                console.log('Live Chat - not available in region.');
                            }
                        },
                        error: function (xhr) {
                            console.log('Live Chat - failed to retrieve client location.');
                        }
                    });
                }
                else {
                    console.log('Live Chat - agents not availabile.');
                }
            })
                .fail(function (x) {
                console.log('Live Chat - failed to retrieve messaging agent availability.');
            });
        }
        LiveChatV2.ValidateLiveChatConditions = ValidateLiveChatConditions;
        function Init() {
            var iframe = document.getElementById('iFrameLiveChat');
            var sendMessage = function sendMessage(msg) {
                iframe.contentWindow.postMessage(msg, '*');
            };
            sendMessage({ lpcurl: location.href });
            window.addEventListener('message', function (msg) {
                if (msg.data.window) {
                    switch (msg.data.window) {
                        case 'ready':
                            console.log('Live Chat - ready');
                            sendMessage({ lpcurl: location.href });
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            break;
                        case 'maximized':
                            console.log('Live Chat - maximized');
                            $('#lpChatCta').addClass('hide-live-chat');
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            if (msg.data.height === '100vh') {
                                iframe.style.position = 'absolute';
                                iframe.style.right = '0px';
                            }
                            else {
                                iframe.style.position = 'fixed';
                                iframe.style.bottom = '0';
                                iframe.style.right = '0px';
                                iframe.style.boxShadow = '0 0 6px rgb(214, 214, 214)';
                            }
                            break;
                        case 'minimized':
                            console.log('Live Chat - minimized');
                            $('#lpChatCta').addClass('hide-live-chat');
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            iframe.style.position = 'fixed';
                            iframe.style.bottom = '0';
                            iframe.style.right = '0';
                            iframe.style.boxShadow = '0 0 6px rgb(214, 214, 214)';
                            break;
                        case 'closed':
                            console.log('Live Chat - closed');
                            $('#lpChatCta').removeClass('hide-live-chat');
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            break;
                        case 'opened':
                            console.log('Live Chat - opened');
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            break;
                        case 'loading':
                            console.log('Live Chat - loading');
                            iframe.style.width = msg.data.width;
                            iframe.style.height = msg.data.height;
                            break;
                        default:
                            console.log('msg not in case');
                            break;
                    }
                }
                if (msg.data.engagement) {
                    switch (msg.data.engagement) {
                        case 'buttonReady':
                            sendMessage({ action: 'initializeLP' });
                            $('.chatContainer, #lpChatCta').removeClass('hide-live-chat');
                            if ($('.support-content-placement-one-item.hide-live-chat').length) {
                                $('.support-content-placement-one-item.hide-live-chat').removeClass('hide-live-chat');
                                $('.support-content-placement-one-item').removeClass('support-content-placement-one-item');
                                $('#support-mwfContentPlacement-liveChatNow').removeAttr('href');
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
            window.addEventListener('resize', function (el) {
                sendMessage({
                    action: 'parentsize',
                    Height: window.innerHeight,
                    PixelRatio: 1,
                    Width: window.innerWidth,
                });
            });
            $('#lpChatButton, #liveChatStickyButtonLink, #support-mwfContentPlacement-liveChatNow').on('click', function () {
                sendMessage({ action: 'open' });
                InitiateLiveChatConfigs();
            });
            function InitiateLiveChatConfigs() {
                sendMessage({ Topic: 'Education' });
                sendMessage({ action: 'parentsize', Height: window.innerHeight, PixelRatio: 1, Width: window.innerWidth });
            }
        }
        LiveChatV2.Init = Init;
        function GetAgentAvailablityStatus() {
            return $.ajax({
                type: 'GET',
                url: getAgentAvailablityStatusUrl
            });
        }
    })(LiveChatV2 = Cortex.LiveChatV2 || (Cortex.LiveChatV2 = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var CpmApi;
    (function (CpmApi) {
        function CpmEmailAjax(emailAddress, country, optInType) {
            var cpmAPIUrl = cpmApiURL;
            $.ajax({
                type: "POST",
                url: cpmAPIUrl,
                data: { emailAddress: emailAddress, country: country, optInState: optInType, isItdmPage: isItdmPage },
                beforeSend: function () {
                    $('.cpm-form #success, .cpm-form #fail').hide();
                },
                success: function (result) {
                    $('.cpm-form input:submit, .cpm-form :input, .cpm-form select').prop('disabled', true);
                    $('.cpm-form input:submit').hide();
                    $('.cpm-form #success').show();
                    setTimeout(function () {
                        $('.newsletter-pop-up').fadeOut();
                    }, 5000);
                    console.log(result);
                },
                error: function (xhr) {
                    $('.cpm-form #fail').show();
                    console.log(xhr);
                }
            });
        }
        CpmApi.CpmEmailAjax = CpmEmailAjax;
    })(CpmApi = Cortex.CpmApi || (Cortex.CpmApi = {}));
})(Cortex || (Cortex = {}));
var eduLevelList = [];
var topicList = [];
var prodIntegrationList = [];
var InstitutonSizeList = [];
var regionList = [];
var countryList = [];
var languageList = [];
var searchList = [];
var checkedItemList = [];
var allRegions = [
    'africa',
    'asia',
    'caribbean',
    'europe',
    'latin america',
    'middle east',
    'north america',
    'oceania',
];
var africanRegions = [];
var asianRegions = [
    'en-id',
    'en-ph',
    'en-sg',
    'id-id',
    'ja-jp',
    'ko-kr',
    'vi-vn',
    'zh-cn',
    'zh-hk',
    'zh-tw',
];
var caribbeanRegions = [];
var europeRegions = [
    'cs-cz',
    'da-dk',
    'de-at',
    'de-ch',
    'de-de',
    'en-gb',
    'en-ie',
    'es-es',
    'fi-fi',
    'fr-be',
    'fr-fr',
    'hu-hu',
    'it-it',
    'nb-no',
    'nl-be',
    'nl-nl',
    'pl-pl',
    'pt-pt',
    'ro-ro',
    'ru-ru',
    'sv-se',
    'tr-tr',
    'uk-ua',
];
var latinAmericanRegions = ['es-xl', 'es-mx', 'pt-br'];
var middleEasternRegions = ['ar-ae', 'ar-gulf', 'ar-sa'];
var northAmericanRegions = ['en-ca', 'en-us', 'fr-ca'];
var oceanicRegions = ['en-au', 'en-nz'];
var selectedRegion = 'All regions';
var partialRequest;
var api;
var currentLocale;
function encode(key) {
    var reg = /[^a-zA-Z\d]|\s|\/|\./gmi;
    var id = escapeHtml(key
        .replace(reg, "-")
        .toLowerCase());
    return id;
}
function searchResults(event, currentPage) {
    var key = event.which || event.keyCode || 0;
    if (key === 13) {
        event === null || event === void 0 ? void 0 : event.preventDefault();
        var searchVal = $('#search-field').val();
        updateSelectedFiltersList('src', searchVal.toString(), searchVal.toString(), currentPage, event);
        $('#search-field').val('');
    }
}
function searchResultsClick(event, currentPage) {
    event === null || event === void 0 ? void 0 : event.preventDefault();
    var searchVal = $('#search-field').val();
    updateSelectedFiltersList('src', searchVal.toString(), encode(searchVal.toString()), currentPage, event);
    $('#search-field').val('');
}
function initCustomerStories(partial, _api, culture) {
    partialRequest = partial;
    api = _api;
    currentLocale = culture;
    if (document.getElementById('customer-stories-results') === null) {
        return;
    }
    ;
    $.get(partial)
        .done(function loadPartial(data) {
        $('#customer-stories-results').html(data);
    })
        .fail(function () {
        console.log('Failed request');
    });
}
function expandDevices() {
    var $button = document.getElementById('DevicesFilterButton');
    $button.classList.toggle('ctex-glyph-downArrow');
    $button.classList.toggle('ctex-glyph-upArrow');
    document.querySelector('.showStories').classList.toggle('ctex-hidden');
    document.querySelector('.hideStories').classList.toggle('ctex-hidden');
    document.getElementById('expanding-content').classList.toggle('display-none');
}
function updateCustomerStories(currentPage, isFirst, e) {
    e === null || e === void 0 ? void 0 : e.preventDefault();
    var requestParams = {
        edulvl: eduLevelList.join(','),
        Top: topicList.join(','),
        prod: prodIntegrationList.join(','),
        ISize: InstitutonSizeList.join(','),
        reg: regionList.join(','),
        clo: currentLocale,
        q: searchList.join(','),
        p: currentPage,
        i: isFirst,
        lang: currentLocale,
    };
    $.ajaxSetup({
        cache: false,
    });
    $.get(api, requestParams)
        .done(function loadAPI(data) {
        if (isFirst) {
            testLocaleGet();
            checkedItemList = [];
            eduLevelList = [];
            topicList = [];
            regionList = [];
            prodIntegrationList = [];
            InstitutonSizeList = [];
            searchList = [];
            if (!currentLocale) {
                selectedRegion = 'All Regions';
            }
            else {
                var test = selectedRegion.toLowerCase();
                updateSelectedFiltersList('reg', selectedRegion, test, currentPage, e);
            }
        }
        var ResultList = data.ResultList, _a = data.Pager, CurrentPage = _a.CurrentPage, StartPage = _a.StartPage, EndPage = _a.EndPage, TotalPages = _a.TotalPages, SelectedFilterList = data.SelectedFilterList, totalResults = data.totalResults, EducationLevelDictionary = data.EducationLevelDictionary, TopicDictionary = data.TopicDictionary, InstitutionDictionary = data.InstitutionDictionary, ProductIntegrationDictionary = data.ProductIntegrationDictionary;
        var updateCounters = function (fields) {
            Object.entries(fields).forEach(function (field) {
                var id = field[0], count = field[1];
                var key = encode(id);
                var $input = document.querySelector("input#input-".concat(key));
                if ($input !== null) {
                    $input.disabled = count === 0;
                }
                var $count = document.querySelector("span#count-".concat(key));
                if ($count !== null) {
                    $count.textContent = count.toString();
                }
            });
        };
        updateCounters(EducationLevelDictionary);
        updateCounters(TopicDictionary);
        updateCounters(InstitutionDictionary);
        updateCounters(ProductIntegrationDictionary);
        $('#total-results').text(totalResults);
        var $previousWrapper = $('#pager-previous-wrapper');
        $previousWrapper.toggleClass('display-none', CurrentPage === 1);
        $('a[data-id="pager-previous"]').attr('data-previous', CurrentPage - 1);
        $('#pager-next-wrapper').toggleClass('display-none', TotalPages === 1 || CurrentPage + 1 === TotalPages);
        $('a[data-id="pager-next"]').attr('data-next', CurrentPage + 1);
        $('li[data-id^="pager-"]').remove();
        var range = function (start, end) { return Array.from({ length: (end - start) }, function (_, k) { return k + start; }); };
        var newPagers = range(StartPage, EndPage).map(function (page) { return pagerNumberHTML(page, data); });
        $previousWrapper.after(newPagers);
        $('.m-pagination .f-active').removeClass('f-active');
        $(".m-pagination li[data-id='pager-".concat(CurrentPage, "']")).addClass('f-active');
        var selectedFiltersHTML = selectedFilters(SelectedFilterList);
        $('#currentSelections > li:not(:nth-child(1))').remove();
        $('#currentSelections > li').after(selectedFiltersHTML);
        $('#clear-all').toggleClass('display-none', SelectedFilterList.length === 0);
        var results = ResultList.map(resultsHTML);
        $('.customer-stories').html(results);
    })
        .fail(function () {
        console.log('Failed request');
    });
}
function removeFilter(from, key) {
    if (from === 'src') {
        searchList = searchList.filter(function (x) { return x !== key; });
        updateCustomerStories(1, false, null);
    }
    else {
        var $target = document.getElementById("input-".concat(key));
        switch ($target.tagName) {
            case 'OPTION':
                var option = $target;
                var select = option.parentElement;
                select.selectedIndex = 0;
                select.value = selectedRegion = 'All Regions';
                regionList = regionList.filter(function (x) { return encode(x) !== key; });
                updateCustomerStories(1, false, null);
                break;
            case 'INPUT':
                var input = $target;
                input.checked = false;
                checkedItemList = checkedItemList.filter(function (c) { return c !== 'input-' + key; });
                var event_1 = new Event('change');
                $target.dispatchEvent(event_1);
        }
    }
}
function updateSelectedFiltersList(from, categName, id, currentPage, e) {
    var index = checkedItemList.indexOf('input-' + id);
    if (index > -1) {
        checkedItemList.splice(index, 1);
    }
    else {
        checkedItemList.push(id);
    }
    if (allRegions.includes(id)) {
        selectedRegion = categName;
    }
    switch (from) {
        case 'edulvl':
            updateFilterList(eduLevelList, categName);
            break;
        case 'Top':
            updateFilterList(topicList, categName);
            break;
        case 'ISize':
            updateFilterList(InstitutonSizeList, categName);
            break;
        case 'prod':
            updateFilterList(prodIntegrationList, categName);
            break;
        case 'src':
            updateFilterList(searchList, categName);
            break;
        case 'reg':
            updateFilterList(regionList, categName);
            break;
    }
    updateCustomerStories(currentPage, false, null);
}
function updateFilterList(currList, itemName) {
    if ($.inArray(itemName, currList) === -1) {
        currList.push(itemName);
    }
    else {
        removefromList(currList, itemName);
    }
}
function removefromList(arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
}
function clearAllFilters(currentPage) {
    checkedItemList.forEach(function (listItem) {
        var checkSelection = document.getElementById(listItem);
        if (checkSelection) {
            checkSelection.checked = false;
            setTimeout(function () { }, 0);
        }
    });
    checkedItemList = [];
    eduLevelList = [];
    topicList = [];
    prodIntegrationList = [];
    InstitutonSizeList = [];
    regionList = [];
    searchList = [];
    selectedRegion = 'All regions';
    var select = document.getElementById('sltRegion');
    select.selectedIndex = 0;
    updateCustomerStories(currentPage, false, null);
}
function selectChange(e) {
    regionList = [];
    var regionId = e.target.selectedOptions[0].value;
    var text = e.target.selectedOptions[0].text;
    selectedRegion = text;
    updateSelectedFiltersList('reg', text, regionId, 1, e);
}
var entityMap = {
    '&': '-',
    '<': '-',
    '>': '-',
    '"': '-',
    "'": '-',
    '/': '-',
    ' ': '-',
};
function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}
function resizeContainers() {
    $('.item-container').height('auto');
    $('[id^="row-"]').each(function () {
        var highestBox = 0;
        $('.item-container', this).each(function () {
            if ($(this).height() > highestBox) {
                highestBox = $(this).height();
            }
        });
        $('.item-container', this).height(highestBox + 80);
    });
}
function testLocaleGet() {
    if (africanRegions.includes(currentLocale)) {
        selectedRegion = 'Africa';
    }
    else if (asianRegions.includes(currentLocale)) {
        selectedRegion = 'Asia';
    }
    else if (caribbeanRegions.includes(currentLocale)) {
        selectedRegion = 'Caribbean';
    }
    else if (europeRegions.includes(currentLocale)) {
        selectedRegion = 'Europe';
    }
    else if (latinAmericanRegions.includes(currentLocale)) {
        selectedRegion = 'Latin America';
    }
    else if (middleEasternRegions.includes(currentLocale)) {
        selectedRegion = 'Middle East';
    }
    else if (northAmericanRegions.includes(currentLocale)) {
        selectedRegion = 'North America';
    }
    else if (oceanicRegions.includes(currentLocale)) {
        selectedRegion = 'Oceania';
    }
    else if (!currentLocale) {
        selectedRegion = '';
    }
}
var pagerNumberHTML = function (page, data) {
    var CurrentPage = data.Pager.CurrentPage;
    return "\n        <li class=\"".concat(page === CurrentPage ? " f-active" : "", "\"\n            data-id=\"pager-").concat(page, "\">\n            <a href=\"#\"\n                class=\"ctex-focus dark-focus\"\n                aria-label=\"Go to page ").concat(page, "\"\n                onclick=\"updateCustomerStories(\n                    '").concat(page, "',\n                    false,\n                    event\n                )\">\n                <span>\n                    ").concat(page, "\n                </span>\n            </a>\n        </li>\n    ");
};
var resultsHTML = function (item, index) {
    var _a;
    var image = (!(item.ImageUrl === null || item.ImageUrl === "") && item.ImageUrl != "0")
        ? item.ImageUrl
        : "https://msp7l1170302145284.blob.core.windows.net/ms-p7-l1-170302-1453-24-assets/1399_Panel13_2up_Technology.jpg";
    var imageAria = (_a = item.ImageAria) !== null && _a !== void 0 ? _a : item.SchoolName;
    var ShortStory = item.StorySummary.substring(0, Math.min(160, item.StorySummary.length)) + "...";
    var ShortDesc = item.ShortDescription.substring(0, Math.min(70, item.ShortDescription.length)) + "...";
    return "\n        <li class=\"item\">\n            <img class=\"customer-story-image \"\n                    alt=\"".concat(imageAria, "\"\n                    src=\"").concat(image, "\"\n                    onerror=\"this.onerror = null; this.className+='fallback';\" />\n            <div class=\"customer-story-info-container\">\n                <p class=\"c-paragraph-5 bold\">").concat(item.SchoolName, "</p>\n                <h4 id=\"item-").concat(index, "\" class=\"c-heading-4 padding-top-10\">").concat(ShortDesc, "</h4>\n                <p class=\"customer-story-shortStory c-paragraph-4 padding-top-10\">").concat(ShortStory, "</p>\n                <ul>\n                    ").concat((item.IsVideo == "1")
        ? "<li class=\"float-left\">\n                                    <span class=\"ctex-glyphIcon-Font c-glyph ctex-glyph-play\">\n                                </span></li>"
        : '', "\n\n                    ").concat((item.IsCaseStudy == "1")
        ? "<li class=\"float-left\">\n                                    <svg class=\"ctex-glyph\"\n                                        height=\"32\"\n                                viewBox=\"-2 -2 30 30\"\n                                width=\"32\"\n                                xmlns=\"http://www.w3.org/2000/svg\">\n                                    <path d=\"m4.075 6v1.429h22.925v-1.429zm22.925 17.143h-22.925v1.428h22.925zm0-8.571h-22.925v1.428h22.925v-1.429zm-5.731-4.286h-17.194v1.429h17.194zm0 8.571h-17.194v1.429h17.194z\"\n                                    fill=\"#737373\"\n                                    fill-rule=\"evenodd\" />\n                                        </svg>\n                                    </li>"
        : '', "\n                </ul>\n                <a href=\"").concat(item.ctaLink, "\"\n                    target=\"_blank\"\n                    aria-label=\"Follow this link to learn more about the story\"\n                    class=\"item-readmore c-call-to-action ctex-cta-responsive ctex-text-uppercase f-lightweight c-glyph\">\n                    Read the Story\n                </a>\n            </div>\n        </li>\n    ");
};
var selectedFilters = function (SelectedFilterList) {
    return SelectedFilterList.map(function (_a) {
        var From = _a.From, Name = _a.Name, Key = _a.Key;
        return "\n            <li class=\"c-choice-summary\">\n                <span style=\"overflow: hidden\"\n                    class=\"ctex-focus light-focus\"\n                    aria-label=\"".concat(Name, "\">\n                        ").concat(Name, "\n                </span>\n                <button id=\"remove").concat(Key, "\"\n                    class=\"c-action-trigger c-glyph glyph-cancel\"\n                    aria-label=\"#training-and-events-remove filter-meta\"\n                    onclick=\"removeFilter('").concat(From, "', '").concat(Key, "')\">\n                </button>\n            </li>");
    });
};
var Cortex;
(function (Cortex) {
    var EdgeApi;
    (function (EdgeApi) {
        var productsUrl = 'https://edgeupdates.microsoft.com/api/products';
        var productsReqData = { view: 'enterprise' };
        var productsDataType = 'json';
        var apiReleaseData;
        function Init() {
            $.ajax({
                dataType: productsDataType,
                url: productsUrl,
                method: 'GET',
                data: productsReqData,
                headers: {
                    'x-requested-with': 'xhr',
                },
            })
                .done(function (productsData) {
                for (var i = 0; i < productsData.length; i++) {
                    if (productsData[i].Product === 'Stable') {
                        apiReleaseData = productsData[i].Releases;
                        GetDropDownItems('Version');
                        GetDropDownItems('Build');
                        GetDropDownItems('Platform');
                    }
                }
            })
                .fail(function () {
                addEdgeError("Failed to retrieve Edge product data.");
            });
            function GetDropDownItems(category) {
                var dropDownItems = [];
                for (var i = 0; i < apiReleaseData.length; i++) {
                    if (category == 'Version') {
                        if (dropDownItems.indexOf(apiReleaseData[i].ProductVersion) == -1) {
                            dropDownItems.push(apiReleaseData[i].ProductVersion);
                        }
                    }
                    else if (category == 'Build') {
                        if (dropDownItems.indexOf(apiReleaseData[i].Architecture) == -1) {
                            dropDownItems.push(apiReleaseData[i].Architecture);
                        }
                    }
                    else if (category == 'Platform') {
                        if (dropDownItems.indexOf(apiReleaseData[i].Platform) == -1) {
                            dropDownItems.push(apiReleaseData[i].Platform);
                        }
                    }
                }
                PopulateDropDown(dropDownItems, category);
            }
            function PopulateDropDown(list, category) {
                var id = '#edge' + category + 'DropDown';
                var dropDiv = document.querySelector(id);
                for (var i = 0; i < list.length; i++) {
                    dropDiv.innerHTML += "<option value=\"".concat(list[i], "\">").concat(list[i], "</li>");
                }
            }
            $('#downloadEdgeFileLink').click(function (event) {
                $(".error-message-wrapper").hide();
                var selectedVersion = $('#edgeVersionDropDown').val();
                var selectedBuild = $('#edgeBuildDropDown').val();
                var selectedPlatform = $('#edgePlatformDropDown').val();
                if (selectedVersion && selectedBuild && selectedPlatform) {
                    var downloadLink = apiReleaseData.filter(function (f) { return f.ProductVersion == selectedVersion
                        && f.Architecture == selectedBuild
                        && f.Platform == selectedPlatform; })
                        .map(function (m) { return m.Artifacts[0].Location; })
                        .toString();
                    if (downloadLink) {
                        top.location.href = downloadLink;
                    }
                    else {
                        addEdgeError("No download file found for the selected configurations.");
                    }
                }
                else {
                    addEdgeError("Please ensure an option is selected for all download configurations.");
                }
                event.preventDefault();
            });
            function addEdgeError(message) {
                $('#edgeDownloadErrorMessage').text(message);
                $(".error-message-wrapper").show();
            }
        }
        EdgeApi.Init = Init;
    })(EdgeApi = Cortex.EdgeApi || (Cortex.EdgeApi = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var EmailForm;
    (function (EmailForm) {
        function onSubmit(e) {
            e.preventDefault();
            var $form = e.target;
            var emailAddress = $form.elements["emailAddress"].value;
            var $success = $form.nextElementSibling;
            var $error = $form.querySelector('.pmgJS-EmailValidationError');
            $.ajax({
                type: 'post',
                url: discountAPI,
                data: { emailAddress: emailAddress },
                beforeSend: function (e) {
                    $($error).hide();
                },
                success: function (result) {
                    $($success).show();
                    $($form).hide();
                },
                error: function (xhr) {
                    $($error).show();
                }
            });
        }
        EmailForm.onSubmit = onSubmit;
    })(EmailForm = Cortex.EmailForm || (Cortex.EmailForm = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var GeoTargeting;
    (function (GeoTargeting) {
        var ukInformationData = [
            {
                "eventName": "Bett | 22-25 January 2020",
                "storeName": "",
                "lat": "51.5082857",
                "lng": "0.0285041",
                "address": "ExCeL London, One Western Gateway, Royal Victoria Dock",
                "city": "London",
                "state": "",
                "header": "Join us at Bett UK 2020!",
                "bodyCopy": "A new year brings new opportunities to learn about all the latest and greatest from Microsoft Education. Join Microsoft at Bett 2020 online or at the event in booth NF#40.",
                "ctaLink": "https://aka.ms/edu-bett2020",
                "radialDistance": 50,
                "isteCampaign": false
            }
        ];
        var storeInformationData = [
            {
                "eventName": "",
                "storeName": "Shops at La Cantera",
                "lat": "29.5934875",
                "lng": "-98.6164383",
                "address": "15900 La Cantera Parkway, Suite 6560",
                "city": "San Antonio",
                "state": "TX",
                "header": "Free educator training",
                "bodyCopy": "Stop by and learn more about our education products and solutions. Contact your local Microsoft store for a field trip or personal training.",
                "ctaLink": "https://www.microsoft.com/en-us/store/locations/tx/san-antonio/the-shops-at-la-cantera/store-20#bookappointmentid=5||Thank%20you%20for%20connecting%20with%20our%20local%20education%20experts.%20We%20are%20excited%20to%20offer%20you%20a%20complimentary%201:1%20training%20session%20on%20Teams%20as%20collaboration%20tools%20for%20the%20classroom.%20Please%20follow%20the%20prompts%20to%20schedule%20your%20appointment%20and%20email%20mrs0020CDS@microsoft.com%20with%20any%20additional%20questions",
                "radialDistance": 161,
                "isteCampaign": false
            },
            {
                "eventName": "",
                "storeName": "Mall of America",
                "lat": "44.8562138",
                "lng": "-93.2478096",
                "address": "162 South Avenue",
                "city": "Minneapolis",
                "state": "MN",
                "header": "Free educator training",
                "bodyCopy": "Stop by and learn more about our education products and solutions. Contact your local Microsoft store for a field trip or personal training.",
                "ctaLink": "https://www.microsoft.com/en-us/store/locations/mn/bloomington/mall-of-america/store-5#bookappointmentid=5||Thank%20you%20for%20connecting%20with%20our%20local%20education%20experts.%20We%20are%20excited%20to%20offer%20you%20a%20complimentary%201:1%20training%20session%20on%20Teams%20as%20collaboration%20tools%20for%20the%20classroom.%20Please%20follow%20the%20prompts%20to%20schedule%20your%20appointment%20and%20email%20mrs0005CDS@microsoft.com%20with%20any%20additional%20questions",
                "radialDistance": 161,
                "isteCampaign": false
            },
            {
                "eventName": "",
                "storeName": "Mall at Millenia",
                "lat": "28.4854854",
                "lng": "-81.433744",
                "address": "4200 Conroy Road, Suite 220",
                "city": "Orlando",
                "state": "FL",
                "header": "Free educator training",
                "bodyCopy": "Stop by and learn more about our education products and solutions. Contact your local Microsoft store for a field trip or personal training.",
                "ctaLink": "https://www.microsoft.com/en-us/store/locations/fl/orlando/mall-at-millenia/store-1013#bookappointmentid=5||Thank%20you%20for%20connecting%20with%20our%20local%20education%20experts.%20We%20are%20excited%20to%20offer%20you%20a%20complimentary%201:1%20training%20session%20on%20Teams%20as%20collaboration%20tools%20for%20the%20classroom.%20Please%20follow%20the%20prompts%20to%20schedule%20your%20appointment%20and%20email%20mrs0040CDS@microsoft.com%20with%20any%20additional%20questions",
                "radialDistance": 161,
                "isteCampaign": false
            },
            {
                "eventName": "",
                "storeName": "Yorkdale Shopping Center",
                "lat": "43.7254255",
                "lng": "-79.4542951",
                "address": "Unit 305, 3401 Dufferin Street",
                "city": "Toronto",
                "state": "ON",
                "header": "Free educator training",
                "bodyCopy": "Stop by and learn more about our education products and solutions. Contact your local Microsoft store for a field trip or personal training.",
                "ctaLink": "https://www.microsoft.com/en-us/store/locations/on/toronto/yorkdale-shopping-centre/store-32#bookappointmentid=5||Thank%20you%20for%20connecting%20with%20our%20local%20education%20experts.%20We%20are%20excited%20to%20offer%20you%20a%20complimentary%201:1%20training%20session%20on%20Teams%20as%20collaboration%20tools%20for%20the%20classroom.%20Please%20follow%20the%20prompts%20to%20schedule%20your%20appointment%20and%20email%20mrs0032CDS@microsoft.com%20with%20any%20additional%20questions",
                "radialDistance": 161,
                "isteCampaign": false
            }
        ];
        function Init(selector) {
            if (!Cookies.get('geoAdCookie')) {
                if (!navigator.geolocation) {
                    console.log("Geolocation is not available on your browser");
                }
                else {
                    navigator.geolocation.getCurrentPosition(success, error);
                }
            }
            function success(position) {
                var userLatitude = position.coords.latitude;
                var userLongitude = position.coords.longitude;
                if (userLatitude !== null || userLongitude !== null) {
                    for (var i = 0; i < ukInformationData.length; i++) {
                        if (RadialDistanceOfLocations(userLatitude, userLongitude, ukInformationData[i].lat, ukInformationData[i].lng, "K") <=
                            ukInformationData[i].radialDistance) {
                            $(selector).fadeIn(500);
                        }
                    }
                }
            }
            function error() {
                console.log("Unable to retrieve location");
            }
        }
        GeoTargeting.Init = Init;
        function RadialDistanceOfLocations(lat1, lon1, lat2, lon2, unit) {
            var radlat1 = Math.PI * lat1 / 180, radlat2 = Math.PI * lat2 / 180, theta = lon1 - lon2, radtheta = Math.PI * theta / 180, dist = Math.sin(radlat1) * Math.sin(radlat2) +
                Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit == "K") {
                dist = dist * 1.609344;
            }
            if (unit == "N") {
                dist = dist * 0.8684;
            }
            return dist;
        }
        function ApplyCookieEntry(selector) {
            Cookies.set('geoAdCookie', 'adseen', { expires: 30 });
            $(selector).fadeOut(500);
        }
        GeoTargeting.ApplyCookieEntry = ApplyCookieEntry;
    })(GeoTargeting = Cortex.GeoTargeting || (Cortex.GeoTargeting = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var HighContrastTools;
    (function (HighContrastTools) {
        function GetContrastMode() {
            var objDiv, strColor;
            objDiv = document.createElement('div');
            objDiv.style.color = 'rgb(31, 41, 59)';
            document.body.appendChild(objDiv);
            strColor = document.defaultView ? document.defaultView.getComputedStyle(objDiv, null).color : objDiv.currentStyle.color;
            strColor = strColor.replace(/ /g, '');
            document.body.removeChild(objDiv);
            switch (strColor) {
                case 'rgb(31,41,59)': return 'none';
                case 'rgb(255,255,255)': return 'black';
                case 'rgb(0,0,0)': return 'white';
            }
        }
        HighContrastTools.GetContrastMode = GetContrastMode;
    })(HighContrastTools = Cortex.HighContrastTools || (Cortex.HighContrastTools = {}));
})(Cortex || (Cortex = {}));
var ConsentState;
(function (ConsentState) {
    ConsentState[ConsentState["noInput"] = 0] = "noInput";
    ConsentState[ConsentState["InputFalse"] = 1] = "InputFalse";
    ConsentState[ConsentState["InputTrue"] = 2] = "InputTrue";
})(ConsentState || (ConsentState = {}));
var list = {
    AE: ConsentState.InputFalse,
    AM: ConsentState.InputFalse,
    AO: ConsentState.InputFalse,
    AR: ConsentState.InputFalse,
    AT: ConsentState.InputFalse,
    AU: ConsentState.InputFalse,
    AZ: ConsentState.InputFalse,
    BE: ConsentState.InputFalse,
    BF: ConsentState.InputFalse,
    BG: ConsentState.InputFalse,
    BH: ConsentState.noInput,
    BI: ConsentState.noInput,
    BJ: ConsentState.InputFalse,
    BO: ConsentState.noInput,
    BR: ConsentState.noInput,
    CA: ConsentState.InputFalse,
    CD: ConsentState.noInput,
    CF: ConsentState.noInput,
    CG: ConsentState.InputTrue,
    CH: ConsentState.InputFalse,
    CI: ConsentState.noInput,
    CL: ConsentState.InputTrue,
    CM: ConsentState.noInput,
    CN: ConsentState.InputFalse,
    CO: ConsentState.InputFalse,
    CR: ConsentState.InputFalse,
    CV: ConsentState.InputFalse,
    CY: ConsentState.InputFalse,
    CZ: ConsentState.InputTrue,
    DE: ConsentState.InputFalse,
    DK: ConsentState.InputFalse,
    DO: ConsentState.noInput,
    DZ: ConsentState.InputTrue,
    EC: ConsentState.noInput,
    EE: ConsentState.InputFalse,
    EG: ConsentState.InputTrue,
    ER: ConsentState.noInput,
    ES: ConsentState.InputFalse,
    ET: ConsentState.InputTrue,
    FI: ConsentState.InputFalse,
    FR: ConsentState.InputFalse,
    GA: ConsentState.noInput,
    GB: ConsentState.InputFalse,
    GE: ConsentState.InputFalse,
    GH: ConsentState.InputFalse,
    GM: ConsentState.noInput,
    GN: ConsentState.noInput,
    GQ: ConsentState.noInput,
    GR: ConsentState.InputFalse,
    GT: ConsentState.InputTrue,
    HK: ConsentState.InputTrue,
    HN: ConsentState.noInput,
    HR: ConsentState.InputFalse,
    HU: ConsentState.InputFalse,
    ID: ConsentState.InputTrue,
    IE: ConsentState.InputFalse,
    IL: ConsentState.InputFalse,
    IN: ConsentState.noInput,
    IQ: ConsentState.InputTrue,
    IR: ConsentState.InputTrue,
    IS: ConsentState.InputFalse,
    IT: ConsentState.InputFalse,
    JM: ConsentState.noInput,
    JO: ConsentState.InputTrue,
    JP: ConsentState.InputTrue,
    KE: ConsentState.InputFalse,
    KR: ConsentState.InputFalse,
    KW: ConsentState.InputFalse,
    KZ: ConsentState.InputFalse,
    LB: ConsentState.InputTrue,
    LI: ConsentState.InputFalse,
    LK: ConsentState.InputTrue,
    LR: ConsentState.InputTrue,
    LS: ConsentState.noInput,
    LT: ConsentState.InputFalse,
    LU: ConsentState.InputFalse,
    LV: ConsentState.InputFalse,
    LY: ConsentState.noInput,
    MA: ConsentState.InputFalse,
    MC: ConsentState.InputFalse,
    MG: ConsentState.InputFalse,
    MK: ConsentState.InputTrue,
    ML: ConsentState.noInput,
    MO: ConsentState.noInput,
    MR: ConsentState.noInput,
    MT: ConsentState.InputFalse,
    MU: ConsentState.InputFalse,
    MW: ConsentState.noInput,
    MX: ConsentState.InputTrue,
    MY: ConsentState.InputFalse,
    MZ: ConsentState.InputFalse,
    NA: ConsentState.InputTrue,
    NE: ConsentState.noInput,
    NG: ConsentState.InputTrue,
    NL: ConsentState.InputFalse,
    NO: ConsentState.InputFalse,
    NP: ConsentState.InputTrue,
    NZ: ConsentState.InputFalse,
    OM: ConsentState.noInput,
    PA: ConsentState.InputTrue,
    PE: ConsentState.InputFalse,
    PH: ConsentState.InputFalse,
    PK: ConsentState.InputFalse,
    PL: ConsentState.InputFalse,
    PT: ConsentState.InputFalse,
    PY: ConsentState.noInput,
    QA: ConsentState.noInput,
    RO: ConsentState.InputFalse,
    RS: ConsentState.InputFalse,
    RU: ConsentState.InputFalse,
    RW: ConsentState.noInput,
    SA: ConsentState.InputFalse,
    SC: ConsentState.noInput,
    SD: ConsentState.noInput,
    SE: ConsentState.InputFalse,
    SG: ConsentState.InputFalse,
    SI: ConsentState.InputFalse,
    SK: ConsentState.InputFalse,
    SN: ConsentState.InputTrue,
    ST: ConsentState.InputFalse,
    SV: ConsentState.noInput,
    SY: ConsentState.noInput,
    SZ: ConsentState.InputTrue,
    TD: ConsentState.noInput,
    TG: ConsentState.noInput,
    TH: ConsentState.InputTrue,
    TM: ConsentState.InputFalse,
    TN: ConsentState.InputFalse,
    TR: ConsentState.InputFalse,
    TT: ConsentState.noInput,
    TW: ConsentState.InputFalse,
    TZ: ConsentState.noInput,
    UA: ConsentState.InputFalse,
    UG: ConsentState.noInput,
    US: ConsentState.noInput,
    UY: ConsentState.InputFalse,
    VE: ConsentState.InputFalse,
    VN: ConsentState.InputFalse,
    YE: ConsentState.noInput,
    ZA: ConsentState.InputTrue,
    ZM: ConsentState.noInput,
    ZW: ConsentState.noInput,
};
var itdmTemplate = function (templateState) {
    var checkedState = templateState === ConsentState.InputTrue;
    var $input = templateState === ConsentState.noInput
        ? ''
        : "<input\n\t\t\t\t\tid=\"consent\"\n\t\t\t\t\taria-checked=\"" + checkedState + "\"\n\t\t\t\t\trequired\n\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t" + (checkedState ? "checked=\"\"" : '') + "\n      >";
    var $notice = templateState === ConsentState.noInput
        ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI will receive the Microsoft 365 Education Newsletter for IT pros.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\" rel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>"
        :
            $('#country-selector option:selected').val() === 'CA'
                ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like Microsoft and its family of companies to send me the Microsoft 365 Education Newsletter for IT pros by email. To withdraw consent or manage your preferences, visit the\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?linkid=243189\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c0155 c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPromotional Communications Manager.\n\t\t\t\t</a>\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>"
                :
                    $('#country-selector option:selected').val() === 'KR'
                        ? "\n\t\t\t<span aria-hidden=\"true\">I agree to receiving marketing information and use of my personal information for marketing purposes (required): </br></br><ul style=\"list-style-type: disc; margin-left:40px;\"><li><b style=\"font-size:120%;\">Consent to Receive Marketing:</b> The information collected may be used for Microsoft to send you information, tips, and offers about the Microsoft 365 Education Newsletter for IT pros.</li><li>Items of Personal Information to be Collected: First Name, Last Name, Email Address, Phone Number, Company name and size, Job Title, Country/Region of residence, and any other fields visible on this form.</li><li>Purpose of Collection and Use: <b style=\"font-size:120%;\">To contact you for marketing purposes</b></li><li>Retention/Use Period of Personal Information: <b style=\"font-size:120%;\">As long as needed to provide the service(s) you are requesting</b></li></ul></br> You have the right to refuse the collection and use of personal information for marketing purposes, and receiving marketing information as set forth above. However, if you refuse, you may not be able to receive the benefits described under Purpose of Collection & Use. <a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\" class=\"c-hyperlink margin-right-0\" style=\"display: inline;\">Privacy Statement.</a></span>"
                        :
                            $('#country-selector option:selected').val() === 'CN'
                                ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like to receive the Microsoft 365 Education Newsletter for IT pros.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t\n\t\t\t\tParticipation requires transferring your personal data to other countries in which Microsoft operates, including the United States. By submitting this form, you agree to the transfer of your data outside of China.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">Privacy Statement.</a>\n\t\t\t</span>"
                                : "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like to receive the Microsoft 365 Education Newsletter for IT pros.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\" rel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>";
    return "\n\t\t<div class=\"c-checkbox margin-bottom-12\">\n\t\t\t<label for=\"consent\" class=\"c-label\">\n\t\t\t\t" + $input + $notice + "\n\t\t\t</label>\n\t\t</div>";
};
var educatorTemplate = function (templateState) {
    var checkedState = templateState === ConsentState.InputTrue;
    var $input = templateState === ConsentState.noInput
        ? ''
        : "<input\n\t\t\t\t\tid=\"consent\"\n\t\t\t\t\taria-checked=\"" + checkedState + "\"\n\t\t\t\t\trequired\n\t\t\t\t\ttype=\"checkbox\"\n\t\t\t\t\t" + (checkedState ? "checked=\"\"" : '') + "\n      >";
    var $notice = templateState === ConsentState.noInput
        ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI will receive the Microsoft Educator Newsletter.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\" rel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>"
        :
            $('#country-selector option:selected').val() === 'CA'
                ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like Microsoft and its family of companies to send me the Microsoft Educator Newsletter by email. To withdraw consent or manage your preferences, visit the\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?linkid=243189\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c0155 c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPromotional Communications Manager.\n\t\t\t\t</a>\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>"
                :
                    $('#country-selector option:selected').val() === 'KR'
                        ? "\n\t\t\t<span aria-hidden=\"true\">I agree to receiving marketing information and use of my personal information for marketing purposes (required): </br></br><ul style=\"list-style-type: disc; margin-left:40px;\"><li><b style=\"font-size:120%;\">Consent to Receive Marketing:</b> The information collected may be used for Microsoft to send you information, tips, and offers about the Microsoft Educator Newsletter.</li><li>Items of Personal Information to be Collected: First Name, Last Name, Email Address, Phone Number, Company name and size, Job Title, Country/Region of residence, and any other fields visible on this form.</li><li>Purpose of Collection and Use: <b style=\"font-size:120%;\">To contact you for marketing purposes</b></li><li>Retention/Use Period of Personal Information: <b style=\"font-size:120%;\">As long as needed to provide the service(s) you are requesting</b></li></ul></br> You have the right to refuse the collection and use of personal information for marketing purposes, and receiving marketing information as set forth above. However, if you refuse, you may not be able to receive the benefits described under Purpose of Collection & Use. <a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\" class=\"c-hyperlink margin-right-0\" style=\"display: inline;\">Privacy Statement.</a></span>"
                        :
                            $('#country-selector option:selected').val() === 'CN'
                                ? "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like to receive the Microsoft Educator Newsletter.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t\n\t\t\t\tParticipation requires transferring your personal data to other countries in which Microsoft operates, including the United States. By submitting this form, you agree to the transfer of your data outside of China.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\"\n\t\t\t\t\trel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">Privacy Statement.</a>\n\t\t\t</span>"
                                : "\n\t\t\t<span aria-hidden=\"true\">\n\t\t\t\tI would like to receive the Microsoft Educator Newsletter.\n\t\t\t\t<a\n\t\t\t\t\thref=\"https://go.microsoft.com/fwlink/?LinkId=521839\"\n\t\t\t\t\ttarget=\"_blank\" rel=\"noopener\"\n\t\t\t\t\tclass=\"c-hyperlink margin-right-0\"\n\t\t\t\t\tstyle=\"display: inline;\">\n\t\t\t\t\tPrivacy Statement.\n\t\t\t\t</a>\n\t\t\t</span>";
    return "\n\t\t<div class=\"c-checkbox margin-bottom-12\">\n\t\t\t<label for=\"consent\" class=\"c-label\">\n\t\t\t\t" + $input + $notice + "\n\t\t\t</label>\n\t\t</div>";
};
var Cortex;
(function (Cortex) {
    var NewsletterSignup;
    (function (NewsletterSignup) {
        function validateFormSubmit(form) {
            var e = document.getElementById('country-selector');
            var strCountry = e.value;
            var checked = $('#consent').is(':checked');
            var OptType = list[$('#country-selector option:selected').val()];
            var optTypePayload = 0;
            if (OptType === ConsentState.noInput) {
                optTypePayload = 1;
            }
            if (checked === true && OptType !== ConsentState.noInput) {
                Cortex.CpmApi.CpmEmailAjax(form.email.value, strCountry, optTypePayload);
                return false;
            }
            else if (checked === false && OptType === ConsentState.noInput) {
                Cortex.CpmApi.CpmEmailAjax(form.email.value, strCountry, optTypePayload);
                return false;
            }
            else {
                alert('Please check the checkbox to proceed and click "Sign Up" again');
                return false;
            }
        }
        NewsletterSignup.validateFormSubmit = validateFormSubmit;
        function initializePopup() {
            var hasCssChat = document.querySelector('.liveChatScript') !== null;
            var cookie = Cortex.Components.Cookies.GetCookie('newsletterPopUp');
            var hasSeenPopUp = cookie !== null && cookie.length !== 0;
            if (hasCssChat || hasSeenPopUp) {
                return;
            }
            var $newsletterPopup = $('.newsletter-pop-up');
            if ($newsletterPopup.length > 0) {
                $(document.body).addClass('modal-open');
                $newsletterPopup.removeClass('display-none');
                $('button.close').on('click', function () {
                    $newsletterPopup.hide();
                    $(document.body).removeClass('modal-open');
                    Cortex.Components.Cookies.CreateCookie('newsletterPopUp', 'popUpSeen', 183);
                });
                $('.store-cta').on('click', function () {
                    Cortex.Components.Cookies.CreateCookie('newsletterPopUp', 'popUpSeen', 183);
                });
            }
        }
        NewsletterSignup.initializePopup = initializePopup;
        function Init() {
            if ($('.newsletter-2up').length) {
                $('.newsletter-2up #country-selector').find('option:eq(1)').prop('selected', true);
                $('.newsletter-2up #email').val('');
                var $countrySelector = document.querySelector('select[data-auto-id="country-selector"]');
                var $privacyConsent_1 = document.querySelector('.c0147');
                $countrySelector.addEventListener('change', function (e) {
                    var value = e.currentTarget.value;
                    var localeState = list[value];
                    var innerHTML = isItdmPage ? itdmTemplate(localeState) : educatorTemplate(localeState);
                    $privacyConsent_1.innerHTML = innerHTML;
                });
            }
        }
        NewsletterSignup.Init = Init;
    })(NewsletterSignup = Cortex.NewsletterSignup || (Cortex.NewsletterSignup = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var Parallax;
    (function (Parallax) {
        function Init() {
            if ($('.m-parallax').length) {
                $('.parallax-content-item').unwrap();
                ParallaxScroll();
            }
        }
        Parallax.Init = Init;
        function ParallaxScroll() {
            $(document).ready(function () {
                var windowTop;
                var componentTop = $(".m-parallax").offset().top;
                var parallaxBackgroundElement = $(".c-parallax-background");
                $(window).on("load scroll", function () {
                    window.requestAnimationFrame(function () {
                        windowTop = $(window).scrollTop();
                        parallaxBackgroundElement.css({
                            transform: "translate3d(-50%," + (-componentTop + windowTop) + "px, 0px)"
                        });
                    });
                });
            });
        }
        Parallax.ParallaxScroll = ParallaxScroll;
    })(Parallax = Cortex.Parallax || (Cortex.Parallax = {}));
})(Cortex || (Cortex = {}));
var Direction;
(function (Direction) {
    Direction["LTR"] = "ltr";
    Direction["RTL"] = "rtl";
})(Direction || (Direction = {}));
var PivotMultiFeatureCarousel = (function () {
    function PivotMultiFeatureCarousel($parent) {
        var _this = this;
        this.currentIndex = 0;
        this.getElem = function (selector) {
            var $elems = _this.$parent.querySelectorAll(selector);
            return Array.prototype.slice.call($elems, 0);
        };
        this.prev = function () {
            return _this.currentIndex === 0 ? _this.maxItems : _this.currentIndex - 1;
        };
        this.next = function () {
            return _this.currentIndex !== _this.maxItems ? _this.currentIndex + 1 : 0;
        };
        this.$parent = $parent;
        this.$carousel = this.$parent.querySelector('.c-carousel > div > ul');
        this.$slides = this.getElem('.c-carousel > div > ul > li');
        this.$tabs = this.getElem('.c-pivot li[role="tab"]');
        this.maxItems = this.$tabs.length - 1;
        this.direction = document.documentElement.getAttribute('dir');
        var $prev = this.$parent.querySelector('.c-flipper.f-previous');
        var $next = this.$parent.querySelector('.c-flipper.f-next');
        var initialHash = window.location.hash.replace('#', '');
        var index = (initialHash !== "")
            ? this.$tabs.findIndex(function (x) { return x.id === initialHash; })
            : 1;
        this.currentIndex = index !== -1 ? index : 1;
        var $target = this.$tabs[index];
        $(window).on('load', function () {
            setTimeout(function () {
                if (window.location.hash) {
                    $target.click();
                    $target.scrollIntoView({ behavior: 'smooth' });
                }
                else {
                    $target.click();
                    $(window).scrollTop(0);
                    history.pushState({}, '', ' ');
                }
            }, 500);
        });
        $prev.addEventListener('click', function () {
            _this.currentIndex = _this.prev();
            _this.changeSlide();
            _this.updateHash();
        });
        $next.addEventListener('click', function () {
            _this.currentIndex = _this.next();
            _this.changeSlide();
            _this.updateHash();
        });
        this.$tabs.forEach(function ($tab, index) {
            $tab.addEventListener('click', function () {
                _this.currentIndex = index;
                _this.changeSlide();
                _this.updateHash();
            });
            $tab.addEventListener('keydown', function (e) {
                switch (e.keyCode) {
                    case 37:
                        _this.currentIndex = _this.prev();
                        _this.changeSlide();
                        _this.updateHash();
                        break;
                    case 39:
                        _this.currentIndex = _this.next();
                        _this.changeSlide();
                        _this.updateHash();
                        break;
                    default:
                        break;
                }
            });
        });
        window.addEventListener('resize', function () { return _this.changeSlide(); });
    }
    PivotMultiFeatureCarousel.prototype.updateHash = function () {
        var id = '#' + this.$tabs[this.currentIndex].id;
        history.pushState({}, '', id);
    };
    PivotMultiFeatureCarousel.prototype.changeSlide = function () {
        var slideWidth = this.$slides[0].clientWidth;
        var previousSlides = slideWidth * this.currentIndex;
        var halfSlideWidth = slideWidth / 2;
        var singleSlideMarginRight = parseInt($(this.$slides[0]).css('marginRight').replace('px', ''));
        var origin = halfSlideWidth - singleSlideMarginRight;
        var allPreviousSlideMargins = singleSlideMarginRight * this.currentIndex;
        var margin = origin - (previousSlides + allPreviousSlideMargins);
        switch (this.direction) {
            case Direction.RTL:
                this.$carousel.style.marginRight = "".concat(margin, "px");
                break;
            case Direction.LTR:
            default:
                this.$carousel.style.marginLeft = "".concat(margin, "px");
                break;
        }
        $(document).ready(function () {
            document.querySelectorAll('.custom-pivot-multi-feature ul li').forEach(function (el) {
                el.setAttribute('tabindex', '-1');
            });
            document.querySelector('.custom-pivot-multi-feature ul .f-active').setAttribute('tabindex', '0');
        });
    };
    return PivotMultiFeatureCarousel;
}());
var Cortex;
(function (Cortex) {
    var Components;
    (function (Components) {
        var PivotMultiFeature;
        (function (PivotMultiFeature) {
            function Init() {
                var $carousels = document.querySelectorAll('.custom-pivot-multi-feature');
                $carousels.forEach(function ($carousel) { return new PivotMultiFeatureCarousel($carousel); });
            }
            PivotMultiFeature.Init = Init;
        })(PivotMultiFeature = Components.PivotMultiFeature || (Components.PivotMultiFeature = {}));
    })(Components = Cortex.Components || (Cortex.Components = {}));
})(Cortex || (Cortex = {}));
function unwrap(el) {
    var parent = el.parentNode;
    while (el.firstChild)
        parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
}
if (typeof Object.assign != 'function') {
    Object.assign = function (target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}
var StealthCarousel = (function () {
    function StealthCarousel($carousel) {
        var _this = this;
        this.currentIndex = 0;
        this.getElem = function (selector) {
            var $elems = _this.$carousel.querySelectorAll(selector);
            return Array.prototype.slice.call($elems, 0);
        };
        this.handleCarousels = function () {
            _this.updateControls();
            _this.changeSlide(_this.$leftCarousel, _this.prev());
            _this.changeSlide(_this.$centerCarousel, _this.currentIndex);
            _this.changeSlide(_this.$rightCarousel, _this.next());
        };
        this.prev = function () {
            return _this.currentIndex === 0 ? _this.maxItems : _this.currentIndex - 1;
        };
        this.next = function () {
            return _this.currentIndex !== _this.maxItems ? _this.currentIndex + 1 : 0;
        };
        this.$carousel = $carousel;
        this.$centerCarousel = this.getElem(".center-carousel .stealth-sub-carousel-panel");
        this.$leftCarousel = this.getElem(".left-carousel .stealth-sub-carousel-panel");
        this.$rightCarousel = this.getElem(".right-carousel .stealth-sub-carousel-panel");
        this.maxItems = this.$centerCarousel.length - 1;
        this.handleInitialSetup();
        this.setHeight();
        window.addEventListener('resize', function () { return _this.setHeight(); });
    }
    StealthCarousel.prototype.handleInitialSetup = function () {
        var _this = this;
        console.log('setup controls');
        this.$prev = this.$carousel.querySelector('.stealth-carousel-previous');
        this.$next = this.$carousel.querySelector('.stealth-carousel-next');
        var addClassesToPanels = function (panel, index) {
            return panel.classList.add("stealth-panel-".concat(index + 1));
        };
        this.$centerCarousel.forEach(addClassesToPanels);
        this.$leftCarousel.forEach(addClassesToPanels);
        this.$rightCarousel.forEach(addClassesToPanels);
        var $controls = this.$carousel.querySelector('.stealth-carousel-controls');
        var $center = this.$carousel.querySelector('.center-carousel');
        var $target = $center.querySelector('.stealth-panel-2');
        $center.insertBefore($controls, $target);
        if ($controls !== null) {
            unwrap($controls);
        }
        this.$next.addEventListener('click', function () {
            _this.currentIndex = _this.next();
            _this.handleCarousels();
        });
        this.$prev.addEventListener('click', function () {
            _this.currentIndex = _this.prev();
            _this.handleCarousels();
        });
        this.handleCarousels();
    };
    StealthCarousel.prototype.changeSlide = function ($panels, index) {
        var fadeInStyles = {
            animation: '0.75s linear 0s 1 normal none running panelFadeIn',
            opacity: 1,
            'z-index': 12,
        };
        var fadeOutStyles = {
            animation: '0.75s linear 0s 1 normal none running panelFadeOut',
            opacity: 0,
            'z-index': -1,
        };
        $panels.forEach(function ($panel) {
            $panel.classList.remove('active');
            $panel.setAttribute('aria-hidden', 'true');
            Object.assign($panel.style, fadeOutStyles);
        });
        var $currentSlide = $panels[index];
        $currentSlide.classList.add('active');
        $currentSlide.setAttribute('aria-hidden', 'false');
        Object.assign($currentSlide.style, fadeInStyles);
    };
    StealthCarousel.prototype.updateControls = function () {
        var prevAria = "View previous slide - ".concat(this.prev() + 1, " of ").concat(this.maxItems + 1);
        var nextAria = "View next slide - ".concat(this.next() + 1, " of ").concat(this.maxItems + 1);
        this.$prev.setAttribute('aria-label', prevAria);
        this.$next.setAttribute('aria-label', nextAria);
    };
    StealthCarousel.prototype.setHeight = function () {
        var $fullList = __spreadArray(__spreadArray(__spreadArray([], this.$leftCarousel, true), this.$centerCarousel, true), this.$rightCarousel, true);
        $fullList.forEach(function ($item) {
            var $panel = $item.querySelector('.panel-content');
            $panel.style.height = null;
        });
        var maxHeight = $fullList.reduce(function (curr, $panel) {
            var height = $panel.querySelector('.panel-content').clientHeight;
            return height > curr ? height : curr;
        }, 0);
        $fullList.forEach(function ($panel) {
            return ($panel.querySelector('.panel-content').style.height = "".concat(maxHeight, "px"));
        });
    };
    return StealthCarousel;
}());
var Cortex;
(function (Cortex) {
    var Components;
    (function (Components) {
        var SneakCarousel;
        (function (SneakCarousel) {
            function Init() {
                var $carousels = document.querySelectorAll('.sneak-carousel');
                $carousels.forEach(function ($carousel) { return new StealthCarousel($carousel); });
            }
            SneakCarousel.Init = Init;
        })(SneakCarousel = Components.SneakCarousel || (Components.SneakCarousel = {}));
    })(Components = Cortex.Components || (Cortex.Components = {}));
})(Cortex || (Cortex = {}));
var Gallery = (function () {
    function Gallery($gallery) {
        var _this = this;
        this.currentIndex = 0;
        this.buttonClickEvent = function (e) {
            e.preventDefault();
            var $target = e.currentTarget;
            var index = parseInt($target.getAttribute('data-idx'));
            if (_this.currentIndex === index) {
                return;
            }
            _this.setSlide(index);
            var scrollOption = { behavior: 'smooth', block: 'start', inline: 'nearest' };
            $target.classList.add('focus-on');
            $target.addEventListener('blur', function () {
                $target.classList.remove('focus-on');
            }, { once: true });
            _this.$images[index].scrollIntoView(scrollOption);
        };
        this.$gallery = $gallery;
        this.$listItems = this.$gallery.querySelectorAll('.sa-list-item');
        this.$content = this.$gallery.querySelectorAll('.sa-subcontent');
        this.$buttons = this.$gallery.querySelectorAll('.sa-heading');
        this.$selectionBarPos = this.$gallery.querySelector('.selection-bar__position');
        this.$selectionBarHeight = this.$gallery.querySelector('.selection-bar__position__area');
        this.initialDOMSetup();
    }
    Gallery.prototype.initialDOMSetup = function () {
        var _this = this;
        var $leftContent = this.$gallery.querySelector('.content-container');
        var $images = this.$gallery.querySelectorAll('.sa-image');
        $images.forEach(function ($image) { return _this.$gallery.insertBefore($image, $leftContent.nextSibling); });
        this.$images = $images;
        this.$buttons.forEach(function ($button) { return $button.addEventListener('click', _this.buttonClickEvent); });
        this.$listContainer = this.$gallery.querySelector('.content-container');
        var addIndex = function ($ele, index) {
            return $ele.setAttribute('data-idx', index.toString());
        };
        this.$buttons.forEach(addIndex);
        this.$images.forEach(addIndex);
        this.handleDimensions();
        this.setSlide(this.currentIndex);
        var handleVideos = function ($image, index) {
            var $video = $image.querySelector('div[data-oneplayerid]');
            if ($video === null) {
                return;
            }
            var videoId = $video.getAttribute('data-oneplayerid');
            var resizeHandler = function () { return Cortex.Components.OnePlayer.ResizeVideo(videoId); };
            var resizeObserver = new ResizeObserver(resizeHandler);
            resizeObserver.observe(_this.$gallery);
            var $link = _this.$listItems[index];
            $link.addEventListener('click', resizeHandler, { once: true });
        };
        this.$images.forEach(handleVideos);
        Cortex.Components.OnePlayer.InitPlayer();
    };
    Gallery.prototype.setSlide = function (index) {
        var _this = this;
        this.$images.forEach(function (_, idx) { return _this.handleButtonState(idx, index === idx); });
        this.currentIndex = index;
        this.handleSelectionBar();
        this.handleSlideState(index);
    };
    Gallery.prototype.handleButtonState = function (idx, state) {
        var $button = this.$buttons[idx];
        var $content = this.$content[idx];
        $button.setAttribute('aria-pressed', "".concat(state));
        if (state) {
            $button.classList.add('active');
            $content.classList.add('subcontent-expand');
            $content.style.height = null;
            $content.classList.add('on-focus');
            $content.classList.remove('off-focus');
        }
        else {
            $button.classList.remove('active');
            $content.classList.remove('subcontent-expand');
            $content.style.height = '0';
            $content.classList.add('off-focus');
            $content.classList.remove('on-focus');
        }
    };
    Gallery.prototype.handleSelectionBar = function () {
        var $target = this.$listItems[this.currentIndex];
        var selectionTop = $target.offsetTop;
        var selectionHeight = $target.clientHeight;
        this.$selectionBarPos.style.top = "".concat(selectionTop, "px");
        this.$selectionBarHeight.style.height = "".concat(selectionHeight, "px");
    };
    Gallery.prototype.handleSlideState = function (index) {
        var slideState = function ($panel, state) {
            state ? $panel.classList.remove('hidden') : $panel.classList.add('hidden');
            $panel.setAttribute('aria-hidden', "".concat(!state));
            $panel.setAttribute('data-current', "".concat(state));
            $panel.setAttribute('selected', "".concat(state));
        };
        this.$images.forEach(function ($panel, idx) {
            return slideState($panel, index === idx);
        });
    };
    Gallery.prototype.handleDimensions = function () {
        var resizeObserver = new ResizeObserver(this.handleSelectionBar);
        resizeObserver.observe(this.$listContainer);
    };
    return Gallery;
}());
var Cortex;
(function (Cortex) {
    var Components;
    (function (Components) {
        var SuperAccordion;
        (function (SuperAccordion) {
            function Init() {
                var $accordion = document.querySelectorAll('.super-accordion');
                $accordion.forEach(function ($accordion) { return new Gallery($accordion); });
            }
            SuperAccordion.Init = Init;
        })(SuperAccordion = Components.SuperAccordion || (Components.SuperAccordion = {}));
    })(Components = Cortex.Components || (Cortex.Components = {}));
})(Cortex || (Cortex = {}));
var Cortex;
(function (Cortex) {
    var Utilities;
    (function (Utilities) {
        function getKeyCode(e) {
            var key = e.which || e.keyCode || e.key || 0;
            return key;
        }
        Utilities.getKeyCode = getKeyCode;
        function elementSelected(e) {
            if (e.type === 'click') {
                return true;
            }
            if (e.type === 'keyup') {
                if (Cortex.Utilities.getKeyCode(e) === $.ui.keyCode.ENTER) {
                    return true;
                }
            }
            return false;
        }
        Utilities.elementSelected = elementSelected;
    })(Utilities = Cortex.Utilities || (Cortex.Utilities = {}));
})(Cortex || (Cortex = {}));
