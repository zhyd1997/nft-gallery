<template>
  <b-tabs type="is-toggle" v-model="selectedAction" size="is-small">
    <b-tab-item label="IPFS" icon="box" value="ipfs"></b-tab-item>
    <b-tab-item label="Skynet" icon="rocket" value="sia"></b-tab-item>
    <b-tab-item label="Permafrost" icon="snowflake" value="ar" disabled></b-tab-item>
  </b-tabs>
</template>

<script lang="ts" >
import { Component, VModel, Vue } from 'vue-property-decorator'

@Component({})
export default class StorageSelector extends Vue {
  @VModel({ type: String, default: 'ipfs' }) selectedAction!: string;
}
</script>
