本节笔记来总结下目前挂载到 Vue 构造函数上的静态属性和方法，方便后期回顾查看：

``` javascript
Vue.options = {
  components: {
    // src/core/components/index.js
    KeepAlive
    // src/platforms/web/runtime/components/index.js
    Transition,
    TransitionGroup
  },
  // src/platforms/web/runtime/directives/index.js 
  directives:{
    model,
    show
  },
  filters: {},
  _base: Vue
};

// src/core/global-api/index.js
Vue.config = {
  // src/platforms/web/runtime/index.js
  mustUseProp: mustUseProp,
  isReservedTag: isReservedTag,
  isReservedAttr: isReservedAttr,
  getTagNamespace: getTagNamespace,
  isUnknownElement: isUnknownElement,
  // ... 更多配置项查阅src/core/config.js
};

// src/core/global-api/index.js
Vue.util = {
  warn,
  extend,
  mergeOptions,
  defineReactive
};

// src/core/global-api/index.js
Vue.set = set
Vue.delete = del
Vue.nextTick = nextTick

// src/core/global-api/use.js
Vue.use = function () {};

// src/core/global-api/mixin.js
Vue.mixin = function () {};

// src/core/global-api/extend.js
Vue.cid = 0
Vue.extend = function () {};

// src/core/global-api/assets.js
Vue.component = function () {};
Vue.directive = function () {};
Vue.filter = function () {};

// src/core/index.js
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

Vue.version = '__VERSION__';

// entry-runtime-with-compiler.js
Vue.compile = compileToFunctions;
```

### 注意
本文最后编辑于2018/12/01，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。