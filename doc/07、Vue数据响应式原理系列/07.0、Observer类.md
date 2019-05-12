Observer 类定义在 /src/core/observe/index.js 文件中，其构造函数如下：

``` javascript
/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
}
```

初始化三个属性值，value、dep、vmCount。然后通过以下方式初始化 __ob__ 属性，其值为当前 Observer 示例 this，为什么要用 def 呢？不能直接 value.__ob__ = this 吗？我们看下 def 函数做了哪些事情？

``` javascript
/**
 * Define a property.
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```

使用 def 函数，将对象 value 的属性 __ob__ 变得不可枚举，也就是无法通过 Object.keys 遍历到。

接下来判断 value 是数组还是纯对象，因为 JavaScript 语言本身的问题，数组元素的下标是无法通过 Object.defineProperty 设置为访问器属性的，所以这里得做个区分：

``` javascript
if (Array.isArray(value)) {
  // ...省略
} else {
  this.walk(value)
}
```

下节笔记，我们看 walk 方法做了哪些事情？

### 注意
本文最后编辑于2019/05/12，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。