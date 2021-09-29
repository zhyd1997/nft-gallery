 <template>
  <div class="wrapper section no-padding-desktop gallery-item mb-6">
    <div class="container">
      <b-message type="is-primary" v-if="message">
        <div class="columns">
          <div class="column is-four-fifths">
            <p class="title is-3 has-text-black">{{ $t("mint.success") }} 🎉</p>
            <p class="subtitle is-size-5 has-text-black">
              {{ $t("mint.shareWithFriends", [nft.name]) }} △
            </p>
          </div>
          <div class="column">
            <Sharing onlyCopyLink />
          </div>
        </div>
      </b-message>
      <div class="columns">
        <div class="image-wrapper">
          <button
            id="theatre-view"
            @click="toggleView"
            v-if="!isLoading && imageVisible"
          >
            {{ viewMode === "default" ? $t("theatre") : $t("default") }}
            {{ $t("view") }}
          </button>
          <div
            class="column"
            :class="{
              'is-12': viewMode === 'theatre',
              'is-6 is-offset-3': viewMode === 'default'
            }"
          >
            <div
              class="image-preview has-text-centered"
              :class="{ fullscreen: isFullScreenView }"
            >
              <b-image
                v-if="!isLoading && imageVisible && !meta.animation_url"
                :src="meta.image || '/koda300x300.svg'"
                :src-fallback="'/koda300x300.svg'"
                alt="KodaDot NFT minted multimedia"
                ratio="1by1"
              ></b-image>
              <img
                class="fullscreen-image"
                :src="meta.image || '/koda300x300.svg'"
                alt="KodaDot NFT minted multimedia"
              />
              <b-skeleton
                height="524px"
                size="is-large"
                :active="isLoading"
              ></b-skeleton>
              <MediaResolver
                v-if="meta.animation_url"
                :class="{ withPicture: imageVisible }"
                :src="meta.animation_url"
                :mimeType="mimeType"
              />
            </div>
          </div>
          <button
            id="fullscreen-view"
            @keyup.esc="minimize"
            @click="toggleFullScreen"
            v-if="!isLoading && imageVisible"
            :class="{ fullscreen: isFullScreenView }"
          >
            <b-icon :icon="isFullScreenView ? 'compress-alt' : 'arrows-alt'">
            </b-icon>
          </button>
        </div>
      </div>
      <div class="columns">
        <div class="column is-6">
          <div class="nft-title">
            <Name :nft="nft" :isLoading="isLoading" />
          </div>

          <p class="label">
            {{ $t("legend") }}
          </p>

          <div class="sub-title is-size-6">
            <p v-if="!isLoading">
              {{ meta.description }}
              <CollapseWrapper
                v-if="attributes && attributes.length"
                visible="attribute.show"
                hidden="attribute.hide"
              >
                <div v-for="(attr, index) in attributes" :key="index">
                  <span class="text-bold">{{ attr.key }}: </span
                  ><span>{{ attr.value }}</span>
                </div>
              </CollapseWrapper>
            </p>
            <b-skeleton
              :count="3"
              size="is-large"
              :active="isLoading"
            ></b-skeleton>
          </div>
        </div>
        <div class="column is-3 is-offset-3" v-if="detailVisible">
          <b-skeleton
            :count="2"
            size="is-large"
            :active="isLoading"
          ></b-skeleton>
          <div class="price-block" v-if="hasPrice">
            <div class="price-block__original">
              <Money :value="nft.price" inline />
            </div>
            <div class="label">{{ $t("price") }}</div>
            <div class="subtitle is-size-6" v-if="royalty">
              ⊃ royalty <b><Percent :value="royalty" inline/></b>
            </div>
          </div>

          <template v-if="detailVisible && !nft.burned">
            <!-- <PackSaver v-if="accountId" :accountId="accountId" :currentOwnerId="nft.currentOwner" :nftId="nft.id" /> -->
            <b-collapse
              class="card mb-4"
              animation="slide"
              aria-id="contentIdForA11y3"
              :open="false"
            >
              <template #trigger="props">
                <div
                  class="card-header"
                  role="button"
                  aria-controls="contentIdForA11y3"
                >
                  <p class="card-header-title">
                    {{ $t("actions") }}
                  </p>
                  <a class="card-header-icon">
                    <b-icon :icon="props.open ? 'chevron-up' : 'chevron-down'">
                    </b-icon>
                  </a>
                </div>
              </template>
              <div class="card-content">
                <div class="content">
                  <p class="subtitle">
                    <Auth />
                    <AvailableActions
                      :accountId="accountId"
                      :currentOwnerId="nft.currentOwner"
                      :price="nft.price"
                      :nftId="itemId"
                      :delegateId="nft.delegate"
                      :collectionId="id"
                      :ipfsHashes="[nft.image, nft.animation_url, nft.metadata]"
                      :frozen="nft.frozen"
                      @change="loadMagic"
                    />
                  </p>
                </div>
              </div>
            </b-collapse>
          </template>

          <Sharing />
          <br />
          <template v-if="detailVisible">
            <Facts :nft="nft" :meta="meta" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" >
