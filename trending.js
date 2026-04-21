import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

cli({
  site: 'fxbaogao',
  name: 'trending',
  description: '发现报告热门搜索关键词',
  domain: 'api.fxbaogao.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [],
  columns: ['rank', 'keyword'],
  func: async (_page, _args) => {
    const resp = await fetch('https://api.fxbaogao.com/mofoun/report/searchReport/suggestKeywords', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!resp.ok) throw new CliError('HTTP_ERROR', `trending failed: HTTP ${resp.status}`);
    const json = await resp.json();
    if (json.code !== 0) throw new CliError('API_ERROR', `trending API error: ${json.msg}`);
    const data = Array.isArray(json.data) ? json.data : [];
    if (data.length === 0) throw new CliError('NO_DATA', 'No trending keywords returned');
    return data.map((kw, i) => ({ rank: i + 1, keyword: kw }));
  },
});
