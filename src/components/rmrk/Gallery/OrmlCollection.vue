<template>
  <div class="pack-item-wrapper container">
    <div class="columns">
      <div class="column">
        <h1 class="title is-4">Collection {{ name }}</h1>
      </div>
      <div class="column">
        <p v-if="issuer" class="subtitle">
          Creator
          <ProfileLink :address="issuer" :inline="true" :showTwitter="true" />
        </p>
      </div>
      <div class="column is-2">
        <Sharing
          v-if="sharingVisible"
          label="Check this awesome Collection on %23KusamaNetwork %23KodaDot"
          :iframe="iframeSettings"
        />
      </div>
    </div>

    <GalleryCardList
      :items="nfts"
      type="superDetail"
      :collection="id"
      :formatId="formater"
    />
  </div>
</template>

<script lang="ts" >
import { emptyObject } from '@/utils/empty';
import { cast } from '@/utils/cast';
import { notificationTypes, showNotification } from '@/utils/notification';
import { Component, Vue } from 'vue-property-decorator';
import { fetchCollectionMetadata } from '../utils';
import isShareMode from '@/utils/isShareMode';

import Connector from '@vue-polkadot/vue-api';
import { Option } from '@polkadot/types';
import { UniqueCollection as Collection, NFTWithMeta } from '../service/scheme';
import { ClassMetadata } from '@polkadot/types/interfaces';
import collectionById from '@/queries/bsx/collectionById.graphql';
import { CollectionMetadata } from '@/components/rmrk/service/scheme';
import { tokenIdToRoute } from '@/components/nft/utils';

const components = {
  GalleryCardList: () =>
    import('@/components/rmrk/Gallery/GalleryCardList.vue'),
  Sharing: () => import('@/components/rmrk/Gallery/Item/Sharing.vue'),
  ProfileLink: () => import('@/components/rmrk/Profile/ProfileLink.vue')
};

@Component<OrmlCollection>({
  components
})
export default class OrmlCollection extends Vue {
  private id: string = '';
  private collection: Collection & CollectionMetadata = emptyObject();
  private nfts: NFTWithMeta[] = [];
  private isLoading: boolean = false;
  private formater = tokenIdToRoute;

  get name() {
    return this.collection.name || this.id;
  }

  get issuer() {
    return this.collection.issuer || '';
  }

  get sharingVisible() {
    return !isShareMode;
  }

  public created() {
    this.checkId();
    this.fetchCollection();
    setTimeout(() => {
      this.loadMagic();
      // const { api } = Connector.getInstance();
      // this.subscribe(api.query.uniques.asset, [this.id, this.itemId], this.observeOwner)
    }, 1000);
  }

  private async fetchCollection() {
    const nfts = this.$apollo.query({
      query: collectionById,
      variables: {
        id: this.id
      }
    });

    const {
      data: {
        collectionEntity: {
          nfts: { nodes: nftList },
          ...col
        }
      }
    } = await nfts;

    this.collection = {
      ...col
    };

    this.nfts = nftList;
  }

  public async loadMagic() {
    const { api } = Connector.getInstance();
    await api?.isReady;

    try {
      const collectionQ = await api.query.uniques
        .classMetadataOf<Option<ClassMetadata>>(this.id)
        .then(res => res.unwrapOr(null));

      if (!collectionQ) {
        showNotification(
          `No Collection with ID ${this.id}`,
          notificationTypes.warn
        );
        return;
      }

      const collectionData = collectionQ.toHuman();

      if (!collectionData.data) {
        showNotification(
          `No Metadata with ID ${this.id}`,
          notificationTypes.info
        );
        // return;
        // not a handicap tho
      }

      const collection = await fetchCollectionMetadata({
        metadata: collectionData?.data?.toString()
      });

      this.collection = {
        ...this.collection,
        ...collection,
        attributes: []
      };
    } catch (e) {
      showNotification(`${e}`, notificationTypes.warn);
      console.warn(e);
    }

    this.isLoading = false;
  }

  public checkId() {
    if (this.$route.params.id) {
      this.id = this.$route.params.id;
    }
  }

  get iframeSettings() {
    return { width: '100%', height: '100vh' };
  }
}
</script>
