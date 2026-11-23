// ============================================================
// 建档引擎 · 写 initvar 条目
//
// 顺序（不可改）：
//   ① 扫书、找唯一条目   ② 备份到 chat 变量
//   ③ 组装（白名单填玩家段 + 派生 + 验收）
//   ④ 摘牌式写入         ⑤ 复核唯一性   ⑥ 读回校验
//
// 与题材无关：条目名怎么起、玩家段长什么样、派生什么，全部由 config 提供。
// ============================================================

import { 扫条目, 摘牌写入 } from './worldbook-util.js';

const 备份键 = (卡名) => 卡名 + '_initvar备份';

function 克隆(o) { return JSON.parse(JSON.stringify(o)); }

function 取值(tree, path) {
  return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), tree);
}

function 放值(tree, path, val) {
  const ks = path.split('.');
  let cur = tree;
  for (let i = 0; i < ks.length - 1; i++) {
    if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = {};
    cur = cur[ks[i]];
  }
  cur[ks[ks.length - 1]] = val;
}

export function 断言(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** 把玩家段按白名单写进模板副本。名单外、或路径不存在 → 抛错。 */
export function 填玩家段(tree, 玩家, 白名单) {
  const 平铺 = {};
  const 走 = (obj, pre) => {
    if (obj == null) return;
    if (Array.isArray(obj) || typeof obj !== 'object') { 平铺[pre] = obj; return; }
    Object.keys(obj).forEach((k) => 走(obj[k], pre ? pre + '.' + k : k));
  };
  走(玩家, '玩家');
  if (玩家 && 玩家._nextUid !== undefined) 平铺['_nextUid'] = 玩家._nextUid;

  for (const [path, val] of Object.entries(平铺)) {
    断言(白名单.includes(path), '越权写入：' + path);
    断言(取值(tree, path) !== undefined, '模板里没有这个路径：' + path);
    放值(tree, path, val);
  }
}

/** 固定键验收：键集必须恰好是「前缀 + 01…N」。 */
export function 校验固定键(tree, 配置) {
  const 节点设定 = 配置.initvar.固定键.节点;
  const 世界树 = 取值(tree, 节点设定.路径 || '世界.节点') || {};
  const 应有 = Array.from({ length: 节点设定.数量 }, (_, i) => 节点设定.前缀 + String(i + 1).padStart(2, '0'));
  const 实有 = Object.keys(世界树).sort();
  断言(实有.length === 节点设定.数量 && 实有.every((k, i) => k === 应有[i]),
    `节点键不符：多 ${实有.filter((k) => !应有.includes(k)).join(',') || '无'}；` +
    `缺 ${应有.filter((k) => !实有.includes(k)).join(',') || '无'}`);

  for (const [k, v] of Object.entries(世界树)) {
    const st = v?.状态;
    断言(节点设定.合法.includes(st), `${k} 状态非法：${JSON.stringify(st)}`);
    if (节点设定.未触及 !== undefined && st === 节点设定.未触及) {
      断言(!v.路径, `${k} 未触及但路径非空`);
    }
  }

  const 里程碑设定 = 配置.initvar.固定键.里程碑;
  const 里程碑 = 取值(tree, 里程碑设定.路径 || '世界.里程碑') || {};
  const 应有里 = Array.from({ length: 里程碑设定.数量 }, (_, i) => 里程碑设定.前缀 + String(i + 1).padStart(2, '0'));
  断言(应有里.every((k) => k in 里程碑) && Object.keys(里程碑).length === 里程碑设定.数量,
    `里程碑键不符，应有 ${里程碑设定.数量} 个`);
  Object.entries(里程碑).forEach(([k, v]) => 断言(typeof v === 'boolean', `里程碑 ${k} 不是布尔`));
}

/**
 * @param {Object} opt
 * @param {Object} opt.模板   来自内嵌常量的完整 initvar 对象
 * @param {Object} opt.玩家   建档结果
 * @param {Object} opt.配置   setup config
 */

/* ---------------- YAML 序列化 ----------------
   条目正文用 YAML，和源头 [initvar] 模板同格式。字符串一律带引号，
   键名只在含特殊字符时才加引号，读起来仍像原模板。 */
function 是纯量(v) { return v === null || typeof v !== 'object'; }

function 标量(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function 键名(k) {
  const s = String(k);
  return /[:#\n"'\[\]{},&*!|>@`]|^-|^\s|\s$/.test(s) ? 标量(s) : s;
}

function 转YAML(v, 缩进 = 0) {
  const pad = '  '.repeat(缩进);
  if (Array.isArray(v)) {
    if (!v.length) return pad + '[]';
    return v.map(function (x) {
      if (x && typeof x === 'object' && !Array.isArray(x)) {
        const ks = Object.keys(x);
        if (!ks.length) return pad + '- {}';
        let 出 = pad + '- ' + 键名(ks[0]) + ': ' +
          (是纯量(x[ks[0]]) ? 标量(x[ks[0]]) : '\n' + 转YAML(x[ks[0]], 缩进 + 2));
        for (let i = 1; i < ks.length; i++) {
          const k = ks[i];
          出 += '\n' + pad + '  ' + 键名(k) + ': ' +
            (是纯量(x[k]) ? 标量(x[k]) : '\n' + 转YAML(x[k], 缩进 + 2));
        }
        return 出;
      }
      return pad + '- ' + (是纯量(x) ? 标量(x) : '\n' + 转YAML(x, 缩进 + 1));
    }).join('\n');
  }
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (!ks.length) return pad + '{}';
    return ks.map(function (k) {
      return pad + 键名(k) + ': ' + (是纯量(v[k]) ? 标量(v[k]) : '\n' + 转YAML(v[k], 缩进 + 1));
    }).join('\n');
  }
  return pad + 标量(v);
}

/* ---------------- 重载初始变量 ----------------
   MVU 的合并是「旧值优先」（{...新, ...旧}），且每本书只初始化一次
   （initialized_lorebooks）。所以写完之后必须清空 stat_data、清掉初始化标记，
   再让 MVU 重读，否则新种子永远盖不过旧变量。 */
async function 重载初始变量(tree) {
  const 有Mvu = (typeof Mvu !== 'undefined') && typeof Mvu.reloadInitVar === 'function';
  if (!有Mvu) return { 跳过: true, 原因: 'Mvu 未就绪' };
  const 楼层 = (typeof getCurrentMessageId === 'function') ? getCurrentMessageId() : 'latest';
  const 读 = (typeof getVariables === 'function') ? (getVariables({ type: 'message', message_id: 楼层 }) || {}) : {};
  const data = JSON.parse(JSON.stringify(读));
  data.stat_data = {};
  delete data.initialized_lorebooks;
  await Mvu.reloadInitVar(data);
  if (typeof replaceVariables === 'function') {
    await replaceVariables(data, { type: 'message', message_id: 楼层 });
  }
  const 后 = (typeof getVariables === 'function') ? (getVariables({ type: 'message', message_id: 楼层 }) || {}) : {};
  const 实 = (后 && 后.stat_data && 后.stat_data.人物) ? Object.keys(后.stat_data.人物).sort() : [];
  const 期 = (tree && tree.人物) ? Object.keys(tree.人物).sort() : [];
  const 一致 = 实.length === 期.length && 实.every(function (k, i) { return k === 期[i]; });
  return { 写入: true, 一致: 一致, 实: 实, 期: 期, 楼层: 楼层 };
}

export async function 写入Initvar({ 模板, 玩家, 配置 }) {
  断言(模板 && typeof 模板 === 'object', '没拿到模板');
  const i = 配置.initvar;
  const 标记 = (i.标记 || '[initvar]').toLowerCase();

  // ① 找唯一条目
  const { 命中 } = await 扫条目((名) => 名.toLowerCase().includes(标记));
  断言(命中.length === 1,
    `世界书里应只有 1 条 initvar，实际 ${命中.length} 条：` +
    命中.map((h) => `${h.书}/${h.名}`).join('；'));
  const { 书, 条目, 名 } = 命中[0];

  // ② 备份
  const 备份 = {
    书, 名,
    content: 条目.content ?? '',
    entry: (() => { const o = { ...条目 }; delete o.uid; delete o.id; return o; })(),
    时间: Date.now(),
  };
  let 已备份 = false;
  try {
    if (typeof insertOrAssignVariables === 'function') {
      await insertOrAssignVariables({ [备份键(配置.卡名)]: 备份 }, { type: 'chat' });
      已备份 = true;
    }
  } catch (e) { console.warn('[建档] 备份写入失败，回滚能力不可用'); }

  // ③ 组装
  const tree = 克隆(模板);
  填玩家段(tree, 玩家 || {}, i.白名单);
  if (typeof i.派生 === 'function') i.派生(tree, 玩家 || {});
  校验固定键(tree, 配置);
  if (typeof i.额外验收 === 'function') i.额外验收(tree);

  const 正文 = '<initvar>\n' + 转YAML(tree) + '\n</initvar>';
  断言(正文.includes('<initvar>') && 正文.includes('</initvar>'), '序列化失败');
  断言(正文.length > (i.最小字节 ?? 80), '内容过短，疑似模板损坏');

  // ④ 摘牌式写入
  await 摘牌写入({ 书, 旧条目: 条目, 名, 正文, 强制: { disable: true } });

  // ⑤ 复核唯一性
  const 复核 = await 扫条目((n) => n.toLowerCase().includes(标记));
  断言(复核.命中.length === 1, '写入后 initvar 条目数异常：' + 复核.命中.length);
  const 回读 = String(复核.命中[0].条目.content || '');
  断言(回读.includes('<initvar>'), '写进去的内容不完整：读回里没有 <initvar>');

  // ⑥ 让 MVU 重读这份种子，并按模板核对人物键
  let 重载;
  try { 重载 = await 重载初始变量(tree); }
  catch (e) { throw new Error('initvar 已写入，但重载失败：' + (e?.message || e)); }
  if (重载 && 重载.跳过) console.warn('[%s] 没有重载初始变量：%s', 配置.卡名, 重载.原因 || '');
  if (重载 && 重载.写入 && 重载.一致 === false) {
    throw new Error('重载后变量与模板不一致：模板人物 ' + ((重载.期 || []).join('、') || '（空）') +
      '，实际 ' + ((重载.实 || []).join('、') || '（空）'));
  }

  console.log('[%s] initvar 已写入 %s（%d 字节）', 配置.卡名, 名, 正文.length);
  return { 书, 条目名: 名, 字节数: 正文.length, 已备份, 树: tree, 重载 };
}

/** 调试：读现有 initvar 并解析。 */
export async function 读Initvar({ 配置 }) {
  const 标记 = (配置.initvar.标记 || '[initvar]').toLowerCase();
  const { 命中 } = await 扫条目((名) => 名.toLowerCase().includes(标记));
  if (命中.length !== 1) return { 数量: 命中.length };
  const m = String(命中[0].条目.content || '').match(/<initvar>([\s\S]*?)<\/initvar>/);
  if (!m) return { 数量: 1, 错误: '条目里没有 <initvar> 块' };
  const 文本 = m[1].trim();
  try { return { 数量: 1, 书: 命中[0].书, 数据: JSON.parse(文本) }; }
  catch (e) {
    if (typeof YAML !== 'undefined' && typeof YAML.parse === 'function') {
      try { return { 数量: 1, 书: 命中[0].书, 数据: YAML.parse(文本) }; } catch (_) {}
    }
    return { 数量: 1, 书: 命中[0].书, 错误: '内容解析失败：' + (e?.message || e), 原文: 文本 };
  }
}
