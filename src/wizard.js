// ============================================================
// 开局向导（通用外壳）
//
// 由卡项目的 preview/开局向导.html 抽出：样式、结构、流程都在这里，
// 选项组 / 属性组 / 额外字段 / 技能包 / 声明 / 起点 全部由 配置.向导 注入。
//
// 用法：挂载(容器, { 配置, 写入 })
//   - 写入(payload) 可选；没有就走演示态（不写任何东西）
//   - 容器通常是首楼消息里的一个 div
// ============================================================

export const 样式 = String.raw`
  :root{
    --paper-base:#f3e8d2; --paper-raised:#f9f1df; --paper-sunken:#e8d9bd; --paper-deep:#dcc9a5;
    --p300:#d8be79; --p400:#ba8e4a; --p500:#8c5a2b; --p700:#743e1d; --p900:#5c250f;
    --n300:#c8c3b1; --n400:#aca391; --n500:#8f8270; --n600:#796a5c; --n700:#625349; --n800:#4c3c35; --n900:#352722;
    --ink3:#756342; --jade:#4a6b3a; --jade-bg:#f8feeb; --jade-line:#abbd8a;
    --danger:#a33a2a; --danger-bg:#fff4eb; --danger-line:#ca754a;
    --mono:ui-monospace,Menlo,Consolas,monospace;
    --serif:"Noto Serif SC","Source Han Serif SC","Songti SC",SimSun,serif;
    --sans:-apple-system,"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{margin:0;background:#e6dcc8;padding:14px;font-family:var(--sans);color:var(--n900);display:block}
  #root{width:100%;margin:0 auto}

  /* 预览条（真机不存在） */
  .demo{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:14px;font:14px var(--mono);color:#7a6a54}
  .demo button{font:14px var(--sans);padding:3px 9px;background:#f3e8d2;border:1px solid #c8c3b1;border-radius:2px;color:#5c4a38;cursor:pointer}
  .demo button[aria-current="true"]{background:#8c5a2b;border-color:#743e1d;color:#f9f1df}

  .card{width:100%!important;background:var(--paper-raised);border:1px solid var(--n300);border-radius:3px;overflow:hidden;
        box-shadow:0 1px 0 rgba(53,39,34,.05),0 14px 30px -20px rgba(53,39,34,.4)}

  /* 顶部 */
  .hd{padding:18px 22px 14px;background:var(--paper-base);border-bottom:1px solid var(--paper-deep);position:relative}
  .hd::after{content:"";position:absolute;left:22px;right:22px;bottom:3px;border-bottom:1px solid rgba(186,142,74,.32)}
  .hd-row{display:flex;align-items:baseline;justify-content:space-between;font:13.5px var(--mono);letter-spacing:.16em;color:var(--ink3)}
  .hd-title{margin-top:8px;font:600 19px/1.3 var(--serif);letter-spacing:.14em;color:var(--p900)}
  .steps{display:flex;gap:0;margin-top:13px}
  .step{flex:1;padding-top:7px;border-top:2px solid var(--paper-deep);font:13.5px var(--sans);letter-spacing:.06em;color:var(--n400);transition:.18s}
  .step[data-on="1"]{border-top-color:var(--p500);color:var(--p700)}
  .step[data-done="1"]{border-top-color:var(--p300);color:var(--n600)}

  /* 页面 */
  .pg{display:none;width:100%;padding:20px 22px 22px}
  @media (max-width:600px){
    body{padding:8px}
    .pg{padding:16px 14px 18px}
  }
  .pg[data-on="1"]{display:block}
  .pg-h{font:600 14px/1.4 var(--serif);letter-spacing:.08em;color:var(--n900);margin-bottom:4px}
  .pg-s{font-size:13.5px;line-height:1.75;color:var(--ink3);margin-bottom:16px}

  /* 声明块 */
  .decl{border:1px solid var(--paper-deep);border-radius:2px;background:var(--paper-base);padding:13px 15px;margin-bottom:10px}
  .decl h4{font:600 12.5px/1.4 var(--sans);letter-spacing:.06em;color:var(--p700);margin-bottom:6px}
  .decl p{font-size:13.5px;line-height:1.85;color:var(--n700)}
  .decl p+p{margin-top:5px}
  .decl b{font-weight:600;color:var(--n900)}
  .gate{display:flex;align-items:flex-start;gap:9px;margin-top:14px;padding:11px 13px;border:1px dashed var(--p300);border-radius:2px;background:var(--paper-sunken);cursor:pointer}
  .gate input{margin-top:2px;accent-color:var(--p500);flex:0 0 auto}
  .gate span{font-size:13.5px;line-height:1.7;color:var(--n800)}

  /* 自检行 */
  .chk{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px dashed var(--paper-deep)}
  .chk:last-of-type{border-bottom:0}
  .mk{flex:0 0 18px;height:18px;border-radius:2px;display:flex;align-items:center;justify-content:center;font:14px/1 var(--mono);margin-top:1px}
  .mk[data-s="ok"]{background:var(--jade-bg);border:1px solid var(--jade-line);color:var(--jade)}
  .mk[data-s="no"]{background:var(--danger-bg);border:1px solid var(--danger-line);color:var(--danger)}
  .mk[data-s="wait"]{background:var(--paper-sunken);border:1px solid var(--n300);color:var(--n500)}
  .chk-t{flex:1;min-width:0}
  .chk-n{font-size:15px;font-weight:600;color:var(--n900)}
  .chk-d{font-size:14.5px;line-height:1.7;color:var(--ink3);margin-top:2px}
  .chk-d code{font:14px var(--mono);background:var(--paper-sunken);padding:0 4px;border-radius:2px}

  /* 档案 */
  .file{border:1px solid var(--n300);border-radius:2px;background:var(--paper-base);padding:14px 16px;margin-bottom:10px}
  .file[data-empty="1"]{border-style:dashed}
  .file-n{font-size:14.5px;font-weight:600;color:var(--n900)}
  .file-d{font-size:14.5px;line-height:1.75;color:var(--ink3);margin-top:4px}
  .file-b{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}

  /* 按钮 */
  .btn{font:14px var(--sans);padding:8px 16px;border-radius:2px;cursor:pointer;letter-spacing:.05em;
       background:var(--paper-base);border:1px solid var(--n300);color:var(--n800);transition:.15s}
  .btn:hover{border-color:var(--p400);color:var(--p700)}
  .btn[data-v="main"]{background:var(--p500);border-color:var(--p700);color:var(--paper-raised);font-weight:600}
  .btn[data-v="main"]:hover{background:var(--p700);color:#fff}
  .btn[data-v="danger"]{border-color:var(--danger-line);color:var(--danger);background:var(--danger-bg)}
  .btn:disabled{opacity:.42;cursor:not-allowed}
  .btn:disabled:hover{border-color:var(--n300);color:var(--n800)}
  .foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid var(--paper-deep)}
  .foot .tip{font-size:15px;color:var(--n500)}

  /* 建档 */
  .field{margin-bottom:16px}
  .lb{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:7px}
  .lb b{font:600 12.5px var(--sans);letter-spacing:.06em;color:var(--n900)}
  .lb i{font:14px var(--mono);font-style:normal;color:var(--n500)}
  .races{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px}
  .race{font:14.5px var(--sans);padding:7px 4px;text-align:center;border:1px solid var(--n300);border-radius:2px;
        background:var(--paper-base);color:var(--n700);cursor:pointer;transition:.14s}
  .race:hover{border-color:var(--p400);color:var(--p700)}
  .race[aria-pressed="true"]{background:var(--paper-sunken);border-color:var(--p500);color:var(--p900);font-weight:600}
  .attrs{border:1px solid var(--paper-deep);border-radius:2px;overflow:hidden}
  .ar{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:8px;padding:7px 11px;border-bottom:1px solid var(--paper-deep);background:var(--paper-base)}
  .ar:last-child{border-bottom:0}
  .ar .adj{font-style:normal;font-size:12.5px;color:#8a6a44;margin-left:2px}
  .ar .fin{font-style:normal;font-size:12.5px;color:var(--p700);margin:0 2px}
  .ar span{font-size:13.5px;color:var(--n700)}
  .bar{height:3px;background:var(--paper-deep);border-radius:2px;overflow:hidden}
  .bar i{display:block;height:100%;background:var(--p400)}
  .num{display:flex;align-items:center;gap:6px;font:13.5px var(--mono);color:var(--n900)}
  .num button{width:20px;height:20px;line-height:1;border:1px solid var(--n300);background:var(--paper-raised);border-radius:2px;cursor:pointer;color:var(--n700);font:13.5px var(--mono)}
  .num button:hover{border-color:var(--p400);color:var(--p700)}
  .pts{margin-top:8px;font:14.5px var(--mono);color:var(--ink3)}
  .pts b{color:var(--p700)}
  .txt{width:100%;padding:8px 10px;border:1px solid var(--n300);border-radius:2px;background:var(--paper-base);font:14.5px var(--serif);color:var(--n900)}
  .txt:focus{outline:2px solid var(--p300);outline-offset:1px}

  /* 开场 */
  .arc{margin-bottom:18px}
  .arc-h{display:flex;align-items:baseline;gap:9px;margin-bottom:3px}
  .arc-k{font:600 13px var(--serif);letter-spacing:.1em;color:var(--p900)}
  .arc-t{font:14px var(--mono);color:var(--n500);letter-spacing:.04em}
  .arc-s{font-size:14.5px;line-height:1.7;color:var(--ink3);margin-bottom:9px}
  .arc[data-lock="1"] .arc-k{color:var(--n500)}
  .locked{display:flex;align-items:center;gap:8px;padding:11px 14px;border:1px dashed var(--n300);border-radius:2px;
          background:var(--paper-sunken);color:var(--n500);font-size:13.5px;letter-spacing:.03em}

  .opt{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:13px 15px;margin-bottom:8px;
       background:var(--paper-base);border:1px solid var(--n300);border-left:2px solid var(--p300);border-radius:2px;
       font-family:inherit;color:inherit;cursor:pointer;transition:.16s}
  .opt:hover{background:var(--paper-raised);border-color:var(--p400);border-left-color:var(--p500)}
  .opt:active{transform:translateY(1px)}
  .opt-m{flex:0 0 26px;font:600 17px var(--serif);color:var(--p400);text-align:center;border-right:1px solid var(--paper-deep);height:30px;line-height:30px}
  .opt:hover .opt-m{color:var(--p500)}
  .opt-t{flex:1;min-width:0}
  .opt-n{font:600 14px var(--serif);letter-spacing:.06em;color:var(--n900)}
  .opt-d{font-size:14.5px;line-height:1.6;color:var(--ink3);margin-top:2px}
  .opt-a{font:14px var(--mono);color:var(--n400)}
  .opt:hover .opt-a{color:var(--p500)}

  .note{font-size:15px;line-height:1.7;color:var(--n400);margin-top:10px}
  .lnk{color:#8c5a2b;text-decoration:none;border-bottom:1px solid #d8be79;margin-left:6px;font-size:15px}
  .lnk:hover{color:#743e1d}
  .opt:disabled{opacity:.5;cursor:not-allowed;filter:grayscale(.4)}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .started-line{display:flex;align-items:center;gap:7px;margin-top:14px;padding:8px 12px;
    border:1px solid #abbd8a;border-radius:2px;background:#f8feeb;font-size:14.5px;color:#3a5a2e}
  .started-line b{font-weight:600}
  .started-line .dot{width:5px;height:5px;border-radius:1px;background:#4a6b3a}
  .toast-wrap{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
    display:flex;flex-direction:column;align-items:center;gap:8px;
    z-index:99999;pointer-events:none}
  .toast{background:#3a5a2e;color:#f4f8ee;font:14.5px/1.6 var(--sans);padding:10px 18px;border-radius:4px;
    box-shadow:0 14px 40px -18px rgba(0,0,0,.75);opacity:0;transform:translateY(8px) scale(.98);
    transition:opacity .2s ease,transform .2s ease;max-width:none;white-space:nowrap;letter-spacing:.02em}
  .toast[data-in="1"]{opacity:.97;transform:none}
  .toast[data-err="1"]{background:#8a2f22}
  .note b{color:var(--n600);font-weight:600}

  .arch{border:1px solid var(--n300);border-radius:2px;background:var(--paper-base);padding:11px 13px;margin-bottom:9px;display:flex;align-items:center;gap:11px}
  .arch-m{flex:0 0 32px;height:32px;border:1px solid var(--p300);border-radius:2px;background:var(--paper-sunken);
          display:flex;align-items:center;justify-content:center;font:600 14px var(--serif);color:var(--p700)}
  .arch-t{flex:1;min-width:0}
  .arch-n{display:block;font-size:15px;font-weight:600;color:var(--n900)}
  .arch-d{display:block;font-size:15px;line-height:1.6;color:var(--ink3);margin-top:2px}
  .arch-b{display:flex;gap:6px;flex:0 0 auto}
  .mini{font:14px var(--sans);padding:4px 9px;border:1px solid var(--n300);border-radius:2px;background:var(--paper-raised);color:var(--n700);cursor:pointer}
  .mini:hover{border-color:var(--p400);color:var(--p700)}
  .mini[data-v="danger"]{border-color:var(--danger-line);color:var(--danger);background:var(--danger-bg)}
  .empty{border:1px dashed var(--n300);border-radius:2px;background:var(--paper-sunken);padding:16px 14px;text-align:center;font-size:13.5px;color:var(--n500);margin-bottom:9px}
  .chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
  .chip{font:14.5px var(--sans);padding:7px 4px;text-align:center;border:1px solid var(--n300);border-radius:2px;
        background:var(--paper-base);color:var(--n700);cursor:pointer;transition:.14s}
  .chip:hover{border-color:var(--p400);color:var(--p700)}
  .chip[aria-pressed="true"]{background:var(--paper-sunken);border-color:var(--p500);color:var(--p900);font-weight:600}
  .who{display:flex;align-items:center;gap:6px;margin-bottom:14px;padding:8px 12px;border:1px solid var(--jade-line);
       border-radius:2px;background:var(--jade-bg);font-size:14.5px;color:var(--jade)}
  .who b{font-weight:600}
  .pts[data-over="1"] b{color:var(--danger)}
  .pts[data-over="1"] span:last-child{color:var(--danger)}
  @media (max-width:400px){
    .hd-title{font-size:17px}
    .step{font-size:9.5px;letter-spacing:0}
    .pg{padding:16px 15px 18px}
    .opt{padding:11px 12px;gap:10px}
    .opt-n{font-size:14.5px}
  }`;

