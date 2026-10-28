<script setup lang="ts">
import { ref } from 'vue'
import { ITEMS, TOOL_TIER, TOOLS, type ToolId } from '../content/content.ts'
import type { Slot } from '../core/state.ts'
import { game } from '../game.ts'
import { itemName } from '../core/actions.ts'
import { t } from '../core/i18n.ts'

const props = defineProps<{ sl?: Slot | null; tool?: ToolId; tier?: number; sel?: boolean; label?: string | number }>()
const TIERS = ['base', 'copper', 'iron', 'alloy']
const broken = ref('') // 加载失败的图标地址（换物品后自动恢复）
// 工具物品按当前等级显示图标
const tool = () => props.tool ?? (props.sl ? ITEMS[props.sl.id].tool : undefined)
const tier = () => Math.max(0, props.tier ?? (tool() ? game?.s.tools[tool()!] ?? 0 : 0))
const icon = () => (tool() === 'rod' ? '/assets/icons/rod_basic.png' : tool() ? `/assets/icons/tool_${tool()}_${TIERS[tier()]}.png` : props.sl ? `/assets/icons/${props.sl.id}.png` : '')
const title = () =>
  tool() ? (tool() === 'rod' ? TOOLS.rod.name : t('fmt.pair', TOOL_TIER[tier()], TOOLS[tool()!].name)) : props.sl ? itemName(props.sl) : ''
</script>

<template>
  <div class="slot" :class="{ sel }" :title="title()">
    <span v-if="label !== undefined" class="key">{{ label }}</span>
    <template v-if="tool() || sl">
      <img v-if="broken !== icon()" :key="icon()" class="icon" :src="icon()" :alt="title()" draggable="false" @error="broken = icon()" />
      <span v-else class="glyph">{{ tool() ? TOOLS[tool()!].icon : ITEMS[sl!.id].name[0] }}</span>
      <b v-if="sl && sl.n > 1" class="n">{{ sl.n }}</b>
      <i v-if="sl?.q" class="q" :class="'q' + sl.q" aria-hidden="true">★</i>
      <i v-if="sl?.b" class="bought" :title="t('slot.storeBoughtCantUsed')">{{ t('slot.boughtMark') }}</i>
    </template>
  </div>
</template>
