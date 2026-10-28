// 节庆小游戏的共同流程（设计 §20.2）：打开面板即暂停世界；开始过就按当前成绩结算并把时间推到结束时刻；
// 没开始就离场按“入场 +60 分钟或结束时刻较早者”推进。Esc、×、点遮罩关闭都走同一结算，只结算一次。
import { onMounted, onUnmounted, ref } from 'vue'
import { FESTIVALS } from '../../content/content.ts'
import { festStarted, finishFestival, leaveFestival } from '../../core/town.ts'
import { game, ui } from '../../game.ts'
import { sfx } from '../../platform/audio.ts'

export function useFest(id: string, result: () => [number, string]) {
  const g = game!
  const s = g.s
  const f = FESTIVALS[id]
  const enteredAt = s.min
  const started = ref(false)
  let settled = false
  function settle() {
    if (settled) return
    settled = true
    if (started.value) { const [n, text] = result(); g.run(() => finishFestival(s, id, n, text)) }
    else leaveFestival(s, id, enteredAt)
    g.changed()
  }
  const start = () => { started.value = true; festStarted(s, id); g.save(); sfx('fanfare', 0.5) }
  const close = () => { settle(); ui.panel = '' }
  onMounted(() => sfx('ui_open', 0.4))
  onUnmounted(settle)
  return { g, s, f, started, start, close }
}
