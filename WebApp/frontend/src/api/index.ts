import { requestWithTimeout } from "./http";
import type { CategoryNode, FeedPage } from "@/types";

export interface FeedQuery {
  category_id: number;
  page: number;
  page_size: number;
  keyword?: string;
}

/** 信息流分页查询 */
export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  return (await requestWithTimeout<{ data: FeedPage }>("/feed", { ...query })).data;
}

/** 分类树 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  return (await requestWithTimeout<{ data: CategoryNode[] }>("/categories/tree")).data;
}
