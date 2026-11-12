// ============================================================
// 建档引擎 · 配置形状
//
// 引擎只认这份配置，不认任何一张卡。每张卡在自己的项目里写一份 config.js，
// 通过 createSetup(config) 交给引擎。
//
// 分三层：
//   引擎（本仓库）  怎么建档
//   配置（每卡一份） 这张卡的建档填什么
//   数据（不进仓库） 模板 YAML / 技能包 / 锚点文案
// ============================================================

/**
 * @typedef {Object} SetupConfig
 *
 * @property {string}  卡名              日志前缀与报错文案用
 * @property {number}  [文本上限=99]     叙事字段的硬上限（防整段正文误塞）
 *
 * @property {Object}  initvar
 * @property {string}  initvar.标记             条目 comment 里用于识别的子串，默认 '[initvar]'
 * @property {string[]} initvar.白名单          允许脚本写入的变量路径
 * @property {(tree:Object, 玩家:Object)=>void} [initvar.派生]
 *                                              派生值（上限、编号等）；引擎不猜公式
 * @property {Object}  initvar.固定键
 * @property {{前缀:string, 数量:number, 合法:any[]}} initvar.固定键.节点
 * @property {{前缀:string, 数量:number}}            initvar.固定键.里程碑
 * @property {(tree:Object)=>void} [initvar.额外验收]
 *
 * @property {Object}  主角档案
 * @property {string}  主角档案.条目名
 * @property {{constant:boolean, position:number, order:number}} 主角档案.位置
 * @property {(名字:string, 玩家段:Object, 起点:string)=>string} 主角档案.正文
 *
 * @property {Object}  消息
 * @property {(名字:string, 玩家段:Object, 起点:string)=>string} 消息.正文
 *
 * @property {string[]} 锚点              可选起点列表，如 ['α','β-A','β-B']
 */

/** 必填项检查：缺了就直接报，别到运行时才发现。 */
export function 校验配置(配置) {
  const 必填 = ['卡名', 'initvar', '主角档案', '消息', '锚点'];
  const 缺 = 必填.filter((k) => 配置?.[k] == null);
  if (缺.length) throw new Error('建档配置缺字段：' + 缺.join('、'));

  const i = 配置.initvar;
  ['白名单', '固定键'].forEach((k) => {
    if (i[k] == null) throw new Error('建档配置缺 initvar.' + k);
  });
  ['节点', '里程碑'].forEach((k) => {
    if (i.固定键[k] == null) throw new Error('建档配置缺 initvar.固定键.' + k);
  });
  ['条目名', '位置', '正文'].forEach((k) => {
    if (配置.主角档案[k] == null) throw new Error('建档配置缺 主角档案.' + k);
  });
  if (typeof 配置.消息.正文 !== 'function') throw new Error('建档配置 消息.正文 必须是函数');
  if (!Array.isArray(配置.锚点) || !配置.锚点.length) throw new Error('建档配置 锚点 必须是非空数组');
  return 配置;
}
