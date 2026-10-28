<script setup lang="ts">
// Q22 风车启动仪式、Q23 谷地长桌宴：一段大家都在场的过场，看完即办成（中途关掉可以回来接着看）
import { computed, ref } from 'vue'
import { CEREMONIES, ITEMS } from '../../content/content.ts'
import { holdCeremony } from '../../core/town.ts'
import { t } from '../../core/i18n.ts'
import { game, ui } from '../../game.ts'
import { sfx } from '../../platform/audio.ts'
import Panel from '../Panel.vue'

const props = defineProps<{ id: string }>()
const g = game!
const s = g.s
const dishes = computed(() => (s.stash?.Q23 ?? []).map((sl) => ITEMS[sl.id]?.name).filter(Boolean).join(t('punct.listSep')))
const LINES: Record<string, string[]> = {
  windmill_ceremony: [
    t('fest.ceremony.uncleClearsHisThroat'),
    t('fest.ceremony.heYanPatsNew'),
    t('fest.ceremony.ahManDuanXing'),
    t('fest.ceremony.uncleHandsScissorsCut'),
    t('fest.ceremony.ribbonFallsWindPours'),
    t('fest.ceremony.lowRumbleTurningMillstones'),
  ],
  long_table_feast: [
    t('fest.ceremony.wholeRowLongTables'),
    t('fest.ceremony.xiaHeBringsDishes'), // {dishes} 由下方 replace 代入，英文里保留原样
    t('fest.ceremony.everyoneStandsSayFew'),
    t('fest.ceremony.shenZhouTalksAbout'),
    t('fest.ceremony.songNingLinRead'),
    t('fest.ceremony.lampsComeNobodyHurry'),
  ],
}
const step = ref(0)
const lines = computed(() => LINES[props.id].map((l) => l.replace('{dishes}', dishes.value || t('fest.ceremony.fewHomeStyleDishes'))))
function next() {
  if (step.value < lines.value.length - 1) { step.value++; sfx('ui_select', 0.3); return }
  if (g.run(() => holdCeremony(s, props.id)).ok) sfx('cheer', 0.6)
  ui.panel = ''
  g.changed()
}
</script>

<template>
  <Panel :title="CEREMONIES[id].name" wide>
    <p v-for="(l, i) in lines.slice(0, step + 1)" :key="i" class="line" :class="{ now: i === step }">{{ l }}</p>
    <div class="actions"><button class="primary" autofocus @click="next">{{ step < lines.length - 1 ? t('common.continue') : t('fest.ceremony.done') }}</button></div>
  </Panel>
</template>

<style scoped>
.line { margin: 6px 0; opacity: 0.7; }
.line.now { opacity: 1; }
</style>
