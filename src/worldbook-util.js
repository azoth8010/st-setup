// ============================================================
// 世界书操作（共用）
//
// initvar 与主角档案都要「先摘牌、再新建、再清理」，两处逻辑一样，
// 所以抽到这里，避免两份实现各自跑偏。
//
// 摘牌的意义：条目改名成不含标记的名字，对读取方立刻不可见，
// 但它还在书里——新建失败时把名字改回去就恢复，不会出现「零条目」窗口。
// ============================================================

export async function 列书() {
  const out = [];
  try {
    const s = await getLorebookSettings();
    (s?.selected_global_lorebooks || []).forEach((n) => out.push(n));
  } catch (e) { /* 没有全局书也能继续 */ }
  try {
    const t = await getCharLorebooks();
    if (t?.primary) out.push(t.primary);
    if (t?.additional) out.push(...t.additional);
  } catch (e) {
    throw new Error('读不到角色绑定的世界书：' + (e?.message || e));
  }
  return [...new Set(out.filter(Boolean))];
}

/** 扫所有书，按判定函数收集条目。返回 { 书们, 命中: [{书, 条目, 名}] } */
export async function 扫条目(判定) {
  const 书们 = await 列书();
  const 命中 = [];
  for (const 书 of 书们) {
    let entries = [];
    try { entries = await getLorebookEntries(书); } catch (e) { continue; }
    for (const e of entries || []) {
      const 名 = String(e?.comment ?? e?.name ?? '');
      if (判定(名, e)) 命中.push({ 书, 条目: e, 名 });
    }
  }
  return { 书们, 命中 };
}

export async function 删条目(书, 名) {
  await deleteWorldbookEntries(书, (e) => String(e?.comment ?? e?.name ?? '') === 名);
}

export async function 改条目名(书, uid, 新名) {
  if (typeof setLorebookEntries !== 'function') return false;
  try {
    await setLorebookEntries(书, [{ uid: Number(uid), comment: 新名 }]);
    return true;
  } catch (e) {
    console.warn('[建档] 改条目名失败', e);
    return false;
  }
}

const 保留字段 = ['comment', 'name', 'key', 'keysecondary', 'constant', 'selective',
  'selectiveLogic', 'order', 'position', 'depth', 'role', 'probability',
  'useProbability', 'disable', 'excludeRecursion', 'preventRecursion',
  'delayUntilRecursion', 'group', 'groupOverride', 'groupWeight', 'scanDepth',
  'caseSensitive', 'matchWholeWords', 'useGroupScoring', 'sticky', 'cooldown', 'delay'];

export async function 建条目(书, 旧条目, 内容, 缺省 = {}, 名 = '') {
  const 新 = {};
  保留字段.forEach((k) => { if (旧条目 && 旧条目[k] !== undefined) 新[k] = 旧条目[k]; });
  Object.keys(缺省).forEach((k) => { if (新[k] === undefined) 新[k] = 缺省[k]; });
  // 旧条目优先；新建时用缺省.comment，再退到调用方给的「名」——
  // 少了这一层，新建的条目会变成 comment=undefined，扫描时永远匹配不到
  新.comment = 旧条目?.comment ?? 旧条目?.name ?? 缺省.comment ?? 名;
  新.name = 新.comment;
  新.content = 内容;
  await createWorldbookEntries(书, [新]);
  return 新.comment;
}

/**
 * 摘牌式替换：把旧条目改名摘牌 → 建新条目 → 成功后删掉摘牌那条。
 * 失败时删掉可能建了一半的新条目，把旧名字改回去。
 *
 * @returns {Promise<{书:string, 条目名:string, 字节数:number}>}
 */
export async function 摘牌写入({ 书, 旧条目, 名, 正文, 缺省 }) {
  const 临时名 = 旧条目 ? ('旧备份-' + Date.now() + '-' + Math.floor(Math.random() * 1000)) : null;
  const 可改名 = 旧条目 ? await 改条目名(书, 旧条目.uid, 临时名) : false;

  try {
    if (旧条目 && !可改名) await 删条目(书, 名);   // 不支持改名时的退路
    await 建条目(书, 旧条目, 正文, 缺省, 名);
  } catch (e) {
    try { await 删条目(书, 名); } catch (_) {}
    try {
      if (可改名) await 改条目名(书, 旧条目.uid, 名);
      else if (旧条目) await 建条目(书, 旧条目, 旧条目.content || '', 缺省, 名);
    } catch (_) {}
    throw new Error('写入「' + 名 + '」失败：' + (e?.message || e));
  }

  if (可改名) {
    try { await 删条目(书, 临时名); }
    catch (e) { console.warn('[建档] 旧条目清理失败，可手动删除：' + 临时名); }
  }
  return { 书, 条目名: 名, 字节数: 正文.length };
}
