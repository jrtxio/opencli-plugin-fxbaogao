import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

const REPORT_TYPES = {
  all: '',
  industry: '12',
  company: '11',
  strategy: '13',
  minutes: '14',
  annuals: '16',
  prospectus: '17',
  futures: '18',
  quant: '20',
};

cli({
  site: 'fxbaogao',
  name: 'industry',
  description: '按行业浏览发现报告',
  domain: 'www.fxbaogao.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'name', type: 'string', default: '信息技术', help: '行业名称（如 信息技术、金融、医药生物）' },
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'rt', type: 'string', default: 'all', help: '报告类型：all/industry/company/strategy/minutes/annuals/prospectus/futures/quant' },
    { name: 'limit', type: 'int', default: 10, help: '每页数量 (max 20)' },
  ],
  columns: ['docId', 'title', 'orgName', 'industryName', 'reportType', 'pageNum', 'pubDate'],
  func: async (_page, args) => {
    const industry = String(args.name ?? '信息技术').trim();
    if (!industry) throw new CliError('INVALID_ARGUMENT', 'name (industry) is required');
    const page = Math.max(1, Number(args.page) || 1);
    const limit = Math.max(1, Math.min(Number(args.limit) || 10, 20));
    const rtKey = String(args.rt ?? 'all').toLowerCase();
    const rtVal = REPORT_TYPES[rtKey];
    if (rtVal === undefined) throw new CliError('INVALID_ARGUMENT', `Unknown rt "${rtKey}". Valid: ${Object.keys(REPORT_TYPES).join('/')}`);

    let url = `https://www.fxbaogao.com/archives/industry/${encodeURIComponent(industry)}?page=${page}&nop=${limit}`;
    if (rtVal) url += `&rt=${rtVal}`;

    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new CliError('HTTP_ERROR', `industry failed: HTTP ${resp.status}`);
    const html = await resp.text();

    const m = html.match(/__NEXT_DATA__.*?>(.*?)<\/script>/s);
    if (!m) throw new CliError('NO_DATA', 'No __NEXT_DATA__ found in page');
    const data = JSON.parse(m[1]);
    const lst = data?.props?.pageProps?.lstData;
    if (!lst) throw new CliError('NO_DATA', 'No lstData in page');

    const reports = Array.isArray(lst.dataList) ? lst.dataList : [];
    if (reports.length === 0) throw new CliError('NO_DATA', `No reports found for industry "${industry}"`);

    const REPORT_TYPE_MAP = { 11: '公司研究', 12: '行业研究', 13: '宏观策略', 14: '会议纪要', 16: '财报', 17: '招股书', 18: '期货', 20: '量化' };

    return reports.slice(0, limit).map((r) => ({
      docId: r.docId,
      title: r.title,
      orgName: r.orgName ?? '',
      industryName: r.industryName ?? '',
      reportType: REPORT_TYPE_MAP[r.reportType] ?? String(r.reportType),
      pageNum: r.pageNum ?? 0,
      pubDate: r.pubTimeStr?.replace(/\/$/, '') ?? '',
    }));
  },
});
