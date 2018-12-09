import Vue from 'vue'
import App from './App'
import hello from './components/hello';

Vue.component('hello', hello);

Vue.config.productionTip = false

new Vue({
  el: '#app',
  data () {
    return {}
  },
  render: h => h(App)
})
