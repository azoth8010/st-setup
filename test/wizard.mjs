// 向导外壳的 DOM 测试：在 jsdom 里挂载，点完整套流程。
//   node test/wizard.mjs

import { JSDOM } from 'jsdom';
import { 挂载 } from '../src/wizard.js';

const dom = new JSDOM('<!doctype html><body><div id="slot"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.Event = dom.window.Event;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

const 配置 = {
  卡名: '演示卡',
  向导: {
    属性键: ['力', '敏', '智'],
    种族: [['人类', '无修正'], ['精灵', '智 +4']],
    战斗职业: ['战士', '游侠'],
    生活职业: ['不选', '厨师', '矿工'],
    技能包: {
      战士: { 线: '战斗', 职能: ['前卫'], 技能: [['重武器', 15], ['盾防', 10], ['耐力', 10]], 副业: [] },
      游侠: { 线: '战斗', 职能: ['情报'], 技能: [['侦察', 15], ['追踪', 10], ['弓术', 10]], 副业: [] },
      厨师: { 线: '生活', 职能: ['后勤'], 技能: [['料理', 15], ['解剖', 10], ['辨毒', 10]], 副业: [['料理', 5], ['解剖', 5], ['辨毒', 5]] },
      矿工: { 线: '生活', 职能: ['开路'], 技能: [['采矿', 15], ['工程', 10], ['方向感', 10]], 副业: [['采矿', 5], ['工程', 5], ['方向感', 5]] },
    },
    声明: [{ h: '原作', p: ['这一段来自配置。'] }],
    起点: [
      { id: '1', 标记: 'A', 名: '入口', 描述: '你遇见了一个人。', 键: 'A', 标签: 'A 入口' },
      { id: '2', 标记: 'B', 名: '地下', 描述: '你独自一人。', 键: 'B', 标签: 'B 地下' },
      { id: '3', 标记: 'C', 名: '未完成', 禁用: true, 原因: '还在做' },
    ],
  },
};

let 收到 = null;
const 容器 = document.getElementById('slot');
const 实例 = 挂载(容器, {
  配置,
  写入: async (payload) => { 收到 = payload; return { 书: 'W', 条目名: '[initvar]', 字节数: 123, 发送: 'create' }; },
});

let 通过 = 0, 失败 = 0;
const 点 = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
const 断言 = (c, m) => { c ? (通过++, console.log('  ✓', m)) : (失败++, console.log('  ✗', m)); };
const 取 = (id) => 容器.querySelector('#' + id);

/* 1. 挂载 */
断言(!!取('root'), '挂载出 #root');
断言(取('decl-box').textContent.includes('这一段来自配置'), '声明由配置注入');
断言(容器.querySelector('[data-demo]').style.display === 'none', '演示导航默认隐藏');
断言(取('root').getAttribute('data-step') === '0', '停在第 1 步');

/* 2. 声明页 -> 需要勾选才能下一步 */
断言(取('btn-next-0').disabled === true, '未勾选时下一步禁用');
取('agree').checked = true;
取('agree').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
断言(取('btn-next-0').disabled === false, '勾选后下一步可用');

/* 3. 跳到建档页 */
点(取('btn-next-0'));
断言(取('root').getAttribute('data-step') === '1', '进入第 2 步');

/* 4. 建档页：选职业、看技能是否按包生成 */
点(容器.querySelector('[data-go="2"]'));   // 环境 -> 档案
点(容器.querySelector('[data-go="3"]'));   // 档案 -> 建档
断言(取('root').getAttribute('data-step') === '3', '进入第 4 步建档');

const chips = 容器.querySelectorAll('#jobs .chip');
断言(chips.length === 2, '战斗职业来自配置（2 个）');
点(chips[0]);            // 战士
const 生活 = 容器.querySelectorAll('#lives .chip');
点(生活[1]);             // 厨师

/* 5. 存档 */
取('name').value = '阿甲';
点(取('btn-save'));
断言(取('root').getAttribute('data-step') === '4', '存档后进入第 5 步');

/* 6. 点起点 -> 调 写入 */
const 起点 = 容器.querySelector('[data-opt]');
断言(!!起点, '有起点按钮');
点(起点);
await new Promise((r) => setTimeout(r, 30));

断言(!!收到, '点起点调用了 写入');
断言(收到 && 收到.名字 === '阿甲', '载荷带名字');
断言(收到 && 收到.玩家段.技能.length === 6, '技能 = 主职 3 + 生活 3');
断言(收到 && 收到.玩家段.属性.力 === 50, '属性来自分配值');
断言(收到 && 收到.起点 === 'A', '起点键由配置映射');
断言(取('root').dataset.started === '1', '界面进入已开始态');
断言(容器.querySelectorAll('#opt-box .opt').length === 3, '起点按钮由配置渲染（3 个）');
断言(容器.querySelector('[data-opt="3"]').disabled === true, '禁用起点不可点');

console.log('\n通过 %d，失败 %d', 通过, 失败);
process.exit(失败 ? 1 : 0);
