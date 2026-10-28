<script setup lang="ts">
import { isBossFloor, ITEMS, MINE_THEMES, mineTheme } from '../content/content.ts'
import { claimParcel, liftStops } from '../core/travel.ts'
import { game, ui } from '../game.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Panel from './Panel.vue'

const g = game!
const s = g.s
</script>

<template>
  <Panel :title="t('common.mineEntrance')">
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('mine.floors110Mossy', s.deepest) }}</p>
      <div class="rows">
        <div v-for="f in liftStops(s)" :key="f" class="row">
          <div class="grow"><b>{{ f === 1 ? t('mine.ladderDownFloor1') : t('mine.elevatorFloor', f) }}</b> <small>{{ t('mine.parenPair', MINE_THEMES[mineTheme(f)].name, f === 1 ? '' : isBossFloor(f) ? t('mine.bossCleared') : t('mine.restStop')) }}</small></div>
          <button :class="{ primary: f === 1 }" @click="g.goMine(f)">{{ f === 1 ? t('mine.goDown') : t('mine.go') }}</button>
        </div>
      </div>
      <template v-if="s.parcel.length">
        <h3>{{ t('mine.lostFound') }}</h3>
        <p class="tip">{{ t('mine.enemyDropsCouldntCarry') }}</p>
        <div class="grid">
          <div v-for="(sl, i) in s.parcel" :key="i" :title="ITEMS[sl.id]?.name"><ItemSlot :sl="sl" /></div>
        </div>
        <div class="actions"><button class="primary" @click="g.run(() => claimParcel(s))">{{ t('mine.claim') }}</button></div>
      </template>
    </div>
  </Panel>
</template>
