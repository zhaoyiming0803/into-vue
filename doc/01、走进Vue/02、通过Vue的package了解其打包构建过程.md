### 找到构建配置文件

现在都用 vue-cli 初始化 Vue项目，在 main.js 中会引入 vue：

``` javascript
import Vue from 'vue';
```

这里的 'vue' 其实是路径别名，打开 /build/webpack.base.conf.js，有如下代码片段：

``` javascript
module.exports = {
  entry: {
    app: './src/main.js'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
	resolve: {
		extensions: ['.js', '.vue', '.json'],
		alias: {
		'vue$': 'vue/dist/vue.esm.js',
		'@': resolve('src'),
		'static': resolve('static')
	}
}
```

resolve.alias 就是用于路径别名配置的，这样我们在项目中导入一个文件，可以省下很多代码，同时也能减少出错。'vue$'对应'vue/dist/vue.esm.js'，我们可以在node_modules目录下找到 vue 源码目录。

先来看 package.json，这里包括了 Vue 项目的基本信息。我现在使用的版本是 2.5.17-beta.0。

下面两个字段很重要：

``` javascript
"main": "dist/vue.runtime.common.js", // 用于 webpack1
"module": "dist/vue.runtime.esm.js", //  用于 webpack2 和 rollup
```

scripts 字段很熟悉了，我们平时总是 npm run dev 、 npm run build 等命令都是在这儿配置，这里仅有 web 平台相关的3中配置，其他平台包括 server 、 weex， 我暂时还没有太深入的研究。

``` javascript
// 完整版 umd 模块
"dev": "rollup -w -c scripts/config.js --environment TARGET:web-full-dev",
// 运行时 cjs 模块
"dev:cjs": "rollup -w -c scripts/config.js --environment TARGET:web-runtime-cjs",
// 运行时 es 模块
"dev:esm": "rollup -w -c scripts/config.js --environment TARGET:web-runtime-esm",
```

Vue 构建输出包括umd（可通过 script 标签引入）、cjs（webpack1中使用）、es(webpack或rollup中使用)三种。因为 Vue 是使用 rollup 构建的，所以我们打开 /scripts/config.js 文件：

``` javascript
const banner =
  '/*!\n' +
  ' * Vue.js v' + version + '\n' +
  ' * (c) 2014-' + new Date().getFullYear() + ' Evan You\n' +
  ' * Released under the MIT License.\n' +
  ' */'

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

banner是构建出口文件顶部的注释信息，通过这样的配置，构建出不同平台下用不同方式引入 Vue 的不同版本。

### 构建为什么要区分【运行时版】和【完整版】呢？

我们知道，Vue 将数据经过一系列的处理，最终要将模板编译并渲染到页面，但是编译不需要在代码运行的时候去做，可以放到打包构建的时候做，这样提升了代码运行时的性能，而且运行时代码省去了compiler部分，还能节省代码体积。在《Vue目录结构说明》中，有这样一段注释：entry-runtime.js + entry-compiler.js = entry-runtime-with-compiler.js

### 以 entry-runtime-with-compiler 为例了解整个构建配置过程

entry 是入口文件 resolve('web/entry-runtime-with-compiler.js')，dest 是构建出口文件 resolve('dist/vue.esm.js')，这里并没有明确的指出入口或出口文件是哪个，而是执行 resolve 方法并传参来解析的，看下 resolve 函数的执行过程，在 builds 常量的上边有这样一段代码：

``` javascript
const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}
```

以入口文件的 resolve 参数为例：resolve('web/entry-runtime-with-compiler.js')，resolve 函数在执行的时候，很明显，base 常量是 字符串 web，下面判断 aliases[base] 也就是 aliases.web 是否为真，aliases 是引用当前目录下的 alias.js 文件，打开看下，所有代码如下：

``` javascript
const path = require('path')
const resolve = p => path.resolve(__dirname, '../', p)
module.exports = {
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  compiler: resolve('src/compiler'),
  core: resolve('src/core'),
  shared: resolve('src/shared'),
  web: resolve('src/platforms/web'),
  weex: resolve('src/platforms/weex'),
  server: resolve('src/server'),
  entries: resolve('src/entries'),
  sfc: resolve('src/sfc')
}
```

根据文件名就可以知道，这里做了一些文件路径的别名配置，显然，aliases.web = resolve('src/platforms/web')，在 alias.js 文件中也定义了个 resolve 函数，所以这里的 aliases.web 最终解析并指向 /src/platforms/web，也就是 Vue 项目根目录下的 src/platforms/web。

上面的 if 条件判断为 true，下面返回最终的 entry 入口文件地址：
``` javascript
return path.resolve(aliases[base], p.slice(base.length + 1))
// 等价于
return path.resolve('src/platforms/web', 'entry-runtime-with-compiler')
```

通过以上分析，确定最终的 entry 路径：src/platforms/web/entry-runtime-with-compiler.js，先打开看看，其实就做了2件事，引入 Vue，并且在 Vue 原型上挂载 $mount 方法。

现在找到了 rollup 构建命令，也找到了构建的入口文件，只需执行 npm run 对应的命令，即可构建出我们想要的 Vue 版本。

继续 /scripts/config.js 中剩余代码：

``` javascript
function genConfig (name) {
  // ... 省略
};

if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET)
} else {
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
```

最终判断 process.env.TARGET 是否为真，使用 module.exports 或 exports 导出 genConfig，在 genConfig 中就是将 builds 中的配置项格式转成 rollup 构建所需的格式，执行构建即可。

### 注意
本文发布于2018/11/18，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。