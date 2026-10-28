<script setup lang="ts">
import { itemName, price, shipPut, shipTake, shipValue } from '../core/actions.ts'
import { game, ui } from '../game.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Panel from './Panel.vue'

const g = game!
const s = g.s
</script>

<template>
  <Panel :title="t('common.shippingBin')" wide>
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('ship.clickBackpackItemsPut') }}</p>
      <div class="two">
        <div>
          <h3>{{ t('common.backpack') }}</h3>
          <div class="grid">
            <button v-for="(sl, i) in s.inv" :key="i" type="button" class="cell" @click="sl && g.run(() => shipPut(s, i))"><ItemSlot :sl="sl" /></button>
          </div>
        </div>
        <div>
          <h3>{{ t('ship.shippedTodayEstG', shipValue(s)) }}</h3>
          <div class="rows">
            <button v-for="(sl, i) in s.ship" :key="sl.id + sl.q" type="button" class="row clickable" @click="g.run(() => shipTake(s, i))">
              <ItemSlot :sl="sl" />
              <div class="grow">{{ itemName(sl) }} ×{{ sl.n }}</div>
              <span class="price">+{{ price(sl) * sl.n }}</span>
            </button>
            <p v-if="!s.ship.length" class="tip">{{ t('ship.nothingBinYet') }}</p>
          </div>
        </div>
      </div>
    </div>
  </Panel>
</template>
