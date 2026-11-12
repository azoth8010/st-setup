// ============================================================
// 建档引擎 · 发建档消息
//
// 发送走 createChatMessages + triggerSlash('/trigger')：
//   不依赖 send_but 的 DOM id，也没有定时器，慢机器不会漏发。
// 降级：拿不到 API 时填进输入框，让玩家自己按发送。
//
// 消息正文由 config.消息.正文 产出，引擎不管写什么内容。
// ============================================================

export async function 发送建档消息(正文) {
  if (!正文) throw new Error('消息为空');

  if (typeof createChatMessages === 'function') {
    await createChatMessages([{ role: 'user', message: 正文 }]);
    if (typeof triggerSlash === 'function') await triggerSlash('/trigger');
    return { 方式: 'create' };
  }

  const 框 = document.getElementById('send_textarea');
  if (框) {
    框.value = 正文;
    框.focus();
    框.dispatchEvent(new Event('input', { bubbles: true }));
    return { 方式: 'input' };
  }
  throw new Error('拿不到发送通道：既没有 createChatMessages，也没有输入框');
}

const 已发键 = (卡名) => 卡名 + '_已发建档消息';

export function 已发过(卡名) {
  try {
    const v = (typeof getVariables === 'function' ? getVariables({ type: 'chat' }) : {}) || {};
    return !!v[已发键(卡名)];
  } catch (e) { return false; }
}

export async function 记已发(卡名) {
  try {
    if (typeof insertOrAssignVariables === 'function') {
      await insertOrAssignVariables({ [已发键(卡名)]: Date.now() }, { type: 'chat' });
    }
  } catch (e) { /* 记不上最多重复发一次 */ }
}
