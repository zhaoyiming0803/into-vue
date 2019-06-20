initState 方法很简单，位于 src/core/instance/state.js 文件中：

``` javascript
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

因为 initState 方法主要用于初始化数据，包括 props 、 data 、methods 、computed、 watch 等，涉及到 Vue 的核心：数据响应式原理，这部分会在 07 节笔记中重点详细介绍。当前只需从宏观上了解 initState 方法做的事情就是：判断 vm.$options 上是否定义了 props 、 data 、methods 、computed、 watch 等属性，然后分别按照对应的规则去 init 即可。

### 注意
本文最后编辑于2019/03/31，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。