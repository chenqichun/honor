// 初始化canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const scheduler = new CanvasScheduler(ctx);

// 模拟初始粒子数据
const initialParticles = Array(1000).fill().map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  vx: (Math.random() - 0.5) * 10,
  vy: (Math.random() - 0.5) * 10,
  r: Math.random() * 5 + 1,
  color: `hsl(${Math.random() * 360}, 80%, 50%)`
}));

// 启动动画：每帧请求Worker计算粒子位置，再绘制
function animate() {
  // 1. 清空画布（低优先级任务）
  scheduler.addTask(new CanvasTask(
    'CLEAR',
    Priority.LOW,
    (ctx) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    null
  ));

  // 2. 请求Worker计算粒子新位置（计算在Worker中，不阻塞主线程）
  scheduler.requestCalculation('CALCULATE_PARTICLES', initialParticles);

  // 3. 继续下一帧
  requestAnimationFrame(animate);
}

// 启动动画
animate();