callHook 函数位于 src/core/instance/lifecycle.js 文件中：

``` javascript
export function callHook (vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget()
  const handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm)
      } catch (e) {
        handleError(e, vm, `${hook} hook`)
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}
```

之前的笔记 [生命周期各个钩子等选项的合并策略](https://github.com/zhaoyiming0803/into-vue/blob/master/docs/03%E3%80%81%E5%90%88%E5%B9%B6%E9%80%89%E9%A1%B9mergeOptions%E3%80%81%E5%90%84%E7%A7%8D%E5%90%88%E5%B9%B6%E7%AD%96%E7%95%A5/07.3%E3%80%81%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E5%90%84%E4%B8%AA%E9%92%A9%E5%AD%90%E7%AD%89%E9%80%89%E9%A1%B9%E7%9A%84%E5%90%88%E5%B9%B6%E7%AD%96%E7%95%A5.md) 中说到：生命周期钩子的合并策略函数是 mergeHook，代码如下：

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
```

我们的代码为了公用，有时候会使用 Vue.mixin ，Vue 会将同类生命周期钩子函数合并到一个数组当中，实例化 Vue 子类的时候，通过 mergeHook 遍历执行同类型钩子：

``` javascript
for (let i = 0, j = handlers.length; i < j; i++) {
  try {
    handlers[i].call(vm)
  } catch (e) {
    handleError(e, vm, `${hook} hook`)
  }
}
```
因为这些钩子函数的内容是开发者自定义的，为了避免一些不可预知的问题，将 handler 放到 try catch 中捕获可能出现的错误。

### 注意
本文最后编辑于2019/03/31，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。