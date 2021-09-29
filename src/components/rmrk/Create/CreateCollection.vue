<template>
  <div>
    <Loader v-model="isLoading" :status="status" />
    <div class="box">
      <p class="title is-size-3">
        {{ $t("context") }}
      </p>
      <p class="subtitle is-size-7">{{ $t("using") }} {{ version }}</p>
      <b-field>
        <div>
          {{ $t("computed id") }}: <b>{{ rmrkId }}</b>
        </div>
      </b-field>
      <b-field>
        <Auth />
      </b-field>

      <MetadataUpload
        v-model="image"
        label="Drop collection logo here or click to upload or simple paste image from clipboard. We support various media types (PNG, JPEG, GIF, SVG)"
        expanded
        preview
        accept="image/png, image/jpeg, image/gif, image/svg+xml, image/svg"
      />

      <b-field grouped :label="$i18n.t('Name')">
        <b-input
          placeholder="Name your collection"
          v-model="rmrkMint.name"
          expanded
          class="mr-0"
          spellcheck="true"
        ></b-input>
        <Tooltip iconsize="is-medium" :label="$i18n.t('tooltip.name')" />
      </b-field>
      <b-field>
        <b-switch v-model="unlimited" :rounded="false">
          {{ $t("mint.unlimited") }}
        </b-switch>
      </b-field>
      <b-field v-if="!unlimited" :label="$i18n.t('Maximum NFTs in collection')">
        <b-numberinput
          v-model="rmrkMint.max"
          placeholder="1 is minumum"
          :min="1"
        ></b-numberinput>
      </b-field>
      <b-field grouped :label="$i18n.t('Symbol')" class="mb-0">
        <b-input
          placeholder="3-5 character long name"
          maxlength="10"
          @keydown.native.space.prevent
          v-model="rmrkMint.symbol"
          expanded
          class="mr-0"
        ></b-input>
        <Tooltip iconsize="is-medium" :label="$i18n.t('tooltip.symbol')" />
      </b-field>
      <b-field :label="$i18n.t('Collection description')" class="mb-0">
        <b-input
          v-model="meta.description"
          maxlength="500"
          type="textarea"
          placeholder="Describe your collection"
          spellcheck="true"
        ></b-input>
      </b-field>
      <b-field>
        <PasswordInput v-model="password" :account="accountId" />
      </b-field>
      <b-field>
        <b-button
          type="is-primary"
          icon-left="paper-plane"
          @click="submit"
          :disabled="disabled"
          :loading="isLoading"
          outlined
        >
          {{ $t("create collection") }}
        </b-button>
      </b-field>
      <b-field>
        <Support v-model="hasSupport" :price="filePrice" />
      </b-field>
    </div>
  </div>
</template>

<script lang="ts" >
import { Component, Mixins } from 'vue-property-decorator';
import { emptyObject } from '@/utils/empty';

import Connector from '@vue-polkadot/vue-api';
import exec, { execResultValue, txCb } from '@/utils/transactionExecutor';
import { notificationTypes, showNotification } from '@/utils/notification';
import SubscribeMixin from '@/utils/mixins/subscribeMixin';
import RmrkVersionMixin from '@/utils/mixins/rmrkVersionMixin';
import { Collection, CollectionMetadata } from '../service/scheme';
import { unSanitizeIpfsUrl } from '@/utils/ipfs';
import { pinFile, pinJson, pinFileDirect } from '@/proxy';
import { decodeAddress } from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';
import { generateId } from '@/components/rmrk/service/Consolidator';
import { supportTx, calculateCost } from '@/utils/support';
import NFTUtils from '@/components/bsx/NftUtils'
import TransactionMixin from '@/utils/mixins/txMixin';
import existingCollectionList from '@/queries/bsx/existingCollectionList.graphql'

const components = {
  Auth: () => import('@/components/shared/Auth.vue'),
  MetadataUpload: () => import('./DropUpload.vue'),
  PasswordInput: () => import('@/components/shared/PasswordInput.vue'),
  Tooltip: () => import('@/components/shared/Tooltip.vue'),
  Support: () => import('@/components/shared/Support.vue'),
  Loader: () => import('@/components/shared/Loader.vue'),
};

