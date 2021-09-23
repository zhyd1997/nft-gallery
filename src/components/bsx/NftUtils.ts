type Id = string | number;

export enum NFTAction {
  SEND='SEND',
  CONSUME='CONSUME',
  BUY='BUY',
  LIST='LIST',
  NONE='',
}

export const actionResolver: Record<NFTAction, [string, string]> = {
  SEND: ['nft','transfer'],
  CONSUME: ['nft','burn'],
  BUY: ['marketplace','buy'],
  LIST: ['marketplace', 'setPrice'],
  '': ['',''],
};

class NFTUtils {
  static createCollection(id: Id, admin: string, metadata: string): [string, string, string] {
    return [String(id), admin, metadata];
  }

  static createNFT(classId: Id, id: Id, owner: string, royalty: number, metadata: string)  {
    return [String(classId), String(id), owner, royalty, metadata];
  }

  static getActionParams(selectedAction: NFTAction, classId: Id, id: Id, meta: string) {
    switch (selectedAction) {
      case NFTAction.SEND:
      case NFTAction.CONSUME:
      case NFTAction.LIST:
        return [classId, id, meta];
      case NFTAction.BUY:
        return [meta, classId, id];
      default:
        throw new Error('Action not found');
    }
  }

  static apiCall(selectedAction: NFTAction) {
    return actionResolver[selectedAction] || new Error('Action not found');

  }

  static correctMeta(selectedAction: NFTAction, meta: string, currentOwner: string): string {
    switch (selectedAction) {
      case NFTAction.SEND:
      case NFTAction.LIST:
        return meta;
      case NFTAction.CONSUME:
      case NFTAction.BUY:
        return currentOwner;
      default:
        throw new Error('Action not found');
    }
  }
}



export default NFTUtils
