<script setup lang="ts">
// F02 河岸开钓日：三段各 60 秒的钓鱼赛。浮漂一沉，指针扫过绿区时收竿；辅助模式绿区更宽、指针更慢。只旁观也算参加。
import { computed, onUnmounted, ref } from 'vue'
import { FISH } from '../../content/content.ts'
import { rand } from '../../core/state.ts'
import { t } from '../../core/i18n.ts'
import { NPC_DEFS } from '../../content/story.ts'
import { sfx } from '../../platform/audio.ts'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const ROUNDS = 3, SEG = 60
const pool = FISH.filter((f) => f.at === 'river' && f.seasons.includes(0))
const catches = ref<{ name: string; cm: number }[]>([])
const total = computed(() => catches.value.reduce((a, c) => a + c.cm, 0))
const watched = ref(false)
const { s, f, start, close } = useFest('fishing_derby', () =>
  watched.value ? [0, t('fest.derby.watchedWholeDerbyBank')] : [total.value, rank.value === 1 ? t('fest.derby.caughtFishOverThree', catches.value.length, total.value) : t('fest.derby.caughtFishOverThree2', catches.value.length, total.value, rank.value)])
// 对手成绩按世界种子与年份固定
const rivals = ['shenzhou', 'luyao', 'aman'].filter((n) => NPC_DEFS[n]).map((n, i) => ({ name: NPC_DEFS[n].name, cm: Math.round(70 + rand(s.seed, Math.floor(s.day / 112), i, 301) * 90) }))
const rank = computed(() => 1 + rivals.filter((r) => r.cm > total.value).length)

const assist = ref(false)
const round = ref(0) // 0 未开始；1..3 比赛中；4 结束
const left = ref(SEG)
const phase = ref<'wait' | 'bite' | 'rest'>('wait')
const needle = ref(0)
const zone = ref(0.5)
const msg = ref('')
let sweep = 0, phaseT = 0, timer = 0, last = 0
const width = computed(() => (assist.value ? 0.3 : 0.16))
function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  sweep += dt * (assist.value ? 0.65 : 1)
  needle.value = 0.5 + 0.5 * Math.sin(sweep * 2.6)
  if ((phaseT -= dt) <= 0) {
    if (phase.value === 'bite') { msg.value = t('fest.derby.gotAway'); sfx('reel', 0.3) }
    if (phase.value !== 'wait') { phase.value = 'wait'; phaseT = 1 + Math.random() * 1.6 }
    else { phase.value = 'bite'; phaseT = 3; zone.value = 0.2 + Math.random() * 0.6; msg.value = t('fest.derby.bobbersDown'); sfx('bite', 0.5) }
  }
  timer = requestAnimationFrame(tick)
}
let clock = 0
function begin() {
  start()
  nextRound()
}
function nextRound() {
  round.value++
  if (round.value > ROUNDS) { cancelAnimationFrame(timer); clearInterval(clock); return }
  left.value = SEG
  phase.value = 'wait'
  phaseT = 1.2
  msg.value = t('fest.derby.roundGo', round.value)
  last = performance.now()
  cancelAnimationFrame(timer)
  timer = requestAnimationFrame(tick)
  clearInterval(clock)
  clock = window.setInterval(() => { if (--left.value <= 0) { cancelAnimationFrame(timer); clearInterval(clock); phase.value = 'rest'; sfx('timer_end', 0.5); msg.value = round.value < ROUNDS ? t('fest.derby.roundOverTakeBreather') : t('fest.derby.thatsDerby'); if (round.value >= ROUNDS) { round.value = ROUNDS + 1; sfx('cheer', 0.5) } } }, 1000)
}
function reel() {
  if (phase.value !== 'bite') { msg.value = t('fest.derby.notBitingYetEasy'); return }
  const d = Math.abs(needle.value - zone.value)
  if (d > width.value / 2) { msg.value = t('fest.derby.tooEarlyTooLate'); phase.value = 'rest'; phaseT = 0.8; return }
  const fish = pool[Math.floor(Math.random() * pool.length)]
  const cm = Math.round((14 + fish.diff * 8) * (0.75 + 0.5 * (1 - d / (width.value / 2))))
  catches.value.push({ name: fish.name, cm })
  msg.value = t('fest.derby.caughtCm', fish.name, cm)
  sfx('catch', 0.6)
  phase.value = 'rest'
  phaseT = 0.8
}
function watch() { watched.value = true; start(); close() }
onUnmounted(() => { cancelAnimationFrame(timer); clearInterval(clock) })
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.derby.shenZhouHoldsScoreboard') }}</p>
    <template v-if="round === 0">
      <label class="tip"><input v-model="assist" type="checkbox" /> {{ t('fest.derby.fishingAssistWiderGreen') }}</label>
      <div class="actions">
        <button class="primary" autofocus @click="begin">{{ t('fest.derby.sign') }}</button>
        <button @click="watch">{{ t('fest.derby.watchCountsToo') }}</button>
        <button @click="close">{{ t('common.lookAround') }}</button>
      </div>
    </template>
    <template v-else>
      <div class="fest-head"><span>{{ t('fest.derby.round3', Math.min(round, 3)) }}</span><span>{{ t('common.timeLeft') }} <b>{{ left }}</b> {{ t('common.seconds') }}</span><span>{{ t('fest.derby.total') }} <b>{{ total }}</b> {{ t('fest.derby.cm2') }}</span></div>
      <div class="bar" :class="{ live: phase === 'bite' }">
        <i class="zone" :style="{ left: (zone - width / 2) * 100 + '%', width: width * 100 + '%' }" />
        <i class="needle" :style="{ left: needle * 100 + '%' }" />
      </div>
      <p class="msg">{{ msg }}</p>
      <div class="actions">
        <button v-if="round <= 3 && left > 0" class="primary" @click="reel">{{ t('fest.derby.reel') }}</button>
        <button v-if="round <= 3 && left <= 0" class="primary" @click="nextRound">{{ t('fest.derby.nextRound') }}</button>
      </div>
      <div class="board">
        <div v-for="(c, i) in catches" :key="i" class="tip">{{ t('fest.derby.cm', c.name, c.cm) }}</div>
      </div>
      <template v-if="round > 3">
        <h3>{{ t('fest.derby.leaderboard') }}</h3>
        <ol><li v-for="r in [...rivals, { name: t('fest.derby.you'), cm: total }].sort((a, b) => b.cm - a.cm)" :key="r.name" :class="{ me: r.name === t('fest.derby.you') }">{{ t('fest.derby.cm', r.name, r.cm) }}</li></ol>
        <div class="actions"><button class="primary" autofocus @click="close">{{ t('fest.derby.takeKeepsakeFinish') }}</button></div>
      </template>
    </template>
  </Panel>
</template>

<style scoped>
.bar { position: relative; height: 26px; margin: 12px 0 6px; border-radius: 13px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.bar.live { box-shadow: 0 0 0 2px #f3c76a inset; }
.zone { position: absolute; top: 0; bottom: 0; background: rgba(110, 220, 120, 0.55); }
.needle { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; background: #fff; }
.msg { min-height: 1.4em; text-align: center; }
.board { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.me { color: #f3c76a; font-weight: bold; }
.fest-head { display: flex; justify-content: space-between; }
</style>
