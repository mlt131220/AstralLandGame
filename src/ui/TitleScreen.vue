<script setup lang="ts">
import { ref, watch } from 'vue'
import { DIFFICULTY } from '../content/content.ts'
import { dateName, newGame, year, type GameState } from '../core/state.ts'
import { startGame, startTitleScene, ui } from '../game.ts'
import { unlockAudio } from '../platform/audio.ts'
import { offline } from '../platform/offline.ts'
import { loadTitleSnap } from '../platform/titleSnap.ts'
import { acquireLock, deleteSlot, exportSave, parseImport, readSlot, releaseSaveLock, SLOTS, writeSlot } from '../platform/save.ts'
import { lang, t } from '../core/i18n.ts'
import Settings from './Settings.vue'
import { phoneFullscreen } from '../platform/touch.ts'
const VERSION: string = import.meta.env.VITE_VERSION

const props = defineProps<{ host: HTMLElement | null }>()
const snap = ref('')
loadTitleSnap().then((u) => (snap.value = u))
const saves = ref(SLOTS.map(readSlot))
const creating = ref<number | null>(null)
const confirmDel = ref<number | null>(null)
const name = ref('')
const farm = ref('')
const diff = ref(1)
const look = ref(0)
const busy = ref(false)
const view = ref<'menu' | 'saves' | 'settings' | 'about'>('menu')
const refresh = () => (saves.value = SLOTS.map(readSlot))
const reloadPage = () => location.reload() // 换用新离线包的提交点：在标题页（已保存退出）由玩家确认
const LOOKS = ['male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f', 'female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f']

// 父组件的画布容器 ref 在首次渲染后才赋值
watch(() => props.host, (h) => { if (h) startTitleScene(h) }, { immediate: true })

async function play(slot: number, fresh?: GameState) {
  if (!props.host || busy.value) return
  busy.value = true
  await startGame(props.host, slot, fresh)
  busy.value = false
  refresh()
}
const create = () => play(creating.value!, newGame(name.value, farm.value, diff.value, undefined, look.value))

// 删除与导入同样要先取得该槽位的写锁，并以存储中的最新内容为准（25.4）
async function withSlotLock(slot: number, fn: () => void) {
  if (!(await acquireLock(slot, () => {}))) ui.error = t('title.saveUseAnotherTab')
  else fn()
  releaseSaveLock()
  refresh()
}
function del(slot: number) {
  if (confirmDel.value !== slot) { confirmDel.value = slot; return }
  confirmDel.value = null
  withSlotLock(slot, () => deleteSlot(slot))
}
// 导入只写入空槽，不覆盖已有存档（25.3）；文件框用自己的按钮打开（浏览器自带的“选择文件”跟系统语言走）
const picker = ref<HTMLInputElement | null>(null)
async function importFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const s = parseImport(await f.text())
  const slot = SLOTS.find((x) => !readSlot(x))
  if (!s) ui.error = t('title.importFailedFileIsnt')
  else if (!slot) ui.error = t('title.importFailedNoEmpty')
  else withSlotLock(slot, () => {
    if (readSlot(slot)) ui.error = t('title.importFailedSlotTaken')
    else if (!writeSlot(slot, s)) ui.error = t('title.importFailedBrowserStorage')
    else ui.error = ''
  })
}
</script>

