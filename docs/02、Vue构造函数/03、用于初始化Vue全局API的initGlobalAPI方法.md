上一节的笔记中，src/core/instance/index.js 已经执行完毕，接下来返回上一层，找到 src/core/index.js 文件，所有代码如下：

``` javascript
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

export default Vue
```

最开始是一系列 import，接下来执行 initGlobalAPI 方法，然后在 Vue 原型上定义了 $isServer、$ssrContext、FunctionalRenderContext，最后在 Vue 构造函数上定义了静态属性 version 用以标记当前版本。

本节笔记主要看的是 initGlobalAPI 方法，通过当前文件顶部的 import 可知，initGlobalAPI 方法定义在 src/core/global-api/index.js 文件中，直接打开看，代码如下：

``` javascript
// ...省略一系列 import
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
```

1、通过以下代码，在 Vue 构造函数上添加只读的静态属性 config，通过 import的路径可知，其值来源于 src/core/config.js：

``` javascript
Object.defineProperty(Vue, 'config', configDef)
```

2、添加工具方法：

``` javascript
Vue.util = {
  warn,
  extend,
  mergeOptions,
  defineReactive
}
```

3、添加属性增删及组件渲染相关的方法：

``` javascript
Vue.set = set
Vue.delete = del
Vue.nextTick = nextTick
```

上一节的笔记中，Vue 构造函数的原型上添加了 $nextTick 方法，这里在 Vue 构造函数本身又添加了静态方法 nextTick，它们的指向都是 nextTick 方法。

4、添加options属性：

``` javascript
Vue.options = Object.create(null)
ASSET_TYPES.forEach(type => {
  Vue.options[type + 's'] = Object.create(null)
})
```

先来看下 ASSET_TYPES 这个数组，它被定义在 src/shared/utils.js 中，相关代码如下：

``` javascript
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
```

那么上面代码初始化的 options 为：

``` javascript
Vue.options = {
  components: {},
  directives: {},
  filters: {}
}
```

5、在 options 对象上添加 _base，并执行 Vue

``` javascript
Vue.options._base = Vue
```

这里的 _base 在 Vue 子类继承父类的时候会用到。

6、通过 extend 方法初始化内置的组件

``` javascript
extend(Vue.options.components, builtInComponents)
```

extend 方法定义在 src/core/util/index.js，打开之后发现，没有 extend 方法？只有一些 import，^_^，其实 extend 是定义在 src/shared/util.js 中，这下找到 extend 方法，代码如下：

``` javascript
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
```

代码很简单，就是通过 for in 遍历一个对象，执行对象属性的浅拷贝。

继续上面的代码，extend 方法执行的时候，第一个参数是 Vue.options.components，这个属性在第4步的时候已经初始化完成，第二个参数是 builtInComponents，它是定义在 src/core/components/index.js 中，打开之后代码如下：

``` javascript
import KeepAlive from './keep-alive'
export default {
  KeepAlive
}
```

好吧，再找到当前目录下的keep-alive.js，通过它的 export default 可以看到，其实就是定义了一个名为 keep-alive 的抽象组件，并且自带 render 方法。

extend 方法执行完毕之后，Vue.options.components 属性就有值了：

``` javascript
Vue.options = {
  components: {
    KeepAlive
  }
}
```

6、通过 initUse 方法在 Vue 构造函数上添加 use 静态方法：

``` javascript
initUse(Vue)
```

initUse 方法定义在 src/core/global-api/use.js 中：

``` javascript
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // ... 省略
  }
}
```

Vue 官网对于 Vue.use 的使用介绍：[Vue.use](https://cn.vuejs.org/v2/guide/plugins.html)

7、通过 initMixin 方法在 Vue 构造函数上添加 mixin 静态方法：

``` javascript
initMixin(Vue)
```

initMixin 方法定义在 src/core/global-api/mixin.js 中：

``` javascript
import { mergeOptions } from '../util/index'
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

这里有个非常重要的方法：mergeOptons，实例化 Vue 的时候会详细说明。

8、通过 initExtend 方法在 Vue 构造函数上添加 extend 静态方法

``` javascript
initExtend(Vue)
```

initExtend 方法定义在 src/core/global-api/extend.js 中：

``` javascript
export function initExtend (Vue: GlobalAPI) {
  Vue.extend = function (extendOptions: Object): Function {
    // ...省略
  }
}
```

Vue.extend 用于 Vue 子类继承父类，后面会在组件初始化的笔记中详细说明。

9、通过 initAssetRegisters 方法在 Vue 构造函数上添加 component、filter、directive 等静态属性：

``` javascript
initAssetRegisters(Vue)
```

initAssetRegisters 方法定义在 src/core/global-api/assets.js 中：

``` javascript
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
```

对于 ASSET_TYPES，在上面初始化 Vue.options 的时候已经了解过，当时是把 components、filters、directives 等属性挂载到了 Vue.options 上，现在要把 component、filter、directive 三个属性直接挂载到 Vue 构造函数上，它们的作用是不一样的（***最直接的是看单复数***），这里先简单说下：

Vue.options 上的 components、filters、directives 是在实例化 Vue 时做 merge 用的，相当于是 Vue 官方为我们内置的一些组件、过滤器和指令。

Vue 上的 component、filter、directive 是 Vue 为我们提供的全局注册组件、过滤器和指令的 API 接口。比如我们在 main.js 中执行 Vue.component('Hello', Hello)，那么在其他任意一个组件中都能使用 Hello 这个全局组件。

### 总结

initGlobalAPI 的作用就是在 Vue 构造函数本身添加一些全局的静态方法和属性。

### 注意
本文最后编辑于2018/11/25，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。
