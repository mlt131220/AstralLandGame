<script setup lang="ts">
import { computed, ref } from 'vue'
import { ITEMS } from '../content/content.ts'
import { NPC_DEFS, NPC_LOOK } from '../content/story.ts'
import { deliverQuest, itemName } from '../core/actions.ts'
import { acceptQuest, deliveryPreview, offeredBy, questDef, readMail, type QuestDef } from '../core/quests.ts'
import { year } from '../core/state.ts'
import {
  cancelFeast, festivalNow, fireflyFound, finishEvent, stashFeast, finishSafety, fundProject, gift, giftable, giftsLeft, giveRomance, isBirthday, projectInfo, SAFETY_STEPS, shopOpen,
} from '../core/town.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import { lookPortrait } from '../render/models.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Cost from './Cost.vue'

const g = game!
const s = g.s
const d = computed(() => ui.dialog!)
const npcDef = computed(() => (d.value.npc ? NPC_DEFS[d.value.npc] : undefined))
const portrait = computed(() => (d.value.npc ? lookPortrait(NPC_LOOK[d.value.npc] ?? 0) : ''))
const giver = computed(() => (d.value.kind === 'board' ? 'board' : d.value.npc ?? ''))
const pts = computed(() => { void ui.rev; return d.value.npc ? s.friends[d.value.npc]?.pts ?? 0 : 0 })
// 该处可交付的任务、待接取的委托
const ready = computed(() => {
  void ui.rev
  const board = d.value.kind === 'board'
  return Object.entries(s.quests).map(([id, st]) => [questDef(id), st] as const).filter(([q, st]) => q && st.st === 'ready' && (
    board ? q.submit === 'teach_box' || ((q.kind === 'board' || q.kind === 'npc') && q.submit !== 'auto' && q.objectives.some((o) => o.type === 'deliver'))
      : q.submit === d.value.npc)).map(([q]) => q!)
})
const offers = computed(() => {
  void ui.rev
  return giver.value ? offeredBy(s, giver.value) : []
})
const offer = computed(() => (d.value.kind === 'npc' && !gifting.value ? offers.value[0] : undefined))
// 节庆当天主持人负责小游戏（花种会林棠、开钓日沈舟……）
const festGame = computed(() => {
  void ui.rev
  const f = festivalNow(s)
  return f && d.value.npc === f.host && f.canEnter && !s.flags.includes(`fest:${f.id}:${year(s.day)}`) && !(f.id === 'firefly' && fireflyFound(s) < 3) ? f : null
})
function feast(fn: typeof stashFeast) {
  const r = g.run(() => fn(s))
  if (r.ok) sfx('ui_confirm', 0.5)
  g.changed()
}
function joinFestival() {
  ui.dialog = null
  ui.panel = 'festival'
}
const shopFor = computed(() => (d.value.npc === 'lintang' ? 'general' : d.value.npc === 'laotao' ? 'smith' : null))
const canShop = computed(() => !!shopFor.value && shopOpen(s, shopFor.value))
const rewardText = (q: QuestDef) => [
  q.rewards.money ? t('common.goldCoins', q.rewards.money) : '',
  ...(q.rewards.items ?? []).map((it) => `${ITEMS[it.id]?.name ?? it.id}×${it.n}`),
].filter(Boolean).join(t('punct.listSep'))

// 事件：逐句播放 → 恰好一次选择 → 回应
const stepLines = computed(() => (d.value.kind === 'safety' ? SAFETY_STEPS : d.value.lines))
const atChoice = computed(() => d.value.kind === 'event' && d.value.idx >= d.value.lines.length - 1 && d.value.picked === undefined)
const reply = ref('')

