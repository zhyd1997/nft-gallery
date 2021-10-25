import { pinJson as pinJsonIPFS, pinFileDirect as pinFileIPFS, permaStore } from '@/proxy'
import { pinJson as pinJsonSky, pinFile as pinFileSky } from '@/skynet'

type StorageFunction = (file: Blob, ...rest: any[]) => Promise<string>;
type AvailableStorage = 'ipfs' | 'sia' | 'ar'
type StoreHash = Promise<string>
type anyObject = Record<string, any>


export default class StorageSelector {
  public static pinJson(storage: AvailableStorage, metadata: anyObject): StoreHash {
    switch(storage) {
    case 'ipfs':
      return pinJsonIPFS(metadata)
    case 'sia':
      return pinJsonSky(metadata)
    default:
      throw new Error(`Unimplemented Storage ${storage}`)
    }
  }

  public static pinFile(storage: AvailableStorage, file: Blob | File, fileName?: string): StoreHash {
    switch(storage) {
    case 'ipfs':
      return pinFileIPFS(file)
    case 'sia':
      return pinFileSky(file)
    default:
      throw new Error(`Unimplemented Storage ${storage}`)
    }
  }
}
