// 用迷宫饭真实配置挂载一次，确认没有写死的本卡数据残留
import { JSDOM } from 'jsdom';
import { 挂载 } from '../src/wizard.js';
import { 配置 } from '../cards/manfan/config.js';

const dom = new JSDOM('<!doctype html><body><div id="slot"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

const 容器 = document.getElementById('slot');
let 收到 = null;
挂载(容器, { 配置, 写入: async (p) => { 收到 = p; return { 书: 'W', 条目名: '[initvar]', 字节数: 1, 发送: 'create' }; } });

let 通过 = 0, 失败 = 0;
const 断言 = (c, m) => { c ? (通过++, console.log('  ✓', m)) : (失败++, console.log('  ✗', m)); };
const 取 = (id) => 容器.querySelector('#' + id);
const 点 = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

断言(取('root').querySelector('.hd-title').textContent === '迷宫饭', '标题来自配置');
断言(容器.querySelectorAll('.decl').length === 4, '声明四段来自配置');
断言(容器.querySelectorAll('#races .chip').length === 10, '种族 10 个');
断言(容器.querySelectorAll('#jobs .chip').length === 8, '战斗职业 8 个');
断言(容器.querySelectorAll('#lives .chip').length === 8, '生活职业 8 个（含不选）');
断言(容器.querySelectorAll('#opt-box .opt').length === 3, '起点 3 个');
断言(容器.querySelector('[data-opt="0"]').disabled === true, 'α 置灰');

// 走完整流程：勾选 → 建档 → 存档 → 点 A
取('agree').checked = true;
取('agree').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
点(取('btn-next-0'));
点(容器.querySelector('[data-go="2"]'));
点(容器.querySelector('[data-go="3"]'));
点(容器.querySelectorAll('#jobs .chip')[3]);   // 陷阱师
点(容器.querySelectorAll('#lives .chip')[5]);   // 剥金人
取('name').value = '格罗姆';
点(取('btn-save'));
点(容器.querySelector('[data-opt="1"]'));
await new Promise((r) => setTimeout(r, 30));

断言(收到?.起点 === 'β-A', '点 A 得到 β-A');
断言(收到?.玩家段?.身份?.战斗职业 === '陷阱师', '战斗职业正确');
断言(收到?.玩家段?.身份?.生活职业 === '剥金人', '生活职业正确');
断言(收到?.玩家段?.技能?.length === 6, '技能 6 条（主职 3 + 生活 3）');
断言(收到?.玩家段?.技能?.[0]?.name === '陷阱拆除与设置', '首个技能符合职业包');

console.log('\n通过 %d，失败 %d', 通过, 失败);
process.exit(失败 ? 1 : 0);
