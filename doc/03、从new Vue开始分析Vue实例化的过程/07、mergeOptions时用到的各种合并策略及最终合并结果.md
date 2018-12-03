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

### data 选项的合并策略

``` javascript
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}
```

strats.data 方法就是 data 选项的合并策略函数，首先判断 vm 是否为真，当前策略函数是在 mergeOptions 方法内执行的，而 mergeOptions 方法的第三个参数就是 vm，我们最开始是从 new Vue 父类（非组件子类）开始的，这个 vm 指的就是 Vue 父类的实例化对象，而这里再次判断 vm 是否为真，说明当前策略函数的执行环境不同，也就是 mergeOptions 不单在 new Vue 的时候执行，肯定还在其他地方执行了。

这里总结下 mergeOptions 方法执行的4种情况：

1、Vue.mixin，实际上就是执行 mergeOptions ，将自定义的选项混入到 Vue 父类的 options 对象上；

``` javascript
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

Vue.mixin 方法混入自定义选项的时候，mergeOptions 方法没有传递第三个参数。

2、Vue.extend 子类继承：

``` javascript
Vue.extend = function (extendOptions: Object): Function {
  // ... 省略
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super
  // ... 省略
    return Sub
  }
```

组件子类继承父类的时候，mergeOptions 没有传递第三个参数。

3、实例化子组件，也就是通过 Vue.extend 继承父类的子类：

``` javascript
function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    // ... 省略
    options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
    // ... 省略
    }
  }
  return options
}
```
以上代码，如果 Ctor.super 为真，说明是实例化组件子类，则要再次执行 mergeOptions，没有传递第三个参数。

4、通过 new Vue 实例化 Vue 非组件父类：

``` javascript
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

以上代码，mergeOptions 传递了第三个参数。

也就是说：mergeOptions 函数执行的时候，除了通过 new Vue 实例化非组件父类的时候要传递第三个参数 vm，其他情况都不传递三个参数，以此作为区分，如果传递了第三个参数 vm，肯定是使用 new 关键字初始化 Vue 非组件父类。

继续看下面的代码：

``` javascript
if (!vm) {
  if (childVal && typeof childVal !== 'function') {
    process.env.NODE_ENV !== 'production' && warn(
      'The "data" option should be a function ' +
      'that returns a per-instance value in component ' +
      'definitions.',
      vm
    )

    return parentVal
  }
  return mergeDataOrFn(parentVal, childVal)
}
return mergeDataOrFn(parentVal, childVal, vm)
```

不管 vm 是否为真，最后都 return 返回 mergeDataOrFn 方法的执行结果，区别就是 !vm 的时候，mergeDataOrFn 方法不传第三个参数 vm，反之，传。

看下 mergeDataOrFn 函数：

``` javascript
/**
 * Data
 */
export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}
```

以上代码，先看 else 分支：

``` javascript
if (!vm) {
  // ... 省略
} else {
  return function mergedInstanceDataFn () {
    // instance merge
    const instanceData = typeof childVal === 'function'
      ? childVal.call(vm, vm)
      : childVal
    const defaultData = typeof parentVal === 'function'
      ? parentVal.call(vm, vm)
      : parentVal
    if (instanceData) {
      return mergeData(instanceData, defaultData)
    } else {
      return defaultData
    }
  }
}
```

使用 new 关键字实例化 Vue 的时候，就是走上面的 else 分支，直接 return 返回了 mergedInstanceDataFn ，它并没有执行。

其中 parentVal 是 Vue 全局静态属性 Vue.options.data，默认情况下肯定是 undefined （下面的笔记会说到其不为 undefined 的情况），childVal 就是 new Vue 时传入的 data 选项，中间判断 childVal 是否是 function ，赋值给 instanceData，在 new Vue 的时候传递了 data 选项，所以下面的判断 instanceData 为真，最后 return 返回 mergeData 的执行结果。

再来看下 if 分支：

