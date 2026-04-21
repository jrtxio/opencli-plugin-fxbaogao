import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

const ORDERS = {
  relevant: 1,
  newest: 2,
  oldest: 3,
};

cli({
  site: 'fxbaogao',
  name: 'search',
  description: '搜索发现报告',
  domain: 'api.fxbaogao.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'keywords', type: 'string', default: '', help: '搜索关键词' },
    { name: 'limit', type: 'int', default: 10, help: '返回数量 (max 20)' },
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'order', type: 'string', default: 'newest', help: '排序：relevant / newest / oldest' },
  ],
  columns: ['docId', 'title', 'orgName', 'industryName', 'pageNum', 'pubDate'],
  func: async (_page, args) => {
    const keywords = String(args.keywords ?? '').trim();
    if (!keywords) throw new CliError('INVALID_ARGUMENT', 'keywords is required');
    const limit = Math.max(1, Math.min(Number(args.limit) || 10, 20));
    const page = Math.max(1, Number(args.page) || 1);
    const orderKey = String(args.order ?? 'newest').toLowerCase();
    const orderVal = ORDERS[orderKey];
    if (orderVal === undefined) throw new CliError('INVALID_ARGUMENT', `Unknown order "${orderKey}". Valid: ${Object.keys(ORDERS).join('/')}`);

    const resp = await fetch('https://api.fxbaogao.com/mofoun/report/searchReportData/searchListNoAuth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ keywords, pageIndex: page, pageSize: limit, order: orderVal, nop: -1 }),
    });
    if (!resp.ok) throw new CliError('HTTP_ERROR', `search failed: HTTP ${resp.status}`);
    const json = await resp.json();
    if (json.code !== 0) throw new CliError('API_ERROR', `search API error: ${json.msg}`);

    const data = json.data;
    const reports = Array.isArray(data?.dataList) ? data.dataList : [];
    if (reports.length === 0) throw new CliError('NO_DATA', `No reports found for "${keywords}"`);

    return reports.slice(0, limit).map((r) => {
      const d = r.pubTime ? new Date(r.pubTime * 1000) : null;
      const pubDate = d ? `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}` : '';
      return {
        docId: r.docId,
        title: r.title,
        orgName: r.orgName ?? '',
        industryName: r.industryName ?? '',
        pageNum: r.pageNum ?? 0,
        pubDate,
      };
    });
  },
});
