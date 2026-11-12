# 待办

## 1. ~~向导外壳还没搬进来~~ ✅ 已搬

`src/wizard.js`：样式与结构是常量，种族/职业/生活职业/属性键/技能包/声明/起点全部由 `配置.向导` 注入。
`挂载(容器, { 配置, 写入 })` 返回 `{ 销毁 }`，作用域收敛在容器内（不再碰 `document`）。

卡项目里那份 `preview/开局向导.html` 暂时保留，作为设计预览；**两边不要同时改**。

## 2. 引擎与卡内实现暂时并存

卡项目 `02-Projects/迷宫饭/src/` 下还有一份同样的实现。已对照验证两侧产出逐字一致（initvar 1661 字节、消息同文），但**同时维护两份必然漂移**。

切换顺序建议：

1. 卡里改为 `import { createSetup } from CDN/st-setup@<commit>`
2. 删掉卡里那份 `initvar-write / profile-write / setup-message / worldbook-util`
3. 再跑一次冒烟与真机

## 3. 模板构建工具还没进仓库

`tools/initvar_merge.py`（四层合并 + 九条验收）、`embed_templates.py`、`embed_skills.py` 都属于「引擎」，但现在留在卡项目里。

搬进来的前提：把路径参数化（现在写死了 `05-Library/迷宫饭/...`）。

## 4. 三级降级没做

按决定，远程加载失败只显示「加载失败 + 重试」，不内嵌最小可用版。
