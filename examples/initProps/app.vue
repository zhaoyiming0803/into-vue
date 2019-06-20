<template>
  <div class="app-container">
    <hello :message="message" :content="content" :test="test"></hello>
    <hello :message="message" :content="content"></hello>
    <button @click="switchHello">切换hello组件</button>
  </div>
</template>

<script>
  import Hello from './components/hello';

  export default {
    data () {
      return {
        isShowTest: true,
        message: 'hello world',
        content: {},
        formData: {},
        test: 'test'
      }
    },

    components: {
      Hello
    },

    mounted () {
      console.log(this.$parent);
    },

    methods: {
      switchHello () {
        this.isShowTest = false;
        this.$nextTick(() => {
          this.test = undefined;
        });
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
