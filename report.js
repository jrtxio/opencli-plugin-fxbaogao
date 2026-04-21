import { cli, Strategy } from '@jackwener/opencli/registry';
import { AuthRequiredError, CliError } from '@jackwener/opencli/errors';

cli({
  site: 'fxbaogao',
  name: 'report',
  description: '查看发现报告详情（含核心观点、关键数据）',
  domain: 'www.fxbaogao.com',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'docId', type: 'string', default: '', help: '报告 docId' },
  ],
  columns: ['docId', 'title', 'orgName', 'date', 'industry', 'authors', 'keyPoints'],
  func: async (page, args) => {
    const docId = String(args.docId ?? '').trim();
    if (!docId) throw new CliError('INVALID_ARGUMENT', 'docId is required');

    await page.goto(`https://www.fxbaogao.com/detail/${docId}`);
    await page.wait(3);

    const data = await page.evaluate(`
      (() => {
        // Check login - look for greeting text instead of login button
        let loggedIn = false;
        document.querySelectorAll('span').forEach(s => {
          const t = s.textContent?.trim() || '';
          if (/晚上好|早上好|下午好|你好/.test(t)) loggedIn = true;
        });
        if (!loggedIn) return { error: 'AUTH_REQUIRED' };

        const r = { docId: ${JSON.stringify(docId)}, title: '', orgName: '', date: '', industry: '', authors: '', keyPoints: '' };

        // Title
        const titleEl = document.querySelector('a[title="点击查看原文"]');
        r.title = titleEl?.textContent?.trim() || '';

        // Industry
        const indEl = document.querySelector('a[href*="archives/industry"]');
        r.industry = indEl?.textContent?.trim() || '';

        // Date - from the meta div next to title
        const metaDiv = titleEl?.parentElement?.nextElementSibling;
        if (metaDiv) {
          const spans = metaDiv.querySelectorAll('span');
          for (const sp of spans) {
            const m = sp.textContent?.trim().match(/^(\\d{4}-\\d{2}-\\d{2})$/);
            if (m) { r.date = m[1]; break; }
          }
        }

        // Org name
        const orgEl = document.querySelector('a[href*="archives/organization"]');
        r.orgName = orgEl?.textContent?.trim() || '';

        // Authors - span after org link within the same parent div
        if (orgEl && orgEl.parentElement) {
          const spans = orgEl.parentElement.querySelectorAll('span');
          const lastSpan = spans[spans.length - 1];
          if (lastSpan && lastSpan.textContent?.trim().length > 0 && lastSpan.textContent?.trim().length < 50) {
            r.authors = lastSpan.textContent.trim();
          }
        }

        // Key points from h5 sections
        const sections = [];
        const h5s = document.querySelectorAll('h5');
        for (const h5 of h5s) {
          const sectionTitle = h5.textContent?.trim();
          if (!sectionTitle) continue;
          const ul = h5.nextElementSibling;
          if (ul && ul.tagName === 'UL') {
            const lis = ul.querySelectorAll('li');
            const points = Array.from(lis).map(li => {
              const text = li.textContent?.trim() || '';
              const bold = li.querySelector('strong')?.textContent?.trim() || '';
              return bold ? bold + '：' + text.split(bold).pop()?.trim() : text;
            }).filter(Boolean);
            if (points.length > 0) {
              sections.push(sectionTitle + '：' + points.join('；'));
            }
          }
        }
        r.keyPoints = sections.join('\\n');

        return r;
      })()
    `);

    if (!data || data.error === 'AUTH_REQUIRED') throw new AuthRequiredError('www.fxbaogao.com');
    if (!data.title) throw new CliError('NO_DATA', `Report ${docId} not found`);

    return [data];
  },
});
