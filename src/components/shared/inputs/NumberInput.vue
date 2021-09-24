<template>
  <b-field :grouped="hasAddition" :label="$i18n.t(label)">
    <b-numberinput
      v-model="model"
      :placeholder="placeholder"
      expanded
      :min="min"
      :max="max"
    ></b-numberinput>
    <slot />
  </b-field>
</template>

<script lang="ts" >
import { Component, Prop, VModel, Vue } from 'vue-property-decorator';

@Component({})
export default class NumberInput extends Vue {
  @VModel({ type: Number }) model!: number;
  @Prop({ type: Number, default: 0 }) protected min!: string;
  @Prop({ type: Number, default: 100 }) protected max!: string;
  @Prop({ type: String, default: 'input.slider' }) protected label!: string;

  formatter(value: number) {
    return value + '%';
  }

  get placeholder() {
    return `${this.min} is minimum`;
  }

  get hasAddition() {
    return this.$slots.default !== undefined;
  }
}
</script>
