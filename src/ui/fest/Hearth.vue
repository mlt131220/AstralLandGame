<script setup lang="ts">
// F08 围炉谢礼夜：在炉边讲一段这一年的故事，再给一位认识的居民写一张匿名问候投进公共柜。不需要礼物。
import { computed, ref } from 'vue'
import { NPC_DEFS } from '../../content/story.ts'
import { hearthGreet } from '../../core/town.ts'
import { t } from '../../core/i18n.ts'
import { sfx } from '../../platform/audio.ts'
import Panel from '../Panel.vue'
import { useFest } from './useFest.ts'

const STORIES = [
  [t('fest.hearth.firstRadish'), t('fest.hearth.whenFirstGotBarely')],
  [t('fest.hearth.lampsMines'), t('fest.hearth.onceNearlyGotLost')],
  [t('fest.hearth.morningRiver'), t('fest.hearth.beforeMistLiftsRiver')],
  [t('fest.hearth.thingsFixedTogether'), t('fest.hearth.sluiceGateWoodsBridge')],
]
const GREETINGS = [t('fest.hearth.thankLookingYear'), t('fest.hearth.letsShareMealSometime'), t('fest.hearth.everyoneSeesGood')]
const story = ref(-1)
const to = ref('')
const line = ref(0)
const sent = ref(false)
const { s, f, start, close } = useFest('hearth_night', () => [1, t('fest.hearth.toldDroppedAnonymousGreeting', STORIES[story.value]?.[0] ?? t('fest.hearth.oldStory'))])
const known = computed(() => Object.entries(s.friends).filter(([id, x]) => x.talked && NPC_DEFS[id]).map(([id]) => id))
function send() {
  if (story.value < 0 || !to.value) return
  start()
  hearthGreet(s, to.value)
  sent.value = true
  sfx('paper', 0.6)
}
</script>

<template>
  <Panel :title="`${f.name} · ${f.game}`" wide>
    <p class="tip">{{ t('fest.hearth.grannyShiTossesAnother') }}</p>
    <template v-if="!sent">
      <h3>{{ t('fest.hearth.tellStory') }}</h3>
      <div class="list">
        <button v-for="(st, i) in STORIES" :key="i" class="story" :class="{ on: story === i }" @click="story = i"><b>{{ st[0] }}</b><small>{{ st[1] }}</small></button>
      </div>
      <h3>{{ t('fest.hearth.anonymousGreeting') }}</h3>
      <p v-if="!known.length" class="tip">{{ t('fest.hearth.haventMetAnyoneTown') }}</p>
      <div class="list row">
        <button v-for="id in known" :key="id" :class="{ on: to === id }" @click="to = id">{{ NPC_DEFS[id].name }}</button>
      </div>
      <div class="list row">
        <button v-for="(g, i) in GREETINGS" :key="i" :class="{ on: line === i }" @click="line = i">{{ g }}</button>
      </div>
      <div class="actions">
        <button class="primary" :disabled="story < 0 || !to" @click="send">{{ t('fest.hearth.drop') }}</button>
        <button @click="close">{{ t('common.lookAround') }}</button>
      </div>
    </template>
    <template v-else>
      <p class="line">{{ t('fest.hearth.fireCracklesFinishEveryone', STORIES[story][0]) }}</p>
      <p class="line">{{ t('fest.hearth.noteReadsNoName', GREETINGS[line], NPC_DEFS[to].name) }}</p>
      <div class="actions"><button class="primary" autofocus @click="close">{{ t('fest.hearth.stayFire') }}</button></div>
    </template>
  </Panel>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 6px; }
.list.row { flex-direction: row; flex-wrap: wrap; margin-top: 6px; }
.story { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 6px 10px; }
.on { outline: 2px solid #f3c76a; }
.line { margin: 6px 0; }
</style>
