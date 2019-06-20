从本节笔记开始，我们用到的大多数 Vue 源码都在 /src/core/ovserver/ 目录下，本节笔记说的 observer 工厂函数位于 /src/core/observer/index.js 文件中，代码如下：

``` javascript
/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

首先是判断：

``` javascript
if (!isObject(value) || value instanceof VNode) {
  return
}
```

入参 value 必须是一个纯对象或数组，且不是 VNode 实例。

然后判断:

``` javascript
if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
  ob = value.__ob__
}
```

我们看到，observer 函数最后返回的就是 ob。

最后，满足以下一系列条件，这个 value 才能被观测：

``` javascript
else if (
  shouldObserve &&
  !isServerRendering() &&
  (Array.isArray(value) || isPlainObject(value)) &&
  Object.isExtensible(value) &&
  !value._isVue
) {
  ob = new Observer(value)
}
```

1、shouldObserver，在当前文件的顶部有这样一段代码：

``` javascript
/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}
```

toggleObserving 函数用来切换全局 shouldObserve 变量，在某些情况下，如 props、childComponent、initInjections 以及 weex 平台中会用到，后面我们讲到 initProps 时再详述。

2、!isServerRendering()

现在的 Vue 支持服务端渲染，也就是说只有当不是服务端渲染的时候才会 observe。

3、 (Array.isArray(value) || isPlainObject(value))

如果 value 不是 Array 或 Object，就没有必要对其 observe。

4、Object.isExtensible(value)

JS 中的 Object 默认是可扩展的，如果想让其变得不可扩展，可以使用 Object.preventExtensions() 等方法，参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions

5、!value._isVue

当前 value、 不能是 Vue 实例。

同时满足以上5个条件，才会对当前 value 进行 observe，即执行：

``` javascript
ob = new Observer(value)
```

下节笔记，我们就详细看下 Observer 这个类做了哪些事情？

### 注意
本文最后编辑于2019/05/12，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。