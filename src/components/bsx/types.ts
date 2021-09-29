import { AccountId } from '@polkadot/types/interfaces'

export class ClassData {
  // tslint:disable
  is_pool = true;
}


export class TokenData {
  locked = false;
  emote = '1F40D';
}

export type ClassInfoOf = {
  metadata: string;
  total_issuance: number,
  owner: AccountId,
  data: ClassData,
}


export type TokenInfoOf = {
  metadata: string;
  owner: AccountId,
  data: TokenData
}
