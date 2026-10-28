<script setup lang="ts">
import { shipValue } from '../core/actions.ts'
import { witherTomorrow } from '../core/settle.ts'
import { dateName, forecast, season, weatherName } from '../core/state.ts'
import { game, ui } from '../game.ts'
import { exportSave } from '../platform/save.ts'
import { t } from '../core/i18n.ts'
import Panel from './Panel.vue'

const g = game!
const s = g.s
// 极端天气提示：键与 EXTREME_NAMES 一致（已按语言翻译）
const EXTREME_TIP: Record<string, string> = { [t('common.thunderstorm')]: t('dialogs.poorVisibilityOutdoorsFields'), [t('common.gale')]: t('dialogs.colderHeights'), [t('common.blizzard')]: t('dialogs.coldOutdoorsDrainsFast') }
function sleepNow() {
  const day = ui.sleepDay
  ui.panel = ''
  g.sleep(false, day)
}
function nextDay() {
  ui.panel = ''
  ui.summary = null
}
</script>

<template>
  <Panel v-if="ui.panel === 'sleep'" :title="t('dialogs.bed')">
    <p>{{ t('dialogs.goSleepNowEnd') }}</p>
    <ul class="list">
      <li>{{ t('dialogs.pendingShipmentsG', shipValue(s)) }}</li>
      <li v-if="s.min >= 1440">{{ t('dialogs.pastMidnightYoullRecover') }}</li>
      <li v-if="s.satiety < 30">{{ t('dialogs.fullnessBelow30Tomorrows') }}</li>
      <li v-if="witherTomorrow(s)" class="lack">{{ t('dialogs.seasonChangesTomorrowSeason', witherTomorrow(s)) }}</li>
      <li :class="{ lack: forecast(s).extreme }">{{ t('dialogs.tomorrowsWeather', forecast(s).tomorrow, forecast(s).extreme ? t('common.extremeWeather') : '') }}</li>
    </ul>
    <div class="actions">
      <button class="primary" @click="sleepNow">{{ t('dialogs.sleepTillMorning') }}</button>
      <button v-if="s.house.lv >= 1" @click="ui.homeKitchen = true; ui.panel = 'kitchen'">{{ t('dialogs.cookHomeKitchen') }}</button>
      <button @click="ui.panel = ''">{{ t('dialogs.cancel') }}</button>
    </div>
  </Panel>

  <Panel v-else-if="ui.panel === 'summary' && ui.summary" :title="t('dialogs.summary', dateName(ui.summary.day))" no-close>
    <p v-if="ui.summary.passedOut" class="lack">
      {{ t('dialogs.backpackGearStill', ui.summary.rescued || t('dialogs.collapsed0200Were'), ui.summary.fee ? t('dialogs.medicalFeeG', ui.summary.fee) : t('dialogs.noMedicalFeeDuring')) }}
    </p>
    <ul v-if="ui.summary.notes?.length" class="list news">
      <li v-for="n in ui.summary.notes" :key="n">{{ n }}</li>
    </ul>
    <h3>{{ t('dialogs.shippingIncome') }}</h3>
    <ul class="list">
      <li v-for="l in ui.summary.lines" :key="l.name">{{ l.name }} ×{{ l.n }} <span class="price">+{{ l.gain }}</span></li>
      <li v-if="!ui.summary.lines.length" class="tip">{{ t('dialogs.nothingShippedToday') }}</li>
    </ul>
    <p>{{ t('dialogs.total') }} <b>+{{ ui.summary.total }}</b>{{ t('dialogs.gBalance') }} <b>{{ s.money }}</b></p>
    <ul class="list">
      <li>{{ t('dialogs.grewDayThanksWatering', ui.summary.grew) }}</li>
      <li v-if="ui.summary.died" class="lack">{{ t('dialogs.witheredGoingUnwatered', ui.summary.died) }}</li>
      <li v-if="ui.summary.withered" class="lack">{{ t('dialogs.witheredChangeSeason', ui.summary.withered) }}</li>
      <li>{{ t('dialogs.today', dateName(s.day), weatherName(ui.summary.weather, season(s.day)), ui.summary.weather >= 2 && season(s.day) !== 3 && !(ui.summary.weather === 3 && season(s.day) === 2) ? t('dialogs.fieldsGotGoodSoaking') : '') }}</li>
      <li :class="{ lack: forecast(s).extreme }">{{ t('dialogs.tomorrowNext3Days', forecast(s).tomorrow, forecast(s).extreme ? t('dialogs.warnNote', forecast(s).extreme, EXTREME_TIP[forecast(s).extreme]) : '', forecast(s).trend.join(t('punct.comma'))) }}</li>
      <li :class="{ lack: ui.readOnly || !ui.saveOk }">{{ ui.readOnly ? t('dialogs.readOnlyModeNot') : ui.saveOk ? t('dialogs.autosavedBackupPreviousDay') : t('dialogs.saveFailedPleaseExport') }}</li>
    </ul>
    <div class="actions"><button class="primary" autofocus @click="nextDay">{{ t('dialogs.startNewDay') }}</button></div>
  </Panel>

  <Panel v-else-if="ui.panel === 'pause'" :title="t('dialogs.paused')">
    <div class="actions col">
      <button class="primary" @click="ui.panel = ''">{{ t('dialogs.resume') }}</button>
      <button :disabled="ui.readOnly" @click="g.toast(g.save() ? t('dialogs.saved') : t('dialogs.saveFailed'))">{{ t('dialogs.save') }}</button>
      <button @click="exportSave(s)">{{ t('dialogs.exportSaveFile') }}</button>
      <button @click="ui.panel = 'settings'">{{ t('common.settings') }}</button>
      <button @click="ui.panel = 'help'">{{ t('dialogs.controls') }}</button>
      <button @click="g.stop()">{{ t('dialogs.saveBackTitle') }}</button>
      <button v-if="!ui.saveOk && !ui.readOnly" class="danger" @click="g.stop(true)">{{ t('dialogs.discardUnsavedProgressBack') }}</button>
    </div>
    <p v-if="!ui.saveOk && !ui.readOnly" class="lack">{{ t('dialogs.lastSaveFailedPlease') }}</p>
    <p class="tip">{{ t('dialogs.rendererGameAutosavesEvery', g.r.backend) }}</p>
  </Panel>

  <Panel v-else-if="ui.panel === 'help'" :title="t('dialogs.controls')">
    <table v-if="ui.touch" class="keys">
      <tr><td>{{ t('touch.tapGround') }}</td><td>{{ t('touch.tapGroundDo') }}</td></tr>
      <tr><td>{{ t('touch.tapThing') }}</td><td>{{ t('touch.tapThingDo') }}</td></tr>
      <tr><td>{{ t('touch.tapNear') }}</td><td>{{ t('touch.tapNearDo') }}</td></tr>
      <tr><td>{{ t('touch.holdNear') }}</td><td>{{ t('touch.holdNearDo') }}</td></tr>
      <tr><td>{{ t('touch.holdDrag') }}</td><td>{{ t('touch.holdDragDo') }}</td></tr>
      <tr><td>{{ t('touch.pinch') }}</td><td>{{ t('touch.pinchDo') }}</td></tr>
      <tr><td>{{ t('common.fishingRod') }}</td><td>{{ t('touch.rodDo') }}</td></tr>
      <tr><td>{{ t('common.sword') }}</td><td>{{ t('touch.weaponDo') }}</td></tr>
      <tr><td>{{ t('touch.hotbarRow') }}</td><td>{{ t('touch.hotbarDo') }}</td></tr>
      <tr><td>{{ t('touch.buttons') }}</td><td>{{ t('touch.buttonsDo') }}</td></tr>
    </table>
    <table v-else class="keys">
      <tr><td>WASD</td><td>{{ t('dialogs.moveShiftSprint') }}</td></tr>
      <tr><td>{{ t('dialogs.leftClick') }}</td><td>{{ t('dialogs.useHotbarToolItem') }}</td></tr>
      <tr><td>{{ t('dialogs.rightClick') }}</td><td>{{ t('dialogs.clickTileAutoWalk') }}</td></tr>
      <tr><td>{{ t('dialogs.holdLeftClick') }}</td><td>{{ t('dialogs.chargeUpgradedHoeWatering') }}</td></tr>
      <tr><td>{{ t('dialogs.n190') }}</td><td>{{ t('dialogs.switchHotbarSlot10') }}</td></tr>
      <tr><td>F</td><td>{{ t('dialogs.interactTalkGiveGifts') }}</td></tr>
      <tr><td>E</td><td>{{ t('dialogs.eatSelectedFoodMedicine') }}</td></tr>
      <tr><td>{{ t('dialogs.winterDeepMines') }}</td><td>{{ t('dialogs.getsColdOutdoorsWarm') }}</td></tr>
      <tr><td>{{ t('common.fishingRod') }}</td><td>{{ t('dialogs.faceWaterHoldLeft') }}</td></tr>
      <tr><td>{{ t('common.sword') }}</td><td>{{ t('dialogs.leftClickSwingPress') }}</td></tr>
      <tr><td>B / K / L / P / C / M</td><td>{{ t('dialogs.backpackSkillsQuestsVillagers') }}</td></tr>
      <tr><td>{{ t('dialogs.menus') }}</td><td>{{ t('dialogs.tabShiftTabMove') }}</td></tr>
      <tr><td>{{ t('dialogs.qRMouseWheel') }}</td><td>{{ t('dialogs.rotateCamera90Zoom') }}</td></tr>
      <tr><td>Esc</td><td>{{ t('dialogs.closePanelPause') }}</td></tr>
    </table>
    <p class="tip">{{ t('dialogs.questsGuideWhatNext') }}</p>
    <div class="actions"><button class="primary" @click="ui.panel = ''">{{ t('dialogs.got') }}</button></div>
  </Panel>
</template>
