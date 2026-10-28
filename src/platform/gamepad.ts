// 手柄（设计 §21.4，1.0 必须支持）：标准布局（Xbox 命名）。
// 游戏中：左摇杆/十字键移动，A 使用（按住蓄力、拉弓、收线），X 交互，B 返回，Y 背包，LB/RB 切换快捷栏，LT 翻滚，RT 冲刺，
// 右摇杆左右转镜头、上下缩放，Start 暂停，Back 地图。
// 界面中（标题、面板、对话）：十字键/左摇杆在按钮间移动焦点，A 按下，B 关闭/返回，LB/RB 切换菜单分页，下拉框与滑块用左右调整。
export interface PadFrame {
  move: [number, number] // 左摇杆（已去死区），x 右正、y 上正
  look: [number, number] // 右摇杆
  held: Set<string> // 按住的键
  pressed: Set<string> // 这一帧刚按下的键（含十字键的连发）
}
const NAMES = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'back', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right']
const DEAD = 0.28
const dead = (v: number) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD))
let prev = new Set<string>()
let repeatT = 0
let repeatKey = ''
export let padActive = false // 最近一次输入来自手柄（提示文字与瞄准方式随之切换）
addEventListener('mousemove', () => { padActive = false })
addEventListener('keydown', () => { padActive = false })

// 每帧读一次；没有手柄返回 null
export function readPad(dt: number): PadFrame | null {
  // 优先标准布局（按键序号才对得上 Xbox 命名）；非标准布局的手柄按原序号读取，不保证按键对应
  const pads = [...(navigator.getGamepads?.() ?? [])].filter((g) => g?.connected)
  const gp = pads.find((g) => g!.mapping === 'standard') ?? pads[0]
  if (!gp) return null
  const held = new Set<string>()
  gp.buttons.forEach((b, i) => { if (b.pressed && NAMES[i]) held.add(NAMES[i]) })
  let move: [number, number] = [dead(gp.axes[0] ?? 0), -dead(gp.axes[1] ?? 0)]
  // 十字键也能走（摇杆没推时）
  const dx = +held.has('right') - +held.has('left'), dy = +held.has('up') - +held.has('down')
  if (!move[0] && !move[1] && (dx || dy)) move = [dx / Math.hypot(dx, dy), dy / Math.hypot(dx, dy)]
  const look: [number, number] = [dead(gp.axes[2] ?? 0), -dead(gp.axes[3] ?? 0)]
  // 摇杆推到底也当方向键用（界面导航）
  const dir = Math.abs(move[0]) > 0.6 || Math.abs(move[1]) > 0.6 ? (Math.abs(move[0]) > Math.abs(move[1]) ? (move[0] > 0 ? 'right' : 'left') : move[1] > 0 ? 'up' : 'down') : ''
  const nav = new Set(held)
  if (dir) nav.add('s_' + dir)
  const pressed = new Set<string>()
  for (const k of nav) if (!prev.has(k)) pressed.add(k)
  // 方向键按住连发：0.35 秒后每 0.12 秒一次
  const d = ['up', 'down', 'left', 'right'].find((k) => nav.has(k) || nav.has('s_' + k)) ?? ''
  if (d && d === repeatKey) { repeatT -= dt; if (repeatT <= 0) { pressed.add('rep_' + d); repeatT = 0.12 } } else { repeatKey = d; repeatT = 0.35 }
  prev = nav
  if (pressed.size || move[0] || move[1] || look[0] || look[1]) padActive = true
  document.body.classList.toggle('pad', padActive)
  return { move, look, held, pressed }
}
export const navDir = (f: PadFrame) => (['up', 'down', 'left', 'right'] as const).find((k) => f.pressed.has(k) || f.pressed.has('s_' + k) || f.pressed.has('rep_' + k))

// ---------- 界面的空间导航：在最上层容器（面板 > 标题）的可聚焦元素之间按方向移动焦点 ----------
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
function scope() {
  const panels = [...document.querySelectorAll<HTMLElement>('.panel, .settings, .card, .main-menu')].filter((e) => e.offsetParent)
  return panels[panels.length - 1] ?? document.body
}
// 第一次按方向键时先落在主按钮（autofocus / .primary），不落在右上角的 ×
const start = (list: HTMLElement[]) => list.find((e) => e.hasAttribute('autofocus')) ?? list.find((e) => e.classList.contains('primary')) ?? list.find((e) => !e.classList.contains('x')) ?? list[0]
const items = () => [...scope().querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => e.offsetParent && e.getBoundingClientRect().width > 0)
// 键盘 Tab：只在最上层面板里循环，不跑到背后的 HUD 上；焦点还不在面板里时 Tab 先落到主按钮、Shift+Tab 落到最后一个。返回 true 表示已接管
export function tabCycle(back: boolean): boolean {
  const list = items()
  if (!list.length) return false
  const i = list.indexOf(document.activeElement as HTMLElement)
  if (i >= 0 && i !== (back ? 0 : list.length - 1)) return false
  const to = i < 0 && !back ? start(list) : back ? list[list.length - 1] : list[0]
  to.focus()
  to.scrollIntoView({ block: 'nearest' })
  return true
}
export function uiNav(f: PadFrame): boolean {
  const list = items()
  if (!list.length) return false
  const cur = document.activeElement as HTMLElement | null
  const inList = cur && list.includes(cur)
  const d = navDir(f)
  if (d) {
    // 下拉框、滑块：左右直接调整
    if (inList && (d === 'left' || d === 'right') && cur instanceof HTMLSelectElement) {
      cur.selectedIndex = Math.max(0, Math.min(cur.options.length - 1, cur.selectedIndex + (d === 'right' ? 1 : -1)))
      cur.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
    if (inList && (d === 'left' || d === 'right') && cur instanceof HTMLInputElement && cur.type === 'range') {
      if (d === 'right') cur.stepUp(); else cur.stepDown()
      cur.dispatchEvent(new Event('input', { bubbles: true }))
      cur.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
    if (!inList) { const first = start(list); first.focus(); first.scrollIntoView({ block: 'nearest' }); return true }
    const a = cur!.getBoundingClientRect()
    const [vx, vy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]
    let best: HTMLElement | null = null, score = Infinity
    for (const e of list) {
      if (e === cur) continue
      const b = e.getBoundingClientRect()
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2)
      const along = dx * vx + dy * vy
      if (along <= 4) continue
      const side = Math.abs(dx * vy) + Math.abs(dy * vx)
      const sc = along + side * 2.5
      if (sc < score) { score = sc; best = e }
    }
    if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }) }
    return true
  }
  if (f.pressed.has('a')) { if (inList) cur!.click(); else start(list).focus(); return true }
  return false
}
