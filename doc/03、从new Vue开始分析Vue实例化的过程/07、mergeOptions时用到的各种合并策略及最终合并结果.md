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

先整理下 mergeOptions 方法所要做的事情：

mergeOptions 方法内开始定义了 options 常量，然后将 parent 和 child 的选项都合并到 options 中，最后返回 options，这个options 被赋值给 vm.$options。

extends 和 mixins 的作用类似，都可以混入一些选项，参考 Vue 官网对 mixin 的介绍：“混入 (mixins) 是一种分发 Vue 组件中可复用功能的非常灵活的方式。混入对象可以包含任意组件选项。当组件使用混入对象时，所有混入对象的选项将被混入该组件本身的选项”。

注意：这里混入的是【组件选项】，目的是【将所有混入对象的选项都混入到对应组件本身的选项当中】。等下我们通过断点单步调试的方式，可以在浏览器中清晰的看到整个混入过程。

区别在于： child.extends 是一个纯对象，而 child.mixins 是一个数组。

接下来找到 dist/vue.esm.js，在第1461行写入 debugger，打个断点，如下：

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

### 在断点中查看初始的 parent

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/1.jpg)

### 在断点中查看初始的 child

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/2.jpg)

与上面整理的 mergeOptions 方法的前两个入参是一样的。

### child.extends

``` javascript
const extendsFrom = child.extends
if (extendsFrom) {
  parent = mergeOptions(parent, extendsFrom, vm)
}
```

当 child.extends 为真时，递归调用 mergeOptions，将 parent 和 extends 的选项合并到 options 上，然后给 parent 重新赋值为 options。

### child.mixins

``` javascript
if (child.mixins) {
  for (let i = 0, l = child.mixins.length; i < l; i++) {
    parent = mergeOptions(parent, child.mixins[i], vm)
  }
}
```

当 child.mixins 为真时，递归调用 mergeOptions，将 parent 和 mixins 的选项合并到 options 上，然后给 parent 重新赋值为 options。

递归调用之后，还是会回到下面的代码逻辑，现在就正式看下每一种选项的具体合并策略：

``` javascript
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
```

### components 组件选项的合并策略

### directives 指令选项的合并策略

### filters 过滤器选项的合并策略

filters 选项的合并策略函数同样是 mergeAssets：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/7.jpg)

### 声明周期各个钩子等选项的合并策略

### data 选项的合并策略

还有其他选项的合并策略，都在 src/core/util/options.js 文件中，可以通过断点单步调试的方式，顺便带着开发中遇到的问题，逐个了解。

### 总结

本节笔记记录了实例化 Vue 时，各个选项的合并策略，以及一些开发小技巧。

### 注意
本文最后编辑于2018/12/03，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。
