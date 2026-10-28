<script setup lang="ts">
// F03 长日野餐：从夏禾准备的篮子里挑 3 样（也可以自带 1 样自家食材，会用掉），一起做一锅共享料理。
// 搭配越丰富（蔬菜、主食、蛋鱼奶、香草）大家越满意；不需要稀有材料。
import { computed, ref } from 'vue'
import { ITEMS } from '../../content/content.ts'
import { count, removeItem } from '../../core/state.ts'
import { t } from '../../core/i18n.ts'
import { sfx } from '../../platform/audio.ts'
import ItemSlot from '../ItemSlot.vue'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const KIND: Record<string, string> = {
  spring_lettuce: t('common.veggies'), spring_radish: t('common.veggies'), summer_tomato: t('common.veggies'), bread: t('fest.picnic.staples'), summer_corn: t('fest.picnic.staples'), egg: t('fest.picnic.eggFishMilk'), milk: t('fest.picnic.eggFishMilk'), herb: t('fest.picnic.herbs'), wild_greens: t('fest.picnic.herbs'),
}
const BASKET = ['spring_lettuce', 'summer_tomato', 'bread', 'egg', 'milk', 'herb'].filter((id) => ITEMS[id])
const kindOf = (id: string) => KIND[id] ?? (ITEMS[id]?.tags?.includes('fish') || ITEMS[id]?.tags?.includes('animal') ? t('fest.picnic.eggFishMilk') : ITEMS[id]?.tags?.includes('grain') ? t('fest.picnic.staples') : ITEMS[id]?.tags?.includes('forage') ? t('fest.picnic.herbs') : t('common.veggies'))
const picked = ref<string[]>([])
const own = ref('')
const done = ref(false)
const kinds = computed(() => new Set([...picked.value, ...(own.value ? [own.value] : [])].map(kindOf)).size)
const DISH = computed(() => kinds.value >= 4 ? t('fest.picnic.summerMedleyPlatter') : picked.value.includes('egg') || picked.value.includes('milk') ? t('fest.picnic.creamyEggSoup') : picked.value.includes('bread') ? t('fest.picnic.toastSeasonalVeggies') : t('fest.picnic.lightVeggieSoup'))
const { s, f, start, close } = useFest('picnic', () => [kinds.value, kinds.value >= 4 ? t('fest.picnic.madeTogetherEveryoneScrambled', DISH.value) : t('fest.picnic.madeTogetherXiaHe', DISH.value)])
// 自带的一样：背包里的自产食材（作物、采集物、蛋奶、鱼）
const mine = computed(() => [...new Set(s.inv.filter((sl) => sl && !sl.b && ['crop', 'forage', 'fish', 'animal'].some((tag) => ITEMS[sl.id]?.tags?.includes(tag))).map((sl) => sl!.id))].slice(0, 12))
function toggle(id: string) {
  if (done.value) return
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value.splice(i, 1)
  else if (picked.value.length < 3) picked.value.push(id)
  sfx('ui_select', 0.4)
}
function cook() {
  if (picked.value.length < 3) return
  start()
  if (own.value && count(s.inv, own.value)) removeItem(s.inv, own.value, 1)
  done.value = true
  sfx('bubble_pot', 0.6)
}
const LINES = computed(() => [
  kinds.value >= 3 ? t('fest.picnic.xiaHeSuchLovely') : t('fest.picnic.xiaHeNiceLight'),
  own.value ? t('fest.picnic.grannyShiThatsOwn', ITEMS[own.value].name) : t('fest.picnic.linFirstTastePlease'),
  t('fest.picnic.heYanIllSpread'),
])
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.picnic.xiaHeSetsBig') }}</p>
    <template v-if="!done">
      <h3>{{ t('fest.picnic.eventBasketPick3', picked.length) }}</h3>
      <div class="grid">
        <button v-for="id in BASKET" :key="id" class="pick" :class="{ on: picked.includes(id) }" @click="toggle(id)">
          <ItemSlot :sl="{ id, q: 0, n: 1 }" /><small>{{ kindOf(id) }}</small>
        </button>
      </div>
      <h3>{{ t('fest.picnic.bringOwnOptionalUses') }}</h3>
      <div class="grid">
        <button class="pick" :class="{ on: !own }" @click="own = ''"><small>{{ t('fest.picnic.none') }}</small></button>
        <button v-for="id in mine" :key="id" class="pick" :class="{ on: own === id }" @click="own = id"><ItemSlot :sl="{ id, q: 0, n: 1 }" /></button>
      </div>
      <p class="tip">{{ t('fest.picnic.variety4VeggiesStaples', kinds) }}</p>
      <div class="actions">
        <button class="primary" :disabled="picked.length < 3" @click="cook">{{ t('fest.picnic.pot') }}</button>
        <button @click="close">{{ t('common.lookAround') }}</button>
      </div>
    </template>
    <template v-else>
      <h3>{{ t('fest.picnic.ready', DISH) }}</h3>
      <p v-for="l in LINES" :key="l" class="line">{{ l }}</p>
      <div class="actions"><button class="primary" autofocus @click="close">{{ t('fest.picnic.spreadBlanketFinish') }}</button></div>
    </template>
  </Panel>
</template>

<style scoped>
.grid { display: flex; flex-wrap: wrap; gap: 6px; }
.pick { display: flex; flex-direction: column; align-items: center; padding: 4px; border-radius: 8px; border: 2px solid transparent; background: rgba(255, 255, 255, 0.05); }
.pick.on { border-color: #f3c76a; }
.line { margin: 4px 0; }
</style>
