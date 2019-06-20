实例化 Vue 构造函数的时候，会执行 initState 方法，主要用来初始化 props、data、methods、computed、watch 等属性的，该方法位于 /src/core/instance/state.js 文件中，代码如下：

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

可以看到，我们在 .vue 文件中写的几个属性，就是通过 initState 方法初始化的，后面的笔记将以 initData 为入口，逐步展开 Vue 响应式原理的实现细节。

### 注意
本文最后编辑于2019/05/12，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。