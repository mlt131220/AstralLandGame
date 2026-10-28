<script setup lang="ts">
// 花费的统一显示：第一行金币，第二行材料（每项整体换行、不从中间断开），第三行所需时间；不够的标红
import { computed } from 'vue'
import { specName } from '../core/actions.ts'
import { countSpec } from '../core/state.ts'
import { game, ui } from '../game.ts'
import { lang, t } from '../core/i18n.ts'
const X = lang() === 'en' ? ' ×' : '×' // 英文名后空一格再写数量（Wood ×100）

const props = defineProps<{ money?: number; items?: Record<string, number>; time?: string }>()
const s = game!.s
const list = computed(() => Object.entries(props.items ?? {}))
</script>

<template>
  <div class="cost" :data-rev="ui.rev">
    <div v-if="money !== undefined" class="cline">
      <span class="price">{{ t('common.gold', money) }}</span><small :class="{ lack: s.money < money }">{{ t('common.have', s.money) }}</small>
    </div>
    <div v-if="list.length" class="cline">
      <span v-for="[spec, n] in list" :key="spec" class="citem" :class="{ lack: countSpec(s.inv, spec) < n }">{{ specName(spec) }}{{ X }}{{ n }}<small>{{ t('common.have', countSpec(s.inv, spec)) }}</small></span>
    </div>
    <div v-if="time" class="cline ctime">{{ time }}</div>
  </div>
</template>

<style scoped>
.cost { font-size: 0.9em; line-height: 1.55; margin-top: 2px; }
.citem { display: inline-block; white-space: nowrap; margin-right: 0.9em; }
.ctime { opacity: 0.85; }
</style>
