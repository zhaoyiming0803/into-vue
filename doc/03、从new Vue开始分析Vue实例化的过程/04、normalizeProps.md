继续分析 src/core/util/options.js 中的 mergeOptions 方法，接下来是执行 normalizeProps 方法，

``` javascript
normalizeProps(child, vm)
```

normalizeProps 方法所有代码如下：

``` javascript
/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}
```

首先要知道，props 选项是父子组件共享状态值的其中一种方式，在实例化 Vue 的时候并没有传入 props 选项，它是在 组件类实例化时用到的，但我们在平时开发项目时对 props 并不陌生，所以可以在当前笔记中展开分析，在后面的组件相关笔记中，肯定还会回来回顾这一段。

### 判断是否存在 props 选项

不存在 props 选项，直接 return 。

### 判断 props 选项是否是数组

``` javascript
if (Array.isArray(props)) {
  i = props.length
  while (i--) {
    val = props[i]
    if (typeof val === 'string') {
      name = camelize(val)
      res[name] = { type: null }
    } else if (process.env.NODE_ENV !== 'production') {
      warn('props must be strings when using array syntax.')
    }
  }
}
```

如果是数组，则通过 while 循环获取到每个数组元素，并进一步判断当前元素是否是字符串，如果不是，则抛出提示。

通过 camelize 方法格式化每个 prop，它的最终目标是：将类似 hello-world 这样的 prop 格式化为 helloWorld 这种格式。

camelize 方法定义在 src/shared/util.js 文件中，相关代码如下：

 ``` javascript
 /**
 * Create a cached version of a pure function.
 */
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

/**
 * Camelize a hyphen-delimited string.
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
```

camelize 实际是 cached 方法的返回值，而 cached 最终返回的是 cachedFn 方法。为什么要这么设计呢？其实在 cached 方法内部保存了一个闭包变量 cache，cachedFn 内要读取 cache 这个变量，这样 cache 变量不用暴露在 windows 对象上，也不会污染或影响其他地方的同名cache 变量，我们在今天的代码中，也可以使用这种非常巧妙的技巧。

cachedFn 内判断，如果 cache[str] 已经存在，就直接返回，如果不存在，则执行 fn 函数，也就是 cached 函数传入的参数，它内部使用正则做了 replace，结果就是将类似 hello-world 这样的 prop 格式化为 helloWorld 这种格式。

假如 props 的值为：

``` javascript
{
  props: ["hello-world"]
}
```
经过以上处理，normzlize 之后的 props 格式为：

``` javascript
{
  props: {
    helloWorld: {
      type: null
    }
  }
}
```

组件实例化过程中，还会对 props 做进一步处理。

### 判断 props 选项是否是 JSON 对象

``` javascript
else if (isPlainObject(props)) {
  for (const key in props) {
    val = props[key]
    name = camelize(key)
    res[name] = isPlainObject(val)
      ? val
      : { type: val }
  }
}
```

假如 props 的值为：

``` javascript
{
  props: {
    "place-holder": "mock one",
    person: {
      name: 'zhaoyiming',
      age: 18
    }
  },
}
```
经过以上处理，normzlize 之后的 props 格式为：

``` javascript
{
  props: {
    placeHolder: {
      type: 'mock one'
    },
    person: {
      type: {
        name: 'zhaoyiming',
        age: 18
      }
    }
  }
}
```

### props 选项既不是数组，也不是 JSON 对象

``` javascript
else if (process.env.NODE_ENV !== 'production') {
  warn(
    `Invalid value for option "props": expected an Array or an Object, ` +
    `but got ${toRawType(props)}.`,
    vm
  )
}
```

找到 dist/vue.esm.js，在第153行写入 debugger，打个断点，如下：

``` javascript
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    debugger;
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}
```

然后在浏览器中单步调试，可以印证下以上结果。

### 参考

[Vue 官网对 props 的介绍](https://cn.vuejs.org/v2/guide/components-props.html)

### 总结

通过本节源码笔记，我们知道了子组件中 props 的两种写法，以及这两种写法在 Vue 中被转换成的最终格式。

本节笔记测试代码参考：[normalizeProps](https://github.com/zymfe/into-vue/tree/master/example/normalizeProps)。

### 注意
本文最后编辑于2018/12/02，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。