export const 结构 = String.raw`

  <div class="demo" data-demo="1">
    预览：
    <button data-go="0" aria-current="true">01 声明</button>
    <button data-go="1">02 环境</button>
    <button data-go="2">03 档案</button>
    <button data-go="3">04 建档</button>
    <button data-go="4">05 开场</button>
  </div>

  <div class="card" id="root" data-step="0">

    <div class="hd">
      <div class="hd-row"><span>冒险者登记</span><span>No. 0007</span></div>
      <div class="hd-title" data-fill="卡名"></div>
      <div class="steps">
        <div class="step" data-i="0" data-on="1">声明</div>
        <div class="step" data-i="1">环境</div>
        <div class="step" data-i="2">档案</div>
        <div class="step" data-i="3">建档</div>
        <div class="step" data-i="4">开场</div>
      </div>
    </div>

    <!-- 01 声明 -->
    <section class="pg" data-i="0" data-on="1">
      <div class="pg-h">开始之前</div>

      <div id="decl-box"></div>


      <label class="gate">
        <input type="checkbox" id="agree">
        <span>我已读过上面四段，知道这是二创、知道内容包含死亡与猎奇题材。</span>
      </label>

      <div class="foot">
        <span class="tip">下一步检查运行环境</span>
        <button class="btn" data-v="main" id="btn-next-0" disabled>继续 →</button>
      </div>
    </section>

    <!-- 02 环境 -->
    <section class="pg" data-i="1">
      <div class="pg-h">运行环境</div>

      <div class="chk" data-chk="tavern">
        <span class="mk" data-s="wait">…</span>
        <div class="chk-t">
          <div class="chk-n">酒馆助手（JS-Slash-Runner）
            <a class="lnk" href="https://discord.com/channels/1134557553011998840/1296494001406345318" target="_blank" rel="noopener">原帖</a></div>
        </div>
      </div>

      <div class="chk" data-chk="prompt">
        <span class="mk" data-s="wait">…</span>
        <div class="chk-t">
          <div class="chk-n">提示词模板（ST-Prompt-Template）
            <a class="lnk" href="https://discord.com/channels/1134557553011998840/1336648321963524127" target="_blank" rel="noopener">原帖</a></div>
        </div>
      </div>

      <div class="chk" data-chk="mvu">
        <span class="mk" data-s="wait">…</span>
        <div class="chk-t">
          <div class="chk-n">MVU 变量系统</div>
          <div class="chk-d">卡里自带。如果你装过全局 MVU 脚本，<b>先关掉它</b>，否则两边抢同一个变量表。</div>
        </div>
      </div>

      <div class="chk" data-chk="extra">
        <span class="mk" data-s="wait">…</span>
        <div class="chk-t">
          <div class="chk-n">额外模型解析</div>
        </div>
      </div>

      <div class="chk" data-chk="wb">
        <span class="mk" data-s="wait">…</span>
        <div class="chk-t">
          <div class="chk-n">世界书已导入</div>
        </div>
      </div>


      <div class="foot">
        <button class="btn" data-back="0">← 上一步</button>
        <button class="btn" data-v="main" data-go="2">知道了，继续 →</button>
      </div>
    </section>

    <!-- 03 档案（多份） -->
    <section class="pg" data-i="2">
      <div class="pg-h">角色档案</div>
      <p class="pg-s">也可以不建，那就用默认人设。</p>

      <div id="arch-list"></div>

      <div class="foot">
        <button class="btn" data-back="1">← 上一步</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="btn-default">用默认人设开始</button>
          <button class="btn" data-v="main" id="btn-new">＋ 新建档案</button>
        </div>
      </div>
    </section>

    <!-- 04 建档 -->
    <section class="pg" data-i="3">
      <div class="pg-h" id="edit-h">新建档案</div>
      <p class="pg-s" id="form-note"></p>
      <p class="pg-s" style="margin-top:2px;color:#8f8270">起点在下一步选。它不影响你的角色，只决定你从哪儿开始。</p>

      <div class="field">
        <div class="lb" id="lb-race"><b></b><i id="race-note"></i></div>
        <div class="chips" id="races"></div>
      </div>

      <div class="field">
        <div class="lb" id="lb-job"><b></b><i></i></div>
        <div class="chips" id="jobs"></div>
      </div>

      <div class="field">
        <div class="lb" id="lb-life"><b></b><i></i></div>
        <div class="chips" id="lives"></div>
      </div>

      <div class="field">
        <div class="lb" id="lb-side"><b>副业</b><i></i></div>
        <div class="chips" id="lives2"></div>
        <div class="pg-s" style="margin-top:4px;color:#8f8270;font-size:15px">
          选了只给这三项技能各 +5，加成有限；职能和主职重复时不会生效。
        </div>
      </div>

      <div class="field">
        <div class="lb" id="lb-attr"><b>属性</b><i></i></div>
        <div class="attrs" id="attrs"></div>
        <div class="pts" id="pts"><span>已分配 <b>0</b> / 300</span><span id="pts-warn"></span></div>
      </div>

      <div class="field">
        <div class="lb"><b>名字</b><i id="name-note">可留空 · 建档后不可改名</i></div>
        <input class="txt" id="name" placeholder="留空的话，队友会先问你叫什么">
      </div>

      <div class="field" id="field-extra" hidden>
        <div class="lb" id="lb-extra"><b></b><i></i></div>
        <input class="txt" id="desire" placeholder="">
      </div>

      <div class="foot">
        <button class="btn" data-back="2">← 上一步</button>
        <button class="btn" data-v="main" id="btn-save">存下档案 →</button>
      </div>
    </section>

    <!-- 05 开场 -->
    <section class="pg" data-i="4">
      <div class="pg-h">选择开场</div>
      <p class="pg-s">两个锚点。α 还没写完，先只开 β。</p>

      <div class="who">当前档案：<b id="who-t">默认人设</b></div>

      <div class="arc" data-lock="1">
        <div class="arc-h"><span class="arc-k">α · 讨伐红龙前</span><span class="arc-t">514 年 2 月 23 日</span></div>
        <p class="arc-s">队伍没散，法琳没被吞。</p>
        <div class="locked"><span>尚未开放</span><span style="opacity:.6">·</span><span>后续版本开放</span></div>
      </div>

      <div class="arc">
        <div class="arc-h"><span class="arc-k">β · 正篇开始</span><span class="arc-t">514 年 3 月 16 日</span></div>
        <p class="arc-s">莱欧斯、玛露希尔和奇尔查克再次进入迷宫，营救法琳。缺食物，莱欧斯计划吃魔物。</p>

        <div id="opt-box"></div>
      </div>


      <div class="foot">
        <button class="btn" data-back="2">← 改档案</button>
        <span class="tip" id="pick-tip">选定后进入正文</span>
      </div>

      <div id="started-box" hidden></div>
    </section>

  </div>`;

