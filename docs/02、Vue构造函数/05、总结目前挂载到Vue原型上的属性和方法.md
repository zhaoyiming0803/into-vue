本节笔记来总结下目前挂载到 Vue 原型上的属性和方法，方便后期回顾查看：

``` javascript
Vue.prototype = {
  // src/core/instance/init.js 
  _init: function () {},

  // src/core/instance/state.js
  $data: {},
  $props: {},
  $set: function () {},
  $delete: function () {},
  $watch: function () {},

  // src/core/instance/events.js 
  $on: function () {},
  $once: function () {},
  $off: function () {},
  $emit: function () {},

  // src/core/instance/lifecycle.js 
  _update: function () {},
  $forceUpdate: function () {},
  $destroy: function () {},

  // src/core/instance/render.js 
  _o = markOnce,
  _n = toNumber,
  _s = toString,
  _l = renderList,
  _t = renderSlot,
  _q = looseEqual,
  _i = looseIndexOf,
  _m = renderStatic,
  _f = resolveFilter,
  _k = checkKeyCodes,
  _b = bindObjectProps,
  _v = createTextVNode,
  _e = createEmptyVNode,
  _u = resolveScopedSlots,
  _g = bindObjectListeners,
  $nextTick: function () {},
  _render: function () {},

  // src/core/index.js
  $isServer: function () {},
  $ssrContext: function () {},

  // src/platforms/web/entry-runtime-with-compiler.js
  __patch__: function () {},
  $mount: function () {}
};
```

### 注意
本文最后编辑于2018/12/01，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。