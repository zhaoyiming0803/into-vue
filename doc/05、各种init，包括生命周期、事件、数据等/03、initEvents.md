执行 initLifecycle 之后，接下来是 InitEvents，该函数位于 src/core/instance/events.js 中：

``` javascript
export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}
```

以上是 initEvents 函数的全部代码，只有短短几行，将 _events 属性初始化为空对象, _hasHookEvent 属性初始化为 false，然后就是判断 vm.$options._parentListeners 如果为真，则执行 updateComponentListeners 方法。

那么 vm.$options._parentListeners 从何而来呢？

上一节笔记讲到一个函数：createComponentInstanceForVnode，再来贴一下代码：

``` javascript
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
  parentElm?: ?Node,
  refElm?: ?Node
): Component {
  const vnodeComponentOptions = vnode.componentOptions
  const options: InternalComponentOptions = {
    _isComponent: true,
    parent,
    propsData: vnodeComponentOptions.propsData,
    _componentTag: vnodeComponentOptions.tag,
    _parentVnode: vnode,
    _parentListeners: vnodeComponentOptions.listeners,
    _renderChildren: vnodeComponentOptions.children,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  }
  // check inline-template render functions
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnodeComponentOptions.Ctor(options)
}
```

也就是说，_parentListeners 属性是在创建子组件时被赋值，具体内容在后面的组件 path 过程中详述。

### 注意
本文最后编辑于2019/03/31，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。