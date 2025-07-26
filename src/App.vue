<script setup lang="ts">
import { showToast } from './composables/toast';
import konvaEditor from './components/konva-editor/index.vue'
import { exampleData } from './components/konva-editor/data';
</script>

<template>
  <div class="main">
       <konva-editor 
       :show-operate-area="exampleData.operateArea"
       :size="exampleData.size"
       :data="exampleData.layers">
      </konva-editor>
  </div>
</template>

<style lang="less">
#app {
  padding: 0;
  margin: 0;
}
body {
  background-color: white;
  background: transparent;
  flex-shrink: 0;
}
.main {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
</style>
