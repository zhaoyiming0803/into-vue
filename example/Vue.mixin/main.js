import Vue from 'vue'
import App from './app'

Vue.config.productionTip = false

Vue.mixin({
  created () {
    console.log('Vue.mixin created');
  },
  mounted () {
    console.log('Vue.mixin mounted');
  }
});

new Vue({
  el: '#app',
  data () {
    return {
      uname: 'zhaoyiming'
    }
  },
  render: h => h(App)
})
