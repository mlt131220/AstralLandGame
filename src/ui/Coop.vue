<script setup lang="ts">
import { computed } from 'vue'
import { ANIMALS, BUILDINGS, ITEMS } from '../content/content.ts'
import type { R } from '../core/actions.ts'
import {
  adult, animalName, borrowChicken, buildCoop, careAnimal, collectNest, FEEDER_CAP, feedAnimal, fillTrough, moveAnimal, needsTool, nestWaiting, petAnimal, sellAnimal, sellPrice, toggleDoor,
} from '../core/animals.ts'
import { bCap, bLevel, bName, homes, upgradeBuilding } from '../core/buildings.ts'
import { unlocked } from '../core/quests.ts'
import { count } from '../core/state.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import { t } from '../core/i18n.ts'
import Panel from './Panel.vue'
import Cost from './Cost.vue'

const g = game!
const s = g.s
const act = (fn: () => R, sound = 'ui_confirm') => { if (g.run(fn).ok) sfx(sound, 0.6) }
const b = computed(() => { void ui.rev; return s.farmB.find((x) => x.id === ui.home) })
const animals = computed(() => { void ui.rev; return s.animals.filter((a) => (b.value ? a.home === b.value.id : a.lent)) })
const up = computed(() => b.value && BUILDINGS[b.value.k].up)
const others = (kind: 'coop' | 'barn') => homes(s, kind).filter((x) => x.id !== b.value?.id)
let sellArmed = 0
function sell(id: number) {
  // 长按确认的简化：两次点击确认出售（10.3）
  if (sellArmed !== id) { sellArmed = id; g.toast(t('coop.clickAgainConfirmSale')); return }
  sellArmed = 0
  act(() => sellAnimal(s, id), 'coins')
}
</script>

<template>
  <Panel :title="b ? bName(s, b) : t('common.coopPlot')">
    <div :data-rev="ui.rev">
      <!-- 还没有禽舍：G2 教学路线 -->
      <template v-if="!b">
        <p class="tip">{{ t('coop.n65PlotWest') }}</p>
        <p v-if="!unlocked(s, 'system:animals')" class="tip">{{ t('coop.firstVisitXiaHe') }}</p>
        <div v-else class="rows">
          <div v-if="!s.farmB.some((x) => x.k === 'coop')" class="row">
            <div class="grow">
              <b>{{ t('coop.buildCoopPlotHolds') }}</b>
              <Cost :money="BUILDINGS.coop.money" :items="BUILDINGS.coop.cost" :time="t('coop.readyNextDay')" />
            </div>
            <button class="primary" @click="act(() => buildCoop(s), 'craft')">{{ t('common.order') }}</button>
          </div>
          <div v-if="!s.animals.length" class="row">
            <div class="grow"><b>{{ t('coop.borrowTrainingHen') }}</b><br /><small>{{ t('coop.xiaHeLendsChicken') }}</small></div>
            <button @click="act(() => borrowChicken(s), 'cluck')">{{ t('coop.borrow') }}</button>
          </div>
        </div>
      </template>

      <template v-else>
        <p class="tip">
          {{ t('coop.eachAnimalNeeds1', up ? t('coop.onceUpgradedAlsoTakes') : '') }}
          {{ t('coop.sunnyDaysOpenDoor') }}
        </p>
        <div class="rows">
          <div class="row">
            <div class="grow"><b>{{ bName(s, b) }}</b> · {{ t('coop.animalsTroughHay', animals.length, bCap(s, b), b.hay, FEEDER_CAP) }} <small>{{ t('coop.hayBackpackSoldRanch', count(s.inv, 'hay')) }}</small></div>
            <button :disabled="!count(s.inv, 'hay') || b.hay >= FEEDER_CAP" @click="act(() => fillTrough(s, b!))">{{ t('coop.addHay') }}</button>
            <button @click="act(() => toggleDoor(s, b!), 'door_open')">{{ b.open ? t('coop.closeDoor') : t('coop.openGraze') }}</button>
          </div>
          <div v-if="nestWaiting(s, b.id)" class="row">
            <div class="grow"><b>{{ t('coop.nestCollect', nestWaiting(s, b.id)) }}</b></div>
            <button class="primary" @click="act(() => collectNest(s, b!.id), 'pickup')">{{ t('coop.collect') }}</button>
          </div>
          <div v-if="up && !b.up" class="row">
            <div class="grow"><b>{{ t('coop.upgrade', up.name) }}</b>{{ b.k === 'coop' ? t('coop.holdsAllowsRabbitsTakes', up.cap) : t('coop.holdsAllowsGoatsTakes', up.cap) }}
              <Cost :money="up.money" :items="up.cost" :time="t('common.done', up.days)" /></div>
            <button @click="act(() => upgradeBuilding(s, b!.id), 'craft')">{{ t('common.upgrade') }}</button>
          </div>
          <p v-else-if="b.up && !bLevel(s, b)" class="tip">{{ t('coop.upgradingUseUsualUntil') }}</p>
        </div>
      </template>

      <template v-if="animals.length">
        <h3>{{ t('common.animals') }}</h3>
        <div class="rows">
          <div v-for="a in animals" :key="a.id" class="row">
            <div class="grow">
              <b>{{ t('coop.quoted', ANIMALS[a.kind].name, animalName(a.name)) }}</b>
              <small> · {{ adult(a) ? t('coop.adult') : t('coop.fedDays', a.fed, ANIMALS[a.kind].mature) }} · {{ t('coop.affection', a.love) }} · {{ a.fedDay === s.day ? t('coop.fedToday') : t('coop.notFedToday') }}
                <template v-if="a.eggs"> · {{ t('coop.ready', a.eggs, ITEMS[ANIMALS[a.kind].product].name) }}{{ needsTool(a) ? (needsTool(a) === 'milk' ? t('coop.useMilkPail') : t('coop.useShears')) : '' }}</template></small>
            </div>
            <button :disabled="a.fedDay === s.day || !count(s.inv, 'hay')" @click="act(() => feedAnimal(s, a.id), ANIMALS[a.kind].sound)">{{ t('coop.feedHay') }}</button>
            <button :disabled="a.pet === s.day" @click="act(() => petAnimal(s, a.id), ANIMALS[a.kind].sound)">{{ a.pet === s.day ? t('coop.petted') : t('coop.pet') }}</button>
            <button v-if="needsTool(a) && a.eggs" @click="act(() => careAnimal(s, a.id), needsTool(a) === 'milk' ? 'milk' : 'shear')">{{ needsTool(a) === 'milk' ? t('coop.milk') : t('coop.shear') }}</button>
            <template v-if="!a.lent && b">
              <button v-for="o in others(ANIMALS[a.kind].home)" :key="o.id" @click="act(() => moveAnimal(s, a.id, o.id))">{{ t('coop.move', bName(s, o)) }}</button>
              <button class="danger" @click="sell(a.id)">{{ t('coop.sellG', sellPrice(a)) }}</button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </Panel>
</template>
