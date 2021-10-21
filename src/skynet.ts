import { SkynetClient } from 'skynet-js'

export const BASE_URL = 'https://siasky.net'

const api = new SkynetClient(BASE_URL)

export const pinJson = async (object: Record<string, unknown>, fileName?: string): Promise<string> => {
  const blob = new Blob([JSON.stringify(object)])
  return pinFile(blob, fileName ?? 'metadata.json')
}

export const pinFile = async (blob: Blob, fileName: string): Promise<string> => {
  const file = new File([blob], fileName)
  const { skylink } = await api.uploadFile(file)
  console.log('[SKYNET] Pin Image', skylink)
  return skylink
}

export default api
// QmYt2FydonvVMsEqe2q3hvm38WDq21xM8Z5ZSHZw19PwjF;
