<script setup lang="ts">
// F07 雪地手作会：用活动提供的木件拼一座雪景摆件，底座、屋身、屋顶颜色自由选，可加小树和小人。木件散场时归还。
import { computed, ref } from 'vue'
import { t } from '../../core/i18n.ts'
import { sfx } from '../../platform/audio.ts'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const COLORS = ['#c8553d', '#e0b04a', '#5a8fc0', '#6aa060', '#f2ede4', '#8a5a9a']
const base = ref<'snow' | 'ice'>('snow')
const body = ref(COLORS[0])
const roof = ref(COLORS[4])
const tree = ref(true)
const figure = ref(false)
const made = ref(false)
const parts = computed(() => 3 + (tree.value ? 1 : 0) + (figure.value ? 1 : 0))
const { f, start, close } = useFest('snow_craft', () => [parts.value, t('fest.snow.builtSnowyCottageSong', tree.value ? t('fest.snow.littlePineTree') : '', figure.value ? t('fest.snow.tinyFigureStandingDoor') : '')])
function make() {
  start()
  made.value = true
  sfx('snow_crunch', 0.6)
}
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.snow.songNingPushesBasket') }}</p>
    <div class="craft">
      <div class="scene" :class="base">
        <div class="ground" />
        <div class="house"><div class="roof" :style="{ borderBottomColor: roof }" /><div class="body" :style="{ background: body }"><i class="door" /></div></div>
        <div v-if="tree" class="tree"><i /><i /><i /></div>
        <div v-if="figure" class="fig"><i class="head" /><i class="coat" :style="{ background: roof === '#f2ede4' ? '#c8553d' : roof }" /></div>
      </div>
      <div class="opts">
        <label>{{ t('fest.snow.base') }} <button :class="{ on: base === 'snow' }" :disabled="made" @click="base = 'snow'">{{ t('fest.snow.snowdrift') }}</button><button :class="{ on: base === 'ice' }" :disabled="made" @click="base = 'ice'">{{ t('fest.snow.ice') }}</button></label>
        <label>{{ t('fest.snow.walls') }} <button v-for="c in COLORS" :key="'b' + c" class="sw" :class="{ on: body === c }" :style="{ background: c }" :disabled="made" @click="body = c" /></label>
        <label>{{ t('fest.snow.roof') }} <button v-for="c in COLORS" :key="'r' + c" class="sw" :class="{ on: roof === c }" :style="{ background: c }" :disabled="made" @click="roof = c" /></label>
        <label><input v-model="tree" type="checkbox" :disabled="made" /> {{ t('fest.snow.addLittlePine') }}</label>
        <label><input v-model="figure" type="checkbox" :disabled="made" /> {{ t('fest.snow.addLittleFigure') }}</label>
      </div>
    </div>
    <div class="actions">
      <template v-if="!made"><button class="primary" @click="make">{{ t('fest.snow.done') }}</button><button @click="close">{{ t('common.lookAround') }}</button></template>
      <template v-else><span class="tip">{{ t('fest.snow.everyoneGathersRoundAdmire') }}</span><button class="primary" autofocus @click="close">{{ t('fest.snow.returnPiecesFinish') }}</button></template>
    </div>
  </Panel>
</template>

<style scoped>
.craft { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; }
.scene { position: relative; width: 220px; height: 170px; border-radius: 10px; background: linear-gradient(#b8cfe0, #e8f0f6); overflow: hidden; }
.ground { position: absolute; left: 0; right: 0; bottom: 0; height: 40px; background: #fff; border-radius: 50% 50% 0 0 / 30% 30% 0 0; }
.ice .ground { background: #cfe6f2; border-radius: 0; height: 30px; }
.house { position: absolute; left: 60px; bottom: 30px; width: 80px; }
.roof { width: 0; height: 0; margin: 0 -8px; border-left: 48px solid transparent; border-right: 48px solid transparent; border-bottom: 40px solid; }
.body { height: 50px; position: relative; }
.door { position: absolute; left: 30px; bottom: 0; width: 18px; height: 28px; background: #5a3a24; border-radius: 9px 9px 0 0; }
.tree { position: absolute; right: 22px; bottom: 30px; width: 40px; display: flex; flex-direction: column; align-items: center; }
.tree i { width: 0; height: 0; border-left: 18px solid transparent; border-right: 18px solid transparent; border-bottom: 22px solid #3f7a4a; margin-top: -10px; }
.fig { position: absolute; left: 30px; bottom: 30px; display: flex; flex-direction: column; align-items: center; }
.fig .head { width: 12px; height: 12px; border-radius: 50%; background: #f2d0b0; }
.fig .coat { width: 16px; height: 20px; border-radius: 6px 6px 2px 2px; }
.opts { display: flex; flex-direction: column; gap: 8px; }
.opts label { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sw { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; padding: 0; }
.on { outline: 2px solid #f3c76a; }
</style>
