// 主线程调度器（结合 rAF 和 Fiber 调度）
/**
 * 主线程需要一个调度器（Scheduler），负责：
管理任务队列（按优先级排序）；
在 rAF 回调中，按帧的剩余时间处理任务单元（可中断）；
接收 Worker 结果并生成任务；
处理高优先级任务插队。
核心逻辑：每帧通过 rAF 触发，计算当前帧的剩余可用时间（16.6ms - 已消耗时间），从任务队列中取最高优先级任务执行，
          直到时间不足，记录任务执行状态（未完成的任务留到下一帧）。
 */

          class CanvasScheduler {
            constructor(ctx) {
              this.ctx = ctx; // canvas上下文
              this.taskQueue = null; // 任务链表（按优先级排序）
              this.worker = new Worker('worker.js');
              this.isWorking = false; // 是否正在处理任务
              this.frameDeadline = 0; // 当前帧的截止时间（timestamp + 16.6ms）
          
              // 接收Worker的计算结果，生成绘制任务
              this.worker.onmessage = (e) => {
                const { type, data } = e.data;
                if (type === 'PARTICLES_RESULT') {
                  this.addTask(new CanvasTask(
                    'PARTICLE',
                    Priority.ANIMATION,
                    (ctx, particles) => { // 绘制粒子的执行函数
                      particles.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
                        ctx.fillStyle = p.color;
                        ctx.fill();
                      });
                    },
                    data
                  ));
                }
              };
            }
          
            // 添加任务（按优先级插入队列）
            addTask(newTask) {
              if (!this.taskQueue) {
                this.taskQueue = newTask;
                this.schedule(); // 触发调度
                return;
              }
              // 简化：按优先级插入链表（高优先级放前面）
              let current = this.taskQueue;
              let prev = null;
              while (current && current.priority <= newTask.priority) {
                prev = current;
                current = current.next;
              }
              newTask.next = current;
              if (prev) prev.next = newTask;
              else this.taskQueue = newTask;
            }
          
            // 调度任务（通过rAF触发）
            schedule() {
              if (this.isWorking) return;
              this.isWorking = true;
              requestAnimationFrame(timestamp => {
                this.frameDeadline = timestamp + 16.6; // 60fps单帧截止时间
                this.processTasks(timestamp);
              });
            }
          
            // 处理任务（可中断）
            processTasks(timestamp) {
              while (this.taskQueue) {
                // 检查当前帧是否还有剩余时间
                if (timestamp >= this.frameDeadline) {
                  // 时间不足，暂停，下一帧继续
                  this.schedule();
                  return;
                }
          
                const currentTask = this.taskQueue;
                // 执行当前任务（绘制）
                currentTask.execute(this.ctx, currentTask.data);
                // 移除已完成任务
                this.taskQueue = currentTask.next;
                // 更新时间戳
                timestamp = performance.now();
              }
              // 任务全部完成
              this.isWorking = false;
            }
          
            // 向Worker发送计算请求
            requestCalculation(type, data) {
              this.worker.postMessage({ type, data });
            }
          }