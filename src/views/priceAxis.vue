<template>
    <div class="box" ref="box"></div>
  </template>
 <script>
 import { PriceAxisWidget } from "@/cool-chart/views/price-axis";
 export default {
   mounted() {
        let pricez = new PriceAxisWidget({
            height: 372,
            minValue: 9.1,
            maxValue: 11.6,
            childInfoList: [{minValue: 9.1, maxValue: 11.6}]
        })
        this.$el.appendChild(pricez.getNode())
   }
 }
 </script>
 <style lang="scss">
 .box {
  display: inline-block;
  margin: 100px auto;

 }
</style>