<script setup lang="ts">
import { computed, ref } from 'vue'
import { CROPS, GEAR_TIERS, ITEMS, SEASON_NAMES, TOOL_TIER, TOOLS, type ToolId } from '../content/content.ts'
import { itemName, nextBagUpgrade, plantForecast, price, sell, upgradeBag } from '../core/actions.ts'
import { unlocked } from '../core/quests.ts'
import { count, dateName } from '../core/state.ts'
import { buy, forge, forgeable, forgeCost, shopStock, smithCollect, smithJobDone, smithSmelt, startUpgrade, upgradeInfo } from '../core/town.ts'
import { ANIMALS, BUILDINGS, HOUSE_UPGRADES, type AnimalKind } from '../content/content.ts'
import { buyAnimal, homeFor } from '../core/animals.ts'
import { claimCore, CORE_TRADE, orderCore } from '../core/town.ts'
import { upgradeHouse } from '../core/buildings.ts'
import { game, ui } from '../game.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Panel from './Panel.vue'
import Cost from './Cost.vue'

const g = game!
const s = g.s
const picked = ref<number | null>(null)
const shop = computed(() => ui.shop)
const TITLE: Record<string, string> = { general: t('shop.generalStoreLinTang'), smith: t('shop.blacksmithOldTao'), tackle: t('shop.tackleCounterShenZhou'), carpenter: t('shop.carpentryShopHeYan'), ranch: t('shop.ranchZhouQin'), clinic: t('shop.clinicYeLan'), station: t('shop.waystationCounterAhMan') }
const GREET: Record<string, string> = {
  general: t('shop.newFarmerLocalSeeds'),
  smith: t('shop.materialsSeePricesTools'),
  tackle: t('shop.noteShenZhouCabinet'),
  carpenter: t('shop.buildingsSitedFarmGo'),
  ranch: t('shop.checkTheresFreeSpot'),
  clinic: t('shop.herbalSalveWorksEven'),
  station: t('shop.roadsOpenGoodsOutside'),
}
const TOOL_IDS = (Object.keys(TOOLS) as ToolId[]).filter((id) => id !== 'rod')
const GEAR = GEAR_TIERS.flatMap((gt) => ['sword', 'spear', 'bow', 'armor'].map((k) => `${k}_${gt.tier}`))

function seedInfo(id: string) {
  const c = CROPS[ITEMS[id].crop ?? '']
  if (!c) return ITEMS[id].desc ?? ''
  const md = plantForecast(c.id, s.day)
  const seasons = c.seasons.map((x) => SEASON_NAMES[x]).join('/')
  return t('shop.growSellsG', seasons, c.growthDays, c.regrowDays ? t('shop.regrowsEvery', c.regrowDays) : '', c.baseSell) +
    (md ? t('shop.plantTodayKeepWatered', dateName(md)) : t('shop.plantedTodayWontRipen'))
}
function doSell(n: number) {
  if (picked.value === null) return
  g.run(() => sell(s, picked.value!, n))
  if (!s.inv[picked.value]) picked.value = null
}
</script>

