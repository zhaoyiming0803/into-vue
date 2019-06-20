继续分析 src/core/util/options.js 中的 mergeOptions 方法，接下来是执行 normalizeProps 方法，

``` javascript
normalizeInject(child, vm)
```

normalizeInject 方法所有代码如下：

``` javascript
/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}
```

inject 属性与 props 的作用类似，也是为了父子组件能够互通数据，相比较 props ，inject 属性在平时开发工作中较少用到，因为 props 已经能够满足大部分需求了，但是 Vue 微我们提供了这个功能，所以还是来看下它的实现原理吧。

### 判断是否存在 inject 选项

如果不存在 inject 选项，直接 return 。

### 判断 inject 选项是否是数组

``` javascript
if (Array.isArray(inject)) {
  for (let i = 0; i < inject.length; i++) {
    normalized[inject[i]] = { from: inject[i] }
  }
}
```

代码很简单，如果 inject 是数组，则最终也要格式化为 JSON 对象。

假如 inject 的值为：

``` javascript
{
  inject: ['person']
}
```

经过以上处理，normzlize 之后的 inject 格式为：

``` javascript
{
  inject: {
    person: {
      from: 'person'
    }
  }
}
```

因为 inject 不需要像 props 一样在子组件标签上绑定数据，所以这里不用使用类似 camelize 的方法来格式化 key。

### 如果 inject 选项是 JSON 对象

``` javascript
else if (isPlainObject(inject)) {
  for (const key in inject) {
    const val = inject[key]
    normalized[key] = isPlainObject(val)
      ? extend({ from: key }, val)
      : { from: val }
  }
}
```

extend 方法在之前的笔记中介绍过，就是一个简单的浅拷贝，它在 src/shared/util.js 文件中。

假如 父组件中 provide 的 person 值为：

``` javascript
{
  provide: {
    person: {
      name: 'zymfe',
      skil: {
        skil1: 'HTML',
        skil2: 'CSS',
        skil3: 'JavaScript'
      }
    }
  },
}
```

子组件中 inject 为：

``` javascript
{
  inject: {
    person: {}
  }
}
```

经过以上处理，normzlize 之后的 inject 格式为：

``` javascript
{
  inject: {
    person: {
      from: 'person'
    }
  }
}
```

组件实例化过程中，还会对 inject 做进一步处理，最终解析为：

``` javascript
{
  inject: {
    person: {
      name: {
        from: 'zymfe'
      },
      skill: {
        from: 'skill',
        // ... 其他父组件中注入的属性
      }
    }
  }
}
```
### 开发环境下，inject 选项既不是数组，也不是 JSON 对象

``` javascript
else if (process.env.NODE_ENV !== 'production') {
  warn(
    `Invalid value for option "inject": expected an Array or an Object, ` +
    `but got ${toRawType(inject)}.`,
    vm
  )
}
```
找到 dist/vue.esm.js，在第1393行写入 debugger，打个断点，如下：

``` javascript
/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options, vm) {
  debugger;
  // ... 省略
}
```

然后在浏览器中单步调试，可以印证下以上结果。

### 总结

通过本节源码笔记，我们知道了子组件中 inject 的两种写法，以及这两种写法在 Vue 中被转换成的最终格式。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。