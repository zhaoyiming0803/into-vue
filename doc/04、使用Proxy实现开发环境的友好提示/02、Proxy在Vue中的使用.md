Vue 初始化 Proxy 的代码如下：

``` javascript
/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  initProxy(vm)
} else {
  vm._renderProxy = vm
}
```

首先判断当前是否处于开发环境，如果是在开发环境，则执行 initProxy 方法；如果是在生产环境，则直接设置 vm 的 _renderProxy 属性值为 vm 本身。

从这里也能看出 initProxy 方法的作用就是设置 vm 的 _renderProxy 属性值为 vm 本身，只是在开发环境做了一些其他处理，但最终要保证开发环境和生产环境的功能一致。

initProxy 方法 在 src/core/instance/proxy.js 文件中，代码如下：

``` javascript
initProxy = function initProxy (vm) {
  if (hasProxy) {
    // determine which proxy handler to use
    const options = vm.$options
    const handlers = options.render && options.render._withStripped
      ? getHandler
      : hasHandler
    vm._renderProxy = new Proxy(vm, handlers)
  } else {
    vm._renderProxy = vm
  }
}
```
首先判断 hasProxy 是否为真，如果为假，则直接与生产环境一致 vm._renderProxy = vm，如果为真，则将 Proxy 实例赋值为 vm._renderProxy，从而实现对 vm 实例的代理。

hasProxy 定义如下：

``` javascript
const hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy)
```

如果当前宿主环境支持 Proxy，则 hasProxy 为真，反之为假。

isNative 的定义如下：

``` javascript
/* istanbul ignore next */
export function isNative (Ctor: any): boolean {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}
```

在今后的开发过程中，如果需要判断方法是否是 JS 原生的，就可以使用 isNative。

接下来重点看 if 分支内的代码：

``` javascript
// determine which proxy handler to use
const options = vm.$options
const handlers = options.render && options.render._withStripped
  ? getHandler
  : hasHandler
vm._renderProxy = new Proxy(vm, handlers)
```

对于 Proxy 的基本用法，可参考阮一峰老师写的E6入门一书：http://es6.ruanyifeng.com/#docs/proxy

如果 options.render && options.render._withStripped 为真，则 handlers = getHandler；

否则，handlers = hasHandler。

这里需要先了解下 options.render._withStripped 的作用：我们在 main.js 中 使用 new 关键字实例化 Vue 的时候，会写 render 函数，如下：

``` javascript
import Vue from 'vue'
import App from './App'
new Vue({
  el: '#app',
  data () {
    return {
      uname: 'zhaoyiming'
    }
  },
  render: h => h(App)
})
```

但是并没有为 render 函数 指定 _withStripped 属性。

还有一种情况就是 Vue 实例化组件并渲染的时候，会通过 vue-loader 编译 .vue 文件，最后会生成 render 函数，我们平时工作中只需要写 template 模板即可，编译 template 的时候会遵循 JS 严格模式，将代码中的 with 关键字全部转换为属性访问的形式，即 vm.test 或 vm['test']，并且将 render._withStripped 置为 true。了解 Proxy 基本用法之后就知道，这种属性访问的形式是无法触发 Proxy 的 has 拦截的，只能触发 get 拦截，所以通过判断 _withStripped 来决定 handlers 的值。

hasHandler 的定义如下：

``` javascript
const hasHandler = {
  has (target, key) {
    const has = key in target
    const isAllowed = allowedGlobals(key) ||
      (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
    if (!has && !isAllowed) {
      if (key in target.$data) warnReservedPrefix(target, key)
      else warnNonPresent(target, key)
    }
    return has || !isAllowed
  }
}
```

hasHandler 在 Vue 中要做的就是：拦截 with 语句中的对象属性访问。

allowedGlobals 的定义如下：

``` javascript
const allowedGlobals = makeMap(
  'Infinity,undefined,NaN,isFinite,isNaN,' +
  'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
  'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
  'require' // for Webpack/Browserify
)
```

通过 makeMap 生成一个 mapList，里边包含 window 对象上的全局方法，所以我们可以在 tempalte 中这样使用：

``` vue
<template>
  <div>
    {{Number('123') + 456}}
  </div>
</template>
```

可能在平时的开发过程中，我们直接会用一个计算属性代替以上写法，但这种写法也是有效的。

如果在 template 中使用了 data 中未定义的属性，则通过 warnNonPresent 方法提示：

``` javascript
const warnNonPresent = (target, key) => {
  warn(
    `Property or method "${key}" is not defined on the instance but ` +
    'referenced during render. Make sure that this property is reactive, ' +
    'either in the data option, or for class-based components, by ' +
    'initializing the property. ' +
    'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
    target
  )
}
```

这个提示，在浏览器控制台经常会看到，告诉我们 template 中使用了未定义的属性或方法。

Vue 内部有很多属性、方法都以 _ 和 $ 开头，如果我们业务代码 data 中的属性名 或 methods 中的方法名是以 _ 或 $ 开头，并且和 Vue 内部的某个属性或方法重名，就会有以下提示：

``` javascript
const warnReservedPrefix = (target, key) => {
  warn(
    `Property "${key}" must be accessed with "$data.${key}" because ` +
    'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
    'prevent conflicts with Vue internals' +
    'See: https://vuejs.org/v2/api/#data',
    target
  )
}
```

getHandler 的定义如下：

``` javascript
const getHandler = {
  get (target, key) {
    if (typeof key === 'string' && !(key in target)) {
      if (key in target.$data) warnReservedPrefix(target, key)
      else warnNonPresent(target, key)
    }
    return target[key]
  }
}
```

get 拦截对象的属性访问，与 hasHandler 的目的是一样的。总之，initProxy 方法的作用就是代理并拦截 data 或 methods 属性，为开发者提供更友好的错误提示。

### 注意
本文最后编辑于2019/01/13，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。