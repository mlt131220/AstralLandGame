<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ITEMS, RECIPES, SEASON_NAMES, SKILL_NAMES, SKILLS, TOOL_TIER, XP_LEVELS, type Skill } from '../content/content.ts'
import { NPC_DEFS, NPC_LOOK } from '../content/story.ts'
import { npcPlace } from '../core/npcs.ts'
import { regionName } from '../core/regions.ts'
import { CATS, catIds as catIdsOf } from '../core/collection.ts'
import { giftsLeft, isBirthday } from '../core/town.ts'
import { lookPortrait } from '../render/models.ts'
import { craft, eat, foodOf, itemName, price, recipeLocked, sortBag, swapSlots, useKeyItem } from '../core/actions.ts'
import { equipItem, unequip } from '../core/climate.ts'
import { BUILDINGS, type BuildKind } from '../content/content.ts'
import { bDone, bLevel, bName, busy, canOrder, demolish, siloCap } from '../core/buildings.ts'
import { npcEvent, ROMANCE } from '../content/story.ts'
import { breakUp } from '../core/town.ts'
import { t } from '../core/i18n.ts'
let breakArmed = false
function endRelation() {
  if (!breakArmed) { breakArmed = true; game!.toast(t('menu.clickAgainEndRelationship')); return }
  breakArmed = false
  game!.run(() => breakUp(game!.s))
}
import { allQuests, objectiveProgress, type QuestDef } from '../core/quests.ts'
import { level, projectDone, regionOf } from '../core/state.ts'
import { game, ui, type MenuTab } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import ItemSlot from './ItemSlot.vue'
import Cost from './Cost.vue'
import { drawRegion } from './minimap.ts'

const g = game!
const s = g.s
const TABS: [MenuTab, string, string][] = [['bag', t('common.backpack'), 'B'], ['skills', t('menu.skills'), 'K'], ['quests', t('menu.quests'), 'L'], ['people', t('menu.villagers'), 'P'], ['farm', t('common.farm'), 'N'], ['collection', t('menu.collection'), ''], ['craft', t('menu.craft'), 'C'], ['map', t('menu.map'), 'M']]
const BUILD_KINDS = Object.keys(BUILDINGS) as BuildKind[]
let demolishArmed = 0
function demolishB(id: number) {
  if (demolishArmed !== id) { demolishArmed = id; g.toast(t('menu.clickAgainDemolishHalf')); return }
  demolishArmed = 0
  g.run(() => demolish(s, id))
}
const tab = computed(() => ui.tab)
function go(id: MenuTab) {
  ui.tab = id
  sfx('ui_select', 0.4)
}

