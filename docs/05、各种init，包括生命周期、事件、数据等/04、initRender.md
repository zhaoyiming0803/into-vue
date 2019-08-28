initRender 方法中初始化了很多组件VNode、patch相关的属性和方法：

``` javascript
export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}
```

vm._vnode 是组件的渲染 VNode，vm.$vnode 是组件占位符VNode（也就是 parentVnode），这是两个组件渲染很重要的属性，后面组件相关的笔记中会详细介绍，现在只需记住在 vm 上定义了两个很重要的属性即可。

``` javascript
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```

vm._c 是 Vue 内部私有方法，我们写的 vue 组件默认就是使用 _c 方法创建 VNode，vm.$createElement 是用来处理开发者手写的 render 函数，它们只有最后一个入参不同，其他都一样。 

关于自定义 render 函数的应用：：https://github.com/zymfe/test-code/blob/master/test55.vue

### 注意
本文最后编辑于2019/03/31，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。