// 引擎冒烟测试：用一套最小配置跑完整链路，不需要任何真实卡。
//   node test/smoke.mjs
//
// 验的点：写条目 / 单条目不变 / 玩家段白名单 / 派生 / 固定键验收 /
//        主角档案 / 建档消息 / 重复点击不重发 / 越权拦截 / 失败回滚

import { createSetup } from '../src/setup-entry.js';

/* ---------- 假 ST 环境 ---------- */

function 造世界书() {
  return { W: [{ uid: 1, comment: '[initvar]变量初始化', content: '<initvar>{}</initvar>', key: [] }] };
}

function 装环境(世界书, 选项 = {}) {
  const 状态 = { chatVars: {}, 消息: [], 触发: 0 };
  globalThis.getLorebookSettings = async () => ({ selected_global_lorebooks: [] });
  globalThis.getCharLorebooks = async () => ({ primary: 'W', additional: [] });
  globalThis.getLorebookEntries = async (n) => JSON.parse(JSON.stringify(世界书[n] || []));
  globalThis.setLorebookEntries = async (n, list) => list.forEach((x) => {
    const e = 世界书[n].find((y) => y.uid === x.uid);
    if (e) Object.assign(e, x);
  });
  globalThis.deleteWorldbookEntries = async (n, p) => { 世界书[n] = 世界书[n].filter((e) => !p(e)); };
  globalThis.createWorldbookEntries = async (n, list) => {
    if (选项.拒绝创建) throw new Error('模拟：写入被拒');
    list.forEach((e, i) => 世界书[n].push({ uid: 100 + i, ...e }));
  };
  globalThis.getVariables = () => 状态.chatVars;
  globalThis.insertOrAssignVariables = async (o) => Object.assign(状态.chatVars, o);
  globalThis.createChatMessages = async (a) => 状态.消息.push(...a);
  globalThis.triggerSlash = async () => { 状态.触发 += 1; };
  return 状态;
}

/* ---------- 最小配置与模板 ---------- */

const 配置 = {
  卡名: 'TEST',
  锚点: ['A'],
  initvar: {
    标记: '[initvar]',
    白名单: ['玩家.名字', '玩家.属性.力', '玩家.属性.敏', '玩家.HP', '_nextUid'],
    派生(tree, 玩家) {
      tree.玩家.HP = 10 + (玩家?.属性?.力 || 0);
      tree._nextUid = 2;
    },
    固定键: {
      节点: { 前缀: 'N', 数量: 2, 合法: ['未触及', true, false], 未触及: '未触及' },
      里程碑: { 前缀: 'M', 数量: 2 },
    },
  },
  主角档案: {
    条目名: '[主角档案]',
    位置: { constant: true, position: 0, order: 9 },
    正文: (名, 段) => '[主角档案]\n\n' + 名 + ' · 力 ' + 段.属性.力,
  },
  消息: { 正文: (名, 段) => '我是' + 名 + '，力 ' + 段.属性.力 + '，HP ' + 段.HP + '。' },
};

function 模板() {
  return {
    A: {
      世界: {
        节点: { N01: { 状态: '未触及', 路径: '' }, N02: { 状态: '未触及', 路径: '' } },
        里程碑: { M01: false, M02: false },
      },
      玩家: { 名字: '', 属性: { 力: 0, 敏: 0 }, HP: 0 },
      _nextUid: 1,
    },
  };
}

/* ---------- 断言 ---------- */

let 通过 = 0, 失败 = 0;
function 断言(cond, msg) {
  if (cond) { 通过 += 1; console.log('  ✓', msg); }
  else { 失败 += 1; console.log('  ✗', msg); }
}

async function 试(fn, msg) {
  try { await fn(); 断言(true, msg); } catch (e) { 断言(false, msg + ' → ' + e.message); }
}

/** 期望抛错 */
async function 应抛(fn, msg, 关键词) {
  try {
    await fn();
    断言(false, msg + ' → 没有抛错');
  } catch (e) {
    断言(!关键词 || e.message.includes(关键词), msg + (关键词 ? '（关键词：' + 关键词 + '）' : ''));
  }
}

/* ---------- 用例 ---------- */

const 世界书 = 造世界书();
const 状态 = 装环境(世界书);
const setup = createSetup({ 配置, 模板: 模板(), 模板版本: 't' });
const 玩家段 = { 名字: '阿甲', 属性: { 力: 7, 敏: 3 } };

console.log('— 正常建档');
const r = await setup.写入({ 名字: '阿甲', 玩家段, 起点: 'A' });
断言(r.字节数 > 100, '写入返回字节数');
断言(状态.消息.length === 1 && 状态.触发 === 1, '发出 1 条消息并触发 1 次');
断言(r.玩家.HP === 17, '派生生效（HP = 10 + 力）');
断言(世界书.W.filter((e) => e.comment.includes('[initvar]')).length === 1, 'initvar 仍只有 1 条');
断言(世界书.W.some((e) => e.comment === '[主角档案]'), '主角档案已写入');

console.log('— 重复点击');
const r2 = await setup.写入({ 名字: '阿甲', 玩家段, 起点: 'A' });
断言(r2.发送 === 'skipped', '第二次跳过发消息');
断言(状态.消息.length === 1, '消息没有重复');

console.log('— 越权与缺键');
await 应抛(() => setup.写入({ 名字: 'x', 玩家段: { 世界: { 危险: 1 } }, 起点: 'A' }), '白名单外写入被拒', '越权');
await 应抛(() => setup.写入({ 名字: 'x', 玩家段: { 不存在: 1 }, 起点: 'A' }), '白名单外的未知路径被拒', '越权');

console.log('— 未知起点');
await 应抛(() => setup.写入({ 名字: 'x', 玩家段, 起点: 'Z' }), '未知起点被拒', '未知起点');

console.log('— 写入失败回滚');
const 书2 = 造世界书();
const 原文 = '<initvar>\n{"旧":true}\n</initvar>';
书2.W[0].content = 原文;
装环境(书2, { 拒绝创建: true });
const setup2 = createSetup({ 配置, 模板: 模板(), 模板版本: 't' });
await 应抛(() => setup2.写入({ 名字: 'x', 玩家段, 起点: 'A' }), '创建失败会抛错', '失败');
断言(书2.W.length === 1 && 书2.W[0].content === 原文, '旧条目已恢复（名字与内容都在）');

console.log('\n通过 %d，失败 %d', 通过, 失败);
process.exit(失败 ? 1 : 0);
