### 前言

最近几个月一直在研究 Vue 源码，踩了很多坑，特别是刚开始，不清楚 Vue 源码整体构成，好几次被某一个 function 的逻辑带进去出不来，好在后期找到了方法，现在将这几个月的研究心得记录下来，一方面当作自己的笔记，梳理思路，也方便后期回顾，另一方面，将笔记开源到 github，希望对 Vue 源码同样感兴趣的童鞋有帮助。

### 笔记涵盖

- 了解 Vue 源码目录设计
- 找到 Vue 构造函数的源头文件
- 从 new Vue 开始，学习各种 mixin 方法
- Vue 的 options 选项合并，其中包括各种 normolize 及不同选项的不同合并策略，最终生成$options
- Vue 实例化过程中，一系列的 init 方法及生命周期的执行
- 响应式数据原理，搞清楚 依赖 、观察者 、 订阅 、 发布 之间的关系与执行顺序
- vnode 生成的整个 render 过程，包括组件vnode和普通vnode
- 将 vnode 渲染到页面的 patch 过程

### 目录

<pre>
├── doc       // 笔记文档
├── example   // 笔记中用到的实例代码
├── vue-code  // vue源码核心部分
</pre>

### 说明

- 如果对您有帮助，您可以点右上角 "Star" 支持一下 谢谢！ ^_^
- 或者您可以 "follow" 一下，我会不断开源更多的有趣的项目
- 如有问题请直接在 Issues 中提，或者您发现问题并有非常好的解决方案，欢迎 PR 👍
