mergeOptions 方法定义在 src/core/util/options.js 文件中，打开它：

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
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }

  if (typeof child === 'function') {
    child = child.options
  }

  // ... 省略
  return options
}
```

从注释中可知，mergeOptions 方法在 Vue 类实例化和继承中使用。首先判断，如果当前是开发环境，就 执行 checkComponents 方法校验组件名称，参数 child 指的是我们通过 new Vue 传入的对象，具体可参考上一节笔记。

checkComponents 方法也是定义在当前文件中，代码如下：

``` javascript
/**
 * Validate component names
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}
```

使用 for in 遍历 options.components 对象，显然这是在组件中注册使用局部子组件时要用到的，简单来看下，找到 validateComponentName 方法，它就在 checkComponents 方法的下面，代码如下：

``` javascript
export function validateComponentName (name: string) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}
```

通过2个 if 判断来校验组件名称，总结下就是：

1、组件名称必须以字母开头，以任意零个或多个 字符 或 - 中划线 结尾的字符串。

2、组件名称不能是 html 内置的标签，如 header 、 footer 、 div 等等。

记得第一次使用 Vue 开发移动端项目时，我就写了一个头部公共组件，然后在其他组件中调用，组件名称就是 header，不出所料的报错了，就是这个原因。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。