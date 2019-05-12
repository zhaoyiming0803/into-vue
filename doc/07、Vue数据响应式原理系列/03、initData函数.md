initData 函数位于 /src/core/instance/state.js 文件中，代码如下：

``` javascript
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```

### 从 data 函数中获取数据

首先获取 vm.$options.data，判断其类型，如果是一个 function，则执行 getData 函数解析出真正的 data，getData 函数就定义在 initData 函数的下方，代码如下：

``` javascript
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}
```

代码很简单，将开发者写的 data 函数放入 try catch 中执行，并捕获可能会出现的错误。

pushTarget 和 popTarget 是用来解决重复收集依赖（观察者）的，后面的依赖收集相关笔记中会详细介绍。

``` javascript
data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
```

这里要记住 data = vm._data = 获取到的数据，此时的 data 已经是对象了，而不是 function

接下来 Vue 做了判断，获取到的数据是不是一个纯对象：

``` javascript
if (!isPlainObject(data)) {
  data = {}
  process.env.NODE_ENV !== 'production' && warn(
    'data functions should return an object:\n' +
    'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
    vm
  )
}
```

相信这个报错信息，我们在最开始用 Vue 做项目时都遇到过。

### props、data、methods的优先级

接下来的代码很重要了，主要解决定义 props、data、methods 的优先级问题，在开发环境，首先通过 Object.keys(data) 获取到 data 对象所有可枚举的 key，然后在 while 循环中遍历，

``` javascript
const keys = Object.keys(data)
const props = vm.$options.props
const methods = vm.$options.methods
let i = keys.length
while (i--) {
  const key = keys[i]
  if (process.env.NODE_ENV !== 'production') {
    if (methods && hasOwn(methods, key)) {
      warn(
        `Method "${key}" has already been defined as a data property.`,
        vm
      )
    }
  }
  if (props && hasOwn(props, key)) {
    process.env.NODE_ENV !== 'production' && warn(
      `The data property "${key}" is already declared as a prop. ` +
      `Use prop default value instead.`,
      vm
    )
  } else if (!isReserved(key)) {
    proxy(vm, `_data`, key)
  }
}
```

第一个条件：methods && hasOwn(methods, key)

如果 methods 中定义了与 data 相同的 key，就会报提示：`Method "${key}" has already been defined as a data property.`

第二个条件：props && hasOwn(props, key)

如果 data 中定义了与 props 相同的 key，就会报提示：`The data property "${key}" is already declared as a prop. `

那为什么不允许 props、data、methods 定义相同的 key 呢？原因就是 Vue 为了方便开发者访问 props、data、methods 中的属性，会把这些属性都通过代理挂载到组件实例 vm 上，这样就能通过 this 直接访问，而不用 this.props.a 或 this.data.b 或 this.methods.c 这种复杂的形式。具体实现原理，就是接下来在满足 else if 条件的情况下执行 proxy 方法：

### 使用 proxy 代理，实现使用 this 直接能访问数据的原理

``` javascript
else if (!isReserved(key)) {
  proxy(vm, `_data`, key)
}
```

isReserved 方法用来判断，某个 key 是不是以 _ 或 $ 开头，因为 Vue 内部很多属性和方法都是以 _ 和 $ 开头，所以为了避免冲突，做不必要的 proxy，这里做了判断，isReserved 方法定义在 /src/core/util/lang.js 文件中，代码如下：

``` javascript
/**
 * Check if a string starts with $ or _
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}
```

proxy 方法就定义在当前 state.js 文件的最上面，代码如下；

``` javascript
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

从这里开始，正式接触 Object.defineProperty，这也是 Vue 实现数据响应式原理的核心，不过在这个地方，并不是用来实现数据响应式的，它只是做了一层对象 key 的 get 和 set 拦截，比如：我们访问 this.uname，Vue 内部返回的实际是 this._data.uname。

实现拦截的原理很简单，《JavaScript高级程序设计》一书中对 Object.defineProperty 有很详细的介绍。

本文最后编辑于2019/05/12，技术更替飞快，文中部分内容可能已经过时，如有疑问，可在线提issue。