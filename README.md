# opencli-plugin-fxbaogao

[opencli](https://github.com/jackwener/opencli) plugin for [发现报告](https://www.fxbaogao.com).

## Install

```bash
opencli plugin install github:TuringLambdaAI/opencli-plugin-fxbaogao
```

## Commands

| Command | Strategy | Browser | Description |
|---------|----------|---------|-------------|
| `fxbaogao trending` | public | No | 热门搜索关键词 |
| `fxbaogao suggest --word AI` | public | No | 搜索建议 |
| `fxbaogao facet --type industry` | public | No | 行业/机构报告数量分布 |
| `fxbaogao search --keywords "AIGC"` | public | No | 搜索报告 |
| `fxbaogao industry --name "金融"` | public | No | 按行业浏览报告 |
| `fxbaogao report --docId 5364517` | cookie | Yes | 报告详情（核心观点、关键数据） |

## Usage

```bash
# 热门关键词
opencli fxbaogao trending

# 搜索建议
opencli fxbaogao suggest --word "新能源"

# 行业报告分布
opencli fxbaogao facet --type industry --limit 10

# 搜索报告
opencli fxbaogao search --keywords "低空经济" --limit 10
opencli fxbaogao search --keywords "AI" --order relevant

# 按行业浏览
opencli fxbaogao industry --name "医药生物" --limit 5

# 报告详情（需在 Chrome 登录 fxbaogao.com）
opencli fxbaogao report --docId 5364517

# JSON 输出
opencli fxbaogao search --keywords "AIGC" -f json
```