function close() {
  ui.dialog = null
  ui.panel = ''
}
function next() {
  if (d.value.kind === 'safety' && d.value.idx >= SAFETY_STEPS.length - 1) {
    g.run(() => finishSafety(s))
    sfx('fanfare', 0.6)
    return close()
  }
  if (d.value.kind === 'event' && d.value.picked !== undefined) return close()
  if (d.value.idx < stepLines.value.length - 1) d.value.idx++
  else close()
}
function choose(i: number) {
  const r = g.run(() => finishEvent(s, d.value.npc!, i))
  if (!r.ok) return
  d.value.picked = i
  reply.value = d.value.choice![i].reply
  sfx('fanfare', 0.6)
}
function deliver() {
  const q = ready.value[0]
  if (!q) return
  const r = g.run(() => deliverQuest(s, q.id, q.submit)) // 公告板旁的委托柜代收，奖励与当面交付相同
  if (r.ok) {
    sfx('ui_confirm', 0.7)
    d.value.lines = [q?.complete || t('dialogue.thank')]
    d.value.idx = 0
  }
}
function accept(q: QuestDef) {
  acceptQuest(s, q.id)
  g.changed()
  sfx('ui_confirm', 0.6)
  if (d.value.kind === 'npc') {
    d.value.lines = [t('dialogue.imCounting')]
    d.value.idx = 0
  }
}
function acceptLetter() {
  readMail(s, d.value.quest!)
  g.changed()
  close()
}
function openShop() {
  ui.shop = shopFor.value! // 先取店铺：清掉对话后 shopFor 会读到空对话
  ui.dialog = null
  ui.panel = 'shop'
}

// 18.2 赠礼
const gifting = ref(false)
function give(i: number) {
  const id = s.inv[i]?.id
  if (id === 'bouquet' || id === 'promise_charm') {
    const r = g.run(() => giveRomance(s, d.value.npc!, i))
    if (!r.ok) return
    sfx('fanfare', 0.7)
    gifting.value = false
    d.value.lines = [r.msg!]
    d.value.idx = 0
    return
  }
  const r = gift(s, d.value.npc!, i)
  if (!r.ok) { g.toast(r.msg!); sfx('ui_error', 0.4); return }
  g.changed()
  sfx(r.taste === 'love' || r.taste === 'like' ? 'ui_confirm' : 'ui_select', 0.6)
  gifting.value = false
  d.value.lines = [r.msg!]
  d.value.idx = 0
}

// 17.1 水闸工程筹建
const sluice = computed(() => { void ui.rev; return projectInfo(s, 'sluice') })
function fund() {
  if (g.run(() => fundProject(s, 'sluice')).ok) sfx('fanfare', 0.7)
}
</script>

