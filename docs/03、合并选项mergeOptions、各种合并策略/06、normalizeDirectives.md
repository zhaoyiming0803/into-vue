继续分析 src/core/util/options.js 中的 mergeOptions 方法，接下来是执行 normalizeDirectives 方法，

``` javascript
normalizeDirectives(child)
```

normalizeDirectives 方法所有代码如下：

``` javascript
/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}
```

directive 指令对我们来说也不陌生，除了 Vue 内置的 v-model、v-if、v-show 等指令，开发者也可以自定义全局指令或只供某个组件使用的局部指令。

注册一个局部指令有２种写法，如：

``` html
<button v-a>按钮a</button>
<button v-b>按钮b</button>
```

``` javascript
directives: {
  a: function (el) {
    el.onclick = function () {
      alert('a');
    }
  },
  b: {
    bind: function (el) {
      el.onclick = function () {
        alert('b');
      }
    },
    inserted: function () {},
    update: function () {},
    componentUpdated: function () {},
    unbind: function () {}
  }
},
```

自定义的指令大多数都是用来操作 dom 的，[Vue官网对directive的介绍](https://cn.vuejs.org/v2/guide/custom-directive.html)。

### 总结

通过本节源码笔记，我们知道了注册局部指令的两种写法，以及指令最终被格式化后的形式，在后面正式 mergeOptions 的时候，还会对指令进一步操作。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。