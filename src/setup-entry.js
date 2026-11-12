// ============================================================
// 建档引擎 · 接线
//
// 一句话：把「模板 + 玩家段」变成「变量 + 主角档案 + 第一条消息」。
//
//   createSetup({ 配置, 模板, 模板版本?, 远程源? }) → { 写入, 读Initvar, 读主角档案, 回滚 }
//
// 模板来源：默认用调用方传入的内嵌常量；给了远程源就在后台试拉一次，
// 拉到更新的版本才替换，失败完全静默（不影响建档）。
// ============================================================

import { 校验配置 } from './config.js';
import { 写入Initvar, 读Initvar } from './initvar-write.js';
import { 写主角档案, 读主角档案 } from './profile-write.js';
import { 发送建档消息, 已发过, 记已发 } from './setup-message.js';

export function createSetup({ 配置, 模板, 模板版本 = '', 远程源 = [] }) {
  校验配置(配置);
  if (!模板 || typeof 模板 !== 'object') throw new Error('没给模板');

  let 最新模板 = null;

  async function 取远程(超时 = 3000) {
    for (const url of 远程源) {
      try {
        const 控 = new AbortController();
        const t = setTimeout(() => 控.abort(), 超时);
        const res = await fetch(url + '?t=' + Date.now(), { signal: 控.signal, cache: 'no-store' });
        clearTimeout(t);
        if (!res.ok) continue;
        const 文本 = await res.text();
        const m = 文本.match(/export const 模板 = (\{[\s\S]*?\});\s*$/m);
        if (!m) continue;
        const 版本 = (文本.match(/export const 模板版本 = "([^"]+)"/) || [])[1] || '';
        return { 版本, 模板: JSON.parse(m[1]) };
      } catch (e) { /* 网络不通、超时、跨域都跳过 */ }
    }
    return null;
  }

  async function 尝试更新() {
    const 远程 = await 取远程();
    if (!远程) return;
    if (远程.版本 && 远程.版本 <= 模板版本) return;
    最新模板 = 远程.模板;
    console.log('[%s] 模板已更新到 %s', 配置.卡名, 远程.版本 || '（无版本号）');
  }

  /**
   * 建档主入口。
   * @param {{名字:string, 玩家段:Object, 起点:string}} payload
   */
  async function 写入(payload) {
    if (!payload || !payload.玩家段) throw new Error('没有玩家段');
    if (!配置.锚点.includes(payload.起点)) throw new Error('未知起点：' + payload.起点);

    const 表 = 最新模板 || 模板;
    const 锚 = 表[payload.起点];
    if (!锚) throw new Error('模板里没有这个起点：' + payload.起点);

    // ① 变量
    const 结果 = await 写入Initvar({ 模板: 锚, 玩家: payload.玩家段, 配置 });
    const 最终玩家段 = 结果.树?.玩家 || payload.玩家段;

    // ② 主角档案（失败不阻断建档）
    let 档案 = null;
    try {
      档案 = await 写主角档案({ 正文: 配置.主角档案.正文(payload.名字, 最终玩家段, payload.起点), 配置 });
    } catch (e) {
      console.warn('[%s] 主角档案写入失败：', 配置.卡名, e);
      档案 = { 错误: e?.message || String(e) };
    }

    // ③ 消息 + 触发
    let 发送 = 'skipped';
    if (!已发过(配置.卡名)) {
      const 正文 = 配置.消息.正文(payload.名字, 最终玩家段, payload.起点);
      const r = await 发送建档消息(正文);
      发送 = r.方式;
      if (发送 !== 'input') await 记已发(配置.卡名);
    }

    return { ...结果, 玩家: 最终玩家段, 档案, 发送 };
  }

  return {
    写入,
    读Initvar: () => 读Initvar({ 配置 }),
    读主角档案: () => 读主角档案({ 配置 }),
    尝试更新,
  };
}
