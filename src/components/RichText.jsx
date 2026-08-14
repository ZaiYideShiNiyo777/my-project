import React, { Fragment } from 'react';

// 列表行前缀(编号/括号编号/项目符号),用于识别"每行一条"的列表式文本
const LIST_PREFIX = /^\s*(\d+[、.．]|[（(]\d+[）)]|[•·\-*])/;
// 二级编号前缀(（1）（2）等),渲染时缩进,体现子列表层级
const SUB_PREFIX = /^\s*[（(]\d+[）)]/;

// 段落分隔:一个或多个空白行(兼容空行带空格的数据,如 \n \n)
const PARA_SEP = /\n\s*\n/;

// 段落类名:列表行加 list 类(列表项之间小间距,与普通段边界拉开层次);
// 二级编号行加 sub 类(左缩进),列表层级一目了然
function paraClass(line) {
  const list = LIST_PREFIX.test(line) ? ' rich-text-para-list' : '';
  const sub = SUB_PREFIX.test(line) ? ' rich-text-para-sub' : '';
  return `rich-text-para${list}${sub}`;
}

// 段内行分组:连续的列表行与连续的普通行各自成组,
// 列表行组每行独立成段,普通行组内部保留换行(<br/>)
function renderParagraph(p) {
  const lines = p
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return <p className={paraClass(lines[0])}>{lines[0]}</p>;
  }
  const groups = [];
  let cur = [];
  lines.forEach((l) => {
    const isList = LIST_PREFIX.test(l);
    if (!cur.length || LIST_PREFIX.test(cur[0]) === isList) {
      cur.push(l);
    } else {
      groups.push(cur);
      cur = [l];
    }
  });
  if (cur.length) groups.push(cur);
  return groups.map((g, gi) => {
    if (g.length === 1) {
      return (
        <p key={gi} className="rich-text-para">
          {g[0]}
        </p>
      );
    }
    if (g.every((l) => LIST_PREFIX.test(l))) {
      return g.map((l, li) => (
        <p key={`${gi}-${li}`} className={paraClass(l)}>
          {l}
        </p>
      ));
    }
    return (
      <p key={gi} className="rich-text-para">
        {g.map((l, li) => (li === 0 ? l : [<br key={`br${li}`} />, l]))}
      </p>
    );
  });
}

/**
 * 多行富文本渲染
 * - 按空白行拆分为独立段落(bio 等无空行的编号列表可传 delimiter="\n")
 * - 间距分层:列表项之间小间距、段落边界大间距、二级编号缩进,
 *   由 .rich-text-para / -list / -sub 样式配合相邻兄弟选择器控制
 * - 文本颜色、字号等由外层 className 继承
 */
export default function RichText({ text, delimiter = PARA_SEP, className = '' }) {
  if (!text) return null;
  const paragraphs = String(text)
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  // 直接平铺渲染段落(Fragment 不产生 DOM 节点),
  // 保证 .rich-text-para 互为兄弟节点,:last-child 与段落间距 margin 正确生效
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <Fragment key={i}>{renderParagraph(p)}</Fragment>
      ))}
    </div>
  );
}