<template>
  <div class="backdrop" @mousedown.self="d.kind === 'event' && d.picked === undefined ? null : close()">
    <section class="panel dialog" :class="d.kind" role="dialog" :aria-label="d.title">
      <header><h2>{{ d.title }}</h2></header>
      <div class="dlg-body">
        <img v-if="portrait" class="portrait" :src="portrait" alt="" />
        <div class="grow">
          <b v-if="npcDef">{{ npcDef.name }}<small v-if="npcDef.role"> · {{ npcDef.role }}</small>
            <small class="friend" :title="t('common.friendship1000', pts)"> · {{ t('dialogue.friendship') }} <i class="fbar"><i :style="{ width: pts / 10 + '%' }" /></i> {{ pts }}</small>
            <small v-if="isBirthday(s, d.npc!)" class="price"> · {{ t('dialogue.birthdayToday') }}</small>
          </b>
          <template v-if="gifting">
            <p class="line">{{ t('dialogue.chooseGiftLeftToday', npcDef?.name ?? '', giftsLeft(s, d.npc!)) }}</p>
            <div class="grid gift-grid">
              <template v-for="(sl, i) in s.inv" :key="i">
                <button v-if="sl && (giftable(sl.id) || sl.id === 'bouquet' || sl.id === 'promise_charm')" type="button" class="gift-cell cell" :title="itemName(sl)" @click="give(i)">
                  <ItemSlot :sl="sl" />
                </button>
              </template>
            </div>
          </template>
          <template v-else>
            <p class="line" :class="{ letter: d.kind === 'letter' }">{{ offer ? offer.intro : d.picked !== undefined ? reply : stepLines[d.idx] }}</p>
            <p v-if="offer" class="tip">{{ t('dialogue.request', offer.title) }}<template v-if="rewardText(offer)"> · {{ t('common.reward', rewardText(offer)) }}</template></p>
            <p v-if="!offer && ready.length && deliveryPreview(s, ready[0]).length" class="tip">
              {{ t('dialogue.deliveringHandOver', ready[0].title, deliveryPreview(s, ready[0]).map((sl) => itemName(sl) + '×' + sl.n).join(t('punct.listSep'))) }}
            </p>
            <div v-if="atChoice" class="rows choices">
              <button v-for="(c, i) in d.choice" :key="i" class="choice" @click="choose(i)">{{ c.text }}</button>
            </div>
          </template>
          <div v-if="d.kind === 'board'" class="rows">
            <div v-for="q in offers" :key="q.id" class="row">
              <div class="grow"><b>{{ q.title }}</b><br /><small>{{ q.intro }}</small><br /><small v-if="rewardText(q)" class="price">{{ t('common.reward', rewardText(q)) }}</small></div>
              <button class="primary" @click="accept(q)">{{ t('dialogue.accept') }}</button>
            </div>
            <div v-if="sluice.open || sluice.started" class="row project">
              <div class="grow">
                <b>{{ t('common.publicProject', sluice.name) }}</b>
                <template v-if="sluice.done"> · {{ t('dialogue.completeRiversidePathSafe') }}</template>
                <template v-else-if="sluice.started"> · {{ t('dialogue.underConstructionDoneTomorrow') }}</template>
                <Cost v-else :money="sluice.money" :items="sluice.cost" :time="t('dialogue.paidFullBuilt1')" />
              </div>
              <button v-if="!sluice.started" class="primary" @click="fund">{{ t('common.fund') }}</button>
            </div>
            <p v-if="!offers.length && !ready.length && !sluice.open" class="tip">{{ t('dialogue.noNewRequestsRight') }}</p>
          </div>
        </div>
      </div>
      <div class="actions">
        <template v-if="d.kind === 'letter'">
          <button class="primary" autofocus @click="acceptLetter">{{ t('dialogue.accept2') }}</button>
        </template>
        <template v-else-if="gifting">
          <button @click="gifting = false">{{ t('dialogue.neverMind') }}</button>
        </template>
        <template v-else-if="offer">
          <button class="primary" autofocus @click="accept(offer)">{{ t('dialogue.acceptRequest') }}</button>
          <button @click="close">{{ t('dialogue.maybeLater') }}</button>
        </template>
        <template v-else-if="atChoice" />
        <template v-else>
          <button v-if="ready.length" class="primary" @click="deliver">{{ t('dialogue.deliver', ready[0].title) }}</button>
          <button v-if="d.kind === 'npc' && festGame" class="primary" @click="joinFestival">{{ t('dialogue.join', festGame.game) }}</button>
          <button v-if="d.kind === 'npc' && d.npc === 'xiahe' && s.quests.Q23?.st === 'active' && !s.stash?.Q23" @click="feast(stashFeast)">{{ t('dialogue.give3DishesBook') }}</button>
          <button v-if="d.kind === 'npc' && d.npc === 'xiahe' && s.stash?.Q23 && !s.flags.includes('event:long_table_feast')" @click="feast(cancelFeast)">{{ t('dialogue.cancelFeastTakeDishes') }}</button>
          <button v-if="d.kind === 'npc' && giftsLeft(s, d.npc!)" @click="gifting = true">{{ t('dialogue.giveGift') }}</button>
          <button v-if="d.kind === 'npc' && canShop && !festGame" @click="openShop">{{ d.npc === 'laotao' ? t('dialogue.buyUpgradeTools') : t('dialogue.shop') }}</button>
          <button :class="{ primary: !ready.length && !canShop }" autofocus @click="next">{{ d.picked !== undefined || d.idx >= stepLines.length - 1 ? (d.kind === 'safety' ? t('dialogue.got') : t('dialogue.goodbye')) : t('common.continue') }}</button>
        </template>
      </div>
    </section>
  </div>
</template>
