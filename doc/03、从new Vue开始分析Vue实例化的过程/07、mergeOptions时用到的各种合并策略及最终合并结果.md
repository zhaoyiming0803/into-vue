之前的5节笔记，都是为了本节笔记做铺垫的，首先搞清楚 mergeOptions 方法的三个参数：

``` javascript
vm.$options = mergeOptions(
  {
    components: {
      KeepAlive
      Transition,
      TransitionGroup
    },
    directives:{
      model,
      show
    },
    filters: {},
    _base: Vue
  },
  {
    el: '#app',
    data () {
      return {
        uname: 'zhaoyiming'
      }
    },
    render: h => h(App)
  },
  vm
)
```

然后对 props 、 injects 、directives 等选项做了 normalize，因为 Vue 类是可以被继承的，每个组件都是通过 Vue.extend 继承 Vue 的子类，目前笔记中会先介绍 使用 new 关键字初始化 Vue 和 部分组件类实例化过程中的 function，后面组件相关笔记中还会继续补充。

再来贴一下 mergeOptions 方法的代码：

``` javascript
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  // ... 省略前5节笔记中分析过的代码
  const extendsFrom = child.extends
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm)
  }
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```