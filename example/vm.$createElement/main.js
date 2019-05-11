// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import { create } from 'domain';

Vue.config.productionTip = false

/* eslint-disable no-new */
const vm = new Vue({
  el: '#app',
  data () {
    return {
      name: 'Main',
      uname: 'zhaoyiming',
      age: 18
    }
  },
  // components: {
  //   abc: {
  //     render: (createElement) => {
  //       return createElement('div', {
  //         style: {
  //           color: 'red',
  //           fontSize: 30
  //         }
  //       }, '11111');
  //     }
  //   }
  // },
  //components: { App },
  // render: function (createElement) {
  //   return createElement('div',
  //     Array.apply(null, { length: 20 }).map(function () {
  //       return createElement('p', {
  //         attrs: {
  //           class: 'haha'
  //         }
  //       }, 'hi')
  //     })
  //   )
  // }

  // render (createElement) {
  //   const _this = this;
  //   return createElement('div', [
  //     createElement('div', {
  //       style: {
  //         color: 'red'
  //       },
  //       on: {
  //         click: () => {
  //           console.log(this.uname);
  //         }
  //       }
  //     }, this.uname),
  //     createElement('div', {
  //       style: {
  //         color: 'blue'
  //       },
  //       on: {
  //         click: () => {
  //           console.log(this.age);
  //         }
  //       }
  //     }, this.age)
  //   ]);
  // }

  render: h => h(App)
})
