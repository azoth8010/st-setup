// ============================================================
// 迷宫饭 · 首楼入口（外链）
//
// 首楼那条正则只做一件事：把 `【开局向导】` 换成
//   <div id="mf-setup"></div> + 一行 import()
// 界面、配置、模板、技能包全在本仓库，改完推仓库即可，不用重导卡。
//
// 挂载点就在首楼 DOM 里，所以是「真同层」——不是挂到 body 上的浮层。
// ============================================================

import { 配置 } from './config.js';
import { 模板, 模板版本 } from './templates.js';
import { createSetup } from '../../src/setup-entry.js';
import { 挂载 } from '../../src/wizard.js';

const 挂载点ID = 'mf-setup';

function 找挂载点() {
  return document.getElementById(挂载点ID);
}

function 启动(容器) {
  const setup = createSetup({ 配置, 模板, 模板版本 });
  挂载(容器, {
    配置,
    写入: async (载荷) => {
      const 结果 = await setup.写入(载荷);
      // 写完之后把首楼换成一句「已开始」，免得玩家再点
      容器.dispatchEvent(new CustomEvent('setup:done', { detail: 结果, bubbles: true }));
      return 结果;
    },
  });
}

const 容器 = 找挂载点();
if (容器) {
  启动(容器);
} else {
  // 正则可能在楼层渲染完成前就跑了；等一会儿再找一次
  let 次数 = 0;
  const 定时 = setInterval(() => {
    次数 += 1;
    const el = 找挂载点();
    if (el) { clearInterval(定时); 启动(el); }
    else if (次数 > 40) {
      clearInterval(定时);
      console.warn('[迷宫饭·向导] 首楼没有 #' + 挂载点ID + '，检查首楼正则是否生效');
    }
  }, 250);
}