export function 挂载(容器, 选项 = {}) {
  const 配置 = 选项.配置 || {};
  const 向导 = 配置.向导 || {};
  const 写入 = 选项.写入 || null;
  const 技能包 = 向导.技能包 || {};
  const 取 = (id) => 容器.querySelector('#' + id);

  /* 选项槽：引擎只认槽名（race/job/life/side），标签、说明、选项都从配置来 */
  const 槽表 = {};
  (向导.选项组 || []).forEach((g) => { 槽表[g.槽] = g; });
  const 槽选项 = (k) => (槽表[k] && 槽表[k].选项) || [];
  const 选项清单 = (k) => 槽选项(k).map((x) => (Array.isArray(x) ? x : [x, '']));

  /* 属性组 */
  const 属性配置 = 向导.属性 || {};
  const 属性标签 = 属性配置.标签 || '属性';
  const 属性合计 = 属性配置.合计上限 == null ? 300 : 属性配置.合计上限;
  const 修正表 = 向导.种族修正 || {};
  function 种族修正() { return 修正表[st.race] || [0,0,0,0,0,0]; }
  const 单项界 = 属性配置.单项 || [30, 70];

  /* 额外文本字段：0 或 1 个，写进 config 指定的变量路径 */
  const 额外 = (向导.额外字段 || [])[0] || null;

  if (!容器.querySelector('#mf-setup-style')) {
    const st = document.createElement('style');
    st.id = 'mf-setup-style';
    st.textContent = 样式;
    容器.appendChild(st);
  }

  容器.innerHTML += 结构;
  容器.querySelectorAll('[data-fill]').forEach((el) => {
    const k = el.getAttribute('data-fill');
    el.textContent = (k === '卡名' ? 配置.卡名 : 向导[k]) || '';
  });
  if (!选项.预览) 容器.querySelectorAll('[data-demo]').forEach((el) => { el.style.display = 'none'; });
  if (向导.说明) 取('form-note').textContent = 向导.说明;

  ['race', 'job', 'life', 'side'].forEach((k) => {
    const g = 槽表[k], lb = 取('lb-' + k);
    if (!g || !lb) return;
    lb.querySelector('b').textContent = g.标签 || '';
    const i = lb.querySelector('i');
    if (i) i.textContent = g.说明 || '';
  });
  {
    const lb = 取('lb-attr');
    if (lb) {
      lb.querySelector('b').textContent = 属性标签;
      const i = lb.querySelector('i');
      if (i) i.textContent = 属性配置.说明 ||
        ('购点合计 ≤' + 属性合计 + ' · 单项 ' + 单项界[0] + '–' + 单项界[1] + '（种族修正另算，不计入合计）');
    }
  }
  if (额外) {
    取('field-extra').hidden = false;
    取('lb-extra').querySelector('b').textContent = 额外.标签 || '';
    取('lb-extra').querySelector('i').textContent = 额外.说明 || '';
    取('desire').setAttribute('placeholder', 额外.占位 || '');
    if (额外.最大长度) 取('desire').setAttribute('maxlength', 额外.最大长度);
  }

  const 起点箱 = 容器.querySelector('#opt-box');
  if (起点箱) {
    起点箱.innerHTML = (向导.起点 || []).map((x) => {
      const 禁 = x.禁用 ? ' data-off="1"' : '';
      return '<button class="opt" data-opt="' + x.id + '"' + 禁 + (x.禁用 ? ' disabled' : '') + '>' +
        '<span class="opt-m">' + (x.标记 || '') + '</span>' +
        '<span class="opt-t"><span class="opt-n">' + (x.名 || '') + '</span>' +
        '<span class="opt-d">' + (x.禁用 ? (x.原因 || '暂不可选') : (x.描述 || '')) + '</span></span>' +
        '<span class="opt-a">' + (x.禁用 ? '—' : '进入 →') + '</span></button>';
    }).join('');
  }

  /* 运行环境：能探的都真探，探不到的标「需自查」，不摆样子 */
  function 探测环境() {
    const 置 = (键, 状态, 说明) => {
      const 块 = 容器.querySelector('[data-chk="' + 键 + '"]');
      if (!块) return;
      const 标 = 块.querySelector('.mk');
      if (标) { 标.setAttribute('data-s', 状态); 标.textContent = 状态 === 'ok' ? '√' : (状态 === 'no' ? '×' : '…'); }
      if (说明) {
        let d = 块.querySelector('.chk-d');
        if (!d) { d = document.createElement('div'); d.className = 'chk-d'; 块.querySelector('.chk-t').appendChild(d); }
        d.textContent = 说明;
      }
    };
    const 有 = (名) => { try { return typeof window[名] !== 'undefined'; } catch (e) { return false; } };

    置('tavern', (有('TavernHelper') || 有('eventOn') || 有('getVariables')) ? 'ok' : 'no',
       (有('TavernHelper') || 有('getVariables')) ? '' : '没探到酒馆助手：界面、状态条、向导都靠它挂载。');

    let 模板 = false;
    try { 模板 = typeof getvar === 'function' || typeof getChatMessages === 'function'; } catch (e) { 模板 = false; }
    置('prompt', 模板 ? 'ok' : 'no', 模板 ? '' : '没探到提示词模板（ST-Prompt-Template）：世界书里的 EJS 控制器不会渲染。');

    置('mvu', 有('Mvu') ? 'ok' : '…', 有('Mvu') ? '' : '还没初始化，进正文后才会挂上；若届时报「stat_data 为空」，先关掉全局 MVU 脚本。');

    let 世界书 = false;
    try {
      const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) ? SillyTavern.getContext() : null;
      const 名 = ctx && ctx.chatMetadata && ctx.chatMetadata.world_info;
      世界书 = !!(名 || (ctx && ctx.worldInfo));
    } catch (e) { 世界书 = false; }
    置('wb', 世界书 ? 'ok' : '…', 世界书 ? '' : '没读到当前对话绑定的世界书，自己在酒馆的世界书面板确认一下。');

    置('extra', '…', '这一项脚本探不到：确认「额外模型解析」已开且填了模型，否则判定与变量都不会结算。');
  }

  const 声明箱 = 容器.querySelector('#decl-box');
  if (声明箱) {
    声明箱.innerHTML = (向导.声明 || []).map((段) => (
      '<div class="decl"><h4>' + 段.h + '</h4>' +
      段.p.map((t) => '<p>' + t + '</p>').join('') + '</div>'
    )).join('');
  }

  探测环境();

  /* 宽度：首楼会被渲染在一个「按内容撑宽」的 iframe 里，自己这一层不可信。
     量宿主的消息正文列，给卡片写死 px；并且必须持续跟着宿主变——
     只在挂载时量一次，窗口一变就是「窄了被裁、宽了留白」。 */
  function 外层文档() {
    try { if (window.parent && window.parent !== window) return window.parent.document; } catch (e) {}
    return document;
  }
  const 取宽 = (el) => (el && el.clientWidth) || 0;

  function 量宿主宽() {
    const 外层 = 外层文档();
    const 文 = 外层.querySelector('#chat .mes_text') || 外层.querySelector('.mes_text');
    const 文宽 = 取宽(文);
    if (文宽 >= 300) return 文宽;

    const 消息 = 外层.querySelector('#chat .mes') || 外层.querySelector('.mes');
    if (消息) {
      const 头像 = 消息.querySelector('.avatar');
      const 净 = 取宽(消息) - (头像 ? 取宽(头像) + 8 : 0);
      if (净 >= 300) return 净;
    }

    const 聊 = 取宽(外层.querySelector('#chat'));
    if (聊 > 0) return 聊 - 32;

    try {
      const fe = window.frameElement;
      if (fe && fe.getBoundingClientRect) {
        const w = fe.getBoundingClientRect().width;
        if (w >= 300) return w;
      }
    } catch (e) {}

    return 取宽(容器.parentElement) || window.innerWidth;
  }

  function 适配宽度() {
    const 壳 = 容器.querySelector('#root');
    if (!壳) return;
    const 外层 = 外层文档();
    const 体 = getComputedStyle(document.body);
    const 内边 = (parseFloat(体.paddingLeft) || 0) + (parseFloat(体.paddingRight) || 0);
    let 可用 = 量宿主宽();
    const 聊 = 外层.querySelector('#chat');
    let 滚动 = 0;
    if (聊) {
      可用 = Math.min(可用, 取宽(聊) - 8);
      /* 经典滚动条占位；覆盖式滚动条量出来是 0，靠后面的固定净空兜底 */
      滚动 = Math.max(0, (聊.offsetWidth || 0) - (聊.clientWidth || 0));
    }
    /* 末尾的 16 是给滚动条/圆角留的视觉净空，不然右边缘会贴到滚动条底下 */
    const 宽 = Math.max(280, Math.min(2000, 可用 - 内边 - 滚动 - 16));
    if (壳.dataset.w === String(宽)) return;
    壳.dataset.w = String(宽);
    壳.style.setProperty('width', 宽 + 'px', 'important');
    壳.style.setProperty('max-width', 宽 + 'px', 'important');
  }

  [0, 120, 500, 1200].forEach((ms) => setTimeout(适配宽度, ms));
  window.addEventListener('resize', 适配宽度);
  try { window.parent.addEventListener('resize', 适配宽度); } catch (e) {}
  try {
    const 外层 = 外层文档();
    if ('ResizeObserver' in window) {
      const 观 = new ResizeObserver(适配宽度);
      ['#chat', '#chat .mes_text', '.mes'].forEach((sel) => {
        const el = 外层.querySelector(sel);
        if (el) 观.observe(el);
      });
    }
  } catch (e) {}
  /* 兜底轮询：宿主改布局不一定触发上面任何事件；数据没变时只做一次比较。 */
  const 轮询 = setInterval(() => {
    if (!document.body || !document.body.contains(容器)) { clearInterval(轮询); return; }
    适配宽度();
  }, 400);


  var 当前档案 = null;   // { name, 玩家段 }
  var 属性键 = 属性配置.键 || [];
  var st = { race:'长身人', job:'游侠', life:'不选', side:'不选', name:'', desire:'', attrs:[50,50,50,50,50,50], editing:-1 };

  /* 按技能包生成：两个主槽照包给，副槽取「副业」档，同名取最高 */
  function 生成技能(选) {
    var 出 = {}, 警告 = [];
    function 收(列表, 来源) {
      (列表 || []).forEach(function (x) {
        var 名 = x[0], 值 = x[1];
        if (!出[名] || 值 > 出[名].value) 出[名] = { value: 值, source: 来源 };
      });
    }
    var 战 = 选.job ? 技能包[选.job] : null;
    var 生 = 选.life ? 技能包[选.life] : null;
    var 副 = 选.side ? 技能包[选.side] : null;

    if (战) 收(战.技能, 选.job + '·主职');
    if (生) 收(生.技能, 选.life + (战 ? '·生活' : '·主职'));

    if (副) {
      var 主职职能 = [].concat(战 ? 战.职能 : [], 生 ? 生.职能 : []);
      var 撞 = (副.职能 || []).filter(function (f) { return 主职职能.indexOf(f) >= 0; });
      if (撞.length) {
        警告.push('副业「' + 选.side + '」与主职职能重复（' + 撞.join('、') + '），已忽略副业技能');
      } else {
        收(副.副业, 选.side + '·副业');
      }
    }
    if (!战 && !生 && !副) 警告.push('没有选中任何带技能包的槽位：技能为空');

    var 列表 = Object.keys(出);
    return {
      技能: 列表.map(function (k, i) {
        return { uid: 'sk_' + (i + 1), name: k, value: 出[k].value, source: 出[k].source };
      }),
      警告: 警告
    };
  }

  /* 档案记录直接存「玩家段」，与 stat_data 的 玩家 同形 */
  /* 玩家段：骨架、槽字段路径、属性字段、技能字段、额外字段路径，全在配置里 */
  function 段配置() {
    const p = 配置.玩家段 || {};
    return {
      骨架: p.骨架 || {},
      槽字段: p.槽字段 || {},
      属性字段: p.属性字段 || '属性',
      技能字段: p.技能字段 || '技能',
    };
  }

  function 放(对象, 路径, 值) {
    if (!路径) return;
    var ks = 路径.split('.'), cur = 对象;
    for (var i = 0; i < ks.length - 1; i++) {
      if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = {};
      cur = cur[ks[i]];
    }
    cur[ks[ks.length - 1]] = 值;
  }

  function 读取路径(对象, 路径) {
    if (!路径) return undefined;
    return 路径.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, 对象);
  }

  function 组玩家段(额外值) {
    var c = 段配置();
    var 段 = JSON.parse(JSON.stringify(c.骨架));
    var 槽值 = { race: st.race, job: st.job, life: st.life, side: st.side };
    Object.keys(c.槽字段).forEach(function (k) {
      var v = 槽值[k];
      if (v === '不选') v = '';
      放(段, c.槽字段[k], v);
    });

    var 属性 = {}, 修 = 种族修正();
    属性键.forEach(function (k, i) { 属性[k] = Math.max(5, Math.min(95, st.attrs[i] + (修[i] || 0))); });
    放(段, c.属性字段, 属性);

    var 技 = 生成技能(槽值);
    if (技.警告.length) console.warn('[建档] 技能生成警告：', 技.警告);
    放(段, c.技能字段, 技.技能);

    if (额外 && 额外.字段) 放(段, 额外.字段, 额外值 || '');
    return 段;
  }

  function 读玩家段(段) {
    var c = 段配置();
    st.race = 读取路径(段, c.槽字段.race) || '';
    st.job = 读取路径(段, c.槽字段.job) || '';
    st.life = 读取路径(段, c.槽字段.life) || '不选';
    st.side = 读取路径(段, c.槽字段.side) || '不选';
    var 属性 = 读取路径(段, c.属性字段) || {};
    st.attrs = 属性键.map(function (k) { return 属性[k] == null ? 50 : 属性[k]; });
    st.desire = (额外 && 额外.字段) ? (读取路径(段, 额外.字段) || '') : '';
  }

  var root = 取('root');
  var pgs = 容器.querySelectorAll('.pg');
  var steps = 容器.querySelectorAll('.step');
  var demoBtns = 容器.querySelectorAll('.demo button');

  /* ---------- 渲染 ---------- */
  function chips(el, list, cur, on){
    el.innerHTML = '';
    list.forEach(function(v){
      var n = Array.isArray(v) ? v[0] : v;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = n;
      b.setAttribute('aria-pressed', n === cur ? 'true' : 'false');
      b.onclick = function(){ on(n); };
      el.appendChild(b);
    });
  }
  function raceNote(n){
    var hit = 选项清单('race').filter(function(r){ return r[0] === n; })[0];
    取('race-note').textContent = n + ' · ' + (hit ? hit[1] : '');
  }
  function renderRaces(){
    chips(取('races'), 选项清单('race'), st.race, function(n){ st.race = n; raceNote(n); renderRaces(); });
    raceNote(st.race);
  }
  function renderJobs(){
    chips(取('jobs'), 选项清单('job'), st.job, function(n){ st.job = n; renderJobs(); });
    chips(取('lives'), 选项清单('life'), st.life, function(n){ st.life = n; renderJobs(); });
    (function(){
      var 候选 = 选项清单('life').map(function(x){ return Array.isArray(x) ? x[0] : x; })
                   .filter(function(n){ return n !== '不选' && n !== st.life; });
      候选.unshift('不选');
      if (st.side !== '不选' && 候选.indexOf(st.side) < 0) st.side = '不选';
      chips(取('lives2'), 候选, st.side, function(n){ st.side = n; renderJobs(); });
    })();
  }
  function total(){ return st.attrs.reduce(function(a,b){ return a+b; }, 0); }
  function renderAttrs(){
    var box = 取('attrs');
    box.innerHTML = '';
    st.attrs.forEach(function(v, i){
      var row = document.createElement('div'); row.className = 'ar';
      var 修 = 种族修正()[i] || 0;
      var 终 = Math.max(5, Math.min(95, v + 修));
      row.innerHTML = '<span>' + 属性键[i] + '</span>' +
        '<span class="bar"><i style="width:' + 终 + '%"></i></span>' +
        '<span class="num"><button type="button" data-a="' + i + '" data-d="-1">−</button><b>' + v + '</b>' +
        (修 ? '<em class="adj" title="种族修正">' + (修 > 0 ? '+' : '') + 修 + '</em><i class="fin">→' + 终 + '</i>' : '') +
        '<button type="button" data-a="' + i + '" data-d="1">+</button></span>';
      box.appendChild(row);
    });
    var t = total(), over = t > 属性合计;
    var pts = 取('pts');
    pts.querySelector('b').textContent = t;
    pts.setAttribute('data-over', over ? '1' : '0');
    取('pts-warn').textContent = over ? ('超出 ' + (t - 属性合计) + ' 点') : '';
    取('btn-save').disabled = over;
  }
  function renderArchives(){
    var box = 取('arch-list');
    box.innerHTML = '';
    if (!当前档案){
      box.innerHTML = '<div class="empty">还没有档案。建一份，或者直接用默认人设开始。</div>';
      return;
    }
    var c = 段配置(), 段 = 当前档案.玩家段;
    var 槽串 = Object.keys(c.槽字段).map(function (k) { return 读取路径(段, c.槽字段[k]) || ''; })
                 .filter(Boolean).join(' · ');
    var 属 = 读取路径(段, c.属性字段) || {};
    var 属性串 = 属性键.map(function (k) { return 属[k]; }).join(' / ');
    var 技 = 读取路径(段, c.技能字段) || [];
    var 额外值 = 额外 ? (读取路径(段, 额外.字段) || '') : '';
    var d = document.createElement('div'); d.className = 'arch';
    d.innerHTML =
      '<span class="arch-m">' + 当前档案.name.charAt(0) + '</span>' +
      '<span class="arch-t"><span class="arch-n">' + 当前档案.name + '</span>' +
      '<span class="arch-d">' + 槽串 + ' · ' + 属性串 + '</span>' +
      '<span class="arch-d">技能 ' + 技.length + ' 项' +
      (额外值 ? '　「' + 额外值 + '」' : '') + '</span></span>' +
      '<span class="arch-b"><button class="mini" data-edit="1">改</button></span>';
    box.appendChild(d);
  }

  /* ---------- 导航 ---------- */
  function go(i){
    i = Math.max(0, Math.min(4, i));
    root.setAttribute('data-step', i);
    pgs.forEach(function(p){ p.setAttribute('data-on', +p.dataset.i === i ? '1' : '0'); });
    steps.forEach(function(s){
      var k = +s.dataset.i;
      s.setAttribute('data-on', k === i ? '1' : '0');
      s.setAttribute('data-done', k < i ? '1' : '0');
    });
    demoBtns.forEach(function(b){ b.setAttribute('aria-current', +b.dataset.go === i ? 'true' : 'false'); });
    if (i === 2) renderArchives();
  }
  function setWho(n){ 取('who-t').textContent = n || '默认人设'; }

  var toastWrap = null;
  function toast(文字, 类型) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'toast-wrap';
      容器.appendChild(toastWrap);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    if (类型 === 'err') el.setAttribute('data-err', '1');
    el.textContent = 文字;
    toastWrap.appendChild(el);
    requestAnimationFrame(function () { el.setAttribute('data-in', '1'); });
    setTimeout(function () {
      el.removeAttribute('data-in');
      setTimeout(function () { el.remove(); }, 200);
    }, 2600);
  }

  /* 选定起点 = 链路触发点。真机由脚本执行四步，这里只演示界面状态。 */
  async function 开始游戏(起点) {
    if (root.dataset.started === '1' || root.dataset.busy === '1') return;
    root.dataset.busy = '1';

    var 名 = (取('who-t').textContent || '').trim() || '默认人设';
    var 项 = (向导.起点 || []).filter(function (x) { return String(x.id) === String(起点); })[0] || {};
    var 场 = 项.标签 || 项.名 || '';
    var 段 = 当前档案 ? JSON.parse(JSON.stringify(当前档案.玩家段)) : 组玩家段('');

    var 载荷 = { 名字: 名, 玩家段: 段, 起点: 项.键 || 起点 };
    容器.dispatchEvent(new CustomEvent('setup:payload', { detail: 载荷, bubbles: true }));
    console.log('[迷宫饭] 载荷', 载荷);

    var 按钮们 = Array.prototype.slice.call(root.querySelectorAll('button, input, select, .chip'));
    按钮们.forEach(function (el) { el.disabled = true; });
    var tip = 取('pick-tip');
    tip.textContent = '正在写入…';

    try {
      var 结果 = null;
      if (typeof 写入 === 'function') {
        结果 = await 写入(载荷);
      }

      root.dataset.started = '1';
      tip.textContent = '已开始';

      var box = 取('started-box');
      box.hidden = false;
      box.className = 'started-line';
      box.innerHTML = '<span class="dot"></span>已开始 · <b>' + 名 + '</b> · ' + 场 +
        (结果 && 结果.书 ? '<span style="margin-left:8px;opacity:.6">' + 结果.书 + '</span>' : '') +
        (结果 ? '' : '<span style="margin-left:auto;opacity:.6">演示态</span>');

      if (结果) {
        toast('迷宫饭 · 变量已写入（' + 结果.字节数 + ' 字节）');
        setTimeout(function () { toast('迷宫饭 · 条目：' + 结果.条目名); }, 240);
        setTimeout(function () {
          if (结果.发送 === 'input') toast('迷宫饭 · 已填入输入框，请按发送');
          else if (结果.发送 === 'skipped') toast('迷宫饭 · 建档消息之前已发过，跳过');
          else toast('迷宫饭 · 建档消息已发送，等第一段');
        }, 480);
      } else {
        toast('迷宫饭 · 模拟写入：变量已就位');
        setTimeout(function () { toast('迷宫饭 · 模拟写入：条目已替换'); }, 240);
        setTimeout(function () { toast('迷宫饭 · 模拟写入：消息已发送'); }, 480);
      }
    } catch (e) {
      console.error('[迷宫饭] 写入失败', e);
      tip.textContent = '写入失败，可重试';
      toast('迷宫饭 · 写入失败：' + (e && e.message || e), 'err');
      root.dataset.started = '';
      按钮们.forEach(function (el) { el.disabled = false; });
    } finally {
      root.dataset.busy = '0';
    }
  }

  容器.addEventListener('click', function(e){
    var t;
    if ((t = e.target.closest('[data-go]'))) { go(+t.dataset.go); return; }
    if ((t = e.target.closest('[data-back]'))) { go(+t.dataset.back); return; }

    if ((t = e.target.closest('[data-a]'))) {
      var i = +t.dataset.a, d = +t.dataset.d, nv = st.attrs[i] + d;
      if (nv < 30 || nv > 70) return;
      var t2 = total() + d;
      if (t2 > 300) return;
      st.attrs[i] = nv;
      renderAttrs();
      return;
    }

    if ((t = e.target.closest('[data-edit]'))) {
      var b = 当前档案;
      if (!b) return;
      读玩家段(b.玩家段);
      st.name = b.name; st.desire = 额外 ? (读取路径(b.玩家段, 额外.字段) || '') : ''; st.editing = 1;
      var ni = 取('name');
      ni.value = b.name; ni.disabled = true;
      取('desire').value = 读取路径(b.玩家段, 额外.字段) || '';
      取('name-note').textContent = '建档后不可改名';
      取('edit-h').textContent = '修改档案 · ' + b.name;
      renderRaces(); renderJobs(); renderAttrs(); go(3); return;
    }

    if ((t = e.target.closest('.opt'))) {
      开始游戏(t.dataset.opt);
    }
  });

  var agree = 取('agree'), next0 = 取('btn-next-0');
  agree.addEventListener('change', function(){
    next0.disabled = !agree.checked;
    next0.setAttribute('data-go', agree.checked ? '1' : '');
  });

  取('btn-new').onclick = function(){
    st = { race:'长身人', job:'游侠', life:'不选', name:'', attrs:[50,50,50,50,50,50], editing:-1 };
    var ni = 取('name');
    ni.value = ''; ni.disabled = false;
    取('desire').value = '';
    取('name-note').textContent = '可留空 · 建档后不可改名';
    st.editing = -1;
    取('edit-h').textContent = '新建档案';
    renderRaces(); renderJobs(); renderAttrs(); go(3);
  };

  取('btn-default').onclick = function(){
    当前档案 = null;
    setWho('默认人设');
    st.editing = -1;
    go(4);
  };

  取('btn-save').onclick = function(){
    var 额外值 = (取('desire').value || '').trim();
    var 原名 = (st.editing >= 0 && 当前档案) ? 当前档案.name : '';
    var rec = {
      name: 原名 || ((取('name').value || '').trim() || '无名'),
      玩家段: 组玩家段(额外值)
    };
    当前档案 = rec;
    st.editing = -1;
    setWho(rec.name);
    go(4);
  };

  document.addEventListener('input', function(e){
    if (e.target.id === 'name') st.name = e.target.value;
  });

  renderRaces(); renderJobs(); renderAttrs(); renderArchives();

  return { 销毁() { 容器.innerHTML = ''; } };
}
