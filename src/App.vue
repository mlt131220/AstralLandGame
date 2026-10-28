<script setup lang="ts">
import { ref } from 'vue'
import { game, ui } from './game.ts'
import { exportSave } from './platform/save.ts'
import { t } from './core/i18n.ts'
import Coop from './ui/Coop.vue'
import Chest from './ui/Chest.vue'
import FarmPanels from './ui/FarmPanels.vue'
import Dialogs from './ui/Dialogs.vue'
import Dialogue from './ui/Dialogue.vue'
import Festival from './ui/Festival.vue'
import FestGame from './ui/fest/FestGame.vue'
import { festivalNow } from './core/town.ts'
import { computed } from 'vue'
import GameMenu from './ui/GameMenu.vue'
import Hud from './ui/Hud.vue'
import Kitchen from './ui/Kitchen.vue'
import Machine from './ui/Machine.vue'
import MineGate from './ui/MineGate.vue'
import Rooms from './ui/Rooms.vue'
import Settings from './ui/Settings.vue'
import Ship from './ui/Ship.vue'
import Shop from './ui/Shop.vue'
import TitleScreen from './ui/TitleScreen.vue'

const view = ref<HTMLElement | null>(null)
const reloadPage = () => location.reload()
const festId = computed(() => (ui.panel === 'festival' && game ? festivalNow(game.s)?.id : ''))
</script>

<template>
  <div ref="view" class="view" />
  <div class="rotate-phone">{{ t('touch.rotatePhone') }}</div>
  <TitleScreen v-if="ui.screen === 'title'" :host="view" />
  <template v-else>
    <Hud />
    <GameMenu v-if="ui.panel === 'menu'" />
    <Dialogue v-else-if="ui.panel === 'dialog' && ui.dialog" />
    <Shop v-else-if="ui.panel === 'shop'" />
    <Ship v-else-if="ui.panel === 'ship'" />
    <Machine v-else-if="ui.panel === 'machine'" />
    <Kitchen v-else-if="ui.panel === 'kitchen'" />
    <Coop v-else-if="ui.panel === 'coop'" />
    <MineGate v-else-if="ui.panel === 'mine'" />
    <Chest v-else-if="ui.panel === 'chest'" />
    <FarmPanels v-else-if="['silo', 'fire', 'tree', 'project', 'workshop'].includes(ui.panel)" />
    <Festival v-else-if="ui.panel === 'festival' && festId === 'flower_fair'" />
    <FestGame v-else-if="ui.panel === 'festival'" />
    <Rooms v-else-if="['look', 'museum', 'wish', 'pet'].includes(ui.panel)" />
    <div v-else-if="ui.panel === 'settings'" class="backdrop" @mousedown.self="ui.panel = 'pause'">
      <Settings @close="ui.panel = 'pause'" />
    </div>
    <Dialogs v-else />
    <div v-if="ui.gpuLost" class="backdrop">
      <section class="panel" role="alertdialog" :aria-label="t('app.graphicsNeedReloading')">
        <header><h2>{{ t('app.graphicsNeedReloading') }}</h2></header>
        <template v-if="ui.lostSaved">
          <p>{{ t('app.n3dViewLostAfter2') }}</p>
          <div class="actions"><button class="primary" autofocus @click="reloadPage">{{ t('app.reload') }}</button></div>
        </template>
        <template v-else>
          <p>{{ t('app.n3dViewLostAfter') }}<b>{{ t('app.progressNotSaved') }}</b>{{ t('app.storageFullTabRead') }}</p>
          <p class="tip">{{ t('app.pleaseExportSaveFirst') }}</p>
          <div class="actions">
            <button class="primary" autofocus @click="game && exportSave(game.s)">{{ t('app.exportSave') }}</button>
            <button @click="ui.lostSaved = !!game?.save()">{{ t('app.trySavingAgain') }}</button>
            <button class="danger" @click="reloadPage">{{ t('app.discardUnsavedProgressReload') }}</button>
          </div>
        </template>
      </section>
    </div>
    <TransitionGroup tag="div" name="toast" class="toasts" :class="{ touch: ui.touch }">
      <div v-for="toast in ui.toasts" :key="toast.id" class="toast">{{ toast.text }}</div>
    </TransitionGroup>
  </template>
</template>
