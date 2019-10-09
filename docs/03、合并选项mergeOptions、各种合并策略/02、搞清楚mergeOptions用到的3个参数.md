我们用 vue-cli 初始化项目，那么实例化 Vue 构造函数肯定是在 mains.js 中，简单代码如下：

``` javascript
import Vue from 'vue'
import App from './App'
new Vue({
  el: '#app',
  data () {
    return {
      uname: 'zhaoyiming'
    }
  },
  beforeCreate () {},
  created () {},
  beforeMount () {},
  mounted () {},
  beforeUpdate () {},
  updated () {},
  beforeDestory () {},
  destroyed () {}
  render: h => h(App)
})
```

在 Vue 源码中找到 Vue 构造函数，路径是 src/core/instance/index.js，代码如下：

``` javascript
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

首先通过 this instanceof Vue 判断 Vue构造函数是否是通过 new 关键字调用的，如果不是的话，就给出提示。

然后执行 this.init(options)，在之前的笔记《[用于初始化Vue原型的各种mixin方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/02%E3%80%81%E7%94%A8%E4%BA%8E%E5%88%9D%E5%A7%8B%E5%8C%96Vue%E5%8E%9F%E5%9E%8B%E7%9A%84%E5%90%84%E7%A7%8Dmixin%E6%96%B9%E6%B3%95.md)》中提到，Vue 内部使用的 _init 方法是在 src/core/instance/init.js 文件的 initMixin 中被定义的，打开这个文件，来分析我们主要用到的代码：

``` javascript
const vm: Component = this
// a uid
vm._uid = uid++
// a flag to avoid this being observed
vm._isVue = true
```

1、定义 vm 常量指向 this，也就是实例化的对象；

2、在 vm 上定义私有属性 _uid，uid 是一个全局变量，Vue 构造函数每次被实例化，uid 都会 +1；

3、在 vm 上定义私有属性 _isVue，默认值为 true，表示它是一个 Vue 实例，到时候 vm 对象将不会被添加到响应式系统的 watcher。

下面是合并选项：

``` javascript
// merge options
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

options 就是我们在 new Vue 时传入的参数，首先判断 options._isComponent 是否为真，我们在 main.js 中执行 new Vue 的时候，options._isComponent = undefined，所以初始化根 Vue 的时候，执行 else 分支内的代码。

注意：_isComponent 这个私有属性是在组件实例化的时候被添加的，后面在组件相关的笔记中会详细介绍。

走到 else 分支，vm.$options 是执行 mergeOptions 方法获取的，mergeOptions 方法有3个参数：

第一个是 resolveConstructorOptions 方法的返回值，它在执行的时候传入 vm.constructor，也就是当前实例的构造函数 Vue，目前 this 就是普通的 Vue 构造函数的实例对象，后面通过 Vue.extend 实现子类继承的时候，vm.constructor 指的就是子类；

第二个是我们 new Vue 时传入的 options 对象；

第三个是当前实例化的对象vm，也就是 this。

首先搞清楚 resolveConstructorOptions 函数做了什么事情，返回值是什么。它也被定义在当前文件中，代码如下：

``` javascript
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    // ... 这里是实例化子组件时要用到，在后面的组件相关笔记中会详细介绍，先省略
  }
  return options
}
```

Ctor 指的是 Vue 构造函数，目前 Vue 构造函数上并没有 super 这个属性，它是在 Vue.extend 时被添加的，后面的笔记中会介绍。现在就是直接返回了 options。

通过之前的笔记《[总结目前挂载到Vue构造函数上的静态属性和方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/06%E3%80%81%E6%80%BB%E7%BB%93%E7%9B%AE%E5%89%8D%E6%8C%82%E8%BD%BD%E5%88%B0Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0%E4%B8%8A%E7%9A%84%E9%9D%99%E6%80%81%E5%B1%9E%E6%80%A7%E5%92%8C%E6%96%B9%E6%B3%95.md)》可知，目前 Vue 的 options 属性如下：

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
```

那么以下代码：

``` javascript
vm.$options = mergeOptions(
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
)
```

就等同于：

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

下面就正式开始执行 mergeOptions 方法了，其具体逻辑在下节笔记中展开。

### 注意
本文最后编辑于2018/12/01，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。