// ---------- 背包 ----------
// 背包前 hotbar 格就是快捷栏一排（8 格，工具腰包后 10 格），其余是背包格；工具也是背包里的物品。
// 任意两格之间拖动即交换（同种可叠加物品会合并）；键盘、手柄：选中物品按“移动”，再选目标格
const picked = ref<number | null>(null)
const moving = ref<number | null>(null)
const cur = () => (picked.value !== null ? s.inv[picked.value] : null)
const barIdx = computed(() => { void ui.rev; return [...Array(s.hotbar).keys()] })
const bagIdx = computed(() => { void ui.rev; return [...Array(s.inv.length - s.hotbar).keys()].map((k) => k + s.hotbar) })
function click(i: number) {
  const j = moving.value
  moving.value = null
  if (j !== null) { place(j, i); picked.value = s.inv[i] ? i : null; return }
  picked.value = s.inv[i] ? (picked.value === i ? null : i) : null
}
function place(j: number, i: number) {
  if (j === i) return
  swapSlots(s, j, i)
  if (picked.value === j) picked.value = s.inv[i] ? i : null
  sfx('ui_select', 0.4)
  g.changed()
}
function startMove() {
  moving.value = picked.value
  nextTick(() => document.querySelector<HTMLElement>(`[data-slot="${picked.value}"]`)?.focus()) // 焦点回到这一格，方向键/Tab 去选目标
}
const dragging = ref(-1)
const over = ref(-1)
function dragStart(e: DragEvent, i: number) {
  dragging.value = i
  e.dataTransfer?.setData('text/plain', String(i))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function dragEnd() {
  dragging.value = over.value = -1
}
function drop(i: number) {
  if (dragging.value >= 0) place(dragging.value, i)
  dragEnd()
}
function equipPicked() {
  g.run(() => equipItem(s, picked.value!))
  if (!s.inv[picked.value!]) picked.value = null
}
function sort() {
  sortBag(s)
  picked.value = null
  sfx('ui_select', 0.4)
  g.changed()
}
function eatPicked() {
  g.run(() => eat(s, picked.value!))
  if (!s.inv[picked.value!]) picked.value = null
}
function usePicked() {
  g.run(() => useKeyItem(s, picked.value!))
  if (!s.inv[picked.value!]) picked.value = null
}

// ---------- 技能（设计 16.1 / 16.2） ----------
const SKILL_INFO: Record<Skill, { gain: string; perk: string; spec: string }> = {
  farming: { gain: t('menu.harvestingCrops'), perk: t('menu.farmWork3Energy'), spec: t('menu.lv5GrowerFresh') },
  foraging: { gain: t('menu.foragingFellingTrees'), perk: t('menu.axe3EnergyPer'), spec: t('menu.lv5Forester15') },
  mining: { gain: t('menu.miningNodesRocks'), perk: t('menu.pickaxe3EnergyPer'), spec: t('menu.lv5Miner15') },
  fishing: { gain: t('menu.catchingFish'), perk: t('menu.catchBar1Per'), spec: t('menu.lv5FisherFish') },
  husbandry: { gain: t('menu.feedingAnimalsCollectingProducts'), perk: t('menu.betterAnimalProductQuality'), spec: t('menu.lv5Herder20') },
  combat: { gain: t('menu.defeatingEnemies'), perk: t('menu.n15DamagePer'), spec: t('menu.lv5Guardian2') },
}
const nextXp = (xp: number) => XP_LEVELS[level(xp) + 1]
const skillBar = (xp: number) => {
  const l = level(xp)
  const a = XP_LEVELS[l]
  const b = XP_LEVELS[l + 1]
  return b ? `${((xp - a) / (b - a)) * 100}%` : '100%'
}
const unlocksAt = (k: Skill) => RECIPES.filter((r) => r.skill === k).map((r) => t('menu.lv2', r.level, ITEMS[r.out].name))

// ---------- 任务 ----------
const KIND: Record<string, string> = { main: t('menu.main'), guide: t('menu.tutorial'), npc: t('menu.request'), board: t('common.noticeBoard'), festival: t('menu.festival') }
const quests = computed(() => {
  void ui.rev
  const list = allQuests().filter((q) => s.quests[q.id])
  return {
    active: list.filter((q) => s.quests[q.id].st === 'active' || s.quests[q.id].st === 'ready'),
    offered: list.filter((q) => s.quests[q.id].st === 'offered'),
    done: list.filter((q) => s.quests[q.id].st === 'done'),
  }
})
const openQuest = ref<string | null>(null)
const where = (q: QuestDef) => q.submit === 'auto' ? '' : q.submit === 'teach_box' ? t('menu.teachingBoxTownNotice') : NPC_DEFS[q.submit]?.name ?? q.submit
function track(id: string) {
  const list = s.tracked
  if (list.includes(id)) s.tracked = list.filter((x) => x !== id)
  else s.tracked = [...list, id].slice(-3)
  g.changed()
}
const rewardText = (q: QuestDef) => [
  q.rewards.money ? t('common.goldCoins', q.rewards.money) : '',
  ...(q.rewards.items ?? []).map((it) => `${ITEMS[it.id]?.name ?? it.id}×${it.n}`),
  ...Object.entries(q.rewards.friendship ?? {}).map(([n, v]) => t('menu.friendship', NPC_DEFS[n]?.name ?? n, v)),
].filter(Boolean).join(t('punct.listSep'))

// ---------- 收集（设计 19.3） ----------
const catIdx = ref(0)
const catIds = computed(() => catIdsOf(catIdx.value))
// 居民页：认识之后才显示详情；“现在大概在”只给区域，不做全知追踪（18.3）
const people = computed(() => {
  void ui.rev
  void ui.tick
  return Object.values(NPC_DEFS).map((n) => {
    const f = s.friends[n.id]
    const place = npcPlace(s, n.id)
    const wp = (n as { workplace?: { region: string; spot: string } }).workplace
    return {
      id: n.id, name: n.name, role: n.role, met: !!f?.talked, pts: f?.pts ?? 0, talked: f?.talked === s.day, gifted: f?.gifted === s.day,
      giftsLeft: giftsLeft(s, n.id), birthdayToday: isBirthday(s, n.id),
      birthday: n.birthday ? t('common.date', SEASON_NAMES[n.birthday.season], n.birthday.day) : t('menu.unknown'),
      work: wp ? `${regionName(wp.region)} · ${wp.spot}` : '—',
      now: place && !place.at?.hidden ? regionName(place.region) : place ? t('menu.home') : '',
      events: [200, 400, 600].map((pts) => { const e = npcEvent(n.id, pts); return e ? s.flags.includes('event:' + e.id) : null }),
      partner: s.partner?.npc === n.id ? (s.partner.stage === 'together' ? t('menu.livingTogether') : t('menu.dating')) : '', romance: ROMANCE.has(n.id),
      portrait: lookPortrait(NPC_LOOK[n.id] ?? 0),
    }
  })
})

// ---------- 地图（设计 8.1 区域连接） ----------
const WORLD: { id: string; name: string; x: number; y: number; links: string[]; open: () => boolean }[] = [
  { id: 'farm', name: t('common.farm'), x: 18, y: 50, links: ['town', 'forest'], open: () => true },
  { id: 'town', name: t('common.town'), x: 50, y: 50, links: ['river', 'mountain'], open: () => true },
  { id: 'forest', name: t('common.woods'), x: 18, y: 82, links: [], open: () => true },
  { id: 'river', name: t('common.riverside'), x: 50, y: 82, links: ['wetland', 'deepforest'], open: () => true },
  { id: 'mountain', name: t('menu.mountainPath'), x: 50, y: 18, links: ['mine', 'highland'], open: () => true },
  { id: 'mine', name: t('common.mineEntrance'), x: 82, y: 18, links: [], open: () => s.unlocks.includes('region:mine') },
  { id: 'deepforest', name: t('common.deepWoods'), x: 82, y: 66, links: [], open: () => projectDone(s, 'bridge') },
  { id: 'wetland', name: t('common.wetland'), x: 66, y: 95, links: [], open: () => projectDone(s, 'bridge') },
  { id: 'highland', name: t('common.windmillHeights'), x: 82, y: 40, links: [], open: () => projectDone(s, 'station') },
]
const mapCanvas = ref<HTMLCanvasElement | null>(null)
function drawMap() {
  const c = mapCanvas.value
  if (!c) return
  const base = drawRegion(s, 10, document.createElement('canvas'))
  c.width = base.width
  c.height = base.height
  const x = c.getContext('2d')!
  x.drawImage(base, 0, 0)
  for (const n of g.npcs.values()) {
    if (n.hidden) continue
    x.fillStyle = '#ffd34a'
    x.beginPath()
    x.arc(n.x * 10, n.z * 10, 6, 0, Math.PI * 2)
    x.fill()
  }
  x.fillStyle = '#fff'
  x.strokeStyle = '#2b1a0a'
  x.lineWidth = 3
  x.beginPath()
  x.arc(s.x * 10, s.z * 10, 8, 0, Math.PI * 2)
  x.fill()
  x.stroke()
}
watch(() => ui.tab, (v) => { if (v === 'map') nextTick(drawMap) }, { immediate: true })
</script>

<template>
  <div class="backdrop" @mousedown.self="ui.panel = ''">
    <section class="panel wide menu split" role="dialog" :aria-label="t('menu.gameMenu')">
      <nav class="tabs" @wheel.prevent="($event.currentTarget as HTMLElement).scrollLeft += $event.deltaY + $event.deltaX">
        <button v-for="[id, name, key] in TABS" :key="id" :class="{ on: tab === id }" @click="go(id)">
          {{ name }}<small v-if="key">{{ key }}</small>
        </button>
        <button class="x" :aria-label="t('common.close')" @click="ui.panel = ''">×</button>
      </nav>

      <div :data-rev="ui.rev" class="tab-body">
        <!-- 背包 -->
        <template v-if="tab === 'bag'">
          <div class="bag-head">
            <p class="tip">{{ t('menu.topRowHotbarNumber', s.inv.length - s.hotbar) }}</p>
            <button :title="t('menu.mergeLooseStacksSort')" @click="sort">{{ t('menu.sortBackpack') }}</button>
          </div>
          <div class="hotbar-row">
            <div v-for="i in barIdx" :key="i" class="bar-cell" :class="{ over: over === i || moving === i }" :draggable="!!s.inv[i]"
              role="button" tabindex="0" :data-slot="i" :aria-label="t('menu.hotbar', i === 9 ? 0 : i + 1, s.inv[i] ? itemName(s.inv[i]!) : t('menu.empty'))"
              @click="click(i)" @keydown.enter.space.prevent="click(i)" @dragstart="dragStart($event, i)" @dragend="dragEnd"
              @dragover.prevent="over = i" @dragleave="over = -1" @drop.prevent="drop(i)">
              <ItemSlot :sl="s.inv[i]" :sel="picked === i || (picked === null && s.sel === i)" :label="i === 9 ? 0 : i + 1" />
            </div>
          </div>
          <div class="equip-row">
            <button v-for="k in (['armor', 'coat'] as const)" :key="k" type="button" class="eq cell" :title="s.equip[k] ? t('menu.clickUnequip') : ''" @click="g.run(() => unequip(s, k))">
              <ItemSlot :sl="s.equip[k] ? { id: s.equip[k]!, q: 0, n: 1 } : null" />
              <span>{{ k === 'armor' ? t('menu.armor') : t('common.winterCoat') }}{{ t('punct.colon') }}{{ s.equip[k] ? t('menu.unequip', ITEMS[s.equip[k]!].name) : t('menu.none') }}</span>
            </button>
          </div>
          <div class="grid">
            <div v-for="i in bagIdx" :key="i" :class="{ over: over === i || moving === i }" :draggable="!!s.inv[i]"
              role="button" tabindex="0" :data-slot="i" :aria-label="s.inv[i] ? itemName(s.inv[i]!) + (s.inv[i]!.n > 1 ? ' ×' + s.inv[i]!.n : '') : t('menu.slot', t('menu.empty'))"
              @click="click(i)" @keydown.enter.space.prevent="click(i)" @dragstart="dragStart($event, i)" @dragend="dragEnd"
              @dragover.prevent="over = i" @dragleave="over = -1" @drop.prevent="drop(i)">
              <ItemSlot :sl="s.inv[i]" :sel="picked === i" />
            </div>
          </div>
          <div class="detail">
            <template v-if="moving !== null">
              <b>{{ t('menu.moving', cur() ? itemName(cur()!) : '') }}</b><span class="tip">{{ t('menu.chooseSlotEmptySlots') }}</span>
              <button @click="moving = null">{{ t('menu.cancelMove') }}</button>
            </template>
            <template v-else-if="cur()">
              <b>{{ ITEMS[cur()!.id].tool && ITEMS[cur()!.id].tool !== 'rod' ? t('fmt.pair', TOOL_TIER[Math.max(0, s.tools[ITEMS[cur()!.id].tool!])], itemName(cur()!)) : itemName(cur()!) }}</b><template v-if="cur()!.n > 1"> ×{{ cur()!.n }}</template>
              <span v-if="ITEMS[cur()!.id].desc" class="tip">{{ ITEMS[cur()!.id].desc }}</span>
              <span v-if="ITEMS[cur()!.id].sell"> · {{ t('menu.sellsG', price(cur()!)) }}</span>
              <span v-if="foodOf(cur())"> · {{ t('menu.energy', foodOf(cur())![0]) }}<template v-if="foodOf(cur())![1]"> {{ t('menu.health', foodOf(cur())![1]) }}</template> {{ t('menu.fullness', foodOf(cur())![2]) }}</span>
              <span v-if="ITEMS[cur()!.id].med"> · {{ t('menu.healthMedicineUsableEven', ITEMS[cur()!.id].med) }}</span>
              <button v-if="foodOf(cur()) || ITEMS[cur()!.id].med !== undefined" class="primary" @click="eatPicked">{{ ITEMS[cur()!.id].med !== undefined ? t('common.use') : t('menu.eat') }}</button>
              <button v-if="ITEMS[cur()!.id].effect" class="primary" @click="usePicked">{{ t('common.use') }}</button>
              <button v-if="ITEMS[cur()!.id].equip" class="primary" @click="equipPicked">{{ t('menu.equip') }}</button>
              <button @click="startMove">{{ t('menu.move') }}</button>
            </template>
            <span v-else class="tip">{{ t('menu.clickItemDetailsKeyboard') }}</span>
          </div>
        </template>

        <!-- 农场：建筑（17.2 / 17.3） -->
        <template v-else-if="tab === 'farm'">
          <p class="tip">{{ t('menu.farmClickPlaceStart') }}</p>
          <h3>{{ t('menu.newBuildings') }}</h3>
          <div class="rows">
            <div v-for="k in BUILD_KINDS" :key="k" class="row">
              <div class="grow"><b>{{ BUILDINGS[k].name }}</b> <small>{{ t('common.size', BUILDINGS[k].w, BUILDINGS[k].d) }}</small>
                <Cost :money="BUILDINGS[k].money" :items="BUILDINGS[k].cost" :time="t('common.done', BUILDINGS[k].days)" /></div>
              <button :disabled="!canOrder(s, k) || !!busy(s) || s.region !== 'farm'" :title="!canOrder(s, k) ? t('menu.meetHeYanCarpentry') : s.region !== 'farm' ? t('common.goBackFarmPlace') : ''" @click="g.startPlan(k)">{{ t('menu.place') }}</button>
            </div>
            <p v-if="busy(s)" class="tip">{{ t('menu.crewBuilding', BUILDINGS[busy(s)!.k].name) }}</p>
          </div>
          <h3>{{ t('menu.buildings') }}</h3>
          <div class="rows">
            <div v-for="b in s.farmB" :key="b.id" class="row">
              <div class="grow"><b>{{ bName(s, b) }}</b> <small>{{ !bDone(s, b) ? t('menu.underConstruction') : b.up && !bLevel(s, b) ? t('menu.upgrading') : '' }}
                {{ b.k === 'coop' || b.k === 'barn' ? t('menu.animalCount', s.animals.filter((a) => a.home === b.id).length) : b.k === 'silo' ? t('menu.hay', s.silo, siloCap(s)) : '' }}</small></div>
              <button :disabled="!bDone(s, b) || s.region !== 'farm'" @click="g.startPlan(b.k, b.id)">{{ t('menu.move') }}</button>
              <button class="danger" :disabled="!bDone(s, b)" @click="demolishB(b.id)">{{ t('menu.demolish') }}</button>
            </div>
            <p v-if="!s.farmB.length" class="tip">{{ t('menu.haventBuiltAnythingYet') }}</p>
          </div>
        </template>

        <!-- 技能 -->
        <template v-else-if="tab === 'skills'">
          <div class="skill-list">
            <div v-for="k in SKILLS" :key="k" class="row skill">
              <div class="sk-name"><b>{{ SKILL_NAMES[k] }}</b><span class="lv">{{ t('menu.lv', level(s.xp[k])) }}</span></div>
              <div class="grow">
                <div class="bar xp"><i :style="{ width: skillBar(s.xp[k]) }" /></div>
                <small>{{ t('menu.xp', s.xp[k]) }}{{ nextXp(s.xp[k]) ? ' / ' + nextXp(s.xp[k]) : t('menu.maxLevel') }} · {{ t('menu.from', SKILL_INFO[k].gain) }}</small><br />
                <small>{{ SKILL_INFO[k].perk }}</small><br />
                <small class="spec">{{ SKILL_INFO[k].spec }}</small>
                <small v-if="unlocksAt(k).length" class="spec"> · {{ t('menu.recipes', unlocksAt(k).join(t('punct.listSep'))) }}</small>
              </div>
            </div>
          </div>
        </template>

        <!-- 任务 -->
        <template v-else-if="tab === 'quests'">
          <p v-if="s.mail.length" class="tip lack">{{ t('menu.unreadMailCheckMailbox', s.mail.length) }}</p>
          <h3>{{ t('menu.active') }}</h3>
          <p v-if="!quests.active.length" class="tip">{{ t('menu.noActiveQuestsRight') }}</p>
          <div class="rows">
            <div v-for="q in quests.active" :key="q.id" class="row quest clickable" @click="openQuest = openQuest === q.id ? null : q.id">
              <div class="grow">
                <span class="kind" :class="q.kind">{{ KIND[q.kind] ?? t('menu.quests') }}</span>
                <b>{{ q.title }}</b>
                <span v-if="s.quests[q.id].st === 'ready'" class="ready">{{ where(q) ? t('menu.turn', where(q)) : t('menu.readyTurn') }}</span>
                <span v-else-if="s.mail.includes(q.id)" class="tip">{{ t('menu.letterUnread') }}</span>
                <ul class="objs">
                  <li v-for="(o, i) in q.objectives" :key="i" :class="{ ok: objectiveProgress(s, q, i)[0] >= objectiveProgress(s, q, i)[1] }">
                    {{ o.text }} <em>{{ objectiveProgress(s, q, i)[0] }}/{{ objectiveProgress(s, q, i)[1] }}</em>
                  </li>
                </ul>
                <template v-if="openQuest === q.id">
                  <p class="intro">{{ q.intro }}</p>
                  <small v-if="rewardText(q)">{{ t('common.reward', rewardText(q)) }}</small>
                </template>
              </div>
              <button :class="{ primary: s.tracked.includes(q.id) }" @click.stop="track(q.id)">{{ s.tracked.includes(q.id) ? t('menu.untrack') : t('menu.track') }}</button>
            </div>
          </div>
          <template v-if="quests.offered.length">
            <h3>{{ t('menu.available') }}</h3>
            <div class="rows">
              <div v-for="q in quests.offered" :key="q.id" class="row quest">
                <div class="grow">
                  <span class="kind" :class="q.kind">{{ KIND[q.kind] ?? t('menu.quests') }}</span><b>{{ q.title }}</b>
                  <small class="tip"> · {{ t('menu.get', q.giver === 'board' ? t('menu.townNoticeBoard') : NPC_DEFS[q.giver]?.name ?? q.giver) }}</small>
                </div>
              </div>
            </div>
          </template>
          <h3 v-if="quests.done.length">{{ t('common.completed') }}</h3>
          <div class="done-list">
            <span v-for="q in quests.done" :key="q.id" class="done-q" :title="q.journal">✓ {{ q.title }}</span>
          </div>
        </template>

        <!-- 收集 -->
        <template v-else-if="tab === 'collection'">
          <div class="subtabs">
            <button v-for="(c, i) in CATS" :key="c.name" :class="{ on: catIdx === i }" @click="catIdx = i">{{ c.name }}</button>
          </div>
          <p class="tip">{{ t('menu.found', catIds.filter((id) => s.found[id]).length, catIds.length) }}</p>
          <div class="grid">
            <div v-for="id in catIds" :key="id" :class="{ unknown: !s.found[id] }" :title="s.found[id] ? ITEMS[id].name : t('common.notFoundYet')">
              <ItemSlot :sl="{ id, q: 0, n: 1 }" />
            </div>
          </div>
        </template>

        <!-- 居民（18.2 关系、18.3 已知活动地点） -->
        <template v-else-if="tab === 'people'">
          <div class="people">
            <div v-for="p in people" :key="p.id" class="person" :class="{ unknown: !p.met }">
              <img class="face" :src="p.portrait" alt="" />
              <div class="grow">
                <div class="who"><b>{{ p.met ? p.name : t('menu.unknownName') }}</b> <small>{{ p.met ? p.role : t('menu.notMetYet') }}</small>
                  <small v-if="p.birthdayToday" class="price"> · {{ t('menu.birthdayToday') }}</small></div>
                <template v-if="p.met">
                  <div class="fline">
                    <span class="fbar big"><i :style="{ width: p.pts / 10 + '%' }" /><em v-for="m in [200, 400, 600]" :key="m" :style="{ left: m / 10 + '%' }" :class="{ got: p.pts >= m }" /></span>
                    <small>{{ t('common.friendship1000', p.pts) }}</small>
                  </div>
                  <small>{{ t('menu.birthday', p.birthday) }} · {{ p.talked ? t('menu.talkedToday') : t('menu.notTalkedToday') }} · {{ p.gifted ? t('menu.giftGivenToday') : t('menu.giftsLeftWeek', p.giftsLeft) }}</small><br />
                  <small>{{ t('menu.usually', p.work) }}<template v-if="p.now"> · {{ t('menu.nowLikely', p.now) }}</template></small><br />
                  <small class="spec">{{ t('menu.friendshipEvents') }}<template v-for="(done, k) in p.events" :key="k"><span v-if="done !== null" :class="{ got: done }">{{ [200, 400, 600][k] }}{{ done ? '✓' : '' }} </span></template>
                    {{ p.events.some((e) => e === false && true) && p.pts >= 200 ? t('menu.unlockedEventsTriggerWhen') : '' }}</small>
                  <small v-if="p.partner" class="price"> · {{ p.partner }} <button class="mini danger" @click="endRelation">{{ t('menu.break') }}</button></small>
                  <small v-else-if="p.romance && p.pts >= 800" class="tip"> · {{ t('menu.giveBouquetAskThem') }}</small>
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- 制作 -->
        <template v-else-if="tab === 'craft'">
          <div class="rows">
            <template v-for="(r, i) in RECIPES" :key="r.out">
            <div v-if="!r.at" class="row">
              <ItemSlot :sl="{ id: r.out, q: 0, n: r.n }" />
              <div class="grow">
                <b>{{ ITEMS[r.out].name }}</b> <small>{{ r.note }}</small>
                <Cost :items="r.cost" :time="r.min ? t('menu.takesMin', r.min) : undefined" />
                <small v-if="recipeLocked(s, i)" class="lack">{{ recipeLocked(s, i) }}</small>
              </div>
              <button class="primary" :disabled="!!recipeLocked(s, i)" @click="g.run(() => craft(s, i))">{{ t('menu.craft') }}</button>
            </div>
            </template>
            <p class="tip">{{ t('menu.dishesCookedStoveTown') }}</p>
          </div>
        </template>

        <!-- 地图 -->
        <template v-else-if="tab === 'map'">
          <div class="map-wrap">
            <div class="world">
              <svg viewBox="0 0 100 100" class="world-svg">
                <template v-for="r in WORLD" :key="r.id">
                  <line v-for="l in r.links" :key="l" :x1="r.x" :y1="r.y" :x2="WORLD.find((w) => w.id === l)!.x" :y2="WORLD.find((w) => w.id === l)!.y" />
                </template>
                <g v-for="r in WORLD" :key="r.id" :class="{ cur: r.id === s.region, locked: !r.open() }">
                  <circle :cx="r.x" :cy="r.y" r="7" />
                  <text :x="r.x" :y="r.y + 13">{{ r.name }}</text>
                </g>
              </svg>
              <small class="tip">{{ t('menu.grayAreasArentOpen') }}</small>
            </div>
            <div class="region-map">
              <b>{{ regionOf(s).name }}</b>
              <canvas ref="mapCanvas" />
              <small class="tip">{{ t('menu.whiteYellowVillagersRed') }}</small>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
