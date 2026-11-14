# 六主题 CSS 推送前检查

检查日期：2026-11-13。本次仅整理六份 theme CSS 和背景说明；未推送、未暂存。

## 清理内容

删除可确认被后续同选择器、同属性规则覆盖的旧声明；保留条件不同的响应式、悬停、聚焦、动画和减少动态效果规则。
统一两空格缩进、每条属性单独一行，移除空规则。未挪动仍生效的规则顺序，没有自动合并不同条件或不同优先级的选择器。

| 文件 | 清理的旧声明 |
| --- | ---: |
| theme-1.css | 31 |
| theme-2.css | 117 |
| theme-3.css | 55 |
| theme-4.css | 102 |
| theme-5.css | 108 |
| theme-6.css | 152 |

合计 565 条旧声明、107 个清理后为空的规则。选择器仍可能出现在不同章节或屏幕条件中；这些不等于错误重复，保留是为了维持层叠顺序。背景简写与分项属性也不应脱离上下文机械去重。

## 验证

- 六份 CSS 无解析错误，CSS 直接引用的本地图片、字体均存在。
- 36 组整理前后浏览器对照：六主题 × 500/1100/1850px × 地图/藏品页，全部一致。比较包括元素与伪元素的布局、背景、边框、文字、透明度、变换等属性和元素矩形；为避免瞬时差异，对照时固定动画。
- 六主题切换、跨页保留主题、内容加载、桌面/手机背景层数和图片加载：189 项通过。
- git diff --check 无空白格式错误。
- 动画资源另行检查正常和减少动态效果模式；地图点继续可点击。浏览器验证使用本机 Chrome，不代表已逐一实测所有浏览器。

## 推送范围

六份主题 CSS、当前使用的图片/字体/装饰及相应素材来源说明。不要直接 git add .，仓库里仍有未使用的旧设计备选。
准备清单放在本地 .git/river-css-upload-files.txt，不会自动进入提交；它包含运行资源、对应可编辑 SVG、被 SVG 内嵌的已知原图和字体许可。
map.html / exhibition.html 现有少量修改早于本次清理，是之前留下的注释；JS 当前无本地差异。本次没有改队友代码。
远端检查未发现 HEAD 之后的新提交。真正推送前仍应再次 fetch。

整理前的六份 CSS 和逐条删除记录保存在系统临时目录，位置记录于临时文件 renzi-css-audit-current.txt。


## 2026-11-14 release review

Scope: theme 1 handmade paper and matching legend ink; theme 3 readable sidebar ornaments and eight real photographic memories; theme 4 twelve-shot projection and regional grain; theme 6 three subdued VR entry scenes. Themes 2/5 unchanged.

- Removed 11 obsolete unconditional declarations already superseded by the same selector/property: theme 3 (1), theme 4 (10). Removed empty rules and corrected stale comments. Responsive and reduced-motion rules retained.
- Six CSS files parse without errors including nested rules. All 86 recursively reached CSS/font/image resources exist; reached SVG files parse.
- Local Chrome: 176 checks passed, 0 failed. Six themes at 500/1400px: map markers, cross-page theme persistence and decorative image loading. Cleanup equivalence for themes 3/4 at 500/1100/1850px on map/catalogue pages, with animations frozen. Computed styles match except normalized redundant background-size/position lists.
- Embedded photographic/VR originals included as editable source assets. Unused drafts and map-preview.html excluded. No JS/data/functional HTML changes included. Existing local HTML comments excluded.
- Upload manifest: local .git/river-css-upload-20261114.txt.
