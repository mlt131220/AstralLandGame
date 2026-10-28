<script setup lang="ts">
// F06 丰收协作日：60 秒里把收成分进三只箱子（红：水果　黄：谷物与花　绿：蔬菜），何砚负责把装满的箱子搬上车。
import { onUnmounted, ref } from 'vue'
import { CROPS, ITEMS } from '../../content/content.ts'
import { t } from '../../core/i18n.ts'
import { sfx } from '../../platform/audio.ts'
import ItemSlot from '../ItemSlot.vue'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const TIME = 60
const BINS = [{ k: 'red', name: t('common.fruit'), tags: ['fruit'] }, { k: 'yellow', name: t('fest.sorting.grainFlowers'), tags: ['grain', 'flower'] }, { k: 'green', name: t('common.veggies'), tags: ['veg'] }]
const pool = Object.keys(CROPS).filter((id) => BINS.some((b) => b.tags.some((tag) => ITEMS[id]?.tags?.includes(tag))))
const left = ref(TIME)
const item = ref(pool[0])
const right = ref(0)
const wrong = ref(0)
const shake = ref('')
const over = ref(false)
const { f, started, start, close } = useFest('harvest_coop', () => [right.value, t('fest.sorting.sortedHarvestEveryoneHe', right.value)])
let timer = 0
const next = () => { item.value = pool[Math.floor(Math.random() * pool.length)] }
function begin() {
  start()
  next()
  timer = window.setInterval(() => {
    if (--left.value <= 0) { clearInterval(timer); over.value = true; sfx('timer_end', 0.5) }
    else if (left.value <= 5) sfx('timer_tick', 0.3)
  }, 1000)
}
function drop(b: (typeof BINS)[number]) {
  if (!started.value || over.value) return
  if (b.tags.some((tag) => ITEMS[item.value]?.tags?.includes(tag))) { right.value++; sfx('sort_drop', 0.5); next() }
  else { wrong.value++; shake.value = b.k; setTimeout(() => (shake.value = ''), 300); sfx('ui_error', 0.4) }
}
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.sorting.heYanRollsHis') }}</p>
    <div class="fest-head"><span>{{ t('fest.sorting.sorted') }} <b>{{ right }}</b> {{ t('fest.sorting.crates') }}</span><span>{{ t('common.timeLeft') }} <b>{{ left }}</b> {{ t('common.seconds') }}</span></div>
    <div v-if="started" class="now"><ItemSlot :sl="{ id: item, q: 0, n: 1 }" /><b>{{ ITEMS[item].name }}</b></div>
    <div class="bins">
      <button v-for="b in BINS" :key="b.k" class="bin" :class="[b.k, { shake: shake === b.k }]" :disabled="!started || over" @click="drop(b)">{{ b.name }}</button>
    </div>
    <div class="actions">
      <template v-if="!started"><button class="primary" autofocus @click="begin">{{ t('fest.sorting.startSorting') }}</button><button @click="close">{{ t('common.lookAround') }}</button></template>
      <template v-else-if="over"><span class="tip">{{ wrong ? t('fest.sorting.timesSortedButThats', right, wrong) : t('fest.sorting.timesSortedNotSingle', right) }}</span>
        <button class="primary" autofocus @click="close">{{ t('fest.sorting.wrapFinish') }}</button></template>
    </div>
  </Panel>
</template>

<style scoped>
.now { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0; font-size: 18px; }
.bins { display: flex; gap: 10px; justify-content: center; }
.bin { width: 120px; height: 70px; border-radius: 10px; font-size: 16px; color: #fff; }
.bin.red { background: #b84a3a; } .bin.yellow { background: #c8a030; } .bin.green { background: #4a9a4a; }
.bin.shake { animation: shake 0.3s; }
@keyframes shake { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.fest-head { display: flex; justify-content: space-between; }
</style>
