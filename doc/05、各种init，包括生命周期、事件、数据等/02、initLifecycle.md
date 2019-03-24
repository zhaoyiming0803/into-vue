initLifecycle 函数位于 /src/core/instance/lifecycle.js 文件中，代码如下：

``` javascript
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```

以上代码，首先定义了 options 常量，指向 vm.$options，接下来执行：

``` javascript
// locate first non-abstract parent
// 当前实例对象 vm 的父实例对象
let parent = options.parent
// 如果当前组件实例有父组件实例并且当前组件不是抽象组件
if (parent && !options.abstract) {
  // 使用 while 循环找到当前组件实例的父组件
  while (parent.$options.abstract && parent.$parent) {
    parent = parent.$parent
  }
  // 将当前实例 vm 添加到 非抽象组件父级的 $children 里
  parent.$children.push(vm)
}
```

Vue 为我们添加了注释：locate first non-abstract parent，意思就是“寻找第一个非抽象父级组件”，找到之后，将当前组件实例 vm 添加到父级的 $children 中，然后当前组件实例的 $parent 属性也指向父级：

``` javascript
vm.$parent = parent
```

那么问题来了：当前实例的父级 options.parent 从何而来，在 while 循环中一层层寻找非抽象父级，parent.$parent 如何确定呢？

这是在 Vue 创建 VNode 及其 patch 过程中形成的父子级关系，先了解下：

每个 .vue 文件（组件）都会被 vue-loader 解析为一个 json 对象，也就是今后原始的 options 对象，每个组件会先通过 Vue.extend 形成 Vue 子类，在今后的实例化过程中又会执行 new Vue 的整个过程，经过 mergeOptions、一系列 mixin 、 init之后，然后将 template 模板变成 VNode，最后执行 patch 渲染。

本节说道的组件父子级关系，就是在 patch 过程中形成的（具体说是执行 createComponentInstanceForVnode 函数时）。

patch 其实是一个递归的过程，也就是先渲染子组件，最后渲染父组件。具体过程可以参考：https://github.com/zymfe/test-code/blob/master/test49.html 。

还是老方法，打个断点看看：

``` javascript
updateComponent = function () {
  debugger;
  vm._update(vm._render(), hydrating);
};
```
_update 就是 patch 的过程，最后来到 createComponentInstanceForVnode 方法（使用Vnode创建组件实例），断点截图如下：

![image](https://github.com/zymfe/into-vue/blob/master/example/initLifecycle/1.jpg)

最后 return new vnode.componentOptions.Ctor(options) ，定义 options 的时候就有 parent 属性，而 parent 属性值是在 执行 createComponentInstanceForVnode 方法时传入的，我们再继续往上找，看 createComponentInstanceForVnode 在哪里执行的：

![image](https://github.com/zymfe/into-vue/blob/master/example/initLifecycle/2.jpg)

在 componentVNodeHooks.init() 方法中找到了，createComponentInstanceForVnode 方法的第二个参数就是 parent 的值，即 activeInstance，而 activeInstance 是一个全局变量，在执行 _update 的时候被赋值：

![image](https://github.com/zymfe/into-vue/blob/master/example/initLifecycle/3.jpg)

可以看到 activeInstance 执行 vm，_update 方法中 vm 指的是 this，也就是执行 _update 方法的那个对象：

![image](https://github.com/zymfe/into-vue/blob/master/example/initLifecycle/4.jpg)

找到了，执行 _update 方法的对象就是当前正在被 patch 对象，故名思议，也就是活动对象 activeInstance，因为同一时间只有一个组件被渲染，最后总结起来就是：当前正在被实例化的对象，其 parent 指向正在被 path 的父级。

关于组件 VNode 和 patch 的具体内容，暂时先记到这里，详细过程会在 07 节笔记中介绍。

再次回到 initLifecycle 函数中：

``` javascript
vm.$children = []
vm.$refs = {}

vm._watcher = null
vm._inactive = null
vm._directInactive = false
vm._isMounted = false
vm._isDestroyed = false
vm._isBeingDestroyed = false
```

在 vm 对象上又初始化了一些属性，至此，initLifecycle 方法执行完毕。

### 注意
本文最后编辑于2019/03/24，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。