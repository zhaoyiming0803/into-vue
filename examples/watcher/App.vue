<template>
  <div class="app-container">
    <input type="text" v-model="person.age">
    <div>{{message}}</div>
  </div>
</template>

<script>
  import hello from './components/hello';
  import world from './components/world';
  export default {
    data () {
      return {
        person: {
          age: 1
        }
      }
    },

    watch: {
      'person.age' (n, o) {
        console.log('age最新值：' + o);
      }
    },

    computed: {
      message () {
        return '我今年' + this.person.age +　'岁';
      }
    }
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
