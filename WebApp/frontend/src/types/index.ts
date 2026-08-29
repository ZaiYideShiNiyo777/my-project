/** 分类树节点（与后端 /api/categories/tree 返回结构一致） */
export interface CategoryNode {
  id: number;
  name: string;
  icon_name: string;
  parent_id: number;
  children?: CategoryNode[];
}

/** 拍平后的分类（抽屉列表用，含缩进深度） */
export interface FlatCategory {
  id: number;
  name: string;
  icon_name: string;
  parent_id: number;
  depth: number;
}

/** 信息条目（与后端 /api/feed 返回结构一致） */
export interface FeedItem {
  id: number;
  title: string;
  summary?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  credibility_score: number;
  publish_time: string;
  category_id?: number | null;
  category_name?: string | null;
  /** 多分类条目（种子数据部分条目挂多个二级分类） */
  category_ids?: number[];
}

/** 分页结果 */
export interface FeedPage {
  items: FeedItem[];
  total: number;
  page: number;
}
