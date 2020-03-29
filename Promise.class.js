// 自定义Promise

(function () {

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    class Promise {
        constructor(excutor) {

            const _this = this;

            // 属性
            _this.status = PENDING
            _this.data = undefined
            _this.callbacks = []

            // resolve方法
            function resolve(value) {
                if (_this.status !== PENDING) return

                _this.status = RESOLVED
                _this.data = value

                if (_this.callbacks.length > 0) {
                    _this.callbacks.forEach((callbacksObj) => {
                        setTimeout(() => {
                            callbacksObj.onResolved(value)
                        })
                    });
                }
            }

            // reject方法
            function reject(reason) {
                if (_this.status !== PENDING) return

                _this.status = REJECTED
                _this.data = reason

                if (_this.callbacks.length > 0) {
                    setTimeout(function () {
                        _this.callbacks.forEach((callbacksObj) => {
                            callbacksObj.onRejected(reason)
                        })
                    });
                }
            }

            try {
                excutor(resolve, reject)
            } catch (error) {
                reject(error)
            }
        }

        // Promise then方法
        // 返回一个新的Promise对象
        then(onResolved, onRejected) {

            // 向后传递成功的值
            onResolved = typeof onResolved === 'function' ? onResolved : value => value
            // 异常穿透
            onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

            const _this = this

            // 返回的Promise的结果由onResolved/onRejected执行结果所决定
            return new Promise((resolve, reject) => {

                function handle(callback) {
                    try {

                        /*
                         * 1.如果把抛出异常,return的Promise就会失败,reason就是error
                         * 2.如果回调函数返回结果不是Promise,return的Promise就会成功,value就是返回的值
                         * 3.如果回调函数返回结果是Promise,return的Promise结果就是这个Promise的结果
                         * 
                         */
                        const result = callback(_this.data) //将本次Promise的结果作为返回的返回的Promise的数据

                        if (result instanceof Promise) {

                            result.then(
                                value => resolve(value),     //如果result为成功,让返回的Promise也成功
                                reason => reject(reason)     //如果result为失败,让返回的Promise也失败
                            )

                        } else {
                            resolve(result)
                        }

                    } catch (error) {
                        reject(error)
                    }
                }

                if (_this.status === PENDING) {

                    _this.callbacks.push({
                        onResolved(value) {
                            handle(onResolved)
                        },
                        onRejected(reason) {
                            handle(onRejected)
                        }
                    })

                } else if (_this.status === RESOLVED) {

                    setTimeout(() => {
                        handle(onResolved)
                    })

                } else if (_this.status === REJECTED) {

                    setTimeout(() => {
                        handle(onRejected)
                    })

                }

            })

        }

        // Promise catch方法
        // 返回一个失败Promise对象
        catch(onRejected) {
            return this.then(undefined, onRejected)
        }

        // Promise Resolve方法
        // 返回一个成功/失败的Promise
        static resolve = function(value) {
            return new Promise((resolve, reject) => {

                if (value instanceof Promise) {
                    value.then(resolve, reject)
                } else {
                    resolve(value)
                }

            })
        }

        // Promise Reject方法
        // 返回一个失败的Promise
        static reject = function(reason) {
            return new Promise((resolve, reject) => {
                reject(reason)
            })
        }

        // Promise All方法
        // 所有Promise都成功时,放回一个成功的Promise, 如果有一个失败,就返回一个失败的Promise
        static all = function(promises) {

            // 成功的Promise
            const values = new Array(promises.length)
            // 成功的Promise数量
            let resolvedCount = 0

            return new Promise((resolve, reject) => {

                promises.forEach((p, index) => {

                    Promise.resolve(p).then(
                        value => {

                            resolvedCount++

                            values[index] = value

                            if (resolvedCount === promises.length) {
                                resolve(values)
                            }

                        },
                        reason => {
                            reject(reason) //有一个失败就Reject
                        }
                    )

                })

            })
        }

        // Promise Race方法
        // 返回第一个执行的Promise对象
        static race = function(promises) {
            return new Promise((resolve, reject) => {
                promises.forEach((p, index) => {

                    Promise.resolve(p).then(
                        value => {
                            resolve(value)
                        },
                        reason => {
                            reject(reason)
                        }
                    )

                })
            })
        }

        // 返回一个Promise对象，在指定时间后才确定结果
        static resolveDelay = function(value, wait) {
            return new Promise((resolve, reject) => {

                setTimeout(() => {
                    if (value instanceof Promise) {
                        value.then(resolve, reject)
                    } else {
                        resolve(value)
                    }
                }, wait)

            })
        }

        // 返回一个Promise对象，在指定时间后才确定失败
        static rejectDelay = function(reason, wait) {
            return new Promise((resolve, reject) => {

                setTimeout(() => {
                    reject(reason)
                }, wait)

            })
        }
    }

    window.Promise = Promise
})()