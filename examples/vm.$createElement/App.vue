<template>
  <div class="app-container">
    <hello></hello>
    <hello></hello>
  </div>
</template>

<script>
  import hello from './hello';
  export default {
    data () {
      return {
        name: 'APP'
      }
    },

    components: {
      hello
    },

    created () {
      
    },

    mounted () {
      
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
