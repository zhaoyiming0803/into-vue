Vue 的 github 仓库地址：[Vue](https://github.com/vuejs/vue)，不管怎么样，先 clone 到本地再说。

### Vue源码目录结构

<pre>
├── scripts                                           // 源码构建脚脚本
│   ├── git-hooks                                     // git钩子相关
│   ├── alias.js                                      // 路径别名配置
│   ├── config.js                                     // rollup 配置（vue源码使用rollup打包构建，类似webpack的webpakck.config.js）
│   ├── build.js                                      // rollup 构建（相当于node build/dev-server.js 或 node build/build.js）
│   ├── release.sh                                    // 用于自动发布新版本的脚本
├── dist                                              // Vue源码打包输出目录，跟我们平时执行cnpm run build 之后出现的dist目录一样
├── examples                                          // Vue 实例
├── flow                                              // Vue 使用 Flow 做类型检查，[Flow](https://flow.org/en/docs/getting-started/)
├── packages                                          // 存放独立发布的包的目录
├── test                                              // 测试文件目录
├── src                                               // Vue 源码目录
│   ├── compiler                                      // 编译相关（template->render）
│   ├── core                                          // Vue 核心代码，与运行平台无关（web或weex）
│   │   ├── observer                                  // 响应式式数据相关
│   │   ├── vdom                                      // 将vnode通过patch渲染到页面
│   │   ├── instance                                  // Vue 构造函数及对其做的“包装”
│   │   ├── global-api                                // Vue 构造函数本身的全局api（属性和方法）
│   │   ├── components                                // 抽象组件（keep-alive等）
│   ├── server                                        // 服务端渲染相关代码
│   ├── platforms                                     // 与 Vue 所在运行平台相关
│   │   ├── web                                       // web
│   │   │   ├── entry-runtime.js                      // 运行时的 Vue 代码，不包含compiler
│   │   │   ├── entry-compiler.js                     // 模板编译
│   │   │   ├── entry-runtime-with-compiler.js        // entry-runtime.js + entry-compiler.js = entry-runtime-with-compiler.js
│   │   │   ├── entry-server-renderer.js              // 服务端渲染的入口文件
│   │   │   ├── entry-server-basic-renderer.js        // 在 scripts/config.js 的 web-server-renderer-basic 配置项中使用
│   │   ├── weex                                      // weex，目前尚未深入研究
│   ├── sfc                                           // vue文件的编译逻辑
│   ├── shared                                        // 包含很多公用的util方法
├── package.json                                      // Vue 项目配置信息
</pre>

### 注意
本文最后编辑于2018/11/18，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。
