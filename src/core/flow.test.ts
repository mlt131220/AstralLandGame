// 任务闭包自检：用一个“机器人”反复接取、满足目标、交付，确认全部 G1/G2/G3 任务都能走到完成（无死锁、无循环前置）。
import assert from 'node:assert/strict'
import { QUEST_DEFS } from '../content/story.ts'
import { ITEMS } from '../content/content.ts'
import { deliverQuests } from './actions.ts'
import { acceptQuest, allQuests, friend, objectiveProgress, progress, questDef, readMail, recheck, refreshQuests, registerQuests } from './quests.ts'
import { addItem, newGame } from './state.ts'

registerQuests(QUEST_DEFS)
const s = newGame('机器人', '测试', 1, 99)
s.inv = Array(48).fill(null)
refreshQuests(s)

// 满足一个目标：计数类发事件，状态类直接写状态，交付类塞物品
function satisfy(id: string) {
  const q = questDef(id)!
  q.objectives.forEach((o, i) => {
    const [a, b] = objectiveProgress(s, q, i)
    if (a >= b) return
    const n = b - a
    switch (o.type) {
      case 'deliver': {
        const item = o.item && ITEMS[o.item] ? o.item : o.tag === 'veg' ? 'spring_radish' : o.tag === 'fish' ? 'fish_silverscale' : o.tag ? Object.keys(ITEMS).find((k) => ITEMS[k].tags?.includes(o.tag!))! : o.item!
        addItem(s.inv, item, 0, b) // 多个任务可能交同一种东西：按各自全量补足
        break
      }
      case 'have': addItem(s.inv, o.item!, 0, n); break
      case 'friendship': friend(s, o.npc!).pts = Math.max(friend(s, o.npc!).pts, o.value ?? 0); break
      case 'skill': s.xp[o.skill as keyof typeof s.xp] = 1000; break
      case 'upgrade': s.tools[o.tool as keyof typeof s.tools] = o.tier ?? 1; break
      case 'mineFloor': s.deepest = Math.max(s.deepest, o.floor ?? 1); break
      case 'event': s.flags.push('event:' + o.id); break
      case 'festival': s.flags.push('festival:' + o.id); break
      case 'project': s.projects[o.id!] = s.day; break
      case 'earn': progress(s, { type: 'earn', gold: o.gold ?? n }); break
      // G3 状态型目标
      case 'haveSpec': {
        const spec = o.item!
        const id = spec === '#core' ? 'core_trade' : spec === '#explore' ? 'ration_trail' : spec.startsWith('#') ? Object.keys(ITEMS).find((k) => ITEMS[k].tags?.includes(spec.slice(1)))! : spec.split('|')[0]
        addItem(s.inv, id, 0, n)
        break
      }
      case 'friends': for (const npc of ['lintang', 'laotao', 'xiahe', 'shenzhou', 'heyan', 'zhouqin'].slice(0, o.n ?? 1)) friend(s, npc).pts = Math.max(friend(s, npc).pts, o.value ?? 0); break
      case 'events': for (let k = 0; k < n; k++) friend(s, 'lintang').events.push('flow_' + k); break
      case 'flag': s.flags.push(o.id!.split('|')[0]); break
      case 'building': s.farmB.push({ id: s.nextId++, k: o.id as 'coop', x: 5, z: 3, done: s.day, up: 0, hay: 0, open: false }); break
      case 'animals': for (let k = 0; k < n; k++) s.animals.push({ id: s.nextId++, kind: 'chicken', name: '测试' + k, home: 0, fed: 0, love: 0, pet: 0, fedDay: 0, eggs: 0, prog: 0, bought: s.day }); break
      default: progress(s, { type: o.type, n, item: o.item, crop: o.crop, npc: o.npc, region: o.region, target: o.target, id: o.id, action: o.action, tags: o.tag ? [o.tag] : undefined, tool: o.tool })
    }
  })
}

for (let round = 0; round < 200; round++) {
  for (const id of [...s.mail]) readMail(s, id)
  for (const [id, st] of Object.entries(s.quests)) if (st.st === 'offered') acceptQuest(s, id)
  for (const [id, st] of Object.entries(s.quests)) if (st.st === 'active') satisfy(id)
  recheck(s)
  for (const [id, st] of Object.entries(s.quests)) if (st.st === 'ready') {
    const at = questDef(id)!.submit
    deliverQuests(s, at) // 物品被别的任务先交掉时回到进行中，下一轮再补
  }
  if (allQuests().every((q) => s.quests[q.id]?.st === 'done')) break
  s.day++ // 推进日期以满足 minDay
  refreshQuests(s)
}
const left = allQuests().filter((q) => s.quests[q.id]?.st !== 'done').map((q) => `${q.id}:${s.quests[q.id]?.st ?? '未解锁'}`)
assert.deepEqual(left, [], '所有任务都能完成')
assert.ok(s.tools.rod >= 0, '已获得钓竿')
assert.ok(s.unlocks.includes('region:mine') && s.unlocks.includes('system:tool_upgrade'))
assert.ok(s.inv.some((sl) => sl?.id === 'belt_toolbag') && s.inv.some((sl) => sl?.id === 'bag_canvas'), '扩容道具已发放、未自动使用')
assert.equal(s.hotbar, 8)
console.log(`flow tests passed（${allQuests().length} 个任务，第 ${s.day} 天全部完成）`)
