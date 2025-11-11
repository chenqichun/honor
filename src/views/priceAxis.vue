<template>
    <div class="box" ref="box">
        <div class="test"></div>
    </div>
  </template>
 <script>
 import { PriceAxisWidget } from "@/cool-chart/views/price-axis";
 export default {
   mounted() {
        let pricez = new PriceAxisWidget({
            height: 372,
            childInfoList: [
            {minValue: 9.1, maxValue: 11.6, precision: 2}
            ]
        })
        this.$el.appendChild(pricez.getNode())

        const test = document.querySelector('.test')
        test.addEventListener('mousedown', e => {
            window.start = e.clientY
            console.log(pricez)
            pricez._childWidgetList.forEach(c => {
                c.priceScale().startScroll(e.clientY)
            })
            
        })
        document.body.addEventListener('mousemove', e => {
            if (!window.start) return;
            pricez._childWidgetList.forEach(c => {
       
                c.priceScale().scrollTo(e.clientY)
            })
        })
        document.body.addEventListener('mouseup', e => {
            window.start = null;
            pricez._childWidgetList.forEach(c => {
                c.priceScale().endSroll()
            })
         
        })
   }
 }
 </script>
 <style lang="scss">
 .box {
  display: flex;
  margin: 100px auto;
    .test {
        height: 372px;
        width: 100px;
        border: 1px solid #dbdbdb;
        margin-right: 30px;
    }
 }
</style>