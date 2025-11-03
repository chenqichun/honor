// 模拟粒子位置计算（耗时操作）
function calculateParticles(particles) {
    return particles.map(p => {
      // 复杂物理计算（如重力、碰撞）
      p.x += p.vx * 0.1;
      p.y += p.vy * 0.1;
      return p;
    });
  }
  
  // 接收主线程的计算请求
  self.onmessage = (e) => {
    const { type, data } = e.data;
    if (type === 'CALCULATE_PARTICLES') {
      const result = calculateParticles(data);
      // 发送计算结果回主线程
      self.postMessage({
        type: 'PARTICLES_RESULT',
        data: result
      });
    }
  };