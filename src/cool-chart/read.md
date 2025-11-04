# 线条奇偶数模糊处理

// 设置线的大小
 ctx.lineWidth = lineWidth
// 这是一个canvas对于奇数线宽的处理，否则绘制会有模糊，具体的可以canvas的相关知识
let diff = ctx.lineWidth % 2 ? 0.5 : 0;
// 把点都转成整数，避免小数，否则绘制会有模糊
let gInt = v => Math.round(v) + diff;
ctx.beginPath();
ctx.moveTo(gInt(p1.x),gInt(p1.y))
p2 && ctx.lineTo(gInt(p2.x),gInt(p2.y));