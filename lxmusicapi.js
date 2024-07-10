/*!
 * @name vercel源
 * @description 使用vercel部署的音乐源，感谢落雪音乐及落雪音乐api-server项目，更换网易解析，暂时支持kg， 蜜桃酱提供CDN加速
 * @version v1.1.0
 * @author -
 * @repository https://github.com/lxmusics/lx-music-api-server
 */

// 是否开启开发模式
const DEV_ENABLE = false
// 服务端地址 感谢蜜桃酱提供的域名
const API_URL = 'https://share.duanx.cn'
// 服务端配置的请求key
const API_KEY = 'share'
// 音质配置(key为音源名称,不要乱填.如果你账号为VIP可以填写到hires)
// 全部的支持值: ['128k', '320k', 'flac', 'flac24bit']
const MUSIC_QUALITY = {
  kw: ['128k', '320k', 'flac'],
  kg: ['128k', '320k', 'flac'],
  tx: ['128k', '320k', 'flac'],
  wy: ['128k', '320k', 'flac'],
  mg: ['128k', '320k', 'flac', 'flac24bit'],
}
// 音源配置(默认为自动生成,可以修改为手动)
const MUSIC_SOURCE = Object.keys(MUSIC_QUALITY)

/**
 * 下面的东西就不要修改了
 */
const { EVENT_NAMES, request, on, send, utils, env, version } = globalThis.lx

const httpFetch = (url, options = { method: 'GET' }) => {
  return new Promise((resolve, reject) => {
    request(url, options, (err, resp) => {
      if (err) return reject(err)
      resolve(resp)
    })
  })
}

const handleGetMusicUrl = async (source, musicInfo, quality) => {
  const songId = musicInfo.hash ?? musicInfo.songmid

  const request = await httpFetch(`${API_URL}/url/${source}/${songId}/${quality}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `${env ? `lx-music-${env}/${version}` : `lx-usic-request/${version}`}`,
      'X-Request-Key': API_KEY,
    },
  })
  const { body } = request

  if (!body || isNaN(Number(body.code))) throw new Error('unknow error')

  switch (body.code) {
    case 0:
      return body.data
    case 1:
      throw new Error('block ip')
    case 2:
      throw new Error('get music url failed')
    case 4:
      throw new Error('internal server error')
    case 5:
      throw new Error('too many requests')
    case 6:
      throw new Error('param error')
    default:
      throw new Error(body.msg ?? 'unknow error')
  }
}

const musicSources = {}
MUSIC_SOURCE.forEach(item => {
  musicSources[item] = {
    name: item,
    type: 'music',
    actions: ['musicUrl'],
    qualitys: MUSIC_QUALITY[item],
  }
})

on(EVENT_NAMES.request, ({ action, source, info }) => {
  switch (action) {
    case 'musicUrl':
      if (env != 'mobile') {
        console.group(`Handle Action(musicUrl)`)
        console.log('source', source)
        console.log('quality', info.type)
        console.log('musicInfo', info.musicInfo)
        console.groupEnd()
      } else {
        console.log(`Handle Action(musicUrl)`)
        console.log('source', source)
        console.log('quality', info.type)
        console.log('musicInfo', info.musicInfo)
      }
      return handleGetMusicUrl(source, info.musicInfo, info.type)
        .then(data => Promise.resolve(data))
        .catch(err => Promise.reject(err))
    default:
      console.error(`action(${action}) not support`)
      return Promise.reject('action not support')
  }
})
send(EVENT_NAMES.inited, { status: true, openDevTools: DEV_ENABLE, sources: musicSources })
