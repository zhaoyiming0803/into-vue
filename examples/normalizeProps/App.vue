<template>
  <div class="root-container">
    <hello :person="person"></hello>
  </div>
</template>

<script scoped type="ecmascript-6">
  import hello from './components/hello';
  export default {
    data () {
      return {
        person: {
          name: 'zhaoyiming',
          age: 18
        }
      }
    },

    components: {
      hello
    }
  }
</script>
