打开 src/core/instance/index.js 文件，开始的代码是一系列 import：

``` javascript
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
```

然后定义了 Vue 构造函数：

``` javascript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

最后执行通过上面 import 导入的方法：

``` javascript
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
```

### initMixin

initMixin 方法定义在 src/core/instance/init.js 中，init.js 中 export 了很多方法，当前只看 initMixin 这个函数，代码如下：

``` javascript
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    // ... 省略
  }
}
```

initMixin 方法主要是在 Vue 构造函数的原型上挂载了 _init 方法，当我们使用 new 关键字初始化 Vue 的时候，其首先会执行 this._init()，这里的 _init 方法来源于 Vue 原型。

### stateMixin

stateMixin 方法定义在 src/core/instance/state.js 中，打开之后可以看到，state 主要是初始化一些 date、prop、computed、methods 相关的数据，这些都是我们写 Vue 组件的时候经常用的选项，当前主要看的代码如下：

``` javascript
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData: Object) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
```

以上是 stateMixin 函数的所有代码，主要做的事情就是在 Vue 原型上挂载 $set、$delete、$watch、$data、$props等，其中 $data、$props 这两个对象是只读的。

### eventsMixin

eventsMixin 方法定义在 src/core/instance/events.js 中，见名知意，与事件相关的方法都在这里定义，主要代码如下：

``` javascript
export function eventsMixin (Vue: Class<Component>) {
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    // ... 省略
  }

  Vue.prototype.$once = function (event: string, fn: Function): Component {
    // ... 省略
  }

  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    // ... 省略
  }

  Vue.prototype.$emit = function (event: string): Component {
    // ... 省略
  }
}
```

在这里看到经常使用的 $emit、$on 等方法。

### lifecycleMixin

lifecycleMixin 方法定义在 src/core/instance/lifecycle.js 中，找到 lifecycleMixin 函数，主要代码如下：

``` javascript
export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    // ...省略
  }

  Vue.prototype.$forceUpdate = function () {
    // ...省略
  }

  Vue.prototype.$destroy = function () {
    // ...省略
  }
}
```

与生命周期及数据更新相关的代码都在这里，其中 _update 中执行了 __patch__ 方法，这个在组件渲染的笔记中会详细分析。

### renderMixin

renderMixin 方法定义在 src/core/instance/render.js 中，主要代码如下：

``` javascript
export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function (): VNode {
    // ...省略
  }
}
```

这里看到了我们经常会用到的 $nextTick 方法，从它的前缀使用下划线可以看出，_render 是 Vue 内部使用的，_render 方法的主要作用是将 template 模板转化成 vnode，然后通过上面笔记提到的 __patch__ 方法将 vnode 渲染到页面中。这里先大概了解下即可。

### 总结

各种 mixin 方法的作用就是在 Vue 构造函数的原型上添加各种属性和方法。

### 注意
本文最后编辑于2018/11/25，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。