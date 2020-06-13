了解了 Vue 的整体构成及打包输出，下面开始进入 Vue 构造函数，看下它有哪些静态属性和方法及原型上的属性和方法。

在之前的笔记 [通过Vue的package了解其打包构建过程](https://github.com/zhaoyiming0803/into-vue/blob/master/docs/01%E3%80%81%E8%B5%B0%E8%BF%9BVue/02%E3%80%81%E9%80%9A%E8%BF%87Vue%E7%9A%84package%E4%BA%86%E8%A7%A3%E5%85%B6%E6%89%93%E5%8C%85%E6%9E%84%E5%BB%BA%E8%BF%87%E7%A8%8B.md) 中用到的构建模式是 web-full-esm，再贴下代码：

``` javascript
const builds = {
  // 这里省略其他配置 ...
  // Runtime+compiler CommonJS build (ES Modules)
  'web-full-esm': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
    dest: resolve('dist/vue.esm.js'),
    format: 'es',
    alias: { he: './entity-decoder' },
    banner
  },
  // 这里省略其他配置...
}
```

可以看到 web-full-esm 是构建出 Runtime + compiler 版本，并且格式是 ES Module，所以我们通过 entry 路径，找到它的入口文件，也就是 web/entry-runtime-with-compiler.js，打开之后，看到这样一段代码：

``` javascript
import Vue from './runtime/index'
```

说明当前脚本并不是定义 Vue 构造函数的源文件，继续寻找 ./runtime/index.js，代码如下：

``` javascript
import Vue from 'core/index'
```

这里还不是 Vue 构造函数源文件，按照源码中 import from 的路径一直找下去，可以发现：定义 Vue 构造函数的源文件是 src/core/instance/index.js，整个脚本的代码并不多，只是引入一些依赖文件，然后定义 Vue，接着是执行各种 mixin 方法，最后导出 Vue，代码如下：

``` javascript
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

用 vue-cli 脚手架生成的项目，在 main.js 文件的最上面有这样一段代码：

``` javascript
import Vue from vue;

const App from './components/App';

// ... 省略

new Vue({
  el: '#app',
  render: h => h(App);
});
```

new Vue是对 Vue 构造函数初始化，但是首先会执行上面的 import，下面的笔记将详细介绍 import Vue from vue 的时候，Vue 做了哪些初始化工作来“包装” Vue 构造函数。

### 注意
本文最后编辑于2018/11/25，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。