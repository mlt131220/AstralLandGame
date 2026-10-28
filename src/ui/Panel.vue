<script setup lang="ts">
import { ui } from '../game.ts'
import { t } from '../core/i18n.ts'

defineProps<{ title: string; wide?: boolean; noClose?: boolean }>()
</script>

<template>
  <div class="backdrop" @mousedown.self="!noClose && (ui.panel = '')">
    <section class="panel split" :class="{ wide }" role="dialog" :aria-label="title">
      <header>
        <h2>{{ title }}</h2>
        <button v-if="!noClose" class="x" :aria-label="t('common.close')" @click="ui.panel = ''">×</button>
      </header>
      <div class="panel-body"><slot /></div>
    </section>
  </div>
</template>
