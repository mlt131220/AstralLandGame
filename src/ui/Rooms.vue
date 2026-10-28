<script setup lang="ts">
// 室内的几个小面板：穿衣镜（换外观）、档案馆展柜（图鉴与捐赠）
import { computed, ref } from 'vue'
import { ITEMS } from '../content/content.ts'
import { CATS, catIds, donate, donatedCount, nextReward } from '../core/collection.ts'
import { count } from '../core/state.ts'
import { chooseWish, claimTier, tierClaimed, WISHES, wishOf } from '../core/wishes.ts'
import { adoptPet, PETS, type PetKind } from '../core/pets.ts'
import { outfitFiles, putOn, SLOT_NAMES, storeWear, WEAR_SLOTS, type WearSlot } from '../core/wardrobe.ts'
import { game, ui } from '../game.ts'
import { sfx } from '../platform/audio.ts'
import { t } from '../core/i18n.ts'
import ItemSlot from './ItemSlot.vue'
import Panel from './Panel.vue'

const g = game!
const s = g.s
// 衣柜：按部位列出收集到的衣物；换装后重建玩家模型
const owned = computed(() => { void ui.rev; return Object.fromEntries(WEAR_SLOTS.map((k) => [k, (s.wardrobe ?? []).filter((id) => ITEMS[id]?.wear === k)])) as Record<WearSlot, string[]> })
const worn = computed(() => { void ui.rev; return { ...(s.outfit ?? {}) } as Partial<Record<WearSlot, string>> })
const bagWear = computed(() => { void ui.rev; return s.inv.map((sl, i) => (sl && ITEMS[sl.id]?.wear ? i : -1)).filter((i) => i >= 0) })
async function dress(k: WearSlot, id: string) {
  if (!g.run(() => putOn(s, k, id)).ok) return
  g.changed()
  sfx('ui_select', 0.5)
  await g.r.ensurePlayer(s.look ?? 0, outfitFiles(s))
  g.changed() // 新模型重新拿上手里的工具
}
function store(i: number) {
  if (g.run(() => storeWear(s, i)).ok) sfx('ui_confirm', 0.5)
  g.changed()
}

const cat = ref(0)
const ids = computed(() => { void ui.rev; return catIds(cat.value) })
const asking = ref('')
function give(id: string) {
  const r = g.run(() => donate(s, id))
  if (r.ok) sfx('pickup', 0.6)
  asking.value = ''
  g.changed()
}
const next = computed(() => { void ui.rev; return nextReward(s) })

const wish = computed(() => { void ui.rev; return wishOf(s) })
const petKind = ref<PetKind>('cat')
const petName = ref('')
function adopt() {
  if (g.run(() => adoptPet(s, petKind.value, petName.value)).ok) { sfx(PETS[petKind.value].sound, 0.7); ui.panel = '' }
  g.changed()
}
function act(fn: () => ReturnType<typeof chooseWish>) {
  if (g.run(fn).ok) sfx('wish', 0.5)
  g.changed()
}
</script>