import { Component, Mixins, Vue } from 'vue-property-decorator';
import { UniqueNFT as NFT, NFTMetadata } from '../service/scheme';
import { sanitizeIpfsUrl, resolveMedia } from '../utils';
import { emptyObject } from '@/utils/empty';

import { notificationTypes, showNotification } from '@/utils/notification';
import { Option } from '@polkadot/types';
import isShareMode from '@/utils/isShareMode';
import { fetchNFTMetadata } from '../utils';
import { get, set } from 'idb-keyval';
import { MediaType } from '../types';
import axios from 'axios';
import Connector from '@vue-polkadot/vue-api';
import { BalanceOf, InstanceDetails, InstanceMetadata } from '@polkadot/types/interfaces';
import SubscribeMixin from '@/utils/mixins/subscribeMixin';
import nftById from '@/queries/bsx/nftById.graphql';
import { createTokenId } from '@/components/nft/utils';

@Component<GalleryItem>({
  metaInfo() {
    const image = `https://og-image-green-seven.vercel.app/${encodeURIComponent(
      this.nft.name as string
    )}.png?price=${
      Number(this.nft.price)
        ? Vue.filter('formatBalance')(this.nft.price, 12, 'KSM')
        : ''
    }&image=${this.meta.image as string}`;
    return {
      title: this.nft.name,
      titleTemplate: '%s | Low Carbon NFTs',
      meta: [
        { name: 'description', content: this.meta.description as string },
        { property: 'og:title', content: this.nft.name as string },
        {
          property: 'og:description',
          content: this.meta.description as string
        },
        { property: 'og:image', content: image },
        { property: 'og:video', content: this.meta.image as string },
        { property: 'og:author', content: this.nft.currentOwner as string },
        { property: 'twitter:title', content: this.nft.name as string },
        {
          property: 'twitter:description',
          content: this.meta.description as string
        },
        { property: 'twitter:image', content: image }
      ]
    };
  },
  components: {
    Auth: () => import('@/components/shared/Auth.vue'),
    AvailableActions: () => import('./AvailableActions.vue'),
    Facts: () => import('@/components/rmrk/Gallery/Item/Facts.vue'),
    Money: () => import('@/components/shared/format/Money.vue'),
    Percent: () => import('@/components/shared/format/Percent.vue'),
    Name: () => import('@/components/rmrk/Gallery/Item/Name.vue'),
    Sharing: () => import('@/components/rmrk/Gallery/Item/Sharing.vue'),
    Appreciation: () => import('./Appreciation.vue'),
    MediaResolver: () => import('../Media/MediaResolver.vue'),
    CollapseWrapper: () => import('@/components/shared/collapse/CollapseWrapper.vue'),
  }
})
export default class GalleryItem extends Mixins(SubscribeMixin) {
  private id: string = '';
  private nftId: string | number = '';
  private passsword: string = '';
  private nft: any = emptyObject<NFT>();
  private imageVisible: boolean = true;
  private viewMode: string = 'default';
  private isFullScreenView: boolean = false;
  public isLoading: boolean = true;
  public mimeType: string = '';
  public meta: NFTMetadata = emptyObject<NFTMetadata>();
  public message: string = '';
  protected itemId: string = '';

