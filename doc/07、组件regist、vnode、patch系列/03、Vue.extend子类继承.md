Vue 实例化过程中执行 initRender 方法，initRender 方法中很关键的两行代码如下：

``` javascript
// bind the createElement fn to this instance
// so that we get proper render context inside it.
// args order: tag, data, children, normalizationType, alwaysNormalize
// internal version is used by render functions compiled from templates
vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
// normalization is always applied for the public version, used in
// user-written render functions.
vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```

Vue 源码中有详细的注释，意思就是：将 template 模板编译为 render 函数，则执行的是 vm._c 方法。用户手写的 render 方法，则执行 vm.$createElement 方法，其实它们都是执行同一个 createElement 方法，只是最后一个入参不同，具体原因，在后面的组件 render 、patch 笔记中详细介绍。

createElement 方法定义在 /src/core/vdom/create-element.js 中，代码如下：

``` javascript
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}
```

data 可以是数组或纯对象，所以开始的时候做了参数合并，比如我们自己实现 render 函数的返回值：

``` javascript
new Vue({
  el: '#app',
  data () {
    return {
      uname: 'zhaoyiming',
      age: 18
    }
  },
  render: h => {
    return h('div', [
      h('div', {
        style: {
          color: 'red'
        },
        on: {
          click: () => {
            console.log(this.uname);
          }
        }
      }, this.uname),
      h('div', {
        style: {
          color: 'blue'
        },
        on: {
          click: () => {
            console.log(this.age);
          }
        }
      }, this.age)
    ]);
  }
});
```

我们在 createElement 方法的第一行打个 debugger，浏览器中单步调试，前两次 data 是纯对象，第三次 data 是数组，h 方法就是 vm._c 或 vm.$createElement：

![image](https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/1.png)

![image](https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/2.png)

![image](https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/3.png)

最后返回 _createElement 方法，_createElement 方法就定义在 createElement 方法的下面，代码如下：

``` javascript
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // ... 省略

  if (typeof tag === 'string') {
    // ... 省略
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
```

当前重点是以上 else if 分支中的一行代码：

``` javascript
vnode = createComponent(Ctor, data, context, children, tag)
```

这个 createComponent 是定义在 /src/core/vdom/create-component.js 文件中，代码如下：

``` javascript
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  // ... 省略
}
```

初始化 global 全局 api 的时候，有这样一句代码：

``` javascript
// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue
```

在实例化 Vue 类的时候（执行 this._init()），Vue.options 选项要合并到 vm.$options 上：

``` javascript
// merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
```

所以 vm.$options._base = Vue，下面这句代码的来源就是如此：

``` javascript
const baseCtor = context.$options._base
```

下面重点看 Vue.extend 方法，它被定义在 /src/core/global-api/extend.js 文件中的 initExtend 方法中：

``` javascript
Vue.cid = 0
let cid = 1

/**
 * Class inheritance
 */
Vue.extend = function (extendOptions: Object): Function {
  extendOptions = extendOptions || {}
  const Super = this
  const SuperId = Super.cid
  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }

  const name = extendOptions.name || Super.options.name
  if (process.env.NODE_ENV !== 'production' && name) {
    validateComponentName(name)
  }

  const Sub = function VueComponent (options) {
    this._init(options)
  }
  Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub
  Sub.cid = cid++
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super

  // For props and computed properties, we define the proxy getters on
  // the Vue instances at extension time, on the extended prototype. This
  // avoids Object.defineProperty calls for each instance created.
  if (Sub.options.props) {
    initProps(Sub)
  }
  if (Sub.options.computed) {
    initComputed(Sub)
  }

  // allow further extension/mixin/plugin usage
  Sub.extend = Super.extend
  Sub.mixin = Super.mixin
  Sub.use = Super.use

  // create asset registers, so extended classes
  // can have their private assets too.
  ASSET_TYPES.forEach(function (type) {
    Sub[type] = Super[type]
  })
  // enable recursive self-lookup
  if (name) {
    Sub.options.components[name] = Sub
  }

  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  Sub.superOptions = Super.options
  Sub.extendOptions = extendOptions
  Sub.sealedOptions = extend({}, Sub.options)

  // cache constructor
  cachedCtors[SuperId] = Sub
  return Sub
}
```

首先定义了全局变量 cid，每次每个子类继承父类，就会自增1。接下来这段代码很重要：

``` javascript
const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
if (cachedCtors[SuperId]) {
  return cachedCtors[SuperId]
}
```

我们知道，全局或局部注册完一个组件之后，在 template 中就要使用，这个组件可能会被多次使用，如果每次使用都走一遍实例化 Vue 子类的过程，是很耗费性能的，所以这里做了缓存，把 SuperId 做为键名，下次使用的时候直接返回即可。例如：https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/main.js

以上测试代码，debugger 看下效果，两次引用 hello 组件，原本要继承两次父类，但其实是同一个组件，同一个子类，所以直接从缓存中返回：

第一次：

![image](https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/4.png)

第二次：

![image](https://github.com/zymfe/into-vue/blob/master/example/vm.$createElement/5.png)

Vue.extend 中剩下的代码就比较容易理解了，子类通过原型继承的方式获得了 Vue 父类的属性和方法，然后将 Vue 父类上的静态属性和方法也都赋值给子类，完成一系列工作之后，缓存当前子类，并返回。

``` javascript
// cache constructor
cachedCtors[SuperId] = Sub;
return Sub
```

子类创建完成后实例化一个组件 VNode，然后在 patch 过程中执行 createComponentInstanceForVnode 实例化子类，继续子类的 init 过程。具体步骤在后面的笔记中介绍。

### 注意
本文最后编辑于2019/05/18，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。