<template>
  <Panel v-if="ui.panel === 'look'" :title="t('rooms.mirror')" wide>
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('rooms.mirrorStillShowsOnly') }}</p>
      <div v-if="bagWear.length" class="bagwear">
        <span class="tip">{{ t('rooms.clothesBackpack') }}</span>
        <button v-for="i in bagWear" :key="i" class="pick" @click="store(i)"><ItemSlot :sl="s.inv[i]" /><small>{{ t('rooms.putAway') }}</small></button>
      </div>
      <div v-for="k in WEAR_SLOTS" :key="k" class="wslot">
        <h3>{{ SLOT_NAMES[k] }}</h3>
        <div class="grid">
          <button class="pick" :class="{ on: !worn[k] }" @click="dress(k, '')"><span class="orig">{{ t('rooms.default') }}</span><small>{{ k === 'hat' ? t('rooms.noHat') : t('rooms.default2', SLOT_NAMES[k]) }}</small></button>
          <button v-for="id in owned[k]" :key="id" class="pick" :class="{ on: worn[k] === id }" :title="ITEMS[id].name" @click="dress(k, id)">
            <ItemSlot :sl="{ id, q: 0, n: 1 }" /><small>{{ ITEMS[id].name }}</small>
          </button>
        </div>
        <p v-if="!owned[k].length" class="tip">{{ t('rooms.noItemsYetFind', SLOT_NAMES[k]) }}</p>
      </div>
    </div>
  </Panel>

  <Panel v-else-if="ui.panel === 'pet'" :title="t('rooms.petZhouQin')">
    <p class="tip">{{ t('rooms.zhouQinDoorLittle') }}</p>
    <div class="pets">
      <button v-for="(p, k) in PETS" :key="k" class="petpick" :class="{ on: petKind === k }" @click="petKind = k">{{ p.name }}<small>{{ k.startsWith('cat') ? t('rooms.meow') : t('rooms.woof') }}</small></button>
    </div>
    <label class="tip">{{ t('rooms.name') }} <input v-model="petName" maxlength="8" :placeholder="PETS[petKind].name" /></label>
    <div class="actions">
      <button class="primary" @click="adopt">{{ t('rooms.adopt') }}</button>
      <button @click="ui.panel = ''">{{ t('rooms.maybeLater') }}</button>
    </div>
  </Panel>

  <Panel v-else-if="ui.panel === 'wish'" :title="t('rooms.wishBook')" wide>
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('rooms.writeDownWhatMost') }}</p>
      <div class="wishes">
        <div v-for="w in WISHES" :key="w.id" class="wish" :class="{ on: wish === w.id }">
          <div class="wh"><b>{{ w.name }}</b> <small>{{ w.blurb }}</small>
            <button v-if="wish !== w.id" class="mini" @click="act(() => chooseWish(s, w.id))">{{ t('rooms.makeWish') }}</button>
            <span v-else class="badge">{{ t('rooms.currentWish') }}</span></div>
          <div v-for="(tier, k) in w.tiers" :key="k" class="tier">
            <span class="tbar"><i :style="{ width: Math.min(100, (tier.prog(s)[0] / tier.prog(s)[1]) * 100) + '%' }" /></span>
            <small>{{ t('rooms.tierProgress', [t('rooms.tier1'), t('rooms.tier2'), t('rooms.tier3')][k], tier.text, Math.min(tier.prog(s)[0], tier.prog(s)[1]), tier.prog(s)[1]) }}</small>
            <span v-if="tierClaimed(s, w.id, k)" class="badge">{{ t('rooms.claimed') }}</span>
            <button v-else-if="tier.prog(s)[0] >= tier.prog(s)[1]" class="mini" @click="act(() => claimTier(s, w.id, k))">{{ ITEMS[tier.reward] ? t('rooms.claim', ITEMS[tier.reward].name) : t('common.claim') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Panel>

  <Panel v-else-if="ui.panel === 'museum'" :title="t('rooms.archiveDisplay')" wide>
    <div :data-rev="ui.rev">
      <p class="tip">{{ t('rooms.collectionOnlyRecordsWhat') }}
        {{ next ? t('rooms.displayYoullReceive', donatedCount(s), next[0], ITEMS[next[1]].name) : t('rooms.display', donatedCount(s)) }}</p>
      <div class="subtabs">
        <button v-for="(c, i) in CATS" :key="c.name" :class="{ on: cat === i }" @click="cat = i">{{ c.name }}</button>
      </div>
      <p class="tip">{{ t('rooms.categoryDisplayedDiscovered', ids.filter((id) => s.donated?.[id]).length, ids.length, ids.filter((id) => s.found[id]).length, ids.length) }}</p>
      <div class="grid">
        <div v-for="id in ids" :key="id" class="cell" :class="{ unknown: !s.found[id], shown: s.donated?.[id] }" :title="s.found[id] ? ITEMS[id].name : t('common.notFoundYet')">
          <ItemSlot :sl="{ id, q: 0, n: 1 }" />
          <span v-if="s.donated?.[id]" class="badge">{{ t('rooms.displayed') }}</span>
          <button v-else-if="count(s.inv, id)" class="mini" @click="asking = id">{{ t('rooms.donate') }}</button>
        </div>
      </div>
      <div v-if="asking" class="confirm">
        {{ t('rooms.give1BackpackArchive', ITEMS[asking].name) }}
        <button @click="give(asking)">{{ t('rooms.donate1') }}</button> <button @click="asking = ''">{{ t('rooms.notYet') }}</button>
      </div>
    </div>
  </Panel>
</template>

<style scoped>
.wslot .grid { display: flex; flex-wrap: wrap; gap: 6px; }
.pick { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 6px; border-radius: 8px; border: 2px solid transparent; background: rgba(255, 255, 255, 0.05); min-width: 64px; }
.pick.on { border-color: #f3c76a; background: rgba(243, 199, 106, 0.18); }
.orig { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; font-size: 13px; }
.bagwear { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 6px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 6px; }
.cell { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cell.unknown { opacity: 0.35; filter: grayscale(1); }
.cell.shown :deep(.slot) { box-shadow: 0 0 0 2px #f3c76a inset; }
.badge { font-size: 11px; color: #f3c76a; }
.mini { font-size: 11px; padding: 1px 6px; }
.subtabs { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
.subtabs .on { background: #f3c76a; color: #3a2a10; }
.wishes { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; }
.wish { padding: 8px 10px; border-radius: 10px; background: rgba(255, 255, 255, 0.05); }
.wish.on { box-shadow: 0 0 0 2px #f3c76a inset; }
.wh { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.wh .mini, .wh .badge { margin-left: auto; }
.tier { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
.tbar { flex: 0 0 60px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
.tbar i { display: block; height: 100%; background: #8fd27a; }
.pets { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 8px 0; }
.petpick { display: flex; flex-direction: column; align-items: center; padding: 10px; border-radius: 10px; }
.petpick.on { outline: 2px solid #f3c76a; }
.confirm { margin-top: 10px; padding: 8px 10px; border-radius: 8px; background: rgba(243, 199, 106, 0.14); }
</style>
