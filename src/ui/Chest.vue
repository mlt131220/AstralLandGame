<script setup lang="ts">
import { computed } from 'vue'
import { ITEMS } from '../content/content.ts'
import { chestMove, chestQuickStack, findEnt } from '../core/placeables.ts'
import type { Ent, Slot } from '../core/state.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Panel from './Panel.vue'

const g = game!
const s = g.s
// 箱子（放置物）或小屋的储物（农场建筑）
const box = computed<Ent | null>(() => {
  void ui.rev
  if (ui.home) {
    const b = s.farmB.find((x) => x.id === ui.home)
    return b?.store ? ({ id: -1, k: 'chest_big', x: b.x, z: b.z, job: null, store: b.store } as Ent) : null
  }
  const e = findEnt(s, ui.machine)
  return e?.store ? e : null
})
const title = computed(() => (ui.home ? t('chest.cabinStorage') : box.value ? ITEMS[box.value.k]?.name ?? t('chest.chest') : t('chest.chest')))
function move(from: 'bag' | 'chest', i: number) {
  if (!box.value) return
  if (g.run(() => chestMove(s, box.value!, from, i)).ok) sfx('ui_select', 0.4)
  g.changed()
}
function sortStore() {
  const st = box.value?.store
  if (!st) return
  const items = st.filter((x): x is Slot => !!x).sort((a, b) => a.id.localeCompare(b.id) || b.q - a.q)
  st.splice(0, st.length, ...items, ...Array(st.length - items.length).fill(null))
  g.changed()
}
</script>

<template>
  <Panel :title="title" wide>
    <div v-if="box" :data-rev="ui.rev">
      <p class="tip">{{ t('chest.clickItemMoveWhole') }}</p>
      <h3>{{ t('common.progress', title, box.store!.filter(Boolean).length, box.store!.length) }}</h3>
      <div class="grid">
        <button v-for="(sl, i) in box.store" :key="'c' + i" type="button" class="cell" @click="sl && move('chest', i)"><ItemSlot :sl="sl" /></button>
      </div>
      <div class="actions">
        <button @click="g.run(() => chestQuickStack(s, box!)); g.changed()">{{ t('chest.storeMatching') }}</button>
        <button @click="sortStore">{{ t('chest.sortChest') }}</button>
      </div>
      <h3>{{ t('common.backpack') }}</h3>
      <div class="grid">
        <button v-for="(sl, i) in s.inv" :key="'b' + i" type="button" class="cell" @click="sl && move('bag', i)"><ItemSlot :sl="sl" :label="i < s.hotbar ? (i === 9 ? 0 : i + 1) : undefined" /></button>
      </div>
    </div>
  </Panel>
</template>