  get accountId() {
    return this.$store.getters.getAuthAddress;
  }

  public async created() {
    this.checkId();
    this.fetchCollection();
    setTimeout(() => {
      this.loadMagic();
      const { api } = Connector.getInstance();
      this.subscribe(
        api.query.uniques.asset,
        [this.id, this.itemId],
        this.observeOwner
      );
      this.subscribe(
        api.query.marketplace.tokenPrices,
        [this.id, this.itemId],
        this.observePrice
      );
    }, 1000);
  }

  observePrice(data: Option<BalanceOf>) {
    const instance = data.unwrapOr(null);
    this.$set(this.nft, 'price', instance?.toString());
  }

  protected observeOwner(data: Option<InstanceDetails>) {
    console.log(data.toHuman());
    const instance = data.unwrapOr(null);
    if (instance) {
      this.$set(this.nft, 'currentOwner', instance.owner.toHuman());
      this.$set(this.nft, 'delegate', instance.approved.toHuman());
      console.log('isFreezed', instance.isFrozen);
      this.$set(this.nft, 'frozen', instance.isFrozen.eq(true));
    } else {
      // check if not burned because burned returns null
      this.nft = emptyObject<NFT>();
    }
  }

  public async loadMagic() {
    const { api } = Connector.getInstance();
    await api?.isReady;

    try {
      console.log('loading magic', this.itemId);
      const nftId = this.itemId || 0;
      this.nftId = nftId;

      const nftQ = await api.query.uniques
        .instanceMetadataOf<Option<InstanceMetadata>>(this.id, nftId)
        .then(res => res.unwrapOr(null));

      if (!nftQ) {
        showNotification(`No NFT with ID ${nftId}`, notificationTypes.warn);
        return;
      }

      const nftData = nftQ.toHuman();

      if (!nftData.data) {
        showNotification(
          `No Metadata with ID ${nftId}`,
          notificationTypes.warn
        );
        return;
      }

      const nft = await fetchNFTMetadata({ metadata: nftData.data.toString() });

      this.meta = {
        ...nft,
        image: sanitizeIpfsUrl(nft.image || '')
      };

      this.nft = {
        ...this.nft,
        ...nft,
        ...nftData,
        collectionId: this.id,
      };
    } catch (e) {
      showNotification(`${e}`, notificationTypes.warn);
      console.warn(e);
    }

    this.isLoading = false;
  }

  private async fetchCollection() {
    const nft = await this.$apollo.query({
      query: nftById,
      variables: {
        id: createTokenId(this.id, this.itemId)
      }
    });

    const {
      data: { nFTEntity }
    } = nft;

    if (!nFTEntity) {
      return;
    }

    this.nft = {
      ...this.nft,
      ...nFTEntity
    };
  }

  public async fetchMetadata() {
    console.log(this.nft.emotes);

    if (this.nft['metadata'] && !this.meta['image']) {
      const m = await get(this.nft.metadata);
      const meta = m ? m : await fetchNFTMetadata(this.nft);
      this.meta = {
        ...meta,
        image: sanitizeIpfsUrl(meta.image || ''),
        animation_url: sanitizeIpfsUrl(meta.animation_url || '', 'pinata')
      };

      console.log(this.meta);
      if (this.meta.animation_url && !this.mimeType) {
        const { headers } = await axios.head(this.meta.animation_url);
        this.mimeType = headers['content-type'];
        console.log(this.mimeType);
        const mediaType = resolveMedia(this.mimeType);
        this.imageVisible = ![
          MediaType.VIDEO,
          MediaType.MODEL,
          MediaType.IFRAME,
          MediaType.OBJECT
        ].some(t => t === mediaType);
      }

      if (!m) {
        set(this.nft.metadata, meta);
      }
    }
  }

