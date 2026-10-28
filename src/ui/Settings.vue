<script setup lang="ts">
import { saveVolume, sfx, volume } from '../platform/audio.ts'
import { game } from '../game.ts'
import { t } from '../core/i18n.ts'
import { graphics, switchLang } from '../platform/settings.ts'

defineEmits<{ close: [] }>()
const pct = (v: number) => `${Math.round(v * 100)}%`
function set(k: keyof typeof volume, v: string) {
  volume[k] = Number(v)
  saveVolume()
  if (k === 'sfx') sfx('ui_select', 0.6)
}
function setLang(v: string) {
  game?.save()
  switchLang(v as 'zh' | 'en')
}
</script>

<template>
  <section class="panel settings split" role="dialog" :aria-label="t('common.settings')">
    <header><h2>{{ t('common.settings') }}</h2></header>
    <div class="panel-body">
    <label class="volume i18n-ok">Language <!-- i18n-ignore -->
      <select :value="graphics.lang" @change="setLang(($event.target as HTMLSelectElement).value)">
        <option value="zh">中文</option> <!-- i18n-ignore -->
        <option value="en">English</option>
      </select>
      <span />
    </label>
    <p class="tip">{{ t('settings.switchingLanguageSavesProgress') }}</p>
    <h3>{{ t('settings.sound') }}</h3>
    <label class="volume">{{ t('settings.music') }} <input type="range" min="0" max="1" step="0.05" :value="volume.music" @input="set('music', ($event.target as HTMLInputElement).value)" /> <span>{{ pct(volume.music) }}</span></label>
    <label class="volume">{{ t('settings.ambience') }} <input type="range" min="0" max="1" step="0.05" :value="volume.ambience" @input="set('ambience', ($event.target as HTMLInputElement).value)" /> <span>{{ pct(volume.ambience) }}</span></label>
    <label class="volume">{{ t('settings.effects') }} <input type="range" min="0" max="1" step="0.05" :value="volume.sfx" @change="set('sfx', ($event.target as HTMLInputElement).value)" /> <span>{{ pct(volume.sfx) }}</span></label>
    <h3>{{ t('settings.graphics') }}</h3>
    <label class="check"><input v-model="graphics.shadows" type="checkbox" /> {{ t('settings.realTimeShadowsTurn') }}</label>
    <label class="volume">{{ t('settings.resolution') }}
      <select v-model.number="graphics.scale">
        <option :value="1">{{ t('common.standard') }}</option>
        <option :value="0.75">{{ t('settings.smooth75') }}</option>
        <option :value="0.5">{{ t('settings.powerSaver50') }}</option>
      </select>
      <span />
    </label>
    <h3>{{ t('settings.accessibility') }}</h3>
    <label class="check"><input v-model="graphics.fishAssist" type="checkbox" /> {{ t('settings.fishingAssistWidensCatch') }}</label>
    <label class="volume">{{ t('settings.uiTextSize') }}
      <select v-model.number="graphics.uiScale">
        <option :value="0.9">{{ t('settings.small') }}</option>
        <option :value="1">{{ t('common.standard') }}</option>
        <option :value="1.15">{{ t('settings.large') }}</option>
        <option :value="1.3">{{ t('settings.extraLarge130') }}</option>
        <option :value="1.5">150%</option>
        <option :value="1.75">175%</option>
      </select>
      <span />
    </label>
    <label class="check"><input v-model="graphics.reduceFlash" type="checkbox" /> {{ t('settings.reduceFlashingNoLightning') }}</label>
    <label class="check"><input v-model="graphics.fewParticles" type="checkbox" /> {{ t('settings.fewerParticleEffects') }}</label>
    <label class="check"><input v-model="graphics.colorAid" type="checkbox" /> {{ t('settings.colorblindFriendlyHintsReachable') }}</label>
    </div>
    <div class="actions"><button class="primary" @click="$emit('close')">{{ t('settings.done') }}</button></div>
  </section>
</template>
