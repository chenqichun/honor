<template>
    <div class="box">
        <div class="top"></div>
        <div class="left"></div>
        <div class="right" ref="chartBox"></div>
    </div>
  </template>

<script>
import {createChart} from '../cool-chart'
export default {
  mounted() {
    const chartInstall = createChart(this.$refs.chartBox);
    chartInstall.addChart({stockId: 'apple'})
  }
}
</script>
<style lang="scss">
@import '../cool-chart/style/index.scss';
</style>
<style lang="scss" scoped>

.box {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  .top {
    position: absolute;
    left: 0;
    right: 0;
    height: 50px;
    border-bottom: 1px solid #000;
 
  }
  .left {
    position: absolute;
        top: 50px;
        left: 0;
        bottom: 0;
        width: 20%;
        border-right: 1px solid #000;
    }
    .right {
        position: absolute;
        top: 50px;
        left: 20%;
        right: 0;
        bottom: 0;
    }
}
</style>