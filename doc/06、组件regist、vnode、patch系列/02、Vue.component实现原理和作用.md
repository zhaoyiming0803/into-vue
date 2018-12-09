Vue 组件分为 全局公用组件 和 局部私有组件，其实局部组件在之前的笔记《[components组件选项的合并策略](https://github.com/zymfe/into-vue/blob/master/doc/03%E3%80%81%E5%90%88%E5%B9%B6%E9%80%89%E9%A1%B9mergeOptions%E3%80%81%E5%90%84%E7%A7%8D%E5%90%88%E5%B9%B6%E7%AD%96%E7%95%A5/07.1%E3%80%81components%E7%BB%84%E4%BB%B6%E9%80%89%E9%A1%B9%E7%9A%84%E5%90%88%E5%B9%B6%E7%AD%96%E7%95%A5.md)》中已经说过，本节笔记重点介绍 全局组件的注册及使用方法。

注册全局组件的方式如下：

``` JavaScript
import hello from './components/hello';
Vue.component('hello', hello);
```

然后在项目内任意一个组件中，都可以使用 hello 组件。本节笔记实例代码地址：[Vue.component](https://github.com/zymfe/into-vue/tree/master/example/Vue.component)

平时开发项目大多数都是用第三方的组件，移动端的 vux，后台管理系统的 element-ui，因为这些开源项目为了满足大众需求，一般都内置很多的组件，但我们并不是全部都会用到，这个时候可以使用 Vue.component 来选择性的注册某些组件，也是减少项目打包提及的一种方式。

Vue.component 被定义在 src/core/global-api/assets.js 文件中：

``` javascript
export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        // ... 省略
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
        // ... 省略
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
```

initAssetRegisters 为我们提供了 全局注册 component、directive 等功能，这个 function 在之前的合并选项相关笔记中有提到。

以上代码，只看 else 分支部分，其实就做了2件事：

1、定义当前组件的 name ；

2、hello.vue 中的代码通过 Vue.loader 会转为一个 json 对象，将作为 Vue.extend 方法的参数，执行 Vue.extend 方法后生成Vue 子类，也可以说是子组件类。

![image](https://github.com/zymfe/into-vue/blob/master/example/Vue.component/3.jpg)

在前面的笔记《[用于初始化Vue全局API的initGlobalAPI方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/03%E3%80%81%E7%94%A8%E4%BA%8E%E5%88%9D%E5%A7%8B%E5%8C%96Vue%E5%85%A8%E5%B1%80API%E7%9A%84initGlobalAPI%E6%96%B9%E6%B3%95.md)》中提到，this.optiinos._base 就是 Vue 父类本身。

参考下节笔记《[Vue.extend子类继承](https://github.com/zymfe/into-vue/blob/master/doc/06%E3%80%81%E7%BB%84%E4%BB%B6regist%E3%80%81vnode%E3%80%81patch%E7%B3%BB%E5%88%97/03%E3%80%81Vue.extend%E5%AD%90%E7%B1%BB%E7%BB%A7%E6%89%BF.md)》了解 Vue.extend 做了哪些事情。

在 dist/vue.esm.js 文件中，找到 initAssetRegisters 方法，然后在方法体中打个 debugger，浏览器中看下效果，默认的全局组件是：

![image](https://github.com/zymfe/into-vue/blob/master/example/Vue.component/1.jpg)

参考之前的笔记：《[总结下目前挂载到 Vue 构造函数上的静态属性和方法](https://github.com/zymfe/into-vue/blob/master/doc/02%E3%80%81Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0/06%E3%80%81%E6%80%BB%E7%BB%93%E7%9B%AE%E5%89%8D%E6%8C%82%E8%BD%BD%E5%88%B0Vue%E6%9E%84%E9%80%A0%E5%87%BD%E6%95%B0%E4%B8%8A%E7%9A%84%E9%9D%99%E6%80%81%E5%B1%9E%E6%80%A7%E5%92%8C%E6%96%B9%E6%B3%95.md)》

执行完 Vue.component 之后的全局组件是：

![image](https://github.com/zymfe/into-vue/blob/master/example/Vue.component/2.jpg)

### 总结

Vue.component 方法将组件对象挂载到 Vue.options 全局静态属性上，这样每个子类（子组件）在继承父类和实例化的时候，都会执行 mergeOptions，将全局的组件再挂载到实例对象的 prototype 上，这样子组件中就能使用全局注册的组件了。

### 注意
本文最后编辑于2018/12/09，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。