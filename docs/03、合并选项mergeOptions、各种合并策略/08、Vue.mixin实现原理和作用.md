上一节笔记学习了 Vue 选项的各种合并策略，其中涉及到 mixins 选项，其实就是将 mixins 定义为对象，然后逐个将这个对象上的属性进行合并。除此之外，Vue 还为开发者提供了 Vue.mixin 混入接口，在之前的笔记《[总结目前挂载到Vue构造函数上的静态属性和方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/06%E3%80%81%E6%80%BB%E7%BB%93%E7%9B%AE%E5%89%8D%E6%8C%82%E8%BD%BD%E5%88%B0Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0%E4%B8%8A%E7%9A%84%E9%9D%99%E6%80%81%E5%B1%9E%E6%80%A7%E5%92%8C%E6%96%B9%E6%B3%95.md)》中有记录 Vue.mixin 这种全局静态方法，它被定义在 src/core/global-api/mixin.js 文件中，打开：

``` javascript
import { mergeOptions } from '../util/index'
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

引入 mergeOptions 方法，这个我们在上一节笔记中已经了解的很清楚了。然后将 mergeOptions 方法执行的结果赋值给 this.options，这里要搞清楚，this 指的是 Vue 构造函数，而不是实例对象 vm。

使用方法如下：

``` javascript
Vue.mixin({
  created () {
    console.log('Vue.mixin created');
  },
  mounted () {
    console.log('Vue.mixin mounted');
  }
});
```

它一定是在 new Vue 之前执行的，也就是前面先混入，后面才能用。上面的代码以混入两个声明周期钩子函数为例， Vue.mixin 方法执行的时候，等价于：

``` javascript
Vue.mixin = function (mixin: Object) {
  // this.options
  var options = {
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
  // Vue.mixin 方法的第二个参数
  var mixin = {
    created () {
      console.log('Vue.mixin created');
    },
    mounted () {
      console.log('Vue.mixin mounted');
    }
  };
  this.options = mergeOptions(options, mixin)
  return this
}
```

初始的 this.options 同样在之前的笔记《[总结目前挂载到Vue构造函数上的静态属性和方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/06%E3%80%81%E6%80%BB%E7%BB%93%E7%9B%AE%E5%89%8D%E6%8C%82%E8%BD%BD%E5%88%B0Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0%E4%B8%8A%E7%9A%84%E9%9D%99%E6%80%81%E5%B1%9E%E6%80%A7%E5%92%8C%E6%96%B9%E6%B3%95.md)》中有记录，可以作为回顾。

通过 Vue.mixin 混入的选项是全局的，因为它直接被混入到 Vue 父类的构造函数上，后期每个组件 Vue 子类在实例化的时候，都会执行 mergeOptons，然后接着上节笔记的逻辑，执行各种合并策略。

上面的 created 钩子函数中打印 Vue.mixin created，mounted 钩子函数中打印 Vue.mixin mounted，可以做个测试，有多少个 Vue 类（子类或父类）被实例化，它们就会被打印多少次。

测试代码可参考：[Vue.mixin](https://github.com/zymfe/into-vue/tree/master/examples/Vue.mixin)

最后的打印结果为：

![image](https://github.com/zymfe/into-vue/blob/master/examples/Vue.mixin/1.jpg)

Vue 构造函数父类，app 组件 和 hello 组件子类， 共 3个 Vue 类，mixin 中的 created 被执行了3次，Vue.mixin created 被打印了3次。

还有一个发现：created 是从 父 到 子 执行的，mounted 是 从 子 到 父 执行的，这个就是组件渲染 patch 的顺序，是一个树状的结构，后面的组件相关笔记中会详细介绍。

### 参考

[Vue官网对mixin的介绍](https://cn.vuejs.org/v2/guide/mixins.html)

### 总结

本节笔记学习了 Vue.mixin 的使用方法及实现原理。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。