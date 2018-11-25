在上一节的笔记中，src/core/index.js 这个脚本文件已经执行完毕，继续返回上一层，找到 src/platforms/web/runtime/index.js 。

从 Vue 的目录命名也可以看到，core 下面都是一些核心的公共的代码，也就是 web 、weex、server 公用的，当前笔记只记录 Vue 在 web 平台上的一些实现原理，打开 src/platforms/web/runtime/index.js 文件，主要做了以下几件事情：

1、在 Vue.config 静态属性上添加其他属性：

``` javascript
// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement
```

2、在 Vue.options 静态属性上内置 web 平台上使用的指令和组件：

``` javascript
// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
```

经过以上 extend，Vue.options 变成：

``` javascript
Vue.options = {
  components: {
    keepAlive,
    Transition,
    TransitionGroup
  },
  directives: {
    model,
    show
  },
  filters: {}
}
```

这里看到了我们经常使用的两个指令， v-show 和 v-model。

3、在 Vue 原型上挂载 __patch__ 和 $mount 方法，具体会在组件实例化和渲染的笔记中详细说明。

``` javascript
// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

再继续往上走一层，来到 src/platforms/web/entry-runtime-with-compiler.js ，也就是我们的打包入口文件，这里只做了一件事：缓存并重写 Vue 原型上的 $mount 方法：

``` javascript
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // ...省略
  return mount.call(this, el, hydrating)
}
```

### 总结

到目前为止，我们在 mains.js 中 import Vue from vue 时，Vue 所做的一些工作从宏观上已经都展开了，具体每个方法都做了什么事情，在后面笔记，实例化 Vue 构造函数的时候都会详细说明。

### 注意
本文最后编辑于2018/11/25，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。