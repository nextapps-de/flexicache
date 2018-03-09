/**!
 * FlexiCache - Flexible Cache Controller
 * ----------------------------------------------------------
 * @preserve https://github.com/nextapps-de/flexicache
 * @version: 0.1.13
 * @author: Thomas Wilkerling
 * @license: Apache 2.0 Licence
 */

;(function(){

    provide('FlexiCache', (function(clone, queue){

        "use strict";

        /**
         * @type {Array<?FlexiCache>}
         */

        var caches = [];

        /**
         * @type {number}
         */

        var cache_id = 0;

        /**
         * @type {number}
         * @const
         */

        var CONFIG_MAX_CACHE_TIME = 3 * 60 * 1000;

        /**
         * @constructor
         * @param {!*} data
         * @param {!boolean|number} duration
         * @const
         */

        function CacheItem(data, duration){

            /** @type {*} */
            this.data = data;

            /** @type {!number} */
            this.time = time();

            /** @type {!boolean|number} */
            this.expire = (typeof duration === 'number') && (this.time + duration);

            /** @type {number} */
            this.count = 0;
        }

        /**
         * @return {*}
         * @export
         */

        CacheItem.prototype.clone = function(){

            this.count++;

            return clone(this.data);
        };

        /**
         * @param {boolean|number=} max_duration
         * @param {boolean|number=} max_length
         * @param {boolean=} enable_auto_cleanup
         * @constructor
         * @private
         * @const
         */

        function FlexiCache(max_duration, max_length, enable_auto_cleanup){

            /** @type {!number} */
            this.id = cache_id++;

            /** @type {boolean} */
            this.debug = false;

            /** @type {Console} */
            this.console = console;

            /** @type {?Array<string>} */
            this.keys = [];

            /** @dict @private */
            this.data = {};

            /** @type {boolean|number} @export */
            this.duration = max_duration === false ? false : (max_duration || CONFIG_MAX_CACHE_TIME);

            /** @type {boolean|number} @export */
            this.size = max_length === false ? false : (max_length || 1000);

            /** @type {boolean} @export */
            this.auto = !!enable_auto_cleanup;

            /** @type {boolean} @export */
            this.async = false;

            /** @type {boolean} */
            this.init = false;

            Object.defineProperty(this, 'length', {

                /**
                 * @this {FlexiCache}
                 */

                get: function(){

                    return this.keys.length;
                }
            });

            if(this.debug){

                /** @struct */

                this.stats = {

                    count_cache_update: 0,
                    count_cache_get: 0,
                    count_cache_set: 0,
                    count_cache_clone: 0,
                    count_cache_del: 0,
                    count_cache_clean: 0
                };

                this.console.log("Initialize Cache@" + this.id);

                caches[caches.length] = this;
            }
        }

        /**
         * @param {boolean|number=} max_duration
         * @param {boolean|number=} max_length
         * @param {boolean=} enable_auto_cleanup
         * @this {FlexiCache}
         * @export
         */

        FlexiCache.register = function(max_duration, max_length, enable_auto_cleanup){

            return new FlexiCache(max_duration, max_length, enable_auto_cleanup);
        };

        /**
         * @param {boolean|number=} max_duration
         * @param {boolean|number=} max_length
         * @param {boolean=} enable_auto_cleanup
         * @this {FlexiCache}
         * @export
         */

        FlexiCache.create = function(max_duration, max_length, enable_auto_cleanup){

            return FlexiCache.register(max_duration, max_length, enable_auto_cleanup);
        };

        /**
         * @param {boolean|number=} max_duration
         * @param {boolean|number=} max_length
         * @param {boolean=} enable_auto_cleanup
         * @this {FlexiCache}
         * @export
         */

        FlexiCache.new = function(max_duration, max_length, enable_auto_cleanup){

            return FlexiCache.register(max_duration, max_length, enable_auto_cleanup);
        };

        /**
         * @param {string|number} key
         * @param {!*} val
         * @param {boolean|number=} duration
         * @export
         */

        FlexiCache.prototype.set = function(key, val, duration){

            return this.add(key, val, duration);
        };

        /**
         * @param {string|number} key
         * @param {!*} val
         * @param {boolean|number=} duration
         * @this {FlexiCache}
         * @export
         */

        FlexiCache.prototype.add = function(key, val, duration){

            if(key = ('' + key)){

                var cache = this.data[key];

                if(!cache){

                    if(this.debug){

                        this.console.log("Set Cache@" + this.id + " to: " + key);
                        this.stats.count_cache_update++;
                    }

                    var pos = this.keys.length;

                    if(this.size && (pos >= this.size)){

                        this.del(this.keys[0]);
                        pos--;
                    }

                    this.data[key] = (

                        new CacheItem(val,

                            duration === false ?

                                false
                            :
                                (duration || this.duration)
                        )
                    );

                    this.keys[pos] = key;
                }
                else{

                    if(this.debug){

                        this.console.log("Update Cache@" + this.id + " to: " + key);
                        this.stats.count_cache_set++;
                    }

                    cache.data = val;
                    cache.time = time();
                    cache.expire = cache.time + /** @type {number} */ (duration || this.duration || 0);
                    //cache.count = 0;
                }

                if(!this.init){

                    registerScheduler.call(this);

                    this.init = true;
                }

                return val;
            }
        };

        /**
         * @param {string|number} key
         * @param {!*} val
         * @export
         */

        FlexiCache.prototype.copy = function(key, val){

            if(this.debug) {

                this.stats.count_cache_clone++;
            }

            return this.set(key, clone(val));
        };

        /**
         * @param {string} key
         * @param {boolean=} force
         * @return {*}
         * @export
         */

        FlexiCache.prototype.get = function(key, force){

            if(key = ('' + key)){

                var cache = this.data[key];

                if(cache){

                    if(this.debug){

                        this.console.log("Get Cache@" + this.id + " from: " + key);
                        this.stats.count_cache_get++;
                    }

                    if(force || !cache.expire || (time() < cache.expire)){

                        cache.count++;

                        return cache.data;
                    }

                    this.del(key);
                }
            }
        };

        /**
         * @param {string} key
         * @param {boolean=} force
         * @return {*}
         * @export
         */

        FlexiCache.prototype.clone = function(key, force){

            if(this.debug){

                this.stats.count_cache_clone++;
            }

            return clone(this.get(key, force));
        };

        /**
         * @return {Object<string, *>}
         * @export
         */

        FlexiCache.prototype.all = function(){

            if(this.debug){

                this.console.log("Get All from Cache@" + this.id);
            }

            return this.data;
        };

        /**
         * @param {string} key
         * @return {*}
         * @export
         */

        FlexiCache.prototype.remove = function(key){

            var val = this.data[key].data;

            this.del(key);

            return val;
        };

        /**
         * @param {string} key
         * @return {*}
         * @export
         */

        FlexiCache.prototype.rm = function(key){

            return this.remove(key);
        };

        /**
         * @param {string} key
         * @return {*}
         * @export
         */

        FlexiCache.prototype.del = function(key){

            this.delete(key);
        };

        /**
         * @param {string} key
         * @return {*}
         * @export
         */

        FlexiCache.prototype.delete = function(key){

            if(key = ('' + key)){

                if(this.data[key]){

                    for(var i = 0; i < this.keys.length; i++){

                        if(this.keys[i] === key){

                            if(this.debug){

                                this.console.log("Delete from Cache@" + this.id + ": " + key);
                                this.stats.count_cache_del++;
                            }

                            this.keys.splice(i, 1);
                            break;
                        }
                    }

                    this.data[key].data = null;
                    this.data[key] = null;
                    delete this.data[key];
                }
            }
        };

        /**
         * @type {function()}
         * @export
         */

        FlexiCache.prototype.reset = function(){

            if(this.debug){

                this.console.log("Clear Cache@" + this.id);
            }

            this.data = {};
            this.keys = [];
        };

        /**
         * @return {?number}
         * @export
         */

        FlexiCache.prototype.count = function(){

            return this.keys.length;
        };

        /**
         * @export
         */

        FlexiCache.prototype.cleanup = function(force){

            if(this.keys.length){

                if(this.debug){

                    this.console.log("Cleanup Cache@" + this.id);
                    this.stats.count_cache_clean++;
                }

                var current = time();

                for(var i = 0; i < this.keys.length; i++){

                    var key = this.keys[i];
                    var cache = this.data[key];

                    if(cache.expire && (current > cache.expire)){

                        this.del(key);
                        i--;
                    }
                    else if(this.auto && (cache.count === 0) && (force || ((current - cache.time) > 60 * 1000))){

                        this.del(key);
                        i--;
                    }
                    else{

                        cache.count = 0;
                    }
                }
            }

            if(this.keys.length){

                registerScheduler.call(this);
            }
            else{

                this.init = false;
            }
        };

        // if(this.debug){
        //
        //     /**
        //      * @type {Array<?FlexiCache>}
        //      */
        //
        //     FlexiCache.caches = caches;
        // }

        return FlexiCache;

        // Private Helpers:
        // ------------------------------------------------------------------------------

        /**
         * @this {FlexiCache}
         */

        function registerScheduler(){

            if(this.duration || this.auto){

                var self = this;

                queue(function(){

                    self.cleanup();
                    self = void 0;

                }, this.auto ? 60 * 1000 : this.duration, 'cache-cleanup-' + this.id);
            }
        }

        /**
         * @returns {number}
         */

        function time(){

            return (

                typeof performance !== 'undefined' ?

                    performance.now()
                :
                    (new Date()).getTime()
            );
        }
    })(

        //require('/core/utils.js').clone,

        /**
         * @param {*} val
         * @returns {*}
         * @const
         */

        function clone(val){

            if(val && (typeof val === 'object')){

                if(val.cloneNode){ // if(val instanceof HTMLElement)

                    return val.cloneNode(true);
                }

                var constructor = val.constructor;

                switch(constructor){

                    case Date: // if(val instanceof Date)

                        return new Date(val);

                    case RegExp:

                        return new RegExp(val);

                    case Array:

                        var length = val.length;
                        var copy = new Array(length);

                        if(length){

                            var i = 0;

                            while(i < length){

                                item = val[i];
                                type = typeof item;

                                if((type === 'number') || (type === 'string') || (type === 'boolean')){

                                    copy[i] = item;
                                }
                                else{

                                    copy[i] = clone(item);
                                }

                                i++;
                            }
                        }

                        return copy;

                    case Object:

                        var keys = Object.keys(/** @type {!Object} */ (val));
                        var length = keys.length;
                        var copy = {};

                        if(length){

                            var i = 0;
                            var key, type, item;

                            while(i < length){

                                key = keys[i++];
                                item = val[key];
                                type = typeof item;

                                if((type === 'number') || (type === 'string') || (type === 'boolean')){

                                    copy[key] = item;
                                }
                                else{

                                    copy[key] = clone(item);
                                }
                            }
                        }

                        return copy;

                    default:

                        if(val.clone){

                            return val.clone();
                        }
                }
            }

            return val;
        },

        //require('/core/utils.js').queue

        (function(){

            var stack = {};

            return function(fn, delay, id){

                var timer = stack[id];

                if(timer){

                    clearTimeout(timer);
                }

                return (

                    stack[id] = setTimeout(fn, delay)
                );
            };
        })()

    ), this);

    /** --------------------------------------------------------------------------------------
     * UMD Wrapper for Browser and Node.js
     * @param {!string} name
     * @param {!Function|Object} factory
     * @param {!Function|Object=} root
     * @suppress {checkVars}
     * @const
     */

    function provide(name, factory, root){

        root || (root = this);

        var prop;

        // AMD (RequireJS)
        if((prop = root['define']) && prop['amd']){

            prop([], function(){

                return factory;
            });
        }
        // Closure (Xone)
        else if((prop = root['modules'])){

            prop[name.toLowerCase()] = factory;
        }
        // CommonJS (Node.js)
        else if(typeof module !== 'undefined'){

            /** @export */
            module.exports = factory;
        }
        // Global (window)
        else{

            root[name] = factory;
        }
    }

}).call(this);