<template>
  <div class="title" @pointerdown="unlockAudio()">
    <img v-if="snap" class="title-snap" :class="{ gone: ui.titleLive }" :src="snap" alt="" />
    <div class="logo">
      <h1>Astral Land</h1>
      <p>{{ t('title.fourSeasonsFarmLife') }}</p>
    </div>
    <p v-if="ui.error" class="error">{{ ui.error }}</p>
    <p v-if="!snap && !ui.titleLive && ui.loading < 0 && !ui.error" class="offline tip">{{ t('title.settingFarm') }}</p>
    <p v-if="offline.state !== 'idle' && offline.state !== 'unsupported'" class="offline tip">
      <template v-if="offline.state === 'ready'">{{ t('title.offlinePackageReadyPlayable', offline.version) }}<template v-if="offline.update"> · {{ t('title.newVersionDownloadedPage') }} <button @click="reloadPage">{{ t('title.refreshUpdate') }}</button></template></template>
      <template v-else-if="offline.state === 'downloading'">{{ t('title.downloadingOfflinePackageMb', offline.done, offline.total, (offline.bytes / 1048576).toFixed(0)) }}</template>
      <template v-else-if="offline.state === 'checking'">{{ t('title.checkingOfflinePackage') }}</template>
      <template v-else>{{ offline.error }}</template>
    </p>

    <nav v-if="view === 'menu'" class="main-menu">
      <button class="primary big" :disabled="ui.loading >= 0" @click="view = 'saves'; phoneFullscreen()">{{ t('title.play') }}</button>
      <button class="big" @click="view = 'settings'">{{ t('common.settings') }}</button>
      <button class="big" @click="view = 'about'">{{ t('title.about') }}</button>
    </nav>

    <Settings v-else-if="view === 'settings'" @close="view = 'menu'" />

    <section v-else-if="view === 'about'" class="card about">
      <h2>{{ t('title.astralLand') }}</h2>
      <p>{{ t('title.fourSeasonFarmLife') }}</p>
      <p class="tip">{{ t('title.versionRendering', VERSION + (offline.version ? ` (${offline.version})` : '')) }}</p>
      <h3>{{ t('title.privacyLocalData') }}</h3>
      <p class="tip">{{ t('title.noAccountNeededNo') }}
        <a :href="lang() === 'en' ? '/privacy-en.html' : '/privacy.html'" target="_blank" rel="noopener">{{ t('title.fullDetails') }}</a></p>
      <h3>{{ t('title.artSoundCredits') }}</h3>
      <ul class="list">
        <li>{{ t('title.kenneyKenneyNlScenery') }}</li>
        <li>{{ t('title.subspaceaudioZaneLittleCynicmusic') }}</li>
        <li>{{ t('title.lxgwWenkaiUiFont') }}</li>
        <li>{{ t('title.buildingsCropsToolsItem') }}</li>
      </ul>
      <div class="actions"><button class="primary" @click="view = 'menu'">{{ t('title.back') }}</button></div>
    </section>

    <section v-else-if="creating === null" class="card">
      <div v-for="(s, i) in saves" :key="i" class="save">
        <template v-if="s">
          <img class="avatar" :src="`/assets/ui/chars/character-${LOOKS[(s.look ?? 0) % 12]}.png`" alt="" width="48" height="48" />
          <div class="grow">
            <b>{{ s.farm }}</b> · {{ s.name }}<br />
            <small class="tip">{{ t('title.year', year(s.day), dateName(s.day)) }} · <i class="coin" /> {{ s.money }} · {{ DIFFICULTY[s.diff].name }}</small>
          </div>
          <button class="primary" :disabled="busy || ui.loading >= 0" @click="play(SLOTS[i])">{{ t('common.continue') }}</button>
          <button @click="exportSave(s)">{{ t('title.export') }}</button>
          <button :class="{ danger: confirmDel === SLOTS[i] }" @click="del(SLOTS[i])">{{ confirmDel === SLOTS[i] ? t('title.confirmDelete') : t('title.delete') }}</button>
        </template>
        <template v-else>
          <div class="grow tip">{{ t('title.slotEmpty', SLOTS[i]) }}</div>
          <button class="primary" @click="creating = SLOTS[i]">{{ t('title.newGame') }}</button>
        </template>
      </div>
      <div class="import"><button @click="picker?.click()">{{ t('title.importSaveFile') }}</button><input ref="picker" type="file" accept=".json,application/json" hidden @change="importFile" /></div>
      <div class="actions"><button @click="view = 'menu'">{{ t('title.back') }}</button></div>
    </section>

    <form v-else class="card create" @submit.prevent="create">
      <label>{{ t('title.name') }} <input v-model="name" maxlength="12" :placeholder="t('common.namelessTraveler')" autofocus /></label>
      <label>{{ t('title.farmName') }} <input v-model="farm" maxlength="12" :placeholder="t('common.astralFarm')" /></label>
      <div>{{ t('title.appearance') }}</div>
      <div class="looks">
        <button v-for="(l, i) in LOOKS" :key="l" type="button" :class="{ on: look === i }" :aria-label="t('title.look', i + 1)" @click="look = i">
          <img :src="`/assets/ui/chars/character-${l}.png`" alt="" />
        </button>
      </div>
      <fieldset>
        <legend>{{ t('title.difficulty') }}</legend>
        <label v-for="(d, i) in DIFFICULTY" :key="i" class="radio">
          <input v-model="diff" type="radio" :value="i" /> {{ d.name }}
          <small>{{ i === 0 ? t('title.slowerTimeCropsNever') : i === 1 ? t('title.standardExperience') : t('title.fasterTimeFasterHunger') }}</small>
        </label>
      </fieldset>
      <div class="actions">
        <button class="primary" type="submit" :disabled="busy || ui.loading >= 0">{{ t('common.start') }}</button>
        <button type="button" @click="creating = null">{{ t('title.back') }}</button>
      </div>
    </form>

    <div v-if="ui.loading >= 0" class="loading">
      {{ t('title.loadingModelsAssets', Math.round(ui.loading * 100)) }}
      <div class="track"><div class="fill" :style="{ width: `${ui.loading * 100}%` }" /></div>
    </div>
  </div>
</template>
