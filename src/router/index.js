import Vue from 'vue'
import Router from 'vue-router';
Vue.use(Router)
const routes = [
  {
    path: '/aseaSeries',
    component: () => import("@/views/aseaSeries.vue")
  },
   {
    path: '/bar',
    component: () => import("@/views/barSeries.vue")
  },
  {
    path: '/baseLine',
    component: () => import("@/views/baseLine.vue")
  },
  {
    path: '/candlestick',
    component: () => import("@/views/candlestick.vue")
  },
  {
    path: '/histogram',
    component: () => import("@/views/histogram.vue")
  },
  {
    path: '/line',
    component: () => import("@/views/line.vue")
  },
  {
    path: '/realTimeLine',
    component: () => import("@/views/realTimeLine.vue")
  },
  
  
]
const router = new Router({
  mode: 'history', // 使用 HTML5 History 模式
  routes // （缩写）相当于 routes: routes
});

export default router