<template>
  <Panel :title="TITLE[shop]" wide>
    <div :data-rev="ui.rev">
      <p class="tip">{{ GREET[shop] }}{{ t('shop.gold') }} <b>{{ s.money }}</b></p>
      <h3>{{ t('shop.buy') }}</h3>
      <div class="rows">
        <div v-for="id in shopStock(s, shop)" :key="id" class="row">
          <ItemSlot :sl="{ id, q: 0, n: 1 }" />
          <div class="grow"><b>{{ ITEMS[id].name }}</b> <span class="price">{{ t('common.gold', ITEMS[id].buy) }}</span><br /><small>{{ seedInfo(id) }}</small></div>
          <button v-for="n in [1, 5, 10]" :key="n" :disabled="s.money < ITEMS[id].buy! * n" @click="g.run(() => buy(s, id, n, shop))">×{{ n }}</button>
        </div>
        <p v-if="!shopStock(s, shop).length" class="tip">{{ shop === 'smith' ? t('shop.oldTaoTakeSafety') : t('shop.nothingStockRightNow') }}</p>
        <div v-if="shop === 'general' && nextBagUpgrade(s)" class="row">
          <div class="grow"><b>{{ t('shop.backpackUpgradeSlots', nextBagUpgrade(s)!.size) }}</b> <span class="price">{{ t('common.gold', nextBagUpgrade(s)!.price) }}</span></div>
          <button :disabled="s.money < nextBagUpgrade(s)!.price" @click="g.run(() => upgradeBag(s))">{{ t('shop.buy') }}</button>
        </div>
      </div>

      <template v-if="shop === 'smith' && unlocked(s, 'system:mine')">
        <h3>{{ t('shop.smeltingService') }}</h3>
        <div class="rows">
          <div class="row">
            <div class="grow">
              <b>{{ t('shop.copperOre5Coal') }}</b>
              <Cost :items="{ copper_ore: 5, coal: 1 }" :time="t('shop.n3HPickLocker')" />
              <small v-if="s.smithJob" class="tip">{{ smithJobDone(s) ? t('shop.copperBarReady') : t('shop.smeltingTeachingFurnace') }}</small>
            </div>
            <button v-if="s.smithJob" class="primary" :disabled="!smithJobDone(s)" @click="g.run(() => smithCollect(s))">{{ t('shop.collect') }}</button>
            <button v-else :disabled="count(s.inv, 'copper_ore') < 5 || count(s.inv, 'coal') < 1" @click="g.run(() => smithSmelt(s))">{{ t('shop.giveOldTao') }}</button>
          </div>
        </div>
      </template>

      <template v-if="shop === 'smith'">
        <h3>{{ t('shop.toolUpgrades') }} <small class="tip">{{ t('shop.ready0600Next') }}</small></h3>
        <p v-if="!unlocked(s, 'system:tool_upgrade')" class="tip">{{ t('shop.afterCopperFireTake') }}</p>
        <template v-else>
          <p v-if="s.upgrade" class="tip">{{ t('shop.forgingReady0600', t('fmt.pair', TOOL_TIER[s.upgrade.tier], TOOLS[s.upgrade.tool].name), s.upgrade.ready === s.day + 1 ? t('shop.tomorrow') : dateName(s.upgrade.ready)) }}</p>
          <div class="rows">
            <div v-for="tool in TOOL_IDS" :key="tool" class="row">
              <ItemSlot :tool="tool" :tier="s.tools[tool]" />
              <div class="grow">
                <b>{{ t('fmt.pair', TOOL_TIER[s.tools[tool]], TOOLS[tool].name) }}</b>
                <template v-if="upgradeInfo(s, tool)">
                  → {{ t('fmt.pair', TOOL_TIER[upgradeInfo(s, tool)!.tier], TOOLS[tool].name) }}
                  <small class="tip">{{ tool === 'hoe' || tool === 'can' ? t('shop.unlocksChargingHoldWork') : tool === 'axe' ? t('shop.clearStumps') : tool === 'pick' ? t('shop.breaksRocksFaster') : t('shop.cutsGrassLessEffort') }}</small>
                  <Cost :money="upgradeInfo(s, tool)!.money" :items="upgradeInfo(s, tool)!.open ? { [upgradeInfo(s, tool)!.bar]: upgradeInfo(s, tool)!.n } : undefined" :time="t('shop.ready0600Next2')" />
                  <small v-if="!upgradeInfo(s, tool)!.open" class="lack">{{ t('shop.needsBarNotAvailable', TOOL_TIER[upgradeInfo(s, tool)!.tier], upgradeInfo(s, tool)!.n) }}</small>
                </template>
                <small v-else> · {{ t('shop.maxLevel') }}</small>
              </div>
              <button v-if="upgradeInfo(s, tool)" class="primary" :disabled="!!s.upgrade || !upgradeInfo(s, tool)!.open" @click="g.run(() => startUpgrade(s, tool))">{{ t('common.upgrade') }}</button>
            </div>
          </div>
        </template>
      </template>

      <!-- 驿站：替代核心委托（15.5 非战斗路线） -->
      <template v-if="shop === 'station' && unlocked(s, 'system:core_trade')">
        <h3>{{ t('shop.substituteCoreOrder') }} <small class="tip">{{ t('shop.worksWindmillProjectLike') }}</small></h3>
        <div class="rows">
          <div class="row">
            <ItemSlot :sl="{ id: 'core_trade', q: 0, n: 1 }" />
            <div class="grow"><b>{{ t('common.substituteCore') }}</b>
              <Cost :money="CORE_TRADE.money" :items="CORE_TRADE.cost" :time="t('shop.arrivesNextDay')" /></div>
            <button v-if="!s.coreOrder" @click="g.run(() => orderCore(s))">{{ t('common.order') }}</button>
            <button v-else class="primary" :disabled="s.coreOrder > s.day" @click="g.run(() => claimCore(s))">{{ s.coreOrder > s.day ? t('shop.arrivesTomorrow') : t('common.claim') }}</button>
          </div>
        </div>
      </template>
      <!-- 牧场：动物（10.1） -->
      <template v-if="shop === 'ranch'">
        <h3>{{ t('common.animals') }}</h3>
        <div class="rows">
          <div v-for="(d, k) in ANIMALS" :key="k" class="row">
            <div class="grow"><b>{{ d.name }}</b> <span class="price">{{ t('common.gold', d.price) }}</span><br />
              <small>{{ t('shop.lives', d.home === 'coop' ? t('common.coop') : t('common.barn'), d.big ? t('shop.upgradeNeeded') : '') }} · {{ t('shop.grows', d.mature) }} · {{ d.every === 1 ? t('shop.givesDaily', ITEMS[d.product].name, d.care ? (d.care === 'milk' ? t('shop.useMilkPail') : t('shop.useShears')) : '') : t('shop.givesEveryDays', d.every, ITEMS[d.product].name, d.care ? (d.care === 'milk' ? t('shop.useMilkPail') : t('shop.useShears')) : '') }} · {{ homeFor(s, k as AnimalKind) ? t('shop.freeSpotAvailable') : t('shop.noSuitableFreeSpot') }}</small></div>
            <button :disabled="s.money < d.price || !homeFor(s, k as AnimalKind)" @click="g.run(() => buyAnimal(s, k as AnimalKind))">{{ t('shop.buy') }}</button>
          </div>
        </div>
      </template>
      <!-- 木工坊：建筑目录与家宅扩建（17.1） -->
      <template v-if="shop === 'carpenter'">
        <h3>{{ t('shop.farmhouseUpgrade') }}</h3>
        <div class="rows">
          <div v-if="HOUSE_UPGRADES[s.house.lv + 1]" class="row">
            <div class="grow"><b>{{ t('shop.farmhouseLv', s.house.lv + 1) }}</b> <small>{{ s.house.lv === 0 ? t('shop.addsHomeKitchenCook') : t('shop.addsSharedLivingSpace') }}</small>
              <Cost :money="HOUSE_UPGRADES[s.house.lv + 1]!.money" :items="HOUSE_UPGRADES[s.house.lv + 1]!.cost" :time="t('common.done', HOUSE_UPGRADES[s.house.lv + 1]!.days)" /></div>
            <button :disabled="!!s.house.up" @click="g.run(() => upgradeHouse(s))">{{ s.house.up ? t('shop.upgrading') : t('shop.upgrade') }}</button>
          </div>
          <p v-else class="tip">{{ t('shop.farmhouseFullyUpgraded') }}</p>
        </div>
        <h3>{{ t('shop.farmBuildings') }} <small class="tip">{{ t('shop.backFarmPressN') }}</small></h3>
        <div class="rows">
          <div v-for="(d, k) in BUILDINGS" :key="k" class="row">
            <div class="grow"><b>{{ d.name }}</b> <small>{{ t('common.size', d.w, d.d) }}{{ d.cap ? t('shop.holds', d.cap) : '' }}{{ d.max ? t('shop.max', d.max) : '' }}</small>
              <Cost :money="d.money" :items="d.cost" :time="t('common.done', d.days)" /></div>
          </div>
        </div>
      </template>

      <template v-if="shop === 'smith' && forgeable(s)">
        <h3>{{ t('shop.forgeGear') }} <small class="tip">{{ t('shop.madeSpotDragWeapons') }}</small></h3>
        <div class="rows gear">
          <div v-for="id in GEAR" :key="id" class="row">
            <ItemSlot :sl="{ id, q: 0, n: 1 }" />
            <div class="grow"><b>{{ ITEMS[id].name }}</b> <small>{{ ITEMS[id].desc }}</small><br />
              <Cost :money="forgeCost(id)!.money" :items="{ [forgeCost(id)!.bar]: forgeCost(id)!.n }" :time="t('shop.madeSpot')" />
            </div>
            <button :disabled="s.money < forgeCost(id)!.money || count(s.inv, forgeCost(id)!.bar) < forgeCost(id)!.n" @click="g.run(() => forge(s, id))">{{ t('shop.forge') }}</button>
          </div>
        </div>
      </template>

      <template v-if="shop === 'general' || shop === 'smith' || shop === 'ranch'">
        <h3>{{ t('shop.sell') }}</h3>
        <div class="grid">
          <button v-for="(sl, i) in s.inv" :key="i" type="button" class="cell" @click="picked = sl ? i : null">
            <ItemSlot :sl="sl" :sel="picked === i" />
          </button>
        </div>
        <div class="detail">
          <template v-if="picked !== null && s.inv[picked]">
            <b>{{ itemName(s.inv[picked]!) }}</b> ×{{ s.inv[picked]!.n }}
            <template v-if="ITEMS[s.inv[picked]!.id].sell">
              · {{ t('shop.gEach', price(s.inv[picked]!)) }}
              <button @click="doSell(1)">{{ t('shop.sell1') }}</button>
              <button class="primary" @click="doSell(999)">{{ t('shop.sellG', price(s.inv[picked]!) * s.inv[picked]!.n) }}</button>
            </template>
            <span v-else> · {{ t('shop.cantSold') }}</span>
          </template>
          <span v-else class="tip">{{ t('shop.pickItemSellShipping') }}</span>
        </div>
      </template>
    </div>
  </Panel>
</template>
