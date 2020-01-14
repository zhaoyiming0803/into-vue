VirtualDOM 是针对 DOM 重排重绘性能瓶颈作出的重要优化方案，其最具价值的核心功能是如何识别并保存新旧节点数据结构之间差异（diff算法）。diff 算法的复杂度与效率是决定 VirtualDOM 性能的关键因素。

目前，社区有很多不同的 diff 算法开源项目，而最为出名的就是 [snabbdom.js](https://github.com/snabbdom/snabbdom)，Vue2.x 则全面整合了 snabbdom。

前面几节笔记可以总结为数据初始化，现在该是将数据渲染到 DOM 的时候了，但是 Vue 在执行 $mount 的时候做了很多事情，一开始可能会晕，所以我们可以先了解下 snabbdom，最后再通过断点的方式看 Vue 源码，整个过程就很清晰了。

首先把 snabbdom 项目 clone 到本地。

然后仔细看下 snabbdom 的 README，了解什么是 VirtualDOM，以及它主要解决的问题。

接下来打开 src 目录，找到最重要的5个文件：snabbdom.ts、htmldomapi.ts、tovnode.ts、vnode.ts、h.ts。

最后创建一个测试的Demo，参考地址：https://github.com/zymfe/test-code/tree/master/test131-snabbdom

打开 demo 的 index.html，看 snabbdom 的初始化过程：

``` html
<!-- oldVNode -->
<div class="container" style="color: #000;">
  <h1>h1</h1>
  <p>p</p>
</div>
```

``` javascript
// init 函数入参是个数组，从 snabbdom 的 README 中可知，数组内容是一些 style、class
// 这些内容是在对应的生命周期 hooks 中执行的
// 所谓生命周期，就是 dom 的创建、更新、销毁过程，我们暂时可以先忽略这部分内容，所以传入空数组即可
// snabbdom.init 函数的返回值是 patch 函数，也是我们学习 snabbdom 的入口函数
var patch = snabbdom.init([])

// h 函数的作用是执行 vnode 函数，将 tree 型数据结构转为 vnode
// 可以在控制台中打印下 newVNode，看下 VirtualDOM 的结构
var newVNode = h.h('div', { style: { color: '#000' } }, [
  h.h('h1', 'Headline'),
  h.h('p', 'A paragraph'),
])

// toVNode 函数的作用是将 html 对象转为 vnode
// 注意：toVNode 与 h 函数都是调用 vnode 方法将对象转为vnode
// 但是 toVNode 函数的入参是【html对象】，h 函数的入参是【描述html结构的JS对象】

// patch 函数的作用就是对比新旧两个 vnode，找出差异打补丁，并返回更新后的 vnode，它是 snabbdom.init 函数的返回值
// 即对比 html 中的 oldVNode 与 上面新的 newVNode，找出差异，将补丁打包 oldVNode 中，并重新渲染
patch(tovnode.toVNode(document.querySelector('.container')), newVNode)
```

上面 demo 中，我正在 snabbdom-dist/snabbdom.js 的第 416 行打了个 debugger（patch函数中）。

``` javascript
return function patch (oldVnode: VNode | Element, vnode: VNode): VNode {
  let i: number, elm: Node, parent: Node;
  // insertedVnodeQueue 保存的是已经插入到 dom 中的节点，最后要遍历 insertedVnodeQueue，挨个执行其对应的 insert 钩子
  // 这里可以忽略，与我们分析 snabbdom 的 diff、patch 关系不大
  const insertedVnodeQueue: VNodeQueue = [];
  for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

  // 例如上面 Demo 中，初始状态下，oldVNode 是实际的 dom 节点，并不是使用 JS 对象描述的 vnode
  // 所以这里做一个转换，方便后面将 oldVNode 与 newVNode 做 patch
  if (!isVnode(oldVnode)) {
    oldVnode = emptyNodeAt(oldVnode);
  }

  // 判断两个 vnode 相等的条件是：它们的 key 和 sel 是否全部相等
  // 如果两个 vnode 相等，说明它们本身没有修改，但是它们的子孙node可能有修改，所以继续执行 patchVnode
  if (sameVnode(oldVnode, vnode)) {
    patchVnode(oldVnode, vnode, insertedVnodeQueue);
  } else {
    // 如果两个 vnode 不等，则没有必要再 patch 其子孙node了，直接将 oldNode 替换为 newNode 即可
    elm = oldVnode.elm!;
    parent = api.parentNode(elm);

    // 将 vnode 转换为真实 dom，其实就是使用 DOM API，递归执行 createElm 不断创建 node 和它的 children
    createElm(vnode, insertedVnodeQueue);

    // 执行 DOM API， insertBefore，将 oldNode 替换为 newNode，并删除 oldNode
    if (parent !== null) {
      api.insertBefore(parent, vnode.elm!, api.nextSibling(elm));
      // debugger 到这里，可以看下页面，现在 oldNode 和 newNode 同时存在，Vue 中也是一样
      // 删除无用的 oldNode
      removeVnodes(parent, [oldVnode], 0, 0);
    }
  }

  // 整棵 DOM 树 patch 完了，执行 insert 钩子，用户可以在这些钩子里做一些自定义的事情
  // 跟 Vue 的生命周期类似，很好理解
  for (i = 0; i < insertedVnodeQueue.length; ++i) {
    insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i]);
  }
  for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
  return vnode;
};
```

接下来上面 if 分支中的 patchVnode 函数：

``` javascript
function patchVnode (oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
  // 执行 prepatch 生命周期钩子
  const hook = vnode.data?.hook;
  hook?.prepatch?.(oldVnode, vnode);
  // oldVnode.elm，当前是 class 为 container 的 div 
  const elm = vnode.elm = oldVnode.elm!;
  // oldVNode 的所有子node
  let oldCh = oldVnode.children as VNode[];
  // newVNode 的所有zinode
  let ch = vnode.children as VNode[];
  // 如果相等，说明所有的子节点也没有修改，就没必要继续对比了
  if (oldVnode === vnode) return;
  // 现在正式开始 patch 了，执行 update 钩子
  if (vnode.data !== undefined) {
    for (let i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    vnode.data.hook?.update?.(oldVnode, vnode);
  }

  // 如果 vnode 的子节点不是文本节点，说明都是 element children
  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch)) {
      // 如果新旧 node 都有 element children，并且不一样，就继续 updateChildren(diff算法核心)
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
    } else if (isDef(ch)) {
      // 如果 newVNode 有element children，而 oldVNode没有，则直接将 oldVNode 的文本置为空，并添加所有 element nodes
      if (isDef(oldVnode.text)) api.setTextContent(elm, '');
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 如果 oldVNode 有 element node，newVNode 没有，则直接删除
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      // newVNode 没有 text，没有 element children，oldVNode 没有 element children
      // 那就把它当做一个空节点
      api.setTextContent(elm, '');
    }
  } else if (oldVnode.text !== vnode.text) { // 如果 vnode 的子节点是文本节点，并且新旧 node 的文本不一样
    // 如果oldNode有 element node，则直接移出，然后设置子节点为最新的文本节点
    if (isDef(oldCh)) {
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    }
    api.setTextContent(elm, vnode.text!);
  }
  hook?.postpatch?.(oldVnode, vnode);
}
```

diff 算法的核心：updateChildren

``` javascript
updateChildren (parentElm: Node,
  oldCh: VNode[],
  newCh: VNode[],
  insertedVnodeQueue: VNodeQueue) {
  // 以下变量见名知意
  let oldStartIdx = 0, newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  // oldKeyToIdx 是 oldVNode 的 key 与其所在索引的对应关系，如：{key0: 0, key1: 1, key2: 0}
  // 写 Vue 、React 或小程序，遍历一个数组，我们都会给元素每一项加 key 属性，作用就在这里
  let oldKeyToIdx: KeyToIndexMap | undefined;
  // idxInOld 是 newVNode 的 key 属性对应的元素在 oldVNode 中的索引，如果是 undefined，说明是新增的
  let idxInOld: number;
  // elmToMove 是可能被移动位置的数组元素
  let elmToMove: VNode;
  // before 一般是 null，代表 oldNode 的最后一个位置
  let before: any;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 以下连续的 if 和 else if 逻辑很简单，就是判断对应的两个 node 是否为 null 或是否相同，
    // 然后移动对应的 index 或继续 patchVNode，整体是一个递归的过程
    // 脑海中要有一个清晰的画面，对 oldStartVnode 和 newStartVnode 、 oldStartIdx 和 newStartIdx 、oldEndIdx 和 newEndIdx 的指向有清晰的认识
    // 可以画图作为辅助参考，下面重点分析 else 分支
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      api.insertBefore(parentElm, oldStartVnode.elm!, api.nextSibling(oldEndVnode.elm!));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      api.insertBefore(parentElm, oldEndVnode.elm!, oldStartVnode.elm!);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 走到 else 分支，说明整个对比的两个节点不为null，也不相同
      // 那么下面要操作的就是 oldStartVNode 和 newStartVNode

      // 上面注释介绍过，oldKeyToIdx 是 oldVNode 的 key 与其所在索引的对应关系，如：{key0: 0, key1: 1, key2: 0}
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }

      // 上面注释介绍过，idxInOld 是 newVNode 的 key 属性对应的元素在 oldVNode 中的索引，如果是 undefined，说明是新增的
      idxInOld = oldKeyToIdx[newStartVnode.key as string];
      if (isUndef(idxInOld)) { // New element
        // 如果是新增的节点，则直接 insert 到 oldStartVnode 前面
        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm!);
        // 不要忘记移动指针
        newStartVnode = newCh[++newStartIdx];
      } else {
        // 如果不是新增的节点，说明当前位置的节点被移动了被修改了（不是移动到第一位或最后一位，因为上面的一系列 else if 已经做判断了）
        elmToMove = oldCh[idxInOld];
        if (elmToMove.sel !== newStartVnode.sel) {
          // 如果 sel 不一样，说明是节点被修改了，直接插入即可
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm!);
        } else {
          // 如果 sel 一样，说明此位置的节点只是部分内容被修改，继续 patchVNode
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined as any;
          // patch 完了，插入最新的内容
          api.insertBefore(parentElm, elmToMove.elm!, oldStartVnode.elm!);
        }
        // 不要忘记移动指针
        newStartVnode = newCh[++newStartIdx];
      }
    }
  }
  // ***** 
  // 有没有注意到，在上面的 else 分支中，只移动了 newStartIdx，没有移动 oldStartIdx，这是为什么呢？
  // 答案就在 elmToMove 这个元素上，继续上面的思路，重点关注下次 while 循环时 elmToMove 的值，就明白了
  // newCh[++newStartIdx] 和 oldCh[++oldStartIdx] 是同一个元素，即 idxInOld 有效
  // 那么执行 elmToMove = oldCh[idxInOld]就已经自动将oldNode指针指向了 oldCh[++oldStartIdx] 元素
  // 继续下面的逻辑
  // *****

  // 满足这个条件，说明，newVNode 或 oldVNode 有一个或都没有遍历
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    // 如果 oldVNode 遍历完了，说明 newVNode 可能还有剩余（因为是 <=），则把 newVNode 中剩余子 node 全部 add 到对应位置
    // 最简单的场景：前端列表懒加载，从后端获取到数据后，push到数组中
    // 那么 newVNode 肯定比 oldVNode 长
    // 这个时候，before 是 null，那么执行 insertBefore 的时候，其实就是相当于往 oldNode 后面不断添加新节点，设计的真巧
    // 看起来，before 永远为 null，不为null是在什么场景下呢？我还在思考中...
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else {
      // 如果 newVNode 遍历完了，则把可能剩余的 oldVNode 子节点全部删除
      // 这些被删除的子节点有两种情况：
      // 1、可能是新节点中已经被删除的无用的子节点
      // 2、也可能是在上面 else 分支中，从某个节点开始，后面的兄弟节点全部被修改了
      //    那么会执行 api.insertBefore(parentElm, elmToMove.elm!, oldStartVnode.elm!);
      //    等 newNode 遍历完之后，oldVNode存在多余的节点，即从 oldStartIdx 到 oldEndIdx
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }
}
```

到目前为止，snabbdom 关于 path node 的流程都分析完了。其中一些辅助方法和hook相关的逻辑，可以单独来学习。

从整体来看，patch 遵循这样的过程：

1、将原始的 dom 变成 vNode，即 oldVNode

2、patch oldVNode 和 newVNode，将 newVNode 中的『更新』patch 到 oldVNode 中，在这个过程中，页面已经重新更新了

3、在 patch 过程中，会有一些与dom相关的生命周期的钩子执行

Vue 的 patch 过程跟 snabbdom 是一样的，下节笔记介绍。