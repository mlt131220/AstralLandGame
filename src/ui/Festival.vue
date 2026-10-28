<script setup lang="ts">
// 20.1 花种会：限时认花配对。活动期间暂停普通世界模拟（打开界面即暂停），结束后时间推进到 18:00。
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { FESTIVALS, ITEMS } from '../content/content.ts'
import { rand } from '../core/state.ts'
import { finishFestival } from '../core/town.ts'
import { t } from '../core/i18n.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import Panel from './Panel.vue'

const g = game!
const s = g.s
const FLOWERS = ['spring_daisy', 'summer_sunflower', 'autumn_chrysanthemum', 'spring_strawberry', 'spring_flax', 'summer_blueberry']
const TIME = 90
// 牌面顺序随世界种子与日期确定，刷新页面不会变
const deck = [...FLOWERS, ...FLOWERS].map((id, i) => ({ id, k: rand(s.seed, s.day, i, 81) })).sort((a, b) => a.k - b.k)
  .map((c, i) => reactive({ i, id: c.id, open: false, done: false }))
const left = ref(TIME)
const started = ref(false)
const over = ref(false)
let flipped: typeof deck = []
let lock = false
let timer = 0

const matched = () => deck.filter((c) => c.done).length / 2
function flip(c: (typeof deck)[number]) {
  if (!started.value || over.value || lock || c.open || c.done) return
  c.open = true
  sfx('ui_select', 0.5)
  flipped.push(c)
  if (flipped.length < 2) return
  const [a, b] = flipped
  flipped = []
  if (a.id === b.id) {
    a.done = b.done = true
    sfx('ui_confirm', 0.6)
    if (matched() === FLOWERS.length) end()
  } else {
    lock = true
    setTimeout(() => { a.open = b.open = false; lock = false }, 750)
  }
}
function start() {
  started.value = true
  sfx('fanfare', 0.5)
  timer = window.setInterval(() => { if (--left.value <= 0) end() }, 1000)
}
function end() {
  if (over.value) return
  over.value = true
  clearInterval(timer)
  for (const c of deck) c.open = true
}
// 结算只做一次：开始过配对就按当前成绩结算；没开始就离场则按“入场时间 +60 分钟或结束时刻较早者”推进时间（20.2）
let settled = false
function settle() {
  if (settled) return
  settled = true
  clearInterval(timer)
  if (started.value) g.run(() => finishFestival(s, 'flower_fair', matched(), t('festival.matchedFlowerEveryoneRemember', matched())))
  else {
    s.min = Math.max(s.min, Math.min(FESTIVALS.flower_fair.end, enteredAt + 60))
    g.changed()
  }
}
const enteredAt = s.min
function finish() {
  settle()
  ui.panel = ''
}
function leave() {
  settle()
  ui.panel = ''
}
onMounted(() => sfx('ui_open', 0.4))
onUnmounted(settle) // Esc、右上角 ×、点遮罩关闭都走同一结算，不能零时间反复记牌
</script>

<template>
  <Panel :title="t('festival.flowerFairFlowerMatch')" wide>
    <p class="tip">
      {{ t('festival.squareFullPottedFlowers') }}
    </p>
    <div class="fest-head">
      <span>{{ t('festival.matched') }} <b>{{ matched() }}</b> {{ t('festival.pairs', FLOWERS.length) }}</span>
      <span>{{ t('common.timeLeft') }} <b>{{ left }}</b> {{ t('common.seconds') }}</span>
    </div>
    <div class="memory">
      <button v-for="c in deck" :key="c.i" class="card" :class="{ open: c.open || c.done, done: c.done }" :disabled="!started || over" @click="flip(c)">
        <img v-if="c.open || c.done" :src="`/assets/icons/${c.id}.png`" :alt="ITEMS[c.id].name" draggable="false" />
        <span v-else>✿</span>
        <small v-if="c.open || c.done">{{ ITEMS[c.id].name }}</small>
      </button>
    </div>
    <div class="actions">
      <template v-if="!started">
        <button class="primary" autofocus @click="start">{{ t('common.start') }}</button>
        <button @click="leave">{{ t('festival.lookAroundLeave') }}</button>
      </template>
      <template v-else-if="over">
        <span class="tip">{{ matched() === FLOWERS.length ? t('festival.matchedThemVillagersWatching') : t('festival.timesPairsMatched', matched()) }}</span>
        <button class="primary" autofocus @click="finish">{{ t('festival.swapFlowersFinish') }}</button>
      </template>
    </div>
  </Panel>
</template>
