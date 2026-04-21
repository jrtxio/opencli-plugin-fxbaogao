import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

cli({
  site: 'fxbaogao',
  name: 'suggest',
  description: '发现报告搜索建议（输入提示）',
  domain: 'api.fxbaogao.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'word', type: 'string', default: '', help: '搜索词' },
    { name: 'limit', type: 'int', default: 10, help: '返回数量' },
  ],
  columns: ['rank', 'keyword'],
  func: async (_page, args) => {
    const word = String(args.word ?? '').trim();
    if (!word) throw new CliError('INVALID_ARGUMENT', 'word is required');
    const limit = Math.max(1, Math.min(Number(args.limit) || 10, 50));
    const url = `https://api.fxbaogao.com/mofoun/report/searchReport/suggestTyping?word=${encodeURIComponent(word)}&limit=${limit}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new CliError('HTTP_ERROR', `suggest failed: HTTP ${resp.status}`);
    const json = await resp.json();
    if (json.code !== 0) throw new CliError('API_ERROR', `suggest API error: ${json.msg}`);
    const data = Array.isArray(json.data) ? json.data : [];
    if (data.length === 0) throw new CliError('EMPTY_RESULT', `No suggestions for "${word}"`);
    return data.map((kw, i) => ({ rank: i + 1, keyword: kw }));
  },
});
