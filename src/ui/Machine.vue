<script setup lang="ts">
import { computed, ref } from 'vue'
import { ITEMS, MACHINES } from '../content/content.ts'
import { batches, itemName, jobBusy, jobDone, machineCancel, machineCollect, machineInsert, machineMinutes, machineRecipes, MAX_BATCHES, recipeChoices, specName } from '../core/actions.ts'
import { absMin, countSpec, type Slot } from '../core/state.ts'
import { findEnt } from '../core/placeables.ts'
import { game, ui } from '../game.ts'
import ItemSlot from './ItemSlot.vue'
import { sfx } from '../platform/audio.ts'
import { lang, t } from '../core/i18n.ts'
const X = lang() === 'en' ? ' ×' : '×' // 英文名后空一格再写数量
import Panel from './Panel.vue'

const g = game!
const s = g.s
const ent = () => findEnt(s, ui.machine)
const recipes = computed(() => { void ui.rev; return ent() ? machineRecipes(s, ent()!.k) : [] })
const hm = (m: number) => t('machine.hMin', Math.floor(m / 60), Math.round(m % 60))
const left = () => hm(ent()!.job!.doneAt - absMin(s))
const time = (min: number) => (min >= 60 ? t('machine.hGameTime', min / 60) : t('machine.min', min))
// 成品预览：同品种成品按所选原料显示
const outId = (out: string, src?: string) => (out.startsWith('*') ? (src ? `${out.slice(1)}_${src}` : '') : out)
const picked = ref<Record<number, string>>({})
const pickOf = (i: number) => {
  const list = recipeChoices(s, recipes.value[i])
  return list.includes(picked.value[i]) ? picked.value[i] : list.sort((a, b) => ITEMS[a].sell - ITEMS[b].sell)[0]
}
const ready = (i: number) => !!pickOf(i) && recipes.value[i].in.slice(1).every(([spec, n]) => countSpec(s.inv, spec) >= n)
const SOUND: Record<string, string> = { mill: 'machine_mill', loom: 'machine_loop', oil_press: 'machine_loop', seed_maker: 'machine_mill', jam_pot: 'bubble_pot', pickle_jar: 'bubble_pot', cheese_press: 'bubble_pot', bake_oven: 'bake', furnace: 'craft' }
function insert(i: number) {
  if (g.run(() => machineInsert(s, ent()!, i, pickOf(i))).ok) sfx(SOUND[ent()!.k] ?? 'craft', 0.6)
  g.changed()
}
function collect() {
  if (g.run(() => machineCollect(s, ent()!)).ok) sfx('pickup', 0.6)
  g.changed()
}
function cancel() {
  g.run(() => machineCancel(s, ent()!))
  g.changed()
}
// 已做好待取的成品、跨夜队列（按成品合并）与队列预扣的原料
const view = computed(() => {
  void ui.rev
  void ui.tick
  const e = ent()
  if (!e) return null
  const fin = !!e.job && !jobBusy(s, e)
  const merge = (list: Slot[]) => list.reduce<Slot[]>((a, o) => { const x = a.find((y) => y.id === o.id && y.q === o.q); if (x) x.n += o.n; else a.push({ ...o }); return a }, [])
  const ready = merge([...(e.done ?? []), ...(fin ? [e.job!.out] : [])])
  const queue = merge((e.queue ?? []).map((b) => b.out))
  const held = merge((e.queue ?? []).flatMap((b) => b.input))
  const qmin = (e.queue ?? []).reduce((a, b) => a + b.min, 0)
  return { ready, queue, held, qn: e.queue?.length ?? 0, qmin, busy: jobBusy(s, e), n: batches(e) }
})
</script>

<template>
  <Panel :title="ent() ? ITEMS[ent()!.k].name : t('machine.machine')" wide>
    <div v-if="ent() && view" :data-rev="ui.rev">
      <div v-if="view.ready.length" class="block">
        <h3>{{ t('machine.ready') }}</h3>
        <div class="row"><ItemSlot v-for="(o, k) in view.ready" :key="k" :sl="o" /><button class="primary" @click="collect">{{ t('machine.collect') }}</button></div>
      </div>
      <div v-if="view.busy" class="block">
        <h3>{{ t('machine.working', MACHINES[ent()!.k]?.verb ?? t('machine.processing')) }}</h3>
        <p>{{ t('machine.left', itemName(ent()!.job!.out), ent()!.job!.out.n, left()) }}</p>
      </div>
      <div v-if="view.qn" class="block">
        <h3>{{ t('machine.overnightQueueDoneAbout', view.qn, hm(view.qmin + (view.busy ? ent()!.job!.doneAt - absMin(s) : 0))) }}</h3>
        <div class="row"><span class="tip">{{ t('machine.queuedProducts') }}</span><ItemSlot v-for="(o, k) in view.queue" :key="'q' + k" :sl="o" /></div>
        <div class="row"><span class="tip">{{ t('machine.materialsSetAside') }}</span><ItemSlot v-for="(o, k) in view.held" :key="'h' + k" :sl="o" /></div>
      </div>
      <div v-if="view.busy || view.qn" class="row">
        <button @click="cancel">{{ t('machine.cancelUnfinishedMaterialsReturned', (view.busy ? 1 : 0) + view.qn) }}</button>
      </div>
      <h3>{{ view.n ? t('machine.queueNextBatchQueued', view.n, MAX_BATCHES) : t('machine.load') }}</h3>
      <p class="tip">{{ t('machine.processingRunsGameTime', MAX_BATCHES) }}</p>
      <div v-for="(r, i) in recipes" :key="i" class="recipe">
        <span v-for="([spec, n], k) in r.in" :key="spec" class="need" :class="{ lack: k ? countSpec(s.inv, spec) < n : !pickOf(i) }">
          {{ specName(spec) }}{{ X }}{{ n }}<small v-if="k">{{ t('common.have', countSpec(s.inv, spec)) }}</small>
        </span>
        <span>→</span>
        <ItemSlot v-if="outId(r.out, pickOf(i))" :sl="{ id: outId(r.out, pickOf(i)), q: 0, n: r.n }" />
        <span>{{ outId(r.out, pickOf(i)) ? ITEMS[outId(r.out, pickOf(i))]?.name : t('machine.matchingProduct') }}{{ X }}{{ r.n }} · {{ time(machineMinutes(s, ent()!.k, r.min)) }}</span>
        <div v-if="r.in[0][0].startsWith('#') || r.in[0][0].includes('|')" class="choices">
          <button v-for="id in recipeChoices(s, r)" :key="id" class="chip" :class="{ on: pickOf(i) === id }" @click="picked[i] = id">
            <ItemSlot :sl="{ id, q: 0, n: 1 }" /><small>{{ t('machine.gG', ITEMS[id].name, ITEMS[id].sell, ITEMS[outId(r.out, id)]?.sell ?? '') }}</small>
          </button>
        </div>
        <button class="primary" :disabled="!ready(i) || view.n >= MAX_BATCHES" @click="insert(i)">{{ view.n ? t('machine.queue') : t('machine.load2') }}</button>
      </div>
      <p v-if="!recipes.length && !jobDone(s, ent()!)" class="tip">{{ t('machine.machineDoesntNeedLoading') }}</p>
    </div>
  </Panel>
</template>

<style scoped>
.block { margin-bottom: 8px; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
</style>
