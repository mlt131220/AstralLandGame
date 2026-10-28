<script setup lang="ts">
// 节庆小游戏入口：按当天的节庆选面板（花种会沿用 Festival.vue）
import { computed } from 'vue'
import { festivalNow } from '../../core/town.ts'
import { game } from '../../game.ts'
import Ceremony from './Ceremony.vue'
import Derby from './Derby.vue'
import Firefly from './Firefly.vue'
import Hearth from './Hearth.vue'
import Market from './Market.vue'
import Picnic from './Picnic.vue'
import Snow from './Snow.vue'
import Sorting from './Sorting.vue'

const id = computed(() => festivalNow(game!.s)?.id ?? '')
const cer = computed(() => !!festivalNow(game!.s)?.cer)
const VIEWS = { fishing_derby: Derby, picnic: Picnic, firefly: Firefly, market: Market, harvest_coop: Sorting, snow_craft: Snow, hearth_night: Hearth } as const
</script>

<template>
  <Ceremony v-if="cer" :id="id" />
  <component :is="VIEWS[id as keyof typeof VIEWS]" v-else-if="id in VIEWS" />
</template>
