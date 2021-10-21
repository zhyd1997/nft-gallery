import { CollectionType } from './types';

type Id = string | number;

export enum NFTAction {
  SEND='SEND',
  CONSUME='CONSUME',
  BUY='BUY',
  LIST='LIST',
  OFFER='OFFER',
  ACCEPT='ACCEPT',
  UNLIST='UNLIST',
  SETPRICE='SETPRICE',
  WITHDRAW='WITHDRAW',
  NONE='',
}

export const actionResolver: Record<NFTAction, [string, string]> = {
  SEND: ['nft','transfer'],
  CONSUME: ['nft','burn'],
  BUY: ['marketplace','buy'],
  LIST: ['marketplace', 'setPrice'],
  OFFER: ['marketplace', 'makeOffer'],
  ACCEPT: ['marketplace', 'acceptOffer'],
  UNLIST: ['marketplace', 'unlist'],
  SETPRICE: ['marketplace', 'setPrice'],
  WITHDRAW: ['marketplace', 'withdrawOffer'],
  '': ['',''],
}

type CollectionTypeParam = { [x: string]: null }

class NFTUtils {
  static createCollection(collectionType: CollectionType, metadata: string): [CollectionTypeParam, string] {
    return [{ [collectionType]: null }, metadata]
  }

  static createNFT(classId: Id, metadata: string): [string, string]  {
    return [String(classId), metadata]
  }

  static getActionParams(selectedAction: NFTAction, classId: Id, id: Id, meta: string[] = []): Id[] {
    switch (selectedAction) {
    case NFTAction.SEND:
    case NFTAction.LIST:
      return [classId, id, ...meta]
    case NFTAction.ACCEPT:
    case NFTAction.BUY:
    case NFTAction.UNLIST:
    case NFTAction.WITHDRAW:
    case NFTAction.CONSUME:
      return [classId, id]
    default:
      throw new Error('Action not found')
    }
  }

  static apiCall(selectedAction: NFTAction): [string, string] {
    return actionResolver[selectedAction] || new Error('Action not found')

  }

  static correctMeta(selectedAction: NFTAction, meta: string, secondMeta: string): string[] {
    switch (selectedAction) {
    case NFTAction.SEND:
    case NFTAction.LIST:
      return [meta]
    case NFTAction.CONSUME:
    case NFTAction.BUY:
      return [meta, secondMeta]
    default:
      return []
    }
  }
}



export default NFTUtils
