<template>
  <div>
    <Loader v-model="isLoading" :status="status" />
    <div v-if="accountId" class="buttons">
      <b-button v-for="action in actions" :key="action" :type="iconType(action)[0]"
      outlined
      expanded
      @click="handleAction(action)">
        {{ action }}
      </b-button>
    </div>
    <component class="mb-4" v-if="showMeta" :is="showMeta" @input="updateMeta" emptyOnError />
    <b-button
      v-if="showSubmit"
      type="is-primary"
      icon-left="paper-plane"
      @click="submit"
    >
      Submit {{ selectedAction }}
    </b-button>
  </div>
</template>

<script lang="ts" >
import { Component, Mixins, Prop} from 'vue-property-decorator';
import Connector from '@vue-polkadot/vue-api';
import exec, { execResultValue, txCb } from '@/utils/transactionExecutor';
import { notificationTypes, showNotification } from '@/utils/notification';
import { unpin } from '@/proxy';
import RmrkVersionMixin from '@/utils/mixins/rmrkVersionMixin';
import shouldUpdate from '@/utils/shouldUpdate';
import nftById from '@/queries/nftById.graphql';
import Null from '@/params/components/Null.vue';

const ownerActions = ['SEND', 'CONSUME', 'DELEGATE', 'FREEZE'];
const buyActions: string[] = [];
const delegatorActions: string[] = ['SEND'];

const needMeta: Record<string, string> = {
  SEND: 'AddressInput',
  DELEGATE: 'AddressInput',
};

type DescriptionTuple = [string, string] | [string];
const iconResolver: Record<string, DescriptionTuple> = {
  SEND: ['is-info is-dark'],
  CONSUME: ['is-danger'],
  DELEGATE: ['is-light'],
  BUY: ['is-success is-dark'],
  FREEZE: ['is-warning is-dark'],
};

const actionResolver: Record<string, [string, string]> = {
  SEND: ['uniques','transfer'],
  CONSUME: ['uniques','burn'],
  DELEGATE: ['uniques','approveTransfer'],
  FREEZE: ['uniques','freeze'],
  THAW: ['uniques','thaw'],
  REVOKE: ['uniques','cancelApproval'],
  // LIST: ['is-light'],
  // BUY: ['is-success is-dark']
};

type Action = 'SEND' | 'CONSUME' | 'FREEZE' | 'DELEGATE' | '';

const components = {
  AddressInput: () => import('@/components/shared/AddressInput.vue'),
  Loader: () => import('@/components/shared/Loader.vue')
};

@Component({ components })
export default class AvailableActions extends Mixins(RmrkVersionMixin) {
  @Prop(String) public currentOwnerId!: string;
  @Prop(String) public accountId!: string;
  @Prop({ type: [String, Null] }) public delegateId!: string;
  @Prop() public price!: string;
  @Prop(String) public nftId!: string;
  @Prop(String) public collectionId!: string;
  @Prop({ type: Array, default: () => [] }) public ipfsHashes!: string[];
  private selectedAction: Action = '';
  private meta: string | number = '';
  protected isLoading: boolean = false;
  protected status = ''

  get actions() {
    if (this.isOwner) {
      return ownerActions;
    }

    if (this.isDelegator) {
      return delegatorActions;
    }

    return [];
  }

  get showSubmit() {
    return this.selectedAction && (!this.showMeta || this.metaValid);
  }

  get metaValid() {
    if (typeof this.meta === 'number') {
      return this.meta >= 0;
    }

    return this.meta;
  }

  get showMeta() {
    return needMeta[this.selectedAction];
  }

  protected iconType(value: string) {
    return iconResolver[value];
  }

  protected handleAction(action: Action) {
    if (shouldUpdate(action,  this.selectedAction)) {
      this.selectedAction = action;
    } else {
      this.selectedAction = '';
      this.meta = '';
    }
  }

  get isDelegator() {
    return (
      this.delegateId &&
      this.accountId &&
      this.delegateId === this.accountId
    );
  }

