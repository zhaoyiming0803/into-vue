本节算是第四节笔记和下面第七节笔记的过渡。

第四节笔记中讲到发布订阅模式

本节笔记概括下 Vue 中的 Watcher、Dep、Observer 类与发布订阅模式的关系

第七节笔记通过源码的方式再加深理解。

### Vue 中的 Watcher

顾名思义，观察者、依赖、订阅者，其他都是同一个概念，就是第四节笔记中的“通信员”，在 Vue中，Watcher 是个表达式或函数。

我们的 Vue 代码如下：

```html
<template>
  <div>
    姓名：{{uname}}
  </div>
</template>

<script scoped>
  export default {
    data () {
      return {
        uname: 'zhaoyiming',
        age: 18,
        love: {
          sport: 'ping pang',
          fruit: 'apple'
        }
      }
    },

    watch: {
      age: function (oldVal, newVal) {
        console.log('长大啦');
      }
    }
  }
</script>
```

表达式：{{uname}} 和 watch 中 age 对应的 function 都是观察者，他们分别订阅者 uname 和 age 两个字段，当这两个字段发生变化时，执行各自的回调，表达式的回调就是重新渲染模板，watch 的回调就是重新执行对应的回调函数。

### Vue 中的 Observer

每个被观测的对象，都会添加一个 __ob__ 属性，其值就是 Observer 类的实例。当前这个值就是响应式的，一旦它发生变化，就会通知上文的 Watcher 更新。

那么怎么通知呢？通过 Dep。

### Vue 中的 Dep

Dep 可以说是 Observer 和 Watcher 的中间层，它是一座桥梁，建立起 Observer 和 Watcher 的关系。

下一节笔记，将从 new Observer 类开始，逐步深入源码，理解响应式原理。

### 注意
本文最后编辑于2019/05/12，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。