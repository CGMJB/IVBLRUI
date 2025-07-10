// 替换为你的 Notion 集成令牌和数据库 ID
const NOTION_TOKEN = '你的 Integration Token';
const DATABASE_ID = '你的数据库 ID';

// 获取总排名数据
fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sorts: [
      {
        property: '积分',
        direction: 'descending'
      }
    ]
  })
})
.then(res => res.json())
.then(data => {
  const rankingBody = document.getElementById('rankingBody');
  data.results.forEach((player, index) => {
    const row = document.createElement('tr');
    const name = player.properties.姓名.title[0]?.text.content || '未知选手';
    const games = player.properties.场次.number || 0;
    const points = player.properties.积分.number || 0;

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${name}</td>
      <td>${games}</td>
      <td>${points}</td>
    `;
    rankingBody.appendChild(row);
  });
})
.catch(error => {
  console.error('Error fetching data:', error);
  document.getElementById('rankingBody').innerHTML = '<tr><td colspan="4">加载数据失败，请检查你的网络连接。</td></tr>';
});

// 查询选手详细信息
function searchPlayer() {
  const playerName = document.getElementById('playerName').value.trim();
  const playerDetail = document.getElementById('playerDetail');

  if (!playerName) {
    playerDetail.innerHTML = '<p>请输入选手姓名</p >';
    return;
  }

  fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        property: '姓名',
        title: {
          contains: playerName
        }
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.results.length === 0) {
      playerDetail.innerHTML = `<p>未找到选手 "${playerName}"</p >`;
    } else {
      const player = data.results[0];
      const name = player.properties.姓名.title[0]?.text.content || '未知选手';
      const games = player.properties.场次.number || 0;
      const points = player.properties.积分.number || 0;
      // 假设你的数据库还有其他字段
      const winRate = player.properties.胜率.number || 0;
      const character = player.properties.角色.rich_text[0]?.text.content || '未知角色';

      playerDetail.innerHTML = `
        <h3>${name}</h3>
        <div class="detail-item">
          <span>场次: </span>
          <span>${games}</span>
        </div>
        <div class="detail-item">
          <span>积分: </span>
          <span>${points}</span>
        </div>
        <div class="detail-item">
          <span>胜率: </span>
          <span>${winRate}%</span>
        </div>
        <div class="detail-item">
          <span>常用角色: </span>
          <span>${character}</span>
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Error searching player:', error);
    playerDetail.innerHTML = '<p>查询失败，请稍后再试</p >';
  });
}