  get isOwner() {
    console.log(
      '{ currentOwnerId, accountId }',
      this.currentOwnerId,
      this.accountId
    );

    return (
      this.currentOwnerId &&
      this.accountId &&
      this.currentOwnerId === this.accountId
    );
  }

  get isAvailableToBuy() {
    const { price, accountId } = this;
    return accountId && Number(price) > 0;
  }

  private handleSelect(value: Action) {
    this.selectedAction = value;
    this.meta = '';
  }

  private constructRmrk(): string {
    const { selectedAction, version, meta, nftId } = this;
    return `RMRK::${selectedAction}::${version}::${nftId}${
      this.metaValid ? '::' + meta : ''
    }`;
  }

  get isFreeze() {
    return this.selectedAction === 'FREEZE';
  }

  get isConsume() {
    return this.selectedAction === 'CONSUME';
  }

  get isDelegate() {
    return this.selectedAction === 'DELEGATE';
  }

  get isSend() {
    return this.selectedAction === 'SEND';
  }

  protected updateMeta(value: string | number) {
    console.log(typeof value, value);
    this.meta = value;
  }

  protected async checkBuyBeforeSubmit() {
    const nft = await this.$apollo.query({
        query: nftById,
        variables: {
          id: this.nftId
        },
      })

      const { data: {nFTEntity} } = nft;

      if (nFTEntity.currentOwner !== this.currentOwnerId || nFTEntity.burned || nFTEntity.price === 0 || nFTEntity.price !== this.price ) {
        showNotification(
          `[RMRK::${this.selectedAction}] Owner changed or NFT does not exist`,
          notificationTypes.warn
        );
        throw new ReferenceError('NFT has changed')
      }

  }

  protected async submit() {
    const { api } = Connector.getInstance();
    this.isLoading = true;

    try {
      showNotification(`[${this.selectedAction}] ${this.nftId}`);

      const action = actionResolver[this.selectedAction];
      if (!action || !this.collectionId) {
        throw new EvalError('Action or Collection not found');
      }

      const [section, method] = action;

      const cb =  api.tx[section][method]
      const arg = this.getArgs()

      const tx = await exec(this.accountId, '', cb, arg, txCb(
        async (blockHash) => {
          execResultValue(tx);
          showNotification(blockHash.toString(), notificationTypes.info);
          if (this.isConsume) {
            this.unpinNFT();
          }

          showNotification(
            `[${this.selectedAction}] ${this.nftId}`,
            notificationTypes.success
          );
          this.selectedAction = '';
          this.isLoading = false;
        },
        err => {
          execResultValue(tx);
          showNotification(`[ERR] ${err.hash}`, notificationTypes.danger);
          this.selectedAction = '';
          this.isLoading = false;
        },
        res => {
          if (res.status.isReady) {
            this.status = 'loader.casting'
            return;
          }

          if (res.status.isInBlock) {
            this.status = 'loader.block'
            return;
          }

          if (res.status.isFinalized) {
            this.status = 'loader.finalized'
            return;
          }

          this.status = ''
        }
      ));

    } catch (e) {
      showNotification(`[ERR] ${e}`, notificationTypes.danger);
      console.error(e);
      this.isLoading = false;
    }
  }
  getArgs() {
    const { selectedAction } = this;

    switch (selectedAction) {
      case 'FREEZE':
        throw [this.collectionId, this.nftId];
      case 'CONSUME':
        return [this.collectionId, this.nftId, this.accountId];
      case 'DELEGATE':
        return [this.collectionId, this.nftId, this.meta];
      case 'SEND':
        return [this.collectionId, this.nftId, this.meta];
      default:
        throw new Error('Action not found');
    }
  }

  protected unpinNFT() {
    this.ipfsHashes.forEach(async hash => {
      if (hash) {
        try {
          await unpin(hash);
        } catch (e) {
          console.warn(`[ACTIONS] Cannot Unpin ${hash} because: ${e}`);
        }
      }
    });
  }

}
</script>

