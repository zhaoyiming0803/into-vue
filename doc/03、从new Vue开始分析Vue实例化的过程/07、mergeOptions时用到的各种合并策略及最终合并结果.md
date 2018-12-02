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

# child.mixins

``` javascript
if (child.mixins) {
  for (let i = 0, l = child.mixins.length; i < l; i++) {
    parent = mergeOptions(parent, child.mixins[i], vm)
  }
}
```

当 child.mixins 为真时，递归调用 mergeOptions，将 parent 和 mixins 的选项合并到 options 上，然后给 parent 重新赋值为 options。

递归调用之后，还是会回到接下来的合并逻辑，现在就正式看下每一种选项的具体合并策略：

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

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/3.jpg)

mergeField 方法主要做2件事情：

1、确定对应选项的合并策略函数 strat；

2、将合并之后的值赋给 options 对应的选项。

从断点中可以看出，components 选项的合并策略函数是 mergeAssets，它定义在 src/core/util/options.js 文件中，代码如下：

``` javascript
/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})
```

mergeAssets 要做的事情是：

1、定义常量 res；

2、将 parentVal 的值放到 res 对象的原型上；

3、如果 childVal 为真，则通过 extend 方法桥拷贝合并 res 和 childVal，注意，childVal 是放到了 res 对象的属性上，而不是原型上。如果 childVal 为假，则直接返回 res。

4、返回合并后的结果 res。

通过断点印证以上结论：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/4.jpg)

### directives 指令选项的合并策略

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/5.jpg)

directives 的合并策略函数也是 mergeAssets，我们在 new Vue 时，extends 上混入了 directives ，Vue 本身内置有 v-model 、 v-show：

``` javascript
directives: {
  a: {
    bind: function (el) {}
  }
}
```

则最终的合并结果是：我们自定义的指令合并到 res 的属性上，而 Vue 内置的指令被合并到 res 的原型上，查看断点：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/6.jpg)

之所以将 Vue 默认的选项放到对象原型上，而自定义的选项放到对象属性上，是因为 JavaScript 放到对象的某个属性或方法，是先私有属性，如果私有属性上找不到，就到原型上找，这样既可避免同名选项冲突，又可以以自定义选项为先。以下小小的测试：

``` javascript
var person = {
  name: 'zym'
};

person.__proto__ = {
  name: 'zhaoyiming',
  age: 18
};

console.log(person.name); // zym
console.log(person.age);  // 18
```

### filters 过滤器选项的合并策略

filters 选项的合并策略函数同样是 mergeAssets：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/7.jpg)

### 声明周期各个钩子等选项的合并策略

对于 beforeCreate 、 created 、beforeMount ... 等声明周期钩子函数来讲，它们的合并策略是相同的，但不是 mergeAssets，以 created 为例：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/8.jpg)

可以看到，声明周期钩子函数使用的合并策略函数是 mergeHook，它同样被定义在 src/core/util/options.js 文件中：

``` javascript
/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})
```
合并过程是：连续判断 parentVal 和 childVal 是否存在，最终返回的是数组，数组中包括 parentVal 和 childVal 中 对一个的声明周期钩子函数，断点中看下：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/9.jpg)

合并为数组之后，每个组件中执行各个声明周期函数，其实就是通过 callhook 函数遍历当前数组，挨个执行如 created 函数：

``` javascript
callHook(vm, 'beforeCreate')
callHook(vm, 'created')
callHook(vm, 'beforeMount')
// ... 等等
```

callhook 方法在后面组件相关笔记中详细介绍。

### props 、methods、inject、computed 等选项的合并策略：

``` javascript
/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
```

代码很简单，parentVal 中的选项放到 res 的原型上，childVal 中的选项放到 res 内部属性上，中间通过 assertObjectType 方法做了个判断，代码如下：

``` javascript
function assertObjectType (name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}
```

规定 methods 等选项的 key 必须是对象，否则在开发环境会报警告。

还有其他选项的合并策略，都在 src/core/util/options.js 文件中，可以通过断点单步调试的方式，顺便带着开发中遇到的问题，逐个了解。

### 总结

本节笔记记录了实例化 Vue 时，各个选项的合并策略，以及一些开发小技巧。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。
