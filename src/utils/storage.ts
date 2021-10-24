
type StorageFunction = (file: Blob | File, ...rest: any[]) => Promise<string>;
type Storages = 'ipfs' | 'sia' | 'ar'


const pinFile: Record<Storages, StorageFunction> = {
}

const pinJson: Record<Storages, StorageFunction> = {
}

export default class StorageSelector {
  public static pinJsonOf(string: string): null {
    return null
  }

  public static pinFileOf(string: string): null {
    return null
  }
}
