// ============================================================
// 建档引擎 · 主角档案（常驻世界书条目）
//
// 引擎只负责「写」：条目名、位置、正文长什么样，全由 config 提供。
// 正文该写什么、不该写什么，是每张卡自己的判断。
// ============================================================

import { 扫条目, 摘牌写入, 删条目, 列书 } from './worldbook-util.js';

/**
 * @param {Object} opt
 * @param {string} opt.正文
 * @param {Object} opt.配置
 */
export async function 写主角档案({ 正文, 配置 }) {
  if (!正文) throw new Error('档案内容为空');
  const 设定 = 配置.主角档案;
  const 名 = 设定.条目名;

  const { 命中 } = await 扫条目((n) => n === 名);

  if (命中.length > 1) {
    for (const h of 命中.slice(1)) {
      try { await 删条目(h.书, h.名); } catch (_) {}
    }
    console.warn('[建档] 发现 %d 条同名主角档案，已清理多余 %d 条', 命中.length, 命中.length - 1);
  }

  const 目标 = 命中[0];
  let 书 = 目标 ? 目标.书 : (await 列书())[0];
  if (!书) throw new Error('没有可写世界书：请先导入角色卡世界书');

  const 结果 = await 摘牌写入({
    书,
    旧条目: 目标 ? 目标.条目 : null,
    名,
    正文,
    缺省: {
      comment: 名,
      constant: 设定.位置?.constant ?? true,
      position: 设定.位置?.position ?? 0,
      order: 设定.位置?.order ?? 9,
      key: [],
      probability: 100,
    },
  });

  const 复核 = await 扫条目((n) => n === 名);
  if (复核.命中.length !== 1) throw new Error('写入后主角档案条目数异常：' + 复核.命中.length);

  console.log('[%s] 主角档案已写入 %s（%d 字节）', 配置.卡名, 书, 正文.length);
  return 结果;
}

/** 调试：读现有主角档案正文。 */
export async function 读主角档案({ 配置 }) {
  const 名 = 配置.主角档案.条目名;
  const { 命中 } = await 扫条目((n) => n === 名);
  if (命中.length !== 1) return { 数量: 命中.length };
  return { 数量: 1, 书: 命中[0].书, 正文: String(命中[0].条目.content || '') };
}
