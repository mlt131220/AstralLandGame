<script setup lang="ts">
// F04 萤灯夜：沿河岸找到三处灯影标记后，回到河灯架选一盏灯放进河里。不需要夜钓或靠近深水。
import { ref } from 'vue'
import { t } from '../../core/i18n.ts'
import { sfx } from '../../platform/audio.ts'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const LANTERNS = [['#f3c76a', t('fest.firefly.warmGold')], ['#f08a6a', t('fest.firefly.tangerine')], ['#9ad8ff', t('fest.firefly.moonWhite')], ['#b8e08a', t('fest.firefly.fireflyGreen')]]
const pick = ref(0)
const sent = ref(false)
const { f, start, close } = useFest('firefly', () => [3, t('fest.firefly.lanternDriftedSlowlyDownstream', LANTERNS[pick.value][1].toLowerCase())])
function release() {
  start()
  sent.value = true
  sfx('lantern', 0.6)
}
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`">
    <p class="tip">{{ t('fest.firefly.baiLuHandsStack') }}</p>
    <div class="lanterns">
      <button v-for="(l, i) in LANTERNS" :key="i" class="lan" :class="{ on: pick === i }" :disabled="sent" @click="pick = i"><i :style="{ background: l[0], boxShadow: `0 0 14px ${l[0]}` }" /><small>{{ l[1] }}</small></button>
    </div>
    <div class="actions">
      <template v-if="!sent"><button class="primary" @click="release">{{ t('fest.firefly.floatLantern') }}</button><button @click="close">{{ t('fest.firefly.notYet') }}</button></template>
      <template v-else><span class="tip">{{ t('fest.firefly.stringLightsDriftsSlowly') }}</span><button class="primary" autofocus @click="close">{{ t('fest.firefly.stayEnd') }}</button></template>
    </div>
  </Panel>
</template>

<style scoped>
.lanterns { display: flex; gap: 12px; justify-content: center; margin: 12px 0; }
.lan { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 10px; }
.lan i { width: 30px; height: 36px; border-radius: 40% 40% 30% 30%; }
.on { outline: 2px solid #f3c76a; }
</style>
