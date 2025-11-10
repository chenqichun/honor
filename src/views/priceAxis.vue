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
            childInfoList: [{}]
        })
        this.$el.appendChild(pricez.getNode())
   }
 }
 </script>