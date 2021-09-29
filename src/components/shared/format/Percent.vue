<template>
  <div :class="{ 'percent--inline': inline }">
    {{ properValue | toPercent }}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Percent extends Vue {
  @Prop({ default: 0 }) readonly value: number | string | undefined;
  @Prop(Boolean) readonly inline!: boolean;

  get properValue() {
    return this.value ? Number(this.value) : 0
  }
}
</script>

<style lang="scss">
.percent {
  &--inline {
    display: inline-block;
  }
}
</style>
