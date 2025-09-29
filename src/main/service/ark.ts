export class ArkService {
  static async _request(content: string): Promise<string | null> {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer c87cdab3-daf1-460e-b67d-97d27c04c1b4',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'doubao-seed-1.6-250615',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: content
              }
            ]
          }
        ],
        thinking: {
          type: 'disabled'
        }
      })
    })

    if (!response.ok) {
      // throw new Error(`HTTP error! status: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
  static async analyzeVideoType(
    videoInfo: string
  ): Promise<{ shouldWatch: boolean; targetCity: string }> {
    const result = await this._request(
      // `
      //   请你根据视频信息，判断我是否需要观看这个视频，最后按照格式{"shouldWatch":true|false,"targetCity":""}返回json数据给我，具体规则如下：
      //   如果视频不是旅游攻略相关的，则直接返回{"shouldWatch":false,"targetCity": ""}，如果是旅游攻略相关的，请你先提取视频提到的城市，以下称为“目标城市”。
      //   接着，假设我是一个即将前往目标城市旅游的外地游客，结合视频信息，判断我是否需要观看此视频，最后返回对应格式数据。
      //   视频信息如下：${videoInfo}
      // `
      `
        目标： 根据视频信息，判断是否需要观看这个视频，最后按照格式{"shouldWatch":true|false,"targetCity":""}返回json数据 
        
        规则： 
        如果视频不是旅游相关的，则直接返回{"shouldWatch":false,"targetCity": ""}，如果是旅游相关的，请你先提取视频提到的城市，以下称为“目标城市”。
        接着，假设我是一个即将前往目标城市旅游的外地游客正在做旅游规划，请结合视频信息，判断该视频对我是否有帮助，另外如果视频是单一景点的攻略或单个地点的种草或是导游（根据作者名称判断，一般名字中带有城市名或是导游字眼的是导游）发布的视频，则不需要观看。
        综合以上和视频信息，判断我是否需要观看此视频，最后返回对应格式数据。 
        
        视频信息：
        ${videoInfo}
      `
    )
    if (result === null)
      return {
        shouldWatch: false,
        targetCity: ''
      }
    return JSON.parse(result)
  }
}