@Component({ components })
export default class CreateCollection extends Mixins(
  SubscribeMixin,
  RmrkVersionMixin,
  TransactionMixin
) {
  private rmrkMint: Collection = emptyObject<Collection>();
  private meta: CollectionMetadata = emptyObject<CollectionMetadata>();
  // private accountId: string = '';
  private uploadMode: boolean = true;
  private image: Blob | null = null;
  private password: string = '';
  private hasSupport: boolean = true;
  protected unlimited: boolean = true;

  get accountId() {
    return this.$store.getters.getAuthAddress;
  }

  get rmrkId(): string {
    return generateId(this.accountId, this.rmrkMint?.symbol || '');
  }

  get accountIdToPubKey() {
    return (this.accountId && u8aToHex(decodeAddress(this.accountId))) || '';
  }

  get disabled(): boolean {
    const { name, symbol, max } = this.rmrkMint;
    return !(name && symbol && (this.unlimited || max) && this.accountId && this.image);
  }

  get filePrice() {
    return calculateCost(this.image);
  }

  public async constructMeta() {
    if (!this.image) {
      throw new ReferenceError('No file found!');
    }

    this.meta = {
      ...this.rmrkMint,
      ...this.meta,
      attributes: [],
      external_url: `https://bsx.kodadot.xyz`
    };

    // TODO: upload image to IPFS
    const imageHash = await pinFileDirect(this.image);
    this.meta.image = unSanitizeIpfsUrl(imageHash);
    // TODO: upload meta to IPFS
    const metaHash = await pinJson(this.meta);

    return unSanitizeIpfsUrl(metaHash);
  }

  protected async canSupport() {
    if (this.hasSupport && this.image) {
      return [await supportTx(this.image)];
    }

    return [];
  }

  protected async generateNewCollectionId(): Promise<number> {
    const [...randomNumbers] = window.crypto.getRandomValues(new Uint32Array(10));
    const cols = this.$apollo.query({
      query: existingCollectionList,
      variables: {
        ids: randomNumbers.map(String)
      },
    })

    const {
      data: {
        collectionEntities: {
          nodes: collectionList
        }
      }
    } = await cols;

    const existingIds = collectionList.map(({ id }: {id: string}) => id);
    const newId = randomNumbers.find((id) => !existingIds.includes(id));
    return Number(newId);
  }

  protected async submit() {
    this.isLoading = true;
    this.status = 'loader.ipfs';


    try {
      showNotification(`Creating Collection: ${this.rmrkMint.name}`);
      // const metadata = await this.constructMeta();
      const metadata = 'ipfs://ipfs/QmaCWgK91teVsQuwLDt56m2xaUfBCCJLeCsPeJyHEenoES'

      const { api } = Connector.getInstance();
      const cb = api.tx.nft.createClass

      const randomId = await this.generateNewCollectionId();

      const args = NFTUtils.createCollection(randomId, this.accountId, metadata);
      const tx = await exec(
        this.accountId,
        '',
        cb,
        args,
        txCb(
          async blockHash => {
            execResultValue(tx);
            const header = await api.rpc.chain.getHeader(blockHash);
            const blockNumber = header.number.toString();

            showNotification(
              `[Collection] Saved ${this.rmrkMint.name} in block ${blockNumber}`,
              notificationTypes.success
            );

            this.isLoading = false;
          },
          dispatchError => {
            execResultValue(tx);
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                dispatchError.asModule
              );
              const { docs, name, section } = decoded;
              showNotification(
                `[ERR] ${section}.${name}: ${docs.join(' ')}`,
                notificationTypes.danger
              );
            } else {
              showNotification(
                `[ERR] ${dispatchError.toString()}`,
                notificationTypes.danger
              );
            }

            this.isLoading = false;
          },
          res => this.resolveStatus(res.status)
        )
      );
    } catch (e: any) {
      showNotification(`[ERR] ${e}`, notificationTypes.danger);
      console.error(e);
      this.isLoading = false;
    }
  }

}
</script>




