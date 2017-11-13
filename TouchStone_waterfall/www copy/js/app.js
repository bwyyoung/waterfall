(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":3}],2:[function(require,module,exports){
module.exports = function blacklist (src) {
  var copy = {}, filter = arguments[1]

  if (typeof filter === 'string') {
    filter = {}
    for (var i = 1; i < arguments.length; i++) {
      filter[arguments[i]] = true
    }
  }

  for (var key in src) {
    // blacklist?
    if (filter[key]) continue

    copy[key] = src[key]
  }

  return copy
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}
}());

},{}],5:[function(require,module,exports){
function makeshiftTitle(title, message) {
  return title ? (title + '\n\n' + message) : message
}

// See http://docs.phonegap.com/en/edge/cordova_notification_notification.md.html for documentation
module.exports = {
  alert: function alert(message, callback, title) {
    if (window.navigator.notification && window.navigator.notification.alert) {
      return window.navigator.notification.alert.apply(null, arguments)
    }

    var text = makeshiftTitle(title, message)

    setTimeout(function() {
      window.alert(text)

      callback()
    }, 0)
  },
  confirm: function confirm(message, callback, title) {
    if (window.navigator.notification && window.navigator.notification.confirm) {
      return window.navigator.notification.confirm.apply(null, arguments)
    }

    var text = makeshiftTitle(title, message)

    setTimeout(function() {
      var confirmed = window.confirm(text)
      var buttonIndex = confirmed ? 1 : 2

      callback(buttonIndex)
    }, 0)
  },

  prompt: function prompt(message, callback, title, defaultText) {
    if (window.navigator.notification && window.navigator.notification.prompt) {
      return window.navigator.notification.prompt.apply(null, arguments)
    }

    var question = makeshiftTitle(title, message)

    setTimeout(function() {
      var text = window.prompt(question, defaultText)
      var buttonIndex = (text === null) ? 0 : 1

      callback({
        buttonIndex: buttonIndex,
        input1: text
      })
    }, 0)
  }
}

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":11}],8:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],9:[function(require,module,exports){
var request = require('request')

if (typeof Promise !== 'function') {
  throw new TypeError('Please provide a Promise polyfill as your environment doesn\'t support them natively')
}

module.exports = function (options, callback) {

  return new Promise(function (resolve, reject) {

    request(options, function (err, response, body) {

      var status = (response) ? response.statusCode : 0
      callback = callback || function () {}

      if (err) {
        callback(err)
        reject(err)
        return
      }

      try{
        response.body = JSON.parse(body)
      }
      catch (e) {}

      if (status >= 400 && status < 600) {
        callback(null, response, response.body)
        reject(response)
        return
      }

      callback(null, response, response.body)
      resolve(response)
    })
  })
}

},{"request":10}],10:[function(require,module,exports){
var request = require('xhr');

// Wrapper to make the features more similiar between
// request and xhr

module.exports = function (options, callback) {
  callback = callback || function () {};
  
  // Set up for Request module
  if (options.data && !window) options.form = options.data;
  
  // Set up for xhr module
  if (options.form && window) {
    options.body = (typeof options.form === 'object')
      ? JSON.stringify(options.form)
      : options.form;
  }
  
  if (options.data) {
    options.body = (typeof options.data === 'object')
      ? JSON.stringify(options.data)
      : options.data;
  }
  
  if (options.url && window) options.uri = options.url;
  if (window) options.cors = options.withCredentials;
  
  return request(options, callback);
};
},{"xhr":61}],11:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],12:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],13:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":7,"trim":59}],14:[function(require,module,exports){
"use strict";

module.exports = {
  componentWillMount: function componentWillMount() {
    this.__rs_listeners = [];
  },

  componentWillUnmount: function componentWillUnmount() {
    this.__rs_listeners.forEach(function (listener) {
      var emitter = listener.emitter;
      var eventName = listener.eventName;
      var callback = listener.callback;

      var removeListener = emitter.removeListener || emitter.removeEventListener;
      removeListener.call(emitter, eventName, callback);
    });
  },

  watch: function watch(emitter, eventName, callback) {
    this.__rs_listeners.push({
      emitter: emitter,
      eventName: eventName,
      callback: callback
    });

    var addListener = emitter.addListener || emitter.addEventListener;
    addListener.call(emitter, eventName, callback);
  },

  unwatch: function unwatch(emitter, eventName, callback) {
    this.__rs_listeners = this.__rs_listeners.filter(function (listener) {
      return listener.emitter === emitter && listener.eventName === eventName && listener.callback === callback;
    });

    var removeListener = emitter.removeListener || emitter.removeEventListener;
    removeListener.call(emitter, eventName, callback);
  }
};
},{}],15:[function(require,module,exports){
(function (global){
"use strict";

var GLOBAL = global || window;

function clearTimers() {
  this.clearIntervals();
  this.clearTimeouts();
}

module.exports = {
  clearIntervals: function clearIntervals() {
    this.__rt_intervals.forEach(GLOBAL.clearInterval);
  },
  clearTimeouts: function clearTimeouts() {
    this.__rt_timeouts.forEach(GLOBAL.clearTimeout);
  },
  clearInterval: function clearInterval() {
    return GLOBAL.clearInterval.apply(GLOBAL, arguments);
  },
  clearTimeout: function clearTimeout() {
    return GLOBAL.clearTimeout.apply(GLOBAL, arguments);
  },
  clearTimers: clearTimers,

  componentWillMount: function componentWillMount() {
    this.__rt_intervals = [];
    this.__rt_timeouts = [];
  },
  componentWillUnmount: clearTimers,

  setInterval: function setInterval(callback) {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return this.__rt_intervals[this.__rt_intervals.push(GLOBAL.setInterval.apply(GLOBAL, [function () {
      for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        params[_key2] = arguments[_key2];
      }

      callback.call.apply(callback, [_this].concat(params));
    }].concat(args))) - 1];
  },
  setTimeout: function setTimeout(callback) {
    var _this2 = this;

    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }

    return this.__rt_timeouts[this.__rt_timeouts.push(GLOBAL.setTimeout.apply(GLOBAL, [function () {
      for (var _len4 = arguments.length, params = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        params[_key4] = arguments[_key4];
      }

      callback.call.apply(callback, [_this2].concat(params));
    }].concat(args))) - 1];
  }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var ErrorView = _react2['default'].createClass({
	displayName: 'ErrorView',

	propTypes: {
		children: _react2['default'].PropTypes.node
	},

	render: function render() {
		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ fill: true, className: 'View ErrorView' },
			this.props.children
		);
	}
});

exports['default'] = ErrorView;
module.exports = exports['default'];
},{"react":undefined,"react-container":undefined}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var _mixinsTransitions = require('../mixins/Transitions');

var _mixinsTransitions2 = _interopRequireDefault(_mixinsTransitions);

var Link = _react2['default'].createClass({
	displayName: 'Link',

	mixins: [_mixinsTransitions2['default']],
	propTypes: {
		children: _react2['default'].PropTypes.any,
		options: _react2['default'].PropTypes.object,
		transition: _react2['default'].PropTypes.string,
		to: _react2['default'].PropTypes.string,
		viewProps: _react2['default'].PropTypes.any
	},

	doTransition: function doTransition() {
		var options = _extends({ viewProps: this.props.viewProps, transition: this.props.transition }, this.props.options);
		console.info('Link to "' + this.props.to + '" using transition "' + this.props.transition + '"' + ' with props ', this.props.viewProps);
		this.transitionTo(this.props.to, options);
	},

	render: function render() {
		var tappableProps = (0, _blacklist2['default'])(this.props, 'children', 'options', 'transition', 'viewProps');

		return _react2['default'].createElement(
			_reactTappable2['default'],
			_extends({ onTap: this.doTransition }, tappableProps),
			this.props.children
		);
	}
});

exports['default'] = Link;
module.exports = exports['default'];
},{"../mixins/Transitions":22,"blacklist":2,"react":undefined,"react-tappable":undefined}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var View = _react2['default'].createClass({
	displayName: 'View',

	propTypes: {
		component: _react2['default'].PropTypes.func.isRequired,
		name: _react2['default'].PropTypes.string.isRequired
	},
	render: function render() {
		throw new Error('TouchstoneJS <View> should not be rendered directly.');
	}
});

exports['default'] = View;
module.exports = exports['default'];
},{"react":undefined}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _ErrorView = require('./ErrorView');

var _ErrorView2 = _interopRequireDefault(_ErrorView);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

function createViewsFromChildren(children) {
	var views = {};
	_react2['default'].Children.forEach(children, function (view) {
		views[view.props.name] = view;
	});
	return views;
}

var ViewContainer = _react2['default'].createClass({
	displayName: 'ViewContainer',

	statics: {
		shouldFillVerticalSpace: true
	},
	propTypes: {
		children: _react2['default'].PropTypes.node
	},
	render: function render() {
		var props = (0, _blacklist2['default'])(this.props, 'children');
		return _react2['default'].createElement(
			'div',
			props,
			this.props.children
		);
	}
});

var ViewManager = _react2['default'].createClass({
	displayName: 'ViewManager',

	statics: {
		shouldFillVerticalSpace: true
	},
	contextTypes: {
		app: _react2['default'].PropTypes.object.isRequired
	},
	propTypes: {
		name: _react2['default'].PropTypes.string,
		children: _react2['default'].PropTypes.node,
		className: _react2['default'].PropTypes.string,
		defaultView: _react2['default'].PropTypes.string,
		onViewChange: _react2['default'].PropTypes.func
	},
	getDefaultProps: function getDefaultProps() {
		return {
			name: '__default'
		};
	},
	getInitialState: function getInitialState() {
		return {
			views: createViewsFromChildren(this.props.children),
			currentView: this.props.defaultView,
			options: {}
		};
	},
	componentDidMount: function componentDidMount() {
		this.context.app.viewManagers[this.props.name] = this;
	},
	componentWillUnmount: function componentWillUnmount() {
		delete this.context.app.viewManagers[this.props.name];
	},
	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		this.setState({
			views: createViewsFromChildren(this.props.children)
		});
		if (nextProps.name !== this.props.name) {
			this.context.app.viewManagers[nextProps.name] = this;
			delete this.context.app.viewManagers[this.props.name];
		}
		if (nextProps.currentView && nextProps.currentView !== this.state.currentView) {
			this.transitionTo(nextProps.currentView, { viewProps: nextProps.viewProps });
		}
	},
	transitionTo: function transitionTo(viewKey, options) {
		var _this = this;

		if (typeof options === 'string') {
			options = { transition: options };
		}
		if (!options) options = {};
		this.activeTransitionOptions = options;
		this.context.app.viewManagerInTransition = this;
		this.props.onViewChange && this.props.onViewChange(viewKey);
		this.setState({
			currentView: viewKey,
			options: options
		}, function () {
			delete _this.activeTransitionOptions;
			delete _this.context.app.viewManagerInTransition;
		});
	},
	renderViewContainer: function renderViewContainer() {
		var viewKey = this.state.currentView;
		if (!viewKey) {
			return _react2['default'].createElement(
				_ErrorView2['default'],
				null,
				_react2['default'].createElement(
					'span',
					{ className: 'ErrorView__heading' },
					'ViewManager: ',
					this.props.name
				),
				_react2['default'].createElement(
					'span',
					{ className: 'ErrorView__text' },
					'Error: There is no current View.'
				)
			);
		}
		var view = this.state.views[viewKey];
		if (!view || !view.props.component) {
			return _react2['default'].createElement(
				_ErrorView2['default'],
				null,
				_react2['default'].createElement(
					'span',
					{ className: 'ErrorView__heading' },
					'ViewManager: "',
					this.props.name,
					'"'
				),
				_react2['default'].createElement(
					'span',
					{ className: 'ErrorView__text' },
					'The View "',
					viewKey,
					'" is invalid.'
				)
			);
		}
		var options = this.state.options || {};
		var viewClassName = (0, _classnames2['default'])('View View--' + viewKey, view.props.className);
		var ViewComponent = view.props.component;
		var viewProps = (0, _blacklist2['default'])(view.props, 'component', 'className');
		_extends(viewProps, options.viewProps);
		var viewElement = _react2['default'].createElement(ViewComponent, viewProps);

		if (this.__lastRenderedView !== viewKey) {
			// console.log('initialising view ' + viewKey + ' with options', options);
			if (viewElement.type.navigationBar && viewElement.type.getNavigation) {
				var app = this.context.app;
				var transition = options.transition;
				if (app.viewManagerInTransition) {
					transition = app.viewManagerInTransition.activeTransitionOptions.transition;
				}
				setTimeout(function () {
					app.navigationBars[viewElement.type.navigationBar].updateWithTransition(viewElement.type.getNavigation(viewProps, app), transition);
				}, 0);
			}
			this.__lastRenderedView = viewKey;
		}

		return _react2['default'].createElement(
			ViewContainer,
			{ className: viewClassName, key: viewKey },
			viewElement
		);
	},
	render: function render() {
		var className = (0, _classnames2['default'])('ViewManager', this.props.className);
		var viewContainer = this.renderViewContainer(this.state.currentView, { viewProps: this.state.currentViewProps });

		var transitionName = 'view-transition-instant';
		var transitionDurationEnter = 10;
		var transitionDurationLeave = 60;
		if (this.state.options.transition) {
			// console.log('applying view transition: ' + this.state.options.transition + ' to view ' + this.state.currentView);
			transitionName = 'view-transition-' + this.state.options.transition;
			if (this.state.options.transition === 'fade') {
				var transitionDurationEnter = 10;
				var transitionDurationLeave = 340;
			} else {
				var transitionDurationEnter = 500;
				var transitionDurationLeave = 500;
			}
		}
		return _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: transitionName, transitionEnterTimeout: transitionDurationEnter, transitionLeaveTimeout: transitionDurationLeave, className: className, component: 'div' },
			viewContainer
		);
	}
});

exports['default'] = ViewManager;
module.exports = exports['default'];
},{"./ErrorView":16,"blacklist":2,"classnames":4,"react":undefined,"react-addons-css-transition-group":undefined}],20:[function(require,module,exports){
'use strict';

var animation = require('tween.js');

function update() {
	animation.update();
	if (animation.getAll().length) {
		window.requestAnimationFrame(update);
	}
}

function scrollToTop(el, options) {
	options = options || {};
	var from = el.scrollTop;
	var duration = Math.min(Math.max(200, from / 2), 350);
	if (from > 200) duration = 300;
	el.style.webkitOverflowScrolling = 'auto';
	el.style.overflow = 'hidden';
	var tween = new animation.Tween({ pos: from }).to({ pos: 0 }, duration).easing(animation.Easing.Quadratic.Out).onUpdate(function () {
		el.scrollTop = this.pos;
		if (options.onUpdate) {
			options.onUpdate();
		}
	}).onComplete(function () {
		el.style.webkitOverflowScrolling = 'touch';
		el.style.overflow = 'scroll';
		if (options.onComplete) options.onComplete();
	}).start();
	update();
	return tween;
}

exports.scrollToTop = scrollToTop;

var Mixins = exports.Mixins = {};

Mixins.ScrollContainerToTop = {
	componentDidMount: function componentDidMount() {
		window.addEventListener('statusTap', this.scrollContainerToTop);
	},
	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener('statusTap', this.scrollContainerToTop);
		if (this._scrollContainerAnimation) {
			this._scrollContainerAnimation.stop();
		}
	},
	scrollContainerToTop: function scrollContainerToTop() {
		var _this = this;

		if (!this.isMounted() || !this.refs.scrollContainer) return;
		this._scrollContainerAnimation = scrollToTop(this.refs.scrollContainer, {
			onComplete: function onComplete() {
				delete _this._scrollContainerAnimation;
			}
		});
	}
};
},{"tween.js":60}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.createApp = createApp;
var React = require('react');

var animation = require('./core/animation');
exports.animation = animation;
var Link = require('./core/Link');
exports.Link = Link;
var View = require('./core/View');
exports.View = View;
var ViewManager = require('./core/ViewManager');

exports.ViewManager = ViewManager;
var Container = require('react-container');
exports.Container = Container;
var Mixins = require('./mixins');
exports.Mixins = Mixins;
var UI = require('./ui');

exports.UI = UI;

function createApp() {
	var app = {
		navigationBars: {},
		viewManagers: {},
		transitionTo: function transitionTo(view, opts) {
			var vm = '__default';
			view = view.split(':');
			if (view.length > 1) {
				vm = view.shift();
			}
			view = view[0];
			app.viewManagers[vm].transitionTo(view, opts);
		}
	};
	return {
		childContextTypes: {
			app: React.PropTypes.object
		},
		getChildContext: function getChildContext() {
			return {
				app: app
			};
		}
	};
}
},{"./core/Link":17,"./core/View":18,"./core/ViewManager":19,"./core/animation":20,"./mixins":23,"./ui":58,"react":undefined,"react-container":undefined}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var Transitions = {
	contextTypes: {
		app: _react2['default'].PropTypes.object
	},
	transitionTo: function transitionTo(view, opts) {
		this.context.app.transitionTo(view, opts);
	}
};

exports['default'] = Transitions;
module.exports = exports['default'];
},{"react":undefined}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var Transitions = require('./Transitions');
exports.Transitions = Transitions;
},{"./Transitions":22}],24:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

module.exports = _react2['default'].createClass({
	displayName: 'Alertbar',
	propTypes: {
		animated: _react2['default'].PropTypes.bool,
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string,
		pulse: _react2['default'].PropTypes.bool,
		type: _react2['default'].PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger']),
		visible: _react2['default'].PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Alertbar', 'Alertbar--' + this.props.type, {
			'Alertbar--animated': this.props.animated,
			'Alertbar--pulse': this.props.pulse
		}, this.props.className);

		var pulseWrap = this.props.pulse ? _react2['default'].createElement(
			'div',
			{ className: 'Alertbar__inner' },
			this.props.children
		) : this.props.children;
		var animatedBar = this.props.visible ? _react2['default'].createElement(
			'div',
			{ className: className },
			pulseWrap
		) : null;

		var component = this.props.animated ? _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: 'Alertbar', transitionEnterTimeout: 300, transitionLeaveTimeout: 300, component: 'div' },
			animatedBar
		) : _react2['default'].createElement(
			'div',
			{ className: className },
			pulseWrap
		);

		return component;
	}
});
},{"classnames":4,"react":undefined,"react-addons-css-transition-group":undefined}],25:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

module.exports = _react2['default'].createClass({
	displayName: 'Button',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string,
		type: _react2['default'].PropTypes.oneOf(['default', 'info', 'primary', 'success', 'warning', 'danger'])
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Button', 'Button--' + this.props.type, this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'type');

		return _react2['default'].createElement(_reactTappable2['default'], _extends({}, props, { className: className, component: 'button' }));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined,"react-tappable":undefined}],26:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ButtonGroup',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('ButtonGroup', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],27:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var i18n = {
	// TODO: use real i18n strings.
	weekdaysMin: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
	months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	formatYearMonth: function formatYearMonth(year, month) {
		return year + ' - ' + (month + 1);
	}
};

function newState(props) {
	var date = props.date || new Date();
	var year = date.getFullYear();
	var month = date.getMonth();
	var ns = {
		mode: 'day',
		year: year,
		month: month,
		day: date.getDate(),
		displayYear: year,
		displayMonth: month,
		displayYearRangeStart: Math.floor(year / 10) * 10
	};
	return ns;
}

module.exports = _react2['default'].createClass({
	displayName: 'DatePicker',
	propTypes: {
		date: _react2['default'].PropTypes.object,
		mode: _react2['default'].PropTypes.oneOf(['day', 'month']),
		onChange: _react2['default'].PropTypes.func
	},

	getDefaultProps: function getDefaultProps() {
		return {
			date: new Date()
		};
	},

	getInitialState: function getInitialState() {
		return newState(this.props);
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		this.setState(newState(nextProps));
	},

	selectDay: function selectDay(year, month, day) {
		this.setState({
			year: year,
			month: month,
			day: day
		});

		if (this.props.onChange) {
			this.props.onChange(new Date(year, month, day));
		}
	},

	selectMonth: function selectMonth(month) {
		this.setState({
			displayMonth: month,
			mode: 'day'
		});
	},

	selectYear: function selectYear(year) {
		this.setState({
			displayYear: year,
			displayYearRangeStart: Math.floor(year / 10) * 10,
			mode: 'month'
		});
	},

	handlerTopBarTitleClick: function handlerTopBarTitleClick() {
		if (this.state.mode === 'day') {
			this.setState({ mode: 'month' });
		} else {
			this.setState({ mode: 'day' });
		}
	},

	handleLeftArrowClick: function handleLeftArrowClick() {
		switch (this.state.mode) {
			case 'day':
				this.goPreviousMonth();
				break;

			case 'month':
				this.goPreviousYearRange();
				break;

			case 'year':
				this.goPreviousYearRange();
				break;
		}
	},

	handleRightArrowClick: function handleRightArrowClick() {
		switch (this.state.mode) {
			case 'day':
				this.goNextMonth();
				break;

			case 'month':
				this.goNextYearRange();
				break;

			case 'year':
				this.goNextYearRange();
				break;
		}
	},

	goPreviousMonth: function goPreviousMonth() {
		if (this.state.displayMonth === 0) {
			this.setState({
				displayMonth: 11,
				displayYear: this.state.displayYear - 1
			});
		} else {
			this.setState({
				displayMonth: this.state.displayMonth - 1
			});
		}
	},

	goNextMonth: function goNextMonth() {
		if (this.state.displayMonth === 11) {
			this.setState({
				displayMonth: 0,
				displayYear: this.state.displayYear + 1
			});
		} else {
			this.setState({
				displayMonth: this.state.displayMonth + 1
			});
		}
	},

	goPreviousYear: function goPreviousYear() {
		this.setState({
			displayYear: this.state.displayYear - 1
		});
	},

	goNextYear: function goNextYear() {
		this.setState({
			displayYear: this.state.displayYear + 1
		});
	},

	goPreviousYearRange: function goPreviousYearRange() {
		this.setState({
			displayYearRangeStart: this.state.displayYearRangeStart - 10
		});
	},

	goNextYearRange: function goNextYearRange() {
		this.setState({
			displayYearRangeStart: this.state.displayYearRangeStart + 10
		});
	},

	renderWeeknames: function renderWeeknames() {
		return i18n.weekdaysMin.map(function (name, i) {
			return _react2['default'].createElement(
				'span',
				{ key: name + i, className: 'week-name' },
				name
			);
		});
	},

	renderDays: function renderDays() {
		var displayYear = this.state.displayYear;
		var displayMonth = this.state.displayMonth;
		var today = new Date();
		var lastDayInMonth = new Date(displayYear, displayMonth + 1, 0);
		var daysInMonth = lastDayInMonth.getDate();
		var daysInPreviousMonth = new Date(displayYear, displayMonth, 0).getDate();
		var startWeekDay = new Date(displayYear, displayMonth, 1).getDay();
		var days = [];
		var i, dm, dy;

		for (i = 0; i < startWeekDay; i++) {
			var d = daysInPreviousMonth - (startWeekDay - 1 - i);
			dm = displayMonth - 1;
			dy = displayYear;
			if (dm === -1) {
				dm = 11;
				dy -= 1;
			}
			days.push(_react2['default'].createElement(
				_reactTappable2['default'],
				{ key: 'p' + i, onTap: this.selectDay.bind(this, dy, dm, d), className: 'day in-previous-month' },
				d
			));
		}

		var inThisMonth = displayYear === today.getFullYear() && displayMonth === today.getMonth();
		var inSelectedMonth = displayYear === this.state.year && displayMonth === this.state.month;
		for (i = 1; i <= daysInMonth; i++) {
			var cssClass = (0, _classnames2['default'])({
				'day': true,
				'is-today': inThisMonth && i === today.getDate(),
				'is-current': inSelectedMonth && i === this.state.day
			});
			days.push(_react2['default'].createElement(
				_reactTappable2['default'],
				{ key: i, onTap: this.selectDay.bind(this, displayYear, displayMonth, i), className: cssClass },
				i
			));
		}

		var c = startWeekDay + daysInMonth;
		for (i = 1; i <= 42 - c; i++) {
			dm = displayMonth + 1;
			dy = displayYear;
			if (dm === 12) {
				dm = 0;
				dy += 1;
			}
			days.push(_react2['default'].createElement(
				_reactTappable2['default'],
				{ key: 'n' + i, onTap: this.selectDay.bind(this, dy, dm, i), className: 'day in-next-month' },
				i
			));
		}

		return days;
	},

	renderMonths: function renderMonths() {
		var _this = this;

		return i18n.months.map(function (name, m) {
			return _react2['default'].createElement(
				_reactTappable2['default'],
				{ key: name + m, className: (0, _classnames2['default'])('month-name', { 'is-current': m === _this.state.displayMonth }),
					onTap: _this.selectMonth.bind(_this, m) },
				name
			);
		});
	},

	renderYears: function renderYears() {
		var years = [];
		for (var i = this.state.displayYearRangeStart - 1; i < this.state.displayYearRangeStart + 11; i++) {
			years.push(_react2['default'].createElement(
				_reactTappable2['default'],
				{ key: i, className: (0, _classnames2['default'])('year', { 'is-current': i === this.state.displayYear }),
					onTap: this.selectYear.bind(this, i) },
				i
			));
		}

		return years;
	},

	render: function render() {
		var topBarTitle = '';
		switch (this.state.mode) {
			case 'day':
				topBarTitle = i18n.formatYearMonth(this.state.displayYear, this.state.displayMonth);
				break;
			case 'month':
				topBarTitle = this.state.displayYearRangeStart + ' - ' + (this.state.displayYearRangeStart + 9);
				break;
		}

		return _react2['default'].createElement(
			'div',
			{ className: (0, _classnames2['default'])('date-picker', 'mode-' + this.state.mode) },
			_react2['default'].createElement(
				'div',
				{ className: 'top-bar' },
				_react2['default'].createElement(_reactTappable2['default'], { className: 'left-arrow', onTap: this.handleLeftArrowClick }),
				_react2['default'].createElement(_reactTappable2['default'], { className: 'right-arrow', onTap: this.handleRightArrowClick }),
				_react2['default'].createElement(
					_reactTappable2['default'],
					{ className: 'top-bar-title', onTap: this.handlerTopBarTitleClick },
					topBarTitle
				)
			),
			this.state.mode === 'day' && [_react2['default'].createElement(
				'div',
				{ key: 'weeknames', className: 'week-names-container' },
				this.renderWeeknames()
			), _react2['default'].createElement(
				'div',
				{ key: 'days', className: 'days-container' },
				this.renderDays()
			)],
			this.state.mode === 'month' && [_react2['default'].createElement(
				'div',
				{ key: 'years', className: 'years-container' },
				this.renderYears()
			), _react2['default'].createElement(
				'div',
				{ key: 'months', className: 'month-names-container' },
				this.renderMonths()
			)]
		);
	}
});
},{"classnames":4,"react":undefined,"react-tappable":undefined}],28:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _DatePicker = require('./DatePicker');

var _DatePicker2 = _interopRequireDefault(_DatePicker);

var _Popup = require('./Popup');

var _Popup2 = _interopRequireDefault(_Popup);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'DatePickerPopup',

	propTypes: {
		className: _react2['default'].PropTypes.string,
		visible: _react2['default'].PropTypes.bool
	},

	render: function render() {
		var className = (0, _classnames2['default'])('DatePicker', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className', 'visible');
		return _react2['default'].createElement(
			_Popup2['default'],
			{ className: className, visible: this.props.visible },
			_react2['default'].createElement(_DatePicker2['default'], props)
		);
	}
});
},{"./DatePicker":27,"./Popup":50,"blacklist":2,"classnames":4,"react":undefined}],29:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'FieldControl',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('FieldControl', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],30:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'FieldLabel',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('FieldLabel', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],31:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'Group',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string,
		hasTopGutter: _react2['default'].PropTypes.bool
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Group', {
			'Group--has-gutter-top': this.props.hasTopGutter
		}, this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],32:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'GroupBody',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Group__body', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],33:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'GroupFooter',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Group__footer', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],34:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'GroupHeader',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Group__header', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],35:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'GroupInner',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Group__inner', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],36:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemContent = require('./ItemContent');

var _ItemContent2 = _interopRequireDefault(_ItemContent);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

// Many input types DO NOT support setSelectionRange.
// Email will show an error on most desktop browsers but works on
// mobile safari + WKWebView, which is really what we care about
var SELECTABLE_INPUT_TYPES = {
	'email': true,
	'password': true,
	'search': true,
	'tel': true,
	'text': true,
	'url': true
};

module.exports = _react2['default'].createClass({
	displayName: 'Input',

	propTypes: {
		autoFocus: _react2['default'].PropTypes.bool,
		className: _react2['default'].PropTypes.string,
		children: _react2['default'].PropTypes.node,
		disabled: _react2['default'].PropTypes.bool
	},

	componentDidMount: function componentDidMount() {
		if (this.props.autoFocus) {
			this.moveCursorToEnd();
		}
	},

	moveCursorToEnd: function moveCursorToEnd() {
		var target = this.refs.focusTarget.getDOMNode();
		var endOfString = target.value.length;

		if (SELECTABLE_INPUT_TYPES.hasOwnProperty(target.type)) {
			target.focus();
			target.setSelectionRange(endOfString, endOfString);
		}
	},

	render: function render() {
		var inputProps = (0, _blacklist2['default'])(this.props, 'children', 'className');

		return _react2['default'].createElement(
			_Item2['default'],
			{ className: this.props.className, selectable: this.props.disabled, component: 'label' },
			_react2['default'].createElement(
				_ItemInner2['default'],
				null,
				_react2['default'].createElement(
					_ItemContent2['default'],
					{ component: 'label' },
					_react2['default'].createElement('input', _extends({ ref: 'focusTarget', className: 'field', type: 'text' }, inputProps))
				),
				this.props.children
			)
		);
	}
});
},{"./Item":37,"./ItemContent":38,"./ItemInner":39,"blacklist":2,"react":undefined}],37:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'Item',

	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		component: _react2['default'].PropTypes.any,
		className: _react2['default'].PropTypes.string,
		showDisclosureArrow: _react2['default'].PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			component: 'div'
		};
	},

	render: function render() {
		var componentClass = (0, _classnames2['default'])('Item', {
			'Item--has-disclosure-arrow': this.props.showDisclosureArrow
		}, this.props.className);

		var props = (0, _blacklist2['default'])(this.props, 'children', 'className', 'showDisclosureArrow');
		props.className = componentClass;

		return _react2['default'].createElement(this.props.component, props, this.props.children);
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],38:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemContent',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Item__content', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],39:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemInner',

	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Item__inner', this.props.className);

		return _react2['default'].createElement('div', _extends({ className: className }, this.props));
	}
});
},{"classnames":4,"react":undefined}],40:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemMedia',
	propTypes: {
		avatar: _react2['default'].PropTypes.string,
		avatarInitials: _react2['default'].PropTypes.string,
		className: _react2['default'].PropTypes.string,
		icon: _react2['default'].PropTypes.string,
		thumbnail: _react2['default'].PropTypes.string
	},

	render: function render() {
		var className = (0, _classnames2['default'])({
			'Item__media': true,
			'Item__media--icon': this.props.icon,
			'Item__media--avatar': this.props.avatar || this.props.avatarInitials,
			'Item__media--thumbnail': this.props.thumbnail
		}, this.props.className);

		// media types
		var icon = this.props.icon ? _react2['default'].createElement('div', { className: 'Item__media__icon ' + this.props.icon }) : null;
		var avatar = this.props.avatar || this.props.avatarInitials ? _react2['default'].createElement(
			'div',
			{ className: 'Item__media__avatar' },
			this.props.avatar ? _react2['default'].createElement('img', { src: this.props.avatar }) : this.props.avatarInitials
		) : null;
		var thumbnail = this.props.thumbnail ? _react2['default'].createElement(
			'div',
			{ className: 'Item__media__thumbnail' },
			_react2['default'].createElement('img', { src: this.props.thumbnail })
		) : null;

		return _react2['default'].createElement(
			'div',
			{ className: className },
			icon,
			avatar,
			thumbnail
		);
	}
});
},{"classnames":4,"react":undefined}],41:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemNote',
	propTypes: {
		className: _react2['default'].PropTypes.string,
		icon: _react2['default'].PropTypes.string,
		label: _react2['default'].PropTypes.string,
		type: _react2['default'].PropTypes.string
	},
	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Item__note', 'Item__note--' + this.props.type, this.props.className);

		// elements
		var label = this.props.label ? _react2['default'].createElement(
			'div',
			{ className: 'Item__note__label' },
			this.props.label
		) : null;
		var icon = this.props.icon ? _react2['default'].createElement('div', { className: 'Item__note__icon ' + this.props.icon }) : null;

		return _react2['default'].createElement(
			'div',
			{ className: className },
			label,
			icon
		);
	}
});
},{"classnames":4,"react":undefined}],42:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemSubTitle',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Item__subtitle', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],43:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ItemTitle',
	propTypes: {
		children: _react2['default'].PropTypes.node.isRequired,
		className: _react2['default'].PropTypes.string
	},
	render: function render() {
		var className = (0, _classnames2['default'])('Item__title', this.props.className);
		var props = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],44:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _FieldControl = require('./FieldControl');

var _FieldControl2 = _interopRequireDefault(_FieldControl);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

// Many input types DO NOT support setSelectionRange.
// Email will show an error on most desktop browsers but works on
// mobile safari + WKWebView, which is really what we care about
var SELECTABLE_INPUT_TYPES = {
	'email': true,
	'password': true,
	'search': true,
	'tel': true,
	'text': true,
	'url': true
};

module.exports = _react2['default'].createClass({
	displayName: 'LabelInput',

	propTypes: {
		alignTop: _react2['default'].PropTypes.bool,
		autoFocus: _react2['default'].PropTypes.bool,
		children: _react2['default'].PropTypes.node,
		className: _react2['default'].PropTypes.string,
		disabled: _react2['default'].PropTypes.bool,
		label: _react2['default'].PropTypes.string,
		readOnly: _react2['default'].PropTypes.bool,
		value: _react2['default'].PropTypes.string
	},

	componentDidMount: function componentDidMount() {
		if (this.props.autoFocus) {
			this.moveCursorToEnd();
		}
	},

	moveCursorToEnd: function moveCursorToEnd() {
		var target = this.refs.focusTarget.getDOMNode();
		var endOfString = target.value.length;

		if (SELECTABLE_INPUT_TYPES.hasOwnProperty(target.type)) {
			target.focus();
			target.setSelectionRange(endOfString, endOfString);
		}
	},

	render: function render() {
		var inputProps = (0, _blacklist2['default'])(this.props, 'alignTop', 'children', 'first', 'readOnly');
		var renderInput = this.props.readOnly ? _react2['default'].createElement(
			'div',
			{ className: 'field u-selectable' },
			this.props.value
		) : _react2['default'].createElement('input', _extends({ ref: 'focusTarget', className: 'field', type: 'text' }, inputProps));

		return _react2['default'].createElement(
			_Item2['default'],
			{ alignTop: this.props.alignTop, selectable: this.props.disabled, className: this.props.className, component: 'label' },
			_react2['default'].createElement(
				_ItemInner2['default'],
				null,
				_react2['default'].createElement(
					_reactTappable2['default'],
					{ onTap: this.moveCursorToEnd, className: 'FieldLabel' },
					this.props.label
				),
				_react2['default'].createElement(
					_FieldControl2['default'],
					null,
					renderInput,
					this.props.children
				)
			)
		);
	}
});
},{"./FieldControl":29,"./Item":37,"./ItemInner":39,"blacklist":2,"react":undefined,"react-tappable":undefined}],45:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _FieldControl = require('./FieldControl');

var _FieldControl2 = _interopRequireDefault(_FieldControl);

var _FieldLabel = require('./FieldLabel');

var _FieldLabel2 = _interopRequireDefault(_FieldLabel);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'LabelSelect',
	propTypes: {
		className: _react2['default'].PropTypes.string,
		disabled: _react2['default'].PropTypes.bool,
		label: _react2['default'].PropTypes.string,
		onChange: _react2['default'].PropTypes.func.isRequired,
		options: _react2['default'].PropTypes.array.isRequired,
		value: _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.number, _react2['default'].PropTypes.string])
	},

	getDefaultProps: function getDefaultProps() {
		return {
			className: ''
		};
	},

	renderOptions: function renderOptions() {
		return this.props.options.map(function (op) {
			return _react2['default'].createElement(
				'option',
				{ key: 'option-' + op.value, value: op.value },
				op.label
			);
		});
	},

	render: function render() {
		return _react2['default'].createElement(
			_Item2['default'],
			{ className: this.props.className, component: 'label' },
			_react2['default'].createElement(
				_ItemInner2['default'],
				null,
				_react2['default'].createElement(
					_FieldLabel2['default'],
					null,
					this.props.label
				),
				_react2['default'].createElement(
					_FieldControl2['default'],
					null,
					_react2['default'].createElement(
						'select',
						{ disabled: this.props.disabled, value: this.props.value, onChange: this.props.onChange, className: 'select-field' },
						this.renderOptions()
					),
					_react2['default'].createElement(
						'div',
						{ className: 'select-field-indicator' },
						_react2['default'].createElement('div', { className: 'select-field-indicator-arrow' })
					)
				)
			)
		);
	}
});
},{"./FieldControl":29,"./FieldLabel":30,"./Item":37,"./ItemInner":39,"react":undefined}],46:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'LabelTextarea',

	propTypes: {
		children: _react2['default'].PropTypes.node,
		className: _react2['default'].PropTypes.string,
		disabled: _react2['default'].PropTypes.bool,
		first: _react2['default'].PropTypes.bool,
		label: _react2['default'].PropTypes.string,
		readOnly: _react2['default'].PropTypes.bool,
		value: _react2['default'].PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			rows: 3
		};
	},

	render: function render() {
		var className = (0, _classnames2['default'])(this.props.className, 'list-item', 'field-item', 'align-top', {
			'is-first': this.props.first,
			'u-selectable': this.props.disabled
		});

		var props = (0, _blacklist2['default'])(this.props, 'children', 'className', 'disabled', 'first', 'label', 'readOnly');

		var renderInput = this.props.readOnly ? _react2['default'].createElement(
			'div',
			{ className: 'field u-selectable' },
			this.props.value
		) : _react2['default'].createElement('textarea', _extends({}, props, { className: 'field' }));

		return _react2['default'].createElement(
			'div',
			{ className: className },
			_react2['default'].createElement(
				'label',
				{ className: 'item-inner' },
				_react2['default'].createElement(
					'div',
					{ className: 'field-label' },
					this.props.label
				),
				_react2['default'].createElement(
					'div',
					{ className: 'field-control' },
					renderInput,
					this.props.children
				)
			)
		);
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],47:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _FieldControl = require('./FieldControl');

var _FieldControl2 = _interopRequireDefault(_FieldControl);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'LabelValue',

	propTypes: {
		alignTop: _react2['default'].PropTypes.bool,
		className: _react2['default'].PropTypes.string,
		label: _react2['default'].PropTypes.string,
		placeholder: _react2['default'].PropTypes.string,
		value: _react2['default'].PropTypes.string
	},

	render: function render() {
		return _react2['default'].createElement(
			_Item2['default'],
			{ alignTop: this.props.alignTop, className: this.props.className, component: 'label' },
			_react2['default'].createElement(
				_ItemInner2['default'],
				null,
				_react2['default'].createElement(
					'div',
					{ className: 'FieldLabel' },
					this.props.label
				),
				_react2['default'].createElement(
					_FieldControl2['default'],
					null,
					_react2['default'].createElement(
						'div',
						{ className: (0, _classnames2['default'])('field', this.props.value ? 'u-selectable' : 'field-placeholder') },
						this.props.value || this.props.placeholder
					)
				)
			)
		);
	}
});
},{"./FieldControl":29,"./Item":37,"./ItemInner":39,"classnames":4,"react":undefined}],48:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'ListHeader',

	propTypes: {
		className: _react2['default'].PropTypes.string,
		sticky: _react2['default'].PropTypes.bool
	},

	render: function render() {
		var className = (0, _classnames2['default'])('list-header', {
			'sticky': this.props.sticky
		}, this.props.className);

		var props = (0, _blacklist2['default'])(this.props, 'sticky');

		return _react2['default'].createElement('div', _extends({ className: className }, props));
	}
});
},{"blacklist":2,"classnames":4,"react":undefined}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var DIRECTIONS = {
	'reveal-from-right': -1,
	'show-from-left': -1,
	'show-from-right': 1,
	'reveal-from-left': 1
};

var defaultControllerState = {
	direction: 0,
	fade: false,
	leftArrow: false,
	leftButtonDisabled: false,
	leftIcon: '',
	leftLabel: '',
	leftAction: null,
	rightArrow: false,
	rightButtonDisabled: false,
	rightIcon: '',
	rightLabel: '',
	rightAction: null,
	title: ''
};

function newState(from) {
	var ns = _extends({}, defaultControllerState);
	if (from) _extends(ns, from);
	delete ns.name; // may leak from props
	return ns;
}

var NavigationBar = _react2['default'].createClass({
	displayName: 'NavigationBar',

	contextTypes: {
		app: _react2['default'].PropTypes.object
	},

	propTypes: {
		name: _react2['default'].PropTypes.string,
		className: _react2['default'].PropTypes.string
	},

	getInitialState: function getInitialState() {
		return newState(this.props);
	},

	componentDidMount: function componentDidMount() {
		if (this.props.name) {
			this.context.app.navigationBars[this.props.name] = this;
		}
	},

	componentWillUnmount: function componentWillUnmount() {
		if (this.props.name) {
			delete this.context.app.navigationBars[this.props.name];
		}
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		this.setState(newState(nextProps));
		if (nextProps.name !== this.props.name) {
			if (nextProps.name) {
				this.context.app.navigationBars[nextProps.name] = this;
			}
			if (this.props.name) {
				delete this.context.app.navigationBars[this.props.name];
			}
		}
	},

	update: function update(state) {
		// FIXME: what is happening here
		state = newState(state);
		this.setState(newState(state));
	},

	updateWithTransition: function updateWithTransition(state, transition) {
		state = newState(state);
		state.direction = DIRECTIONS[transition] || 0;

		if (transition === 'fade' || transition === 'fade-contract' || transition === 'fade-expand') {
			state.fade = true;
		}

		this.setState(state);
	},

	renderLeftButton: function renderLeftButton() {
		var className = (0, _classnames2['default'])('NavigationBarLeftButton', {
			'has-arrow': this.state.leftArrow
		});

		return _react2['default'].createElement(
			_reactTappable2['default'],
			{ onTap: this.state.leftAction, className: className, disabled: this.state.leftButtonDisabled, component: 'button' },
			this.renderLeftArrow(),
			this.renderLeftLabel()
		);
	},

	renderLeftArrow: function renderLeftArrow() {
		var transitionName = 'NavigationBarTransition-Instant';
		if (this.state.fade || this.state.direction) {
			transitionName = 'NavigationBarTransition-Fade';
		}
		var transitionDuration = transitionName === 'NavigationBarTransition-Instant' ? 50 : 500;

		var arrow = this.state.leftArrow ? _react2['default'].createElement('span', { className: 'NavigationBarLeftArrow' }) : null;

		return _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: transitionName, transitionEnterTimeout: transitionDuration, transitionLeaveTimeout: transitionDuration },
			arrow
		);
	},

	renderLeftLabel: function renderLeftLabel() {
		var transitionName = 'NavigationBarTransition-Instant';
		if (this.state.fade) {
			transitionName = 'NavigationBarTransition-Fade';
		} else if (this.state.direction > 0) {
			transitionName = 'NavigationBarTransition-Forwards';
		} else if (this.state.direction < 0) {
			transitionName = 'NavigationBarTransition-Backwards';
		}
		var transitionDuration = transitionName === 'NavigationBarTransition-Instant' ? 50 : 500;

		return _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: transitionName, transitionEnterTimeout: transitionDuration, transitionLeaveTimeout: transitionDuration },
			_react2['default'].createElement(
				'span',
				{ key: Date.now(), className: 'NavigationBarLeftLabel' },
				this.state.leftLabel
			)
		);
	},

	renderTitle: function renderTitle() {
		var title = this.state.title ? _react2['default'].createElement(
			'span',
			{ key: Date.now(), className: 'NavigationBarTitle' },
			this.state.title
		) : null;
		var transitionName = 'NavigationBarTransition-Instant';
		if (this.state.fade) {
			transitionName = 'NavigationBarTransition-Fade';
		} else if (this.state.direction > 0) {
			transitionName = 'NavigationBarTransition-Forwards';
		} else if (this.state.direction < 0) {
			transitionName = 'NavigationBarTransition-Backwards';
		}
		var transitionDuration = transitionName === 'NavigationBarTransition-Instant' ? 50 : 500;

		return _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: transitionName, transitionEnterTimeout: transitionDuration, transitionLeaveTimeout: transitionDuration },
			title
		);
	},

	renderRightButton: function renderRightButton() {
		var transitionName = 'NavigationBarTransition-Instant';
		if (this.state.fade || this.state.direction) {
			transitionName = 'NavigationBarTransition-Fade';
		}
		var transitionDuration = transitionName === 'NavigationBarTransition-Instant' ? 50 : 500;

		var button = this.state.rightIcon || this.state.rightLabel ? _react2['default'].createElement(
			_reactTappable2['default'],
			{ key: Date.now(), onTap: this.state.rightAction, className: 'NavigationBarRightButton', disabled: this.state.rightButtonDisabled, component: 'button' },
			this.renderRightLabel(),
			this.renderRightIcon()
		) : null;
		return _react2['default'].createElement(
			_reactAddonsCssTransitionGroup2['default'],
			{ transitionName: transitionName, transitionEnterTimeout: transitionDuration, transitionLeaveTimeout: transitionDuration },
			button
		);
	},

	renderRightIcon: function renderRightIcon() {
		if (!this.state.rightIcon) return null;

		var className = (0, _classnames2['default'])('NavigationBarRightIcon', this.state.rightIcon);

		return _react2['default'].createElement('span', { className: className });
	},

	renderRightLabel: function renderRightLabel() {
		return this.state.rightLabel ? _react2['default'].createElement(
			'span',
			{ key: Date.now(), className: 'NavigationBarRightLabel' },
			this.state.rightLabel
		) : null;
	},

	render: function render() {
		return _react2['default'].createElement(
			'div',
			{ className: (0, _classnames2['default'])('NavigationBar', this.props.className) },
			this.renderLeftButton(),
			this.renderTitle(),
			this.renderRightButton()
		);
	}
});

exports['default'] = NavigationBar;
module.exports = exports['default'];
},{"classnames":4,"react":undefined,"react-addons-css-transition-group":undefined,"react-tappable":undefined}],50:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

module.exports = _react2['default'].createClass({
	displayName: 'Popup',

	propTypes: {
		children: _react2['default'].PropTypes.node,
		className: _react2['default'].PropTypes.string,
		visible: _react2['default'].PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			transition: 'none'
		};
	},

	renderBackdrop: function renderBackdrop() {
		if (!this.props.visible) return null;
		return _react2['default'].createElement('div', { className: 'Popup-backdrop' });
	},

	renderDialog: function renderDialog() {
		if (!this.props.visible) return null;

		// Set classnames
		var dialogClassName = (0, _classnames2['default'])('Popup-dialog', this.props.className);

		return _react2['default'].createElement(
			'div',
			{ className: dialogClassName },
			this.props.children
		);
	},

	render: function render() {
		return _react2['default'].createElement(
			'div',
			{ className: 'Popup' },
			_react2['default'].createElement(
				_reactAddonsCssTransitionGroup2['default'],
				{ transitionName: 'Popup-dialog', transitionEnterTimeout: 300, transitionLeaveTimeout: 300, component: 'div' },
				this.renderDialog()
			),
			_react2['default'].createElement(
				_reactAddonsCssTransitionGroup2['default'],
				{ transitionName: 'Popup-background', transitionEnterTimeout: 300, transitionLeaveTimeout: 300, component: 'div' },
				this.renderBackdrop()
			)
		);
	}
});
},{"classnames":4,"react":undefined,"react-addons-css-transition-group":undefined}],51:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'PopupIcon',
	propTypes: {
		name: _react2['default'].PropTypes.string,
		type: _react2['default'].PropTypes.oneOf(['default', 'muted', 'primary', 'success', 'warning', 'danger']),
		spinning: _react2['default'].PropTypes.bool
	},

	render: function render() {
		var className = (0, _classnames2['default'])('PopupIcon', {
			'is-spinning': this.props.spinning
		}, this.props.name, this.props.type);

		return _react2['default'].createElement('div', { className: className });
	}
});
},{"classnames":4,"react":undefined}],52:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _ItemNote = require('./ItemNote');

var _ItemNote2 = _interopRequireDefault(_ItemNote);

var _ItemTitle = require('./ItemTitle');

var _ItemTitle2 = _interopRequireDefault(_ItemTitle);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

module.exports = _react2['default'].createClass({
	displayName: 'RadioList',

	propTypes: {
		options: _react2['default'].PropTypes.array.isRequired,
		value: _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.string, _react2['default'].PropTypes.number]),
		icon: _react2['default'].PropTypes.string,
		onChange: _react2['default'].PropTypes.func
	},

	onChange: function onChange(value) {
		this.props.onChange(value);
	},

	render: function render() {
		var self = this;
		var options = this.props.options.map(function (op, i) {
			var iconClassname = (0, _classnames2['default'])('item-icon primary', op.icon);
			var checkMark = op.value === self.props.value ? _react2['default'].createElement(_ItemNote2['default'], { type: 'primary', icon: 'ion-checkmark' }) : null;
			var icon = op.icon ? _react2['default'].createElement(
				'div',
				{ className: 'item-media' },
				_react2['default'].createElement('span', { className: iconClassname })
			) : null;

			function onChange() {
				self.onChange(op.value);
			}

			return _react2['default'].createElement(
				_reactTappable2['default'],
				{ key: 'option-' + i, onTap: onChange },
				_react2['default'].createElement(
					_Item2['default'],
					{ key: 'option-' + i, onTap: onChange },
					icon,
					_react2['default'].createElement(
						_ItemInner2['default'],
						null,
						_react2['default'].createElement(
							_ItemTitle2['default'],
							null,
							op.label
						),
						checkMark
					)
				)
			);
		});

		return _react2['default'].createElement(
			'div',
			null,
			options
		);
	}
});
},{"./Item":37,"./ItemInner":39,"./ItemNote":41,"./ItemTitle":43,"classnames":4,"react":undefined,"react-tappable":undefined}],53:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

module.exports = _react2['default'].createClass({
	displayName: 'SearchField',
	propTypes: {
		className: _react2['default'].PropTypes.string,
		onCancel: _react2['default'].PropTypes.func,
		onChange: _react2['default'].PropTypes.func,
		onClear: _react2['default'].PropTypes.func,
		onSubmit: _react2['default'].PropTypes.func,
		placeholder: _react2['default'].PropTypes.string,
		type: _react2['default'].PropTypes.oneOf(['default', 'dark']),
		value: _react2['default'].PropTypes.string
	},

	getInitialState: function getInitialState() {
		return {
			isFocused: false
		};
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default',
			value: ''
		};
	},

	handleClear: function handleClear() {
		this.refs.input.getDOMNode().focus();
		this.props.onClear();
	},

	handleCancel: function handleCancel() {
		this.refs.input.getDOMNode().blur();
		this.props.onCancel();
	},

	handleChange: function handleChange(e) {
		this.props.onChange(e.target.value);
	},

	handleBlur: function handleBlur(e) {
		this.setState({
			isFocused: false
		});
	},

	handleFocus: function handleFocus(e) {
		this.setState({
			isFocused: true
		});
	},

	handleSubmit: function handleSubmit(e) {
		e.preventDefault();

		var input = this.refs.input.getDOMNode();

		input.blur();
		this.props.onSubmit(input.value);
	},

	renderClear: function renderClear() {
		if (!this.props.value.length) return;
		return _react2['default'].createElement(_reactTappable2['default'], { className: 'SearchField__icon SearchField__icon--clear', onTap: this.handleClear });
	},

	renderCancel: function renderCancel() {
		var className = (0, _classnames2['default'])('SearchField__cancel', {
			'is-visible': this.state.isFocused || this.props.value
		});
		return _react2['default'].createElement(
			_reactTappable2['default'],
			{ className: className, onTap: this.handleCancel },
			'Cancel'
		);
	},

	render: function render() {
		var className = (0, _classnames2['default'])('SearchField', 'SearchField--' + this.props.type, {
			'is-focused': this.state.isFocused,
			'has-value': this.props.value
		}, this.props.className);

		return _react2['default'].createElement(
			'form',
			{ onSubmit: this.handleSubmit, action: 'javascript:;', className: className },
			_react2['default'].createElement(
				'label',
				{ className: 'SearchField__field' },
				_react2['default'].createElement(
					'div',
					{ className: 'SearchField__placeholder' },
					_react2['default'].createElement('span', { className: 'SearchField__icon SearchField__icon--search' }),
					!this.props.value.length ? this.props.placeholder : null
				),
				_react2['default'].createElement('input', { type: 'search', ref: 'input', value: this.props.value, onChange: this.handleChange, onFocus: this.handleFocus, onBlur: this.handleBlur, className: 'SearchField__input' }),
				this.renderClear()
			),
			this.renderCancel()
		);
	}
});
},{"classnames":4,"react":undefined,"react-tappable":undefined}],54:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

module.exports = _react2['default'].createClass({
	displayName: 'SegmentedControl',

	propTypes: {
		className: _react2['default'].PropTypes.string,
		equalWidthSegments: _react2['default'].PropTypes.bool,
		isInline: _react2['default'].PropTypes.bool,
		hasGutter: _react2['default'].PropTypes.bool,
		onChange: _react2['default'].PropTypes.func.isRequired,
		options: _react2['default'].PropTypes.array.isRequired,
		type: _react2['default'].PropTypes.string,
		value: _react2['default'].PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'primary'
		};
	},

	onChange: function onChange(value) {
		this.props.onChange(value);
	},

	render: function render() {
		var componentClassName = (0, _classnames2['default'])('SegmentedControl', 'SegmentedControl--' + this.props.type, {
			'SegmentedControl--inline': this.props.isInline,
			'SegmentedControl--has-gutter': this.props.hasGutter,
			'SegmentedControl--equal-widths': this.props.equalWidthSegments
		}, this.props.className);
		var self = this;

		var options = this.props.options.map(function (op) {
			function onChange() {
				self.onChange(op.value);
			}

			var itemClassName = (0, _classnames2['default'])('SegmentedControl__item', {
				'is-selected': op.value === self.props.value
			});

			return _react2['default'].createElement(
				_reactTappable2['default'],
				{ key: 'option-' + op.value, onTap: onChange, className: itemClassName },
				op.label
			);
		});

		return _react2['default'].createElement(
			'div',
			{ className: componentClassName },
			options
		);
	}
});
},{"classnames":4,"react":undefined,"react-tappable":undefined}],55:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

module.exports = _react2['default'].createClass({
	displayName: 'Switch',

	propTypes: {
		disabled: _react2['default'].PropTypes.bool,
		on: _react2['default'].PropTypes.bool,
		onTap: _react2['default'].PropTypes.func,
		type: _react2['default'].PropTypes.string
	},

	getDefaultProps: function getDefaultProps() {
		return {
			type: 'default'
		};
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Switch', 'Switch--' + this.props.type, {
			'is-disabled': this.props.disabled,
			'is-on': this.props.on
		});

		return _react2['default'].createElement(
			_reactTappable2['default'],
			{ onTap: this.props.onTap, className: className, component: 'label' },
			_react2['default'].createElement(
				'div',
				{ className: 'Switch__track' },
				_react2['default'].createElement('div', { className: 'Switch__handle' })
			)
		);
	}
});
},{"classnames":4,"react":undefined,"react-tappable":undefined}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var Navigator = _react2['default'].createClass({
	displayName: 'Navigator',

	propTypes: {
		className: _react2['default'].PropTypes.string
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Tabs-Navigator', this.props.className);
		var otherProps = (0, _blacklist2['default'])(this.props, 'className');

		return _react2['default'].createElement('div', _extends({ className: className }, otherProps));
	}
});

exports.Navigator = Navigator;
var Tab = _react2['default'].createClass({
	displayName: 'Tab',

	propTypes: {
		selected: _react2['default'].PropTypes.bool
	},

	render: function render() {
		var className = (0, _classnames2['default'])('Tabs-Tab', { 'is-selected': this.props.selected });
		var otherProps = (0, _blacklist2['default'])(this.props, 'selected');

		return _react2['default'].createElement(_reactTappable2['default'], _extends({ className: className }, otherProps));
	}
});

exports.Tab = Tab;
var Label = _react2['default'].createClass({
	displayName: 'Label',

	render: function render() {
		return _react2['default'].createElement('div', _extends({ className: 'Tabs-Label' }, this.props));
	}
});
exports.Label = Label;
},{"blacklist":2,"classnames":4,"react":undefined,"react-tappable":undefined}],57:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _Item = require('./Item');

var _Item2 = _interopRequireDefault(_Item);

var _ItemContent = require('./ItemContent');

var _ItemContent2 = _interopRequireDefault(_ItemContent);

var _ItemInner = require('./ItemInner');

var _ItemInner2 = _interopRequireDefault(_ItemInner);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'Input',
	propTypes: {
		className: _react2['default'].PropTypes.string,
		children: _react2['default'].PropTypes.node,
		disabled: _react2['default'].PropTypes.bool
	},

	render: function render() {
		var inputProps = (0, _blacklist2['default'])(this.props, 'children', 'className');

		return _react2['default'].createElement(
			_Item2['default'],
			{ selectable: this.props.disabled, className: this.props.className, component: 'label' },
			_react2['default'].createElement(
				_ItemInner2['default'],
				null,
				_react2['default'].createElement(
					_ItemContent2['default'],
					{ component: 'label' },
					_react2['default'].createElement('textarea', _extends({ className: 'field', rows: 3 }, inputProps))
				),
				this.props.children
			)
		);
	}
});
},{"./Item":37,"./ItemContent":38,"./ItemInner":39,"blacklist":2,"react":undefined}],58:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var Alertbar = require('./Alertbar');
exports.Alertbar = Alertbar;
var Button = require('./Button');
exports.Button = Button;
var ButtonGroup = require('./ButtonGroup');
exports.ButtonGroup = ButtonGroup;
var DatePicker = require('./DatePicker');
exports.DatePicker = DatePicker;
var DatePickerPopup = require('./DatePickerPopup');
exports.DatePickerPopup = DatePickerPopup;
var FieldControl = require('./FieldControl');
exports.FieldControl = FieldControl;
var FieldLabel = require('./FieldLabel');
exports.FieldLabel = FieldLabel;
var Group = require('./Group');
exports.Group = Group;
var GroupBody = require('./GroupBody');
exports.GroupBody = GroupBody;
var GroupFooter = require('./GroupFooter');
exports.GroupFooter = GroupFooter;
var GroupHeader = require('./GroupHeader');
exports.GroupHeader = GroupHeader;
var GroupInner = require('./GroupInner');
exports.GroupInner = GroupInner;
var Item = require('./Item');
exports.Item = Item;
var ItemContent = require('./ItemContent');
exports.ItemContent = ItemContent;
var ItemInner = require('./ItemInner');
exports.ItemInner = ItemInner;
var ItemMedia = require('./ItemMedia');
exports.ItemMedia = ItemMedia;
var ItemNote = require('./ItemNote');
exports.ItemNote = ItemNote;
var ItemSubTitle = require('./ItemSubTitle');
exports.ItemSubTitle = ItemSubTitle;
var ItemTitle = require('./ItemTitle');
exports.ItemTitle = ItemTitle;
var LabelInput = require('./LabelInput');
exports.LabelInput = LabelInput;
var LabelSelect = require('./LabelSelect');
exports.LabelSelect = LabelSelect;
var LabelTextarea = require('./LabelTextarea');
exports.LabelTextarea = LabelTextarea;
var LabelValue = require('./LabelValue');
exports.LabelValue = LabelValue;
var ListHeader = require('./ListHeader');
exports.ListHeader = ListHeader;
var NavigationBar = require('./NavigationBar');
exports.NavigationBar = NavigationBar;
var Popup = require('./Popup');
exports.Popup = Popup;
var PopupIcon = require('./PopupIcon');
exports.PopupIcon = PopupIcon;
var RadioList = require('./RadioList');
exports.RadioList = RadioList;
var SearchField = require('./SearchField');
exports.SearchField = SearchField;
var SegmentedControl = require('./SegmentedControl');
exports.SegmentedControl = SegmentedControl;
var Switch = require('./Switch');
exports.Switch = Switch;
var Tabs = require('./Tabs');
exports.Tabs = Tabs;
var Textarea = require('./Textarea');

exports.Textarea = Textarea;
// depends on above
var Input = require('./Input');
exports.Input = Input;
},{"./Alertbar":24,"./Button":25,"./ButtonGroup":26,"./DatePicker":27,"./DatePickerPopup":28,"./FieldControl":29,"./FieldLabel":30,"./Group":31,"./GroupBody":32,"./GroupFooter":33,"./GroupHeader":34,"./GroupInner":35,"./Input":36,"./Item":37,"./ItemContent":38,"./ItemInner":39,"./ItemMedia":40,"./ItemNote":41,"./ItemSubTitle":42,"./ItemTitle":43,"./LabelInput":44,"./LabelSelect":45,"./LabelTextarea":46,"./LabelValue":47,"./ListHeader":48,"./NavigationBar":49,"./Popup":50,"./PopupIcon":51,"./RadioList":52,"./SearchField":53,"./SegmentedControl":54,"./Switch":55,"./Tabs":56,"./Textarea":57}],59:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],60:[function(require,module,exports){
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

// Include a performance.now polyfill
(function () {

	if ('performance' in window === false) {
		window.performance = {};
	}

	// IE 8
	Date.now = (Date.now || function () {
		return new Date().getTime();
	});

	if ('now' in window.performance === false) {
		var offset = window.performance.timing && window.performance.timing.navigationStart ? window.performance.timing.navigationStart
		                                                                                    : Date.now();

		window.performance.now = function () {
			return Date.now() - offset;
		};
	}

})();

var TWEEN = TWEEN || (function () {

	var _tweens = [];

	return {

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function (tween) {

			_tweens.push(tween);

		},

		remove: function (tween) {

			var i = _tweens.indexOf(tween);

			if (i !== -1) {
				_tweens.splice(i, 1);
			}

		},

		update: function (time) {

			if (_tweens.length === 0) {
				return false;
			}

			var i = 0;

			time = time !== undefined ? time : window.performance.now();

			while (i < _tweens.length) {

				if (_tweens[i].update(time)) {
					i++;
				} else {
					_tweens.splice(i, 1);
				}

			}

			return true;

		}
	};

})();

TWEEN.Tween = function (object) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	// Set all starting values present on the target object
	for (var field in object) {
		_valuesStart[field] = parseFloat(object[field], 10);
	}

	this.to = function (properties, duration) {

		if (duration !== undefined) {
			_duration = duration;
		}

		_valuesEnd = properties;

		return this;

	};

	this.start = function (time) {

		TWEEN.add(this);

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : window.performance.now();
		_startTime += _delayTime;

		for (var property in _valuesEnd) {

			// Check if an Array was provided as property value
			if (_valuesEnd[property] instanceof Array) {

				if (_valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

			}

			// If `to()` specifies a property that doesn't exist in the source object,
			// we should not set that property in the object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			_valuesStart[property] = _object[property];

			if ((_valuesStart[property] instanceof Array) === false) {
				_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[property] = _valuesStart[property] || 0;

		}

		return this;

	};

	this.stop = function () {

		if (!_isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		_isPlaying = false;

		if (_onStopCallback !== null) {
			_onStopCallback.call(_object);
		}

		this.stopChainedTweens();
		return this;

	};

	this.stopChainedTweens = function () {

		for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
			_chainedTweens[i].stop();
		}

	};

	this.delay = function (amount) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function (times) {

		_repeat = times;
		return this;

	};

	this.yoyo = function (yoyo) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function (easing) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function (interpolation) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function (callback) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function (callback) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function (callback) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function (callback) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function (time) {

		var property;
		var elapsed;
		var value;

		if (time < _startTime) {
			return true;
		}

		if (_onStartCallbackFired === false) {

			if (_onStartCallback !== null) {
				_onStartCallback.call(_object);
			}

			_onStartCallbackFired = true;

		}

		elapsed = (time - _startTime) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = _easingFunction(elapsed);

		for (property in _valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (_valuesStart[property] === undefined) {
				continue;
			}

			var start = _valuesStart[property] || 0;
			var end = _valuesEnd[property];

			if (end instanceof Array) {

				_object[property] = _interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.startsWith('+') || end.startsWith('-')) {
						end = start + parseFloat(end, 10);
					} else {
						end = parseFloat(end, 10);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					_object[property] = start + (end - start) * value;
				}

			}

		}

		if (_onUpdateCallback !== null) {
			_onUpdateCallback.call(_object, value);
		}

		if (elapsed === 1) {

			if (_repeat > 0) {

				if (isFinite(_repeat)) {
					_repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in _valuesStartRepeat) {

					if (typeof (_valuesEnd[property]) === 'string') {
						_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[property];

						_valuesStartRepeat[property] = _valuesEnd[property];
						_valuesEnd[property] = tmp;
					}

					_valuesStart[property] = _valuesStartRepeat[property];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				_startTime = time + _delayTime;

				return true;

			} else {

				if (_onCompleteCallback !== null) {
					_onCompleteCallback.call(_object);
				}

				for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					_chainedTweens[i].start(_startTime + _duration);
				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));

		},

		Out: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);

		},

		InOut: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			if ((k *= 2) < 1) {
				return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
			}

			return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof module !== 'undefined' && typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else if (root !== undefined) {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

},{}],61:[function(require,module,exports){
"use strict";
var window = require("global/window")
var once = require("once")
var isFunction = require("is-function")
var parseHeaders = require("parse-headers")
var xtend = require("xtend")

module.exports = createXHR
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    var callback = options.callback
    if(typeof callback === "undefined"){
        throw new Error("callback argument missing")
    }
    callback = once(callback)

    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        callback(err, response, response.body)

    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data || null
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            aborted=true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}

function noop() {}

},{"global/window":8,"is-function":11,"once":12,"parse-headers":13,"xtend":62}],62:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],63:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsCssTransitionGroup = require('react-addons-css-transition-group');

var _reactAddonsCssTransitionGroup2 = _interopRequireDefault(_reactAddonsCssTransitionGroup);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _touchstonejs = require('touchstonejs');

// App Config
// ------------------------------

var PeopleStore = require('./stores/people');
var peopleStore = new PeopleStore();

var App = _react2['default'].createClass({
	displayName: 'App',

	mixins: [(0, _touchstonejs.createApp)()],

	childContextTypes: {
		peopleStore: _react2['default'].PropTypes.object
	},

	getChildContext: function getChildContext() {
		return {
			peopleStore: peopleStore
		};
	},

	componentDidMount: function componentDidMount() {
		// Hide the splash screen when the app is mounted
		if (navigator.splashscreen) {
			navigator.splashscreen.hide();
		}
	},

	render: function render() {
		var appWrapperClassName = 'app-wrapper device--' + (window.device || {}).platform;

		return _react2['default'].createElement(
			'div',
			{ className: appWrapperClassName },
			_react2['default'].createElement(
				'div',
				{ className: 'device-silhouette' },
				_react2['default'].createElement(
					_touchstonejs.ViewManager,
					{ name: 'app', defaultView: 'main' },
					_react2['default'].createElement(_touchstonejs.View, { name: 'main', component: MainViewController }),
					_react2['default'].createElement(_touchstonejs.View, { name: 'transitions-target-over', component: require('./views/transitions-target-over') })
				)
			)
		);
	}
});

// Main Controller
// ------------------------------

var MainViewController = _react2['default'].createClass({
	displayName: 'MainViewController',

	render: function render() {
		return _react2['default'].createElement(
			_touchstonejs.Container,
			null,
			_react2['default'].createElement(_touchstonejs.UI.NavigationBar, { name: 'main' }),
			_react2['default'].createElement(
				_touchstonejs.ViewManager,
				{ name: 'main', defaultView: 'tabs' },
				_react2['default'].createElement(_touchstonejs.View, { name: 'tabs', component: TabViewController })
			)
		);
	}
});

// Tab Controller
// ------------------------------

var lastSelectedTab = 'lists';
var TabViewController = _react2['default'].createClass({
	displayName: 'TabViewController',

	getInitialState: function getInitialState() {
		return {
			selectedTab: lastSelectedTab
		};
	},

	onViewChange: function onViewChange(nextView) {
		lastSelectedTab = nextView;

		this.setState({
			selectedTab: nextView
		});
	},

	selectTab: function selectTab(value) {
		var viewProps = undefined;

		this.refs.vm.transitionTo(value, {
			transition: 'instant',
			viewProps: viewProps
		});

		this.setState({
			selectedTab: value
		});
	},

	render: function render() {
		var selectedTab = this.state.selectedTab;
		var selectedTabSpan = selectedTab;

		if (selectedTab === 'lists' || selectedTab === 'list-simple' || selectedTab === 'list-complex' || selectedTab === 'list-details') {
			selectedTabSpan = 'lists';
		}

		if (selectedTab === 'transitions' || selectedTab === 'transitions-target') {
			selectedTabSpan = 'transitions';
		}

		return _react2['default'].createElement(
			_touchstonejs.Container,
			null,
			_react2['default'].createElement(
				_touchstonejs.ViewManager,
				{ ref: 'vm', name: 'tabs', defaultView: selectedTab, onViewChange: this.onViewChange },
				_react2['default'].createElement(_touchstonejs.View, { name: 'lists', component: require('./views/lists') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'list-simple', component: require('./views/list-simple') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'list-complex', component: require('./views/list-complex') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'list-details', component: require('./views/list-details') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'form', component: require('./views/form') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'controls', component: require('./views/controls') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'transitions', component: require('./views/transitions') }),
				_react2['default'].createElement(_touchstonejs.View, { name: 'transitions-target', component: require('./views/transitions-target') })
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Tabs.Navigator,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.Tabs.Tab,
					{ onTap: this.selectTab.bind(this, 'lists'), selected: selectedTabSpan === 'lists' },
					_react2['default'].createElement('span', { className: 'Tabs-Icon Tabs-Icon--lists' }),
					_react2['default'].createElement(
						_touchstonejs.UI.Tabs.Label,
						null,
						'Lists'
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Tabs.Tab,
					{ onTap: this.selectTab.bind(this, 'form'), selected: selectedTabSpan === 'form' },
					_react2['default'].createElement('span', { className: 'Tabs-Icon Tabs-Icon--forms' }),
					_react2['default'].createElement(
						_touchstonejs.UI.Tabs.Label,
						null,
						'Forms'
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Tabs.Tab,
					{ onTap: this.selectTab.bind(this, 'controls'), selected: selectedTabSpan === 'controls' },
					_react2['default'].createElement('span', { className: 'Tabs-Icon Tabs-Icon--controls' }),
					_react2['default'].createElement(
						_touchstonejs.UI.Tabs.Label,
						null,
						'Controls'
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Tabs.Tab,
					{ onTap: this.selectTab.bind(this, 'transitions'), selected: selectedTabSpan === 'transitions' },
					_react2['default'].createElement('span', { className: 'Tabs-Icon Tabs-Icon--transitions' }),
					_react2['default'].createElement(
						_touchstonejs.UI.Tabs.Label,
						null,
						'Transitions'
					)
				)
			)
		);
	}
});

function startApp() {
	if (window.StatusBar) {
		window.StatusBar.styleDefault();
	}
	_reactDom2['default'].render(_react2['default'].createElement(App, null), document.getElementById('app'));
}

if (!window.cordova) {
	startApp();
} else {
	document.addEventListener('deviceready', startApp, false);
}

},{"./stores/people":64,"./views/controls":65,"./views/form":66,"./views/list-complex":67,"./views/list-details":68,"./views/list-simple":69,"./views/lists":70,"./views/transitions":73,"./views/transitions-target":72,"./views/transitions-target-over":71,"react":undefined,"react-addons-css-transition-group":undefined,"react-dom":undefined,"touchstonejs":21}],64:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var EventEmitter = require('events').EventEmitter;

var async = require('async');
var httpify = require('httpify');

var apiUrl = window.location.protocol === 'https:' ? 'https://randomuser.me/api?nat=au&results=16' : 'http://api.randomuser.me/?nat=au&results=16';

function PeopleStore() {
	EventEmitter.call(this);

	// initialize internal cache
	var storage = this.cache = {
		people: []
	};
	var self = this;

	// Dispatchers
	this.starQueue = async.queue(function (data, callback) {
		var id = data.id;
		var starred = data.starred;

		// update internal data
		self.cache.people.filter(function (person) {
			return person.id === id;
		}).forEach(function (person) {
			return person.isStarred = starred;
		});

		// emit events
		self.emit('people-updated', storage.people);

		callback();
	}, 1);

	this.refreshQueue = async.queue(function (_, callback) {
		// update
		httpify({
			method: 'GET',
			url: apiUrl
		}, function (err, res) {
			if (err) return callback(err);

			storage.people = res.body.results.map(function (p) {
				return p.user;
			});

			// post process new data
			storage.people.forEach(function (person, i) {
				person.id = i;
				person.name.first = person.name.first[0].toUpperCase() + person.name.first.slice(1);
				person.name.last = person.name.last[0].toUpperCase() + person.name.last.slice(1);
				person.name.initials = person.name.first[0] + person.name.last[0];
				person.name.full = person.name.first + ' ' + person.name.last;
				person.category = Math.random() > 0.5 ? 'A' : 'B';
				person.github = person.name.first.toLowerCase() + person.name.last.toLowerCase();
				person.picture = person.picture.medium;
				person.twitter = '@' + person.name.first.toLowerCase() + Math.random().toString(32).slice(2, 5);
			});

			// emit events
			self.emit('people-updated', storage.people);
			self.emit('refresh');

			callback(null, storage.people);
		});
	}, 1);

	// refresh immediately
	this.refresh();
}

_extends(PeopleStore.prototype, EventEmitter.prototype);

// Intents
PeopleStore.prototype.refresh = function (callback) {
	this.refreshQueue.push(null, callback);
};

PeopleStore.prototype.star = function (_ref, starred, callback) {
	var id = _ref.id;

	this.starQueue.push({ id: id, starred: starred }, callback);
};

// Getters
PeopleStore.prototype.getPeople = function () {
	return this.cache.people;
};

module.exports = PeopleStore;

},{"async":1,"events":6,"httpify":9}],65:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var _reactTimers = require('react-timers');

var _reactTimers2 = _interopRequireDefault(_reactTimers);

var _touchstonejs = require('touchstonejs');

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	mixins: [_reactTimers2['default']],
	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation() {
			return {
				title: 'Controls'
			};
		}
	},

	getInitialState: function getInitialState() {
		return {
			alertbar: {
				visible: false,
				type: '',
				text: ''
			},
			popup: {
				visible: false
			}
		};
	},

	showLoadingPopup: function showLoadingPopup() {
		var _this = this;

		this.setState({
			popup: {
				visible: true,
				loading: true,
				header: 'Loading',
				iconName: 'ion-load-c',
				iconType: 'default'
			}
		});

		this.setTimeout(function () {
			_this.setState({
				popup: {
					visible: true,
					loading: false,
					header: 'Done!',
					iconName: 'ion-ios-checkmark',
					iconType: 'success'
				}
			});
		}, 2000);

		this.setTimeout(function () {
			_this.setState({
				popup: {
					visible: false
				}
			});
		}, 3000);
	},

	showAlertbar: function showAlertbar(type, text) {
		var _this2 = this;

		this.setState({
			alertbar: {
				visible: true,
				type: type,
				text: text
			}
		});

		this.setTimeout(function () {
			_this2.setState({
				alertbar: {
					visible: false
				}
			});
		}, 2000);
	},

	handleModeChange: function handleModeChange(newMode) {
		var selectedItem = newMode;

		if (this.state.selectedMode === newMode) {
			selectedItem = null;
		}

		this.setState({
			selectedMode: selectedItem
		});
	},

	render: function render() {
		var alertbar = this.state.alertbar;

		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ scrollable: true },
			_react2['default'].createElement(
				_touchstonejs.UI.Alertbar,
				{ type: alertbar.type || 'default', visible: alertbar.visible, animated: true },
				alertbar.text || ''
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				{ hasTopGutter: true },
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Segmented Control'
				),
				_react2['default'].createElement(_touchstonejs.UI.SegmentedControl, { value: this.state.selectedMode, onChange: this.handleModeChange, hasGutter: true, options: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }, { label: 'Four', value: 'four' }] })
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Alert Bar'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.ButtonGroup,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.Button,
						{ type: 'primary', onTap: this.showAlertbar.bind(this, 'danger', 'No Internet Connection'), disabled: this.state.alertbar.visible },
						'Danger'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.Button,
						{ type: 'primary', onTap: this.showAlertbar.bind(this, 'warning', 'Connecting...'), disabled: this.state.alertbar.visible },
						'Warning'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.Button,
						{ type: 'primary', onTap: this.showAlertbar.bind(this, 'success', 'Connected'), disabled: this.state.alertbar.visible },
						'Success'
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Popup'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Button,
					{ type: 'primary', onTap: this.showLoadingPopup, disabled: this.state.popup.visible },
					'Show Popup'
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Application State'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:non-existent', transition: 'show-from-right' },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Invalid View'
							)
						)
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Popup,
				{ visible: this.state.popup.visible },
				_react2['default'].createElement(_touchstonejs.UI.PopupIcon, { name: this.state.popup.iconName, type: this.state.popup.iconType, spinning: this.state.popup.loading }),
				_react2['default'].createElement(
					'div',
					null,
					_react2['default'].createElement(
						'strong',
						null,
						this.state.popup.header
					)
				)
			)
		);
	}
});

},{"react":undefined,"react-container":undefined,"react-tappable":undefined,"react-timers":15,"touchstonejs":21}],66:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _cordovaDialogs = require('cordova-dialogs');

var _cordovaDialogs2 = _interopRequireDefault(_cordovaDialogs);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var _touchstonejs = require('touchstonejs');

var scrollable = _reactContainer2['default'].initScrollable();

// html5 input types for testing
// omitted: button, checkbox, radio, image, hidden, reset, submit
var HTML5_INPUT_TYPES = ['color', 'date', 'datetime', 'datetime-local', 'email', 'file', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'];
var FLAVOURS = [{ label: 'Vanilla', value: 'vanilla' }, { label: 'Chocolate', value: 'chocolate' }, { label: 'Caramel', value: 'caramel' }, { label: 'Strawberry', value: 'strawberry' }];

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation() {
			return {
				title: 'Forms'
			};
		}
	},

	getInitialState: function getInitialState() {
		return {
			flavourLabelSelect: 'chocolate',
			flavourRadioList: 'chocolate',
			switchValue: true
		};
	},

	handleRadioListChange: function handleRadioListChange(key, newValue) {
		console.log('handleFlavourChange:', key, newValue);
		var newState = {};
		newState[key] = newValue;

		this.setState(newState);
	},

	handleLabelSelectChange: function handleLabelSelectChange(key, event) {
		console.log('handleFlavourChange:', key, event.target.value);
		var newState = {};
		newState[key] = event.target.value;

		this.setState(newState);
	},

	handleSwitch: function handleSwitch(key, event) {
		var newState = {};
		newState[key] = !this.state[key];

		this.setState(newState);
	},

	alert: function alert(message) {
		_cordovaDialogs2['default'].alert(message, function () {}, null);
	},

	// used for testing
	renderInputTypes: function renderInputTypes() {
		return HTML5_INPUT_TYPES.map(function (type) {
			return _react2['default'].createElement(_touchstonejs.UI.LabelInput, { key: type, type: type, label: type, placeholder: type });
		});
	},

	showDatePicker: function showDatePicker() {
		this.setState({ datePicker: true });
	},

	handleDatePickerChange: function handleDatePickerChange(d) {
		this.setState({ datePicker: false, date: d });
	},

	formatDate: function formatDate(date) {
		if (date) {
			return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
		}
	},

	render: function render() {

		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ fill: true },
			_react2['default'].createElement(
				_reactContainer2['default'],
				{ scrollable: scrollable },
				_react2['default'].createElement(
					_touchstonejs.UI.Group,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.GroupHeader,
						null,
						'Checkbox'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.GroupBody,
						null,
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							null,
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									_touchstonejs.UI.FieldLabel,
									null,
									'Switch'
								),
								_react2['default'].createElement(_touchstonejs.UI.Switch, { onTap: this.handleSwitch.bind(this, 'switchValue'), on: this.state.switchValue })
							)
						),
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							null,
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									_touchstonejs.UI.FieldLabel,
									null,
									'Disabled'
								),
								_react2['default'].createElement(_touchstonejs.UI.Switch, { disabled: true })
							)
						)
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Group,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.GroupHeader,
						null,
						'Radio'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.GroupBody,
						null,
						_react2['default'].createElement(_touchstonejs.UI.RadioList, { value: this.state.flavourRadioList, onChange: this.handleRadioListChange.bind(this, 'flavourRadioList'), options: FLAVOURS })
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Group,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.GroupHeader,
						null,
						'Inputs'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.GroupBody,
						null,
						_react2['default'].createElement(_touchstonejs.UI.Input, { placeholder: 'Default' }),
						_react2['default'].createElement(_touchstonejs.UI.Input, { defaultValue: 'With Value', placeholder: 'Placeholder' }),
						_react2['default'].createElement(_touchstonejs.UI.Textarea, { defaultValue: 'Longtext is good for bios etc.', placeholder: 'Longtext' })
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Group,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.GroupHeader,
						null,
						'Labelled Inputs'
					),
					_react2['default'].createElement(
						_touchstonejs.UI.GroupBody,
						null,
						_react2['default'].createElement(_touchstonejs.UI.LabelInput, { type: 'email', label: 'Email', placeholder: 'your.name@example.com' }),
						_react2['default'].createElement(
							_reactTappable2['default'],
							{ component: 'label', onTap: this.showDatePicker },
							_react2['default'].createElement(_touchstonejs.UI.LabelValue, { label: 'Date', value: this.formatDate(this.state.date), placeholder: 'Select a date' })
						),
						_react2['default'].createElement(_touchstonejs.UI.LabelInput, { type: 'url', label: 'URL', placeholder: 'http://www.yourwebsite.com' }),
						_react2['default'].createElement(_touchstonejs.UI.LabelInput, { noedit: true, label: 'No Edit', defaultValue: 'Un-editable, scrollable, selectable content' }),
						_react2['default'].createElement(_touchstonejs.UI.LabelSelect, { label: 'Flavour', value: this.state.flavourLabelSelect, onChange: this.handleLabelSelectChange.bind(this, 'flavourLabelSelect'), options: FLAVOURS })
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Button,
					{ type: 'primary', onTap: this.alert.bind(this, 'You clicked the Primary Button') },
					'Primary Button'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Button,
					{ onTap: this.alert.bind(this, 'You clicked the Default Button') },
					'Default Button'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Button,
					{ type: 'danger', onTap: this.alert.bind(this, 'You clicked the Danger Button') },
					'Danger Button'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.Button,
					{ type: 'danger', onTap: this.alert.bind(this, 'You clicked the Danger Button'), disabled: true },
					'Disabled Button'
				)
			),
			_react2['default'].createElement(_touchstonejs.UI.DatePickerPopup, { visible: this.state.datePicker, date: this.state.date, onChange: this.handleDatePickerChange })
		);
	}
});
/*<UI.Group>
<UI.GroupHeader>Input Type Experiment</UI.GroupHeader>
<UI.GroupBody>
	{this.renderInputTypes()}
</UI.GroupBody>
</UI.Group>*/

},{"cordova-dialogs":5,"react":undefined,"react-container":undefined,"react-tappable":undefined,"touchstonejs":21}],67:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactSentry = require('react-sentry');

var _reactSentry2 = _interopRequireDefault(_reactSentry);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var _touchstonejs = require('touchstonejs');

var scrollable = _reactContainer2['default'].initScrollable();

var ComplexLinkItem = _react2['default'].createClass({
	displayName: 'ComplexLinkItem',

	contextTypes: { peopleStore: _react2['default'].PropTypes.object.isRequired },

	toggleStar: function toggleStar() {
		var person = this.props.person;

		this.context.peopleStore.star(person, !person.isStarred);
	},

	render: function render() {
		var person = this.props.person;

		return _react2['default'].createElement(
			_touchstonejs.Link,
			{ to: 'tabs:list-details', transition: 'show-from-right', viewProps: { person: person, prevView: 'list-complex' } },
			_react2['default'].createElement(
				_touchstonejs.UI.Item,
				null,
				_react2['default'].createElement(_touchstonejs.UI.ItemMedia, { avatar: person.picture, avatarInitials: person.initials }),
				_react2['default'].createElement(
					_touchstonejs.UI.ItemInner,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.ItemContent,
						null,
						_react2['default'].createElement(
							_touchstonejs.UI.ItemTitle,
							null,
							person.name.full
						),
						_react2['default'].createElement(
							_touchstonejs.UI.ItemSubTitle,
							null,
							person.email || ''
						)
					),
					_react2['default'].createElement(
						_reactTappable2['default'],
						{ onTap: this.toggleStar, stopPropagation: true },
						_react2['default'].createElement(_touchstonejs.UI.ItemNote, { icon: person.isStarred ? 'ion-ios-star' : 'ion-ios-star-outline', type: person.isStarred ? 'warning' : 'default', className: 'ion-lg' })
					)
				)
			)
		);
	}
});

// FIXME: this bit is global and hacky, expect it to change
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

function getNavigation(props, app, filterStarred) {
	return {
		leftLabel: 'Lists',
		leftArrow: true,
		leftAction: function leftAction() {
			app.transitionTo('tabs:lists', { transition: 'reveal-from-right' });
		},
		rightLabel: filterStarred ? 'All' : 'Starred',
		rightAction: emitter.emit.bind(emitter, 'navigationBarRightAction'),
		title: 'Complex'
	};
}

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	contextTypes: {
		app: _react2['default'].PropTypes.object,
		peopleStore: _react2['default'].PropTypes.object.isRequired
	},
	mixins: [_reactSentry2['default']],

	statics: {
		navigationBar: 'main',
		getNavigation: getNavigation
	},

	getInitialState: function getInitialState() {
		return {
			filterStarred: false,
			people: this.context.peopleStore.getPeople()
		};
	},

	componentDidMount: function componentDidMount() {
		var _this = this;

		this.watch(this.context.peopleStore, 'people-updated', function (people) {
			_this.setState({ people: people });
		});

		this.watch(emitter, 'navigationBarRightAction', this.toggleStarred);
	},

	toggleStarred: function toggleStarred() {
		var filterStarred = !this.state.filterStarred;
		this.setState({ filterStarred: filterStarred });
		this.context.app.navigationBars.main.update(getNavigation({}, this.context.app, filterStarred));
	},

	handleModeChange: function handleModeChange(newMode) {
		var selectedMode = newMode;

		if (this.state.selectedMode === newMode) {
			selectedMode = null;
		}

		this.setState({ selectedMode: selectedMode });
	},

	render: function render() {
		var _state = this.state;
		var people = _state.people;
		var filterStarred = _state.filterStarred;
		var selectedMode = _state.selectedMode;

		if (filterStarred) {
			people = people.filter(function (person) {
				return person.isStarred;
			});
		}

		if (selectedMode === 'A' || selectedMode === 'B') {
			people = people.filter(function (person) {
				return person.category === selectedMode;
			});
		}

		function sortByName(a, b) {
			return a.name.full.localeCompare(b.name.full);
		}

		var sortedPeople = people.sort(sortByName);
		var results = undefined;

		if (sortedPeople.length) {
			var aPeople = sortedPeople.filter(function (person) {
				return person.category === 'A';
			}).map(function (person, i) {
				return _react2['default'].createElement(ComplexLinkItem, { key: 'persona' + i, person: person });
			});

			var bPeople = sortedPeople.filter(function (person) {
				return person.category === 'B';
			}).map(function (person, i) {
				return _react2['default'].createElement(ComplexLinkItem, { key: 'personb' + i, person: person });
			});

			results = _react2['default'].createElement(
				_touchstonejs.UI.GroupBody,
				null,
				aPeople.length > 0 ? _react2['default'].createElement(
					_touchstonejs.UI.ListHeader,
					{ sticky: true },
					'Category A'
				) : '',
				aPeople,
				bPeople.length > 0 ? _react2['default'].createElement(
					_touchstonejs.UI.ListHeader,
					{ sticky: true },
					'Category B'
				) : '',
				bPeople
			);
		} else {
			results = _react2['default'].createElement(
				_reactContainer2['default'],
				{ direction: 'column', align: 'center', justify: 'center', className: 'no-results' },
				_react2['default'].createElement('div', { className: 'no-results__icon ion-ios-star' }),
				_react2['default'].createElement(
					'div',
					{ className: 'no-results__text' },
					'Go star some people!'
				)
			);
		}

		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ scrollable: scrollable },
			_react2['default'].createElement(_touchstonejs.UI.SegmentedControl, { value: this.state.selectedMode, onChange: this.handleModeChange, hasGutter: true, equalWidthSegments: true, options: [{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }] }),
			results
		);
	}
});

},{"events":6,"react":undefined,"react-container":undefined,"react-sentry":14,"react-tappable":undefined,"touchstonejs":21}],68:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation(props, app) {
			var leftLabel = props.prevView === 'list-simple' ? 'Simple' : 'Complex';
			return {
				leftArrow: true,
				leftLabel: leftLabel,
				leftAction: function leftAction() {
					app.transitionTo('tabs:' + props.prevView, { transition: 'reveal-from-right' });
				},
				title: 'Person'
			};
		}
	},
	getDefaultProps: function getDefaultProps() {
		return {
			prevView: 'home'
		};
	},
	render: function render() {
		var person = this.props.person;

		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ direction: 'column' },
			_react2['default'].createElement(
				_reactContainer2['default'],
				{ fill: true, scrollable: true, ref: 'scrollContainer', className: 'PersonDetails' },
				_react2['default'].createElement('img', { src: person.picture, className: 'PersonDetails__avatar' }),
				_react2['default'].createElement(
					'div',
					{ className: 'PersonDetails__heading' },
					person.name.full
				),
				_react2['default'].createElement(
					'div',
					{ className: 'PersonDetails__text text-block' },
					person.email || ''
				),
				(person.twitter || person.github) && _react2['default'].createElement(
					'div',
					{ className: 'PersonDetails__profiles' },
					person.twitter && _react2['default'].createElement(
						'div',
						{ className: 'PersonDetails__profile' },
						_react2['default'].createElement('span', { className: 'PersonDetails__profile__icon ion-social-twitter' }),
						person.twitter
					),
					person.github && _react2['default'].createElement(
						'div',
						{ className: 'PersonDetails__profile' },
						_react2['default'].createElement('span', { className: 'PersonDetails__profile__icon ion-social-github' }),
						person.github
					)
				)
			)
		);
	}
});

},{"react":undefined,"react-container":undefined}],69:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactSentry = require('react-sentry');

var _reactSentry2 = _interopRequireDefault(_reactSentry);

var _reactTappable = require('react-tappable');

var _reactTappable2 = _interopRequireDefault(_reactTappable);

var _touchstonejs = require('touchstonejs');

var scrollable = _reactContainer2['default'].initScrollable({ left: 0, top: 44 });

var SimpleLinkItem = _react2['default'].createClass({
	displayName: 'SimpleLinkItem',

	propTypes: {
		person: _react2['default'].PropTypes.object.isRequired
	},

	render: function render() {
		return _react2['default'].createElement(
			_touchstonejs.Link,
			{ to: 'tabs:list-details', transition: 'show-from-right', viewProps: { person: this.props.person, prevView: 'list-simple' } },
			_react2['default'].createElement(
				_touchstonejs.UI.Item,
				{ showDisclosureArrow: true },
				_react2['default'].createElement(
					_touchstonejs.UI.ItemInner,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.ItemTitle,
						null,
						this.props.person.name.full
					)
				)
			)
		);
	}
});

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	mixins: [_reactSentry2['default']],
	contextTypes: { peopleStore: _react2['default'].PropTypes.object.isRequired },

	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation(props, app) {
			return {
				leftArrow: true,
				leftLabel: 'Lists',
				leftAction: function leftAction() {
					app.transitionTo('tabs:lists', { transition: 'reveal-from-right' });
				},
				title: 'Simple'
			};
		}
	},

	componentDidMount: function componentDidMount() {
		var _this = this;

		this.watch(this.context.peopleStore, 'people-updated', function (people) {
			_this.setState({ people: people });
		});
	},

	getInitialState: function getInitialState() {
		return {
			searchString: '',
			people: this.context.peopleStore.getPeople()
		};
	},

	clearSearch: function clearSearch() {
		this.setState({ searchString: '' });
	},

	updateSearch: function updateSearch(str) {
		this.setState({ searchString: str });
	},

	submitSearch: function submitSearch(str) {
		console.log(str);
	},

	render: function render() {
		var _state = this.state;
		var people = _state.people;
		var searchString = _state.searchString;

		var searchRegex = new RegExp(searchString);

		function searchFilter(person) {
			return searchRegex.test(person.name.full.toLowerCase());
		};
		function sortByName(a, b) {
			return a.name.full.localeCompare(b.name.full);
		};

		var filteredPeople = people.filter(searchFilter).sort(sortByName);

		var results = undefined;

		if (searchString && !filteredPeople.length) {
			results = _react2['default'].createElement(
				_reactContainer2['default'],
				{ direction: 'column', align: 'center', justify: 'center', className: 'no-results' },
				_react2['default'].createElement('div', { className: 'no-results__icon ion-ios-search-strong' }),
				_react2['default'].createElement(
					'div',
					{ className: 'no-results__text' },
					'No results for "' + searchString + '"'
				)
			);
		} else {
			results = _react2['default'].createElement(
				_touchstonejs.UI.GroupBody,
				null,
				filteredPeople.map(function (person, i) {
					return _react2['default'].createElement(SimpleLinkItem, { key: 'person' + i, person: person });
				})
			);
		}

		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ ref: 'scrollContainer', scrollable: scrollable },
			_react2['default'].createElement(_touchstonejs.UI.SearchField, { type: 'dark', value: this.state.searchString, onSubmit: this.submitSearch, onChange: this.updateSearch, onCancel: this.clearSearch, onClear: this.clearSearch, placeholder: 'Search...' }),
			results
		);
	}
});

},{"react":undefined,"react-container":undefined,"react-sentry":14,"react-tappable":undefined,"touchstonejs":21}],70:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _touchstonejs = require('touchstonejs');

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation() {
			return {
				title: 'Lists'
			};
		}
	},

	render: function render() {
		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ scrollable: true },
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Lists'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:list-simple', transition: 'show-from-right' },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Simple List'
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:list-complex', transition: 'show-from-right' },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Complex List'
							)
						)
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'GroupHeader'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.UI.GroupInner,
						null,
						_react2['default'].createElement(
							'p',
							null,
							'Use groups to contain content or lists. Where appropriate a Group should be accompanied by a GroupHeading and optionally a GroupFooter.'
						),
						'GroupBody will apply the background for content inside groups.'
					)
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupFooter,
					null,
					'GroupFooter: useful for a detailed explanation to express the intentions of the Group. Try to be concise - remember that users are likely to read the text in your UI many times.'
				)
			)
		);
	}
});

},{"react":undefined,"react-container":undefined,"touchstonejs":21}],71:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTimers = require('react-timers');

var _reactTimers2 = _interopRequireDefault(_reactTimers);

var _touchstonejs = require('touchstonejs');

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	mixins: [_touchstonejs.Mixins.Transitions, _reactTimers2['default']],
	componentDidMount: function componentDidMount() {
		var self = this;
		this.setTimeout(function () {
			self.transitionTo('app:main', { transition: 'fade' });
		}, 1000);
	},
	render: function render() {
		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ direction: 'column' },
			_react2['default'].createElement(_touchstonejs.UI.NavigationBar, { name: 'over', title: this.props.navbarTitle }),
			_react2['default'].createElement(
				_reactContainer2['default'],
				{ direction: 'column', align: 'center', justify: 'center', className: 'no-results' },
				_react2['default'].createElement('div', { className: 'no-results__icon ion-ios-photos' }),
				_react2['default'].createElement(
					'div',
					{ className: 'no-results__text' },
					'Hold on a sec...'
				)
			)
		);
	}
});

},{"react":undefined,"react-container":undefined,"react-timers":15,"touchstonejs":21}],72:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTimers = require('react-timers');

var _reactTimers2 = _interopRequireDefault(_reactTimers);

var _touchstonejs = require('touchstonejs');

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	mixins: [_touchstonejs.Mixins.Transitions, _reactTimers2['default']],
	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation(props) {
			return {
				title: props.navbarTitle
			};
		}
	},
	componentDidMount: function componentDidMount() {
		var self = this;

		this.setTimeout(function () {
			self.transitionTo('tabs:transitions', { transition: 'fade' });
		}, 1000);
	},
	render: function render() {
		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ direction: 'column', align: 'center', justify: 'center', className: 'no-results' },
			_react2['default'].createElement('div', { className: 'no-results__icon ion-ios-photos' }),
			_react2['default'].createElement(
				'div',
				{ className: 'no-results__text' },
				'Hold on a sec...'
			)
		);
	}
});

},{"react":undefined,"react-container":undefined,"react-timers":15,"touchstonejs":21}],73:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _reactContainer = require('react-container');

var _reactContainer2 = _interopRequireDefault(_reactContainer);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _touchstonejs = require('touchstonejs');

var scrollable = _reactContainer2['default'].initScrollable();

module.exports = _react2['default'].createClass({
	displayName: 'exports',

	statics: {
		navigationBar: 'main',
		getNavigation: function getNavigation() {
			return {
				title: 'Transitions'
			};
		}
	},

	render: function render() {
		return _react2['default'].createElement(
			_reactContainer2['default'],
			{ scrollable: scrollable },
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Default'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', viewProps: { navbarTitle: 'Instant' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Instant'
							)
						)
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Fade'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'fade', viewProps: { navbarTitle: 'Fade' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Fade'
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'fade-expand', viewProps: { navbarTitle: 'Fade Expand' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Fade Expand ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'fade-contract', viewProps: { navbarTitle: 'Fade Contract' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Fade Contract ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Show'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'show-from-left', viewProps: { navbarTitle: 'Show from Left' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Show from Left ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'show-from-right', viewProps: { navbarTitle: 'Show from Right' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Show from Right'
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'app:transitions-target-over', transition: 'show-from-top', viewProps: { navbarTitle: 'Show from Top' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Show from Top ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'app:transitions-target-over', transition: 'show-from-bottom', viewProps: { navbarTitle: 'Show from Bottom' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Show from Bottom'
							)
						)
					)
				)
			),
			_react2['default'].createElement(
				_touchstonejs.UI.Group,
				null,
				_react2['default'].createElement(
					_touchstonejs.UI.GroupHeader,
					null,
					'Reveal'
				),
				_react2['default'].createElement(
					_touchstonejs.UI.GroupBody,
					null,
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'reveal-from-left', viewProps: { navbarTitle: 'Reveal from Left' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Reveal from Left ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'tabs:transitions-target', transition: 'reveal-from-right', viewProps: { navbarTitle: 'Reveal from Right' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Reveal from Right'
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'app:transitions-target-over', transition: 'reveal-from-top', viewProps: { navbarTitle: 'Reveal from Top' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								_react2['default'].createElement(
									'span',
									null,
									'Reveal from Top ',
									_react2['default'].createElement(
										'span',
										{ className: 'text-muted' },
										'(non-standard)'
									)
								)
							)
						)
					),
					_react2['default'].createElement(
						_touchstonejs.Link,
						{ to: 'app:transitions-target-over', transition: 'reveal-from-bottom', viewProps: { navbarTitle: 'Reveal from Bottom' } },
						_react2['default'].createElement(
							_touchstonejs.UI.Item,
							{ showDisclosureArrow: true },
							_react2['default'].createElement(
								_touchstonejs.UI.ItemInner,
								null,
								'Reveal from Bottom'
							)
						)
					)
				)
			)
		);
	}
});

},{"react":undefined,"react-container":undefined,"touchstonejs":21}]},{},[63])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwibm9kZV9tb2R1bGVzL2JsYWNrbGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jb3Jkb3ZhLWRpYWxvZ3MvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9mb3ItZWFjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9nbG9iYWwvd2luZG93LmpzIiwibm9kZV9tb2R1bGVzL2h0dHBpZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaHR0cGlmeS9saWIvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9pcy1mdW5jdGlvbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vbmNlL29uY2UuanMiLCJub2RlX21vZHVsZXMvcGFyc2UtaGVhZGVycy9wYXJzZS1oZWFkZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LXNlbnRyeS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVhY3QtdGltZXJzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL2NvcmUvRXJyb3JWaWV3LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY29yZS9MaW5rLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY29yZS9WaWV3LmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvY29yZS9WaWV3TWFuYWdlci5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL2NvcmUvYW5pbWF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi9taXhpbnMvVHJhbnNpdGlvbnMuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi9taXhpbnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9BbGVydGJhci5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0J1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0J1dHRvbkdyb3VwLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvRGF0ZVBpY2tlci5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0RhdGVQaWNrZXJQb3B1cC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0ZpZWxkQ29udHJvbC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0ZpZWxkTGFiZWwuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Hcm91cC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0dyb3VwQm9keS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0dyb3VwRm9vdGVyLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvR3JvdXBIZWFkZXIuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Hcm91cElubmVyLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvSW5wdXQuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9JdGVtLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvSXRlbUNvbnRlbnQuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9JdGVtSW5uZXIuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9JdGVtTWVkaWEuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9JdGVtTm90ZS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0l0ZW1TdWJUaXRsZS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0l0ZW1UaXRsZS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0xhYmVsSW5wdXQuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9MYWJlbFNlbGVjdC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL0xhYmVsVGV4dGFyZWEuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9MYWJlbFZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvTGlzdEhlYWRlci5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL05hdmlnYXRpb25CYXIuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9Qb3B1cC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1BvcHVwSWNvbi5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1JhZGlvTGlzdC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1NlYXJjaEZpZWxkLmpzIiwibm9kZV9tb2R1bGVzL3RvdWNoc3RvbmVqcy9saWIvdWkvU2VnbWVudGVkQ29udHJvbC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1N3aXRjaC5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL1RhYnMuanMiLCJub2RlX21vZHVsZXMvdG91Y2hzdG9uZWpzL2xpYi91aS9UZXh0YXJlYS5qcyIsIm5vZGVfbW9kdWxlcy90b3VjaHN0b25lanMvbGliL3VpL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RyaW0vaW5kZXguanMiLCJub2RlX21vZHVsZXMvdHdlZW4uanMvc3JjL1R3ZWVuLmpzIiwibm9kZV9tb2R1bGVzL3hoci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94dGVuZC9pbW11dGFibGUuanMiLCIvVXNlcnMvYnd5eW91bmcvSWRlYVByb2plY3RzL0V4YW1wbGVzL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy9hcHAuanMiLCIvVXNlcnMvYnd5eW91bmcvSWRlYVByb2plY3RzL0V4YW1wbGVzL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy9zdG9yZXMvcGVvcGxlLmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvY29udHJvbHMuanMiLCIvVXNlcnMvYnd5eW91bmcvSWRlYVByb2plY3RzL0V4YW1wbGVzL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9mb3JtLmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvbGlzdC1jb21wbGV4LmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvbGlzdC1kZXRhaWxzLmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvbGlzdC1zaW1wbGUuanMiLCIvVXNlcnMvYnd5eW91bmcvSWRlYVByb2plY3RzL0V4YW1wbGVzL3RvdWNoc3RvbmVqcy1zdGFydGVyL3NyYy9qcy92aWV3cy9saXN0cy5qcyIsIi9Vc2Vycy9id3l5b3VuZy9JZGVhUHJvamVjdHMvRXhhbXBsZXMvdG91Y2hzdG9uZWpzLXN0YXJ0ZXIvc3JjL2pzL3ZpZXdzL3RyYW5zaXRpb25zLXRhcmdldC1vdmVyLmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvdHJhbnNpdGlvbnMtdGFyZ2V0LmpzIiwiL1VzZXJzL2J3eXlvdW5nL0lkZWFQcm9qZWN0cy9FeGFtcGxlcy90b3VjaHN0b25lanMtc3RhcnRlci9zcmMvanMvdmlld3MvdHJhbnNpdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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ZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBhc3luY1xuICogaHR0cHM6Ly9naXRodWIuY29tL2Nhb2xhbi9hc3luY1xuICpcbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQ2FvbGFuIE1jTWFob25cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGFzeW5jID0ge307XG4gICAgZnVuY3Rpb24gbm9vcCgpIHt9XG4gICAgZnVuY3Rpb24gaWRlbnRpdHkodikge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9Cb29sKHYpIHtcbiAgICAgICAgcmV0dXJuICEhdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm90SWQodikge1xuICAgICAgICByZXR1cm4gIXY7XG4gICAgfVxuXG4gICAgLy8gZ2xvYmFsIG9uIHRoZSBzZXJ2ZXIsIHdpbmRvdyBpbiB0aGUgYnJvd3NlclxuICAgIHZhciBwcmV2aW91c19hc3luYztcblxuICAgIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIChgc2VsZmApIGluIHRoZSBicm93c2VyLCBgZ2xvYmFsYFxuICAgIC8vIG9uIHRoZSBzZXJ2ZXIsIG9yIGB0aGlzYCBpbiBzb21lIHZpcnR1YWwgbWFjaGluZXMuIFdlIHVzZSBgc2VsZmBcbiAgICAvLyBpbnN0ZWFkIG9mIGB3aW5kb3dgIGZvciBgV2ViV29ya2VyYCBzdXBwb3J0LlxuICAgIHZhciByb290ID0gdHlwZW9mIHNlbGYgPT09ICdvYmplY3QnICYmIHNlbGYuc2VsZiA9PT0gc2VsZiAmJiBzZWxmIHx8XG4gICAgICAgICAgICB0eXBlb2YgZ2xvYmFsID09PSAnb2JqZWN0JyAmJiBnbG9iYWwuZ2xvYmFsID09PSBnbG9iYWwgJiYgZ2xvYmFsIHx8XG4gICAgICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHJvb3QgIT0gbnVsbCkge1xuICAgICAgICBwcmV2aW91c19hc3luYyA9IHJvb3QuYXN5bmM7XG4gICAgfVxuXG4gICAgYXN5bmMubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IHByZXZpb3VzX2FzeW5jO1xuICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG9ubHlfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIHdhcyBhbHJlYWR5IGNhbGxlZC5cIik7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJsaXR5IGZ1bmN0aW9ucyAvLy8vXG5cbiAgICB2YXIgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gX3RvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuXG4gICAgLy8gUG9ydGVkIGZyb20gdW5kZXJzY29yZS5qcyBpc09iamVjdFxuICAgIHZhciBfaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2lzQXJyYXlMaWtlKGFycikge1xuICAgICAgICByZXR1cm4gX2lzQXJyYXkoYXJyKSB8fCAoXG4gICAgICAgICAgICAvLyBoYXMgYSBwb3NpdGl2ZSBpbnRlZ2VyIGxlbmd0aCBwcm9wZXJ0eVxuICAgICAgICAgICAgdHlwZW9mIGFyci5sZW5ndGggPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggPj0gMCAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCAlIDEgPT09IDBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXJyYXlFYWNoKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihhcnJbaW5kZXhdLCBpbmRleCwgYXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9tYXAoYXJyLCBpdGVyYXRvcikge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmFuZ2UoY291bnQpIHtcbiAgICAgICAgcmV0dXJuIF9tYXAoQXJyYXkoY291bnQpLCBmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gaTsgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlZHVjZShhcnIsIGl0ZXJhdG9yLCBtZW1vKSB7XG4gICAgICAgIF9hcnJheUVhY2goYXJyLCBmdW5jdGlvbiAoeCwgaSwgYSkge1xuICAgICAgICAgICAgbWVtbyA9IGl0ZXJhdG9yKG1lbW8sIHgsIGksIGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZvckVhY2hPZihvYmplY3QsIGl0ZXJhdG9yKSB7XG4gICAgICAgIF9hcnJheUVhY2goX2tleXMob2JqZWN0KSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3Iob2JqZWN0W2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9pbmRleE9mKGFyciwgaXRlbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFycltpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIHZhciBfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9rZXlJdGVyYXRvcihjb2xsKSB7XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHZhciBsZW47XG4gICAgICAgIHZhciBrZXlzO1xuICAgICAgICBpZiAoX2lzQXJyYXlMaWtlKGNvbGwpKSB7XG4gICAgICAgICAgICBsZW4gPSBjb2xsLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGkgOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleXMgPSBfa2V5cyhjb2xsKTtcbiAgICAgICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8ga2V5c1tpXSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2ltaWxhciB0byBFUzYncyByZXN0IHBhcmFtIChodHRwOi8vYXJpeWEub2ZpbGFicy5jb20vMjAxMy8wMy9lczYtYW5kLXJlc3QtcGFyYW1ldGVyLmh0bWwpXG4gICAgLy8gVGhpcyBhY2N1bXVsYXRlcyB0aGUgYXJndW1lbnRzIHBhc3NlZCBpbnRvIGFuIGFycmF5LCBhZnRlciBhIGdpdmVuIGluZGV4LlxuICAgIC8vIEZyb20gdW5kZXJzY29yZS5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlL3B1bGwvMjE0MCkuXG4gICAgZnVuY3Rpb24gX3Jlc3RQYXJhbShmdW5jLCBzdGFydEluZGV4KSB7XG4gICAgICAgIHN0YXJ0SW5kZXggPSBzdGFydEluZGV4ID09IG51bGwgPyBmdW5jLmxlbmd0aCAtIDEgOiArc3RhcnRJbmRleDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KGFyZ3VtZW50cy5sZW5ndGggLSBzdGFydEluZGV4LCAwKTtcbiAgICAgICAgICAgIHZhciByZXN0ID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICByZXN0W2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleCArIHN0YXJ0SW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChzdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmd1bWVudHNbMF0sIHJlc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IHVudXNlZCBidXQgaGFuZGxlIGNhc2VzIG91dHNpZGUgb2YgdGhlIHN3aXRjaCBzdGF0ZW1lbnQ6XG4gICAgICAgICAgICAvLyB2YXIgYXJncyA9IEFycmF5KHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIC8vIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHN0YXJ0SW5kZXg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vICAgICBhcmdzW2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBhcmdzW3N0YXJ0SW5kZXhdID0gcmVzdDtcbiAgICAgICAgICAgIC8vIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IodmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG5cbiAgICAvLyBjYXB0dXJlIHRoZSBnbG9iYWwgcmVmZXJlbmNlIHRvIGd1YXJkIGFnYWluc3QgZmFrZVRpbWVyIG1vY2tzXG4gICAgdmFyIF9zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nICYmIHNldEltbWVkaWF0ZTtcblxuICAgIHZhciBfZGVsYXkgPSBfc2V0SW1tZWRpYXRlID8gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgX3NldEltbWVkaWF0ZShmbik7XG4gICAgfSA6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IF9kZWxheTtcbiAgICB9XG4gICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gX3NldEltbWVkaWF0ZSA/IF9kZWxheSA6IGFzeW5jLm5leHRUaWNrO1xuXG5cbiAgICBhc3luYy5mb3JFYWNoID1cbiAgICBhc3luYy5lYWNoID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2YoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID1cbiAgICBhc3luYy5lYWNoU2VyaWVzID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cblxuICAgIGFzeW5jLmZvckVhY2hMaW1pdCA9XG4gICAgYXN5bmMuZWFjaExpbWl0ID0gZnVuY3Rpb24gKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gX2VhY2hPZkxpbWl0KGxpbWl0KShhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZiA9XG4gICAgYXN5bmMuZWFjaE9mID0gZnVuY3Rpb24gKG9iamVjdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdCB8fCBbXTtcblxuICAgICAgICB2YXIgaXRlciA9IF9rZXlJdGVyYXRvcihvYmplY3QpO1xuICAgICAgICB2YXIga2V5LCBjb21wbGV0ZWQgPSAwO1xuXG4gICAgICAgIHdoaWxlICgoa2V5ID0gaXRlcigpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb21wbGV0ZWQgKz0gMTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXksIG9ubHlfb25jZShkb25lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcGxldGVkID09PSAwKSBjYWxsYmFjayhudWxsKTtcblxuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgICAgY29tcGxldGVkLS07XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoZWNrIGtleSBpcyBudWxsIGluIGNhc2UgaXRlcmF0b3IgaXNuJ3QgZXhoYXVzdGVkXG4gICAgICAgICAgICAvLyBhbmQgZG9uZSByZXNvbHZlZCBzeW5jaHJvbm91c2x5LlxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09PSBudWxsICYmIGNvbXBsZXRlZCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzID1cbiAgICBhc3luYy5lYWNoT2ZTZXJpZXMgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICBmdW5jdGlvbiBpdGVyYXRlKCkge1xuICAgICAgICAgICAgdmFyIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShpdGVyYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdGUoKTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLmZvckVhY2hPZkxpbWl0ID1cbiAgICBhc3luYy5lYWNoT2ZMaW1pdCA9IGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2VhY2hPZkxpbWl0KGxpbWl0KShvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9lYWNoT2ZMaW1pdChsaW1pdCkge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICAgICAgaWYgKGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuICAgICAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIHJlcGxlbmlzaCAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUgJiYgcnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocnVubmluZyA8IGxpbWl0ICYmICFlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGVuaXNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWxMaW1pdChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9lYWNoT2ZMaW1pdChsaW1pdCksIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9TZXJpZXMoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZlNlcmllcywgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hc3luY01hcChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGFyciA9IGFyciB8fCBbXTtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UoYXJyKSA/IFtdIDoge307XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLm1hcCA9IGRvUGFyYWxsZWwoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBTZXJpZXMgPSBkb1NlcmllcyhfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9hc3luY01hcCk7XG5cbiAgICAvLyByZWR1Y2Ugb25seSBoYXMgYSBzZXJpZXMgdmVyc2lvbiwgYXMgZG9pbmcgcmVkdWNlIGluIHBhcmFsbGVsIHdvbid0XG4gICAgLy8gd29yayBpbiBtYW55IHNpdHVhdGlvbnMuXG4gICAgYXN5bmMuaW5qZWN0ID1cbiAgICBhc3luYy5mb2xkbCA9XG4gICAgYXN5bmMucmVkdWNlID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIGZ1bmN0aW9uICh4LCBpLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgeCwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIG1lbW8gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvbGRyID1cbiAgICBhc3luYy5yZWR1Y2VSaWdodCA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmV2ZXJzZWQgPSBfbWFwKGFyciwgaWRlbnRpdHkpLnJldmVyc2UoKTtcbiAgICAgICAgYXN5bmMucmVkdWNlKHJldmVyc2VkLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gaXRlcmF0b3I7XG4gICAgICAgICAgICBpdGVyYXRvciA9IG1lbW87XG4gICAgICAgICAgICBtZW1vID0gX2lzQXJyYXkoYXJyKSA/IFtdIDoge307XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYy5lYWNoT2YoYXJyLCBmdW5jdGlvbih2LCBrLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgdiwgaywgY2IpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZmlsdGVyKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4OiBpbmRleCwgdmFsdWU6IHh9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5zZWxlY3QgPVxuICAgIGFzeW5jLmZpbHRlciA9IGRvUGFyYWxsZWwoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RMaW1pdCA9XG4gICAgYXN5bmMuZmlsdGVyTGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RTZXJpZXMgPVxuICAgIGFzeW5jLmZpbHRlclNlcmllcyA9IGRvU2VyaWVzKF9maWx0ZXIpO1xuXG4gICAgZnVuY3Rpb24gX3JlamVjdChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGZ1bmN0aW9uKHZhbHVlLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgICAgICBjYighdik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBhc3luYy5yZWplY3QgPSBkb1BhcmFsbGVsKF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdFNlcmllcyA9IGRvU2VyaWVzKF9yZWplY3QpO1xuXG4gICAgZnVuY3Rpb24gX2NyZWF0ZVRlc3RlcihlYWNoZm4sIGNoZWNrLCBnZXRSZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYikge1xuICAgICAgICAgICAgZnVuY3Rpb24gZG9uZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIGNiKGdldFJlc3VsdChmYWxzZSwgdm9pZCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBpdGVyYXRlZSh4LCBfLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghY2IpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYiAmJiBjaGVjayh2KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoZ2V0UmVzdWx0KHRydWUsIHgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgbGltaXQsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvcjtcbiAgICAgICAgICAgICAgICBpdGVyYXRvciA9IGxpbWl0O1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy5hbnkgPVxuICAgIGFzeW5jLnNvbWUgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5zb21lTGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLmFsbCA9XG4gICAgYXN5bmMuZXZlcnkgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgbm90SWQsIG5vdElkKTtcblxuICAgIGFzeW5jLmV2ZXJ5TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBub3RJZCwgbm90SWQpO1xuXG4gICAgZnVuY3Rpb24gX2ZpbmRHZXRSZXN1bHQodiwgeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgYXN5bmMuZGV0ZWN0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0U2VyaWVzID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZTZXJpZXMsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuXG4gICAgYXN5bmMuc29ydEJ5ID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLm1hcChhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKGVyciwgY3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7dmFsdWU6IHgsIGNyaXRlcmlhOiBjcml0ZXJpYX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBfbWFwKHJlc3VsdHMuc29ydChjb21wYXJhdG9yKSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBhcmF0b3IobGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYSwgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmF1dG8gPSBmdW5jdGlvbiAodGFza3MsIGNvbmN1cnJlbmN5LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgLy8gY29uY3VycmVuY3kgaXMgb3B0aW9uYWwsIHNoaWZ0IHRoZSBhcmdzLlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IHJlbWFpbmluZ1Rhc2tzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgdmFyIHJ1bm5pbmdUYXNrcyA9IDA7XG5cbiAgICAgICAgdmFyIGhhc0Vycm9yID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQoZm4pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2luZGV4T2YobGlzdGVuZXJzLCBmbik7XG4gICAgICAgICAgICBpZiAoaWR4ID49IDApIGxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB0YXNrQ29tcGxldGUoKSB7XG4gICAgICAgICAgICByZW1haW5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgX2FycmF5RWFjaChsaXN0ZW5lcnMuc2xpY2UoMCksIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2FycmF5RWFjaChrZXlzLCBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgdGFzayA9IF9pc0FycmF5KHRhc2tzW2tdKSA/IHRhc2tzW2tdOiBbdGFza3Nba11dO1xuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzLS07XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhZmVSZXN1bHRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIF9mb3JFYWNoT2YocmVzdWx0cywgZnVuY3Rpb24odmFsLCBya2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1tya2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNhZmVSZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZSh0YXNrQ29tcGxldGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCB0YXNrLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgLy8gcHJldmVudCBkZWFkLWxvY2tzXG4gICAgICAgICAgICB2YXIgbGVuID0gcmVxdWlyZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRlcDtcbiAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICAgICAgICAgIGlmICghKGRlcCA9IHRhc2tzW3JlcXVpcmVzW2xlbl1dKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBub25leGlzdGVudCBkZXBlbmRlbmN5IGluICcgKyByZXF1aXJlcy5qb2luKCcsICcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9pc0FycmF5KGRlcCkgJiYgX2luZGV4T2YoZGVwLCBrKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGN5Y2xpYyBkZXBlbmRlbmNpZXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZ1Rhc2tzIDwgY29uY3VycmVuY3kgJiYgX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tbdGFzay5sZW5ndGggLSAxXSh0YXNrQ2FsbGJhY2ssIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5yZXRyeSA9IGZ1bmN0aW9uKHRpbWVzLCB0YXNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgREVGQVVMVF9USU1FUyA9IDU7XG4gICAgICAgIHZhciBERUZBVUxUX0lOVEVSVkFMID0gMDtcblxuICAgICAgICB2YXIgYXR0ZW1wdHMgPSBbXTtcblxuICAgICAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgICAgIHRpbWVzOiBERUZBVUxUX1RJTUVTLFxuICAgICAgICAgICAgaW50ZXJ2YWw6IERFRkFVTFRfSU5URVJWQUxcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBwYXJzZVRpbWVzKGFjYywgdCl7XG4gICAgICAgICAgICBpZih0eXBlb2YgdCA9PT0gJ251bWJlcicpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHR5cGVvZiB0ID09PSAnb2JqZWN0Jyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodC50aW1lcywgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICAgICAgYWNjLmludGVydmFsID0gcGFyc2VJbnQodC5pbnRlcnZhbCwgMTApIHx8IERFRkFVTFRfSU5URVJWQUw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgYXJndW1lbnQgdHlwZSBmb3IgXFwndGltZXNcXCc6ICcgKyB0eXBlb2YgdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCA8IDEgfHwgbGVuZ3RoID4gMykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50cyAtIG11c3QgYmUgZWl0aGVyICh0YXNrKSwgKHRhc2ssIGNhbGxiYWNrKSwgKHRpbWVzLCB0YXNrKSBvciAodGltZXMsIHRhc2ssIGNhbGxiYWNrKScpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAyICYmIHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGltZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHBhcnNlVGltZXMob3B0cywgdGltZXMpO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgb3B0cy50YXNrID0gdGFzaztcblxuICAgICAgICBmdW5jdGlvbiB3cmFwcGVkVGFzayh3cmFwcGVkQ2FsbGJhY2ssIHdyYXBwZWRSZXN1bHRzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUF0dGVtcHQodGFzaywgZmluYWxBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2soZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2soIWVyciB8fCBmaW5hbEF0dGVtcHQsIHtlcnI6IGVyciwgcmVzdWx0OiByZXN1bHR9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd3JhcHBlZFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5SW50ZXJ2YWwoaW50ZXJ2YWwpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKG9wdHMudGltZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBmaW5hbEF0dGVtcHQgPSAhKG9wdHMudGltZXMtPTEpO1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KG9wdHMudGFzaywgZmluYWxBdHRlbXB0KSk7XG4gICAgICAgICAgICAgICAgaWYoIWZpbmFsQXR0ZW1wdCAmJiBvcHRzLmludGVydmFsID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlJbnRlcnZhbChvcHRzLmludGVydmFsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBvcHRzLmNhbGxiYWNrKShkYXRhLmVyciwgZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGNhbGxiYWNrIGlzIHBhc3NlZCwgcnVuIHRoaXMgYXMgYSBjb250cm9sbCBmbG93XG4gICAgICAgIHJldHVybiBvcHRzLmNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrO1xuICAgIH07XG5cbiAgICBhc3luYy53YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB3cmFwSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtlcnJdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbnN1cmVBc3luYyhpdGVyYXRvcikuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3BhcmFsbGVsKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UodGFza3MpID8gW10gOiB7fTtcblxuICAgICAgICBlYWNoZm4odGFza3MsIGZ1bmN0aW9uICh0YXNrLCBrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0YXNrKF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnBhcmFsbGVsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5wYXJhbGxlbExpbWl0ID0gZnVuY3Rpb24odGFza3MsIGxpbWl0LCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoX2VhY2hPZkxpbWl0KGxpbWl0KSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24odGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2ZTZXJpZXMsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLml0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VDYWxsYmFjayhpbmRleCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZm4oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG4gICAgfTtcblxuICAgIGFzeW5jLmFwcGx5ID0gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGNhbGxBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoXG4gICAgICAgICAgICAgICAgbnVsbCwgYXJncy5jb25jYXQoY2FsbEFyZ3MpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIF9jb25jYXQoZWFjaGZuLCBhcnIsIGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2IpIHtcbiAgICAgICAgICAgIGZuKHgsIGZ1bmN0aW9uIChlcnIsIHkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHkgfHwgW10pO1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGVzdC5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbbnVsbF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZG9XaGlsc3QgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKytjYWxscyA8PSAxIHx8IHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9VbnRpbCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmR1cmluZyA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuXG4gICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2hlY2spO1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKGVyciwgdHJ1dGgpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0cnV0aCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0ZXN0KGNoZWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9EdXJpbmcgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIGFzeW5jLmR1cmluZyhmdW5jdGlvbihuZXh0KSB7XG4gICAgICAgICAgICBpZiAoY2FsbHMrKyA8IDEpIHtcbiAgICAgICAgICAgICAgICBuZXh0KG51bGwsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5LCBwYXlsb2FkKSB7XG4gICAgICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihjb25jdXJyZW5jeSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwb3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDAgJiYgcS5pZGxlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2sgfHwgbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbmV4dChxLCB0YXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgd29ya2VycyAtPSAxO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHdvcmtlcnNMaXN0LCBmdW5jdGlvbiAod29ya2VyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtlciA9PT0gdGFzayAmJiAhcmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHdvcmtlcnNMaXN0ID0gW107XG4gICAgICAgIHZhciBxID0ge1xuICAgICAgICAgICAgdGFza3M6IFtdLFxuICAgICAgICAgICAgY29uY3VycmVuY3k6IGNvbmN1cnJlbmN5LFxuICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZCxcbiAgICAgICAgICAgIHNhdHVyYXRlZDogbm9vcCxcbiAgICAgICAgICAgIGVtcHR5OiBub29wLFxuICAgICAgICAgICAgZHJhaW46IG5vb3AsXG4gICAgICAgICAgICBzdGFydGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBhdXNlZDogZmFsc2UsXG4gICAgICAgICAgICBwdXNoOiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAga2lsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEuZHJhaW4gPSBub29wO1xuICAgICAgICAgICAgICAgIHEudGFza3MgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bnNoaWZ0OiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHRydWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKXtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFza3MgPSBxLnBheWxvYWQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS5wYXlsb2FkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZSgwLCBxLnRhc2tzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBfbWFwKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhc2suZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd29ya2VycyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5wdXNoKHRhc2tzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNiID0gb25seV9vbmNlKF9uZXh0KHEsIHRhc2tzKSk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcihkYXRhLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd29ya2Vyc0xpc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2Vyc0xpc3Q7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWRsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocS5wYXVzZWQgPT09IGZhbHNlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VtZUNvdW50ID0gTWF0aC5taW4ocS5jb25jdXJyZW5jeSwgcS50YXNrcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FsbCBxLnByb2Nlc3Mgb25jZSBwZXIgY29uY3VycmVudFxuICAgICAgICAgICAgICAgIC8vIHdvcmtlciB0byBwcmVzZXJ2ZSBmdWxsIGNvbmN1cnJlbmN5IGFmdGVyIHBhdXNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcmVzdW1lQ291bnQ7IHcrKykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxO1xuICAgIH1cblxuICAgIGFzeW5jLnF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcbiAgICAgICAgdmFyIHEgPSBfcXVldWUoZnVuY3Rpb24gKGl0ZW1zLCBjYikge1xuICAgICAgICAgICAgd29ya2VyKGl0ZW1zWzBdLCBjYik7XG4gICAgICAgIH0sIGNvbmN1cnJlbmN5LCAxKTtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMucHJpb3JpdHlRdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG5cbiAgICAgICAgZnVuY3Rpb24gX2NvbXBhcmVUYXNrcyhhLCBiKXtcbiAgICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5hcnlTZWFyY2goc2VxdWVuY2UsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBiZWcgPSAtMSxcbiAgICAgICAgICAgICAgICBlbmQgPSBzZXF1ZW5jZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgd2hpbGUgKGJlZyA8IGVuZCkge1xuICAgICAgICAgICAgICAgIHZhciBtaWQgPSBiZWcgKyAoKGVuZCAtIGJlZyArIDEpID4+PiAxKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShpdGVtLCBzZXF1ZW5jZVttaWRdKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZyA9IG1pZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBiZWc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5LFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBub29wXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKF9iaW5hcnlTZWFyY2gocS50YXNrcywgaXRlbSwgX2NvbXBhcmVUYXNrcykgKyAxLCAwLCBpdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgd2l0aCBhIG5vcm1hbCBxdWV1ZVxuICAgICAgICB2YXIgcSA9IGFzeW5jLnF1ZXVlKHdvcmtlciwgY29uY3VycmVuY3kpO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIHB1c2ggdG8gYWNjZXB0IHNlY29uZCBwYXJhbWV0ZXIgcmVwcmVzZW50aW5nIHByaW9yaXR5XG4gICAgICAgIHEucHVzaCA9IGZ1bmN0aW9uIChkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZW1vdmUgdW5zaGlmdCBmdW5jdGlvblxuICAgICAgICBkZWxldGUgcS51bnNoaWZ0O1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5jYXJnbyA9IGZ1bmN0aW9uICh3b3JrZXIsIHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIF9xdWV1ZSh3b3JrZXIsIDEsIHBheWxvYWQpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfY29uc29sZV9mbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29uc29sZVtuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaChhcmdzLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGVbbmFtZV0oeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMubG9nID0gX2NvbnNvbGVfZm4oJ2xvZycpO1xuICAgIGFzeW5jLmRpciA9IF9jb25zb2xlX2ZuKCdkaXInKTtcbiAgICAvKmFzeW5jLmluZm8gPSBfY29uc29sZV9mbignaW5mbycpO1xuICAgIGFzeW5jLndhcm4gPSBfY29uc29sZV9mbignd2FybicpO1xuICAgIGFzeW5jLmVycm9yID0gX2NvbnNvbGVfZm4oJ2Vycm9yJyk7Ki9cblxuICAgIGFzeW5jLm1lbW9pemUgPSBmdW5jdGlvbiAoZm4sIGhhc2hlcikge1xuICAgICAgICB2YXIgbWVtbyA9IHt9O1xuICAgICAgICB2YXIgcXVldWVzID0ge307XG4gICAgICAgIHZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICAgICAgICBoYXNoZXIgPSBoYXNoZXIgfHwgaWRlbnRpdHk7XG4gICAgICAgIHZhciBtZW1vaXplZCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gbWVtb2l6ZWQoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwobWVtbywga2V5KSkgeyAgIFxuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIG1lbW9ba2V5XSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChoYXMuY2FsbChxdWV1ZXMsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF90aW1lcyhtYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXBwZXIoX3JhbmdlKGNvdW50KSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy50aW1lcyA9IF90aW1lcyhhc3luYy5tYXApO1xuICAgIGFzeW5jLnRpbWVzU2VyaWVzID0gX3RpbWVzKGFzeW5jLm1hcFNlcmllcyk7XG4gICAgYXN5bmMudGltZXNMaW1pdCA9IGZ1bmN0aW9uIChjb3VudCwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMubWFwTGltaXQoX3JhbmdlKGNvdW50KSwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wb3AoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBub29wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgbmV4dGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoYXQsIFtlcnJdLmNvbmNhdChyZXN1bHRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5zZXEuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnJldmVyc2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBfYXBwbHlFYWNoKGVhY2hmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbihmbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBnbyA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlYWNoZm4oZm5zLCBmdW5jdGlvbiAoZm4sIF8sIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5hcHBseUVhY2ggPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZik7XG4gICAgYXN5bmMuYXBwbHlFYWNoU2VyaWVzID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2ZTZXJpZXMpO1xuXG5cbiAgICBhc3luYy5mb3JldmVyID0gZnVuY3Rpb24gKGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZG9uZSA9IG9ubHlfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIHRhc2sgPSBlbnN1cmVBc3luYyhmbik7XG4gICAgICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhc2sobmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVBc3luYyhmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5lbnN1cmVBc3luYyA9IGVuc3VyZUFzeW5jO1xuXG4gICAgYXN5bmMuY29uc3RhbnQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgICB2YXIgYXJncyA9IFtudWxsXS5jb25jYXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXN5bmMud3JhcFN5bmMgPVxuICAgIGFzeW5jLmFzeW5jaWZ5ID0gZnVuY3Rpb24gYXN5bmNpZnkoZnVuYykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgcmVzdWx0IGlzIFByb21pc2Ugb2JqZWN0XG4gICAgICAgICAgICBpZiAoX2lzT2JqZWN0KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLm1lc3NhZ2UgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBOb2RlLmpzXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXN5bmM7XG4gICAgfVxuICAgIC8vIEFNRCAvIFJlcXVpcmVKU1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhc3luYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGluY2x1ZGVkIGRpcmVjdGx5IHZpYSA8c2NyaXB0PiB0YWdcbiAgICBlbHNlIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IGFzeW5jO1xuICAgIH1cblxufSgpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmxhY2tsaXN0IChzcmMpIHtcbiAgdmFyIGNvcHkgPSB7fSwgZmlsdGVyID0gYXJndW1lbnRzWzFdXG5cbiAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgZmlsdGVyID0ge31cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZmlsdGVyW2FyZ3VtZW50c1tpXV0gPSB0cnVlXG4gICAgfVxuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIHNyYykge1xuICAgIC8vIGJsYWNrbGlzdD9cbiAgICBpZiAoZmlsdGVyW2tleV0pIGNvbnRpbnVlXG5cbiAgICBjb3B5W2tleV0gPSBzcmNba2V5XVxuICB9XG5cbiAgcmV0dXJuIGNvcHlcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbihmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgfVxuICB9XG4gIHRyeSB7XG4gICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaXMgbm90IGRlZmluZWQnKTtcbiAgICB9XG4gIH1cbn0gKCkpXG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBjYWNoZWRTZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjYWNoZWRDbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLyohXG4gIENvcHlyaWdodCAoYykgMjAxNiBKZWQgV2F0c29uLlxuICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UgKE1JVCksIHNlZVxuICBodHRwOi8vamVkd2F0c29uLmdpdGh1Yi5pby9jbGFzc25hbWVzXG4qL1xuLyogZ2xvYmFsIGRlZmluZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGhhc093biA9IHt9Lmhhc093blByb3BlcnR5O1xuXG5cdGZ1bmN0aW9uIGNsYXNzTmFtZXMgKCkge1xuXHRcdHZhciBjbGFzc2VzID0gW107XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdGlmICghYXJnKSBjb250aW51ZTtcblxuXHRcdFx0dmFyIGFyZ1R5cGUgPSB0eXBlb2YgYXJnO1xuXG5cdFx0XHRpZiAoYXJnVHlwZSA9PT0gJ3N0cmluZycgfHwgYXJnVHlwZSA9PT0gJ251bWJlcicpIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGFyZyk7XG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0XHRjbGFzc2VzLnB1c2goY2xhc3NOYW1lcy5hcHBseShudWxsLCBhcmcpKTtcblx0XHRcdH0gZWxzZSBpZiAoYXJnVHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRcdGlmIChoYXNPd24uY2FsbChhcmcsIGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0XHRcdGNsYXNzZXMucHVzaChrZXkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzLmpvaW4oJyAnKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gY2xhc3NOYW1lcztcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gcmVnaXN0ZXIgYXMgJ2NsYXNzbmFtZXMnLCBjb25zaXN0ZW50IHdpdGggbnBtIHBhY2thZ2UgbmFtZVxuXHRcdGRlZmluZSgnY2xhc3NuYW1lcycsIFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lcztcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuY2xhc3NOYW1lcyA9IGNsYXNzTmFtZXM7XG5cdH1cbn0oKSk7XG4iLCJmdW5jdGlvbiBtYWtlc2hpZnRUaXRsZSh0aXRsZSwgbWVzc2FnZSkge1xuICByZXR1cm4gdGl0bGUgPyAodGl0bGUgKyAnXFxuXFxuJyArIG1lc3NhZ2UpIDogbWVzc2FnZVxufVxuXG4vLyBTZWUgaHR0cDovL2RvY3MucGhvbmVnYXAuY29tL2VuL2VkZ2UvY29yZG92YV9ub3RpZmljYXRpb25fbm90aWZpY2F0aW9uLm1kLmh0bWwgZm9yIGRvY3VtZW50YXRpb25cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhbGVydDogZnVuY3Rpb24gYWxlcnQobWVzc2FnZSwgY2FsbGJhY2ssIHRpdGxlKSB7XG4gICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3Iubm90aWZpY2F0aW9uICYmIHdpbmRvdy5uYXZpZ2F0b3Iubm90aWZpY2F0aW9uLmFsZXJ0KSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci5ub3RpZmljYXRpb24uYWxlcnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIHZhciB0ZXh0ID0gbWFrZXNoaWZ0VGl0bGUodGl0bGUsIG1lc3NhZ2UpXG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgd2luZG93LmFsZXJ0KHRleHQpXG5cbiAgICAgIGNhbGxiYWNrKClcbiAgICB9LCAwKVxuICB9LFxuICBjb25maXJtOiBmdW5jdGlvbiBjb25maXJtKG1lc3NhZ2UsIGNhbGxiYWNrLCB0aXRsZSkge1xuICAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm5vdGlmaWNhdGlvbiAmJiB3aW5kb3cubmF2aWdhdG9yLm5vdGlmaWNhdGlvbi5jb25maXJtKSB7XG4gICAgICByZXR1cm4gd2luZG93Lm5hdmlnYXRvci5ub3RpZmljYXRpb24uY29uZmlybS5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgfVxuXG4gICAgdmFyIHRleHQgPSBtYWtlc2hpZnRUaXRsZSh0aXRsZSwgbWVzc2FnZSlcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29uZmlybWVkID0gd2luZG93LmNvbmZpcm0odGV4dClcbiAgICAgIHZhciBidXR0b25JbmRleCA9IGNvbmZpcm1lZCA/IDEgOiAyXG5cbiAgICAgIGNhbGxiYWNrKGJ1dHRvbkluZGV4KVxuICAgIH0sIDApXG4gIH0sXG5cbiAgcHJvbXB0OiBmdW5jdGlvbiBwcm9tcHQobWVzc2FnZSwgY2FsbGJhY2ssIHRpdGxlLCBkZWZhdWx0VGV4dCkge1xuICAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm5vdGlmaWNhdGlvbiAmJiB3aW5kb3cubmF2aWdhdG9yLm5vdGlmaWNhdGlvbi5wcm9tcHQpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLm5vdGlmaWNhdGlvbi5wcm9tcHQuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIH1cblxuICAgIHZhciBxdWVzdGlvbiA9IG1ha2VzaGlmdFRpdGxlKHRpdGxlLCBtZXNzYWdlKVxuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0ZXh0ID0gd2luZG93LnByb21wdChxdWVzdGlvbiwgZGVmYXVsdFRleHQpXG4gICAgICB2YXIgYnV0dG9uSW5kZXggPSAodGV4dCA9PT0gbnVsbCkgPyAwIDogMVxuXG4gICAgICBjYWxsYmFjayh7XG4gICAgICAgIGJ1dHRvbkluZGV4OiBidXR0b25JbmRleCxcbiAgICAgICAgaW5wdXQxOiB0ZXh0XG4gICAgICB9KVxuICAgIH0sIDApXG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMtZnVuY3Rpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2hcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBmb3JFYWNoKGxpc3QsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpc0Z1bmN0aW9uKGl0ZXJhdG9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgIH1cblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgICBjb250ZXh0ID0gdGhpc1xuICAgIH1cbiAgICBcbiAgICBpZiAodG9TdHJpbmcuY2FsbChsaXN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJylcbiAgICAgICAgZm9yRWFjaEFycmF5KGxpc3QsIGl0ZXJhdG9yLCBjb250ZXh0KVxuICAgIGVsc2UgaWYgKHR5cGVvZiBsaXN0ID09PSAnc3RyaW5nJylcbiAgICAgICAgZm9yRWFjaFN0cmluZyhsaXN0LCBpdGVyYXRvciwgY29udGV4dClcbiAgICBlbHNlXG4gICAgICAgIGZvckVhY2hPYmplY3QobGlzdCwgaXRlcmF0b3IsIGNvbnRleHQpXG59XG5cbmZ1bmN0aW9uIGZvckVhY2hBcnJheShhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYXJyYXksIGkpKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W2ldLCBpLCBhcnJheSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZm9yRWFjaFN0cmluZyhzdHJpbmcsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHN0cmluZy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAvLyBubyBzdWNoIHRoaW5nIGFzIGEgc3BhcnNlIHN0cmluZy5cbiAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBzdHJpbmcuY2hhckF0KGkpLCBpLCBzdHJpbmcpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBmb3JFYWNoT2JqZWN0KG9iamVjdCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBmb3IgKHZhciBrIGluIG9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGspKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iamVjdFtrXSwgaywgb2JqZWN0KVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzZWxmO1xufSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHt9O1xufVxuIiwidmFyIHJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0JylcblxuaWYgKHR5cGVvZiBQcm9taXNlICE9PSAnZnVuY3Rpb24nKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ1BsZWFzZSBwcm92aWRlIGEgUHJvbWlzZSBwb2x5ZmlsbCBhcyB5b3VyIGVudmlyb25tZW50IGRvZXNuXFwndCBzdXBwb3J0IHRoZW0gbmF0aXZlbHknKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICByZXF1ZXN0KG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlLCBib2R5KSB7XG5cbiAgICAgIHZhciBzdGF0dXMgPSAocmVzcG9uc2UpID8gcmVzcG9uc2Uuc3RhdHVzQ29kZSA6IDBcbiAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge31cblxuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIpXG4gICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB0cnl7XG4gICAgICAgIHJlc3BvbnNlLmJvZHkgPSBKU09OLnBhcnNlKGJvZHkpXG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge31cblxuICAgICAgaWYgKHN0YXR1cyA+PSA0MDAgJiYgc3RhdHVzIDwgNjAwKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlLCByZXNwb25zZS5ib2R5KVxuICAgICAgICByZWplY3QocmVzcG9uc2UpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSwgcmVzcG9uc2UuYm9keSlcbiAgICAgIHJlc29sdmUocmVzcG9uc2UpXG4gICAgfSlcbiAgfSlcbn1cbiIsInZhciByZXF1ZXN0ID0gcmVxdWlyZSgneGhyJyk7XG5cbi8vIFdyYXBwZXIgdG8gbWFrZSB0aGUgZmVhdHVyZXMgbW9yZSBzaW1pbGlhciBiZXR3ZWVuXG4vLyByZXF1ZXN0IGFuZCB4aHJcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgXG4gIC8vIFNldCB1cCBmb3IgUmVxdWVzdCBtb2R1bGVcbiAgaWYgKG9wdGlvbnMuZGF0YSAmJiAhd2luZG93KSBvcHRpb25zLmZvcm0gPSBvcHRpb25zLmRhdGE7XG4gIFxuICAvLyBTZXQgdXAgZm9yIHhociBtb2R1bGVcbiAgaWYgKG9wdGlvbnMuZm9ybSAmJiB3aW5kb3cpIHtcbiAgICBvcHRpb25zLmJvZHkgPSAodHlwZW9mIG9wdGlvbnMuZm9ybSA9PT0gJ29iamVjdCcpXG4gICAgICA/IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuZm9ybSlcbiAgICAgIDogb3B0aW9ucy5mb3JtO1xuICB9XG4gIFxuICBpZiAob3B0aW9ucy5kYXRhKSB7XG4gICAgb3B0aW9ucy5ib2R5ID0gKHR5cGVvZiBvcHRpb25zLmRhdGEgPT09ICdvYmplY3QnKVxuICAgICAgPyBKU09OLnN0cmluZ2lmeShvcHRpb25zLmRhdGEpXG4gICAgICA6IG9wdGlvbnMuZGF0YTtcbiAgfVxuICBcbiAgaWYgKG9wdGlvbnMudXJsICYmIHdpbmRvdykgb3B0aW9ucy51cmkgPSBvcHRpb25zLnVybDtcbiAgaWYgKHdpbmRvdykgb3B0aW9ucy5jb3JzID0gb3B0aW9ucy53aXRoQ3JlZGVudGlhbHM7XG4gIFxuICByZXR1cm4gcmVxdWVzdChvcHRpb25zLCBjYWxsYmFjayk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvblxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24gKGZuKSB7XG4gIHZhciBzdHJpbmcgPSB0b1N0cmluZy5jYWxsKGZuKVxuICByZXR1cm4gc3RyaW5nID09PSAnW29iamVjdCBGdW5jdGlvbl0nIHx8XG4gICAgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiBzdHJpbmcgIT09ICdbb2JqZWN0IFJlZ0V4cF0nKSB8fFxuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAvLyBJRTggYW5kIGJlbG93XG4gICAgIChmbiA9PT0gd2luZG93LnNldFRpbWVvdXQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuYWxlcnQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuY29uZmlybSB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5wcm9tcHQpKVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gb25jZVxuXG5vbmNlLnByb3RvID0gb25jZShmdW5jdGlvbiAoKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGdW5jdGlvbi5wcm90b3R5cGUsICdvbmNlJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gb25jZSh0aGlzKVxuICAgIH0sXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pXG59KVxuXG5mdW5jdGlvbiBvbmNlIChmbikge1xuICB2YXIgY2FsbGVkID0gZmFsc2VcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm5cbiAgICBjYWxsZWQgPSB0cnVlXG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxufVxuIiwidmFyIHRyaW0gPSByZXF1aXJlKCd0cmltJylcbiAgLCBmb3JFYWNoID0gcmVxdWlyZSgnZm9yLWVhY2gnKVxuICAsIGlzQXJyYXkgPSBmdW5jdGlvbihhcmcpIHtcbiAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGhlYWRlcnMpIHtcbiAgaWYgKCFoZWFkZXJzKVxuICAgIHJldHVybiB7fVxuXG4gIHZhciByZXN1bHQgPSB7fVxuXG4gIGZvckVhY2goXG4gICAgICB0cmltKGhlYWRlcnMpLnNwbGl0KCdcXG4nKVxuICAgICwgZnVuY3Rpb24gKHJvdykge1xuICAgICAgICB2YXIgaW5kZXggPSByb3cuaW5kZXhPZignOicpXG4gICAgICAgICAgLCBrZXkgPSB0cmltKHJvdy5zbGljZSgwLCBpbmRleCkpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAsIHZhbHVlID0gdHJpbShyb3cuc2xpY2UoaW5kZXggKyAxKSlcblxuICAgICAgICBpZiAodHlwZW9mKHJlc3VsdFtrZXldKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IHZhbHVlXG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShyZXN1bHRba2V5XSkpIHtcbiAgICAgICAgICByZXN1bHRba2V5XS5wdXNoKHZhbHVlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdFtrZXldID0gWyByZXN1bHRba2V5XSwgdmFsdWUgXVxuICAgICAgICB9XG4gICAgICB9XG4gIClcblxuICByZXR1cm4gcmVzdWx0XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB0aGlzLl9fcnNfbGlzdGVuZXJzID0gW107XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX19yc19saXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgIHZhciBlbWl0dGVyID0gbGlzdGVuZXIuZW1pdHRlcjtcbiAgICAgIHZhciBldmVudE5hbWUgPSBsaXN0ZW5lci5ldmVudE5hbWU7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBsaXN0ZW5lci5jYWxsYmFjaztcblxuICAgICAgdmFyIHJlbW92ZUxpc3RlbmVyID0gZW1pdHRlci5yZW1vdmVMaXN0ZW5lciB8fCBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgICByZW1vdmVMaXN0ZW5lci5jYWxsKGVtaXR0ZXIsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9LFxuXG4gIHdhdGNoOiBmdW5jdGlvbiB3YXRjaChlbWl0dGVyLCBldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fX3JzX2xpc3RlbmVycy5wdXNoKHtcbiAgICAgIGVtaXR0ZXI6IGVtaXR0ZXIsXG4gICAgICBldmVudE5hbWU6IGV2ZW50TmFtZSxcbiAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgIH0pO1xuXG4gICAgdmFyIGFkZExpc3RlbmVyID0gZW1pdHRlci5hZGRMaXN0ZW5lciB8fCBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXI7XG4gICAgYWRkTGlzdGVuZXIuY2FsbChlbWl0dGVyLCBldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgfSxcblxuICB1bndhdGNoOiBmdW5jdGlvbiB1bndhdGNoKGVtaXR0ZXIsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9fcnNfbGlzdGVuZXJzID0gdGhpcy5fX3JzX2xpc3RlbmVycy5maWx0ZXIoZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gbGlzdGVuZXIuZW1pdHRlciA9PT0gZW1pdHRlciAmJiBsaXN0ZW5lci5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiBsaXN0ZW5lci5jYWxsYmFjayA9PT0gY2FsbGJhY2s7XG4gICAgfSk7XG5cbiAgICB2YXIgcmVtb3ZlTGlzdGVuZXIgPSBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyIHx8IGVtaXR0ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcbiAgICByZW1vdmVMaXN0ZW5lci5jYWxsKGVtaXR0ZXIsIGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgR0xPQkFMID0gZ2xvYmFsIHx8IHdpbmRvdztcblxuZnVuY3Rpb24gY2xlYXJUaW1lcnMoKSB7XG4gIHRoaXMuY2xlYXJJbnRlcnZhbHMoKTtcbiAgdGhpcy5jbGVhclRpbWVvdXRzKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjbGVhckludGVydmFsczogZnVuY3Rpb24gY2xlYXJJbnRlcnZhbHMoKSB7XG4gICAgdGhpcy5fX3J0X2ludGVydmFscy5mb3JFYWNoKEdMT0JBTC5jbGVhckludGVydmFsKTtcbiAgfSxcbiAgY2xlYXJUaW1lb3V0czogZnVuY3Rpb24gY2xlYXJUaW1lb3V0cygpIHtcbiAgICB0aGlzLl9fcnRfdGltZW91dHMuZm9yRWFjaChHTE9CQUwuY2xlYXJUaW1lb3V0KTtcbiAgfSxcbiAgY2xlYXJJbnRlcnZhbDogZnVuY3Rpb24gY2xlYXJJbnRlcnZhbCgpIHtcbiAgICByZXR1cm4gR0xPQkFMLmNsZWFySW50ZXJ2YWwuYXBwbHkoR0xPQkFMLCBhcmd1bWVudHMpO1xuICB9LFxuICBjbGVhclRpbWVvdXQ6IGZ1bmN0aW9uIGNsZWFyVGltZW91dCgpIHtcbiAgICByZXR1cm4gR0xPQkFMLmNsZWFyVGltZW91dC5hcHBseShHTE9CQUwsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNsZWFyVGltZXJzOiBjbGVhclRpbWVycyxcblxuICBjb21wb25lbnRXaWxsTW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB0aGlzLl9fcnRfaW50ZXJ2YWxzID0gW107XG4gICAgdGhpcy5fX3J0X3RpbWVvdXRzID0gW107XG4gIH0sXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBjbGVhclRpbWVycyxcblxuICBzZXRJbnRlcnZhbDogZnVuY3Rpb24gc2V0SW50ZXJ2YWwoY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX3J0X2ludGVydmFsc1t0aGlzLl9fcnRfaW50ZXJ2YWxzLnB1c2goR0xPQkFMLnNldEludGVydmFsLmFwcGx5KEdMT0JBTCwgW2Z1bmN0aW9uICgpIHtcbiAgICAgIGZvciAodmFyIF9sZW4yID0gYXJndW1lbnRzLmxlbmd0aCwgcGFyYW1zID0gQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgcGFyYW1zW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrLmNhbGwuYXBwbHkoY2FsbGJhY2ssIFtfdGhpc10uY29uY2F0KHBhcmFtcykpO1xuICAgIH1dLmNvbmNhdChhcmdzKSkpIC0gMV07XG4gIH0sXG4gIHNldFRpbWVvdXQ6IGZ1bmN0aW9uIHNldFRpbWVvdXQoY2FsbGJhY2spIHtcbiAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4zID4gMSA/IF9sZW4zIC0gMSA6IDApLCBfa2V5MyA9IDE7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgIGFyZ3NbX2tleTMgLSAxXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19ydF90aW1lb3V0c1t0aGlzLl9fcnRfdGltZW91dHMucHVzaChHTE9CQUwuc2V0VGltZW91dC5hcHBseShHTE9CQUwsIFtmdW5jdGlvbiAoKSB7XG4gICAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIHBhcmFtcyA9IEFycmF5KF9sZW40KSwgX2tleTQgPSAwOyBfa2V5NCA8IF9sZW40OyBfa2V5NCsrKSB7XG4gICAgICAgIHBhcmFtc1tfa2V5NF0gPSBhcmd1bWVudHNbX2tleTRdO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjay5jYWxsLmFwcGx5KGNhbGxiYWNrLCBbX3RoaXMyXS5jb25jYXQocGFyYW1zKSk7XG4gICAgfV0uY29uY2F0KGFyZ3MpKSkgLSAxXTtcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdENvbnRhaW5lciA9IHJlcXVpcmUoJ3JlYWN0LWNvbnRhaW5lcicpO1xuXG52YXIgX3JlYWN0Q29udGFpbmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0Q29udGFpbmVyKTtcblxudmFyIEVycm9yVmlldyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnRXJyb3JWaWV3JyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjaGlsZHJlbjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ub2RlXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X3JlYWN0Q29udGFpbmVyMlsnZGVmYXVsdCddLFxuXHRcdFx0eyBmaWxsOiB0cnVlLCBjbGFzc05hbWU6ICdWaWV3IEVycm9yVmlldycgfSxcblx0XHRcdHRoaXMucHJvcHMuY2hpbGRyZW5cblx0XHQpO1xuXHR9XG59KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gRXJyb3JWaWV3O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdFRhcHBhYmxlKTtcblxudmFyIF9taXhpbnNUcmFuc2l0aW9ucyA9IHJlcXVpcmUoJy4uL21peGlucy9UcmFuc2l0aW9ucycpO1xuXG52YXIgX21peGluc1RyYW5zaXRpb25zMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX21peGluc1RyYW5zaXRpb25zKTtcblxudmFyIExpbmsgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0xpbmsnLFxuXG5cdG1peGluczogW19taXhpbnNUcmFuc2l0aW9uczJbJ2RlZmF1bHQnXV0sXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmFueSxcblx0XHRvcHRpb25zOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9iamVjdCxcblx0XHR0cmFuc2l0aW9uOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHR0bzogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmlld1Byb3BzOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmFueVxuXHR9LFxuXG5cdGRvVHJhbnNpdGlvbjogZnVuY3Rpb24gZG9UcmFuc2l0aW9uKCkge1xuXHRcdHZhciBvcHRpb25zID0gX2V4dGVuZHMoeyB2aWV3UHJvcHM6IHRoaXMucHJvcHMudmlld1Byb3BzLCB0cmFuc2l0aW9uOiB0aGlzLnByb3BzLnRyYW5zaXRpb24gfSwgdGhpcy5wcm9wcy5vcHRpb25zKTtcblx0XHRjb25zb2xlLmluZm8oJ0xpbmsgdG8gXCInICsgdGhpcy5wcm9wcy50byArICdcIiB1c2luZyB0cmFuc2l0aW9uIFwiJyArIHRoaXMucHJvcHMudHJhbnNpdGlvbiArICdcIicgKyAnIHdpdGggcHJvcHMgJywgdGhpcy5wcm9wcy52aWV3UHJvcHMpO1xuXHRcdHRoaXMudHJhbnNpdGlvblRvKHRoaXMucHJvcHMudG8sIG9wdGlvbnMpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciB0YXBwYWJsZVByb3BzID0gKDAsIF9ibGFja2xpc3QyWydkZWZhdWx0J10pKHRoaXMucHJvcHMsICdjaGlsZHJlbicsICdvcHRpb25zJywgJ3RyYW5zaXRpb24nLCAndmlld1Byb3BzJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdF9leHRlbmRzKHsgb25UYXA6IHRoaXMuZG9UcmFuc2l0aW9uIH0sIHRhcHBhYmxlUHJvcHMpLFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBMaW5rO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBWaWV3ID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdWaWV3JyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjb21wb25lbnQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXHRcdG5hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWRcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdUb3VjaHN0b25lSlMgPFZpZXc+IHNob3VsZCBub3QgYmUgcmVuZGVyZWQgZGlyZWN0bHkuJyk7XG5cdH1cbn0pO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBWaWV3O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9FcnJvclZpZXcgPSByZXF1aXJlKCcuL0Vycm9yVmlldycpO1xuXG52YXIgX0Vycm9yVmlldzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9FcnJvclZpZXcpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXAgPSByZXF1aXJlKCdyZWFjdC1hZGRvbnMtY3NzLXRyYW5zaXRpb24tZ3JvdXAnKTtcblxudmFyIF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdzRnJvbUNoaWxkcmVuKGNoaWxkcmVuKSB7XG5cdHZhciB2aWV3cyA9IHt9O1xuXHRfcmVhY3QyWydkZWZhdWx0J10uQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKHZpZXcpIHtcblx0XHR2aWV3c1t2aWV3LnByb3BzLm5hbWVdID0gdmlldztcblx0fSk7XG5cdHJldHVybiB2aWV3cztcbn1cblxudmFyIFZpZXdDb250YWluZXIgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1ZpZXdDb250YWluZXInLFxuXG5cdHN0YXRpY3M6IHtcblx0XHRzaG91bGRGaWxsVmVydGljYWxTcGFjZTogdHJ1ZVxuXHR9LFxuXHRwcm9wVHlwZXM6IHtcblx0XHRjaGlsZHJlbjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ub2RlXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2hpbGRyZW4nKTtcblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHByb3BzLFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgVmlld01hbmFnZXIgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1ZpZXdNYW5hZ2VyJyxcblxuXHRzdGF0aWNzOiB7XG5cdFx0c2hvdWxkRmlsbFZlcnRpY2FsU3BhY2U6IHRydWVcblx0fSxcblx0Y29udGV4dFR5cGVzOiB7XG5cdFx0YXBwOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkXG5cdH0sXG5cdHByb3BUeXBlczoge1xuXHRcdG5hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUsXG5cdFx0Y2xhc3NOYW1lOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkZWZhdWx0VmlldzogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0b25WaWV3Q2hhbmdlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmZ1bmNcblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWU6ICdfX2RlZmF1bHQnXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHZpZXdzOiBjcmVhdGVWaWV3c0Zyb21DaGlsZHJlbih0aGlzLnByb3BzLmNoaWxkcmVuKSxcblx0XHRcdGN1cnJlbnRWaWV3OiB0aGlzLnByb3BzLmRlZmF1bHRWaWV3LFxuXHRcdFx0b3B0aW9uczoge31cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gY29tcG9uZW50RGlkTW91bnQoKSB7XG5cdFx0dGhpcy5jb250ZXh0LmFwcC52aWV3TWFuYWdlcnNbdGhpcy5wcm9wcy5uYW1lXSA9IHRoaXM7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcblx0XHRkZWxldGUgdGhpcy5jb250ZXh0LmFwcC52aWV3TWFuYWdlcnNbdGhpcy5wcm9wcy5uYW1lXTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHZpZXdzOiBjcmVhdGVWaWV3c0Zyb21DaGlsZHJlbih0aGlzLnByb3BzLmNoaWxkcmVuKVxuXHRcdH0pO1xuXHRcdGlmIChuZXh0UHJvcHMubmFtZSAhPT0gdGhpcy5wcm9wcy5uYW1lKSB7XG5cdFx0XHR0aGlzLmNvbnRleHQuYXBwLnZpZXdNYW5hZ2Vyc1tuZXh0UHJvcHMubmFtZV0gPSB0aGlzO1xuXHRcdFx0ZGVsZXRlIHRoaXMuY29udGV4dC5hcHAudmlld01hbmFnZXJzW3RoaXMucHJvcHMubmFtZV07XG5cdFx0fVxuXHRcdGlmIChuZXh0UHJvcHMuY3VycmVudFZpZXcgJiYgbmV4dFByb3BzLmN1cnJlbnRWaWV3ICE9PSB0aGlzLnN0YXRlLmN1cnJlbnRWaWV3KSB7XG5cdFx0XHR0aGlzLnRyYW5zaXRpb25UbyhuZXh0UHJvcHMuY3VycmVudFZpZXcsIHsgdmlld1Byb3BzOiBuZXh0UHJvcHMudmlld1Byb3BzIH0pO1xuXHRcdH1cblx0fSxcblx0dHJhbnNpdGlvblRvOiBmdW5jdGlvbiB0cmFuc2l0aW9uVG8odmlld0tleSwgb3B0aW9ucykge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRvcHRpb25zID0geyB0cmFuc2l0aW9uOiBvcHRpb25zIH07XG5cdFx0fVxuXHRcdGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuXHRcdHRoaXMuYWN0aXZlVHJhbnNpdGlvbk9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuY29udGV4dC5hcHAudmlld01hbmFnZXJJblRyYW5zaXRpb24gPSB0aGlzO1xuXHRcdHRoaXMucHJvcHMub25WaWV3Q2hhbmdlICYmIHRoaXMucHJvcHMub25WaWV3Q2hhbmdlKHZpZXdLZXkpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0Y3VycmVudFZpZXc6IHZpZXdLZXksXG5cdFx0XHRvcHRpb25zOiBvcHRpb25zXG5cdFx0fSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0ZGVsZXRlIF90aGlzLmFjdGl2ZVRyYW5zaXRpb25PcHRpb25zO1xuXHRcdFx0ZGVsZXRlIF90aGlzLmNvbnRleHQuYXBwLnZpZXdNYW5hZ2VySW5UcmFuc2l0aW9uO1xuXHRcdH0pO1xuXHR9LFxuXHRyZW5kZXJWaWV3Q29udGFpbmVyOiBmdW5jdGlvbiByZW5kZXJWaWV3Q29udGFpbmVyKCkge1xuXHRcdHZhciB2aWV3S2V5ID0gdGhpcy5zdGF0ZS5jdXJyZW50Vmlldztcblx0XHRpZiAoIXZpZXdLZXkpIHtcblx0XHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0X0Vycm9yVmlldzJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J3NwYW4nLFxuXHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAnRXJyb3JWaWV3X19oZWFkaW5nJyB9LFxuXHRcdFx0XHRcdCdWaWV3TWFuYWdlcjogJyxcblx0XHRcdFx0XHR0aGlzLnByb3BzLm5hbWVcblx0XHRcdFx0KSxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J3NwYW4nLFxuXHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAnRXJyb3JWaWV3X190ZXh0JyB9LFxuXHRcdFx0XHRcdCdFcnJvcjogVGhlcmUgaXMgbm8gY3VycmVudCBWaWV3Lidcblx0XHRcdFx0KVxuXHRcdFx0KTtcblx0XHR9XG5cdFx0dmFyIHZpZXcgPSB0aGlzLnN0YXRlLnZpZXdzW3ZpZXdLZXldO1xuXHRcdGlmICghdmlldyB8fCAhdmlldy5wcm9wcy5jb21wb25lbnQpIHtcblx0XHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0X0Vycm9yVmlldzJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0bnVsbCxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0J3NwYW4nLFxuXHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAnRXJyb3JWaWV3X19oZWFkaW5nJyB9LFxuXHRcdFx0XHRcdCdWaWV3TWFuYWdlcjogXCInLFxuXHRcdFx0XHRcdHRoaXMucHJvcHMubmFtZSxcblx0XHRcdFx0XHQnXCInXG5cdFx0XHRcdCksXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdCdzcGFuJyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ0Vycm9yVmlld19fdGV4dCcgfSxcblx0XHRcdFx0XHQnVGhlIFZpZXcgXCInLFxuXHRcdFx0XHRcdHZpZXdLZXksXG5cdFx0XHRcdFx0J1wiIGlzIGludmFsaWQuJ1xuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH1cblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMuc3RhdGUub3B0aW9ucyB8fCB7fTtcblx0XHR2YXIgdmlld0NsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ1ZpZXcgVmlldy0tJyArIHZpZXdLZXksIHZpZXcucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgVmlld0NvbXBvbmVudCA9IHZpZXcucHJvcHMuY29tcG9uZW50O1xuXHRcdHZhciB2aWV3UHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodmlldy5wcm9wcywgJ2NvbXBvbmVudCcsICdjbGFzc05hbWUnKTtcblx0XHRfZXh0ZW5kcyh2aWV3UHJvcHMsIG9wdGlvbnMudmlld1Byb3BzKTtcblx0XHR2YXIgdmlld0VsZW1lbnQgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChWaWV3Q29tcG9uZW50LCB2aWV3UHJvcHMpO1xuXG5cdFx0aWYgKHRoaXMuX19sYXN0UmVuZGVyZWRWaWV3ICE9PSB2aWV3S2V5KSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnaW5pdGlhbGlzaW5nIHZpZXcgJyArIHZpZXdLZXkgKyAnIHdpdGggb3B0aW9ucycsIG9wdGlvbnMpO1xuXHRcdFx0aWYgKHZpZXdFbGVtZW50LnR5cGUubmF2aWdhdGlvbkJhciAmJiB2aWV3RWxlbWVudC50eXBlLmdldE5hdmlnYXRpb24pIHtcblx0XHRcdFx0dmFyIGFwcCA9IHRoaXMuY29udGV4dC5hcHA7XG5cdFx0XHRcdHZhciB0cmFuc2l0aW9uID0gb3B0aW9ucy50cmFuc2l0aW9uO1xuXHRcdFx0XHRpZiAoYXBwLnZpZXdNYW5hZ2VySW5UcmFuc2l0aW9uKSB7XG5cdFx0XHRcdFx0dHJhbnNpdGlvbiA9IGFwcC52aWV3TWFuYWdlckluVHJhbnNpdGlvbi5hY3RpdmVUcmFuc2l0aW9uT3B0aW9ucy50cmFuc2l0aW9uO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGFwcC5uYXZpZ2F0aW9uQmFyc1t2aWV3RWxlbWVudC50eXBlLm5hdmlnYXRpb25CYXJdLnVwZGF0ZVdpdGhUcmFuc2l0aW9uKHZpZXdFbGVtZW50LnR5cGUuZ2V0TmF2aWdhdGlvbih2aWV3UHJvcHMsIGFwcCksIHRyYW5zaXRpb24pO1xuXHRcdFx0XHR9LCAwKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX19sYXN0UmVuZGVyZWRWaWV3ID0gdmlld0tleTtcblx0XHR9XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRWaWV3Q29udGFpbmVyLFxuXHRcdFx0eyBjbGFzc05hbWU6IHZpZXdDbGFzc05hbWUsIGtleTogdmlld0tleSB9LFxuXHRcdFx0dmlld0VsZW1lbnRcblx0XHQpO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnVmlld01hbmFnZXInLCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cdFx0dmFyIHZpZXdDb250YWluZXIgPSB0aGlzLnJlbmRlclZpZXdDb250YWluZXIodGhpcy5zdGF0ZS5jdXJyZW50VmlldywgeyB2aWV3UHJvcHM6IHRoaXMuc3RhdGUuY3VycmVudFZpZXdQcm9wcyB9KTtcblxuXHRcdHZhciB0cmFuc2l0aW9uTmFtZSA9ICd2aWV3LXRyYW5zaXRpb24taW5zdGFudCc7XG5cdFx0dmFyIHRyYW5zaXRpb25EdXJhdGlvbkVudGVyID0gMTA7XG5cdFx0dmFyIHRyYW5zaXRpb25EdXJhdGlvbkxlYXZlID0gNjA7XG5cdFx0aWYgKHRoaXMuc3RhdGUub3B0aW9ucy50cmFuc2l0aW9uKSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnYXBwbHlpbmcgdmlldyB0cmFuc2l0aW9uOiAnICsgdGhpcy5zdGF0ZS5vcHRpb25zLnRyYW5zaXRpb24gKyAnIHRvIHZpZXcgJyArIHRoaXMuc3RhdGUuY3VycmVudFZpZXcpO1xuXHRcdFx0dHJhbnNpdGlvbk5hbWUgPSAndmlldy10cmFuc2l0aW9uLScgKyB0aGlzLnN0YXRlLm9wdGlvbnMudHJhbnNpdGlvbjtcblx0XHRcdGlmICh0aGlzLnN0YXRlLm9wdGlvbnMudHJhbnNpdGlvbiA9PT0gJ2ZhZGUnKSB7XG5cdFx0XHRcdHZhciB0cmFuc2l0aW9uRHVyYXRpb25FbnRlciA9IDEwO1xuXHRcdFx0XHR2YXIgdHJhbnNpdGlvbkR1cmF0aW9uTGVhdmUgPSAzNDA7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgdHJhbnNpdGlvbkR1cmF0aW9uRW50ZXIgPSA1MDA7XG5cdFx0XHRcdHZhciB0cmFuc2l0aW9uRHVyYXRpb25MZWF2ZSA9IDUwMDtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwMlsnZGVmYXVsdCddLFxuXHRcdFx0eyB0cmFuc2l0aW9uTmFtZTogdHJhbnNpdGlvbk5hbWUsIHRyYW5zaXRpb25FbnRlclRpbWVvdXQ6IHRyYW5zaXRpb25EdXJhdGlvbkVudGVyLCB0cmFuc2l0aW9uTGVhdmVUaW1lb3V0OiB0cmFuc2l0aW9uRHVyYXRpb25MZWF2ZSwgY2xhc3NOYW1lOiBjbGFzc05hbWUsIGNvbXBvbmVudDogJ2RpdicgfSxcblx0XHRcdHZpZXdDb250YWluZXJcblx0XHQpO1xuXHR9XG59KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gVmlld01hbmFnZXI7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBhbmltYXRpb24gPSByZXF1aXJlKCd0d2Vlbi5qcycpO1xuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG5cdGFuaW1hdGlvbi51cGRhdGUoKTtcblx0aWYgKGFuaW1hdGlvbi5nZXRBbGwoKS5sZW5ndGgpIHtcblx0XHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHVwZGF0ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsVG9Ub3AoZWwsIG9wdGlvbnMpIHtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHZhciBmcm9tID0gZWwuc2Nyb2xsVG9wO1xuXHR2YXIgZHVyYXRpb24gPSBNYXRoLm1pbihNYXRoLm1heCgyMDAsIGZyb20gLyAyKSwgMzUwKTtcblx0aWYgKGZyb20gPiAyMDApIGR1cmF0aW9uID0gMzAwO1xuXHRlbC5zdHlsZS53ZWJraXRPdmVyZmxvd1Njcm9sbGluZyA9ICdhdXRvJztcblx0ZWwuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0dmFyIHR3ZWVuID0gbmV3IGFuaW1hdGlvbi5Ud2Vlbih7IHBvczogZnJvbSB9KS50byh7IHBvczogMCB9LCBkdXJhdGlvbikuZWFzaW5nKGFuaW1hdGlvbi5FYXNpbmcuUXVhZHJhdGljLk91dCkub25VcGRhdGUoZnVuY3Rpb24gKCkge1xuXHRcdGVsLnNjcm9sbFRvcCA9IHRoaXMucG9zO1xuXHRcdGlmIChvcHRpb25zLm9uVXBkYXRlKSB7XG5cdFx0XHRvcHRpb25zLm9uVXBkYXRlKCk7XG5cdFx0fVxuXHR9KS5vbkNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcblx0XHRlbC5zdHlsZS53ZWJraXRPdmVyZmxvd1Njcm9sbGluZyA9ICd0b3VjaCc7XG5cdFx0ZWwuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblx0XHRpZiAob3B0aW9ucy5vbkNvbXBsZXRlKSBvcHRpb25zLm9uQ29tcGxldGUoKTtcblx0fSkuc3RhcnQoKTtcblx0dXBkYXRlKCk7XG5cdHJldHVybiB0d2Vlbjtcbn1cblxuZXhwb3J0cy5zY3JvbGxUb1RvcCA9IHNjcm9sbFRvVG9wO1xuXG52YXIgTWl4aW5zID0gZXhwb3J0cy5NaXhpbnMgPSB7fTtcblxuTWl4aW5zLlNjcm9sbENvbnRhaW5lclRvVG9wID0ge1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gY29tcG9uZW50RGlkTW91bnQoKSB7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3N0YXR1c1RhcCcsIHRoaXMuc2Nyb2xsQ29udGFpbmVyVG9Ub3ApO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG5cdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3N0YXR1c1RhcCcsIHRoaXMuc2Nyb2xsQ29udGFpbmVyVG9Ub3ApO1xuXHRcdGlmICh0aGlzLl9zY3JvbGxDb250YWluZXJBbmltYXRpb24pIHtcblx0XHRcdHRoaXMuX3Njcm9sbENvbnRhaW5lckFuaW1hdGlvbi5zdG9wKCk7XG5cdFx0fVxuXHR9LFxuXHRzY3JvbGxDb250YWluZXJUb1RvcDogZnVuY3Rpb24gc2Nyb2xsQ29udGFpbmVyVG9Ub3AoKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdGlmICghdGhpcy5pc01vdW50ZWQoKSB8fCAhdGhpcy5yZWZzLnNjcm9sbENvbnRhaW5lcikgcmV0dXJuO1xuXHRcdHRoaXMuX3Njcm9sbENvbnRhaW5lckFuaW1hdGlvbiA9IHNjcm9sbFRvVG9wKHRoaXMucmVmcy5zY3JvbGxDb250YWluZXIsIHtcblx0XHRcdG9uQ29tcGxldGU6IGZ1bmN0aW9uIG9uQ29tcGxldGUoKSB7XG5cdFx0XHRcdGRlbGV0ZSBfdGhpcy5fc2Nyb2xsQ29udGFpbmVyQW5pbWF0aW9uO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNyZWF0ZUFwcCA9IGNyZWF0ZUFwcDtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBhbmltYXRpb24gPSByZXF1aXJlKCcuL2NvcmUvYW5pbWF0aW9uJyk7XG5leHBvcnRzLmFuaW1hdGlvbiA9IGFuaW1hdGlvbjtcbnZhciBMaW5rID0gcmVxdWlyZSgnLi9jb3JlL0xpbmsnKTtcbmV4cG9ydHMuTGluayA9IExpbms7XG52YXIgVmlldyA9IHJlcXVpcmUoJy4vY29yZS9WaWV3Jyk7XG5leHBvcnRzLlZpZXcgPSBWaWV3O1xudmFyIFZpZXdNYW5hZ2VyID0gcmVxdWlyZSgnLi9jb3JlL1ZpZXdNYW5hZ2VyJyk7XG5cbmV4cG9ydHMuVmlld01hbmFnZXIgPSBWaWV3TWFuYWdlcjtcbnZhciBDb250YWluZXIgPSByZXF1aXJlKCdyZWFjdC1jb250YWluZXInKTtcbmV4cG9ydHMuQ29udGFpbmVyID0gQ29udGFpbmVyO1xudmFyIE1peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5leHBvcnRzLk1peGlucyA9IE1peGlucztcbnZhciBVSSA9IHJlcXVpcmUoJy4vdWknKTtcblxuZXhwb3J0cy5VSSA9IFVJO1xuXG5mdW5jdGlvbiBjcmVhdGVBcHAoKSB7XG5cdHZhciBhcHAgPSB7XG5cdFx0bmF2aWdhdGlvbkJhcnM6IHt9LFxuXHRcdHZpZXdNYW5hZ2Vyczoge30sXG5cdFx0dHJhbnNpdGlvblRvOiBmdW5jdGlvbiB0cmFuc2l0aW9uVG8odmlldywgb3B0cykge1xuXHRcdFx0dmFyIHZtID0gJ19fZGVmYXVsdCc7XG5cdFx0XHR2aWV3ID0gdmlldy5zcGxpdCgnOicpO1xuXHRcdFx0aWYgKHZpZXcubGVuZ3RoID4gMSkge1xuXHRcdFx0XHR2bSA9IHZpZXcuc2hpZnQoKTtcblx0XHRcdH1cblx0XHRcdHZpZXcgPSB2aWV3WzBdO1xuXHRcdFx0YXBwLnZpZXdNYW5hZ2Vyc1t2bV0udHJhbnNpdGlvblRvKHZpZXcsIG9wdHMpO1xuXHRcdH1cblx0fTtcblx0cmV0dXJuIHtcblx0XHRjaGlsZENvbnRleHRUeXBlczoge1xuXHRcdFx0YXBwOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0XG5cdFx0fSxcblx0XHRnZXRDaGlsZENvbnRleHQ6IGZ1bmN0aW9uIGdldENoaWxkQ29udGV4dCgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFwcDogYXBwXG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIFRyYW5zaXRpb25zID0ge1xuXHRjb250ZXh0VHlwZXM6IHtcblx0XHRhcHA6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMub2JqZWN0XG5cdH0sXG5cdHRyYW5zaXRpb25UbzogZnVuY3Rpb24gdHJhbnNpdGlvblRvKHZpZXcsIG9wdHMpIHtcblx0XHR0aGlzLmNvbnRleHQuYXBwLnRyYW5zaXRpb25Ubyh2aWV3LCBvcHRzKTtcblx0fVxufTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gVHJhbnNpdGlvbnM7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xudmFyIFRyYW5zaXRpb25zID0gcmVxdWlyZSgnLi9UcmFuc2l0aW9ucycpO1xuZXhwb3J0cy5UcmFuc2l0aW9ucyA9IFRyYW5zaXRpb25zOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwID0gcmVxdWlyZSgncmVhY3QtYWRkb25zLWNzcy10cmFuc2l0aW9uLWdyb3VwJyk7XG5cbnZhciBfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnQWxlcnRiYXInLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRhbmltYXRlZDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sLFxuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHB1bHNlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0dHlwZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vbmVPZihbJ2RlZmF1bHQnLCAncHJpbWFyeScsICdzdWNjZXNzJywgJ3dhcm5pbmcnLCAnZGFuZ2VyJ10pLFxuXHRcdHZpc2libGU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbFxuXHR9LFxuXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gZ2V0RGVmYXVsdFByb3BzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiAnZGVmYXVsdCdcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdBbGVydGJhcicsICdBbGVydGJhci0tJyArIHRoaXMucHJvcHMudHlwZSwge1xuXHRcdFx0J0FsZXJ0YmFyLS1hbmltYXRlZCc6IHRoaXMucHJvcHMuYW5pbWF0ZWQsXG5cdFx0XHQnQWxlcnRiYXItLXB1bHNlJzogdGhpcy5wcm9wcy5wdWxzZVxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHZhciBwdWxzZVdyYXAgPSB0aGlzLnByb3BzLnB1bHNlID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnQWxlcnRiYXJfX2lubmVyJyB9LFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCkgOiB0aGlzLnByb3BzLmNoaWxkcmVuO1xuXHRcdHZhciBhbmltYXRlZEJhciA9IHRoaXMucHJvcHMudmlzaWJsZSA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHRwdWxzZVdyYXBcblx0XHQpIDogbnVsbDtcblxuXHRcdHZhciBjb21wb25lbnQgPSB0aGlzLnByb3BzLmFuaW1hdGVkID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXAyWydkZWZhdWx0J10sXG5cdFx0XHR7IHRyYW5zaXRpb25OYW1lOiAnQWxlcnRiYXInLCB0cmFuc2l0aW9uRW50ZXJUaW1lb3V0OiAzMDAsIHRyYW5zaXRpb25MZWF2ZVRpbWVvdXQ6IDMwMCwgY29tcG9uZW50OiAnZGl2JyB9LFxuXHRcdFx0YW5pbWF0ZWRCYXJcblx0XHQpIDogX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdHB1bHNlV3JhcFxuXHRcdCk7XG5cblx0XHRyZXR1cm4gY29tcG9uZW50O1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIF9yZWFjdFRhcHBhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0VGFwcGFibGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnQnV0dG9uJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dHlwZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vbmVPZihbJ2RlZmF1bHQnLCAnaW5mbycsICdwcmltYXJ5JywgJ3N1Y2Nlc3MnLCAnd2FybmluZycsICdkYW5nZXInXSlcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2RlZmF1bHQnXG5cdFx0fTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnQnV0dG9uJywgJ0J1dHRvbi0tJyArIHRoaXMucHJvcHMudHlwZSwgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAndHlwZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLCBfZXh0ZW5kcyh7fSwgcHJvcHMsIHsgY2xhc3NOYW1lOiBjbGFzc05hbWUsIGNvbXBvbmVudDogJ2J1dHRvbicgfSkpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0J1dHRvbkdyb3VwJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0J1dHRvbkdyb3VwJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdFRhcHBhYmxlKTtcblxudmFyIGkxOG4gPSB7XG5cdC8vIFRPRE86IHVzZSByZWFsIGkxOG4gc3RyaW5ncy5cblx0d2Vla2RheXNNaW46IFsnUycsICdNJywgJ1QnLCAnVycsICdUJywgJ0YnLCAnUyddLFxuXHRtb250aHM6IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcblx0bG9uZ01vbnRoczogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ10sXG5cdGZvcm1hdFllYXJNb250aDogZnVuY3Rpb24gZm9ybWF0WWVhck1vbnRoKHllYXIsIG1vbnRoKSB7XG5cdFx0cmV0dXJuIHllYXIgKyAnIC0gJyArIChtb250aCArIDEpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBuZXdTdGF0ZShwcm9wcykge1xuXHR2YXIgZGF0ZSA9IHByb3BzLmRhdGUgfHwgbmV3IERhdGUoKTtcblx0dmFyIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG5cdHZhciBtb250aCA9IGRhdGUuZ2V0TW9udGgoKTtcblx0dmFyIG5zID0ge1xuXHRcdG1vZGU6ICdkYXknLFxuXHRcdHllYXI6IHllYXIsXG5cdFx0bW9udGg6IG1vbnRoLFxuXHRcdGRheTogZGF0ZS5nZXREYXRlKCksXG5cdFx0ZGlzcGxheVllYXI6IHllYXIsXG5cdFx0ZGlzcGxheU1vbnRoOiBtb250aCxcblx0XHRkaXNwbGF5WWVhclJhbmdlU3RhcnQ6IE1hdGguZmxvb3IoeWVhciAvIDEwKSAqIDEwXG5cdH07XG5cdHJldHVybiBucztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0RhdGVQaWNrZXInLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRkYXRlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9iamVjdCxcblx0XHRtb2RlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mKFsnZGF5JywgJ21vbnRoJ10pLFxuXHRcdG9uQ2hhbmdlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmZ1bmNcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZGF0ZTogbmV3IERhdGUoKVxuXHRcdH07XG5cdH0sXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG5cdFx0cmV0dXJuIG5ld1N0YXRlKHRoaXMucHJvcHMpO1xuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZShuZXdTdGF0ZShuZXh0UHJvcHMpKTtcblx0fSxcblxuXHRzZWxlY3REYXk6IGZ1bmN0aW9uIHNlbGVjdERheSh5ZWFyLCBtb250aCwgZGF5KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHR5ZWFyOiB5ZWFyLFxuXHRcdFx0bW9udGg6IG1vbnRoLFxuXHRcdFx0ZGF5OiBkYXlcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLnByb3BzLm9uQ2hhbmdlKSB7XG5cdFx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXkpKTtcblx0XHR9XG5cdH0sXG5cblx0c2VsZWN0TW9udGg6IGZ1bmN0aW9uIHNlbGVjdE1vbnRoKG1vbnRoKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRkaXNwbGF5TW9udGg6IG1vbnRoLFxuXHRcdFx0bW9kZTogJ2RheSdcblx0XHR9KTtcblx0fSxcblxuXHRzZWxlY3RZZWFyOiBmdW5jdGlvbiBzZWxlY3RZZWFyKHllYXIpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRpc3BsYXlZZWFyOiB5ZWFyLFxuXHRcdFx0ZGlzcGxheVllYXJSYW5nZVN0YXJ0OiBNYXRoLmZsb29yKHllYXIgLyAxMCkgKiAxMCxcblx0XHRcdG1vZGU6ICdtb250aCdcblx0XHR9KTtcblx0fSxcblxuXHRoYW5kbGVyVG9wQmFyVGl0bGVDbGljazogZnVuY3Rpb24gaGFuZGxlclRvcEJhclRpdGxlQ2xpY2soKSB7XG5cdFx0aWYgKHRoaXMuc3RhdGUubW9kZSA9PT0gJ2RheScpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoeyBtb2RlOiAnbW9udGgnIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHsgbW9kZTogJ2RheScgfSk7XG5cdFx0fVxuXHR9LFxuXG5cdGhhbmRsZUxlZnRBcnJvd0NsaWNrOiBmdW5jdGlvbiBoYW5kbGVMZWZ0QXJyb3dDbGljaygpIHtcblx0XHRzd2l0Y2ggKHRoaXMuc3RhdGUubW9kZSkge1xuXHRcdFx0Y2FzZSAnZGF5Jzpcblx0XHRcdFx0dGhpcy5nb1ByZXZpb3VzTW9udGgoKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgJ21vbnRoJzpcblx0XHRcdFx0dGhpcy5nb1ByZXZpb3VzWWVhclJhbmdlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlICd5ZWFyJzpcblx0XHRcdFx0dGhpcy5nb1ByZXZpb3VzWWVhclJhbmdlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXHRoYW5kbGVSaWdodEFycm93Q2xpY2s6IGZ1bmN0aW9uIGhhbmRsZVJpZ2h0QXJyb3dDbGljaygpIHtcblx0XHRzd2l0Y2ggKHRoaXMuc3RhdGUubW9kZSkge1xuXHRcdFx0Y2FzZSAnZGF5Jzpcblx0XHRcdFx0dGhpcy5nb05leHRNb250aCgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnbW9udGgnOlxuXHRcdFx0XHR0aGlzLmdvTmV4dFllYXJSYW5nZSgpO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAneWVhcic6XG5cdFx0XHRcdHRoaXMuZ29OZXh0WWVhclJhbmdlKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXHRnb1ByZXZpb3VzTW9udGg6IGZ1bmN0aW9uIGdvUHJldmlvdXNNb250aCgpIHtcblx0XHRpZiAodGhpcy5zdGF0ZS5kaXNwbGF5TW9udGggPT09IDApIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRkaXNwbGF5TW9udGg6IDExLFxuXHRcdFx0XHRkaXNwbGF5WWVhcjogdGhpcy5zdGF0ZS5kaXNwbGF5WWVhciAtIDFcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0ZGlzcGxheU1vbnRoOiB0aGlzLnN0YXRlLmRpc3BsYXlNb250aCAtIDFcblx0XHRcdH0pO1xuXHRcdH1cblx0fSxcblxuXHRnb05leHRNb250aDogZnVuY3Rpb24gZ29OZXh0TW9udGgoKSB7XG5cdFx0aWYgKHRoaXMuc3RhdGUuZGlzcGxheU1vbnRoID09PSAxMSkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdGRpc3BsYXlNb250aDogMCxcblx0XHRcdFx0ZGlzcGxheVllYXI6IHRoaXMuc3RhdGUuZGlzcGxheVllYXIgKyAxXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdGRpc3BsYXlNb250aDogdGhpcy5zdGF0ZS5kaXNwbGF5TW9udGggKyAxXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cblx0Z29QcmV2aW91c1llYXI6IGZ1bmN0aW9uIGdvUHJldmlvdXNZZWFyKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZGlzcGxheVllYXI6IHRoaXMuc3RhdGUuZGlzcGxheVllYXIgLSAxXG5cdFx0fSk7XG5cdH0sXG5cblx0Z29OZXh0WWVhcjogZnVuY3Rpb24gZ29OZXh0WWVhcigpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRpc3BsYXlZZWFyOiB0aGlzLnN0YXRlLmRpc3BsYXlZZWFyICsgMVxuXHRcdH0pO1xuXHR9LFxuXG5cdGdvUHJldmlvdXNZZWFyUmFuZ2U6IGZ1bmN0aW9uIGdvUHJldmlvdXNZZWFyUmFuZ2UoKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRkaXNwbGF5WWVhclJhbmdlU3RhcnQ6IHRoaXMuc3RhdGUuZGlzcGxheVllYXJSYW5nZVN0YXJ0IC0gMTBcblx0XHR9KTtcblx0fSxcblxuXHRnb05leHRZZWFyUmFuZ2U6IGZ1bmN0aW9uIGdvTmV4dFllYXJSYW5nZSgpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRpc3BsYXlZZWFyUmFuZ2VTdGFydDogdGhpcy5zdGF0ZS5kaXNwbGF5WWVhclJhbmdlU3RhcnQgKyAxMFxuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlcldlZWtuYW1lczogZnVuY3Rpb24gcmVuZGVyV2Vla25hbWVzKCkge1xuXHRcdHJldHVybiBpMThuLndlZWtkYXlzTWluLm1hcChmdW5jdGlvbiAobmFtZSwgaSkge1xuXHRcdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnc3BhbicsXG5cdFx0XHRcdHsga2V5OiBuYW1lICsgaSwgY2xhc3NOYW1lOiAnd2Vlay1uYW1lJyB9LFxuXHRcdFx0XHRuYW1lXG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlckRheXM6IGZ1bmN0aW9uIHJlbmRlckRheXMoKSB7XG5cdFx0dmFyIGRpc3BsYXlZZWFyID0gdGhpcy5zdGF0ZS5kaXNwbGF5WWVhcjtcblx0XHR2YXIgZGlzcGxheU1vbnRoID0gdGhpcy5zdGF0ZS5kaXNwbGF5TW9udGg7XG5cdFx0dmFyIHRvZGF5ID0gbmV3IERhdGUoKTtcblx0XHR2YXIgbGFzdERheUluTW9udGggPSBuZXcgRGF0ZShkaXNwbGF5WWVhciwgZGlzcGxheU1vbnRoICsgMSwgMCk7XG5cdFx0dmFyIGRheXNJbk1vbnRoID0gbGFzdERheUluTW9udGguZ2V0RGF0ZSgpO1xuXHRcdHZhciBkYXlzSW5QcmV2aW91c01vbnRoID0gbmV3IERhdGUoZGlzcGxheVllYXIsIGRpc3BsYXlNb250aCwgMCkuZ2V0RGF0ZSgpO1xuXHRcdHZhciBzdGFydFdlZWtEYXkgPSBuZXcgRGF0ZShkaXNwbGF5WWVhciwgZGlzcGxheU1vbnRoLCAxKS5nZXREYXkoKTtcblx0XHR2YXIgZGF5cyA9IFtdO1xuXHRcdHZhciBpLCBkbSwgZHk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgc3RhcnRXZWVrRGF5OyBpKyspIHtcblx0XHRcdHZhciBkID0gZGF5c0luUHJldmlvdXNNb250aCAtIChzdGFydFdlZWtEYXkgLSAxIC0gaSk7XG5cdFx0XHRkbSA9IGRpc3BsYXlNb250aCAtIDE7XG5cdFx0XHRkeSA9IGRpc3BsYXlZZWFyO1xuXHRcdFx0aWYgKGRtID09PSAtMSkge1xuXHRcdFx0XHRkbSA9IDExO1xuXHRcdFx0XHRkeSAtPSAxO1xuXHRcdFx0fVxuXHRcdFx0ZGF5cy5wdXNoKF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0eyBrZXk6ICdwJyArIGksIG9uVGFwOiB0aGlzLnNlbGVjdERheS5iaW5kKHRoaXMsIGR5LCBkbSwgZCksIGNsYXNzTmFtZTogJ2RheSBpbi1wcmV2aW91cy1tb250aCcgfSxcblx0XHRcdFx0ZFxuXHRcdFx0KSk7XG5cdFx0fVxuXG5cdFx0dmFyIGluVGhpc01vbnRoID0gZGlzcGxheVllYXIgPT09IHRvZGF5LmdldEZ1bGxZZWFyKCkgJiYgZGlzcGxheU1vbnRoID09PSB0b2RheS5nZXRNb250aCgpO1xuXHRcdHZhciBpblNlbGVjdGVkTW9udGggPSBkaXNwbGF5WWVhciA9PT0gdGhpcy5zdGF0ZS55ZWFyICYmIGRpc3BsYXlNb250aCA9PT0gdGhpcy5zdGF0ZS5tb250aDtcblx0XHRmb3IgKGkgPSAxOyBpIDw9IGRheXNJbk1vbnRoOyBpKyspIHtcblx0XHRcdHZhciBjc3NDbGFzcyA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoe1xuXHRcdFx0XHQnZGF5JzogdHJ1ZSxcblx0XHRcdFx0J2lzLXRvZGF5JzogaW5UaGlzTW9udGggJiYgaSA9PT0gdG9kYXkuZ2V0RGF0ZSgpLFxuXHRcdFx0XHQnaXMtY3VycmVudCc6IGluU2VsZWN0ZWRNb250aCAmJiBpID09PSB0aGlzLnN0YXRlLmRheVxuXHRcdFx0fSk7XG5cdFx0XHRkYXlzLnB1c2goX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0XHR7IGtleTogaSwgb25UYXA6IHRoaXMuc2VsZWN0RGF5LmJpbmQodGhpcywgZGlzcGxheVllYXIsIGRpc3BsYXlNb250aCwgaSksIGNsYXNzTmFtZTogY3NzQ2xhc3MgfSxcblx0XHRcdFx0aVxuXHRcdFx0KSk7XG5cdFx0fVxuXG5cdFx0dmFyIGMgPSBzdGFydFdlZWtEYXkgKyBkYXlzSW5Nb250aDtcblx0XHRmb3IgKGkgPSAxOyBpIDw9IDQyIC0gYzsgaSsrKSB7XG5cdFx0XHRkbSA9IGRpc3BsYXlNb250aCArIDE7XG5cdFx0XHRkeSA9IGRpc3BsYXlZZWFyO1xuXHRcdFx0aWYgKGRtID09PSAxMikge1xuXHRcdFx0XHRkbSA9IDA7XG5cdFx0XHRcdGR5ICs9IDE7XG5cdFx0XHR9XG5cdFx0XHRkYXlzLnB1c2goX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0XHR7IGtleTogJ24nICsgaSwgb25UYXA6IHRoaXMuc2VsZWN0RGF5LmJpbmQodGhpcywgZHksIGRtLCBpKSwgY2xhc3NOYW1lOiAnZGF5IGluLW5leHQtbW9udGgnIH0sXG5cdFx0XHRcdGlcblx0XHRcdCkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBkYXlzO1xuXHR9LFxuXG5cdHJlbmRlck1vbnRoczogZnVuY3Rpb24gcmVuZGVyTW9udGhzKCkge1xuXHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRyZXR1cm4gaTE4bi5tb250aHMubWFwKGZ1bmN0aW9uIChuYW1lLCBtKSB7XG5cdFx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0XHR7IGtleTogbmFtZSArIG0sIGNsYXNzTmFtZTogKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnbW9udGgtbmFtZScsIHsgJ2lzLWN1cnJlbnQnOiBtID09PSBfdGhpcy5zdGF0ZS5kaXNwbGF5TW9udGggfSksXG5cdFx0XHRcdFx0b25UYXA6IF90aGlzLnNlbGVjdE1vbnRoLmJpbmQoX3RoaXMsIG0pIH0sXG5cdFx0XHRcdG5hbWVcblx0XHRcdCk7XG5cdFx0fSk7XG5cdH0sXG5cblx0cmVuZGVyWWVhcnM6IGZ1bmN0aW9uIHJlbmRlclllYXJzKCkge1xuXHRcdHZhciB5ZWFycyA9IFtdO1xuXHRcdGZvciAodmFyIGkgPSB0aGlzLnN0YXRlLmRpc3BsYXlZZWFyUmFuZ2VTdGFydCAtIDE7IGkgPCB0aGlzLnN0YXRlLmRpc3BsYXlZZWFyUmFuZ2VTdGFydCArIDExOyBpKyspIHtcblx0XHRcdHllYXJzLnB1c2goX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0XHR7IGtleTogaSwgY2xhc3NOYW1lOiAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCd5ZWFyJywgeyAnaXMtY3VycmVudCc6IGkgPT09IHRoaXMuc3RhdGUuZGlzcGxheVllYXIgfSksXG5cdFx0XHRcdFx0b25UYXA6IHRoaXMuc2VsZWN0WWVhci5iaW5kKHRoaXMsIGkpIH0sXG5cdFx0XHRcdGlcblx0XHRcdCkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB5ZWFycztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgdG9wQmFyVGl0bGUgPSAnJztcblx0XHRzd2l0Y2ggKHRoaXMuc3RhdGUubW9kZSkge1xuXHRcdFx0Y2FzZSAnZGF5Jzpcblx0XHRcdFx0dG9wQmFyVGl0bGUgPSBpMThuLmZvcm1hdFllYXJNb250aCh0aGlzLnN0YXRlLmRpc3BsYXlZZWFyLCB0aGlzLnN0YXRlLmRpc3BsYXlNb250aCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnbW9udGgnOlxuXHRcdFx0XHR0b3BCYXJUaXRsZSA9IHRoaXMuc3RhdGUuZGlzcGxheVllYXJSYW5nZVN0YXJ0ICsgJyAtICcgKyAodGhpcy5zdGF0ZS5kaXNwbGF5WWVhclJhbmdlU3RhcnQgKyA5KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnZGF0ZS1waWNrZXInLCAnbW9kZS0nICsgdGhpcy5zdGF0ZS5tb2RlKSB9LFxuXHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGNsYXNzTmFtZTogJ3RvcC1iYXInIH0sXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLCB7IGNsYXNzTmFtZTogJ2xlZnQtYXJyb3cnLCBvblRhcDogdGhpcy5oYW5kbGVMZWZ0QXJyb3dDbGljayB9KSxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX3JlYWN0VGFwcGFibGUyWydkZWZhdWx0J10sIHsgY2xhc3NOYW1lOiAncmlnaHQtYXJyb3cnLCBvblRhcDogdGhpcy5oYW5kbGVSaWdodEFycm93Q2xpY2sgfSksXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAndG9wLWJhci10aXRsZScsIG9uVGFwOiB0aGlzLmhhbmRsZXJUb3BCYXJUaXRsZUNsaWNrIH0sXG5cdFx0XHRcdFx0dG9wQmFyVGl0bGVcblx0XHRcdFx0KVxuXHRcdFx0KSxcblx0XHRcdHRoaXMuc3RhdGUubW9kZSA9PT0gJ2RheScgJiYgW19yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0eyBrZXk6ICd3ZWVrbmFtZXMnLCBjbGFzc05hbWU6ICd3ZWVrLW5hbWVzLWNvbnRhaW5lcicgfSxcblx0XHRcdFx0dGhpcy5yZW5kZXJXZWVrbmFtZXMoKVxuXHRcdFx0KSwgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGtleTogJ2RheXMnLCBjbGFzc05hbWU6ICdkYXlzLWNvbnRhaW5lcicgfSxcblx0XHRcdFx0dGhpcy5yZW5kZXJEYXlzKClcblx0XHRcdCldLFxuXHRcdFx0dGhpcy5zdGF0ZS5tb2RlID09PSAnbW9udGgnICYmIFtfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsga2V5OiAneWVhcnMnLCBjbGFzc05hbWU6ICd5ZWFycy1jb250YWluZXInIH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyWWVhcnMoKVxuXHRcdFx0KSwgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHR7IGtleTogJ21vbnRocycsIGNsYXNzTmFtZTogJ21vbnRoLW5hbWVzLWNvbnRhaW5lcicgfSxcblx0XHRcdFx0dGhpcy5yZW5kZXJNb250aHMoKVxuXHRcdFx0KV1cblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfRGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4vRGF0ZVBpY2tlcicpO1xuXG52YXIgX0RhdGVQaWNrZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRGF0ZVBpY2tlcik7XG5cbnZhciBfUG9wdXAgPSByZXF1aXJlKCcuL1BvcHVwJyk7XG5cbnZhciBfUG9wdXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUG9wdXApO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdEYXRlUGlja2VyUG9wdXAnLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmlzaWJsZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0RhdGVQaWNrZXInLCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cdFx0dmFyIHByb3BzID0gKDAsIF9ibGFja2xpc3QyWydkZWZhdWx0J10pKHRoaXMucHJvcHMsICdjbGFzc05hbWUnLCAndmlzaWJsZScpO1xuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdF9Qb3B1cDJbJ2RlZmF1bHQnXSxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUsIHZpc2libGU6IHRoaXMucHJvcHMudmlzaWJsZSB9LFxuXHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0RhdGVQaWNrZXIyWydkZWZhdWx0J10sIHByb3BzKVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnRmllbGRDb250cm9sJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0ZpZWxkQ29udHJvbCcsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NsYXNzTmFtZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHByb3BzKSk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnRmllbGRMYWJlbCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdGaWVsZExhYmVsJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdHcm91cCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGhhc1RvcEd1dHRlcjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdHcm91cCcsIHtcblx0XHRcdCdHcm91cC0taGFzLWd1dHRlci10b3AnOiB0aGlzLnByb3BzLmhhc1RvcEd1dHRlclxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NsYXNzTmFtZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHByb3BzKSk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnR3JvdXBCb2R5Jyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0dyb3VwX19ib2R5JywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdHcm91cEZvb3RlcicsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdHcm91cF9fZm9vdGVyJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdHcm91cEhlYWRlcicsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdHcm91cF9faGVhZGVyJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdHcm91cElubmVyJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0dyb3VwX19pbm5lcicsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NsYXNzTmFtZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHByb3BzKSk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX0l0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxudmFyIF9JdGVtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW0pO1xuXG52YXIgX0l0ZW1Db250ZW50ID0gcmVxdWlyZSgnLi9JdGVtQ29udGVudCcpO1xuXG52YXIgX0l0ZW1Db250ZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW1Db250ZW50KTtcblxudmFyIF9JdGVtSW5uZXIgPSByZXF1aXJlKCcuL0l0ZW1Jbm5lcicpO1xuXG52YXIgX0l0ZW1Jbm5lcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JdGVtSW5uZXIpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbi8vIE1hbnkgaW5wdXQgdHlwZXMgRE8gTk9UIHN1cHBvcnQgc2V0U2VsZWN0aW9uUmFuZ2UuXG4vLyBFbWFpbCB3aWxsIHNob3cgYW4gZXJyb3Igb24gbW9zdCBkZXNrdG9wIGJyb3dzZXJzIGJ1dCB3b3JrcyBvblxuLy8gbW9iaWxlIHNhZmFyaSArIFdLV2ViVmlldywgd2hpY2ggaXMgcmVhbGx5IHdoYXQgd2UgY2FyZSBhYm91dFxudmFyIFNFTEVDVEFCTEVfSU5QVVRfVFlQRVMgPSB7XG5cdCdlbWFpbCc6IHRydWUsXG5cdCdwYXNzd29yZCc6IHRydWUsXG5cdCdzZWFyY2gnOiB0cnVlLFxuXHQndGVsJzogdHJ1ZSxcblx0J3RleHQnOiB0cnVlLFxuXHQndXJsJzogdHJ1ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0lucHV0JyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRhdXRvRm9jdXM6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUsXG5cdFx0ZGlzYWJsZWQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbFxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiBjb21wb25lbnREaWRNb3VudCgpIHtcblx0XHRpZiAodGhpcy5wcm9wcy5hdXRvRm9jdXMpIHtcblx0XHRcdHRoaXMubW92ZUN1cnNvclRvRW5kKCk7XG5cdFx0fVxuXHR9LFxuXG5cdG1vdmVDdXJzb3JUb0VuZDogZnVuY3Rpb24gbW92ZUN1cnNvclRvRW5kKCkge1xuXHRcdHZhciB0YXJnZXQgPSB0aGlzLnJlZnMuZm9jdXNUYXJnZXQuZ2V0RE9NTm9kZSgpO1xuXHRcdHZhciBlbmRPZlN0cmluZyA9IHRhcmdldC52YWx1ZS5sZW5ndGg7XG5cblx0XHRpZiAoU0VMRUNUQUJMRV9JTlBVVF9UWVBFUy5oYXNPd25Qcm9wZXJ0eSh0YXJnZXQudHlwZSkpIHtcblx0XHRcdHRhcmdldC5mb2N1cygpO1xuXHRcdFx0dGFyZ2V0LnNldFNlbGVjdGlvblJhbmdlKGVuZE9mU3RyaW5nLCBlbmRPZlN0cmluZyk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBpbnB1dFByb3BzID0gKDAsIF9ibGFja2xpc3QyWydkZWZhdWx0J10pKHRoaXMucHJvcHMsICdjaGlsZHJlbicsICdjbGFzc05hbWUnKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdF9JdGVtMlsnZGVmYXVsdCddLFxuXHRcdFx0eyBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBzZWxlY3RhYmxlOiB0aGlzLnByb3BzLmRpc2FibGVkLCBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfSXRlbUlubmVyMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRfSXRlbUNvbnRlbnQyWydkZWZhdWx0J10sXG5cdFx0XHRcdFx0eyBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBfZXh0ZW5kcyh7IHJlZjogJ2ZvY3VzVGFyZ2V0JywgY2xhc3NOYW1lOiAnZmllbGQnLCB0eXBlOiAndGV4dCcgfSwgaW5wdXRQcm9wcykpXG5cdFx0XHRcdCksXG5cdFx0XHRcdHRoaXMucHJvcHMuY2hpbGRyZW5cblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0l0ZW0nLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjb21wb25lbnQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYW55LFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c2hvd0Rpc2Nsb3N1cmVBcnJvdzogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sXG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbXBvbmVudDogJ2Rpdidcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjb21wb25lbnRDbGFzcyA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0l0ZW0nLCB7XG5cdFx0XHQnSXRlbS0taGFzLWRpc2Nsb3N1cmUtYXJyb3cnOiB0aGlzLnByb3BzLnNob3dEaXNjbG9zdXJlQXJyb3dcblx0XHR9LCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NoaWxkcmVuJywgJ2NsYXNzTmFtZScsICdzaG93RGlzY2xvc3VyZUFycm93Jyk7XG5cdFx0cHJvcHMuY2xhc3NOYW1lID0gY29tcG9uZW50Q2xhc3M7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQodGhpcy5wcm9wcy5jb21wb25lbnQsIHByb3BzLCB0aGlzLnByb3BzLmNoaWxkcmVuKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdJdGVtQ29udGVudCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdJdGVtX19jb250ZW50JywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdJdGVtSW5uZXInLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0l0ZW1fX2lubmVyJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHRoaXMucHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdJdGVtTWVkaWEnLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRhdmF0YXI6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGF2YXRhckluaXRpYWxzOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb246IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHRodW1ibmFpbDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSh7XG5cdFx0XHQnSXRlbV9fbWVkaWEnOiB0cnVlLFxuXHRcdFx0J0l0ZW1fX21lZGlhLS1pY29uJzogdGhpcy5wcm9wcy5pY29uLFxuXHRcdFx0J0l0ZW1fX21lZGlhLS1hdmF0YXInOiB0aGlzLnByb3BzLmF2YXRhciB8fCB0aGlzLnByb3BzLmF2YXRhckluaXRpYWxzLFxuXHRcdFx0J0l0ZW1fX21lZGlhLS10aHVtYm5haWwnOiB0aGlzLnByb3BzLnRodW1ibmFpbFxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdC8vIG1lZGlhIHR5cGVzXG5cdFx0dmFyIGljb24gPSB0aGlzLnByb3BzLmljb24gPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdJdGVtX19tZWRpYV9faWNvbiAnICsgdGhpcy5wcm9wcy5pY29uIH0pIDogbnVsbDtcblx0XHR2YXIgYXZhdGFyID0gdGhpcy5wcm9wcy5hdmF0YXIgfHwgdGhpcy5wcm9wcy5hdmF0YXJJbml0aWFscyA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ0l0ZW1fX21lZGlhX19hdmF0YXInIH0sXG5cdFx0XHR0aGlzLnByb3BzLmF2YXRhciA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdpbWcnLCB7IHNyYzogdGhpcy5wcm9wcy5hdmF0YXIgfSkgOiB0aGlzLnByb3BzLmF2YXRhckluaXRpYWxzXG5cdFx0KSA6IG51bGw7XG5cdFx0dmFyIHRodW1ibmFpbCA9IHRoaXMucHJvcHMudGh1bWJuYWlsID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnSXRlbV9fbWVkaWFfX3RodW1ibmFpbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdpbWcnLCB7IHNyYzogdGhpcy5wcm9wcy50aHVtYm5haWwgfSlcblx0XHQpIDogbnVsbDtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LFxuXHRcdFx0aWNvbixcblx0XHRcdGF2YXRhcixcblx0XHRcdHRodW1ibmFpbFxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnSXRlbU5vdGUnLFxuXHRwcm9wVHlwZXM6IHtcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGljb246IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGxhYmVsOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHR0eXBlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2RlZmF1bHQnXG5cdFx0fTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0l0ZW1fX25vdGUnLCAnSXRlbV9fbm90ZS0tJyArIHRoaXMucHJvcHMudHlwZSwgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXG5cdFx0Ly8gZWxlbWVudHNcblx0XHR2YXIgbGFiZWwgPSB0aGlzLnByb3BzLmxhYmVsID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnSXRlbV9fbm90ZV9fbGFiZWwnIH0sXG5cdFx0XHR0aGlzLnByb3BzLmxhYmVsXG5cdFx0KSA6IG51bGw7XG5cdFx0dmFyIGljb24gPSB0aGlzLnByb3BzLmljb24gPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdJdGVtX19ub3RlX19pY29uICcgKyB0aGlzLnByb3BzLmljb24gfSkgOiBudWxsO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sXG5cdFx0XHRsYWJlbCxcblx0XHRcdGljb25cblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0l0ZW1TdWJUaXRsZScsXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUuaXNSZXF1aXJlZCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdJdGVtX19zdWJ0aXRsZScsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NsYXNzTmFtZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHByb3BzKSk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnSXRlbVRpdGxlJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZS5pc1JlcXVpcmVkLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ0l0ZW1fX3RpdGxlJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBwcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnY2xhc3NOYW1lJyk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSwgcHJvcHMpKTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfRmllbGRDb250cm9sID0gcmVxdWlyZSgnLi9GaWVsZENvbnRyb2wnKTtcblxudmFyIF9GaWVsZENvbnRyb2wyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRmllbGRDb250cm9sKTtcblxudmFyIF9JdGVtID0gcmVxdWlyZSgnLi9JdGVtJyk7XG5cbnZhciBfSXRlbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JdGVtKTtcblxudmFyIF9JdGVtSW5uZXIgPSByZXF1aXJlKCcuL0l0ZW1Jbm5lcicpO1xuXG52YXIgX0l0ZW1Jbm5lcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JdGVtSW5uZXIpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdFRhcHBhYmxlKTtcblxuLy8gTWFueSBpbnB1dCB0eXBlcyBETyBOT1Qgc3VwcG9ydCBzZXRTZWxlY3Rpb25SYW5nZS5cbi8vIEVtYWlsIHdpbGwgc2hvdyBhbiBlcnJvciBvbiBtb3N0IGRlc2t0b3AgYnJvd3NlcnMgYnV0IHdvcmtzIG9uXG4vLyBtb2JpbGUgc2FmYXJpICsgV0tXZWJWaWV3LCB3aGljaCBpcyByZWFsbHkgd2hhdCB3ZSBjYXJlIGFib3V0XG52YXIgU0VMRUNUQUJMRV9JTlBVVF9UWVBFUyA9IHtcblx0J2VtYWlsJzogdHJ1ZSxcblx0J3Bhc3N3b3JkJzogdHJ1ZSxcblx0J3NlYXJjaCc6IHRydWUsXG5cdCd0ZWwnOiB0cnVlLFxuXHQndGV4dCc6IHRydWUsXG5cdCd1cmwnOiB0cnVlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTGFiZWxJbnB1dCcsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0YWxpZ25Ub3A6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRhdXRvRm9jdXM6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRjaGlsZHJlbjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ub2RlLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0ZGlzYWJsZWQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRsYWJlbDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0cmVhZE9ubHk6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHR2YWx1ZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gY29tcG9uZW50RGlkTW91bnQoKSB7XG5cdFx0aWYgKHRoaXMucHJvcHMuYXV0b0ZvY3VzKSB7XG5cdFx0XHR0aGlzLm1vdmVDdXJzb3JUb0VuZCgpO1xuXHRcdH1cblx0fSxcblxuXHRtb3ZlQ3Vyc29yVG9FbmQ6IGZ1bmN0aW9uIG1vdmVDdXJzb3JUb0VuZCgpIHtcblx0XHR2YXIgdGFyZ2V0ID0gdGhpcy5yZWZzLmZvY3VzVGFyZ2V0LmdldERPTU5vZGUoKTtcblx0XHR2YXIgZW5kT2ZTdHJpbmcgPSB0YXJnZXQudmFsdWUubGVuZ3RoO1xuXG5cdFx0aWYgKFNFTEVDVEFCTEVfSU5QVVRfVFlQRVMuaGFzT3duUHJvcGVydHkodGFyZ2V0LnR5cGUpKSB7XG5cdFx0XHR0YXJnZXQuZm9jdXMoKTtcblx0XHRcdHRhcmdldC5zZXRTZWxlY3Rpb25SYW5nZShlbmRPZlN0cmluZywgZW5kT2ZTdHJpbmcpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgaW5wdXRQcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnYWxpZ25Ub3AnLCAnY2hpbGRyZW4nLCAnZmlyc3QnLCAncmVhZE9ubHknKTtcblx0XHR2YXIgcmVuZGVySW5wdXQgPSB0aGlzLnByb3BzLnJlYWRPbmx5ID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiAnZmllbGQgdS1zZWxlY3RhYmxlJyB9LFxuXHRcdFx0dGhpcy5wcm9wcy52YWx1ZVxuXHRcdCkgOiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnaW5wdXQnLCBfZXh0ZW5kcyh7IHJlZjogJ2ZvY3VzVGFyZ2V0JywgY2xhc3NOYW1lOiAnZmllbGQnLCB0eXBlOiAndGV4dCcgfSwgaW5wdXRQcm9wcykpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X0l0ZW0yWydkZWZhdWx0J10sXG5cdFx0XHR7IGFsaWduVG9wOiB0aGlzLnByb3BzLmFsaWduVG9wLCBzZWxlY3RhYmxlOiB0aGlzLnByb3BzLmRpc2FibGVkLCBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfSXRlbUlubmVyMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0XHR7IG9uVGFwOiB0aGlzLm1vdmVDdXJzb3JUb0VuZCwgY2xhc3NOYW1lOiAnRmllbGRMYWJlbCcgfSxcblx0XHRcdFx0XHR0aGlzLnByb3BzLmxhYmVsXG5cdFx0XHRcdCksXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdF9GaWVsZENvbnRyb2wyWydkZWZhdWx0J10sXG5cdFx0XHRcdFx0bnVsbCxcblx0XHRcdFx0XHRyZW5kZXJJbnB1dCxcblx0XHRcdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9GaWVsZENvbnRyb2wgPSByZXF1aXJlKCcuL0ZpZWxkQ29udHJvbCcpO1xuXG52YXIgX0ZpZWxkQ29udHJvbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9GaWVsZENvbnRyb2wpO1xuXG52YXIgX0ZpZWxkTGFiZWwgPSByZXF1aXJlKCcuL0ZpZWxkTGFiZWwnKTtcblxudmFyIF9GaWVsZExhYmVsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0ZpZWxkTGFiZWwpO1xuXG52YXIgX0l0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxudmFyIF9JdGVtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW0pO1xuXG52YXIgX0l0ZW1Jbm5lciA9IHJlcXVpcmUoJy4vSXRlbUlubmVyJyk7XG5cbnZhciBfSXRlbUlubmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW1Jbm5lcik7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0xhYmVsU2VsZWN0Jyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0Y2xhc3NOYW1lOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sLFxuXHRcdGxhYmVsOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvbkNoYW5nZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG5cdFx0b3B0aW9uczogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuXHRcdHZhbHVlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mVHlwZShbX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5udW1iZXIsIF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXSlcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2xhc3NOYW1lOiAnJ1xuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyT3B0aW9uczogZnVuY3Rpb24gcmVuZGVyT3B0aW9ucygpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5vcHRpb25zLm1hcChmdW5jdGlvbiAob3ApIHtcblx0XHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J29wdGlvbicsXG5cdFx0XHRcdHsga2V5OiAnb3B0aW9uLScgKyBvcC52YWx1ZSwgdmFsdWU6IG9wLnZhbHVlIH0sXG5cdFx0XHRcdG9wLmxhYmVsXG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdF9JdGVtMlsnZGVmYXVsdCddLFxuXHRcdFx0eyBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfSXRlbUlubmVyMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRfRmllbGRMYWJlbDJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdHRoaXMucHJvcHMubGFiZWxcblx0XHRcdFx0KSxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0X0ZpZWxkQ29udHJvbDJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0J3NlbGVjdCcsXG5cdFx0XHRcdFx0XHR7IGRpc2FibGVkOiB0aGlzLnByb3BzLmRpc2FibGVkLCB2YWx1ZTogdGhpcy5wcm9wcy52YWx1ZSwgb25DaGFuZ2U6IHRoaXMucHJvcHMub25DaGFuZ2UsIGNsYXNzTmFtZTogJ3NlbGVjdC1maWVsZCcgfSxcblx0XHRcdFx0XHRcdHRoaXMucmVuZGVyT3B0aW9ucygpXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHRcdFx0eyBjbGFzc05hbWU6ICdzZWxlY3QtZmllbGQtaW5kaWNhdG9yJyB9LFxuXHRcdFx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnc2VsZWN0LWZpZWxkLWluZGljYXRvci1hcnJvdycgfSlcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0xhYmVsVGV4dGFyZWEnLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNoaWxkcmVuOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm5vZGUsXG5cdFx0Y2xhc3NOYW1lOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRkaXNhYmxlZDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sLFxuXHRcdGZpcnN0OiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0bGFiZWw6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdHJlYWRPbmx5OiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0dmFsdWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJvd3M6IDNcblx0XHR9O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKHRoaXMucHJvcHMuY2xhc3NOYW1lLCAnbGlzdC1pdGVtJywgJ2ZpZWxkLWl0ZW0nLCAnYWxpZ24tdG9wJywge1xuXHRcdFx0J2lzLWZpcnN0JzogdGhpcy5wcm9wcy5maXJzdCxcblx0XHRcdCd1LXNlbGVjdGFibGUnOiB0aGlzLnByb3BzLmRpc2FibGVkXG5cdFx0fSk7XG5cblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NoaWxkcmVuJywgJ2NsYXNzTmFtZScsICdkaXNhYmxlZCcsICdmaXJzdCcsICdsYWJlbCcsICdyZWFkT25seScpO1xuXG5cdFx0dmFyIHJlbmRlcklucHV0ID0gdGhpcy5wcm9wcy5yZWFkT25seSA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkIHUtc2VsZWN0YWJsZScgfSxcblx0XHRcdHRoaXMucHJvcHMudmFsdWVcblx0XHQpIDogX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJywgX2V4dGVuZHMoe30sIHByb3BzLCB7IGNsYXNzTmFtZTogJ2ZpZWxkJyB9KSk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHQnZGl2Jyxcblx0XHRcdHsgY2xhc3NOYW1lOiBjbGFzc05hbWUgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnbGFiZWwnLFxuXHRcdFx0XHR7IGNsYXNzTmFtZTogJ2l0ZW0taW5uZXInIH0sXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdCdkaXYnLFxuXHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAnZmllbGQtbGFiZWwnIH0sXG5cdFx0XHRcdFx0dGhpcy5wcm9wcy5sYWJlbFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ2ZpZWxkLWNvbnRyb2wnIH0sXG5cdFx0XHRcdFx0cmVuZGVySW5wdXQsXG5cdFx0XHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX0ZpZWxkQ29udHJvbCA9IHJlcXVpcmUoJy4vRmllbGRDb250cm9sJyk7XG5cbnZhciBfRmllbGRDb250cm9sMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0ZpZWxkQ29udHJvbCk7XG5cbnZhciBfSXRlbSA9IHJlcXVpcmUoJy4vSXRlbScpO1xuXG52YXIgX0l0ZW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSXRlbSk7XG5cbnZhciBfSXRlbUlubmVyID0gcmVxdWlyZSgnLi9JdGVtSW5uZXInKTtcblxudmFyIF9JdGVtSW5uZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSXRlbUlubmVyKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTGFiZWxWYWx1ZScsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0YWxpZ25Ub3A6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGxhYmVsOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRwbGFjZWhvbGRlcjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmFsdWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X0l0ZW0yWydkZWZhdWx0J10sXG5cdFx0XHR7IGFsaWduVG9wOiB0aGlzLnByb3BzLmFsaWduVG9wLCBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lLCBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfSXRlbUlubmVyMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRudWxsLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ0ZpZWxkTGFiZWwnIH0sXG5cdFx0XHRcdFx0dGhpcy5wcm9wcy5sYWJlbFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRfRmllbGRDb250cm9sMlsnZGVmYXVsdCddLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHRcdHsgY2xhc3NOYW1lOiAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdmaWVsZCcsIHRoaXMucHJvcHMudmFsdWUgPyAndS1zZWxlY3RhYmxlJyA6ICdmaWVsZC1wbGFjZWhvbGRlcicpIH0sXG5cdFx0XHRcdFx0XHR0aGlzLnByb3BzLnZhbHVlIHx8IHRoaXMucHJvcHMucGxhY2Vob2xkZXJcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9ibGFja2xpc3QgPSByZXF1aXJlKCdibGFja2xpc3QnKTtcblxudmFyIF9ibGFja2xpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmxhY2tsaXN0KTtcblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ0xpc3RIZWFkZXInLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0c3RpY2t5OiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2xcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnbGlzdC1oZWFkZXInLCB7XG5cdFx0XHQnc3RpY2t5JzogdGhpcy5wcm9wcy5zdGlja3lcblx0XHR9LCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cblx0XHR2YXIgcHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ3N0aWNreScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCBfZXh0ZW5kcyh7IGNsYXNzTmFtZTogY2xhc3NOYW1lIH0sIHByb3BzKSk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cCA9IHJlcXVpcmUoJ3JlYWN0LWFkZG9ucy1jc3MtdHJhbnNpdGlvbi1ncm91cCcpO1xuXG52YXIgX3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwKTtcblxudmFyIF9yZWFjdFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIF9yZWFjdFRhcHBhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0VGFwcGFibGUpO1xuXG52YXIgRElSRUNUSU9OUyA9IHtcblx0J3JldmVhbC1mcm9tLXJpZ2h0JzogLTEsXG5cdCdzaG93LWZyb20tbGVmdCc6IC0xLFxuXHQnc2hvdy1mcm9tLXJpZ2h0JzogMSxcblx0J3JldmVhbC1mcm9tLWxlZnQnOiAxXG59O1xuXG52YXIgZGVmYXVsdENvbnRyb2xsZXJTdGF0ZSA9IHtcblx0ZGlyZWN0aW9uOiAwLFxuXHRmYWRlOiBmYWxzZSxcblx0bGVmdEFycm93OiBmYWxzZSxcblx0bGVmdEJ1dHRvbkRpc2FibGVkOiBmYWxzZSxcblx0bGVmdEljb246ICcnLFxuXHRsZWZ0TGFiZWw6ICcnLFxuXHRsZWZ0QWN0aW9uOiBudWxsLFxuXHRyaWdodEFycm93OiBmYWxzZSxcblx0cmlnaHRCdXR0b25EaXNhYmxlZDogZmFsc2UsXG5cdHJpZ2h0SWNvbjogJycsXG5cdHJpZ2h0TGFiZWw6ICcnLFxuXHRyaWdodEFjdGlvbjogbnVsbCxcblx0dGl0bGU6ICcnXG59O1xuXG5mdW5jdGlvbiBuZXdTdGF0ZShmcm9tKSB7XG5cdHZhciBucyA9IF9leHRlbmRzKHt9LCBkZWZhdWx0Q29udHJvbGxlclN0YXRlKTtcblx0aWYgKGZyb20pIF9leHRlbmRzKG5zLCBmcm9tKTtcblx0ZGVsZXRlIG5zLm5hbWU7IC8vIG1heSBsZWFrIGZyb20gcHJvcHNcblx0cmV0dXJuIG5zO1xufVxuXG52YXIgTmF2aWdhdGlvbkJhciA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTmF2aWdhdGlvbkJhcicsXG5cblx0Y29udGV4dFR5cGVzOiB7XG5cdFx0YXBwOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9iamVjdFxuXHR9LFxuXG5cdHByb3BUeXBlczoge1xuXHRcdG5hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcblx0XHRyZXR1cm4gbmV3U3RhdGUodGhpcy5wcm9wcyk7XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uIGNvbXBvbmVudERpZE1vdW50KCkge1xuXHRcdGlmICh0aGlzLnByb3BzLm5hbWUpIHtcblx0XHRcdHRoaXMuY29udGV4dC5hcHAubmF2aWdhdGlvbkJhcnNbdGhpcy5wcm9wcy5uYW1lXSA9IHRoaXM7XG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcblx0XHRpZiAodGhpcy5wcm9wcy5uYW1lKSB7XG5cdFx0XHRkZWxldGUgdGhpcy5jb250ZXh0LmFwcC5uYXZpZ2F0aW9uQmFyc1t0aGlzLnByb3BzLm5hbWVdO1xuXHRcdH1cblx0fSxcblxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuXHRcdHRoaXMuc2V0U3RhdGUobmV3U3RhdGUobmV4dFByb3BzKSk7XG5cdFx0aWYgKG5leHRQcm9wcy5uYW1lICE9PSB0aGlzLnByb3BzLm5hbWUpIHtcblx0XHRcdGlmIChuZXh0UHJvcHMubmFtZSkge1xuXHRcdFx0XHR0aGlzLmNvbnRleHQuYXBwLm5hdmlnYXRpb25CYXJzW25leHRQcm9wcy5uYW1lXSA9IHRoaXM7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5wcm9wcy5uYW1lKSB7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLmNvbnRleHQuYXBwLm5hdmlnYXRpb25CYXJzW3RoaXMucHJvcHMubmFtZV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKHN0YXRlKSB7XG5cdFx0Ly8gRklYTUU6IHdoYXQgaXMgaGFwcGVuaW5nIGhlcmVcblx0XHRzdGF0ZSA9IG5ld1N0YXRlKHN0YXRlKTtcblx0XHR0aGlzLnNldFN0YXRlKG5ld1N0YXRlKHN0YXRlKSk7XG5cdH0sXG5cblx0dXBkYXRlV2l0aFRyYW5zaXRpb246IGZ1bmN0aW9uIHVwZGF0ZVdpdGhUcmFuc2l0aW9uKHN0YXRlLCB0cmFuc2l0aW9uKSB7XG5cdFx0c3RhdGUgPSBuZXdTdGF0ZShzdGF0ZSk7XG5cdFx0c3RhdGUuZGlyZWN0aW9uID0gRElSRUNUSU9OU1t0cmFuc2l0aW9uXSB8fCAwO1xuXG5cdFx0aWYgKHRyYW5zaXRpb24gPT09ICdmYWRlJyB8fCB0cmFuc2l0aW9uID09PSAnZmFkZS1jb250cmFjdCcgfHwgdHJhbnNpdGlvbiA9PT0gJ2ZhZGUtZXhwYW5kJykge1xuXHRcdFx0c3RhdGUuZmFkZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRTdGF0ZShzdGF0ZSk7XG5cdH0sXG5cblx0cmVuZGVyTGVmdEJ1dHRvbjogZnVuY3Rpb24gcmVuZGVyTGVmdEJ1dHRvbigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnTmF2aWdhdGlvbkJhckxlZnRCdXR0b24nLCB7XG5cdFx0XHQnaGFzLWFycm93JzogdGhpcy5zdGF0ZS5sZWZ0QXJyb3dcblx0XHR9KTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLFxuXHRcdFx0eyBvblRhcDogdGhpcy5zdGF0ZS5sZWZ0QWN0aW9uLCBjbGFzc05hbWU6IGNsYXNzTmFtZSwgZGlzYWJsZWQ6IHRoaXMuc3RhdGUubGVmdEJ1dHRvbkRpc2FibGVkLCBjb21wb25lbnQ6ICdidXR0b24nIH0sXG5cdFx0XHR0aGlzLnJlbmRlckxlZnRBcnJvdygpLFxuXHRcdFx0dGhpcy5yZW5kZXJMZWZ0TGFiZWwoKVxuXHRcdCk7XG5cdH0sXG5cblx0cmVuZGVyTGVmdEFycm93OiBmdW5jdGlvbiByZW5kZXJMZWZ0QXJyb3coKSB7XG5cdFx0dmFyIHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnO1xuXHRcdGlmICh0aGlzLnN0YXRlLmZhZGUgfHwgdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUZhZGUnO1xuXHRcdH1cblx0XHR2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gdHJhbnNpdGlvbk5hbWUgPT09ICdOYXZpZ2F0aW9uQmFyVHJhbnNpdGlvbi1JbnN0YW50JyA/IDUwIDogNTAwO1xuXG5cdFx0dmFyIGFycm93ID0gdGhpcy5zdGF0ZS5sZWZ0QXJyb3cgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnc3BhbicsIHsgY2xhc3NOYW1lOiAnTmF2aWdhdGlvbkJhckxlZnRBcnJvdycgfSkgOiBudWxsO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwMlsnZGVmYXVsdCddLFxuXHRcdFx0eyB0cmFuc2l0aW9uTmFtZTogdHJhbnNpdGlvbk5hbWUsIHRyYW5zaXRpb25FbnRlclRpbWVvdXQ6IHRyYW5zaXRpb25EdXJhdGlvbiwgdHJhbnNpdGlvbkxlYXZlVGltZW91dDogdHJhbnNpdGlvbkR1cmF0aW9uIH0sXG5cdFx0XHRhcnJvd1xuXHRcdCk7XG5cdH0sXG5cblx0cmVuZGVyTGVmdExhYmVsOiBmdW5jdGlvbiByZW5kZXJMZWZ0TGFiZWwoKSB7XG5cdFx0dmFyIHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnO1xuXHRcdGlmICh0aGlzLnN0YXRlLmZhZGUpIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUZhZGUnO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24gPiAwKSB7XG5cdFx0XHR0cmFuc2l0aW9uTmFtZSA9ICdOYXZpZ2F0aW9uQmFyVHJhbnNpdGlvbi1Gb3J3YXJkcyc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbiA8IDApIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUJhY2t3YXJkcyc7XG5cdFx0fVxuXHRcdHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uTmFtZSA9PT0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnID8gNTAgOiA1MDA7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXAyWydkZWZhdWx0J10sXG5cdFx0XHR7IHRyYW5zaXRpb25OYW1lOiB0cmFuc2l0aW9uTmFtZSwgdHJhbnNpdGlvbkVudGVyVGltZW91dDogdHJhbnNpdGlvbkR1cmF0aW9uLCB0cmFuc2l0aW9uTGVhdmVUaW1lb3V0OiB0cmFuc2l0aW9uRHVyYXRpb24gfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnc3BhbicsXG5cdFx0XHRcdHsga2V5OiBEYXRlLm5vdygpLCBjbGFzc05hbWU6ICdOYXZpZ2F0aW9uQmFyTGVmdExhYmVsJyB9LFxuXHRcdFx0XHR0aGlzLnN0YXRlLmxlZnRMYWJlbFxuXHRcdFx0KVxuXHRcdCk7XG5cdH0sXG5cblx0cmVuZGVyVGl0bGU6IGZ1bmN0aW9uIHJlbmRlclRpdGxlKCkge1xuXHRcdHZhciB0aXRsZSA9IHRoaXMuc3RhdGUudGl0bGUgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdzcGFuJyxcblx0XHRcdHsga2V5OiBEYXRlLm5vdygpLCBjbGFzc05hbWU6ICdOYXZpZ2F0aW9uQmFyVGl0bGUnIH0sXG5cdFx0XHR0aGlzLnN0YXRlLnRpdGxlXG5cdFx0KSA6IG51bGw7XG5cdFx0dmFyIHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnO1xuXHRcdGlmICh0aGlzLnN0YXRlLmZhZGUpIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUZhZGUnO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24gPiAwKSB7XG5cdFx0XHR0cmFuc2l0aW9uTmFtZSA9ICdOYXZpZ2F0aW9uQmFyVHJhbnNpdGlvbi1Gb3J3YXJkcyc7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbiA8IDApIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUJhY2t3YXJkcyc7XG5cdFx0fVxuXHRcdHZhciB0cmFuc2l0aW9uRHVyYXRpb24gPSB0cmFuc2l0aW9uTmFtZSA9PT0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnID8gNTAgOiA1MDA7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRfcmVhY3RBZGRvbnNDc3NUcmFuc2l0aW9uR3JvdXAyWydkZWZhdWx0J10sXG5cdFx0XHR7IHRyYW5zaXRpb25OYW1lOiB0cmFuc2l0aW9uTmFtZSwgdHJhbnNpdGlvbkVudGVyVGltZW91dDogdHJhbnNpdGlvbkR1cmF0aW9uLCB0cmFuc2l0aW9uTGVhdmVUaW1lb3V0OiB0cmFuc2l0aW9uRHVyYXRpb24gfSxcblx0XHRcdHRpdGxlXG5cdFx0KTtcblx0fSxcblxuXHRyZW5kZXJSaWdodEJ1dHRvbjogZnVuY3Rpb24gcmVuZGVyUmlnaHRCdXR0b24oKSB7XG5cdFx0dmFyIHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUluc3RhbnQnO1xuXHRcdGlmICh0aGlzLnN0YXRlLmZhZGUgfHwgdGhpcy5zdGF0ZS5kaXJlY3Rpb24pIHtcblx0XHRcdHRyYW5zaXRpb25OYW1lID0gJ05hdmlnYXRpb25CYXJUcmFuc2l0aW9uLUZhZGUnO1xuXHRcdH1cblx0XHR2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gdHJhbnNpdGlvbk5hbWUgPT09ICdOYXZpZ2F0aW9uQmFyVHJhbnNpdGlvbi1JbnN0YW50JyA/IDUwIDogNTAwO1xuXG5cdFx0dmFyIGJ1dHRvbiA9IHRoaXMuc3RhdGUucmlnaHRJY29uIHx8IHRoaXMuc3RhdGUucmlnaHRMYWJlbCA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X3JlYWN0VGFwcGFibGUyWydkZWZhdWx0J10sXG5cdFx0XHR7IGtleTogRGF0ZS5ub3coKSwgb25UYXA6IHRoaXMuc3RhdGUucmlnaHRBY3Rpb24sIGNsYXNzTmFtZTogJ05hdmlnYXRpb25CYXJSaWdodEJ1dHRvbicsIGRpc2FibGVkOiB0aGlzLnN0YXRlLnJpZ2h0QnV0dG9uRGlzYWJsZWQsIGNvbXBvbmVudDogJ2J1dHRvbicgfSxcblx0XHRcdHRoaXMucmVuZGVyUmlnaHRMYWJlbCgpLFxuXHRcdFx0dGhpcy5yZW5kZXJSaWdodEljb24oKVxuXHRcdCkgOiBudWxsO1xuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cDJbJ2RlZmF1bHQnXSxcblx0XHRcdHsgdHJhbnNpdGlvbk5hbWU6IHRyYW5zaXRpb25OYW1lLCB0cmFuc2l0aW9uRW50ZXJUaW1lb3V0OiB0cmFuc2l0aW9uRHVyYXRpb24sIHRyYW5zaXRpb25MZWF2ZVRpbWVvdXQ6IHRyYW5zaXRpb25EdXJhdGlvbiB9LFxuXHRcdFx0YnV0dG9uXG5cdFx0KTtcblx0fSxcblxuXHRyZW5kZXJSaWdodEljb246IGZ1bmN0aW9uIHJlbmRlclJpZ2h0SWNvbigpIHtcblx0XHRpZiAoIXRoaXMuc3RhdGUucmlnaHRJY29uKSByZXR1cm4gbnVsbDtcblxuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdOYXZpZ2F0aW9uQmFyUmlnaHRJY29uJywgdGhpcy5zdGF0ZS5yaWdodEljb24pO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdzcGFuJywgeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9KTtcblx0fSxcblxuXHRyZW5kZXJSaWdodExhYmVsOiBmdW5jdGlvbiByZW5kZXJSaWdodExhYmVsKCkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRlLnJpZ2h0TGFiZWwgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdzcGFuJyxcblx0XHRcdHsga2V5OiBEYXRlLm5vdygpLCBjbGFzc05hbWU6ICdOYXZpZ2F0aW9uQmFyUmlnaHRMYWJlbCcgfSxcblx0XHRcdHRoaXMuc3RhdGUucmlnaHRMYWJlbFxuXHRcdCkgOiBudWxsO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ05hdmlnYXRpb25CYXInLCB0aGlzLnByb3BzLmNsYXNzTmFtZSkgfSxcblx0XHRcdHRoaXMucmVuZGVyTGVmdEJ1dHRvbigpLFxuXHRcdFx0dGhpcy5yZW5kZXJUaXRsZSgpLFxuXHRcdFx0dGhpcy5yZW5kZXJSaWdodEJ1dHRvbigpXG5cdFx0KTtcblx0fVxufSk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IE5hdmlnYXRpb25CYXI7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jbGFzc25hbWVzID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuXG52YXIgX2NsYXNzbmFtZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY2xhc3NuYW1lcyk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cCA9IHJlcXVpcmUoJ3JlYWN0LWFkZG9ucy1jc3MtdHJhbnNpdGlvbi1ncm91cCcpO1xuXG52YXIgX3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwKTtcblxubW9kdWxlLmV4cG9ydHMgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1BvcHVwJyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjaGlsZHJlbjogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ub2RlLFxuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dmlzaWJsZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sXG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHRyYW5zaXRpb246ICdub25lJ1xuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyQmFja2Ryb3A6IGZ1bmN0aW9uIHJlbmRlckJhY2tkcm9wKCkge1xuXHRcdGlmICghdGhpcy5wcm9wcy52aXNpYmxlKSByZXR1cm4gbnVsbDtcblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnUG9wdXAtYmFja2Ryb3AnIH0pO1xuXHR9LFxuXG5cdHJlbmRlckRpYWxvZzogZnVuY3Rpb24gcmVuZGVyRGlhbG9nKCkge1xuXHRcdGlmICghdGhpcy5wcm9wcy52aXNpYmxlKSByZXR1cm4gbnVsbDtcblxuXHRcdC8vIFNldCBjbGFzc25hbWVzXG5cdFx0dmFyIGRpYWxvZ0NsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ1BvcHVwLWRpYWxvZycsIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGRpYWxvZ0NsYXNzTmFtZSB9LFxuXHRcdFx0dGhpcy5wcm9wcy5jaGlsZHJlblxuXHRcdCk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHR7IGNsYXNzTmFtZTogJ1BvcHVwJyB9LFxuXHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9yZWFjdEFkZG9uc0Nzc1RyYW5zaXRpb25Hcm91cDJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0eyB0cmFuc2l0aW9uTmFtZTogJ1BvcHVwLWRpYWxvZycsIHRyYW5zaXRpb25FbnRlclRpbWVvdXQ6IDMwMCwgdHJhbnNpdGlvbkxlYXZlVGltZW91dDogMzAwLCBjb21wb25lbnQ6ICdkaXYnIH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyRGlhbG9nKClcblx0XHRcdCksXG5cdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0X3JlYWN0QWRkb25zQ3NzVHJhbnNpdGlvbkdyb3VwMlsnZGVmYXVsdCddLFxuXHRcdFx0XHR7IHRyYW5zaXRpb25OYW1lOiAnUG9wdXAtYmFja2dyb3VuZCcsIHRyYW5zaXRpb25FbnRlclRpbWVvdXQ6IDMwMCwgdHJhbnNpdGlvbkxlYXZlVGltZW91dDogMzAwLCBjb21wb25lbnQ6ICdkaXYnIH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyQmFja2Ryb3AoKVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnUG9wdXBJY29uJyxcblx0cHJvcFR5cGVzOiB7XG5cdFx0bmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0dHlwZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vbmVPZihbJ2RlZmF1bHQnLCAnbXV0ZWQnLCAncHJpbWFyeScsICdzdWNjZXNzJywgJ3dhcm5pbmcnLCAnZGFuZ2VyJ10pLFxuXHRcdHNwaW5uaW5nOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2xcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnUG9wdXBJY29uJywge1xuXHRcdFx0J2lzLXNwaW5uaW5nJzogdGhpcy5wcm9wcy5zcGlubmluZ1xuXHRcdH0sIHRoaXMucHJvcHMubmFtZSwgdGhpcy5wcm9wcy50eXBlKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX0l0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxudmFyIF9JdGVtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW0pO1xuXG52YXIgX0l0ZW1Jbm5lciA9IHJlcXVpcmUoJy4vSXRlbUlubmVyJyk7XG5cbnZhciBfSXRlbUlubmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW1Jbm5lcik7XG5cbnZhciBfSXRlbU5vdGUgPSByZXF1aXJlKCcuL0l0ZW1Ob3RlJyk7XG5cbnZhciBfSXRlbU5vdGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSXRlbU5vdGUpO1xuXG52YXIgX0l0ZW1UaXRsZSA9IHJlcXVpcmUoJy4vSXRlbVRpdGxlJyk7XG5cbnZhciBfSXRlbVRpdGxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW1UaXRsZSk7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdFRhcHBhYmxlID0gcmVxdWlyZSgncmVhY3QtdGFwcGFibGUnKTtcblxudmFyIF9yZWFjdFRhcHBhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0VGFwcGFibGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnUmFkaW9MaXN0JyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRvcHRpb25zOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG5cdFx0dmFsdWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMub25lT2ZUeXBlKFtfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZywgX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5udW1iZXJdKSxcblx0XHRpY29uOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHRvbkNoYW5nZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5mdW5jXG5cdH0sXG5cblx0b25DaGFuZ2U6IGZ1bmN0aW9uIG9uQ2hhbmdlKHZhbHVlKSB7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZSh2YWx1ZSk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5wcm9wcy5vcHRpb25zLm1hcChmdW5jdGlvbiAob3AsIGkpIHtcblx0XHRcdHZhciBpY29uQ2xhc3NuYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnaXRlbS1pY29uIHByaW1hcnknLCBvcC5pY29uKTtcblx0XHRcdHZhciBjaGVja01hcmsgPSBvcC52YWx1ZSA9PT0gc2VsZi5wcm9wcy52YWx1ZSA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9JdGVtTm90ZTJbJ2RlZmF1bHQnXSwgeyB0eXBlOiAncHJpbWFyeScsIGljb246ICdpb24tY2hlY2ttYXJrJyB9KSA6IG51bGw7XG5cdFx0XHR2YXIgaWNvbiA9IG9wLmljb24gPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0J2RpdicsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnaXRlbS1tZWRpYScgfSxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ3NwYW4nLCB7IGNsYXNzTmFtZTogaWNvbkNsYXNzbmFtZSB9KVxuXHRcdFx0KSA6IG51bGw7XG5cblx0XHRcdGZ1bmN0aW9uIG9uQ2hhbmdlKCkge1xuXHRcdFx0XHRzZWxmLm9uQ2hhbmdlKG9wLnZhbHVlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0eyBrZXk6ICdvcHRpb24tJyArIGksIG9uVGFwOiBvbkNoYW5nZSB9LFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRfSXRlbTJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0XHR7IGtleTogJ29wdGlvbi0nICsgaSwgb25UYXA6IG9uQ2hhbmdlIH0sXG5cdFx0XHRcdFx0aWNvbixcblx0XHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHRcdF9JdGVtSW5uZXIyWydkZWZhdWx0J10sXG5cdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdFx0XHRcdF9JdGVtVGl0bGUyWydkZWZhdWx0J10sXG5cdFx0XHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0XHRcdG9wLmxhYmVsXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0Y2hlY2tNYXJrXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0J2RpdicsXG5cdFx0XHRudWxsLFxuXHRcdFx0b3B0aW9uc1xuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RUYXBwYWJsZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdTZWFyY2hGaWVsZCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0b25DYW5jZWw6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuZnVuYyxcblx0XHRvbkNoYW5nZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5mdW5jLFxuXHRcdG9uQ2xlYXI6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuZnVuYyxcblx0XHRvblN1Ym1pdDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5mdW5jLFxuXHRcdHBsYWNlaG9sZGVyOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHR0eXBlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mKFsnZGVmYXVsdCcsICdkYXJrJ10pLFxuXHRcdHZhbHVlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZ1xuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gZ2V0SW5pdGlhbFN0YXRlKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpc0ZvY3VzZWQ6IGZhbHNlXG5cdFx0fTtcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ2RlZmF1bHQnLFxuXHRcdFx0dmFsdWU6ICcnXG5cdFx0fTtcblx0fSxcblxuXHRoYW5kbGVDbGVhcjogZnVuY3Rpb24gaGFuZGxlQ2xlYXIoKSB7XG5cdFx0dGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKS5mb2N1cygpO1xuXHRcdHRoaXMucHJvcHMub25DbGVhcigpO1xuXHR9LFxuXG5cdGhhbmRsZUNhbmNlbDogZnVuY3Rpb24gaGFuZGxlQ2FuY2VsKCkge1xuXHRcdHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCkuYmx1cigpO1xuXHRcdHRoaXMucHJvcHMub25DYW5jZWwoKTtcblx0fSxcblxuXHRoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uIGhhbmRsZUNoYW5nZShlKSB7XG5cdFx0dGhpcy5wcm9wcy5vbkNoYW5nZShlLnRhcmdldC52YWx1ZSk7XG5cdH0sXG5cblx0aGFuZGxlQmx1cjogZnVuY3Rpb24gaGFuZGxlQmx1cihlKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRpc0ZvY3VzZWQ6IGZhbHNlXG5cdFx0fSk7XG5cdH0sXG5cblx0aGFuZGxlRm9jdXM6IGZ1bmN0aW9uIGhhbmRsZUZvY3VzKGUpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGlzRm9jdXNlZDogdHJ1ZVxuXHRcdH0pO1xuXHR9LFxuXG5cdGhhbmRsZVN1Ym1pdDogZnVuY3Rpb24gaGFuZGxlU3VibWl0KGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR2YXIgaW5wdXQgPSB0aGlzLnJlZnMuaW5wdXQuZ2V0RE9NTm9kZSgpO1xuXG5cdFx0aW5wdXQuYmx1cigpO1xuXHRcdHRoaXMucHJvcHMub25TdWJtaXQoaW5wdXQudmFsdWUpO1xuXHR9LFxuXG5cdHJlbmRlckNsZWFyOiBmdW5jdGlvbiByZW5kZXJDbGVhcigpIHtcblx0XHRpZiAoIXRoaXMucHJvcHMudmFsdWUubGVuZ3RoKSByZXR1cm47XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9yZWFjdFRhcHBhYmxlMlsnZGVmYXVsdCddLCB7IGNsYXNzTmFtZTogJ1NlYXJjaEZpZWxkX19pY29uIFNlYXJjaEZpZWxkX19pY29uLS1jbGVhcicsIG9uVGFwOiB0aGlzLmhhbmRsZUNsZWFyIH0pO1xuXHR9LFxuXG5cdHJlbmRlckNhbmNlbDogZnVuY3Rpb24gcmVuZGVyQ2FuY2VsKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdTZWFyY2hGaWVsZF9fY2FuY2VsJywge1xuXHRcdFx0J2lzLXZpc2libGUnOiB0aGlzLnN0YXRlLmlzRm9jdXNlZCB8fCB0aGlzLnByb3BzLnZhbHVlXG5cdFx0fSk7XG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X3JlYWN0VGFwcGFibGUyWydkZWZhdWx0J10sXG5cdFx0XHR7IGNsYXNzTmFtZTogY2xhc3NOYW1lLCBvblRhcDogdGhpcy5oYW5kbGVDYW5jZWwgfSxcblx0XHRcdCdDYW5jZWwnXG5cdFx0KTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnU2VhcmNoRmllbGQnLCAnU2VhcmNoRmllbGQtLScgKyB0aGlzLnByb3BzLnR5cGUsIHtcblx0XHRcdCdpcy1mb2N1c2VkJzogdGhpcy5zdGF0ZS5pc0ZvY3VzZWQsXG5cdFx0XHQnaGFzLXZhbHVlJzogdGhpcy5wcm9wcy52YWx1ZVxuXHRcdH0sIHRoaXMucHJvcHMuY2xhc3NOYW1lKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdmb3JtJyxcblx0XHRcdHsgb25TdWJtaXQ6IHRoaXMuaGFuZGxlU3VibWl0LCBhY3Rpb246ICdqYXZhc2NyaXB0OjsnLCBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LFxuXHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdCdsYWJlbCcsXG5cdFx0XHRcdHsgY2xhc3NOYW1lOiAnU2VhcmNoRmllbGRfX2ZpZWxkJyB9LFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0XHR7IGNsYXNzTmFtZTogJ1NlYXJjaEZpZWxkX19wbGFjZWhvbGRlcicgfSxcblx0XHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnc3BhbicsIHsgY2xhc3NOYW1lOiAnU2VhcmNoRmllbGRfX2ljb24gU2VhcmNoRmllbGRfX2ljb24tLXNlYXJjaCcgfSksXG5cdFx0XHRcdFx0IXRoaXMucHJvcHMudmFsdWUubGVuZ3RoID8gdGhpcy5wcm9wcy5wbGFjZWhvbGRlciA6IG51bGxcblx0XHRcdFx0KSxcblx0XHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2lucHV0JywgeyB0eXBlOiAnc2VhcmNoJywgcmVmOiAnaW5wdXQnLCB2YWx1ZTogdGhpcy5wcm9wcy52YWx1ZSwgb25DaGFuZ2U6IHRoaXMuaGFuZGxlQ2hhbmdlLCBvbkZvY3VzOiB0aGlzLmhhbmRsZUZvY3VzLCBvbkJsdXI6IHRoaXMuaGFuZGxlQmx1ciwgY2xhc3NOYW1lOiAnU2VhcmNoRmllbGRfX2lucHV0JyB9KSxcblx0XHRcdFx0dGhpcy5yZW5kZXJDbGVhcigpXG5cdFx0XHQpLFxuXHRcdFx0dGhpcy5yZW5kZXJDYW5jZWwoKVxuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RUYXBwYWJsZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdTZWdtZW50ZWRDb250cm9sJyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nLFxuXHRcdGVxdWFsV2lkdGhTZWdtZW50czogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sLFxuXHRcdGlzSW5saW5lOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0aGFzR3V0dGVyOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0b25DaGFuZ2U6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXHRcdG9wdGlvbnM6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcblx0XHR0eXBlOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLnN0cmluZyxcblx0XHR2YWx1ZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmdcblx0fSxcblxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uIGdldERlZmF1bHRQcm9wcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogJ3ByaW1hcnknXG5cdFx0fTtcblx0fSxcblxuXHRvbkNoYW5nZTogZnVuY3Rpb24gb25DaGFuZ2UodmFsdWUpIHtcblx0XHR0aGlzLnByb3BzLm9uQ2hhbmdlKHZhbHVlKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0XHR2YXIgY29tcG9uZW50Q2xhc3NOYW1lID0gKDAsIF9jbGFzc25hbWVzMlsnZGVmYXVsdCddKSgnU2VnbWVudGVkQ29udHJvbCcsICdTZWdtZW50ZWRDb250cm9sLS0nICsgdGhpcy5wcm9wcy50eXBlLCB7XG5cdFx0XHQnU2VnbWVudGVkQ29udHJvbC0taW5saW5lJzogdGhpcy5wcm9wcy5pc0lubGluZSxcblx0XHRcdCdTZWdtZW50ZWRDb250cm9sLS1oYXMtZ3V0dGVyJzogdGhpcy5wcm9wcy5oYXNHdXR0ZXIsXG5cdFx0XHQnU2VnbWVudGVkQ29udHJvbC0tZXF1YWwtd2lkdGhzJzogdGhpcy5wcm9wcy5lcXVhbFdpZHRoU2VnbWVudHNcblx0XHR9LCB0aGlzLnByb3BzLmNsYXNzTmFtZSk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLnByb3BzLm9wdGlvbnMubWFwKGZ1bmN0aW9uIChvcCkge1xuXHRcdFx0ZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG5cdFx0XHRcdHNlbGYub25DaGFuZ2Uob3AudmFsdWUpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaXRlbUNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ1NlZ21lbnRlZENvbnRyb2xfX2l0ZW0nLCB7XG5cdFx0XHRcdCdpcy1zZWxlY3RlZCc6IG9wLnZhbHVlID09PSBzZWxmLnByb3BzLnZhbHVlXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0eyBrZXk6ICdvcHRpb24tJyArIG9wLnZhbHVlLCBvblRhcDogb25DaGFuZ2UsIGNsYXNzTmFtZTogaXRlbUNsYXNzTmFtZSB9LFxuXHRcdFx0XHRvcC5sYWJlbFxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcblx0XHRcdCdkaXYnLFxuXHRcdFx0eyBjbGFzc05hbWU6IGNvbXBvbmVudENsYXNzTmFtZSB9LFxuXHRcdFx0b3B0aW9uc1xuXHRcdCk7XG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NsYXNzbmFtZXMgPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbnZhciBfY2xhc3NuYW1lczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jbGFzc25hbWVzKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUgPSByZXF1aXJlKCdyZWFjdC10YXBwYWJsZScpO1xuXG52YXIgX3JlYWN0VGFwcGFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RUYXBwYWJsZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdTd2l0Y2gnLFxuXG5cdHByb3BUeXBlczoge1xuXHRcdGRpc2FibGVkOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmJvb2wsXG5cdFx0b246IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbCxcblx0XHRvblRhcDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5mdW5jLFxuXHRcdHR5cGU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cblx0Z2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiBnZXREZWZhdWx0UHJvcHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6ICdkZWZhdWx0J1xuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ1N3aXRjaCcsICdTd2l0Y2gtLScgKyB0aGlzLnByb3BzLnR5cGUsIHtcblx0XHRcdCdpcy1kaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWQsXG5cdFx0XHQnaXMtb24nOiB0aGlzLnByb3BzLm9uXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSxcblx0XHRcdHsgb25UYXA6IHRoaXMucHJvcHMub25UYXAsIGNsYXNzTmFtZTogY2xhc3NOYW1lLCBjb21wb25lbnQ6ICdsYWJlbCcgfSxcblx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHQnZGl2Jyxcblx0XHRcdFx0eyBjbGFzc05hbWU6ICdTd2l0Y2hfX3RyYWNrJyB9LFxuXHRcdFx0XHRfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgeyBjbGFzc05hbWU6ICdTd2l0Y2hfX2hhbmRsZScgfSlcblx0XHRcdClcblx0XHQpO1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfYmxhY2tsaXN0ID0gcmVxdWlyZSgnYmxhY2tsaXN0Jyk7XG5cbnZhciBfYmxhY2tsaXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2JsYWNrbGlzdCk7XG5cbnZhciBfY2xhc3NuYW1lcyA9IHJlcXVpcmUoJ2NsYXNzbmFtZXMnKTtcblxudmFyIF9jbGFzc25hbWVzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NsYXNzbmFtZXMpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZSA9IHJlcXVpcmUoJ3JlYWN0LXRhcHBhYmxlJyk7XG5cbnZhciBfcmVhY3RUYXBwYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdFRhcHBhYmxlKTtcblxudmFyIE5hdmlnYXRvciA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTmF2aWdhdG9yJyxcblxuXHRwcm9wVHlwZXM6IHtcblx0XHRjbGFzc05hbWU6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuc3RyaW5nXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9ICgwLCBfY2xhc3NuYW1lczJbJ2RlZmF1bHQnXSkoJ1RhYnMtTmF2aWdhdG9yJywgdGhpcy5wcm9wcy5jbGFzc05hbWUpO1xuXHRcdHZhciBvdGhlclByb3BzID0gKDAsIF9ibGFja2xpc3QyWydkZWZhdWx0J10pKHRoaXMucHJvcHMsICdjbGFzc05hbWUnKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgX2V4dGVuZHMoeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LCBvdGhlclByb3BzKSk7XG5cdH1cbn0pO1xuXG5leHBvcnRzLk5hdmlnYXRvciA9IE5hdmlnYXRvcjtcbnZhciBUYWIgPSBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlQ2xhc3Moe1xuXHRkaXNwbGF5TmFtZTogJ1RhYicsXG5cblx0cHJvcFR5cGVzOiB7XG5cdFx0c2VsZWN0ZWQ6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYm9vbFxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHZhciBjbGFzc05hbWUgPSAoMCwgX2NsYXNzbmFtZXMyWydkZWZhdWx0J10pKCdUYWJzLVRhYicsIHsgJ2lzLXNlbGVjdGVkJzogdGhpcy5wcm9wcy5zZWxlY3RlZCB9KTtcblx0XHR2YXIgb3RoZXJQcm9wcyA9ICgwLCBfYmxhY2tsaXN0MlsnZGVmYXVsdCddKSh0aGlzLnByb3BzLCAnc2VsZWN0ZWQnKTtcblxuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfcmVhY3RUYXBwYWJsZTJbJ2RlZmF1bHQnXSwgX2V4dGVuZHMoeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9LCBvdGhlclByb3BzKSk7XG5cdH1cbn0pO1xuXG5leHBvcnRzLlRhYiA9IFRhYjtcbnZhciBMYWJlbCA9IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVDbGFzcyh7XG5cdGRpc3BsYXlOYW1lOiAnTGFiZWwnLFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgX2V4dGVuZHMoeyBjbGFzc05hbWU6ICdUYWJzLUxhYmVsJyB9LCB0aGlzLnByb3BzKSk7XG5cdH1cbn0pO1xuZXhwb3J0cy5MYWJlbCA9IExhYmVsOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2JsYWNrbGlzdCA9IHJlcXVpcmUoJ2JsYWNrbGlzdCcpO1xuXG52YXIgX2JsYWNrbGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ibGFja2xpc3QpO1xuXG52YXIgX0l0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxudmFyIF9JdGVtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW0pO1xuXG52YXIgX0l0ZW1Db250ZW50ID0gcmVxdWlyZSgnLi9JdGVtQ29udGVudCcpO1xuXG52YXIgX0l0ZW1Db250ZW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0l0ZW1Db250ZW50KTtcblxudmFyIF9JdGVtSW5uZXIgPSByZXF1aXJlKCcuL0l0ZW1Jbm5lcicpO1xuXG52YXIgX0l0ZW1Jbm5lcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JdGVtSW5uZXIpO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbm1vZHVsZS5leHBvcnRzID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcblx0ZGlzcGxheU5hbWU6ICdJbnB1dCcsXG5cdHByb3BUeXBlczoge1xuXHRcdGNsYXNzTmFtZTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5zdHJpbmcsXG5cdFx0Y2hpbGRyZW46IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMubm9kZSxcblx0XHRkaXNhYmxlZDogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5ib29sXG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdFx0dmFyIGlucHV0UHJvcHMgPSAoMCwgX2JsYWNrbGlzdDJbJ2RlZmF1bHQnXSkodGhpcy5wcm9wcywgJ2NoaWxkcmVuJywgJ2NsYXNzTmFtZScpO1xuXG5cdFx0cmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0X0l0ZW0yWydkZWZhdWx0J10sXG5cdFx0XHR7IHNlbGVjdGFibGU6IHRoaXMucHJvcHMuZGlzYWJsZWQsIGNsYXNzTmFtZTogdGhpcy5wcm9wcy5jbGFzc05hbWUsIGNvbXBvbmVudDogJ2xhYmVsJyB9LFxuXHRcdFx0X3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG5cdFx0XHRcdF9JdGVtSW5uZXIyWydkZWZhdWx0J10sXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdF9JdGVtQ29udGVudDJbJ2RlZmF1bHQnXSxcblx0XHRcdFx0XHR7IGNvbXBvbmVudDogJ2xhYmVsJyB9LFxuXHRcdFx0XHRcdF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScsIF9leHRlbmRzKHsgY2xhc3NOYW1lOiAnZmllbGQnLCByb3dzOiAzIH0sIGlucHV0UHJvcHMpKVxuXHRcdFx0XHQpLFxuXHRcdFx0XHR0aGlzLnByb3BzLmNoaWxkcmVuXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbnZhciBBbGVydGJhciA9IHJlcXVpcmUoJy4vQWxlcnRiYXInKTtcbmV4cG9ydHMuQWxlcnRiYXIgPSBBbGVydGJhcjtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xuZXhwb3J0cy5CdXR0b24gPSBCdXR0b247XG52YXIgQnV0dG9uR3JvdXAgPSByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyk7XG5leHBvcnRzLkJ1dHRvbkdyb3VwID0gQnV0dG9uR3JvdXA7XG52YXIgRGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4vRGF0ZVBpY2tlcicpO1xuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcbnZhciBEYXRlUGlja2VyUG9wdXAgPSByZXF1aXJlKCcuL0RhdGVQaWNrZXJQb3B1cCcpO1xuZXhwb3J0cy5EYXRlUGlja2VyUG9wdXAgPSBEYXRlUGlja2VyUG9wdXA7XG52YXIgRmllbGRDb250cm9sID0gcmVxdWlyZSgnLi9GaWVsZENvbnRyb2wnKTtcbmV4cG9ydHMuRmllbGRDb250cm9sID0gRmllbGRDb250cm9sO1xudmFyIEZpZWxkTGFiZWwgPSByZXF1aXJlKCcuL0ZpZWxkTGFiZWwnKTtcbmV4cG9ydHMuRmllbGRMYWJlbCA9IEZpZWxkTGFiZWw7XG52YXIgR3JvdXAgPSByZXF1aXJlKCcuL0dyb3VwJyk7XG5leHBvcnRzLkdyb3VwID0gR3JvdXA7XG52YXIgR3JvdXBCb2R5ID0gcmVxdWlyZSgnLi9Hcm91cEJvZHknKTtcbmV4cG9ydHMuR3JvdXBCb2R5ID0gR3JvdXBCb2R5O1xudmFyIEdyb3VwRm9vdGVyID0gcmVxdWlyZSgnLi9Hcm91cEZvb3RlcicpO1xuZXhwb3J0cy5Hcm91cEZvb3RlciA9IEdyb3VwRm9vdGVyO1xudmFyIEdyb3VwSGVhZGVyID0gcmVxdWlyZSgnLi9Hcm91cEhlYWRlcicpO1xuZXhwb3J0cy5Hcm91cEhlYWRlciA9IEdyb3VwSGVhZGVyO1xudmFyIEdyb3VwSW5uZXIgPSByZXF1aXJlKCcuL0dyb3VwSW5uZXInKTtcbmV4cG9ydHMuR3JvdXBJbm5lciA9IEdyb3VwSW5uZXI7XG52YXIgSXRlbSA9IHJlcXVpcmUoJy4vSXRlbScpO1xuZXhwb3J0cy5JdGVtID0gSXRlbTtcbnZhciBJdGVtQ29udGVudCA9IHJlcXVpcmUoJy4vSXRlbUNvbnRlbnQnKTtcbmV4cG9ydHMuSXRlbUNvbnRlbnQgPSBJdGVtQ29udGVudDtcbnZhciBJdGVtSW5uZXIgPSByZXF1aXJlKCcuL0l0ZW1Jbm5lcicpO1xuZXhwb3J0cy5JdGVtSW5uZXIgPSBJdGVtSW5uZXI7XG52YXIgSXRlbU1lZGlhID0gcmVxdWlyZSgnLi9JdGVtTWVkaWEnKTtcbmV4cG9ydHMuSXRlbU1lZGlhID0gSXRlbU1lZGlhO1xudmFyIEl0ZW1Ob3RlID0gcmVxdWlyZSgnLi9JdGVtTm90ZScpO1xuZXhwb3J0cy5JdGVtTm90ZSA9IEl0ZW1Ob3RlO1xudmFyIEl0ZW1TdWJUaXRsZSA9IHJlcXVpcmUoJy4vSXRlbVN1YlRpdGxlJyk7XG5leHBvcnRzLkl0ZW1TdWJUaXRsZSA9IEl0ZW1TdWJUaXRsZTtcbnZhciBJdGVtVGl0bGUgPSByZXF1aXJlKCcuL0l0ZW1UaXRsZScpO1xuZXhwb3J0cy5JdGVtVGl0bGUgPSBJdGVtVGl0bGU7XG52YXIgTGFiZWxJbnB1dCA9IHJlcXVpcmUoJy4vTGFiZWxJbnB1dCcpO1xuZXhwb3J0cy5MYWJlbElucHV0ID0gTGFiZWxJbnB1dDtcbnZhciBMYWJlbFNlbGVjdCA9IHJlcXVpcmUoJy4vTGFiZWxTZWxlY3QnKTtcbmV4cG9ydHMuTGFiZWxTZWxlY3QgPSBMYWJlbFNlbGVjdDtcbnZhciBMYWJlbFRleHRhcmVhID0gcmVxdWlyZSgnLi9MYWJlbFRleHRhcmVhJyk7XG5leHBvcnRzLkxhYmVsVGV4dGFyZWEgPSBMYWJlbFRleHRhcmVhO1xudmFyIExhYmVsVmFsdWUgPSByZXF1aXJlKCcuL0xhYmVsVmFsdWUnKTtcbmV4cG9ydHMuTGFiZWxWYWx1ZSA9IExhYmVsVmFsdWU7XG52YXIgTGlzdEhlYWRlciA9IHJlcXVpcmUoJy4vTGlzdEhlYWRlcicpO1xuZXhwb3J0cy5MaXN0SGVhZGVyID0gTGlzdEhlYWRlcjtcbnZhciBOYXZpZ2F0aW9uQmFyID0gcmVxdWlyZSgnLi9OYXZpZ2F0aW9uQmFyJyk7XG5leHBvcnRzLk5hdmlnYXRpb25CYXIgPSBOYXZpZ2F0aW9uQmFyO1xudmFyIFBvcHVwID0gcmVxdWlyZSgnLi9Qb3B1cCcpO1xuZXhwb3J0cy5Qb3B1cCA9IFBvcHVwO1xudmFyIFBvcHVwSWNvbiA9IHJlcXVpcmUoJy4vUG9wdXBJY29uJyk7XG5leHBvcnRzLlBvcHVwSWNvbiA9IFBvcHVwSWNvbjtcbnZhciBSYWRpb0xpc3QgPSByZXF1aXJlKCcuL1JhZGlvTGlzdCcpO1xuZXhwb3J0cy5SYWRpb0xpc3QgPSBSYWRpb0xpc3Q7XG52YXIgU2VhcmNoRmllbGQgPSByZXF1aXJlKCcuL1NlYXJjaEZpZWxkJyk7XG5leHBvcnRzLlNlYXJjaEZpZWxkID0gU2VhcmNoRmllbGQ7XG52YXIgU2VnbWVudGVkQ29udHJvbCA9IHJlcXVpcmUoJy4vU2VnbWVudGVkQ29udHJvbCcpO1xuZXhwb3J0cy5TZWdtZW50ZWRDb250cm9sID0gU2VnbWVudGVkQ29udHJvbDtcbnZhciBTd2l0Y2ggPSByZXF1aXJlKCcuL1N3aXRjaCcpO1xuZXhwb3J0cy5Td2l0Y2ggPSBTd2l0Y2g7XG52YXIgVGFicyA9IHJlcXVpcmUoJy4vVGFicycpO1xuZXhwb3J0cy5UYWJzID0gVGFicztcbnZhciBUZXh0YXJlYSA9IHJlcXVpcmUoJy4vVGV4dGFyZWEnKTtcblxuZXhwb3J0cy5UZXh0YXJlYSA9IFRleHRhcmVhO1xuLy8gZGVwZW5kcyBvbiBhYm92ZVxudmFyIElucHV0ID0gcmVxdWlyZSgnLi9JbnB1dCcpO1xuZXhwb3J0cy5JbnB1dCA9IElucHV0OyIsIlxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHJpbTtcblxuZnVuY3Rpb24gdHJpbShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKTtcbn1cblxuZXhwb3J0cy5sZWZ0ID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKi8sICcnKTtcbn07XG5cbmV4cG9ydHMucmlnaHQgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xccyokLywgJycpO1xufTtcbiIsIi8qKlxuICogVHdlZW4uanMgLSBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90d2VlbmpzL3R3ZWVuLmpzXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKlxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2VlbmpzL3R3ZWVuLmpzL2dyYXBocy9jb250cmlidXRvcnMgZm9yIHRoZSBmdWxsIGxpc3Qgb2YgY29udHJpYnV0b3JzLlxuICogVGhhbmsgeW91IGFsbCwgeW91J3JlIGF3ZXNvbWUhXG4gKi9cblxuLy8gSW5jbHVkZSBhIHBlcmZvcm1hbmNlLm5vdyBwb2x5ZmlsbFxuKGZ1bmN0aW9uICgpIHtcblxuXHRpZiAoJ3BlcmZvcm1hbmNlJyBpbiB3aW5kb3cgPT09IGZhbHNlKSB7XG5cdFx0d2luZG93LnBlcmZvcm1hbmNlID0ge307XG5cdH1cblxuXHQvLyBJRSA4XG5cdERhdGUubm93ID0gKERhdGUubm93IHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdH0pO1xuXG5cdGlmICgnbm93JyBpbiB3aW5kb3cucGVyZm9ybWFuY2UgPT09IGZhbHNlKSB7XG5cdFx0dmFyIG9mZnNldCA9IHdpbmRvdy5wZXJmb3JtYW5jZS50aW1pbmcgJiYgd2luZG93LnBlcmZvcm1hbmNlLnRpbWluZy5uYXZpZ2F0aW9uU3RhcnQgPyB3aW5kb3cucGVyZm9ybWFuY2UudGltaW5nLm5hdmlnYXRpb25TdGFydFxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogRGF0ZS5ub3coKTtcblxuXHRcdHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRGF0ZS5ub3coKSAtIG9mZnNldDtcblx0XHR9O1xuXHR9XG5cbn0pKCk7XG5cbnZhciBUV0VFTiA9IFRXRUVOIHx8IChmdW5jdGlvbiAoKSB7XG5cblx0dmFyIF90d2VlbnMgPSBbXTtcblxuXHRyZXR1cm4ge1xuXG5cdFx0Z2V0QWxsOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHJldHVybiBfdHdlZW5zO1xuXG5cdFx0fSxcblxuXHRcdHJlbW92ZUFsbDogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRfdHdlZW5zID0gW107XG5cblx0XHR9LFxuXG5cdFx0YWRkOiBmdW5jdGlvbiAodHdlZW4pIHtcblxuXHRcdFx0X3R3ZWVucy5wdXNoKHR3ZWVuKTtcblxuXHRcdH0sXG5cblx0XHRyZW1vdmU6IGZ1bmN0aW9uICh0d2Vlbikge1xuXG5cdFx0XHR2YXIgaSA9IF90d2VlbnMuaW5kZXhPZih0d2Vlbik7XG5cblx0XHRcdGlmIChpICE9PSAtMSkge1xuXHRcdFx0XHRfdHdlZW5zLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblxuXHRcdH0sXG5cblx0XHR1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XG5cblx0XHRcdGlmIChfdHdlZW5zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBpID0gMDtcblxuXHRcdFx0dGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cblx0XHRcdHdoaWxlIChpIDwgX3R3ZWVucy5sZW5ndGgpIHtcblxuXHRcdFx0XHRpZiAoX3R3ZWVuc1tpXS51cGRhdGUodGltZSkpIHtcblx0XHRcdFx0XHRpKys7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X3R3ZWVucy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdH1cblx0fTtcblxufSkoKTtcblxuVFdFRU4uVHdlZW4gPSBmdW5jdGlvbiAob2JqZWN0KSB7XG5cblx0dmFyIF9vYmplY3QgPSBvYmplY3Q7XG5cdHZhciBfdmFsdWVzU3RhcnQgPSB7fTtcblx0dmFyIF92YWx1ZXNFbmQgPSB7fTtcblx0dmFyIF92YWx1ZXNTdGFydFJlcGVhdCA9IHt9O1xuXHR2YXIgX2R1cmF0aW9uID0gMTAwMDtcblx0dmFyIF9yZXBlYXQgPSAwO1xuXHR2YXIgX3lveW8gPSBmYWxzZTtcblx0dmFyIF9pc1BsYXlpbmcgPSBmYWxzZTtcblx0dmFyIF9yZXZlcnNlZCA9IGZhbHNlO1xuXHR2YXIgX2RlbGF5VGltZSA9IDA7XG5cdHZhciBfc3RhcnRUaW1lID0gbnVsbDtcblx0dmFyIF9lYXNpbmdGdW5jdGlvbiA9IFRXRUVOLkVhc2luZy5MaW5lYXIuTm9uZTtcblx0dmFyIF9pbnRlcnBvbGF0aW9uRnVuY3Rpb24gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLkxpbmVhcjtcblx0dmFyIF9jaGFpbmVkVHdlZW5zID0gW107XG5cdHZhciBfb25TdGFydENhbGxiYWNrID0gbnVsbDtcblx0dmFyIF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9IGZhbHNlO1xuXHR2YXIgX29uVXBkYXRlQ2FsbGJhY2sgPSBudWxsO1xuXHR2YXIgX29uQ29tcGxldGVDYWxsYmFjayA9IG51bGw7XG5cdHZhciBfb25TdG9wQ2FsbGJhY2sgPSBudWxsO1xuXG5cdC8vIFNldCBhbGwgc3RhcnRpbmcgdmFsdWVzIHByZXNlbnQgb24gdGhlIHRhcmdldCBvYmplY3Rcblx0Zm9yICh2YXIgZmllbGQgaW4gb2JqZWN0KSB7XG5cdFx0X3ZhbHVlc1N0YXJ0W2ZpZWxkXSA9IHBhcnNlRmxvYXQob2JqZWN0W2ZpZWxkXSwgMTApO1xuXHR9XG5cblx0dGhpcy50byA9IGZ1bmN0aW9uIChwcm9wZXJ0aWVzLCBkdXJhdGlvbikge1xuXG5cdFx0aWYgKGR1cmF0aW9uICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdF9kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdH1cblxuXHRcdF92YWx1ZXNFbmQgPSBwcm9wZXJ0aWVzO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnN0YXJ0ID0gZnVuY3Rpb24gKHRpbWUpIHtcblxuXHRcdFRXRUVOLmFkZCh0aGlzKTtcblxuXHRcdF9pc1BsYXlpbmcgPSB0cnVlO1xuXG5cdFx0X29uU3RhcnRDYWxsYmFja0ZpcmVkID0gZmFsc2U7XG5cblx0XHRfc3RhcnRUaW1lID0gdGltZSAhPT0gdW5kZWZpbmVkID8gdGltZSA6IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHRfc3RhcnRUaW1lICs9IF9kZWxheVRpbWU7XG5cblx0XHRmb3IgKHZhciBwcm9wZXJ0eSBpbiBfdmFsdWVzRW5kKSB7XG5cblx0XHRcdC8vIENoZWNrIGlmIGFuIEFycmF5IHdhcyBwcm92aWRlZCBhcyBwcm9wZXJ0eSB2YWx1ZVxuXHRcdFx0aWYgKF92YWx1ZXNFbmRbcHJvcGVydHldIGluc3RhbmNlb2YgQXJyYXkpIHtcblxuXHRcdFx0XHRpZiAoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0ubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBDcmVhdGUgYSBsb2NhbCBjb3B5IG9mIHRoZSBBcnJheSB3aXRoIHRoZSBzdGFydCB2YWx1ZSBhdCB0aGUgZnJvbnRcblx0XHRcdFx0X3ZhbHVlc0VuZFtwcm9wZXJ0eV0gPSBbX29iamVjdFtwcm9wZXJ0eV1dLmNvbmNhdChfdmFsdWVzRW5kW3Byb3BlcnR5XSk7XG5cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgYHRvKClgIHNwZWNpZmllcyBhIHByb3BlcnR5IHRoYXQgZG9lc24ndCBleGlzdCBpbiB0aGUgc291cmNlIG9iamVjdCxcblx0XHRcdC8vIHdlIHNob3VsZCBub3Qgc2V0IHRoYXQgcHJvcGVydHkgaW4gdGhlIG9iamVjdFxuXHRcdFx0aWYgKF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0X3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSA9IF9vYmplY3RbcHJvcGVydHldO1xuXG5cdFx0XHRpZiAoKF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gaW5zdGFuY2VvZiBBcnJheSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gKj0gMS4wOyAvLyBFbnN1cmVzIHdlJ3JlIHVzaW5nIG51bWJlcnMsIG5vdCBzdHJpbmdzXG5cdFx0XHR9XG5cblx0XHRcdF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV0gPSBfdmFsdWVzU3RhcnRbcHJvcGVydHldIHx8IDA7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuc3RvcCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmICghX2lzUGxheWluZykge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0VFdFRU4ucmVtb3ZlKHRoaXMpO1xuXHRcdF9pc1BsYXlpbmcgPSBmYWxzZTtcblxuXHRcdGlmIChfb25TdG9wQ2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdF9vblN0b3BDYWxsYmFjay5jYWxsKF9vYmplY3QpO1xuXHRcdH1cblxuXHRcdHRoaXMuc3RvcENoYWluZWRUd2VlbnMoKTtcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuc3RvcENoYWluZWRUd2VlbnMgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRmb3IgKHZhciBpID0gMCwgbnVtQ2hhaW5lZFR3ZWVucyA9IF9jaGFpbmVkVHdlZW5zLmxlbmd0aDsgaSA8IG51bUNoYWluZWRUd2VlbnM7IGkrKykge1xuXHRcdFx0X2NoYWluZWRUd2VlbnNbaV0uc3RvcCgpO1xuXHRcdH1cblxuXHR9O1xuXG5cdHRoaXMuZGVsYXkgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG5cblx0XHRfZGVsYXlUaW1lID0gYW1vdW50O1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5yZXBlYXQgPSBmdW5jdGlvbiAodGltZXMpIHtcblxuXHRcdF9yZXBlYXQgPSB0aW1lcztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMueW95byA9IGZ1bmN0aW9uICh5b3lvKSB7XG5cblx0XHRfeW95byA9IHlveW87XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXG5cdHRoaXMuZWFzaW5nID0gZnVuY3Rpb24gKGVhc2luZykge1xuXG5cdFx0X2Vhc2luZ0Z1bmN0aW9uID0gZWFzaW5nO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5pbnRlcnBvbGF0aW9uID0gZnVuY3Rpb24gKGludGVycG9sYXRpb24pIHtcblxuXHRcdF9pbnRlcnBvbGF0aW9uRnVuY3Rpb24gPSBpbnRlcnBvbGF0aW9uO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5jaGFpbiA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdF9jaGFpbmVkVHdlZW5zID0gYXJndW1lbnRzO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vblN0YXJ0ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25TdGFydENhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uVXBkYXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25VcGRhdGVDYWxsYmFjayA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vbkNvbXBsZXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25Db21wbGV0ZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uU3RvcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXG5cdFx0X29uU3RvcENhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG5cblx0XHR2YXIgcHJvcGVydHk7XG5cdFx0dmFyIGVsYXBzZWQ7XG5cdFx0dmFyIHZhbHVlO1xuXG5cdFx0aWYgKHRpbWUgPCBfc3RhcnRUaW1lKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoX29uU3RhcnRDYWxsYmFja0ZpcmVkID09PSBmYWxzZSkge1xuXG5cdFx0XHRpZiAoX29uU3RhcnRDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0XHRfb25TdGFydENhbGxiYWNrLmNhbGwoX29iamVjdCk7XG5cdFx0XHR9XG5cblx0XHRcdF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9IHRydWU7XG5cblx0XHR9XG5cblx0XHRlbGFwc2VkID0gKHRpbWUgLSBfc3RhcnRUaW1lKSAvIF9kdXJhdGlvbjtcblx0XHRlbGFwc2VkID0gZWxhcHNlZCA+IDEgPyAxIDogZWxhcHNlZDtcblxuXHRcdHZhbHVlID0gX2Vhc2luZ0Z1bmN0aW9uKGVsYXBzZWQpO1xuXG5cdFx0Zm9yIChwcm9wZXJ0eSBpbiBfdmFsdWVzRW5kKSB7XG5cblx0XHRcdC8vIERvbid0IHVwZGF0ZSBwcm9wZXJ0aWVzIHRoYXQgZG8gbm90IGV4aXN0IGluIHRoZSBzb3VyY2Ugb2JqZWN0XG5cdFx0XHRpZiAoX3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc3RhcnQgPSBfdmFsdWVzU3RhcnRbcHJvcGVydHldIHx8IDA7XG5cdFx0XHR2YXIgZW5kID0gX3ZhbHVlc0VuZFtwcm9wZXJ0eV07XG5cblx0XHRcdGlmIChlbmQgaW5zdGFuY2VvZiBBcnJheSkge1xuXG5cdFx0XHRcdF9vYmplY3RbcHJvcGVydHldID0gX2ludGVycG9sYXRpb25GdW5jdGlvbihlbmQsIHZhbHVlKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJzZXMgcmVsYXRpdmUgZW5kIHZhbHVlcyB3aXRoIHN0YXJ0IGFzIGJhc2UgKGUuZy46ICsxMCwgLTMpXG5cdFx0XHRcdGlmICh0eXBlb2YgKGVuZCkgPT09ICdzdHJpbmcnKSB7XG5cblx0XHRcdFx0XHRpZiAoZW5kLnN0YXJ0c1dpdGgoJysnKSB8fCBlbmQuc3RhcnRzV2l0aCgnLScpKSB7XG5cdFx0XHRcdFx0XHRlbmQgPSBzdGFydCArIHBhcnNlRmxvYXQoZW5kLCAxMCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVuZCA9IHBhcnNlRmxvYXQoZW5kLCAxMCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUHJvdGVjdCBhZ2FpbnN0IG5vbiBudW1lcmljIHByb3BlcnRpZXMuXG5cdFx0XHRcdGlmICh0eXBlb2YgKGVuZCkgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdFx0X29iamVjdFtwcm9wZXJ0eV0gPSBzdGFydCArIChlbmQgLSBzdGFydCkgKiB2YWx1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZiAoX29uVXBkYXRlQ2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdF9vblVwZGF0ZUNhbGxiYWNrLmNhbGwoX29iamVjdCwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdGlmIChlbGFwc2VkID09PSAxKSB7XG5cblx0XHRcdGlmIChfcmVwZWF0ID4gMCkge1xuXG5cdFx0XHRcdGlmIChpc0Zpbml0ZShfcmVwZWF0KSkge1xuXHRcdFx0XHRcdF9yZXBlYXQtLTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJlYXNzaWduIHN0YXJ0aW5nIHZhbHVlcywgcmVzdGFydCBieSBtYWtpbmcgc3RhcnRUaW1lID0gbm93XG5cdFx0XHRcdGZvciAocHJvcGVydHkgaW4gX3ZhbHVlc1N0YXJ0UmVwZWF0KSB7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIChfdmFsdWVzRW5kW3Byb3BlcnR5XSkgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldID0gX3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XSArIHBhcnNlRmxvYXQoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0sIDEwKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoX3lveW8pIHtcblx0XHRcdFx0XHRcdHZhciB0bXAgPSBfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldO1xuXG5cdFx0XHRcdFx0XHRfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldID0gX3ZhbHVlc0VuZFtwcm9wZXJ0eV07XG5cdFx0XHRcdFx0XHRfdmFsdWVzRW5kW3Byb3BlcnR5XSA9IHRtcDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfdmFsdWVzU3RhcnRbcHJvcGVydHldID0gX3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKF95b3lvKSB7XG5cdFx0XHRcdFx0X3JldmVyc2VkID0gIV9yZXZlcnNlZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF9zdGFydFRpbWUgPSB0aW1lICsgX2RlbGF5VGltZTtcblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRpZiAoX29uQ29tcGxldGVDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdF9vbkNvbXBsZXRlQ2FsbGJhY2suY2FsbChfb2JqZWN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBudW1DaGFpbmVkVHdlZW5zID0gX2NoYWluZWRUd2VlbnMubGVuZ3RoOyBpIDwgbnVtQ2hhaW5lZFR3ZWVuczsgaSsrKSB7XG5cdFx0XHRcdFx0Ly8gTWFrZSB0aGUgY2hhaW5lZCB0d2VlbnMgc3RhcnQgZXhhY3RseSBhdCB0aGUgdGltZSB0aGV5IHNob3VsZCxcblx0XHRcdFx0XHQvLyBldmVuIGlmIHRoZSBgdXBkYXRlKClgIG1ldGhvZCB3YXMgY2FsbGVkIHdheSBwYXN0IHRoZSBkdXJhdGlvbiBvZiB0aGUgdHdlZW5cblx0XHRcdFx0XHRfY2hhaW5lZFR3ZWVuc1tpXS5zdGFydChfc3RhcnRUaW1lICsgX2R1cmF0aW9uKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cblx0fTtcblxufTtcblxuXG5UV0VFTi5FYXNpbmcgPSB7XG5cblx0TGluZWFyOiB7XG5cblx0XHROb25lOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gaztcblxuXHRcdH1cblxuXHR9LFxuXG5cdFF1YWRyYXRpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogaztcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogKDIgLSBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAtIDAuNSAqICgtLWsgKiAoayAtIDIpIC0gMSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRDdWJpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogayAqIGs7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gLS1rICogayAqIGsgKyAxO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoKGsgLT0gMikgKiBrICogayArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0UXVhcnRpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogayAqIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSAoLS1rICogayAqIGsgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGsgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIC0gMC41ICogKChrIC09IDIpICogayAqIGsgKiBrIC0gMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRRdWludGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiBrICogayAqIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIC0tayAqIGsgKiBrICogayAqIGsgKyAxO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogayAqIGsgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiBrICogayAqIGsgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFNpbnVzb2lkYWw6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMSAtIE1hdGguY29zKGsgKiBNYXRoLlBJIC8gMik7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gTWF0aC5zaW4oayAqIE1hdGguUEkgLyAyKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDAuNSAqICgxIC0gTWF0aC5jb3MoTWF0aC5QSSAqIGspKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEV4cG9uZW50aWFsOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgPT09IDAgPyAwIDogTWF0aC5wb3coMTAyNCwgayAtIDEpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgPT09IDEgPyAxIDogMSAtIE1hdGgucG93KDIsIC0gMTAgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKGsgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID09PSAxKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBNYXRoLnBvdygxMDI0LCBrIC0gMSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoLSBNYXRoLnBvdygyLCAtIDEwICogKGsgLSAxKSkgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdENpcmN1bGFyOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSBNYXRoLnNxcnQoMSAtIGsgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBNYXRoLnNxcnQoMSAtICgtLWsgKiBrKSk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIC0gMC41ICogKE1hdGguc3FydCgxIC0gayAqIGspIC0gMSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoTWF0aC5zcXJ0KDEgLSAoayAtPSAyKSAqIGspICsgMSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRFbGFzdGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHM7XG5cdFx0XHR2YXIgYSA9IDAuMTtcblx0XHRcdHZhciBwID0gMC40O1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYSB8fCBhIDwgMSkge1xuXHRcdFx0XHRhID0gMTtcblx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cyA9IHAgKiBNYXRoLmFzaW4oMSAvIGEpIC8gKDIgKiBNYXRoLlBJKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIC0gKGEgKiBNYXRoLnBvdygyLCAxMCAqIChrIC09IDEpKSAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHM7XG5cdFx0XHR2YXIgYSA9IDAuMTtcblx0XHRcdHZhciBwID0gMC40O1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYSB8fCBhIDwgMSkge1xuXHRcdFx0XHRhID0gMTtcblx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cyA9IHAgKiBNYXRoLmFzaW4oMSAvIGEpIC8gKDIgKiBNYXRoLlBJKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIChhICogTWF0aC5wb3coMiwgLSAxMCAqIGspICogTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSArIDEpO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcztcblx0XHRcdHZhciBhID0gMC4xO1xuXHRcdFx0dmFyIHAgPSAwLjQ7XG5cblx0XHRcdGlmIChrID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA9PT0gMSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFhIHx8IGEgPCAxKSB7XG5cdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRzID0gcCAvIDQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzID0gcCAqIE1hdGguYXNpbigxIC8gYSkgLyAoMiAqIE1hdGguUEkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAtIDAuNSAqIChhICogTWF0aC5wb3coMiwgMTAgKiAoayAtPSAxKSkgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiAoayAtPSAxKSkgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgMTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEJhY2s6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cblx0XHRcdHJldHVybiBrICogayAqICgocyArIDEpICogayAtIHMpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHMgPSAxLjcwMTU4O1xuXG5cdFx0XHRyZXR1cm4gLS1rICogayAqICgocyArIDEpICogayArIHMpICsgMTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHMgPSAxLjcwMTU4ICogMS41MjU7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIChrICogayAqICgocyArIDEpICogayAtIHMpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiAoKHMgKyAxKSAqIGsgKyBzKSArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0Qm91bmNlOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSBUV0VFTi5FYXNpbmcuQm91bmNlLk91dCgxIC0gayk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoayA8ICgxIC8gMi43NSkpIHtcblx0XHRcdFx0cmV0dXJuIDcuNTYyNSAqIGsgKiBrO1xuXHRcdFx0fSBlbHNlIGlmIChrIDwgKDIgLyAyLjc1KSkge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogKGsgLT0gKDEuNSAvIDIuNzUpKSAqIGsgKyAwLjc1O1xuXHRcdFx0fSBlbHNlIGlmIChrIDwgKDIuNSAvIDIuNzUpKSB7XG5cdFx0XHRcdHJldHVybiA3LjU2MjUgKiAoayAtPSAoMi4yNSAvIDIuNzUpKSAqIGsgKyAwLjkzNzU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogKGsgLT0gKDIuNjI1IC8gMi43NSkpICogayArIDAuOTg0Mzc1O1xuXHRcdFx0fVxuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoayA8IDAuNSkge1xuXHRcdFx0XHRyZXR1cm4gVFdFRU4uRWFzaW5nLkJvdW5jZS5JbihrICogMikgKiAwLjU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBUV0VFTi5FYXNpbmcuQm91bmNlLk91dChrICogMiAtIDEpICogMC41ICsgMC41O1xuXG5cdFx0fVxuXG5cdH1cblxufTtcblxuVFdFRU4uSW50ZXJwb2xhdGlvbiA9IHtcblxuXHRMaW5lYXI6IGZ1bmN0aW9uICh2LCBrKSB7XG5cblx0XHR2YXIgbSA9IHYubGVuZ3RoIC0gMTtcblx0XHR2YXIgZiA9IG0gKiBrO1xuXHRcdHZhciBpID0gTWF0aC5mbG9vcihmKTtcblx0XHR2YXIgZm4gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkxpbmVhcjtcblxuXHRcdGlmIChrIDwgMCkge1xuXHRcdFx0cmV0dXJuIGZuKHZbMF0sIHZbMV0sIGYpO1xuXHRcdH1cblxuXHRcdGlmIChrID4gMSkge1xuXHRcdFx0cmV0dXJuIGZuKHZbbV0sIHZbbSAtIDFdLCBtIC0gZik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZuKHZbaV0sIHZbaSArIDEgPiBtID8gbSA6IGkgKyAxXSwgZiAtIGkpO1xuXG5cdH0sXG5cblx0QmV6aWVyOiBmdW5jdGlvbiAodiwgaykge1xuXG5cdFx0dmFyIGIgPSAwO1xuXHRcdHZhciBuID0gdi5sZW5ndGggLSAxO1xuXHRcdHZhciBwdyA9IE1hdGgucG93O1xuXHRcdHZhciBibiA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuQmVybnN0ZWluO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gbjsgaSsrKSB7XG5cdFx0XHRiICs9IHB3KDEgLSBrLCBuIC0gaSkgKiBwdyhrLCBpKSAqIHZbaV0gKiBibihuLCBpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYjtcblxuXHR9LFxuXG5cdENhdG11bGxSb206IGZ1bmN0aW9uICh2LCBrKSB7XG5cblx0XHR2YXIgbSA9IHYubGVuZ3RoIC0gMTtcblx0XHR2YXIgZiA9IG0gKiBrO1xuXHRcdHZhciBpID0gTWF0aC5mbG9vcihmKTtcblx0XHR2YXIgZm4gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkNhdG11bGxSb207XG5cblx0XHRpZiAodlswXSA9PT0gdlttXSkge1xuXG5cdFx0XHRpZiAoayA8IDApIHtcblx0XHRcdFx0aSA9IE1hdGguZmxvb3IoZiA9IG0gKiAoMSArIGspKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZuKHZbKGkgLSAxICsgbSkgJSBtXSwgdltpXSwgdlsoaSArIDEpICUgbV0sIHZbKGkgKyAyKSAlIG1dLCBmIC0gaSk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRpZiAoayA8IDApIHtcblx0XHRcdFx0cmV0dXJuIHZbMF0gLSAoZm4odlswXSwgdlswXSwgdlsxXSwgdlsxXSwgLWYpIC0gdlswXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID4gMSkge1xuXHRcdFx0XHRyZXR1cm4gdlttXSAtIChmbih2W21dLCB2W21dLCB2W20gLSAxXSwgdlttIC0gMV0sIGYgLSBtKSAtIHZbbV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZm4odltpID8gaSAtIDEgOiAwXSwgdltpXSwgdlttIDwgaSArIDEgPyBtIDogaSArIDFdLCB2W20gPCBpICsgMiA/IG0gOiBpICsgMl0sIGYgLSBpKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFV0aWxzOiB7XG5cblx0XHRMaW5lYXI6IGZ1bmN0aW9uIChwMCwgcDEsIHQpIHtcblxuXHRcdFx0cmV0dXJuIChwMSAtIHAwKSAqIHQgKyBwMDtcblxuXHRcdH0sXG5cblx0XHRCZXJuc3RlaW46IGZ1bmN0aW9uIChuLCBpKSB7XG5cblx0XHRcdHZhciBmYyA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuRmFjdG9yaWFsO1xuXG5cdFx0XHRyZXR1cm4gZmMobikgLyBmYyhpKSAvIGZjKG4gLSBpKTtcblxuXHRcdH0sXG5cblx0XHRGYWN0b3JpYWw6IChmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHZhciBhID0gWzFdO1xuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKG4pIHtcblxuXHRcdFx0XHR2YXIgcyA9IDE7XG5cblx0XHRcdFx0aWYgKGFbbl0pIHtcblx0XHRcdFx0XHRyZXR1cm4gYVtuXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSBuOyBpID4gMTsgaS0tKSB7XG5cdFx0XHRcdFx0cyAqPSBpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YVtuXSA9IHM7XG5cdFx0XHRcdHJldHVybiBzO1xuXG5cdFx0XHR9O1xuXG5cdFx0fSkoKSxcblxuXHRcdENhdG11bGxSb206IGZ1bmN0aW9uIChwMCwgcDEsIHAyLCBwMywgdCkge1xuXG5cdFx0XHR2YXIgdjAgPSAocDIgLSBwMCkgKiAwLjU7XG5cdFx0XHR2YXIgdjEgPSAocDMgLSBwMSkgKiAwLjU7XG5cdFx0XHR2YXIgdDIgPSB0ICogdDtcblx0XHRcdHZhciB0MyA9IHQgKiB0MjtcblxuXHRcdFx0cmV0dXJuICgyICogcDEgLSAyICogcDIgKyB2MCArIHYxKSAqIHQzICsgKC0gMyAqIHAxICsgMyAqIHAyIC0gMiAqIHYwIC0gdjEpICogdDIgKyB2MCAqIHQgKyBwMTtcblxuXHRcdH1cblxuXHR9XG5cbn07XG5cbi8vIFVNRCAoVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uKVxuKGZ1bmN0aW9uIChyb290KSB7XG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXG5cdFx0Ly8gQU1EXG5cdFx0ZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gVFdFRU47XG5cdFx0fSk7XG5cblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblxuXHRcdC8vIE5vZGUuanNcblx0XHRtb2R1bGUuZXhwb3J0cyA9IFRXRUVOO1xuXG5cdH0gZWxzZSBpZiAocm9vdCAhPT0gdW5kZWZpbmVkKSB7XG5cblx0XHQvLyBHbG9iYWwgdmFyaWFibGVcblx0XHRyb290LlRXRUVOID0gVFdFRU47XG5cblx0fVxuXG59KSh0aGlzKTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIHdpbmRvdyA9IHJlcXVpcmUoXCJnbG9iYWwvd2luZG93XCIpXG52YXIgb25jZSA9IHJlcXVpcmUoXCJvbmNlXCIpXG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCJpcy1mdW5jdGlvblwiKVxudmFyIHBhcnNlSGVhZGVycyA9IHJlcXVpcmUoXCJwYXJzZS1oZWFkZXJzXCIpXG52YXIgeHRlbmQgPSByZXF1aXJlKFwieHRlbmRcIilcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVYSFJcbmNyZWF0ZVhIUi5YTUxIdHRwUmVxdWVzdCA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCB8fCBub29wXG5jcmVhdGVYSFIuWERvbWFpblJlcXVlc3QgPSBcIndpdGhDcmVkZW50aWFsc1wiIGluIChuZXcgY3JlYXRlWEhSLlhNTEh0dHBSZXF1ZXN0KCkpID8gY3JlYXRlWEhSLlhNTEh0dHBSZXF1ZXN0IDogd2luZG93LlhEb21haW5SZXF1ZXN0XG5cbmZvckVhY2hBcnJheShbXCJnZXRcIiwgXCJwdXRcIiwgXCJwb3N0XCIsIFwicGF0Y2hcIiwgXCJoZWFkXCIsIFwiZGVsZXRlXCJdLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBjcmVhdGVYSFJbbWV0aG9kID09PSBcImRlbGV0ZVwiID8gXCJkZWxcIiA6IG1ldGhvZF0gPSBmdW5jdGlvbih1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIG9wdGlvbnMgPSBpbml0UGFyYW1zKHVyaSwgb3B0aW9ucywgY2FsbGJhY2spXG4gICAgICAgIG9wdGlvbnMubWV0aG9kID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICAgICAgcmV0dXJuIF9jcmVhdGVYSFIob3B0aW9ucylcbiAgICB9XG59KVxuXG5mdW5jdGlvbiBmb3JFYWNoQXJyYXkoYXJyYXksIGl0ZXJhdG9yKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRvcihhcnJheVtpXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqKXtcbiAgICBmb3IodmFyIGkgaW4gb2JqKXtcbiAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGkpKSByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gaW5pdFBhcmFtcyh1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhcmFtcyA9IHVyaVxuXG4gICAgaWYgKGlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2YgdXJpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBwYXJhbXMgPSB7dXJpOnVyaX1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtcyA9IHh0ZW5kKG9wdGlvbnMsIHt1cmk6IHVyaX0pXG4gICAgfVxuXG4gICAgcGFyYW1zLmNhbGxiYWNrID0gY2FsbGJhY2tcbiAgICByZXR1cm4gcGFyYW1zXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVhIUih1cmksIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgb3B0aW9ucyA9IGluaXRQYXJhbXModXJpLCBvcHRpb25zLCBjYWxsYmFjaylcbiAgICByZXR1cm4gX2NyZWF0ZVhIUihvcHRpb25zKVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlWEhSKG9wdGlvbnMpIHtcbiAgICB2YXIgY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrXG4gICAgaWYodHlwZW9mIGNhbGxiYWNrID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgYXJndW1lbnQgbWlzc2luZ1wiKVxuICAgIH1cbiAgICBjYWxsYmFjayA9IG9uY2UoY2FsbGJhY2spXG5cbiAgICBmdW5jdGlvbiByZWFkeXN0YXRlY2hhbmdlKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgIGxvYWRGdW5jKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEJvZHkoKSB7XG4gICAgICAgIC8vIENocm9tZSB3aXRoIHJlcXVlc3RUeXBlPWJsb2IgdGhyb3dzIGVycm9ycyBhcnJvdW5kIHdoZW4gZXZlbiB0ZXN0aW5nIGFjY2VzcyB0byByZXNwb25zZVRleHRcbiAgICAgICAgdmFyIGJvZHkgPSB1bmRlZmluZWRcblxuICAgICAgICBpZiAoeGhyLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICBib2R5ID0geGhyLnJlc3BvbnNlXG4gICAgICAgIH0gZWxzZSBpZiAoeGhyLnJlc3BvbnNlVHlwZSA9PT0gXCJ0ZXh0XCIgfHwgIXhoci5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgICAgIGJvZHkgPSB4aHIucmVzcG9uc2VUZXh0IHx8IHhoci5yZXNwb25zZVhNTFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzSnNvbikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib2R5XG4gICAgfVxuXG4gICAgdmFyIGZhaWx1cmVSZXNwb25zZSA9IHtcbiAgICAgICAgICAgICAgICBib2R5OiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMCxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICB1cmw6IHVyaSxcbiAgICAgICAgICAgICAgICByYXdSZXF1ZXN0OiB4aHJcbiAgICAgICAgICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yRnVuYyhldnQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRUaW1lcilcbiAgICAgICAgaWYoIShldnQgaW5zdGFuY2VvZiBFcnJvcikpe1xuICAgICAgICAgICAgZXZ0ID0gbmV3IEVycm9yKFwiXCIgKyAoZXZ0IHx8IFwiVW5rbm93biBYTUxIdHRwUmVxdWVzdCBFcnJvclwiKSApXG4gICAgICAgIH1cbiAgICAgICAgZXZ0LnN0YXR1c0NvZGUgPSAwXG4gICAgICAgIGNhbGxiYWNrKGV2dCwgZmFpbHVyZVJlc3BvbnNlKVxuICAgIH1cblxuICAgIC8vIHdpbGwgbG9hZCB0aGUgZGF0YSAmIHByb2Nlc3MgdGhlIHJlc3BvbnNlIGluIGEgc3BlY2lhbCByZXNwb25zZSBvYmplY3RcbiAgICBmdW5jdGlvbiBsb2FkRnVuYygpIHtcbiAgICAgICAgaWYgKGFib3J0ZWQpIHJldHVyblxuICAgICAgICB2YXIgc3RhdHVzXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0VGltZXIpXG4gICAgICAgIGlmKG9wdGlvbnMudXNlWERSICYmIHhoci5zdGF0dXM9PT11bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vSUU4IENPUlMgR0VUIHN1Y2Nlc3NmdWwgcmVzcG9uc2UgZG9lc24ndCBoYXZlIGEgc3RhdHVzIGZpZWxkLCBidXQgYm9keSBpcyBmaW5lXG4gICAgICAgICAgICBzdGF0dXMgPSAyMDBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXR1cyA9ICh4aHIuc3RhdHVzID09PSAxMjIzID8gMjA0IDogeGhyLnN0YXR1cylcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBmYWlsdXJlUmVzcG9uc2VcbiAgICAgICAgdmFyIGVyciA9IG51bGxcblxuICAgICAgICBpZiAoc3RhdHVzICE9PSAwKXtcbiAgICAgICAgICAgIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgICAgIGJvZHk6IGdldEJvZHkoKSxcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiBzdGF0dXMsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge30sXG4gICAgICAgICAgICAgICAgdXJsOiB1cmksXG4gICAgICAgICAgICAgICAgcmF3UmVxdWVzdDogeGhyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKXsgLy9yZW1lbWJlciB4aHIgY2FuIGluIGZhY3QgYmUgWERSIGZvciBDT1JTIGluIElFXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoXCJJbnRlcm5hbCBYTUxIdHRwUmVxdWVzdCBFcnJvclwiKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGVyciwgcmVzcG9uc2UsIHJlc3BvbnNlLmJvZHkpXG5cbiAgICB9XG5cbiAgICB2YXIgeGhyID0gb3B0aW9ucy54aHIgfHwgbnVsbFxuXG4gICAgaWYgKCF4aHIpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY29ycyB8fCBvcHRpb25zLnVzZVhEUikge1xuICAgICAgICAgICAgeGhyID0gbmV3IGNyZWF0ZVhIUi5YRG9tYWluUmVxdWVzdCgpXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgeGhyID0gbmV3IGNyZWF0ZVhIUi5YTUxIdHRwUmVxdWVzdCgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIga2V5XG4gICAgdmFyIGFib3J0ZWRcbiAgICB2YXIgdXJpID0geGhyLnVybCA9IG9wdGlvbnMudXJpIHx8IG9wdGlvbnMudXJsXG4gICAgdmFyIG1ldGhvZCA9IHhoci5tZXRob2QgPSBvcHRpb25zLm1ldGhvZCB8fCBcIkdFVFwiXG4gICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHkgfHwgb3B0aW9ucy5kYXRhIHx8IG51bGxcbiAgICB2YXIgaGVhZGVycyA9IHhoci5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9XG4gICAgdmFyIHN5bmMgPSAhIW9wdGlvbnMuc3luY1xuICAgIHZhciBpc0pzb24gPSBmYWxzZVxuICAgIHZhciB0aW1lb3V0VGltZXJcblxuICAgIGlmIChcImpzb25cIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIGlzSnNvbiA9IHRydWVcbiAgICAgICAgaGVhZGVyc1tcImFjY2VwdFwiXSB8fCBoZWFkZXJzW1wiQWNjZXB0XCJdIHx8IChoZWFkZXJzW1wiQWNjZXB0XCJdID0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIC8vRG9uJ3Qgb3ZlcnJpZGUgZXhpc3RpbmcgYWNjZXB0IGhlYWRlciBkZWNsYXJlZCBieSB1c2VyXG4gICAgICAgIGlmIChtZXRob2QgIT09IFwiR0VUXCIgJiYgbWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgICAgICAgaGVhZGVyc1tcImNvbnRlbnQtdHlwZVwiXSB8fCBoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdIHx8IChoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIC8vRG9uJ3Qgb3ZlcnJpZGUgZXhpc3RpbmcgYWNjZXB0IGhlYWRlciBkZWNsYXJlZCBieSB1c2VyXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5qc29uKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHJlYWR5c3RhdGVjaGFuZ2VcbiAgICB4aHIub25sb2FkID0gbG9hZEZ1bmNcbiAgICB4aHIub25lcnJvciA9IGVycm9yRnVuY1xuICAgIC8vIElFOSBtdXN0IGhhdmUgb25wcm9ncmVzcyBiZSBzZXQgdG8gYSB1bmlxdWUgZnVuY3Rpb24uXG4gICAgeGhyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIElFIG11c3QgZGllXG4gICAgfVxuICAgIHhoci5vbnRpbWVvdXQgPSBlcnJvckZ1bmNcbiAgICB4aHIub3BlbihtZXRob2QsIHVyaSwgIXN5bmMsIG9wdGlvbnMudXNlcm5hbWUsIG9wdGlvbnMucGFzc3dvcmQpXG4gICAgLy9oYXMgdG8gYmUgYWZ0ZXIgb3BlblxuICAgIGlmKCFzeW5jKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSAhIW9wdGlvbnMud2l0aENyZWRlbnRpYWxzXG4gICAgfVxuICAgIC8vIENhbm5vdCBzZXQgdGltZW91dCB3aXRoIHN5bmMgcmVxdWVzdFxuICAgIC8vIG5vdCBzZXR0aW5nIHRpbWVvdXQgb24gdGhlIHhociBvYmplY3QsIGJlY2F1c2Ugb2Ygb2xkIHdlYmtpdHMgZXRjLiBub3QgaGFuZGxpbmcgdGhhdCBjb3JyZWN0bHlcbiAgICAvLyBib3RoIG5wbSdzIHJlcXVlc3QgYW5kIGpxdWVyeSAxLnggdXNlIHRoaXMga2luZCBvZiB0aW1lb3V0LCBzbyB0aGlzIGlzIGJlaW5nIGNvbnNpc3RlbnRcbiAgICBpZiAoIXN5bmMgJiYgb3B0aW9ucy50aW1lb3V0ID4gMCApIHtcbiAgICAgICAgdGltZW91dFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgYWJvcnRlZD10cnVlLy9JRTkgbWF5IHN0aWxsIGNhbGwgcmVhZHlzdGF0ZWNoYW5nZVxuICAgICAgICAgICAgeGhyLmFib3J0KFwidGltZW91dFwiKVxuICAgICAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoXCJYTUxIdHRwUmVxdWVzdCB0aW1lb3V0XCIpXG4gICAgICAgICAgICBlLmNvZGUgPSBcIkVUSU1FRE9VVFwiXG4gICAgICAgICAgICBlcnJvckZ1bmMoZSlcbiAgICAgICAgfSwgb3B0aW9ucy50aW1lb3V0IClcbiAgICB9XG5cbiAgICBpZiAoeGhyLnNldFJlcXVlc3RIZWFkZXIpIHtcbiAgICAgICAgZm9yKGtleSBpbiBoZWFkZXJzKXtcbiAgICAgICAgICAgIGlmKGhlYWRlcnMuaGFzT3duUHJvcGVydHkoa2V5KSl7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBoZWFkZXJzW2tleV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaGVhZGVycyAmJiAhaXNFbXB0eShvcHRpb25zLmhlYWRlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkhlYWRlcnMgY2Fubm90IGJlIHNldCBvbiBhbiBYRG9tYWluUmVxdWVzdCBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAoXCJyZXNwb25zZVR5cGVcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSBvcHRpb25zLnJlc3BvbnNlVHlwZVxuICAgIH1cblxuICAgIGlmIChcImJlZm9yZVNlbmRcIiBpbiBvcHRpb25zICYmXG4gICAgICAgIHR5cGVvZiBvcHRpb25zLmJlZm9yZVNlbmQgPT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgICBvcHRpb25zLmJlZm9yZVNlbmQoeGhyKVxuICAgIH1cblxuICAgIHhoci5zZW5kKGJvZHkpXG5cbiAgICByZXR1cm4geGhyXG5cblxufVxuXG5mdW5jdGlvbiBub29wKCkge31cbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0Q1NTVHJhbnNpdGlvbkdyb3VwIGZyb20gJ3JlYWN0LWFkZG9ucy1jc3MtdHJhbnNpdGlvbi1ncm91cCc7XG5pbXBvcnQgUmVhY3RET00gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7XG5cdENvbnRhaW5lcixcblx0Y3JlYXRlQXBwLFxuXHRVSSxcblx0Vmlldyxcblx0Vmlld01hbmFnZXJcbn0gZnJvbSAndG91Y2hzdG9uZWpzJztcblxuLy8gQXBwIENvbmZpZ1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IFBlb3BsZVN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZXMvcGVvcGxlJylcbmNvbnN0IHBlb3BsZVN0b3JlID0gbmV3IFBlb3BsZVN0b3JlKClcblxudmFyIEFwcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbY3JlYXRlQXBwKCldLFxuXG5cdGNoaWxkQ29udGV4dFR5cGVzOiB7XG5cdFx0cGVvcGxlU3RvcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3Rcblx0fSxcblxuXHRnZXRDaGlsZENvbnRleHQgKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRwZW9wbGVTdG9yZTogcGVvcGxlU3RvcmVcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50ICgpIHtcblx0XHQvLyBIaWRlIHRoZSBzcGxhc2ggc2NyZWVuIHdoZW4gdGhlIGFwcCBpcyBtb3VudGVkXG5cdFx0aWYgKG5hdmlnYXRvci5zcGxhc2hzY3JlZW4pIHtcblx0XHRcdG5hdmlnYXRvci5zcGxhc2hzY3JlZW4uaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXIgKCkge1xuXHRcdGxldCBhcHBXcmFwcGVyQ2xhc3NOYW1lID0gJ2FwcC13cmFwcGVyIGRldmljZS0tJyArICh3aW5kb3cuZGV2aWNlIHx8IHt9KS5wbGF0Zm9ybVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXthcHBXcmFwcGVyQ2xhc3NOYW1lfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXZpY2Utc2lsaG91ZXR0ZVwiPlxuXHRcdFx0XHRcdDxWaWV3TWFuYWdlciBuYW1lPVwiYXBwXCIgZGVmYXVsdFZpZXc9XCJtYWluXCI+XG5cdFx0XHRcdFx0XHQ8VmlldyBuYW1lPVwibWFpblwiIGNvbXBvbmVudD17TWFpblZpZXdDb250cm9sbGVyfSAvPlxuXHRcdFx0XHRcdFx0PFZpZXcgbmFtZT1cInRyYW5zaXRpb25zLXRhcmdldC1vdmVyXCIgY29tcG9uZW50PXtyZXF1aXJlKCcuL3ZpZXdzL3RyYW5zaXRpb25zLXRhcmdldC1vdmVyJyl9IC8+XG5cdFx0XHRcdFx0PC9WaWV3TWFuYWdlcj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLy8gTWFpbiBDb250cm9sbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxudmFyIE1haW5WaWV3Q29udHJvbGxlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PENvbnRhaW5lcj5cblx0XHRcdFx0PFVJLk5hdmlnYXRpb25CYXIgbmFtZT1cIm1haW5cIiAvPlxuXHRcdFx0XHQ8Vmlld01hbmFnZXIgbmFtZT1cIm1haW5cIiBkZWZhdWx0Vmlldz1cInRhYnNcIj5cblx0XHRcdFx0XHQ8VmlldyBuYW1lPVwidGFic1wiIGNvbXBvbmVudD17VGFiVmlld0NvbnRyb2xsZXJ9IC8+XG5cdFx0XHRcdDwvVmlld01hbmFnZXI+XG5cdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHQpO1xuXHR9XG59KTtcblxuLy8gVGFiIENvbnRyb2xsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgbGFzdFNlbGVjdGVkVGFiID0gJ2xpc3RzJ1xudmFyIFRhYlZpZXdDb250cm9sbGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGUgKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3RlZFRhYjogbGFzdFNlbGVjdGVkVGFiXG5cdFx0fTtcblx0fSxcblxuXHRvblZpZXdDaGFuZ2UgKG5leHRWaWV3KSB7XG5cdFx0bGFzdFNlbGVjdGVkVGFiID0gbmV4dFZpZXdcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2VsZWN0ZWRUYWI6IG5leHRWaWV3XG5cdFx0fSk7XG5cdH0sXG5cblx0c2VsZWN0VGFiICh2YWx1ZSkge1xuXHRcdGxldCB2aWV3UHJvcHM7XG5cblx0XHR0aGlzLnJlZnMudm0udHJhbnNpdGlvblRvKHZhbHVlLCB7XG5cdFx0XHR0cmFuc2l0aW9uOiAnaW5zdGFudCcsXG5cdFx0XHR2aWV3UHJvcHM6IHZpZXdQcm9wc1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzZWxlY3RlZFRhYjogdmFsdWVcblx0XHR9KVxuXHR9LFxuXG5cdHJlbmRlciAoKSB7XG5cdFx0bGV0IHNlbGVjdGVkVGFiID0gdGhpcy5zdGF0ZS5zZWxlY3RlZFRhYlxuXHRcdGxldCBzZWxlY3RlZFRhYlNwYW4gPSBzZWxlY3RlZFRhYlxuXG5cdFx0aWYgKHNlbGVjdGVkVGFiID09PSAnbGlzdHMnIHx8IHNlbGVjdGVkVGFiID09PSAnbGlzdC1zaW1wbGUnIHx8IHNlbGVjdGVkVGFiID09PSAnbGlzdC1jb21wbGV4JyB8fCBzZWxlY3RlZFRhYiA9PT0gJ2xpc3QtZGV0YWlscycpIHtcblx0XHRcdHNlbGVjdGVkVGFiU3BhbiA9ICdsaXN0cyc7XG5cdFx0fVxuXG5cdFx0aWYgKHNlbGVjdGVkVGFiID09PSAndHJhbnNpdGlvbnMnIHx8IHNlbGVjdGVkVGFiID09PSAndHJhbnNpdGlvbnMtdGFyZ2V0Jykge1xuXHRcdFx0c2VsZWN0ZWRUYWJTcGFuID0gJ3RyYW5zaXRpb25zJztcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PENvbnRhaW5lcj5cblx0XHRcdFx0PFZpZXdNYW5hZ2VyIHJlZj1cInZtXCIgbmFtZT1cInRhYnNcIiBkZWZhdWx0Vmlldz17c2VsZWN0ZWRUYWJ9IG9uVmlld0NoYW5nZT17dGhpcy5vblZpZXdDaGFuZ2V9PlxuXHRcdFx0XHRcdDxWaWV3IG5hbWU9XCJsaXN0c1wiIGNvbXBvbmVudD17cmVxdWlyZSgnLi92aWV3cy9saXN0cycpfSAvPlxuXHRcdFx0XHRcdDxWaWV3IG5hbWU9XCJsaXN0LXNpbXBsZVwiIGNvbXBvbmVudD17cmVxdWlyZSgnLi92aWV3cy9saXN0LXNpbXBsZScpfSAvPlxuXHRcdFx0XHRcdDxWaWV3IG5hbWU9XCJsaXN0LWNvbXBsZXhcIiBjb21wb25lbnQ9e3JlcXVpcmUoJy4vdmlld3MvbGlzdC1jb21wbGV4Jyl9IC8+XG5cdFx0XHRcdFx0PFZpZXcgbmFtZT1cImxpc3QtZGV0YWlsc1wiIGNvbXBvbmVudD17cmVxdWlyZSgnLi92aWV3cy9saXN0LWRldGFpbHMnKX0gLz5cblx0XHRcdFx0XHQ8VmlldyBuYW1lPVwiZm9ybVwiIGNvbXBvbmVudD17cmVxdWlyZSgnLi92aWV3cy9mb3JtJyl9IC8+XG5cdFx0XHRcdFx0PFZpZXcgbmFtZT1cImNvbnRyb2xzXCIgY29tcG9uZW50PXtyZXF1aXJlKCcuL3ZpZXdzL2NvbnRyb2xzJyl9IC8+XG5cdFx0XHRcdFx0PFZpZXcgbmFtZT1cInRyYW5zaXRpb25zXCIgY29tcG9uZW50PXtyZXF1aXJlKCcuL3ZpZXdzL3RyYW5zaXRpb25zJyl9IC8+XG5cdFx0XHRcdFx0PFZpZXcgbmFtZT1cInRyYW5zaXRpb25zLXRhcmdldFwiIGNvbXBvbmVudD17cmVxdWlyZSgnLi92aWV3cy90cmFuc2l0aW9ucy10YXJnZXQnKX0gLz5cblx0XHRcdFx0PC9WaWV3TWFuYWdlcj5cblx0XHRcdFx0PFVJLlRhYnMuTmF2aWdhdG9yPlxuXHRcdFx0XHRcdDxVSS5UYWJzLlRhYiBvblRhcD17dGhpcy5zZWxlY3RUYWIuYmluZCh0aGlzLCAnbGlzdHMnKX0gc2VsZWN0ZWQ9e3NlbGVjdGVkVGFiU3BhbiA9PT0gJ2xpc3RzJ30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJUYWJzLUljb24gVGFicy1JY29uLS1saXN0c1wiIC8+XG5cdFx0XHRcdFx0XHQ8VUkuVGFicy5MYWJlbD5MaXN0czwvVUkuVGFicy5MYWJlbD5cblx0XHRcdFx0XHQ8L1VJLlRhYnMuVGFiPlxuXHRcdFx0XHRcdDxVSS5UYWJzLlRhYiBvblRhcD17dGhpcy5zZWxlY3RUYWIuYmluZCh0aGlzLCAnZm9ybScpfSBzZWxlY3RlZD17c2VsZWN0ZWRUYWJTcGFuID09PSAnZm9ybSd9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiVGFicy1JY29uIFRhYnMtSWNvbi0tZm9ybXNcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLlRhYnMuTGFiZWw+Rm9ybXM8L1VJLlRhYnMuTGFiZWw+XG5cdFx0XHRcdFx0PC9VSS5UYWJzLlRhYj5cblx0XHRcdFx0XHQ8VUkuVGFicy5UYWIgb25UYXA9e3RoaXMuc2VsZWN0VGFiLmJpbmQodGhpcywgJ2NvbnRyb2xzJyl9IHNlbGVjdGVkPXtzZWxlY3RlZFRhYlNwYW4gPT09ICdjb250cm9scyd9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiVGFicy1JY29uIFRhYnMtSWNvbi0tY29udHJvbHNcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLlRhYnMuTGFiZWw+Q29udHJvbHM8L1VJLlRhYnMuTGFiZWw+XG5cdFx0XHRcdFx0PC9VSS5UYWJzLlRhYj5cblx0XHRcdFx0XHQ8VUkuVGFicy5UYWIgb25UYXA9e3RoaXMuc2VsZWN0VGFiLmJpbmQodGhpcywgJ3RyYW5zaXRpb25zJyl9IHNlbGVjdGVkPXtzZWxlY3RlZFRhYlNwYW4gPT09ICd0cmFuc2l0aW9ucyd9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiVGFicy1JY29uIFRhYnMtSWNvbi0tdHJhbnNpdGlvbnNcIiAvPlxuXHRcdFx0XHRcdFx0PFVJLlRhYnMuTGFiZWw+VHJhbnNpdGlvbnM8L1VJLlRhYnMuTGFiZWw+XG5cdFx0XHRcdFx0PC9VSS5UYWJzLlRhYj5cblx0XHRcdFx0PC9VSS5UYWJzLk5hdmlnYXRvcj5cblx0XHRcdDwvQ29udGFpbmVyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5mdW5jdGlvbiBzdGFydEFwcCAoKSB7XG5cdGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XG5cdFx0d2luZG93LlN0YXR1c0Jhci5zdHlsZURlZmF1bHQoKTtcblx0fVxuXHRSZWFjdERPTS5yZW5kZXIoPEFwcCAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpKTtcbn1cblxuaWYgKCF3aW5kb3cuY29yZG92YSkge1xuXHRzdGFydEFwcCgpO1xufSBlbHNlIHtcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCBzdGFydEFwcCwgZmFsc2UpO1xufVxuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxudmFyIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcbnZhciBodHRwaWZ5ID0gcmVxdWlyZSgnaHR0cGlmeScpO1xuXG5jb25zdCBhcGlVcmwgPSAod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JykgPyAnaHR0cHM6Ly9yYW5kb211c2VyLm1lL2FwaT9uYXQ9YXUmcmVzdWx0cz0xNicgOiAnaHR0cDovL2FwaS5yYW5kb211c2VyLm1lLz9uYXQ9YXUmcmVzdWx0cz0xNic7XG5cbmZ1bmN0aW9uIFBlb3BsZVN0b3JlICgpIHtcblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0Ly8gaW5pdGlhbGl6ZSBpbnRlcm5hbCBjYWNoZVxuXHR2YXIgc3RvcmFnZSA9IHRoaXMuY2FjaGUgPSB7XG5cdFx0cGVvcGxlOiBbXVxuXHR9O1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0Ly8gRGlzcGF0Y2hlcnNcblx0dGhpcy5zdGFyUXVldWUgPSBhc3luYy5xdWV1ZSgoZGF0YSwgY2FsbGJhY2spID0+IHtcblx0XHR2YXIgeyBpZCwgc3RhcnJlZCB9ID0gZGF0YTtcblxuXHRcdC8vIHVwZGF0ZSBpbnRlcm5hbCBkYXRhXG5cdFx0c2VsZi5jYWNoZS5wZW9wbGVcblx0XHRcdC5maWx0ZXIocGVyc29uID0+IHBlcnNvbi5pZCA9PT0gaWQpXG5cdFx0XHQuZm9yRWFjaChwZXJzb24gPT4gcGVyc29uLmlzU3RhcnJlZCA9IHN0YXJyZWQpO1xuXG5cdFx0Ly8gZW1pdCBldmVudHNcblx0XHRzZWxmLmVtaXQoJ3Blb3BsZS11cGRhdGVkJywgc3RvcmFnZS5wZW9wbGUpO1xuXG5cdFx0Y2FsbGJhY2soKTtcblx0fSwgMSk7XG5cblx0dGhpcy5yZWZyZXNoUXVldWUgPSBhc3luYy5xdWV1ZSgoXywgY2FsbGJhY2spID0+IHtcblx0XHQvLyB1cGRhdGVcblx0XHRodHRwaWZ5KHtcblx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHR1cmw6IGFwaVVybFxuXHRcdH0sIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuXHRcdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cblx0XHRcdHN0b3JhZ2UucGVvcGxlID0gcmVzLmJvZHkucmVzdWx0cy5tYXAocCA9PiBwLnVzZXIpO1xuXHRcdFx0XG5cdFx0XHQvLyBwb3N0IHByb2Nlc3MgbmV3IGRhdGFcblx0XHRcdHN0b3JhZ2UucGVvcGxlLmZvckVhY2goKHBlcnNvbiwgaSkgPT4ge1xuXHRcdFx0XHRwZXJzb24uaWQgPSBpO1xuXHRcdFx0XHRwZXJzb24ubmFtZS5maXJzdCA9IHBlcnNvbi5uYW1lLmZpcnN0WzBdLnRvVXBwZXJDYXNlKCkgKyBwZXJzb24ubmFtZS5maXJzdC5zbGljZSgxKTtcblx0XHRcdFx0cGVyc29uLm5hbWUubGFzdCA9IHBlcnNvbi5uYW1lLmxhc3RbMF0udG9VcHBlckNhc2UoKSArIHBlcnNvbi5uYW1lLmxhc3Quc2xpY2UoMSk7XG5cdFx0XHRcdHBlcnNvbi5uYW1lLmluaXRpYWxzID0gcGVyc29uLm5hbWUuZmlyc3RbMF0gKyBwZXJzb24ubmFtZS5sYXN0WzBdO1xuXHRcdFx0XHRwZXJzb24ubmFtZS5mdWxsID0gcGVyc29uLm5hbWUuZmlyc3QgKyAnICcgKyBwZXJzb24ubmFtZS5sYXN0O1xuXHRcdFx0XHRwZXJzb24uY2F0ZWdvcnkgPSBNYXRoLnJhbmRvbSgpID4gMC41ID8gJ0EnIDogJ0InO1xuXHRcdFx0XHRwZXJzb24uZ2l0aHViID0gcGVyc29uLm5hbWUuZmlyc3QudG9Mb3dlckNhc2UoKSArIHBlcnNvbi5uYW1lLmxhc3QudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0cGVyc29uLnBpY3R1cmUgPSBwZXJzb24ucGljdHVyZS5tZWRpdW07XG5cdFx0XHRcdHBlcnNvbi50d2l0dGVyID0gJ0AnICsgcGVyc29uLm5hbWUuZmlyc3QudG9Mb3dlckNhc2UoKSArIChNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDMyKS5zbGljZSgyLCA1KSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gZW1pdCBldmVudHNcblx0XHRcdHNlbGYuZW1pdCgncGVvcGxlLXVwZGF0ZWQnLCBzdG9yYWdlLnBlb3BsZSk7XG5cdFx0XHRzZWxmLmVtaXQoJ3JlZnJlc2gnKTtcblxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgc3RvcmFnZS5wZW9wbGUpO1xuXHRcdH0pO1xuXHR9LCAxKTtcblxuXHQvLyByZWZyZXNoIGltbWVkaWF0ZWx5XG5cdHRoaXMucmVmcmVzaCgpO1xufVxuXG5PYmplY3QuYXNzaWduKFBlb3BsZVN0b3JlLnByb3RvdHlwZSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSk7XG5cbi8vIEludGVudHNcblBlb3BsZVN0b3JlLnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cdHRoaXMucmVmcmVzaFF1ZXVlLnB1c2gobnVsbCwgY2FsbGJhY2spO1xufVxuXG5QZW9wbGVTdG9yZS5wcm90b3R5cGUuc3RhciA9IGZ1bmN0aW9uICh7IGlkIH0sIHN0YXJyZWQsIGNhbGxiYWNrKSB7XG5cdHRoaXMuc3RhclF1ZXVlLnB1c2goeyBpZCwgc3RhcnJlZCB9LCBjYWxsYmFjayk7XG59XG5cbi8vIEdldHRlcnNcblBlb3BsZVN0b3JlLnByb3RvdHlwZS5nZXRQZW9wbGUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmNhY2hlLnBlb3BsZTsgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBQZW9wbGVTdG9yZTtcbiIsImltcG9ydCBDb250YWluZXIgZnJvbSAncmVhY3QtY29udGFpbmVyJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgVGFwcGFibGUgZnJvbSAncmVhY3QtdGFwcGFibGUnO1xuaW1wb3J0IFRpbWVycyBmcm9tICdyZWFjdC10aW1lcnMnO1xuaW1wb3J0IHsgTGluaywgVUkgfSBmcm9tICd0b3VjaHN0b25lanMnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbVGltZXJzXSxcblx0c3RhdGljczoge1xuXHRcdG5hdmlnYXRpb25CYXI6ICdtYWluJyxcblx0XHRnZXROYXZpZ2F0aW9uICgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRpdGxlOiAnQ29udHJvbHMnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRcblx0Z2V0SW5pdGlhbFN0YXRlICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0YWxlcnRiYXI6IHtcblx0XHRcdFx0dmlzaWJsZTogZmFsc2UsXG5cdFx0XHRcdHR5cGU6ICcnLFxuXHRcdFx0XHR0ZXh0OiAnJ1xuXHRcdFx0fSxcblx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdHZpc2libGU6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRcblx0c2hvd0xvYWRpbmdQb3B1cCAoKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRwb3B1cDoge1xuXHRcdFx0XHR2aXNpYmxlOiB0cnVlLFxuXHRcdFx0XHRsb2FkaW5nOiB0cnVlLFxuXHRcdFx0XHRoZWFkZXI6ICdMb2FkaW5nJyxcblx0XHRcdFx0aWNvbk5hbWU6ICdpb24tbG9hZC1jJyxcblx0XHRcdFx0aWNvblR5cGU6ICdkZWZhdWx0J1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRwb3B1cDoge1xuXHRcdFx0XHRcdHZpc2libGU6IHRydWUsXG5cdFx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdFx0aGVhZGVyOiAnRG9uZSEnLFxuXHRcdFx0XHRcdGljb25OYW1lOiAnaW9uLWlvcy1jaGVja21hcmsnLFxuXHRcdFx0XHRcdGljb25UeXBlOiAnc3VjY2Vzcydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgMjAwMCk7XG5cblx0XHR0aGlzLnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHBvcHVwOiB7XG5cdFx0XHRcdFx0dmlzaWJsZTogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgMzAwMCk7XG5cdH0sXG5cdFxuXHRzaG93QWxlcnRiYXIgKHR5cGUsIHRleHQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGFsZXJ0YmFyOiB7XG5cdFx0XHRcdHZpc2libGU6IHRydWUsXG5cdFx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRcdHRleHQ6IHRleHRcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0YWxlcnRiYXI6IHtcblx0XHRcdFx0XHR2aXNpYmxlOiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LCAyMDAwKTtcblx0fSxcblx0XG5cdGhhbmRsZU1vZGVDaGFuZ2UgKG5ld01vZGUpIHtcblx0XHRsZXQgc2VsZWN0ZWRJdGVtID0gbmV3TW9kZTtcblxuXHRcdGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkTW9kZSA9PT0gbmV3TW9kZSkge1xuXHRcdFx0c2VsZWN0ZWRJdGVtID0gbnVsbDtcblx0XHR9XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNlbGVjdGVkTW9kZTogc2VsZWN0ZWRJdGVtXG5cdFx0fSk7XG5cblx0fSxcblx0XG5cdHJlbmRlciAoKSB7XG5cdFx0bGV0IHsgYWxlcnRiYXIgfSA9IHRoaXMuc3RhdGU7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXIgc2Nyb2xsYWJsZT5cblx0XHRcdFx0PFVJLkFsZXJ0YmFyIHR5cGU9e2FsZXJ0YmFyLnR5cGUgfHwgJ2RlZmF1bHQnfSB2aXNpYmxlPXthbGVydGJhci52aXNpYmxlfSBhbmltYXRlZD57YWxlcnRiYXIudGV4dCB8fCAnJ308L1VJLkFsZXJ0YmFyPlxuXHRcdFx0XHQ8VUkuR3JvdXAgaGFzVG9wR3V0dGVyPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEhlYWRlcj5TZWdtZW50ZWQgQ29udHJvbDwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0PFVJLlNlZ21lbnRlZENvbnRyb2wgdmFsdWU9e3RoaXMuc3RhdGUuc2VsZWN0ZWRNb2RlfSBvbkNoYW5nZT17dGhpcy5oYW5kbGVNb2RlQ2hhbmdlfSBoYXNHdXR0ZXIgb3B0aW9ucz17W1xuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ09uZScsIHZhbHVlOiAnb25lJyB9LFxuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ1R3bycsIHZhbHVlOiAndHdvJyB9LFxuXHRcdFx0XHRcdFx0eyBsYWJlbDogJ1RocmVlJywgdmFsdWU6ICd0aHJlZScgfSxcblx0XHRcdFx0XHRcdHsgbGFiZWw6ICdGb3VyJywgdmFsdWU6ICdmb3VyJyB9XG5cdFx0XHRcdFx0XX0gLz5cblx0XHRcdFx0PC9VSS5Hcm91cD5cblxuXHRcdFx0XHQ8VUkuR3JvdXA+XG5cdFx0XHRcdFx0PFVJLkdyb3VwSGVhZGVyPkFsZXJ0IEJhcjwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0PFVJLkJ1dHRvbkdyb3VwPlxuXHRcdFx0XHRcdFx0PFVJLkJ1dHRvbiB0eXBlPVwicHJpbWFyeVwiIG9uVGFwPXt0aGlzLnNob3dBbGVydGJhci5iaW5kKHRoaXMsICdkYW5nZXInLCAnTm8gSW50ZXJuZXQgQ29ubmVjdGlvbicpfSBkaXNhYmxlZD17dGhpcy5zdGF0ZS5hbGVydGJhci52aXNpYmxlfT5cblx0XHRcdFx0XHRcdFx0RGFuZ2VyXG5cdFx0XHRcdFx0XHQ8L1VJLkJ1dHRvbj5cblx0XHRcdFx0XHRcdDxVSS5CdXR0b24gdHlwZT1cInByaW1hcnlcIiBvblRhcD17dGhpcy5zaG93QWxlcnRiYXIuYmluZCh0aGlzLCAnd2FybmluZycsICdDb25uZWN0aW5nLi4uJyl9IGRpc2FibGVkPXt0aGlzLnN0YXRlLmFsZXJ0YmFyLnZpc2libGV9PlxuXHRcdFx0XHRcdFx0XHRXYXJuaW5nXG5cdFx0XHRcdFx0XHQ8L1VJLkJ1dHRvbj5cblx0XHRcdFx0XHRcdDxVSS5CdXR0b24gdHlwZT1cInByaW1hcnlcIiBvblRhcD17dGhpcy5zaG93QWxlcnRiYXIuYmluZCh0aGlzLCAnc3VjY2VzcycsICdDb25uZWN0ZWQnKX0gZGlzYWJsZWQ9e3RoaXMuc3RhdGUuYWxlcnRiYXIudmlzaWJsZX0+XG5cdFx0XHRcdFx0XHRcdFN1Y2Nlc3Ncblx0XHRcdFx0XHRcdDwvVUkuQnV0dG9uPlxuXHRcdFx0XHRcdDwvVUkuQnV0dG9uR3JvdXA+XG5cdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+UG9wdXA8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdDxVSS5CdXR0b24gdHlwZT1cInByaW1hcnlcIiBvblRhcD17dGhpcy5zaG93TG9hZGluZ1BvcHVwfSBkaXNhYmxlZD17dGhpcy5zdGF0ZS5wb3B1cC52aXNpYmxlfT5cblx0XHRcdFx0XHRcdFNob3cgUG9wdXBcblx0XHRcdFx0XHQ8L1VJLkJ1dHRvbj5cblx0XHRcdFx0PC9VSS5Hcm91cD5cblx0XHRcdFx0PFVJLkdyb3VwPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEhlYWRlcj5BcHBsaWNhdGlvbiBTdGF0ZTwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0PFVJLkdyb3VwQm9keT5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidGFiczpub24tZXhpc3RlbnRcIiB0cmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCI+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5JbnZhbGlkIFZpZXc8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHQ8L1VJLkdyb3VwPlxuXG5cdFx0XHRcdDxVSS5Qb3B1cCB2aXNpYmxlPXt0aGlzLnN0YXRlLnBvcHVwLnZpc2libGV9PlxuXHRcdFx0XHRcdDxVSS5Qb3B1cEljb24gbmFtZT17dGhpcy5zdGF0ZS5wb3B1cC5pY29uTmFtZX0gdHlwZT17dGhpcy5zdGF0ZS5wb3B1cC5pY29uVHlwZX0gc3Bpbm5pbmc9e3RoaXMuc3RhdGUucG9wdXAubG9hZGluZ30gLz5cdFx0XG5cdFx0XHRcdFx0PGRpdj48c3Ryb25nPnt0aGlzLnN0YXRlLnBvcHVwLmhlYWRlcn08L3N0cm9uZz48L2Rpdj5cblx0XHRcdFx0PC9VSS5Qb3B1cD5cblx0XHRcdDwvQ29udGFpbmVyPlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IENvbnRhaW5lciBmcm9tICdyZWFjdC1jb250YWluZXInO1xuaW1wb3J0IGRpYWxvZ3MgZnJvbSAnY29yZG92YS1kaWFsb2dzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgVGFwcGFibGUgZnJvbSAncmVhY3QtdGFwcGFibGUnO1xuaW1wb3J0IHsgVUkgfSBmcm9tICd0b3VjaHN0b25lanMnO1xuXG5jb25zdCBzY3JvbGxhYmxlID0gQ29udGFpbmVyLmluaXRTY3JvbGxhYmxlKCk7XG5cbi8vIGh0bWw1IGlucHV0IHR5cGVzIGZvciB0ZXN0aW5nXG4vLyBvbWl0dGVkOiBidXR0b24sIGNoZWNrYm94LCByYWRpbywgaW1hZ2UsIGhpZGRlbiwgcmVzZXQsIHN1Ym1pdFxuY29uc3QgSFRNTDVfSU5QVVRfVFlQRVMgPSBbJ2NvbG9yJywgJ2RhdGUnLCAnZGF0ZXRpbWUnLCAnZGF0ZXRpbWUtbG9jYWwnLCAnZW1haWwnLCAnZmlsZScsICdtb250aCcsICdudW1iZXInLCAncGFzc3dvcmQnLCAncmFuZ2UnLCAnc2VhcmNoJywgJ3RlbCcsICd0ZXh0JywgJ3RpbWUnLCAndXJsJywgJ3dlZWsnXTtcbmNvbnN0IEZMQVZPVVJTID0gW1xuXHR7IGxhYmVsOiAnVmFuaWxsYScsICAgIHZhbHVlOiAndmFuaWxsYScgfSxcblx0eyBsYWJlbDogJ0Nob2NvbGF0ZScsICB2YWx1ZTogJ2Nob2NvbGF0ZScgfSxcblx0eyBsYWJlbDogJ0NhcmFtZWwnLCAgICB2YWx1ZTogJ2NhcmFtZWwnIH0sXG5cdHsgbGFiZWw6ICdTdHJhd2JlcnJ5JywgdmFsdWU6ICdzdHJhd2JlcnJ5JyB9XG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0c3RhdGljczoge1xuXHRcdG5hdmlnYXRpb25CYXI6ICdtYWluJyxcblx0XHRnZXROYXZpZ2F0aW9uICgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRpdGxlOiAnRm9ybXMnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXHRcblx0Z2V0SW5pdGlhbFN0YXRlICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Zmxhdm91ckxhYmVsU2VsZWN0OiAnY2hvY29sYXRlJyxcblx0XHRcdGZsYXZvdXJSYWRpb0xpc3Q6ICdjaG9jb2xhdGUnLFxuXHRcdFx0c3dpdGNoVmFsdWU6IHRydWVcblx0XHR9XG5cdH0sXG5cdFxuXHRoYW5kbGVSYWRpb0xpc3RDaGFuZ2UgKGtleSwgbmV3VmFsdWUpIHtcblx0XHRjb25zb2xlLmxvZygnaGFuZGxlRmxhdm91ckNoYW5nZTonLCBrZXksIG5ld1ZhbHVlKTtcblx0XHRsZXQgbmV3U3RhdGUgPSB7fTtcblx0XHRuZXdTdGF0ZVtrZXldID0gbmV3VmFsdWU7XG5cblx0XHR0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcblx0fSxcblx0XG5cdGhhbmRsZUxhYmVsU2VsZWN0Q2hhbmdlIChrZXksIGV2ZW50KSB7XG5cdFx0Y29uc29sZS5sb2coJ2hhbmRsZUZsYXZvdXJDaGFuZ2U6Jywga2V5LCBldmVudC50YXJnZXQudmFsdWUpO1xuXHRcdGxldCBuZXdTdGF0ZSA9IHt9O1xuXHRcdG5ld1N0YXRlW2tleV0gPSBldmVudC50YXJnZXQudmFsdWU7XG5cblx0XHR0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcblx0fSxcblx0XG5cdGhhbmRsZVN3aXRjaCAoa2V5LCBldmVudCkge1xuXHRcdGxldCBuZXdTdGF0ZSA9IHt9O1xuXHRcdG5ld1N0YXRlW2tleV0gPSAhdGhpcy5zdGF0ZVtrZXldO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG5cdH0sXG5cdFxuXHRhbGVydCAobWVzc2FnZSkge1xuXHRcdGRpYWxvZ3MuYWxlcnQobWVzc2FnZSwgZnVuY3Rpb24oKSB7fSwgbnVsbClcblx0fSxcblx0XG5cdC8vIHVzZWQgZm9yIHRlc3Rpbmdcblx0cmVuZGVySW5wdXRUeXBlcyAoKSB7XG5cdFx0cmV0dXJuIEhUTUw1X0lOUFVUX1RZUEVTLm1hcCh0eXBlID0+IHtcblx0XHRcdHJldHVybiA8VUkuTGFiZWxJbnB1dCBrZXk9e3R5cGV9IHR5cGU9e3R5cGV9IGxhYmVsPXt0eXBlfSBwbGFjZWhvbGRlcj17dHlwZX0gLz47XG5cdFx0fSk7XG5cdH0sXG5cblx0c2hvd0RhdGVQaWNrZXIgKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RhdGVQaWNrZXI6IHRydWV9KTtcblx0fSxcblxuXHRoYW5kbGVEYXRlUGlja2VyQ2hhbmdlIChkKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGF0ZVBpY2tlcjogZmFsc2UsIGRhdGU6IGR9KTtcblx0fSxcblxuXHRmb3JtYXREYXRlIChkYXRlKSB7XG5cdFx0aWYgKGRhdGUpIHtcblx0XHRcdHJldHVybiBkYXRlLmdldEZ1bGxZZWFyKCkgKyAnLScgKyAoZGF0ZS5nZXRNb250aCgpICsgMSkgKyAnLScgKyBkYXRlLmdldERhdGUoKTtcblx0XHR9XG5cdH0sXG5cdFxuXHRyZW5kZXIgKCkge1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXIgZmlsbD5cblx0XHRcdFx0PENvbnRhaW5lciBzY3JvbGxhYmxlPXtzY3JvbGxhYmxlfT5cblx0XHRcdFx0XHR7Lyo8VUkuR3JvdXA+XG5cdFx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+SW5wdXQgVHlwZSBFeHBlcmltZW50PC9VSS5Hcm91cEhlYWRlcj5cblx0XHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHRcdHt0aGlzLnJlbmRlcklucHV0VHlwZXMoKX1cblx0XHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdDwvVUkuR3JvdXA+Ki99XG5cdFx0XHRcdFx0PFVJLkdyb3VwPlxuXHRcdFx0XHRcdFx0PFVJLkdyb3VwSGVhZGVyPkNoZWNrYm94PC9VSS5Hcm91cEhlYWRlcj5cblx0XHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtPlxuXHRcdFx0XHRcdFx0XHRcdDxVSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8VUkuRmllbGRMYWJlbD5Td2l0Y2g8L1VJLkZpZWxkTGFiZWw+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8VUkuU3dpdGNoIG9uVGFwPXt0aGlzLmhhbmRsZVN3aXRjaC5iaW5kKHRoaXMsICdzd2l0Y2hWYWx1ZScpfSBvbj17dGhpcy5zdGF0ZS5zd2l0Y2hWYWx1ZX0gLz5cblx0XHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0XHQ8VUkuSXRlbT5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHRcdFx0PFVJLkZpZWxkTGFiZWw+RGlzYWJsZWQ8L1VJLkZpZWxkTGFiZWw+XG5cdFx0XHRcdFx0XHRcdFx0XHQ8VUkuU3dpdGNoIGRpc2FibGVkIC8+XG5cdFx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdDwvVUkuSXRlbT5cblx0XHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdFx0PFVJLkdyb3VwPlxuXHRcdFx0XHRcdFx0PFVJLkdyb3VwSGVhZGVyPlJhZGlvPC9VSS5Hcm91cEhlYWRlcj5cblx0XHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHRcdDxVSS5SYWRpb0xpc3QgdmFsdWU9e3RoaXMuc3RhdGUuZmxhdm91clJhZGlvTGlzdH0gb25DaGFuZ2U9e3RoaXMuaGFuZGxlUmFkaW9MaXN0Q2hhbmdlLmJpbmQodGhpcywgJ2ZsYXZvdXJSYWRpb0xpc3QnKX0gb3B0aW9ucz17RkxBVk9VUlN9IC8+XG5cdFx0XHRcdFx0XHQ8L1VJLkdyb3VwQm9keT5cblx0XHRcdFx0XHQ8L1VJLkdyb3VwPlxuXHRcdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHRcdDxVSS5Hcm91cEhlYWRlcj5JbnB1dHM8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdFx0PFVJLkdyb3VwQm9keT5cblx0XHRcdFx0XHRcdFx0PFVJLklucHV0IHBsYWNlaG9sZGVyPVwiRGVmYXVsdFwiIC8+XG5cdFx0XHRcdFx0XHRcdDxVSS5JbnB1dCBkZWZhdWx0VmFsdWU9XCJXaXRoIFZhbHVlXCIgcGxhY2Vob2xkZXI9XCJQbGFjZWhvbGRlclwiIC8+XG5cdFx0XHRcdFx0XHRcdDxVSS5UZXh0YXJlYSBkZWZhdWx0VmFsdWU9XCJMb25ndGV4dCBpcyBnb29kIGZvciBiaW9zIGV0Yy5cIiBwbGFjZWhvbGRlcj1cIkxvbmd0ZXh0XCIgLz5cblx0XHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdFx0PFVJLkdyb3VwPlxuXHRcdFx0XHRcdFx0PFVJLkdyb3VwSGVhZGVyPkxhYmVsbGVkIElucHV0czwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0XHQ8VUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCB0eXBlPVwiZW1haWxcIiBsYWJlbD1cIkVtYWlsXCIgICBwbGFjZWhvbGRlcj1cInlvdXIubmFtZUBleGFtcGxlLmNvbVwiIC8+XG5cdFx0XHRcdFx0XHRcdDxUYXBwYWJsZSBjb21wb25lbnQ9XCJsYWJlbFwiIG9uVGFwPXt0aGlzLnNob3dEYXRlUGlja2VyfT5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuTGFiZWxWYWx1ZSBsYWJlbD1cIkRhdGVcIiB2YWx1ZT17dGhpcy5mb3JtYXREYXRlKHRoaXMuc3RhdGUuZGF0ZSl9IHBsYWNlaG9sZGVyPVwiU2VsZWN0IGEgZGF0ZVwiIC8+XG5cdFx0XHRcdFx0XHRcdDwvVGFwcGFibGU+XG5cdFx0XHRcdFx0XHRcdDxVSS5MYWJlbElucHV0IHR5cGU9XCJ1cmxcIiAgIGxhYmVsPVwiVVJMXCIgICAgIHBsYWNlaG9sZGVyPVwiaHR0cDovL3d3dy55b3Vyd2Vic2l0ZS5jb21cIiAvPlxuXHRcdFx0XHRcdFx0XHQ8VUkuTGFiZWxJbnB1dCBub2VkaXQgICAgICAgbGFiZWw9XCJObyBFZGl0XCIgZGVmYXVsdFZhbHVlPVwiVW4tZWRpdGFibGUsIHNjcm9sbGFibGUsIHNlbGVjdGFibGUgY29udGVudFwiIC8+XG5cdFx0XHRcdFx0XHRcdDxVSS5MYWJlbFNlbGVjdCBsYWJlbD1cIkZsYXZvdXJcIiB2YWx1ZT17dGhpcy5zdGF0ZS5mbGF2b3VyTGFiZWxTZWxlY3R9IG9uQ2hhbmdlPXt0aGlzLmhhbmRsZUxhYmVsU2VsZWN0Q2hhbmdlLmJpbmQodGhpcywgJ2ZsYXZvdXJMYWJlbFNlbGVjdCcpfSBvcHRpb25zPXtGTEFWT1VSU30gLz5cblx0XHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdFx0PFVJLkJ1dHRvbiB0eXBlPVwicHJpbWFyeVwiIG9uVGFwPXt0aGlzLmFsZXJ0LmJpbmQodGhpcywgJ1lvdSBjbGlja2VkIHRoZSBQcmltYXJ5IEJ1dHRvbicpfT5cblx0XHRcdFx0XHRcdFByaW1hcnkgQnV0dG9uXG5cdFx0XHRcdFx0PC9VSS5CdXR0b24+XG5cdFx0XHRcdFx0PFVJLkJ1dHRvbiBvblRhcD17dGhpcy5hbGVydC5iaW5kKHRoaXMsICdZb3UgY2xpY2tlZCB0aGUgRGVmYXVsdCBCdXR0b24nKX0+XG5cdFx0XHRcdFx0XHREZWZhdWx0IEJ1dHRvblxuXHRcdFx0XHRcdDwvVUkuQnV0dG9uPlxuXHRcdFx0XHRcdDxVSS5CdXR0b24gdHlwZT1cImRhbmdlclwiIG9uVGFwPXt0aGlzLmFsZXJ0LmJpbmQodGhpcywgJ1lvdSBjbGlja2VkIHRoZSBEYW5nZXIgQnV0dG9uJyl9PlxuXHRcdFx0XHRcdFx0RGFuZ2VyIEJ1dHRvblxuXHRcdFx0XHRcdDwvVUkuQnV0dG9uPlxuXHRcdFx0XHRcdDxVSS5CdXR0b24gdHlwZT1cImRhbmdlclwiIG9uVGFwPXt0aGlzLmFsZXJ0LmJpbmQodGhpcywgJ1lvdSBjbGlja2VkIHRoZSBEYW5nZXIgQnV0dG9uJyl9IGRpc2FibGVkPlxuXHRcdFx0XHRcdFx0RGlzYWJsZWQgQnV0dG9uXG5cdFx0XHRcdFx0PC9VSS5CdXR0b24+XG5cdFx0XHRcdDwvQ29udGFpbmVyPlxuXHRcdFx0XHQ8VUkuRGF0ZVBpY2tlclBvcHVwIHZpc2libGU9e3RoaXMuc3RhdGUuZGF0ZVBpY2tlcn0gZGF0ZT17dGhpcy5zdGF0ZS5kYXRlfSBvbkNoYW5nZT17dGhpcy5oYW5kbGVEYXRlUGlja2VyQ2hhbmdlfS8+XG5cdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHQpO1xuXHR9XG59KTtcbiIsImltcG9ydCBDb250YWluZXIgZnJvbSAncmVhY3QtY29udGFpbmVyJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgU2VudHJ5IGZyb20gJ3JlYWN0LXNlbnRyeSc7XG5pbXBvcnQgVGFwcGFibGUgZnJvbSAncmVhY3QtdGFwcGFibGUnO1xuaW1wb3J0IHsgTGluaywgVUkgfSBmcm9tICd0b3VjaHN0b25lanMnO1xuXG52YXIgc2Nyb2xsYWJsZSA9IENvbnRhaW5lci5pbml0U2Nyb2xsYWJsZSgpO1xuXG52YXIgQ29tcGxleExpbmtJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb250ZXh0VHlwZXM6IHsgcGVvcGxlU3RvcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCB9LFxuXG5cdHRvZ2dsZVN0YXIgKCkge1xuXHRcdGxldCBwZXJzb24gPSB0aGlzLnByb3BzLnBlcnNvblxuXG5cdFx0dGhpcy5jb250ZXh0LnBlb3BsZVN0b3JlLnN0YXIocGVyc29uLCAhcGVyc29uLmlzU3RhcnJlZClcblx0fSxcblxuXHRyZW5kZXIgKCkge1xuXHRcdGxldCBwZXJzb24gPSB0aGlzLnByb3BzLnBlcnNvbjtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8TGluayB0bz1cInRhYnM6bGlzdC1kZXRhaWxzXCIgdHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIHZpZXdQcm9wcz17eyBwZXJzb246IHBlcnNvbiwgcHJldlZpZXc6ICdsaXN0LWNvbXBsZXgnIH19PlxuXHRcdFx0XHQ8VUkuSXRlbT5cblx0XHRcdFx0XHQ8VUkuSXRlbU1lZGlhIGF2YXRhcj17cGVyc29uLnBpY3R1cmV9IGF2YXRhckluaXRpYWxzPXtwZXJzb24uaW5pdGlhbHN9IC8+XG5cdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdDxVSS5JdGVtQ29udGVudD5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1UaXRsZT57cGVyc29uLm5hbWUuZnVsbH08L1VJLkl0ZW1UaXRsZT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1TdWJUaXRsZT57cGVyc29uLmVtYWlsIHx8ICcnfTwvVUkuSXRlbVN1YlRpdGxlPlxuXHRcdFx0XHRcdFx0PC9VSS5JdGVtQ29udGVudD5cblx0XHRcdFx0XHRcdDxUYXBwYWJsZSBvblRhcD17dGhpcy50b2dnbGVTdGFyfSBzdG9wUHJvcGFnYXRpb24+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtTm90ZSBpY29uPXtwZXJzb24uaXNTdGFycmVkID8gJ2lvbi1pb3Mtc3RhcicgOiAnaW9uLWlvcy1zdGFyLW91dGxpbmUnfSB0eXBlPXtwZXJzb24uaXNTdGFycmVkID8gJ3dhcm5pbmcnIDogJ2RlZmF1bHQnfSBjbGFzc05hbWU9XCJpb24tbGdcIiAvPlxuXHRcdFx0XHRcdFx0PC9UYXBwYWJsZT5cblx0XHRcdFx0XHQ8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0PC9MaW5rPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vLyBGSVhNRTogdGhpcyBiaXQgaXMgZ2xvYmFsIGFuZCBoYWNreSwgZXhwZWN0IGl0IHRvIGNoYW5nZVxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBlbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG5mdW5jdGlvbiBnZXROYXZpZ2F0aW9uIChwcm9wcywgYXBwLCBmaWx0ZXJTdGFycmVkKSB7XG5cdHJldHVybiB7XG5cdFx0bGVmdExhYmVsOiAnTGlzdHMnLFxuXHRcdGxlZnRBcnJvdzogdHJ1ZSxcblx0XHRsZWZ0QWN0aW9uOiAoKSA9PiB7IGFwcC50cmFuc2l0aW9uVG8oJ3RhYnM6bGlzdHMnLCB7IHRyYW5zaXRpb246ICdyZXZlYWwtZnJvbS1yaWdodCcgfSkgfSxcblx0XHRyaWdodExhYmVsOiBmaWx0ZXJTdGFycmVkID8gJ0FsbCcgOiAnU3RhcnJlZCcsXG5cdFx0cmlnaHRBY3Rpb246IGVtaXR0ZXIuZW1pdC5iaW5kKGVtaXR0ZXIsICduYXZpZ2F0aW9uQmFyUmlnaHRBY3Rpb24nKSxcblx0XHR0aXRsZTogJ0NvbXBsZXgnXG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb250ZXh0VHlwZXM6IHtcblx0XHRhcHA6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsXG5cdFx0cGVvcGxlU3RvcmU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZFxuXHR9LFxuXHRtaXhpbnM6IFtTZW50cnldLFxuXG5cdHN0YXRpY3M6IHtcblx0XHRuYXZpZ2F0aW9uQmFyOiAnbWFpbicsXG5cdFx0Z2V0TmF2aWdhdGlvbjogZ2V0TmF2aWdhdGlvblxuXHR9LFxuXG5cdGdldEluaXRpYWxTdGF0ZSAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGZpbHRlclN0YXJyZWQ6IGZhbHNlLFxuXHRcdFx0cGVvcGxlOiB0aGlzLmNvbnRleHQucGVvcGxlU3RvcmUuZ2V0UGVvcGxlKClcblx0XHR9XG5cdH0sXG5cblx0Y29tcG9uZW50RGlkTW91bnQgKCkge1xuXHRcdHRoaXMud2F0Y2godGhpcy5jb250ZXh0LnBlb3BsZVN0b3JlLCAncGVvcGxlLXVwZGF0ZWQnLCBwZW9wbGUgPT4ge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7IHBlb3BsZSB9KVxuXHRcdH0pXG5cblx0XHR0aGlzLndhdGNoKGVtaXR0ZXIsICduYXZpZ2F0aW9uQmFyUmlnaHRBY3Rpb24nLCB0aGlzLnRvZ2dsZVN0YXJyZWQpO1xuXHR9LFxuXG5cdHRvZ2dsZVN0YXJyZWQgKCkge1xuXHRcdGxldCBmaWx0ZXJTdGFycmVkID0gIXRoaXMuc3RhdGUuZmlsdGVyU3RhcnJlZDtcblx0XHR0aGlzLnNldFN0YXRlKHsgZmlsdGVyU3RhcnJlZCB9KTtcblx0XHR0aGlzLmNvbnRleHQuYXBwLm5hdmlnYXRpb25CYXJzLm1haW4udXBkYXRlKGdldE5hdmlnYXRpb24oe30sIHRoaXMuY29udGV4dC5hcHAsIGZpbHRlclN0YXJyZWQpKTtcblx0fSxcblxuXHRoYW5kbGVNb2RlQ2hhbmdlIChuZXdNb2RlKSB7XG5cdFx0bGV0IHNlbGVjdGVkTW9kZSA9IG5ld01vZGU7XG5cblx0XHRpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZE1vZGUgPT09IG5ld01vZGUpIHtcblx0XHRcdHNlbGVjdGVkTW9kZSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7IHNlbGVjdGVkTW9kZSB9KVxuXHR9LFxuXG5cdHJlbmRlciAoKSB7XG5cdFx0bGV0IHsgcGVvcGxlLCBmaWx0ZXJTdGFycmVkLCBzZWxlY3RlZE1vZGUgfSA9IHRoaXMuc3RhdGVcblxuXHRcdGlmIChmaWx0ZXJTdGFycmVkKSB7XG5cdFx0XHRwZW9wbGUgPSBwZW9wbGUuZmlsdGVyKHBlcnNvbiA9PiBwZXJzb24uaXNTdGFycmVkKVxuXHRcdH1cblxuXHRcdGlmIChzZWxlY3RlZE1vZGUgPT09ICdBJyB8fCBzZWxlY3RlZE1vZGUgPT09ICdCJykge1xuXHRcdFx0cGVvcGxlID0gcGVvcGxlLmZpbHRlcihwZXJzb24gPT4gcGVyc29uLmNhdGVnb3J5ID09PSBzZWxlY3RlZE1vZGUpXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gc29ydEJ5TmFtZSAoYSwgYikgeyByZXR1cm4gYS5uYW1lLmZ1bGwubG9jYWxlQ29tcGFyZShiLm5hbWUuZnVsbCkgfVxuXG5cdFx0bGV0IHNvcnRlZFBlb3BsZSA9IHBlb3BsZS5zb3J0KHNvcnRCeU5hbWUpXG5cdFx0bGV0IHJlc3VsdHNcblxuXHRcdGlmIChzb3J0ZWRQZW9wbGUubGVuZ3RoKSB7XG5cdFx0XHRsZXQgYVBlb3BsZSA9IHNvcnRlZFBlb3BsZVxuXHRcdFx0XHQuZmlsdGVyKHBlcnNvbiA9PiBwZXJzb24uY2F0ZWdvcnkgPT09ICdBJylcblx0XHRcdFx0Lm1hcCgocGVyc29uLCBpKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIDxDb21wbGV4TGlua0l0ZW0ga2V5PXsncGVyc29uYScgKyBpfSBwZXJzb249e3BlcnNvbn0gLz5cblx0XHRcdFx0fSlcblxuXHRcdFx0bGV0IGJQZW9wbGUgPSBzb3J0ZWRQZW9wbGVcblx0XHRcdFx0LmZpbHRlcihwZXJzb24gPT4gcGVyc29uLmNhdGVnb3J5ID09PSAnQicpXG5cdFx0XHRcdC5tYXAoKHBlcnNvbiwgaSkgPT4ge1xuXHRcdFx0XHRcdHJldHVybiA8Q29tcGxleExpbmtJdGVtIGtleT17J3BlcnNvbmInICsgaX0gcGVyc29uPXtwZXJzb259IC8+XG5cdFx0XHRcdH0pXG5cblx0XHRcdHJlc3VsdHMgPSAoXG5cdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0e2FQZW9wbGUubGVuZ3RoID4gMCA/IDxVSS5MaXN0SGVhZGVyIHN0aWNreT5DYXRlZ29yeSBBPC9VSS5MaXN0SGVhZGVyPiA6ICcnfVxuXHRcdFx0XHRcdHthUGVvcGxlfVxuXHRcdFx0XHRcdHtiUGVvcGxlLmxlbmd0aCA+IDAgPyA8VUkuTGlzdEhlYWRlciBzdGlja3k+Q2F0ZWdvcnkgQjwvVUkuTGlzdEhlYWRlcj4gOiAnJ31cblx0XHRcdFx0XHR7YlBlb3BsZX1cblx0XHRcdFx0PC9VSS5Hcm91cEJvZHk+XG5cdFx0XHQpXG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0cyA9IChcblx0XHRcdFx0PENvbnRhaW5lciBkaXJlY3Rpb249XCJjb2x1bW5cIiBhbGlnbj1cImNlbnRlclwiIGp1c3RpZnk9XCJjZW50ZXJcIiBjbGFzc05hbWU9XCJuby1yZXN1bHRzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJuby1yZXN1bHRzX19pY29uIGlvbi1pb3Mtc3RhclwiIC8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJuby1yZXN1bHRzX190ZXh0XCI+R28gc3RhciBzb21lIHBlb3BsZSE8L2Rpdj5cblx0XHRcdFx0PC9Db250YWluZXI+XG5cdFx0XHQpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXIgc2Nyb2xsYWJsZT17c2Nyb2xsYWJsZX0+XG5cdFx0XHRcdDxVSS5TZWdtZW50ZWRDb250cm9sIHZhbHVlPXt0aGlzLnN0YXRlLnNlbGVjdGVkTW9kZX0gb25DaGFuZ2U9e3RoaXMuaGFuZGxlTW9kZUNoYW5nZX0gaGFzR3V0dGVyIGVxdWFsV2lkdGhTZWdtZW50cyBvcHRpb25zPXtbXG5cdFx0XHRcdFx0eyBsYWJlbDogJ0EnLCB2YWx1ZTogJ0EnIH0sXG5cdFx0XHRcdFx0eyBsYWJlbDogJ0InLCB2YWx1ZTogJ0InIH1cblx0XHRcdFx0XX0gLz5cblx0XHRcdFx0e3Jlc3VsdHN9XG5cdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHQpO1xuXHR9XG59KTtcbiIsImltcG9ydCBDb250YWluZXIgZnJvbSAncmVhY3QtY29udGFpbmVyJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRzdGF0aWNzOiB7XG5cdFx0bmF2aWdhdGlvbkJhcjogJ21haW4nLFxuXHRcdGdldE5hdmlnYXRpb24gKHByb3BzLCBhcHApIHtcblx0XHRcdHZhciBsZWZ0TGFiZWwgPSBwcm9wcy5wcmV2VmlldyA9PT0gJ2xpc3Qtc2ltcGxlJyA/ICdTaW1wbGUnIDogJ0NvbXBsZXgnO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bGVmdEFycm93OiB0cnVlLFxuXHRcdFx0XHRsZWZ0TGFiZWw6IGxlZnRMYWJlbCxcblx0XHRcdFx0bGVmdEFjdGlvbjogKCkgPT4geyBhcHAudHJhbnNpdGlvblRvKCd0YWJzOicgKyBwcm9wcy5wcmV2VmlldywgeyB0cmFuc2l0aW9uOiAncmV2ZWFsLWZyb20tcmlnaHQnIH0pIH0sXG5cdFx0XHRcdHRpdGxlOiAnUGVyc29uJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0Z2V0RGVmYXVsdFByb3BzICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cHJldlZpZXc6ICdob21lJ1xuXHRcdH1cblx0fSxcblx0cmVuZGVyICgpIHtcblx0XHR2YXIgeyBwZXJzb24gfSA9IHRoaXMucHJvcHM7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PENvbnRhaW5lciBkaXJlY3Rpb249XCJjb2x1bW5cIj5cblx0XHRcdFx0PENvbnRhaW5lciBmaWxsIHNjcm9sbGFibGUgcmVmPVwic2Nyb2xsQ29udGFpbmVyXCIgY2xhc3NOYW1lPVwiUGVyc29uRGV0YWlsc1wiPlxuXHRcdFx0XHRcdDxpbWcgc3JjPXtwZXJzb24ucGljdHVyZX0gY2xhc3NOYW1lPVwiUGVyc29uRGV0YWlsc19fYXZhdGFyXCIgLz5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIlBlcnNvbkRldGFpbHNfX2hlYWRpbmdcIj57cGVyc29uLm5hbWUuZnVsbH08L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIlBlcnNvbkRldGFpbHNfX3RleHQgdGV4dC1ibG9ja1wiPntwZXJzb24uZW1haWwgfHwgJyd9PC9kaXY+XG5cdFx0XHRcdFx0eyhwZXJzb24udHdpdHRlciB8fCBwZXJzb24uZ2l0aHViKSAmJiA8ZGl2IGNsYXNzTmFtZT1cIlBlcnNvbkRldGFpbHNfX3Byb2ZpbGVzXCI+XG5cdFx0XHRcdFx0XHR7cGVyc29uLnR3aXR0ZXIgJiYgPGRpdiBjbGFzc05hbWU9XCJQZXJzb25EZXRhaWxzX19wcm9maWxlXCI+XG5cdFx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIlBlcnNvbkRldGFpbHNfX3Byb2ZpbGVfX2ljb24gaW9uLXNvY2lhbC10d2l0dGVyXCIgLz5cblx0XHRcdFx0XHRcdFx0e3BlcnNvbi50d2l0dGVyfVxuXHRcdFx0XHRcdFx0PC9kaXY+fVxuXHRcdFx0XHRcdFx0e3BlcnNvbi5naXRodWIgJiYgPGRpdiBjbGFzc05hbWU9XCJQZXJzb25EZXRhaWxzX19wcm9maWxlXCI+XG5cdFx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIlBlcnNvbkRldGFpbHNfX3Byb2ZpbGVfX2ljb24gaW9uLXNvY2lhbC1naXRodWJcIiAvPlxuXHRcdFx0XHRcdFx0XHR7cGVyc29uLmdpdGh1Yn1cblx0XHRcdFx0XHRcdDwvZGl2Pn1cblx0XHRcdFx0XHQ8L2Rpdj59XG5cdFx0XHRcdDwvQ29udGFpbmVyPlxuXHRcdFx0PC9Db250YWluZXI+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgQ29udGFpbmVyIGZyb20gJ3JlYWN0LWNvbnRhaW5lcic7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFNlbnRyeSBmcm9tICdyZWFjdC1zZW50cnknO1xuaW1wb3J0IFRhcHBhYmxlIGZyb20gJ3JlYWN0LXRhcHBhYmxlJztcbmltcG9ydCB7IExpbmssIFVJIH0gZnJvbSAndG91Y2hzdG9uZWpzJztcblxudmFyIHNjcm9sbGFibGUgPSBDb250YWluZXIuaW5pdFNjcm9sbGFibGUoeyBsZWZ0OiAwLCB0b3A6IDQ0IH0pO1xuXG52YXIgU2ltcGxlTGlua0l0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHByb3BUeXBlczoge1xuXHRcdHBlcnNvbjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkXG5cdH0sXG5cblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PExpbmsgdG89XCJ0YWJzOmxpc3QtZGV0YWlsc1wiIHRyYW5zaXRpb249XCJzaG93LWZyb20tcmlnaHRcIiB2aWV3UHJvcHM9e3sgcGVyc29uOiB0aGlzLnByb3BzLnBlcnNvbiwgcHJldlZpZXc6ICdsaXN0LXNpbXBsZScgfX0+XG5cdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdDxVSS5JdGVtVGl0bGU+e3RoaXMucHJvcHMucGVyc29uLm5hbWUuZnVsbH08L1VJLkl0ZW1UaXRsZT5cblx0XHRcdFx0XHQ8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0PC9MaW5rPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbU2VudHJ5XSxcblx0Y29udGV4dFR5cGVzOiB7IHBlb3BsZVN0b3JlOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQgfSxcblxuXHRzdGF0aWNzOiB7XG5cdFx0bmF2aWdhdGlvbkJhcjogJ21haW4nLFxuXHRcdGdldE5hdmlnYXRpb24gKHByb3BzLCBhcHApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGxlZnRBcnJvdzogdHJ1ZSxcblx0XHRcdFx0bGVmdExhYmVsOiAnTGlzdHMnLFxuXHRcdFx0XHRsZWZ0QWN0aW9uOiAoKSA9PiB7IGFwcC50cmFuc2l0aW9uVG8oJ3RhYnM6bGlzdHMnLCB7IHRyYW5zaXRpb246ICdyZXZlYWwtZnJvbS1yaWdodCcgfSkgfSxcblx0XHRcdFx0dGl0bGU6ICdTaW1wbGUnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50ICgpIHtcblx0XHR0aGlzLndhdGNoKHRoaXMuY29udGV4dC5wZW9wbGVTdG9yZSwgJ3Blb3BsZS11cGRhdGVkJywgcGVvcGxlID0+IHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoeyBwZW9wbGUgfSlcblx0XHR9KTtcblx0fSxcblxuXHRnZXRJbml0aWFsU3RhdGUgKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWFyY2hTdHJpbmc6ICcnLFxuXHRcdFx0cGVvcGxlOiB0aGlzLmNvbnRleHQucGVvcGxlU3RvcmUuZ2V0UGVvcGxlKClcblx0XHR9XG5cdH0sXG5cblx0Y2xlYXJTZWFyY2ggKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBzZWFyY2hTdHJpbmc6ICcnIH0pO1xuXHR9LFxuXG5cdHVwZGF0ZVNlYXJjaCAoc3RyKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7IHNlYXJjaFN0cmluZzogc3RyIH0pO1xuXHR9LFxuXHRcblx0c3VibWl0U2VhcmNoIChzdHIpIHtcblx0XHRjb25zb2xlLmxvZyhzdHIpO1xuXHR9LFxuXG5cdHJlbmRlciAoKSB7XG5cdFx0bGV0IHsgcGVvcGxlLCBzZWFyY2hTdHJpbmcgfSA9IHRoaXMuc3RhdGVcblx0XHRsZXQgc2VhcmNoUmVnZXggPSBuZXcgUmVnRXhwKHNlYXJjaFN0cmluZylcblxuXHRcdGZ1bmN0aW9uIHNlYXJjaEZpbHRlciAocGVyc29uKSB7IHJldHVybiBzZWFyY2hSZWdleC50ZXN0KHBlcnNvbi5uYW1lLmZ1bGwudG9Mb3dlckNhc2UoKSkgfTtcblx0XHRmdW5jdGlvbiBzb3J0QnlOYW1lIChhLCBiKSB7IHJldHVybiBhLm5hbWUuZnVsbC5sb2NhbGVDb21wYXJlKGIubmFtZS5mdWxsKSB9O1xuXHRcdFxuXHRcdGxldCBmaWx0ZXJlZFBlb3BsZSA9IHBlb3BsZS5maWx0ZXIoc2VhcmNoRmlsdGVyKS5zb3J0KHNvcnRCeU5hbWUpO1xuXG5cdFx0bGV0IHJlc3VsdHNcblxuXHRcdGlmIChzZWFyY2hTdHJpbmcgJiYgIWZpbHRlcmVkUGVvcGxlLmxlbmd0aCkge1xuXHRcdFx0cmVzdWx0cyA9IChcblx0XHRcdFx0PENvbnRhaW5lciBkaXJlY3Rpb249XCJjb2x1bW5cIiBhbGlnbj1cImNlbnRlclwiIGp1c3RpZnk9XCJjZW50ZXJcIiBjbGFzc05hbWU9XCJuby1yZXN1bHRzXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJuby1yZXN1bHRzX19pY29uIGlvbi1pb3Mtc2VhcmNoLXN0cm9uZ1wiIC8+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJuby1yZXN1bHRzX190ZXh0XCI+eydObyByZXN1bHRzIGZvciBcIicgKyBzZWFyY2hTdHJpbmcgKyAnXCInfTwvZGl2PlxuXHRcdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHRcdCk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0cyA9IChcblx0XHRcdFx0PFVJLkdyb3VwQm9keT5cblx0XHRcdFx0XHR7ZmlsdGVyZWRQZW9wbGUubWFwKChwZXJzb24sIGkpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiA8U2ltcGxlTGlua0l0ZW0ga2V5PXsncGVyc29uJyArIGl9IHBlcnNvbj17cGVyc29ufSAvPlxuXHRcdFx0XHRcdH0pfVxuXHRcdFx0XHQ8L1VJLkdyb3VwQm9keT5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXIgcmVmPVwic2Nyb2xsQ29udGFpbmVyXCIgc2Nyb2xsYWJsZT17c2Nyb2xsYWJsZX0+XG5cdFx0XHRcdDxVSS5TZWFyY2hGaWVsZCB0eXBlPVwiZGFya1wiIHZhbHVlPXt0aGlzLnN0YXRlLnNlYXJjaFN0cmluZ30gb25TdWJtaXQ9e3RoaXMuc3VibWl0U2VhcmNofSBvbkNoYW5nZT17dGhpcy51cGRhdGVTZWFyY2h9IG9uQ2FuY2VsPXt0aGlzLmNsZWFyU2VhcmNofSBvbkNsZWFyPXt0aGlzLmNsZWFyU2VhcmNofSBwbGFjZWhvbGRlcj1cIlNlYXJjaC4uLlwiIC8+XG5cdFx0XHRcdHtyZXN1bHRzfVxuXHRcdFx0PC9Db250YWluZXI+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgQ29udGFpbmVyIGZyb20gJ3JlYWN0LWNvbnRhaW5lcic7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgTGluaywgVUkgfSBmcm9tICd0b3VjaHN0b25lanMnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0c3RhdGljczoge1xuXHRcdG5hdmlnYXRpb25CYXI6ICdtYWluJyxcblx0XHRnZXROYXZpZ2F0aW9uICgpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRpdGxlOiAnTGlzdHMnXG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8Q29udGFpbmVyIHNjcm9sbGFibGU+XG5cdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+TGlzdHM8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRhYnM6bGlzdC1zaW1wbGVcIiB0cmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCI+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0XHRcdFNpbXBsZSBMaXN0XG5cdFx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdDwvVUkuSXRlbT5cblx0XHRcdFx0XHRcdDwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidGFiczpsaXN0LWNvbXBsZXhcIiB0cmFuc2l0aW9uPVwic2hvdy1mcm9tLXJpZ2h0XCI+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0XHRcdENvbXBsZXggTGlzdFxuXHRcdFx0XHRcdFx0XHRcdDwvVUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW0+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0PC9VSS5Hcm91cEJvZHk+XG5cdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+R3JvdXBIZWFkZXI8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHQ8VUkuR3JvdXBJbm5lcj5cblx0XHRcdFx0XHRcdFx0PHA+VXNlIGdyb3VwcyB0byBjb250YWluIGNvbnRlbnQgb3IgbGlzdHMuIFdoZXJlIGFwcHJvcHJpYXRlIGEgR3JvdXAgc2hvdWxkIGJlIGFjY29tcGFuaWVkIGJ5IGEgR3JvdXBIZWFkaW5nIGFuZCBvcHRpb25hbGx5IGEgR3JvdXBGb290ZXIuPC9wPlxuXHRcdFx0XHRcdFx0XHRHcm91cEJvZHkgd2lsbCBhcHBseSB0aGUgYmFja2dyb3VuZCBmb3IgY29udGVudCBpbnNpZGUgZ3JvdXBzLlxuXHRcdFx0XHRcdFx0PC9VSS5Hcm91cElubmVyPlxuXHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHRcdDxVSS5Hcm91cEZvb3Rlcj5Hcm91cEZvb3RlcjogdXNlZnVsIGZvciBhIGRldGFpbGVkIGV4cGxhbmF0aW9uIHRvIGV4cHJlc3MgdGhlIGludGVudGlvbnMgb2YgdGhlIEdyb3VwLiBUcnkgdG8gYmUgY29uY2lzZSAtIHJlbWVtYmVyIHRoYXQgdXNlcnMgYXJlIGxpa2VseSB0byByZWFkIHRoZSB0ZXh0IGluIHlvdXIgVUkgbWFueSB0aW1lcy48L1VJLkdyb3VwRm9vdGVyPlxuXHRcdFx0XHQ8L1VJLkdyb3VwPlxuXHRcdFx0PC9Db250YWluZXI+XG5cdFx0KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgQ29udGFpbmVyIGZyb20gJ3JlYWN0LWNvbnRhaW5lcic7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFRpbWVycyBmcm9tICdyZWFjdC10aW1lcnMnO1xuaW1wb3J0IHsgTWl4aW5zLCBVSSB9IGZyb20gJ3RvdWNoc3RvbmVqcyc7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRtaXhpbnM6IFtNaXhpbnMuVHJhbnNpdGlvbnMsIFRpbWVyc10sXG5cdGNvbXBvbmVudERpZE1vdW50ICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYudHJhbnNpdGlvblRvKCdhcHA6bWFpbicsIHsgdHJhbnNpdGlvbjogJ2ZhZGUnIH0pO1xuXHRcdH0sIDEwMDApO1xuXHR9LFxuXHRyZW5kZXIgKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8Q29udGFpbmVyIGRpcmVjdGlvbj1cImNvbHVtblwiPlxuXHRcdFx0XHQ8VUkuTmF2aWdhdGlvbkJhciBuYW1lPVwib3ZlclwiIHRpdGxlPXt0aGlzLnByb3BzLm5hdmJhclRpdGxlfSAvPlxuXHRcdFx0XHQ8Q29udGFpbmVyIGRpcmVjdGlvbj1cImNvbHVtblwiIGFsaWduPVwiY2VudGVyXCIganVzdGlmeT1cImNlbnRlclwiIGNsYXNzTmFtZT1cIm5vLXJlc3VsdHNcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIm5vLXJlc3VsdHNfX2ljb24gaW9uLWlvcy1waG90b3NcIiAvPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibm8tcmVzdWx0c19fdGV4dFwiPkhvbGQgb24gYSBzZWMuLi48L2Rpdj5cblx0XHRcdFx0PC9Db250YWluZXI+XG5cdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHQpO1xuXHR9XG59KTtcbiIsImltcG9ydCBDb250YWluZXIgZnJvbSAncmVhY3QtY29udGFpbmVyJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgVGltZXJzIGZyb20gJ3JlYWN0LXRpbWVycyc7XG5pbXBvcnQgeyBNaXhpbnMgfSBmcm9tICd0b3VjaHN0b25lanMnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bWl4aW5zOiBbTWl4aW5zLlRyYW5zaXRpb25zLCBUaW1lcnNdLFxuXHRzdGF0aWNzOiB7XG5cdFx0bmF2aWdhdGlvbkJhcjogJ21haW4nLFxuXHRcdGdldE5hdmlnYXRpb24gKHByb3BzKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0aXRsZTogcHJvcHMubmF2YmFyVGl0bGVcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50ICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi50cmFuc2l0aW9uVG8oJ3RhYnM6dHJhbnNpdGlvbnMnLCB7IHRyYW5zaXRpb246ICdmYWRlJyB9KTtcblx0XHR9LCAxMDAwKTtcblx0fSxcblx0cmVuZGVyICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PENvbnRhaW5lciBkaXJlY3Rpb249XCJjb2x1bW5cIiBhbGlnbj1cImNlbnRlclwiIGp1c3RpZnk9XCJjZW50ZXJcIiBjbGFzc05hbWU9XCJuby1yZXN1bHRzXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibm8tcmVzdWx0c19faWNvbiBpb24taW9zLXBob3Rvc1wiIC8+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwibm8tcmVzdWx0c19fdGV4dFwiPkhvbGQgb24gYSBzZWMuLi48L2Rpdj5cblx0XHRcdDwvQ29udGFpbmVyPlxuXHRcdCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IENvbnRhaW5lciBmcm9tICdyZWFjdC1jb250YWluZXInO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IExpbmssIFVJIH0gZnJvbSAndG91Y2hzdG9uZWpzJztcblxudmFyIHNjcm9sbGFibGUgPSBDb250YWluZXIuaW5pdFNjcm9sbGFibGUoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHN0YXRpY3M6IHtcblx0XHRuYXZpZ2F0aW9uQmFyOiAnbWFpbicsXG5cdFx0Z2V0TmF2aWdhdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0aXRsZTogJ1RyYW5zaXRpb25zJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cdHJlbmRlciAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxDb250YWluZXIgc2Nyb2xsYWJsZT17c2Nyb2xsYWJsZX0+XG5cdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+RGVmYXVsdDwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0PFVJLkdyb3VwQm9keT5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidGFiczp0cmFuc2l0aW9ucy10YXJnZXRcIiB2aWV3UHJvcHM9e3sgbmF2YmFyVGl0bGU6ICdJbnN0YW50JyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPkluc3RhbnQ8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdDwvVUkuR3JvdXBCb2R5PlxuXHRcdFx0XHQ8L1VJLkdyb3VwPlxuXHRcdFx0XHQ8VUkuR3JvdXA+XG5cdFx0XHRcdFx0PFVJLkdyb3VwSGVhZGVyPkZhZGU8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRhYnM6dHJhbnNpdGlvbnMtdGFyZ2V0XCIgdHJhbnNpdGlvbj1cImZhZGVcIiB2aWV3UHJvcHM9e3sgbmF2YmFyVGl0bGU6ICdGYWRlJyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPkZhZGU8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJ0YWJzOnRyYW5zaXRpb25zLXRhcmdldFwiIHRyYW5zaXRpb249XCJmYWRlLWV4cGFuZFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ0ZhZGUgRXhwYW5kJyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPjxzcGFuPkZhZGUgRXhwYW5kIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWRcIj4obm9uLXN0YW5kYXJkKTwvc3Bhbj48L3NwYW4+PC9VSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdDwvVUkuSXRlbT5cblx0XHRcdFx0XHRcdDwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidGFiczp0cmFuc2l0aW9ucy10YXJnZXRcIiB0cmFuc2l0aW9uPVwiZmFkZS1jb250cmFjdFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ0ZhZGUgQ29udHJhY3QnIH19PlxuXHRcdFx0XHRcdFx0XHQ8VUkuSXRlbSBzaG93RGlzY2xvc3VyZUFycm93PlxuXHRcdFx0XHRcdFx0XHRcdDxVSS5JdGVtSW5uZXI+PHNwYW4+RmFkZSBDb250cmFjdCA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkXCI+KG5vbi1zdGFuZGFyZCk8L3NwYW4+PC9zcGFuPjwvVUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW0+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0PC9VSS5Hcm91cEJvZHk+XG5cdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHRcdDxVSS5Hcm91cD5cblx0XHRcdFx0XHQ8VUkuR3JvdXBIZWFkZXI+U2hvdzwvVUkuR3JvdXBIZWFkZXI+XG5cdFx0XHRcdFx0PFVJLkdyb3VwQm9keT5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwidGFiczp0cmFuc2l0aW9ucy10YXJnZXRcIiB0cmFuc2l0aW9uPVwic2hvdy1mcm9tLWxlZnRcIiB2aWV3UHJvcHM9e3sgbmF2YmFyVGl0bGU6ICdTaG93IGZyb20gTGVmdCcgfX0+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj48c3Bhbj5TaG93IGZyb20gTGVmdCA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkXCI+KG5vbi1zdGFuZGFyZCk8L3NwYW4+PC9zcGFuPjwvVUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW0+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRhYnM6dHJhbnNpdGlvbnMtdGFyZ2V0XCIgdHJhbnNpdGlvbj1cInNob3ctZnJvbS1yaWdodFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ1Nob3cgZnJvbSBSaWdodCcgfX0+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5TaG93IGZyb20gUmlnaHQ8L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJhcHA6dHJhbnNpdGlvbnMtdGFyZ2V0LW92ZXJcIiB0cmFuc2l0aW9uPVwic2hvdy1mcm9tLXRvcFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ1Nob3cgZnJvbSBUb3AnIH19PlxuXHRcdFx0XHRcdFx0XHQ8VUkuSXRlbSBzaG93RGlzY2xvc3VyZUFycm93PlxuXHRcdFx0XHRcdFx0XHRcdDxVSS5JdGVtSW5uZXI+PHNwYW4+U2hvdyBmcm9tIFRvcCA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkXCI+KG5vbi1zdGFuZGFyZCk8L3NwYW4+PC9zcGFuPjwvVUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW0+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cImFwcDp0cmFuc2l0aW9ucy10YXJnZXQtb3ZlclwiIHRyYW5zaXRpb249XCJzaG93LWZyb20tYm90dG9tXCIgdmlld1Byb3BzPXt7IG5hdmJhclRpdGxlOiAnU2hvdyBmcm9tIEJvdHRvbScgfX0+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj5TaG93IGZyb20gQm90dG9tPC9VSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdDwvVUkuSXRlbT5cblx0XHRcdFx0XHRcdDwvTGluaz5cblx0XHRcdFx0XHQ8L1VJLkdyb3VwQm9keT5cblx0XHRcdFx0PC9VSS5Hcm91cD5cblx0XHRcdFx0PFVJLkdyb3VwPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEhlYWRlcj5SZXZlYWw8L1VJLkdyb3VwSGVhZGVyPlxuXHRcdFx0XHRcdDxVSS5Hcm91cEJvZHk+XG5cdFx0XHRcdFx0XHQ8TGluayB0bz1cInRhYnM6dHJhbnNpdGlvbnMtdGFyZ2V0XCIgdHJhbnNpdGlvbj1cInJldmVhbC1mcm9tLWxlZnRcIiB2aWV3UHJvcHM9e3sgbmF2YmFyVGl0bGU6ICdSZXZlYWwgZnJvbSBMZWZ0JyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPjxzcGFuPlJldmVhbCBmcm9tIExlZnQgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZFwiPihub24tc3RhbmRhcmQpPC9zcGFuPjwvc3Bhbj48L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJ0YWJzOnRyYW5zaXRpb25zLXRhcmdldFwiIHRyYW5zaXRpb249XCJyZXZlYWwtZnJvbS1yaWdodFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ1JldmVhbCBmcm9tIFJpZ2h0JyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPlJldmVhbCBmcm9tIFJpZ2h0PC9VSS5JdGVtSW5uZXI+XG5cdFx0XHRcdFx0XHRcdDwvVUkuSXRlbT5cblx0XHRcdFx0XHRcdDwvTGluaz5cblx0XHRcdFx0XHRcdDxMaW5rIHRvPVwiYXBwOnRyYW5zaXRpb25zLXRhcmdldC1vdmVyXCIgdHJhbnNpdGlvbj1cInJldmVhbC1mcm9tLXRvcFwiIHZpZXdQcm9wcz17eyBuYXZiYXJUaXRsZTogJ1JldmVhbCBmcm9tIFRvcCcgfX0+XG5cdFx0XHRcdFx0XHRcdDxVSS5JdGVtIHNob3dEaXNjbG9zdXJlQXJyb3c+XG5cdFx0XHRcdFx0XHRcdFx0PFVJLkl0ZW1Jbm5lcj48c3Bhbj5SZXZlYWwgZnJvbSBUb3AgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZFwiPihub24tc3RhbmRhcmQpPC9zcGFuPjwvc3Bhbj48L1VJLkl0ZW1Jbm5lcj5cblx0XHRcdFx0XHRcdFx0PC9VSS5JdGVtPlxuXHRcdFx0XHRcdFx0PC9MaW5rPlxuXHRcdFx0XHRcdFx0PExpbmsgdG89XCJhcHA6dHJhbnNpdGlvbnMtdGFyZ2V0LW92ZXJcIiB0cmFuc2l0aW9uPVwicmV2ZWFsLWZyb20tYm90dG9tXCIgdmlld1Byb3BzPXt7IG5hdmJhclRpdGxlOiAnUmV2ZWFsIGZyb20gQm90dG9tJyB9fT5cblx0XHRcdFx0XHRcdFx0PFVJLkl0ZW0gc2hvd0Rpc2Nsb3N1cmVBcnJvdz5cblx0XHRcdFx0XHRcdFx0XHQ8VUkuSXRlbUlubmVyPlJldmVhbCBmcm9tIEJvdHRvbTwvVUkuSXRlbUlubmVyPlxuXHRcdFx0XHRcdFx0XHQ8L1VJLkl0ZW0+XG5cdFx0XHRcdFx0XHQ8L0xpbms+XG5cdFx0XHRcdFx0PC9VSS5Hcm91cEJvZHk+XG5cdFx0XHRcdDwvVUkuR3JvdXA+XG5cdFx0XHQ8L0NvbnRhaW5lcj5cblx0XHQpO1xuXHR9XG59KTtcbiJdfQ==