``` javascript
if (!vm) {
  // in a Vue.extend merge, both should be functions
  if (!childVal) {
    return parentVal
  }
  if (!parentVal) {
    return childVal
  }
  // when parentVal & childVal are both present,
  // we need to return a function that returns the
  // merged result of both functions... no need to
  // check if parentVal is a function here because
  // it has to be a function to pass previous merges.
  return function mergedDataFn () {
    return mergeData(
      typeof childVal === 'function' ? childVal.call(this, this) : childVal,
      typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
    )
  }
} else {
  // ... 省略
}
```

!vm ，说明不是执行 new Vue 父类。接下来是连续两个判断：子不存在人会父，父不存在，返回子，在我们 new Vue 的时候，传了 data，说明 childVal 为真，但是 Vue.options 默认没有 data 选项，说明 parentVal 为假，这里返回 childVal。

如果 parentVal 和 childVal 都为真，则继续执行下面的代码（后面的笔记会讲到 parentVal 和 childVal 同时存在的情况）。return 返回了函数 mergedDataFn，与 else 分支一样，都是返回一个函数。

也就是说：合并 data 选项的策略函数，最终返回的是一个 function。这个 function 内的 mergeData 方法，等之后关于组件的笔记，再详细说明，我们暂时只需知道：“合并 data 选项的策略函数，最终返回的是一个 function”，重要的事情说2遍。

#### 继续上面遗留的问题，什么情况下 parentVal 和 childVal 同时存在

本节笔记，重点已经差不多写完了，parentVal 和 childVal 同时存在，会涉及到 Vue.mixin 的知识点，可以先参考笔记下一节笔记《[Vue.mixin实现原理和作用](https://github.com/zymfe/into-vue/blob/master/doc/03%E3%80%81%E4%BB%8Enew%20Vue%E5%BC%80%E5%A7%8B%E5%88%86%E6%9E%90Vue%E5%AE%9E%E4%BE%8B%E5%8C%96%E7%9A%84%E8%BF%87%E7%A8%8B/08%E3%80%81Vue.mixin%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86%E5%92%8C%E4%BD%9C%E7%94%A8.md)》，然后再回过头来看本节笔记剩余部分，会好一些。

知道了 Vue.mixin 的作用，我们用 vue-cli 初始化项目，在 main.js 中加入以下代码（new Vue 之前）：

``` javascript
Vue.mixin({
  data: function () {
    return {
      haha: 'haha',
      hehe: 'hehe'
    }
  }
});
```

以上代码执行完毕，Vue 父类的 options 选项将变为：

``` javascript
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
  _base: Vue,
  data: function () {
    return {
      haha: 'haha',
      hehe: 'hehe'
    }
  }
}
```

还是老规矩，打开 dist/vue.esm.js 文件，全局搜索 ，在函数体内第一行写入 debugger：

``` javascript
function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  debugger;
  if (!vm) {
    // ... 省略
  } else {
    // ... 省略
  }
}
```

在浏览器中连续 resume 执行下一个断点，直到 parentVal 和 childVal 都有值，因为我们前面通过 Vue.mixin 混入了 data 选项，然后到了子组件（如App.vue）实例化的时候也会 mergeOptions，所以这种情况下 parentVal 和 childVal 都是有值的。

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/10.jpg)

最后是执行到了 return function mergedDataFn，接下来断点单步执行，回到 mergeOptions 函数体内，看下合并完 data 选项之后，data 最后的值是不是一个名为 mergedDataFn 的 function，如下图：

![image](https://github.com/zymfe/into-vue/blob/master/example/mergeOptions/10.jpg)

还有其他选项的合并策略，都在 src/core/util/options.js 文件中，可以通过断点单步调试的方式，顺便带着开发中遇到的问题，逐个了解。

### 总结

本节笔记记录了实例化 Vue 时，各个选项的合并策略，以及一些开发小技巧。

### 注意
本文最后编辑于2018/12/03，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。
