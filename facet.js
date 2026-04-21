import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

const TYPES = {
  industry: 'INDUSTRY_NAME',
  org: 'ORG_NAME',
};

cli({
  site: 'fxbaogao',
  name: 'facet',
  description: '发现报告行业/机构报告数量分布',
  domain: 'api.fxbaogao.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'type', type: 'string', default: 'industry', help: '类型：industry / org' },
    { name: 'limit', type: 'int', default: 25, help: '返回数量' },
  ],
  columns: ['rank', 'name', 'count'],
  func: async (_page, args) => {
    const typeKey = String(args.type ?? 'industry').toLowerCase();
    const facetType = TYPES[typeKey];
    if (!facetType) throw new CliError('INVALID_ARGUMENT', `Unknown type "${typeKey}". Valid: ${Object.keys(TYPES).join(', ')}`);
    const limit = Math.max(1, Math.min(Number(args.limit) || 25, 50));

    const resp = await fetch(
      `https://api.fxbaogao.com/mofoun/report/searchReport/facet?type=${facetType}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: '{}',
      },
    );
    if (!resp.ok) throw new CliError('HTTP_ERROR', `facet failed: HTTP ${resp.status}`);
    const json = await resp.json();
    if (json.code !== 0) throw new CliError('API_ERROR', `facet API error: ${json.msg}`);
    const data = Array.isArray(json.data) ? json.data : [];
    if (data.length === 0) throw new CliError('NO_DATA', 'No facet data returned');
    return data.slice(0, limit).map((it, i) => ({ rank: i + 1, name: it.name, count: it.count }));
  },
});
