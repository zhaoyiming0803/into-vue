<template>
  <div class="root-container">
    <hello></hello>
  </div>
</template>

<script scoped type="ecmascript-6">
  import hello from './components/hello';
  export default {
    data () {
      return {}
    },
    components: {
      hello
    },
    created () {
      console.log('app.vue created');
    },
    mounted () {
      console.log('app.vue mounted');
    }
  }
</script>