  public checkId() {
    if (this.$route.params.id && this.$route.params.item) {
      this.id = this.$route.params.id;
      this.itemId = this.$route.params.item;
    }
  }

  public toggleView(): void {
    this.viewMode = this.viewMode === 'default' ? 'theatre' : 'default';
  }

  public toggleFullScreen(): void {
    this.isFullScreenView = !this.isFullScreenView;
  }

  public minimize(): void {
    this.isFullScreenView = false;
  }

  public toast(message: string): void {
    this.$buefy.toast.open(message);
  }

  get hasPrice() {
    return true;
  }

  get royalty() {
    return this.nft?.attributes?.find((e: any) => e.key === 'royalty')?.value;
  }

  get attributes() {
    return this.nft?.attributes || [];
  }

  get detailVisible() {
    return !isShareMode;
  }

  protected handleAction(deleted: boolean) {
    if (deleted) {
      showNotification(`INSTANCE REMOVED`, notificationTypes.warn);
    }
  }
}
</script>

<style lang="scss">
@import "@/styles/variables";

hr.comment-divider {
  border-top: 1px solid lightcoral;
  border-bottom: 1px solid lightcoral;
}

.gallery-item {
  .nft-title {
    margin-bottom: 24px;
  }

  .gallery-item__skeleton {
    width: 95%;
    margin: auto;
  }

  .image-wrapper {
    position: relative;
    margin: 30px auto;
    width: 100%;

    .image {
      border: 2px solid $primary;
    }

    .fullscreen-image {
      display: none;
    }

    .image-preview {
      &.fullscreen {
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 999998;
        background: #000;

        img.fullscreen-image {
          display: block;
          width: 100% !important;
          height: auto !important;
          overflow: auto;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, 0);
        }

        .image {
          visibility: hidden;
        }
      }
    }

    .column {
      transition: 0.3s all;
    }

    button {
      border: 2px solid $primary;
      color: #fff;
      font-weight: bold;
      text-transform: uppercase;
      padding: 7px 16px;
      font-size: 20px;
      background: $scheme-main;
      z-index: 2;

      &:hover {
        background: $primary;
        cursor: pointer;
      }
    }
  }

  button#theatre-view {
    position: absolute;
    top: 13px;
    left: 13px;
    @media screen and (max-width: 768px) {
      display: none;
    }
  }

  button#fullscreen-view {
    position: absolute;
    bottom: 13px;
    right: 13px;

    &.fullscreen {
      position: fixed;
      z-index: 999998;
      bottom: 0;
      right: 0;
    }
  }

  .price-block {
    border: 2px solid $primary;
    padding: 14px;

    &__original {
      color: $scheme-invert;
      font-size: 24px;
      text-transform: uppercase;
      font-weight: 500;
    }

    &__exchange {
      opacity: 0.6;
      color: $dark;
      margin: 0;
    }
  }

  .card {
    border-radius: 0 !important;
    box-shadow: none;
    border: 2px solid $primary;

    &-header {
      border-radius: 0;
      position: relative;

      &:before {
        content: "";
        width: 100%;
        height: 2px;
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        background: $primary;
      }

      &-title {
        color: $scheme-invert;
      }
    }

    &-footer {
      border-radius: none;
      border-top: none;

      &-item:not(:last-child) {
        border-right-color: $primary;
      }
    }
  }

  &.no-padding-desktop {
    @media screen and (min-width: 1023px) {
      padding: 0;
    }
  }
}
</style>
