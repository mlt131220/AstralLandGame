<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { CAN_CAPACITY, WEEKDAYS } from '../content/content.ts'
import { shipValue } from '../core/actions.ts'
import { objectiveProgress, offeredBy, questDef } from '../core/quests.ts'
import { eventFor, safetyReady } from '../core/town.ts'
import { absMin, clock, dateName, forecast, regionOf, season, weather, weatherName, weekday, year } from '../core/state.ts'
import { coldZone, maxEnergyOf, maxHpOf } from '../core/climate.ts'
import { BOW_CHARGE, FOES, ITEMS, STATUS } from '../content/content.ts'
import { weaponAtk } from '../core/combat.ts'
import { game, ui } from '../game.ts'
import { t as tr } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import { drawMinimap, drawRegion } from './minimap.ts'

const g = game!
const s = () => g.s
const performance = window.performance
const bar = (v: number, max: number) => ({ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%` })
const keyLabel = (i: number) => (i === 9 ? 0 : i + 1)
function select(i: number) {
  s().sel = i
  g.changed()
}
// 触屏按钮：选中食物时显示“食用”，拿武器或有敌人时显示“翻滚”
const canEat = () => !!ITEMS[s().inv[s().sel]?.id ?? '']?.food
const canRoll = () => weaponAtk(s()) > 0 || g.foes.some((f) => f.st !== 'dead')
// 天气图标：0 晴 1 阴 2 雨/雪 3 极端
const wx = () => weather(s().seed, s().day)
const winter = () => season(s().day) === 3
// 保暖条只在寒冷区域或尚未回暖时显示（6.4）
const showWarm = () => coldZone(s()) || s().warmth < 99
// 首领血条（15.5）与轻弓蓄力
const boss = () => g.foes.find((f) => FOES[f.k].boss && f.st !== 'dead')
const BUFF_NAME: Record<string, string> = { labor: tr('hud.lightWork'), cold: tr('hud.warmed'), maxEnergy: tr('hud.maxEnergy20'), gift: tr('hud.goodCompany'), maxHp: tr('hud.maxHealth10'), pickup: tr('hud.pickupRange'), damage: tr('hud.strength'), feast: tr('common.harvestFeast') }
const effects = () => [
  ...s().status.filter((x) => x.until > absMin(s())).map((x) => ({ key: x.k, name: STATUS[x.k].name, left: x.until - absMin(s()), bad: true })),
  ...s().buffs.filter((b) => b.until > absMin(s())).map((b) => ({ key: b.fx, name: BUFF_NAME[b.fx] ?? b.fx, left: b.until - absMin(s()), bad: false })),
]

// 追踪中的任务（最多 3 个）：显示第一个未完成目标
const tracked = () => s().tracked.map((id) => questDef(id)).filter((q) => !!q).map((q) => {
  const st = s().quests[q!.id]
  const i = q!.objectives.findIndex((_, k) => { const [a, b] = objectiveProgress(s(), q!, k); return a < b })
  const [a, b] = i >= 0 ? objectiveProgress(s(), q!, i) : [1, 1]
  return { id: q!.id, title: q!.title, text: st?.st === 'ready' ? tr('hud.readyTurn') : i >= 0 ? q!.objectives[i].text : '', prog: i >= 0 && b > 1 ? `${a}/${b}` : '', ready: st?.st === 'ready' }
})

// 小地图：底图随状态版本重画，标记与方位每帧更新
const mini = ref<HTMLCanvasElement | null>(null)
const base = document.createElement('canvas')
const PX = 5
let raf = 0
const north = ref(0)
function redrawBase() {
  drawRegion(s(), PX, base)
}
// 头顶提示（21.1）：信箱有信“!”；居民有可接委托/事件“!”、有可交付任务“?”；公告板同理。每 0.1 秒更新目标，每帧跟随位置
interface Mark { key: string; x: number; y: number; z: number; t: '!' | '?'; sx: number; sy: number }
const marks = ref<Mark[]>([])
function collectMarks() {
  const st = s()
  const out: Mark[] = []
  const add = (key: string, x: number, y: number, z: number, t: Mark['t']) => out.push({ key, x, y, z, t, sx: -999, sy: -999 })
  const r = regionOf(st)
  const ready = (at: string) => Object.entries(st.quests).some(([id, q]) => q.st === 'ready' && questDef(id)?.submit === at)
  for (const b of r.buildings) {
    if (b.act === 'mail' && st.mail.length) add('mail', b.x + 0.5, 2.3, b.z + 0.5, '!')
    // 畜舍：有可收的产物（蛋、绒、奶、毛）
    if (b.act === 'coop' && b.home && st.animals.some((x) => x.home === b.home && x.eggs > 0)) add('home:' + b.home, b.x + b.w / 2, 4.2, b.z + b.d / 2, '!')
    if (b.act === 'board') {
      if (ready('teach_box')) add('board', b.x + b.w / 2, 2.9, b.z + 0.5, '?')
      else if (offeredBy(st, 'board').length) add('board', b.x + b.w / 2, 2.9, b.z + 0.5, '!')
    }
  }
  for (const n of g.npcs.values()) {
    if (n.hidden) continue
    if (ready(n.id)) add('npc:' + n.id, n.x, 2.35, n.z, '?')
    else if (offeredBy(st, n.id).length || eventFor(st, n.id) || (n.id === 'laotao' && safetyReady(st))) add('npc:' + n.id, n.x, 2.35, n.z, '!')
  }
  marks.value = out
}
watch(() => ui.tick, collectMarks)

function loop() {
  raf = requestAnimationFrame(loop)
  for (const m of marks.value) {
    const n = m.key.startsWith('npc:') ? g.npcs.get(m.key.slice(4)) : null
    const [sx, sy] = g.r.toScreen(n ? n.x : m.x, m.y, n ? n.z : m.z)
    m.sx = sx
    m.sy = sy
  }
  const c = mini.value
  if (!c) return
  const r = regionOf(s())
  const markers = [
    ...[...g.npcs.values()].filter((n) => !n.hidden).map((n) => ({ x: n.x, z: n.z, color: '#ffd34a', r: 0.9 })),
    ...r.exits.map((e) => ({ x: (e.x0 + e.x1 + 1) / 2, z: (e.z0 + e.z1 + 1) / 2, color: '#7fd0ff', r: 1 })),
    ...r.buildings.filter((b) => b.act === 'up' || b.act === 'down' || b.act === 'lift').map((b) => ({ x: b.x + b.w / 2, z: b.z + b.d / 2, color: '#7fd0ff', r: 1 })),
    ...g.foes.filter((f) => f.st !== 'dead').map((f) => ({ x: f.x, z: f.z, color: '#ff5a4a', r: 0.7 })),
  ]
  drawMinimap(c.getContext('2d')!, base, PX, s(), g.r.az, markers)
  north.value = g.r.az
}
watch(() => ui.rev, redrawBase)
onMounted(() => {
  redrawBase()
  loop()
})
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="hud" :class="{ touch: ui.touch }" :data-t="ui.tick + ui.rev">
    <div class="clock wood">
      <div class="date">{{ tr('hud.year', year(s().day), dateName(s().day), WEEKDAYS[weekday(s().day)]) }}</div>
      <div class="big">
        <svg class="wx" viewBox="0 0 32 32" aria-hidden="true">
          <g v-if="wx() === 0"><circle cx="16" cy="16" r="7" fill="#ffd34a" stroke="#c98a12" stroke-width="1.5" />
            <path v-for="a in 8" :key="a" :transform="`rotate(${a * 45} 16 16)`" d="M16 3v4" stroke="#ffd34a" stroke-width="2.4" stroke-linecap="round" /></g>
          <g v-else>
            <circle v-if="wx() === 1" cx="11" cy="12" r="6" fill="#ffd34a" />
            <path d="M8 22h15a5 5 0 0 0 0-10 7 7 0 0 0-13 1.5A4.3 4.3 0 0 0 8 22z" fill="#eef3f8" stroke="#8aa0b8" stroke-width="1.4" />
            <g v-if="wx() >= 2 && !winter()" stroke="#5aa8e8" stroke-width="2" stroke-linecap="round"><path d="M11 25l-1 4M17 25l-1 4M23 25l-1 4" /></g>
            <g v-if="wx() >= 2 && winter()" fill="#fff" stroke="#8aa0b8" stroke-width=".8"><circle cx="11" cy="27" r="1.6" /><circle cx="17" cy="28" r="1.6" /><circle cx="23" cy="27" r="1.6" /></g>
            <path v-if="wx() === 3 && season(s().day) === 1" d="M17 21l-3 6h3l-2 4" stroke="#f2c230" stroke-width="2" fill="none" stroke-linejoin="round" />
          </g>
        </svg>
        <span>{{ clock(s().min) }}</span>
        <small :title="tr('hud.tomorrow', forecast(s()).tomorrow, forecast(s()).extreme ? tr('common.extremeWeather') : '')">{{ weatherName(wx(), season(s().day)) }}</small>
      </div>
      <div class="money">
        <i class="coin" /> <b>{{ s().money }}</b>
        <span v-if="s().ship.length" class="pending">{{ tr('hud.ship', shipValue(s())) }}</span>
      </div>
    </div>

    <div class="minimap">
      <canvas ref="mini" width="148" height="148" />
      <img class="ring" src="/assets/ui/minimap_ring_brown_detail.png" alt="" />
      <span class="north" :style="{ transform: `rotate(${north}rad) translateY(-86px) rotate(${-north}rad)` }">{{ tr('hud.north') }}</span>
      <span class="place">{{ regionOf(s()).name }}</span>
    </div>

    <div v-if="tracked().length" class="tracker">
      <div v-for="q in tracked()" :key="q.id" class="tq" :class="{ ready: q.ready }">
        <b>{{ q.title }}</b>
        <div><span>{{ q.text }}</span> <em v-if="q.prog">{{ q.prog }}</em></div>
      </div>
    </div>

    <div class="stats wood">
      <div class="stat"><span>{{ tr('hud.hp') }}</span><div class="bar hp"><i :style="bar(s().hp, maxHpOf(s()))" /></div><em>{{ Math.floor(s().hp) }}</em></div>
      <div class="stat"><span>{{ tr('hud.en') }}</span><div class="bar en"><i :style="bar(s().energy, maxEnergyOf(s()))" /></div><em>{{ Math.floor(s().energy) }}</em></div>
      <div class="stat" :class="{ warn: s().satiety < 30 }">
        <span>{{ tr('hud.food') }}</span><div class="bar sa"><i :style="bar(s().satiety, 100)" /></div><em>{{ Math.floor(s().satiety) }}</em>
      </div>
      <div v-if="showWarm()" class="stat" :class="{ warn: s().warmth < 30 }">
        <span>{{ tr('hud.warm') }}</span><div class="bar wa"><i :style="bar(s().warmth, 100)" /></div><em>{{ Math.floor(s().warmth) }}</em>
      </div>
      <div v-if="s().damp >= 5" class="stat">
        <span>{{ tr('hud.damp') }}</span><div class="bar dp"><i :style="bar(s().damp, 100)" /></div><em>{{ Math.floor(s().damp) }}</em>
      </div>
      <div v-if="effects().length" class="effects">
        <span v-for="e in effects()" :key="e.key" class="fx" :class="{ bad: e.bad }">{{ tr('hud.m', e.name, Math.ceil(e.left)) }}</span>
      </div>
    </div>

    <div class="hotbar wood">
      <div v-for="i in s().hotbar" :key="i" class="hb" @click="select(i - 1)">
        <ItemSlot :sl="s().inv[i - 1]" :sel="s().sel === i - 1" :label="keyLabel(i - 1)" />
        <small v-if="s().inv[i - 1]?.id === 'tool_can'">{{ s().water }}/{{ CAN_CAPACITY[s().tools.can] }}</small>
      </div>
    </div>

    <!-- 触屏：没有键盘时的菜单、暂停、转镜头与情境按钮（移动、使用、交互都靠点地图） -->
    <div v-if="ui.touch" class="touchbar">
      <button type="button" class="tb" @click="g.openMenu('bag')">{{ tr('touch.menu') }}</button>
      <button type="button" class="tb" @click="ui.panel = 'pause'">{{ tr('touch.pause') }}</button>
      <div class="tb-row">
        <button type="button" class="tb sq" :aria-label="tr('touch.rotateLeft')" @click="g.r.rotate(-1)">⟲</button>
        <button type="button" class="tb sq" :aria-label="tr('touch.rotateRight')" @click="g.r.rotate(1)">⟳</button>
      </div>
      <button v-if="canEat()" type="button" class="tb" @click="g.eatSelected()">{{ tr('touch.eat') }}</button>
      <button v-if="canRoll()" type="button" class="tb" @click="g.rollNow()">{{ tr('touch.roll') }}</button>
      <button v-if="ui.plan || ui.fishing" type="button" class="tb" @click="g.escape()">{{ tr('touch.cancel') }}</button>
    </div>

    <div v-for="m in marks" :key="m.key" class="mark" :class="m.t === '?' ? 'ask' : 'new'" :style="{ left: m.sx + 'px', top: m.sy + 'px' }">{{ m.t }}</div>
    <div v-if="ui.hint" class="hint" :class="{ bad: !ui.hintOk }">{{ ui.hint }}</div>

    <!-- 14.1 钓鱼：蓄力条、鱼讯、收线控制条 -->
    <div v-if="ui.fishing" class="fishing" :class="ui.fishing.phase">
      <template v-if="ui.fishing.phase === 'charge'">
        <span>{{ tr('hud.castPower') }}</span><div class="power"><i :style="{ width: ui.fishing.power * 100 + '%' }" /></div>
      </template>
      <div v-else-if="ui.fishing.phase === 'bite'" class="alert">!</div>
      <template v-else-if="ui.fishing.phase === 'reel'">
        <div class="track">
          <div class="zone" :class="{ on: ui.fishing.inside }" :style="{ left: (ui.fishing.zone - ui.fishing.zoneW / 2) * 100 + '%', width: ui.fishing.zoneW * 100 + '%' }" />
          <svg class="fish" :style="{ left: ui.fishing.pos * 100 + '%' }" viewBox="0 0 32 20" aria-hidden="true">
            <path d="M3 10c5-7 15-8 21-1l6-5v12l-6-5c-6 7-16 6-21-1z" fill="#5aa0d8" stroke="#1d3c5a" stroke-width="1.6" /><circle cx="9" cy="9" r="1.6" fill="#1d3c5a" />
          </svg>
        </div>
        <div class="prog"><i :style="{ width: ui.fishing.prog * 100 + '%' }" /></div>
        <small>{{ ui.touch ? tr('touch.reelBar') : tr('hud.holdLeftClickGreen') }}</small>
      </template>
      <span v-else class="wait">…</span>
    </div>
    <div v-if="boss()" class="bossbar">
      <b>{{ FOES[boss()!.k].name }}</b>
      <div class="bar"><i :style="bar(boss()!.hp, boss()!.max)" /></div>
      <small v-if="boss()!.st === 'tired'">{{ tr('hud.tiredWeakPointExposed') }}</small>
      <small v-else-if="boss()!.st === 'stun'">{{ tr('hud.stunned') }}</small>
    </div>
    <div v-if="g.fighter.draw >= 0" class="fishing charge">
      <span>{{ tr('hud.draw') }}</span><div class="power"><i :style="{ width: Math.min(1, g.fighter.draw / BOW_CHARGE) * 100 + '%' }" /></div>
    </div>
    <div class="hurt" :class="{ on: ui.tick >= 0 && performance.now() - ui.hurt < 350 }" />
    <div :key="ui.fade" class="fade" />
    <div v-if="ui.loading >= 0" class="travel-wait">
      <div class="loading">{{ tr('hud.loading', Math.round(ui.loading * 100)) }}<div class="track"><div class="fill" :style="{ width: `${ui.loading * 100}%` }" /></div></div>
    </div>

    <div v-if="ui.pad" class="corner">{{ tr('hud.useXInteractB') }}</div>
    <div v-else-if="ui.touch" class="corner">{{ tr('touch.help') }}</div>
    <div v-else class="corner">{{ tr('hud.fInteractEEat') }}</div>
    <div v-if="ui.readOnly" class="banner">
      {{ tr('hud.saveOpenAnotherTab') }}
      <button @click="g.takeover()">{{ tr('hud.takeOver') }}</button>
    </div>

    <div v-if="ui.away" class="backdrop">
      <section class="panel small">
        <header><h2>{{ tr('hud.paused') }}</h2></header>
        <p>{{ tr('hud.gameTimeStopsAutomatically') }}</p>
        <button class="primary" autofocus @click="g.resume()">{{ tr('common.continue') }}</button>
      </section>
    </div>
  </div>
</template>
