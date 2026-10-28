<script setup lang="ts">
// F05 田野集市：从背包里挑最多 6 件农产摆进展台（只是借展，结束原样还给你），评审看种类、品质、时令与搭配。
import { computed, ref } from 'vue'
import { ITEMS } from '../../content/content.ts'
import { season } from '../../core/state.ts'
import { t } from '../../core/i18n.ts'
import { CROPS } from '../../content/content.ts'
import { sfx } from '../../platform/audio.ts'
import ItemSlot from '../ItemSlot.vue'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const CATS: [string, string][] = [['veg', t('common.veggies')], ['fruit', t('common.fruit')], ['flower', t('fest.market.flower')], ['grain', t('fest.market.grain')], ['artisan', t('fest.market.artisan')], ['animal', t('fest.market.animal')], ['fish', t('fest.market.fish')], ['forage', t('common.foraging')]]
const catOf = (id: string) => CATS.find(([tag]) => ITEMS[id]?.tags?.includes(tag))?.[1] ?? ''
const shown = ref<number[]>([])
const judged = ref(false)
const { s, f, start, close } = useFest('market', () => [score.value, t('fest.market.stallScoredEverythingBeen', score.value, medal.value)])
const candidates = computed(() => s.inv.map((sl, i) => [sl, i] as const).filter(([sl]) => sl && catOf(sl.id)))
const items = computed(() => shown.value.map((i) => s.inv[i]!).filter(Boolean))
const score = computed(() => {
  const list = items.value
  const kinds = new Set(list.map((sl) => catOf(sl.id))).size
  const quality = list.reduce((a, sl) => a + sl.q, 0)
  const fresh = list.filter((sl) => CROPS[sl.id]?.seasons.includes(season(s.day))).length
  const value = Math.min(15, Math.floor(list.reduce((a, sl) => a + (ITEMS[sl.id]?.sell ?? 0), 0) / 40))
  return kinds * 8 + quality * 4 + fresh * 3 + value
})
const medal = computed(() => (score.value >= 70 ? t('fest.market.gold') : score.value >= 45 ? t('fest.market.silver') : t('fest.market.bronze')))
function toggle(i: number) {
  if (judged.value) return
  const k = shown.value.indexOf(i)
  if (k >= 0) shown.value.splice(k, 1)
  else if (shown.value.length < 6) shown.value.push(i)
  sfx('ui_select', 0.4)
}
function judge() {
  if (!shown.value.length) return
  start()
  judged.value = true
  sfx('score_up', 0.6)
}
const comments = computed(() => {
  const kinds = new Set(items.value.map((sl) => catOf(sl.id))).size
  return [
    kinds >= 4 ? t('fest.market.linTangStallFour') : t('fest.market.linTangNotLot'),
    items.value.some((sl) => sl.q >= 2) ? t('fest.market.wenHengQualityLike') : t('fest.market.wenHengTookPhoto'),
    items.value.some((sl) => ITEMS[sl.id]?.tags?.includes('animal')) ? t('fest.market.zhouQinBroughtAnimal') : t('fest.market.zhouQinBringOwn'),
  ]
})
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.market.linTangHelpsSet') }}</p>
    <template v-if="!judged">
      <h3>{{ t('fest.market.backpack6', shown.length) }}</h3>
      <div class="grid">
        <button v-for="[sl, i] in candidates" :key="i" class="pick" :class="{ on: shown.includes(i) }" @click="toggle(i)">
          <ItemSlot :sl="sl" /><small>{{ catOf(sl!.id) }}</small>
        </button>
      </div>
      <p v-if="!candidates.length" class="tip">{{ t('fest.market.backpackNoProduceArtisan') }}</p>
      <p class="tip">{{ t('fest.market.estimatePts', score) }}</p>
      <div class="actions">
        <button class="primary" :disabled="!shown.length" @click="judge">{{ t('fest.market.callJudges') }}</button>
        <button @click="close">{{ t('common.lookAround') }}</button>
      </div>
    </template>
    <template v-else>
      <h3>{{ t('fest.market.pts', medal, score) }}</h3>
      <div class="grid"><ItemSlot v-for="(sl, i) in items" :key="i" :sl="sl" /></div>
      <p v-for="c in comments" :key="c" class="line">{{ c }}</p>
      <div class="actions"><button class="primary" autofocus @click="close">{{ t('fest.market.packTakeItemsBack') }}</button></div>
    </template>
  </Panel>
</template>

<style scoped>
.grid { display: flex; flex-wrap: wrap; gap: 6px; }
.pick { display: flex; flex-direction: column; align-items: center; padding: 4px; border-radius: 8px; border: 2px solid transparent; background: rgba(255, 255, 255, 0.05); }
.pick.on { border-color: #f3c76a; }
.line { margin: 4px 0; }
</style>
