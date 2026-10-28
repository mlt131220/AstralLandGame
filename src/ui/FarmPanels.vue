<script setup lang="ts">
import { computed } from 'vue'
import { FRUIT_TREES, ITEMS, MACHINES, PROJECTS, SEASON_NAMES, type ProjectId } from '../content/content.ts'
import { cutFruitTree, fail, ok, type R } from '../core/actions.ts'
import { putHay, siloCap, takeHay } from '../core/buildings.ts'
import { findEnt, fireLit, fuelFire, pickFruit, restAtFire, treeMature } from '../core/placeables.ts'
import { absMin, countSpec, type Ent } from '../core/state.ts'
import { fundProject, projectInfo } from '../core/town.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import ItemSlot from './ItemSlot.vue'
import Cost from './Cost.vue'
import Panel from './Panel.vue'
import { bookCeremony, bookedDay } from '../core/town.ts'
import { dateName } from '../core/state.ts'
import { t } from '../core/i18n.ts'

const g = game!
const s = g.s
const act = (fn: () => R, sound = 'ui_confirm') => { if (g.run(fn).ok) sfx(sound, 0.6); g.changed() }
const ent = computed(() => { void ui.rev; return findEnt(s, ui.machine) })
const shop = computed(() => { void ui.rev; return s.farmB.find((b) => b.id === ui.home) })
const proj = computed(() => { void ui.rev; return ui.project ? projectInfo(s, ui.project as ProjectId) : null })
let cutArmed = false
function cut() {
  if (!cutArmed) { cutArmed = true; g.toast(t('farm.felledFruitTreeGone')); return }
  cutArmed = false
  act(() => cutFruitTree(s, ent.value!), 'chop')
  ui.panel = ''
}
// 作坊：室内放置机器（不加快速度），从背包装入、拆回
const machineItems = computed(() => { void ui.rev; return [...new Set(s.inv.filter((sl) => sl && MACHINES[sl.id]).map((sl) => sl!.id))] })
function install(id: string): R {
  const b = shop.value!
  if ((b.mach?.length ?? 0) >= 6) return fail(t('farm.workshopHolds6Machines'))
  const i = s.inv.findIndex((sl) => sl?.id === id)
  if (i < 0) return fail()
  if (!--s.inv[i]!.n) s.inv[i] = null
  ;(b.mach ??= []).push({ id: s.nextId++, k: id, x: b.x, z: b.z, job: null })
  return ok(t('farm.movedWorkshop', ITEMS[id].name))
}
function uninstall(e: Ent): R {
  const b = shop.value!
  if (e.job) return fail(t('farm.theresStillSomethingMachine'))
  const slot = s.inv.findIndex((sl) => !sl)
  if (slot < 0) return fail(t('common.backpackFull'))
  s.inv[slot] = { id: e.k, q: 0, n: 1 }
  b.mach = b.mach!.filter((x) => x !== e)
  return ok(t('farm.moved', ITEMS[e.k].name))
}
const fund = () => act(() => fundProject(s, ui.project as ProjectId), 'build')
const treeSeasons = (e: Ent) => FRUIT_TREES[e.tree!].seasons.map((x) => SEASON_NAMES[x]).join(t('punct.listSep'))
const left = (e: Ent) => (e.job ? Math.max(0, e.job.doneAt - absMin(s)) : 0)
</script>

