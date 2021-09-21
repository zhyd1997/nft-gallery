import { ClassData, TokenData } from './types';

type Id = string | number;

class NFTUtils {
  static createCollection(id: Id, admin: string, metadata: string): [string, string, string] {
    return [String(id), admin, metadata];
  }

  static createNFT(classId: Id, id: Id, owner: string, royalty: number, metadata: string)  {
    return [String(classId), String(id), owner, royalty, metadata];
  }


}



export default NFTUtils
