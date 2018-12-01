<template>
  <div>
    {{ person.name }}
    {{ person.age }}
  </div>
</template>

<script scoped type="ecmascript-6">
  export default {
    props: {
      person: {
        type: Object
      }
    },
    
    data () {
      return {
        
      }
    }
  }
</script>
