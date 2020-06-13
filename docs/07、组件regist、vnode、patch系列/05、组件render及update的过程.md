Vue 开发的核心是组件，层层嵌套的组件形成了一个组件树，每个组件都要经过 render (将组件对象变成 vnode) 和 patch (实例化组件 vnode 或普通 vnode 并渲染：子组件 vnode 通过实例化 Vue 子类重复执行整个 init 过程，普通 vnode 则直接变成 dom，然后 insert 或 append 到父节点中)

有了上一节学习 snabbdom 的基础，再来看 Vue patch 的过程就相对轻松了。

首先初始化一个 Vue 项目 demo：https://github.com/zhaoyiming0803/demo-vue/tree/test-patch

然后在这个部分打个断点：

``` javascript
updateComponent = function () {
  debugger
  vm._update(vm._render(), hydrating)
};
```

还记得上节笔记最后的总结吗？从整体来看，patch 遵循这样的过程：

1、将原始的 dom 变成 vNode，即 oldVNode

2、patch oldVNode 和 newVNode，将 newVNode 中的『更新』patch 到 oldVNode 中，在这个过程中，页面已经重新更新了

也就是『先render再patch』

执行 new Vue 的时候，先做初始化工作，最后执行 $mount 挂载，将 vnode 渲染到实际 dom 中，这个过程就是『先render再patch』。

### render 过程：
```javascript
Vue.prototype.$mount = function (el) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating)
}
```

```javascript
function mountComponent() {
  var updateComponent = function () {
    debugger
    vm._update(vm._render(), hydrating);
  }

  new Watcher(vm, updateComponent, noop, null, true);
  hydrating = false;

  // ... callHook(vm, 'mounted');

  return vm;
}
```

```javascript
// _render 要做的事情就是将 dom 转为 vnode
Vue.prototype._render = function () {
  var vm = this;
  var ref = vm.$options;
  var render = ref.render;
  // 初次为 undefined
  var _parentVNode = ref._parentVnode;

  // render 的时候初始化占位符 vnode
  vm.$vnode = _parentVNode;

  try {
    // render 函数有两种可能性，即 _c 是 Vue 将 template 编译成树结构的对象后使用的，$createElement 是调用用户自己写的render函数时被调用
    // 它们都是返回 createElement 函数

    // internal version is used by render functions compiled from templates
    // vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };

    // normalization is always applied for the public version, used in
    // user-written render functions.
    // vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };
    vnode = render.call(vm._renderProxy, vm.$createElement);
  } catch (e) {
    // ...
  }

  vnode.parent = _parentVnode; // 初次为 undefined
  return vnode;
}
```

```javascript
vm.$createElement = function (/* 一系列参数 */) {
  return createElement(vm, a, b, c, d, true);
}

vm._c = function (/* 一系列参数 */) {
  return createElement(vm, a, b, c, d, false);
}
```

看下 createElement 函数
```javascript
function createElement() {
  // 降级处理参数... data 参数可以为 undefined
  return _createElement(/* 一系列参数 */)
}
```
实际时调用了 _createElement 函数
```javascript
function _createElement() {
  // ... 对 data 等参数做了校验
  // 如果是 render 一个组件，那么 tag 是一个对象
  vnode = createComponent(tag, data, context, children);
  // 如果 render 是一个普通的 html 标签，那么tag 是一个 string
  // vnode = new VNode(/* 一系列参数 */);
}
```

createComponent 函数

```javascript
function createComponent(Ctor: Object, data: undefined, context: Object, children: undefined, tag: undefined) {
  // Cotr 通过 Vue.extend 变成 Vue 子类
  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    // 关于 Vue.extend 的过程，在 07-03 节笔记中已经学习过了
    Ctor = baseCtor.extend(Ctor);
  }

  data = data || {};
  data.on = data.nativeOn; // undefined

  // 组件构造函数创建之后，[全局 mixins] 应用的情况下，解析构造函数的 options 选项
  resolveConstructorOptions(Ctor);

  // 将组件管理的钩子安装到占位符 node 上
  installComponentHooks(data);
  // data = { on: undefined, hook: { init: fn, prepatch: fn, insert: fn, destroy: fn } };

  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  // *** 这里返回的是占位符vnode，并不是渲染vnode，渲染过程在 patch 中进行 ***
  return vnode;
}
```

注意，Vue 组件也是树结构，一层套一层，所以 _render 会递归调用，最终返回一个 render tree，也就是 vnode tree。debugger 看下效果：

