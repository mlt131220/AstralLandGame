<script setup lang="ts">
import { ITEMS } from '../content/content.ts'
import { claimSoup, recipeLocked } from '../core/actions.ts'
import { KITCHEN_RECIPES, kitchenOpen } from '../core/town.ts'
import { game, ui } from '../game.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Cost from './Cost.vue'
import Panel from './Panel.vue'

const g = game!
const s = g.s
// 未学会时的提示（设计 12.4 解锁来源）
const HOW: Record<string, string> = {
  soup_clear: t('kitchen.learnedAfterFinishingHot'), roast_radish: t('kitchen.xiaHeTeachOnce'), soup_mushroom: t('kitchen.learnedForagingLv2'),
  fish_roast: t('kitchen.shenZhouTeachesAfter'), egg_fried: t('kitchen.learnedRanchingLv1'),
}
// 单份 3 秒的烹饪动作在场景里进行（世界时钟继续），做完会提示
function make(i: number) {
  g.startCook(i)
}
</script>

<template>
  <Panel :title="ui.homeKitchen ? t('common.homeKitchen') : t('kitchen.dinerXiaHe')">
    <div :data-rev="ui.rev">
      <p class="tip">{{ ui.homeKitchen ? t('kitchen.ownStoveCookTime') : t('kitchen.stovesEveryoneBringOwn') }}{{ kitchenOpen(s, ui.homeKitchen) ? '' : t('kitchen.dinerOpen1000') }}</p>
      <div v-if="!ui.homeKitchen" class="rows">
        <div class="row">
          <ItemSlot :sl="{ id: 'soup_relief', q: 0, n: 1 }" />
          <div class="grow"><b>{{ t('kitchen.clearBrothRelief') }}</b><br /><small>{{ t('kitchen.bowlDayFirst14') }}</small></div>
          <button class="primary" :disabled="!kitchenOpen(s)" @click="g.run(() => claimSoup(s))">{{ t('common.claim') }}</button>
        </div>
      </div>
      <h3>{{ ui.homeKitchen ? t('kitchen.stove') : t('kitchen.publicStove') }}</h3>
      <div class="rows">
        <p class="tip">{{ t('kitchen.eachDishTakes3') }}</p>
        <div v-for="[r, i] in KITCHEN_RECIPES" :key="r.out" class="row" :class="{ locked: recipeLocked(s, i) }">
          <ItemSlot :sl="{ id: r.out, q: 0, n: r.n }" />
          <div class="grow">
            <b>{{ ITEMS[r.out].name }}</b> <small>{{ r.note }}</small><br />
            <small v-if="recipeLocked(s, i)" class="tip">{{ HOW[r.out] ?? recipeLocked(s, i) }}</small>
            <Cost v-else :items="r.cost" />
          </div>
          <button :disabled="!!recipeLocked(s, i) || !kitchenOpen(s, ui.homeKitchen)" @click="make(i)">{{ t('kitchen.cook') }}</button>
        </div>
      </div>
    </div>
  </Panel>
</template>
