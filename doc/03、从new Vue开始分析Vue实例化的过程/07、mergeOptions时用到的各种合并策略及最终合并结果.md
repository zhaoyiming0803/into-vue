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
    extends: {
      created: function () {
        console.log('new Vue extends created');
      },
      mounted: function () {
        console.log('new Vue extends mounted');
      },
      directives: {
        a: {
          bind: function (el) {}
        }
      }
    },
    mixins: [
      {
        beforeCreate: function () {
          console.log('new Vue mixins beforeCreate');
        },
        created: function () {
          console.log('new Vue mixins created');
        },
        mounted: function () {
          console.log('new Vue mixins mounted');
        },
        directives: {
          b: {
            bind: function (el) {}
          }
        },
        filters: {
          capitalize: function (value) {
            return 'mock one'
          }
        }
      }
    ],
    created () {
      console.log('new Vue created');
    },
    mounted () {
      console.log('new Vue mounted');
    },
    render: h => h(App)
  },
  vm
)
```

为了测试，在本节笔记中 new Vue 的时候多加了一些 声明周期 、extends 、 mixins 等参数，接下来做选项合并会用到。

然后对 props 、 injects 、directives 等选项做了 normalize，因为 Vue 类是可以被继承的，每个组件都是通过 Vue.extend 继承 Vue 的子类，目前笔记中会先介绍 使用 new 关键字初始化 Vue 和 部分组件类实例化过程中的 function，后面组件相关笔记中还会继续补充。

再贴一下 mergeOptions 方法的代码：

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

找到 dist/vue.esm.js，在第1461行写入 debugger，打个断点，如下：

``` javascript
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  // ... 省略前5节笔记中分析过的代码
  debugger;
  // ... 省略，这里的代码与上面 mergeOptions 方法内的代码相同
  return options
}
```

### child.extends 和 child.mixins

extends 和 mixins 的作用类似，都可以混入一些选项，参考 Vue 官网对 mixin 的介绍：“混入 (mixins) 是一种分发 Vue 组件中可复用功能的非常灵活的方式。混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被混入该组件本身的选项”。

注意：这里混入的是【组件选项】，目的是【将所有混入对象的选项都混入到对应组件本身的选项当中】。等下我们通过断点单步调试的方式，可以在浏览器中清晰的看到整个混入过程。

区别在于： child.extends 是一个纯对象，而 child.mixins 是一个数组。