![vnode](https://github.com/zhaoyiming0803/into-vue/blob/master/examples/vm.%24createElement/6.png)

***** 对比 snabbdom，整个 render 就是一个 toVNode 的过程。

### patch 过程
``` javascript
Vue.prototype._update = function (vnode, hydrating: undefined) {
  var prevEl = vm.$el;
  // 先缓存，为后面 diff 做准备
  var prevVnode = vm._vnode;
  var prevActiveInstance = activeInstance;
  activeInstance = vm;
  // update 的时候初始化 _vnode
  // 也就是上面刚刚通过 render 函数返回的 vnode
  vm._vnode = vnode;

  // 比如在 APP.vue 中有一个标签 <hello />
  // 对于 hello.vue 组件来讲，其占位符 vnode 就是 APP.vue 中的 <hello />，渲染 vnode 就是 hello.vue 中的 template 部分

  // 首次渲染，_vnode 肯定不存在
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(
      vm.$el, vnode, hydrating, false /* removeOnly */,
      vm.$options._parentElm,
      vm.$options._refElm
    );
    // no need for the ref nodes after initial patch
    // this prevents keeping a detached DOM tree in memory (#5851)
    vm.$options._parentElm = vm.$options._refElm = null;
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
}

Vue.prototype.__patch__ = function (/* 一系列参数 */) {
  // ...
  // 返回一个 patch 函数，到这里，与我们上一节笔记重点学习的 snabbdom 就很相似了
  // 详细看下源码 /src/core/vdom/patch.js 文件，就可以看到 Vue 如何深度整合 snabbdom 的
  return function patch(oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
    // 将普通的标签节点变成 vnode
    oldVnode = emptyNodeAt(oldVnode);
    var oldElm = oldVnode.elm;
    // 父节点，首次初始化是 body
    var parentElm$1 = nodeOps.parentNode(oldElm);

    createElm();
  }
}

function createElm(vnode, insertedVnodeQueue, parentElm, refElm, nested, ownerArray, index) {
  // patch 组件标签
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return;
  }

  // patch 普通标签
  vnode.elm = vnode.ns
    ? nodeOps.createElementNS(vnode.ns, tag)
    : nodeOps.createElement(tag, vnode);
  setScope(vnode);

  {
    // createChildren 就是循环执行 createElm 函数
    createChildren(vnode, children, insertedVnodeQueue);
    if (isDef(data)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
    }
    // 执行完 insert，页面上就会有内容了
    insert(parentElm, vnode.elm, refElm);
  }
}
```
重点看下 createComponent 函数
``` javascript
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  // ... 执行 component hook 中的 init 方法
  // 如果是 keepAlive，则不再重新做组件的初始化工作
  if (
    vnode.componentInstance &&
    !vnode.componentInstance._isDestroyed &&
    vnode.data.keepAlive
  ) {
    // kept-alive components, treat as a patch
    // 数据更新驱动视图的变化，执行：
    var mountedNode = vnode; // work around flow
    componentVNodeHooks.prepatch(mountedNode, mountedNode);
  } else {
    // 首次 patch，执行，其实就是实例化子组件
    var child = vnode.componentInstance = createComponentInstanceForVnode(
      vnode,
      activeInstance,
      parentElm,
      refElm
    );

    // 子组件再次 $mount，然后 mountComponent，接着 render 和 update
    child.$mount(hydrating ? vnode.elm : undefined, hydrating);
  }
}

function createComponentInstanceForVnode(
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent, // *****重要： activeInstance in lifecycle state
  parentElm,
  refElm
) {
  var options = {
    _isComponent: true,
    parent: parent,
    _parentVnode: vnode,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }

  // 再次执行 Vue 实例化过程
  return new vnode.componentOptions.Ctor(options)
}

Vue.prototype.$mount = function () {
  var mount = Vue.prototype.$mount;
  return mount.call(this, el, hydrating)
}
```

整个 patch 的过程是执行递归，先子后父，具体示例可以参考：https://github.com/zhaoyiming0803/test-code/blob/master/test49.html

- 通过 compileToFunctions 将 template 编译为 AST 抽象语法树

- 通过 AST 抽象语法树生成 render 方法

- 在 mountComponent 时实例化渲染 Watcher，Watcher 的第二个参数 expOrFn 是一个 updateComponent 方法：

``` javascript
updateComponent = () => {
  // 1、执行 _update 方法，将 vnode 通过 patch 渲染到页面上
  // 2、这其中就包括根据 children 选项生成子组件，然后执行 createComponentInstanceForVnode，最后执行$mount
  // 3、继续第二步操作
  vm._update(vm._render() /* 执行 render 方法生成 vnode */, hydrating)
}
```

再说下整体思路：

1、递归调用 _render 生成 vnode tree

2、递归调用 _patch 将 vnode 生成实际 dom 并渲染到页面上

### 注意
本文最后编辑于2020/01/14，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。