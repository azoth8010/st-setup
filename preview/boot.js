// ============================================================
// 预览引导（通用）
//
// 把「挂载向导 + 假写入 + 打印载荷」这三件套收在一处，
// 每张卡的 preview.html 只写三行：引配置、引这里、调用。
//
// 不是酒馆环境：没有 TH API，写入走假实现，只把载荷打在侧栏里。
// ============================================================

import { 挂载 } from '../src/wizard.js';

export function 启动预览(配置, 选项 = {}) {
  const 容器 = document.getElementById('slot');
  const 记录 = document.getElementById('log');
  if (!容器) throw new Error('预览页缺少 #slot');

  let 收到 = null;

  function 打印(payload, 备注) {
    收到 = payload;
    if (!记录) return;
    记录.textContent = (备注 ? '// ' + 备注 + '\n' : '') + JSON.stringify(payload, null, 2);
  }

  挂载(容器, {
    配置,
    预览: 选项.预览 !== false,
    写入: async (payload) => {
      打印(payload, '写入载荷（预览，不写世界书）');
      return { 书: '预览', 条目名: '[initvar]', 字节数: 0, 发送: 'preview' };
    },
  });

  return {
    取载荷: () => 收到,
    重挂: () => {
      容器.innerHTML = '';
      启动预览(配置, 选项);
    },
  };
}

/** 从 ?config= 读一个配置模块路径（相对当前页面）。 */
export async function 按参数启动() {
  const 参 = new URLSearchParams(location.search);
  const 路径 = 参.get('config');
  if (!路径) throw new Error('缺少 ?config= 参数，例如 ?config=../cards/manfan/config.js');
  const 模块 = await import(路径);
  if (!模块.配置) throw new Error(路径 + ' 里没有导出 配置');
  return 启动预览(模块.配置, { 预览: 参.get('demo') !== '0' });
}