<template>
  <!-- 筒仓 -->
  <Panel v-if="ui.panel === 'silo'" :title="t('common.silo')">
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('farm.eachSiloHolds240') }}</p>
      <p><b>{{ t('farm.hay', s.silo, siloCap(s)) }}</b> · {{ t('farm.backpack', countSpec(s.inv, 'hay')) }}</p>
      <div class="actions">
        <button class="primary" @click="act(() => putHay(s))">{{ t('farm.storeHay') }}</button>
        <button @click="act(() => takeHay(s, 10))">{{ t('farm.take10') }}</button>
      </div>
    </div>
  </Panel>

  <!-- 营火 -->
  <Panel v-else-if="ui.panel === 'fire' && ent" :title="t('common.campfire')">
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('farm.n1WoodBurns120') }}</p>
      <p>{{ fireLit(s, ent) ? t('farm.burningMinLeft', Math.ceil(((ent.lit ?? 0) - absMin(s)))) : t('farm.burned') }}</p>
      <div class="actions">
        <button @click="act(() => fuelFire(s, ent!), 'campfire')">{{ t('farm.addWood1') }}</button>
        <button class="primary" :disabled="!fireLit(s, ent)" @click="act(() => restAtFire(s))">{{ t('farm.rest20Min') }}</button>
      </div>
    </div>
  </Panel>

  <!-- 果树 -->
  <Panel v-else-if="ui.panel === 'tree' && ent" :title="treeMature(ent) ? t('farm.tree', FRUIT_TREES[ent.tree!].name) : t('common.sapling', FRUIT_TREES[ent.tree!].name)">
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('farm.matureTreesBear1', treeSeasons(ent)) }}</p>
      <p v-if="!treeMature(ent)">{{ t('farm.growthDaysStopsIf', ent.grown ?? 0, FRUIT_TREES[ent.tree!].grow) }}</p>
      <p v-else>{{ t('farm.tree2', ent.fruit ?? 0, ITEMS[FRUIT_TREES[ent.tree!].fruit].name) }}</p>
      <div class="actions">
        <button class="primary" :disabled="!ent.fruit" @click="act(() => pickFruit(s, ent!), 'harvest')">{{ t('farm.pick') }}</button>
        <button v-if="treeMature(ent)" class="danger" @click="cut">{{ t('farm.cutDown') }}</button>
      </div>
    </div>
  </Panel>

  <!-- 公共工程 -->
  <Panel v-else-if="ui.panel === 'project' && proj" :title="t('common.publicProject', proj.name)">
    <div :data-rev="ui.rev">
      <p v-if="proj.done" class="tip">{{ t('farm.completed') }}</p>
      <div v-if="ui.project === 'windmill' && proj.done && s.quests.Q22?.st === 'active' && !s.flags.includes('event:windmill_ceremony')" class="actions">
        <span class="tip">{{ bookedDay(s, 'windmill_ceremony') >= s.day ? t('farm.ceremonySet1000', dateName(bookedDay(s, 'windmill_ceremony'))) : t('farm.windmillPlacePickSafe') }}</span>
        <button v-if="bookedDay(s, 'windmill_ceremony') < s.day" class="primary" @click="g.run(() => bookCeremony(s, 'windmill_ceremony')); g.changed()">{{ t('farm.bookCeremony') }}</button>
      </div>
      <p v-else-if="proj.started" class="tip">{{ t('farm.crewWorkReadyMorning') }}</p>
      <template v-else>
        <p class="tip">{{ proj.open ? t('farm.payGoldMaterialsFront') : t('farm.notOpenYetAccept') }}</p>
        <div class="rows">
          <div class="row">
            <div class="grow">
              <Cost :money="proj.money" :items="proj.cost" :time="t('common.done', proj.days)" />
            </div>
            <button class="primary" :disabled="!proj.open" @click="fund">{{ t('common.fund') }}</button>
          </div>
        </div>
      </template>
      <p class="tip">{{ PROJECTS[ui.project as ProjectId].name }}{{ t('punct.colon') }}{{ { sluice: t('farm.restoresRiversideWaterOpens'), bridge: t('farm.leadsDeepWoodsWetland'), station: t('farm.opensRoadWindmillHeights'), greenhouse: t('farm.n48TilesSeasonFarmland'), windmill: t('farm.valleysLastProjectGet') }[ui.project] }}</p>
    </div>
  </Panel>

  <!-- 私人作坊 -->
  <Panel v-else-if="ui.panel === 'workshop' && shop" :title="t('common.workshop')">
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('farm.holds6MachinesNo') }}</p>
      <div class="rows">
        <div v-for="e in shop.mach ?? []" :key="e.id" class="row">
          <ItemSlot :sl="{ id: e.k, q: 0, n: 1 }" />
          <div class="grow"><b>{{ ITEMS[e.k].name }}</b> <small>{{ !e.job ? t('farm.idle') : left(e) ? t('farm.workingHLeft', Math.floor(left(e) / 60), left(e) % 60) : t('common.completed') }}</small></div>
          <button class="primary" @click="ui.machine = e.id; ui.panel = 'machine'">{{ t('common.use') }}</button>
          <button @click="act(() => uninstall(e))">{{ t('farm.move') }}</button>
        </div>
        <p v-if="!shop.mach?.length" class="tip">{{ t('farm.noMachinesYet') }}</p>
      </div>
      <h3>{{ t('farm.moveBackpack') }}</h3>
      <div class="rows">
        <div v-for="id in machineItems" :key="id" class="row">
          <ItemSlot :sl="{ id, q: 0, n: 1 }" /><div class="grow">{{ ITEMS[id].name }}</div>
          <button @click="act(() => install(id))">{{ t('farm.move2') }}</button>
        </div>
        <p v-if="!machineItems.length" class="tip">{{ t('farm.noMachinesBackpackMove') }}</p>
      </div>
    </div>
  </Panel>
</template>
