import type { CategoryNode, FeedItem } from "@/types";

// ============ 离线兜底数据（与后端 seed 同步！改数据需三处同步） ============
// 14 个一级分类 + 34 个二级分类（icon_name 与后端 seed 保持一致）
export const categoryTree: CategoryNode[] = [
  {
    "id": 1,
    "name": "科技",
    "icon_name": "Cpu",
    "parent_id": 0,
    "children": [
      {
        "id": 101,
        "name": "人工智能",
        "icon_name": "Cpu",
        "parent_id": 1
      },
      {
        "id": 102,
        "name": "消费电子",
        "icon_name": "Cpu",
        "parent_id": 1
      },
      {
        "id": 103,
        "name": "半导体",
        "icon_name": "Cpu",
        "parent_id": 1
      }
    ]
  },
  {
    "id": 2,
    "name": "财经",
    "icon_name": "Landmark",
    "parent_id": 0,
    "children": [
      {
        "id": 201,
        "name": "股票市场",
        "icon_name": "Landmark",
        "parent_id": 2
      },
      {
        "id": 202,
        "name": "宏观经济",
        "icon_name": "Landmark",
        "parent_id": 2
      },
      {
        "id": 203,
        "name": "数字货币",
        "icon_name": "Landmark",
        "parent_id": 2
      }
    ]
  },
  {
    "id": 3,
    "name": "医疗",
    "icon_name": "HeartPulse",
    "parent_id": 0,
    "children": [
      {
        "id": 301,
        "name": "新药研发",
        "icon_name": "HeartPulse",
        "parent_id": 3
      },
      {
        "id": 302,
        "name": "公共卫生",
        "icon_name": "HeartPulse",
        "parent_id": 3
      },
      {
        "id": 303,
        "name": "医疗器械",
        "icon_name": "HeartPulse",
        "parent_id": 3
      }
    ]
  },
  {
    "id": 4,
    "name": "教育",
    "icon_name": "GraduationCap",
    "parent_id": 0,
    "children": [
      {
        "id": 401,
        "name": "高等教育",
        "icon_name": "GraduationCap",
        "parent_id": 4
      },
      {
        "id": 402,
        "name": "职业教育",
        "icon_name": "GraduationCap",
        "parent_id": 4
      },
      {
        "id": 403,
        "name": "教育政策",
        "icon_name": "GraduationCap",
        "parent_id": 4
      }
    ]
  },
  {
    "id": 5,
    "name": "制造",
    "icon_name": "Factory",
    "parent_id": 0,
    "children": [
      {
        "id": 501,
        "name": "智能制造",
        "icon_name": "Factory",
        "parent_id": 5
      },
      {
        "id": 502,
        "name": "汽车制造",
        "icon_name": "Factory",
        "parent_id": 5
      }
    ]
  },
  {
    "id": 6,
    "name": "零售",
    "icon_name": "ShoppingBag",
    "parent_id": 0,
    "children": [
      {
        "id": 601,
        "name": "电商",
        "icon_name": "ShoppingBag",
        "parent_id": 6
      },
      {
        "id": 602,
        "name": "新消费品牌",
        "icon_name": "ShoppingBag",
        "parent_id": 6
      }
    ]
  },
  {
    "id": 7,
    "name": "能源",
    "icon_name": "Leaf",
    "parent_id": 0,
    "children": [
      {
        "id": 701,
        "name": "新能源",
        "icon_name": "Leaf",
        "parent_id": 7
      },
      {
        "id": 702,
        "name": "碳中和",
        "icon_name": "Leaf",
        "parent_id": 7
      }
    ]
  },
  {
    "id": 8,
    "name": "物流",
    "icon_name": "Truck",
    "parent_id": 0,
    "children": [
      {
        "id": 801,
        "name": "快递物流",
        "icon_name": "Truck",
        "parent_id": 8
      },
      {
        "id": 802,
        "name": "供应链",
        "icon_name": "Truck",
        "parent_id": 8
      }
    ]
  },
  {
    "id": 9,
    "name": "房产",
    "icon_name": "Building2",
    "parent_id": 0,
    "children": [
      {
        "id": 901,
        "name": "楼市政策",
        "icon_name": "Building2",
        "parent_id": 9
      },
      {
        "id": 902,
        "name": "地产企业",
        "icon_name": "Building2",
        "parent_id": 9
      }
    ]
  },
  {
    "id": 10,
    "name": "法律",
    "icon_name": "Scale",
    "parent_id": 0,
    "children": [
      {
        "id": 1001,
        "name": "法规动态",
        "icon_name": "Scale",
        "parent_id": 10
      },
      {
        "id": 1002,
        "name": "司法案例",
        "icon_name": "Scale",
        "parent_id": 10
      }
    ]
  },
  {
    "id": 11,
    "name": "商业",
    "icon_name": "Briefcase",
    "parent_id": 0,
    "children": [
      {
        "id": 1101,
        "name": "企业动态",
        "icon_name": "Briefcase",
        "parent_id": 11
      },
      {
        "id": 1102,
        "name": "创业投资",
        "icon_name": "Briefcase",
        "parent_id": 11
      }
    ]
  },
  {
    "id": 12,
    "name": "国际",
    "icon_name": "Globe",
    "parent_id": 0,
    "children": [
      {
        "id": 1201,
        "name": "国际关系",
        "icon_name": "Globe",
        "parent_id": 12
      },
      {
        "id": 1202,
        "name": "全球经济",
        "icon_name": "Globe",
        "parent_id": 12
      }
    ]
  },
  {
    "id": 13,
    "name": "游戏",
    "icon_name": "Gamepad2",
    "parent_id": 0,
    "children": [
      {
        "id": 1301,
        "name": "电子游戏",
        "icon_name": "Gamepad2",
        "parent_id": 13
      },
      {
        "id": 1302,
        "name": "主机游戏",
        "icon_name": "Gamepad2",
        "parent_id": 13
      },
      {
        "id": 1303,
        "name": "电竞",
        "icon_name": "Gamepad2",
        "parent_id": 13
      },
      {
        "id": 1304,
        "name": "独立游戏",
        "icon_name": "Gamepad2",
        "parent_id": 13
      }
    ]
  },
  {
    "id": 14,
    "name": "社会综合新闻",
    "icon_name": "Newspaper",
    "parent_id": 0,
    "children": [
      {
        "id": 1401,
        "name": "民生资讯",
        "icon_name": "Newspaper",
        "parent_id": 14
      },
      {
        "id": 1402,
        "name": "社会法治",
        "icon_name": "Newspaper",
        "parent_id": 14
      },
      {
        "id": 1403,
        "name": "文化体育",
        "icon_name": "Newspaper",
        "parent_id": 14
      },
      {
        "id": 1404,
        "name": "生态环境",
        "icon_name": "Newspaper",
        "parent_id": 14
      }
    ]
  }
];

// 107 条示例信息（credibility_score 均 >= 0.6；部分条目挂多分类）
export const fallbackItems: FeedItem[] = [
  {
    "id": 1,
    "title": "工信部发布人工智能产业创新发展白皮书，明确三大重点方向",
    "summary": "白皮书指出将加快大模型基础能力建设，推动行业应用落地，并完善数据治理体系。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.96,
    "publish_time": "2026-08-27T09:30:00+08:00",
    "category_id": 1,
    "category_name": "科技"
  },
  {
    "id": 2,
    "title": "全球半导体市场二季度同比增长12%，AI 芯片需求持续强劲",
    "summary": "多家机构数据显示，数据中心与边缘计算芯片出货量创历史新高。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.89,
    "publish_time": "2026-08-27T08:45:00+08:00",
    "category_id": 1,
    "category_name": "科技"
  },
  {
    "id": 3,
    "title": "央行宣布下调存款准备金率0.5个百分点，释放长期流动性约1万亿元",
    "summary": "央行有关负责人表示，此举旨在支持实体经济发展，保持流动性合理充裕。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.93,
    "publish_time": "2026-08-27T08:00:00+08:00",
    "category_id": 2,
    "category_name": "财经"
  },
  {
    "id": 4,
    "title": "新型 mRNA 癌症疫苗进入三期临床试验，初步数据显示安全有效",
    "summary": "研究团队表示，该疫苗针对特定肿瘤抗原，已完成两期安全性验证。",
    "source_name": "自然杂志",
    "source_url": "https://www.nature.com",
    "credibility_score": 0.91,
    "publish_time": "2026-08-26T21:10:00+08:00",
    "category_id": 3,
    "category_name": "医疗"
  },
  {
    "id": 5,
    "title": "国家卫健委发布新一轮基层医疗能力提升行动方案",
    "summary": "方案提出到2028年实现县域医共体全覆盖，提升基层诊疗水平。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-26T19:00:00+08:00",
    "category_id": 3,
    "category_name": "医疗"
  },
  {
    "id": 6,
    "title": "教育部：加快构建高质量教育体系，扩大优质教育资源覆盖面",
    "summary": "会议部署了基础教育扩优提质、职业教育产教融合等重点任务。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-26T17:30:00+08:00",
    "category_id": 4,
    "category_name": "教育"
  },
  {
    "id": 7,
    "title": "新能源汽车产销两旺，7月国内渗透率首次突破55%",
    "summary": "乘联会数据显示，自主品牌新能源车型贡献主要增量。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.87,
    "publish_time": "2026-08-26T15:20:00+08:00",
    "category_id": 5,
    "category_name": "制造"
  },
  {
    "id": 8,
    "title": "工信部等五部门联合印发智能制造示范工厂建设指南",
    "summary": "指南明确了智能工厂分级评价标准，推动制造业数字化转型。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-26T11:00:00+08:00",
    "category_id": 5,
    "category_name": "制造"
  },
  {
    "id": 9,
    "title": "商务部：全国网上零售额同比增长8.6%，即时零售增速领跑",
    "summary": "上半年实物商品网上零售额占社零比重持续提升。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-25T20:40:00+08:00",
    "category_id": 6,
    "category_name": "零售"
  },
  {
    "id": 10,
    "title": "新型钙钛矿光伏组件量产效率刷新纪录，成本进一步下降",
    "summary": "国内头部组件企业宣布叠层电池实验室效率突破34%。",
    "source_name": "自然杂志",
    "source_url": "https://www.nature.com",
    "credibility_score": 0.9,
    "publish_time": "2026-08-25T16:15:00+08:00",
    "category_id": 7,
    "category_name": "能源"
  },
  {
    "id": 11,
    "title": "全国快递业务量突破900亿件，农村寄递物流体系加速完善",
    "summary": "国家邮政局数据显示，中西部增速高于全国平均水平。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.93,
    "publish_time": "2026-08-25T10:30:00+08:00",
    "category_id": 8,
    "category_name": "物流"
  },
  {
    "id": 12,
    "title": "多城优化住房限购政策，刚需与改善性需求获进一步支持",
    "summary": "中指研究院统计，8月以来已有十余个城市调整购房政策。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.84,
    "publish_time": "2026-08-24T18:00:00+08:00",
    "category_id": 9,
    "category_name": "房产"
  },
  {
    "id": 13,
    "title": "反不正当竞争法修订草案提请审议，强化平台经济监管",
    "summary": "草案新增对算法歧视、数据垄断等新型行为的规制条款。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-24T14:25:00+08:00",
    "category_id": 10,
    "category_name": "法律"
  },
  {
    "id": 14,
    "title": "美联储会议纪要：多数官员支持渐进式降息路径",
    "summary": "纪要显示委员们对通胀回落趋势基本达成共识，但仍关注就业数据。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.88,
    "publish_time": "2026-08-24T08:50:00+08:00",
    "category_id": 12,
    "category_name": "国际"
  },
  {
    "id": 15,
    "title": "长三角一体化发展取得新进展，跨省通办事项再扩容",
    "summary": "三省一市联合发布年度重点合作项目清单，涉及交通、科创等领域。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-23T09:00:00+08:00",
    "category_id": 11,
    "category_name": "商业"
  },
  {
    "id": 16,
    "title": "上半年国内折叠屏手机出货量同比增长超八成，头部厂商加速推新",
    "summary": "市场调研机构数据显示，折叠屏手机出货占比持续提升，价格下探带动换机需求。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.85,
    "publish_time": "2026-08-27T01:00:00+08:00",
    "category_id": 1,
    "category_name": "科技"
  },
  {
    "id": 17,
    "title": "科创板并购重组审核效率提升，硬科技企业整合并购明显提速",
    "summary": "监管部门优化并购重组估值与审核安排，支持科创企业通过并购做优做强。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-26T23:30:00+08:00",
    "category_id": 2,
    "category_name": "财经"
  },
  {
    "id": 18,
    "title": "数字人民币试点范围持续扩大，便民场景接入数量快速增长",
    "summary": "多地新增数字人民币应用场景，覆盖交通出行、生活缴费等领域。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-26T20:00:00+08:00",
    "category_id": 2,
    "category_name": "财经"
  },
  {
    "id": 19,
    "title": "国家药监局批准多款国产创新医疗器械上市，高端设备国产化提速",
    "summary": "获批产品覆盖影像、手术机器人等领域，填补多项国内空白。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.93,
    "publish_time": "2026-08-26T18:00:00+08:00",
    "category_id": 3,
    "category_name": "医疗"
  },
  {
    "id": 20,
    "title": "产教融合型企业培育库持续扩容，校企协同育人模式加快推广",
    "summary": "多地出台支持政策，推动职业院校与企业共建产业学院与实训基地。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-26T13:00:00+08:00",
    "category_id": 4,
    "category_name": "教育"
  },
  {
    "id": 21,
    "title": "教育部部署校外培训治理新举措，严查隐形变异违规培训",
    "summary": "专项行动聚焦暑期关键节点，强化预收费资金监管与平台巡查。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-26T09:00:00+08:00",
    "category_id": 4,
    "category_name": "教育"
  },
  {
    "id": 22,
    "title": "上半年汽车出口保持高增长，新能源汽车成为重要增量",
    "summary": "中汽协数据显示，自主品牌海外布局加速，出口结构持续优化。",
    "source_name": "新华网",
    "source_url": "https://www.xinhuanet.com",
    "credibility_score": 0.9,
    "publish_time": "2026-08-26T07:00:00+08:00",
    "category_id": 5,
    "category_name": "制造"
  },
  {
    "id": 23,
    "title": "跨境电商综试区扩围，海外仓建设进入加速期",
    "summary": "新一批综试区获批后总数持续增加，配套物流与金融服务同步完善。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-26T03:00:00+08:00",
    "category_id": 6,
    "category_name": "零售"
  },
  {
    "id": 24,
    "title": "国货美妆品牌加速出海，东南亚市场成新增长极",
    "summary": "多家本土品牌通过本土化运营与直播电商打开海外渠道。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.83,
    "publish_time": "2026-08-25T23:00:00+08:00",
    "category_id": 6,
    "category_name": "零售"
  },
  {
    "id": 25,
    "title": "全国碳市场扩容至钢铁水泥行业，覆盖排放量占比大幅提升",
    "summary": "生态环境部明确纳入标准与配额方案，推动更多行业参与碳交易。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-25T21:00:00+08:00",
    "category_id": 7,
    "category_name": "能源"
  },
  {
    "id": 26,
    "title": "海上风电装机规模持续扩大，深远海示范项目陆续并网",
    "summary": "沿海省份加快推进大型风电基地建设，产业链降本成效显著。",
    "source_name": "新华网",
    "source_url": "https://www.xinhuanet.com",
    "credibility_score": 0.92,
    "publish_time": "2026-08-25T17:00:00+08:00",
    "category_id": 7,
    "category_name": "能源"
  },
  {
    "id": 27,
    "title": "中欧班列累计开行突破10万列，亚欧通道网络持续加密",
    "summary": "国铁集团数据显示，班列通达范围进一步扩大，回程货量稳步提升。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.96,
    "publish_time": "2026-08-25T13:00:00+08:00",
    "category_id": 8,
    "category_name": "物流"
  },
  {
    "id": 28,
    "title": "智能快递柜纳入公共服务设施规划，末端配送效率持续提升",
    "summary": "国家邮政局推动智能末端设施建设，与社区服务网络深度融合。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-25T09:00:00+08:00",
    "category_id": 8,
    "category_name": "物流"
  },
  {
    "id": 29,
    "title": "保交楼专项借款加速落地，多地项目交付进度明显加快",
    "summary": "各地成立工作专班，统筹推进存量项目复工与竣工验收。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.88,
    "publish_time": "2026-08-25T05:00:00+08:00",
    "category_id": 9,
    "category_name": "房产"
  },
  {
    "id": 30,
    "title": "多地下调住房公积金贷款利率，存量房贷利率调整稳步推进",
    "summary": "购房成本进一步降低，重点城市二手房市场活跃度有所回升。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.93,
    "publish_time": "2026-08-25T02:00:00+08:00",
    "category_id": 9,
    "category_name": "房产"
  },
  {
    "id": 31,
    "title": "最高人民法院发布平台经济典型案例，规范算法与数据竞争行为",
    "summary": "案例明确了滥用市场支配地位、算法歧视等行为的裁判规则。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-24T23:00:00+08:00",
    "category_id": 10,
    "category_name": "法律"
  },
  {
    "id": 32,
    "title": "民营经济促进法草案公开征求意见，强调公平竞争与权益保护",
    "summary": "草案明确禁止歧视性市场准入，强化对民营企业产权的依法保护。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.97,
    "publish_time": "2026-08-24T21:00:00+08:00",
    "category_id": 10,
    "category_name": "法律"
  },
  {
    "id": 33,
    "title": "人形机器人赛道融资持续活跃，具身智能成资本布局热点",
    "summary": "一级市场多笔大额融资落地，产业链上游核心部件受关注。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.84,
    "publish_time": "2026-08-24T19:00:00+08:00",
    "category_id": 11,
    "category_name": "商业"
  },
  {
    "id": 34,
    "title": "国货消费品牌集体冲刺港股上市，融资渠道持续拓宽",
    "summary": "多家新消费企业递交上市申请，机构投资者认购意愿较强。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.85,
    "publish_time": "2026-08-24T17:00:00+08:00",
    "category_id": 11,
    "category_name": "商业"
  },
  {
    "id": 35,
    "title": "金砖合作机制持续深化，新开发银行扩员后业务规模扩大",
    "summary": "多国申请加入金砖伙伴关系，南南合作项目覆盖范围不断拓宽。",
    "source_name": "新华网",
    "source_url": "https://www.xinhuanet.com",
    "credibility_score": 0.93,
    "publish_time": "2026-08-24T15:00:00+08:00",
    "category_id": 12,
    "category_name": "国际"
  },
  {
    "id": 36,
    "title": "IMF 上调全球经济增速预期，提示警惕贸易碎片化风险",
    "summary": "报告认为主要经济体韧性好于预期，但地缘与贸易不确定性仍存。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.9,
    "publish_time": "2026-08-24T11:00:00+08:00",
    "category_id": 12,
    "category_name": "国际"
  },
  {
    "id": 37,
    "title": "国产大模型开源生态加速壮大，产业应用落地提速",
    "summary": "多家企业发布开源基座模型，开发者在工具链、智能体等方向密集创新。",
    "source_name": "澎湃新闻",
    "source_url": "https://www.thepaper.cn",
    "credibility_score": 0.85,
    "publish_time": "2026-08-27T07:30:00+08:00",
    "category_id": 101,
    "category_name": "人工智能"
  },
  {
    "id": 38,
    "title": "上半年社会融资规模增量创新高，信贷结构持续优化",
    "summary": "人民银行数据显示，企业中长期贷款占比提升，实体经济融资成本稳中有降。",
    "source_name": "第一财经",
    "source_url": "https://www.yicai.com",
    "credibility_score": 0.88,
    "publish_time": "2026-08-27T06:00:00+08:00",
    "category_id": 202,
    "category_name": "宏观经济"
  },
  {
    "id": 39,
    "title": "全国医保药品目录调整启动，创新药谈判品种数量增加",
    "summary": "国家医保局表示，目录调整继续向创新药倾斜，谈判成功率保持高位。",
    "source_name": "央视网",
    "source_url": "https://www.cctv.com",
    "credibility_score": 0.94,
    "publish_time": "2026-08-27T05:00:00+08:00",
    "category_id": 301,
    "category_name": "新药研发"
  },
  {
    "id": 40,
    "title": "多地推进中小学校园餐规范化管理，营养改善计划提质扩面",
    "summary": "教育部门联合市场监管部门开展专项整治，食材采购与后厨监管全程可溯。",
    "source_name": "中国青年报",
    "source_url": "https://www.cyol.com",
    "credibility_score": 0.91,
    "publish_time": "2026-08-27T03:30:00+08:00",
    "category_id": 403,
    "category_name": "教育政策"
  },
  {
    "id": 41,
    "title": "工业母机产业基金设立，高端装备自主化进程提速",
    "summary": "基金重点投向数控机床、工业软件等关键环节，带动产业链协同攻关。",
    "source_name": "第一财经",
    "source_url": "https://www.yicai.com",
    "credibility_score": 0.87,
    "publish_time": "2026-08-26T22:00:00+08:00",
    "category_id": 501,
    "category_name": "智能制造"
  },
  {
    "id": 42,
    "title": "县域商业体系建设行动方案实施，农村消费潜力持续释放",
    "summary": "商务部推动补齐县域商业短板，县乡物流配送与连锁网点覆盖加快。",
    "source_name": "澎湃新闻",
    "source_url": "https://www.thepaper.cn",
    "credibility_score": 0.86,
    "publish_time": "2026-08-26T19:00:00+08:00",
    "category_id": 601,
    "category_name": "电商"
  },
  {
    "id": 43,
    "title": "新型储能装机规模快速增长，电网调节能力显著增强",
    "summary": "国家能源局数据显示，电化学储能项目投运规模同比大幅提升。",
    "source_name": "新华网",
    "source_url": "https://www.xinhuanet.com",
    "credibility_score": 0.93,
    "publish_time": "2026-08-26T16:00:00+08:00",
    "category_id": 701,
    "category_name": "新能源"
  },
  {
    "id": 44,
    "title": "铁路货运量创历史新高，多式联运效率持续提升",
    "summary": "国铁集团数据显示，集装箱铁水联运量同比增长明显，运输结构不断优化。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-26T14:00:00+08:00",
    "category_id": 802,
    "category_name": "供应链"
  },
  {
    "id": 45,
    "title": "城中村改造政策支持范围扩大，配套融资工具加快落地",
    "summary": "多部门明确专项借款与配套贷款安排，首批改造项目已启动实施。",
    "source_name": "央视网",
    "source_url": "https://www.cctv.com",
    "credibility_score": 0.93,
    "publish_time": "2026-08-26T12:00:00+08:00",
    "category_id": 901,
    "category_ids": [
      901,
      902
    ],
    "category_name": "楼市政策"
  },
  {
    "id": 46,
    "title": "数据出境安全管理实施细则落地，数据合规治理体系完善",
    "summary": "国家网信办发布配套指引，明确重要数据出境评估与备案流程。",
    "source_name": "环球网",
    "source_url": "https://www.huangqiu.com",
    "credibility_score": 0.88,
    "publish_time": "2026-08-26T10:00:00+08:00",
    "category_id": 1001,
    "category_name": "法规动态"
  },
  {
    "id": 47,
    "title": "专精特新中小企业培育力度加大，北交所上市路径持续优化",
    "summary": "工信部公示新一批专精特新\"小巨人\"企业名单，直接融资支持增强。",
    "source_name": "第一财经",
    "source_url": "https://www.yicai.com",
    "credibility_score": 0.89,
    "publish_time": "2026-08-26T08:00:00+08:00",
    "category_id": 1102,
    "category_ids": [
      1102,
      501
    ],
    "category_name": "创业投资"
  },
  {
    "id": 48,
    "title": "多国央行增持黄金储备，全球外汇市场波动加剧",
    "summary": "世界黄金协会数据显示，新兴市场央行购金量保持高位。",
    "source_name": "彭博社",
    "source_url": "https://www.bloomberg.com",
    "credibility_score": 0.86,
    "publish_time": "2026-08-26T06:00:00+08:00",
    "category_id": 1202,
    "category_name": "全球经济"
  },
  {
    "id": 49,
    "title": "上半年国产游戏市场收入同比增长，精品化趋势明显",
    "summary": "行业报告显示，国产游戏国内收入与海外收入双增，长线运营能力提升。",
    "source_name": "游研社",
    "source_url": "https://www.yystv.cn",
    "credibility_score": 0.82,
    "publish_time": "2026-08-27T10:00:00+08:00",
    "category_id": 1301,
    "category_name": "电子游戏"
  },
  {
    "id": 50,
    "title": "多款国产游戏宣布全球同步发售，出海成绩亮眼",
    "summary": "多家厂商公布海外发行计划，本地化运营与跨平台策略成为主流。",
    "source_name": "触乐",
    "source_url": "https://www.chuapp.com",
    "credibility_score": 0.8,
    "publish_time": "2026-08-27T08:30:00+08:00",
    "category_id": 1301,
    "category_name": "电子游戏"
  },
  {
    "id": 51,
    "title": "游戏版号发放保持常态化，行业供给持续恢复",
    "summary": "主管部门连续多批次发放国产网络游戏版号，新品储备逐步释放。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.93,
    "publish_time": "2026-08-27T07:00:00+08:00",
    "category_id": 1301,
    "category_name": "电子游戏"
  },
  {
    "id": 52,
    "title": "云游戏技术成熟度提升，跨端订阅服务加速普及",
    "summary": "头部平台升级云游戏画质与延迟表现，订阅制带动用户规模增长。",
    "source_name": "第一财经",
    "source_url": "https://www.yicai.com",
    "credibility_score": 0.85,
    "publish_time": "2026-08-27T05:30:00+08:00",
    "category_id": 1301,
    "category_ids": [
      1301,
      1302
    ],
    "category_name": "电子游戏"
  },
  {
    "id": 53,
    "title": "新一代游戏主机销量刷新纪录，独占作品带动硬件增长",
    "summary": "行业机构统计，新一代主机累计销量已超过上一代同期水平。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.84,
    "publish_time": "2026-08-27T04:00:00+08:00",
    "category_id": 1302,
    "category_name": "主机游戏"
  },
  {
    "id": 54,
    "title": "国产单机游戏《黑神话：悟空》销量持续增长，带动文化出海讨论",
    "summary": "该作发售以来全球销量稳步攀升，被视为国产单机工业化能力的重要验证。",
    "source_name": "游研社",
    "source_url": "https://www.yystv.cn",
    "credibility_score": 0.81,
    "publish_time": "2026-08-27T02:30:00+08:00",
    "category_id": 1302,
    "category_name": "主机游戏"
  },
  {
    "id": 55,
    "title": "主机订阅服务竞争加剧，独占内容成平台核心差异",
    "summary": "多家平台调整订阅定价与首发政策，第一方作品成为拉新关键。",
    "source_name": "触乐",
    "source_url": "https://www.chuapp.com",
    "credibility_score": 0.79,
    "publish_time": "2026-08-27T01:00:00+08:00",
    "category_id": 1302,
    "category_name": "主机游戏"
  },
  {
    "id": 56,
    "title": "国际奥委会宣布电竞奥运会启动筹备，体育与电竞融合加速",
    "summary": "电竞奥运会筹备委员会成立，将设置多个正式比赛项目。",
    "source_name": "央视网",
    "source_url": "https://www.cctv.com",
    "credibility_score": 0.9,
    "publish_time": "2026-08-26T23:00:00+08:00",
    "category_id": 1303,
    "category_name": "电竞"
  },
  {
    "id": 57,
    "title": "全球电竞观众规模突破六亿，赛事商业化路径成熟",
    "summary": "行业报告显示，赛事版权、赞助与特许商品收入持续增长。",
    "source_name": "路透社",
    "source_url": "https://www.reuters.com",
    "credibility_score": 0.83,
    "publish_time": "2026-08-26T21:00:00+08:00",
    "category_id": 1303,
    "category_ids": [
      1303,
      1301
    ],
    "category_name": "电竞"
  },
  {
    "id": 58,
    "title": "电竞赛事落地城市带动文旅消费，\"电竞+\"新业态涌现",
    "summary": "多个城市引入顶级赛事并配套商圈活动，观赛经济效应显著。",
    "source_name": "澎湃新闻",
    "source_url": "https://www.thepaper.cn",
    "credibility_score": 0.84,
    "publish_time": "2026-08-26T19:00:00+08:00",
    "category_id": 1303,
    "category_name": "电竞"
  },
  {
    "id": 59,
    "title": "电竞选手职业化体系持续完善，青训与退役保障机制落地",
    "summary": "行业协会推动建立选手注册、转会与退役安置规范，俱乐部运营日趋成熟。",
    "source_name": "中国青年报",
    "source_url": "https://www.cyol.com",
    "credibility_score": 0.88,
    "publish_time": "2026-08-26T17:00:00+08:00",
    "category_id": 1303,
    "category_name": "电竞"
  },
  {
    "id": 60,
    "title": "独立游戏开发者大会举行，国产小团队作品获全球关注",
    "summary": "多款国产独立作品在大会获行业奖项，创意与玩法获得国际认可。",
    "source_name": "游研社",
    "source_url": "https://www.yystv.cn",
    "credibility_score": 0.8,
    "publish_time": "2026-08-26T15:00:00+08:00",
    "category_id": 1304,
    "category_name": "独立游戏"
  },
  {
    "id": 61,
    "title": "国产独立游戏销量榜单公布，多款创意作品上榜",
    "summary": "平台年度榜单显示，叙事与玩法创新类作品表现突出，口碑带动销量。",
    "source_name": "触乐",
    "source_url": "https://www.chuapp.com",
    "credibility_score": 0.78,
    "publish_time": "2026-08-26T13:00:00+08:00",
    "category_id": 1304,
    "category_name": "独立游戏"
  },
  {
    "id": 62,
    "title": "独立游戏扶持基金设立，中小团队融资渠道拓宽",
    "summary": "多家发行商与投资机构联合设立基金，为早期项目提供资金与发行支持。",
    "source_name": "第一财经",
    "source_url": "https://www.yicai.com",
    "credibility_score": 0.82,
    "publish_time": "2026-08-26T11:00:00+08:00",
    "category_id": 1304,
    "category_name": "独立游戏"
  },
  {
    "id": 63,
    "title": "多地调整最低工资标准，低收入群体保障水平提升",
    "summary": "多省份上调月最低工资标准，同步提高小时最低工资，覆盖灵活就业群体。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.93,
    "publish_time": "2026-08-27T06:30:00+08:00",
    "category_id": 1401,
    "category_ids": [
      1401,
      1402
    ],
    "category_name": "民生资讯"
  },
  {
    "id": 64,
    "title": "全国多地迎用电高峰，电网保供措施全面落地",
    "summary": "国家电网表示跨区输电通道满功率运行，需求侧响应机制同步启用。",
    "source_name": "央视网",
    "source_url": "https://www.cctv.com",
    "credibility_score": 0.94,
    "publish_time": "2026-08-27T04:30:00+08:00",
    "category_id": 1401,
    "category_name": "民生资讯"
  },
  {
    "id": 65,
    "title": "新一轮以旧换新政策加力扩围，家电汽车消费明显回暖",
    "summary": "商务部数据显示，汽车、家电以旧换新补贴申请量持续攀升。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.95,
    "publish_time": "2026-08-27T02:00:00+08:00",
    "category_id": 1401,
    "category_ids": [
      1401,
      502
    ],
    "category_name": "民生资讯"
  },
  {
    "id": 66,
    "title": "全国公安机关夏季治安打击整治行动成效显著",
    "summary": "行动期间破获一批突出犯罪案件，重点区域治安秩序明显改善。",
    "source_name": "人民日报",
    "source_url": "https://www.people.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-26T22:30:00+08:00",
    "category_id": 1402,
    "category_name": "社会法治"
  },
  {
    "id": 67,
    "title": "未成年人网络保护条例实施成效评估公布",
    "summary": "评估显示网络沉迷防治、个人信息保护等核心制度落地情况总体良好。",
    "source_name": "中国青年报",
    "source_url": "https://www.cyol.com",
    "credibility_score": 0.9,
    "publish_time": "2026-08-26T20:00:00+08:00",
    "category_id": 1402,
    "category_name": "社会法治"
  },
  {
    "id": 68,
    "title": "多地法院发布涉民生典型案例，强化合法权益保障",
    "summary": "典型案例涵盖劳动报酬、消费者权益等高频纠纷，明确裁判规则。",
    "source_name": "环球网",
    "source_url": "https://www.huangqiu.com",
    "credibility_score": 0.87,
    "publish_time": "2026-08-26T18:00:00+08:00",
    "category_id": 1402,
    "category_name": "社会法治"
  },
  {
    "id": 69,
    "title": "全国暑期档电影票房突破百亿，国产影片占比持续提升",
    "summary": "档期内多部国产影片口碑票房双丰收，优质供给带动观影人次回升。",
    "source_name": "央视网",
    "source_url": "https://www.cctv.com",
    "credibility_score": 0.93,
    "publish_time": "2026-08-26T16:30:00+08:00",
    "category_id": 1403,
    "category_ids": [
      1403,
      1401
    ],
    "category_name": "文化体育"
  },
  {
    "id": 70,
    "title": "多城马拉松赛事密集开跑，全民健身热潮持续升温",
    "summary": "下半年多场城市马拉松公布赛事计划，报名热度远超预期。",
    "source_name": "澎湃新闻",
    "source_url": "https://www.thepaper.cn",
    "credibility_score": 0.85,
    "publish_time": "2026-08-26T14:30:00+08:00",
    "category_id": 1403,
    "category_name": "文化体育"
  },
  {
    "id": 71,
    "title": "全国空气质量持续改善，重点区域PM2.5浓度明显下降",
    "summary": "生态环境部通报上半年空气质量状况，优良天数比例同比提升。",
    "source_name": "中国政府网",
    "source_url": "https://www.gov.cn",
    "credibility_score": 0.94,
    "publish_time": "2026-08-26T12:30:00+08:00",
    "category_id": 702,
    "category_ids": [
      702,
      1404
    ],
    "category_name": "碳中和"
  },
  {
    "id": 72,
    "title": "长江流域重点水域禁渔成效显现，水生生物资源稳步恢复",
    "summary": "监测显示江豚等旗舰物种数量回升，重点水域鱼类资源量持续增长。",
    "source_name": "新华网",
    "source_url": "https://www.xinhuanet.com",
    "credibility_score": 0.92,
    "publish_time": "2026-08-26T10:30:00+08:00",
    "category_id": 1404,
    "category_name": "生态环境"
  },
  {
    "id": 73,
    "title": "全国一体化算力网建设加速，智能算力规模持续扩大",
    "summary": "国家数据局等部门推动算力基础设施统筹布局，多地智算中心项目密集开工。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-27T11:00:00+08:00",
    "category_id": 101,
    "category_name": "人工智能"
  },
  {
    "id": 74,
    "title": "人工智能大模型加速落地垂直行业，智能应用普及率持续提升",
    "summary": "多家机构调研显示，大模型在金融、制造、医疗等行业的应用渗透率稳步提高。",
    "source_name": "央广网",
    "source_url": "https://www.cnr.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-27T07:00:00+08:00",
    "category_id": 101,
    "category_name": "人工智能"
  },
  {
    "id": 75,
    "title": "半导体设备国产化率稳步提升，产业链自主可控能力增强",
    "summary": "行业数据显示，刻蚀、薄膜沉积等关键设备的国产化进程明显加快。",
    "source_name": "每日经济新闻",
    "source_url": "https://www.nbd.com.cn",
    "credibility_score": 0.85,
    "publish_time": "2026-08-27T04:00:00+08:00",
    "category_id": 103,
    "category_name": "半导体"
  },
  {
    "id": 76,
    "title": "中长期资金入市政策落地显效，权益类资产配置比例稳步提升",
    "summary": "多家保险、社保等长期资金管理机构表示将稳步提高权益投资比例，市场长期资金供给改善。",
    "source_name": "证券时报",
    "source_url": "https://www.stcn.com",
    "credibility_score": 0.87,
    "publish_time": "2026-08-27T09:00:00+08:00",
    "category_id": 201,
    "category_name": "股票市场"
  },
  {
    "id": 77,
    "title": "上市公司并购重组活跃度提升，产业整合成为主流方向",
    "summary": "交易所数据显示，半导体、医药等领域的并购案例明显增多，产业链协同效应显现。",
    "source_name": "财联社",
    "source_url": "https://www.cls.cn",
    "credibility_score": 0.84,
    "publish_time": "2026-08-27T06:00:00+08:00",
    "category_id": 201,
    "category_name": "股票市场"
  },
  {
    "id": 78,
    "title": "多项促消费政策协同发力，内需潜力持续释放",
    "summary": "消费品以旧换新、服务消费扩容等政策效果逐步显现，消费市场保持回暖态势。",
    "source_name": "中国经济网",
    "source_url": "https://www.ce.cn",
    "credibility_score": 0.89,
    "publish_time": "2026-08-27T02:00:00+08:00",
    "category_id": 202,
    "category_name": "宏观经济"
  },
  {
    "id": 79,
    "title": "全国异地就医直接结算范围扩大，门诊慢特病跨省结算提速",
    "summary": "国家医保局数据显示，跨省异地就医备案与直接结算人次持续增长。",
    "source_name": "光明网",
    "source_url": "https://www.gmw.cn",
    "credibility_score": 0.9,
    "publish_time": "2026-08-26T22:00:00+08:00",
    "category_id": 302,
    "category_name": "公共卫生"
  },
  {
    "id": 80,
    "title": "国家组织药品集采常态化推进，中选药品价格明显下降",
    "summary": "新一批集采覆盖品种范围扩大，患者用药负担进一步减轻，医疗机构积极性提升。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-26T18:00:00+08:00",
    "category_id": 301,
    "category_name": "新药研发"
  },
  {
    "id": 81,
    "title": "多地推进职教高考改革试点，技能人才成长通道持续拓宽",
    "summary": "试点省份完善“文化素质+职业技能”考试招生办法，中职学生升学比例稳步提升。",
    "source_name": "光明网",
    "source_url": "https://www.gmw.cn",
    "credibility_score": 0.89,
    "publish_time": "2026-08-26T14:00:00+08:00",
    "category_id": 402,
    "category_name": "职业教育"
  },
  {
    "id": 82,
    "title": "国家助学贷款政策优化调整，申请额度上限提高",
    "summary": "新政策提高本专科生与研究生贷款额度上限，同步简化申请与还款流程。",
    "source_name": "央广网",
    "source_url": "https://www.cnr.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-26T10:00:00+08:00",
    "category_id": 401,
    "category_name": "高等教育"
  },
  {
    "id": 83,
    "title": "制造业新型技术改造城市试点启动，数字化转型资金支持落地",
    "summary": "工信部公示试点城市名单，中央财政资金重点支持重点行业设备更新与数字化改造。",
    "source_name": "证券时报",
    "source_url": "https://www.stcn.com",
    "credibility_score": 0.86,
    "publish_time": "2026-08-26T06:00:00+08:00",
    "category_id": 501,
    "category_name": "智能制造"
  },
  {
    "id": 84,
    "title": "国产大飞机商业运营加速，产业链配套不断完善",
    "summary": "多家航空公司接收新一批飞机，机队规模与航线网络持续扩大，带动产业链协同发展。",
    "source_name": "每日经济新闻",
    "source_url": "https://www.nbd.com.cn",
    "credibility_score": 0.85,
    "publish_time": "2026-08-26T02:00:00+08:00",
    "category_id": 502,
    "category_name": "汽车制造"
  },
  {
    "id": 85,
    "title": "新能源汽车下乡活动持续开展，县域充电设施加快布局",
    "summary": "多部委联合推动下乡车型目录扩充，县域配套服务网络同步完善。",
    "source_name": "中国经济网",
    "source_url": "https://www.ce.cn",
    "credibility_score": 0.88,
    "publish_time": "2026-08-25T22:00:00+08:00",
    "category_id": 601,
    "category_name": "电商"
  },
  {
    "id": 86,
    "title": "即时零售市场规模快速扩张，平台与商超融合趋势明显",
    "summary": "行业报告显示，即时零售覆盖品类从生鲜向全品类延伸，履约时效持续提升。",
    "source_name": "每日经济新闻",
    "source_url": "https://www.nbd.com.cn",
    "credibility_score": 0.84,
    "publish_time": "2026-08-25T18:00:00+08:00",
    "category_id": 601,
    "category_name": "电商"
  },
  {
    "id": 87,
    "title": "光伏产业链价格企稳回升，行业供给侧调整初见成效",
    "summary": "多晶硅、组件价格连续多周环比上涨，落后产能加速出清，行业竞争格局改善。",
    "source_name": "中国经济网",
    "source_url": "https://www.ce.cn",
    "credibility_score": 0.87,
    "publish_time": "2026-08-25T14:00:00+08:00",
    "category_id": 701,
    "category_name": "新能源"
  },
  {
    "id": 88,
    "title": "绿色电力证书交易活跃度提升，绿电消费比例持续增长",
    "summary": "主管部门扩大绿证核发范围，重点用能企业绿电采购意愿明显增强。",
    "source_name": "光明网",
    "source_url": "https://www.gmw.cn",
    "credibility_score": 0.89,
    "publish_time": "2026-08-25T10:00:00+08:00",
    "category_id": 702,
    "category_name": "碳中和"
  },
  {
    "id": 89,
    "title": "电网投资维持高位，特高压与配网建设同步提速",
    "summary": "国家能源局数据显示，电网工程完成投资保持较快增长，新能源送出能力增强。",
    "source_name": "证券时报",
    "source_url": "https://www.stcn.com",
    "credibility_score": 0.86,
    "publish_time": "2026-08-25T06:00:00+08:00",
    "category_id": 701,
    "category_name": "新能源"
  },
  {
    "id": 90,
    "title": "全国货运物流保持平稳运行，主要指标好于去年同期",
    "summary": "交通运输部门监测数据显示，公路、铁路货运量稳步回升，重点枢纽运行顺畅。",
    "source_name": "央广网",
    "source_url": "https://www.cnr.cn",
    "credibility_score": 0.9,
    "publish_time": "2026-08-25T02:00:00+08:00",
    "category_id": 802,
    "category_name": "供应链"
  },
  {
    "id": 91,
    "title": "快递进村覆盖率持续提升，农产品上行通道更加顺畅",
    "summary": "国家邮政局数据显示，村级寄递物流综合服务站建设加快，农村寄递网络不断织密。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-24T22:00:00+08:00",
    "category_id": 801,
    "category_name": "快递物流"
  },
  {
    "id": 92,
    "title": "房地产融资协调机制加快落地，白名单项目贷款投放提速",
    "summary": "金融监管部门数据显示，已审批通过的项目数量持续增加，项目建设资金保障加强。",
    "source_name": "每日经济新闻",
    "source_url": "https://www.nbd.com.cn",
    "credibility_score": 0.84,
    "publish_time": "2026-08-24T18:00:00+08:00",
    "category_id": 902,
    "category_name": "地产企业"
  },
  {
    "id": 93,
    "title": "配售型保障房建设试点扩大，住房保障体系加快构建",
    "summary": "多个城市公布年度配售型保障房筹建计划，申购条件与轮候规则陆续明确。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.9,
    "publish_time": "2026-08-24T14:00:00+08:00",
    "category_id": 901,
    "category_name": "楼市政策"
  },
  {
    "id": 94,
    "title": "最高检发布检察公益诉讼典型案例，聚焦生态环境与食品药品安全",
    "summary": "典型案例覆盖耕地保护、个人信息保护等新领域，进一步明确办案指引。",
    "source_name": "光明网",
    "source_url": "https://www.gmw.cn",
    "credibility_score": 0.9,
    "publish_time": "2026-08-24T10:00:00+08:00",
    "category_id": 1002,
    "category_name": "司法案例"
  },
  {
    "id": 95,
    "title": "新修订突发事件应对法正式实施，应急管理体系进一步完善",
    "summary": "法律明确分级响应与信息发布制度，强化基层应急能力建设与物资保障。",
    "source_name": "央广网",
    "source_url": "https://www.cnr.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-24T06:00:00+08:00",
    "category_id": 1001,
    "category_name": "法规动态"
  },
  {
    "id": 96,
    "title": "民营企业进出口占比持续提升，外贸经营主体活力增强",
    "summary": "海关总署数据显示，民营企业进出口规模保持较快增长，成为外贸主力军。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-24T02:00:00+08:00",
    "category_id": 1101,
    "category_name": "企业动态"
  },
  {
    "id": 97,
    "title": "私募股权市场投资热度回暖，硬科技赛道获机构重点布局",
    "summary": "一级市场数据显示，半导体、人工智能、新能源等领域融资事件占比过半。",
    "source_name": "财联社",
    "source_url": "https://www.cls.cn",
    "credibility_score": 0.83,
    "publish_time": "2026-08-23T22:00:00+08:00",
    "category_id": 1102,
    "category_name": "创业投资"
  },
  {
    "id": 98,
    "title": "中国—东盟自贸区升级谈判取得实质进展，区域经贸合作深化",
    "summary": "双方就货物贸易、投资便利化等议题达成多项共识，互联互通水平持续提升。",
    "source_name": "环球网",
    "source_url": "https://www.huangqiu.com",
    "credibility_score": 0.88,
    "publish_time": "2026-08-23T18:00:00+08:00",
    "category_id": 1201,
    "category_name": "国际关系"
  },
  {
    "id": 99,
    "title": "人民币跨境支付系统参与者持续扩容，跨境结算便利化提升",
    "summary": "数据显示，人民币跨境支付系统覆盖范围扩大，跨境结算业务量稳步增长。",
    "source_name": "中国经济网",
    "source_url": "https://www.ce.cn",
    "credibility_score": 0.88,
    "publish_time": "2026-08-23T14:00:00+08:00",
    "category_id": 1202,
    "category_name": "全球经济"
  },
  {
    "id": 100,
    "title": "国产游戏展会人气高涨，线下试玩与新品发布密集",
    "summary": "多款新作在展会上公布发售日期，玩家现场体验与预约热度超出预期。",
    "source_name": "游民星空",
    "source_url": "https://www.gamersky.com",
    "credibility_score": 0.74,
    "publish_time": "2026-08-27T10:00:00+08:00",
    "category_id": 1301,
    "category_name": "电子游戏"
  },
  {
    "id": 101,
    "title": "多款国产独立游戏获海外发行商签约，出海渠道持续拓宽",
    "summary": "多家独立游戏发行商表示，国产作品的叙事与玩法获得国际市场认可。",
    "source_name": "游民星空",
    "source_url": "https://www.gamersky.com",
    "credibility_score": 0.73,
    "publish_time": "2026-08-27T04:00:00+08:00",
    "category_id": 1304,
    "category_name": "独立游戏"
  },
  {
    "id": 102,
    "title": "未成年人防沉迷系统持续升级，适龄提示实现全覆盖",
    "summary": "主管部门推进网络游戏适龄提示制度落地，家长监护工具不断完善。",
    "source_name": "中国新闻网",
    "source_url": "https://www.chinanews.com.cn",
    "credibility_score": 0.92,
    "publish_time": "2026-08-27T00:00:00+08:00",
    "category_id": 1301,
    "category_name": "电子游戏"
  },
  {
    "id": 103,
    "title": "电竞俱乐部商业化提速，赞助与特许经营收入增长",
    "summary": "行业报告显示，头部俱乐部收入结构多元化，赛事赞助与周边销售贡献提升。",
    "source_name": "每日经济新闻",
    "source_url": "https://www.nbd.com.cn",
    "credibility_score": 0.83,
    "publish_time": "2026-08-26T20:00:00+08:00",
    "category_id": 1303,
    "category_name": "电竞"
  },
  {
    "id": 104,
    "title": "多地推进老年助餐服务行动，社区食堂覆盖范围持续扩大",
    "summary": "民政部门表示将持续推动助餐服务向农村地区延伸，破解老年人就餐难题。",
    "source_name": "新京报",
    "source_url": "https://www.bjnews.com.cn",
    "credibility_score": 0.87,
    "publish_time": "2026-08-26T16:00:00+08:00",
    "category_id": 1401,
    "category_name": "民生资讯"
  },
  {
    "id": 105,
    "title": "全国博物馆暑期接待量创新高，文博热持续升温",
    "summary": "多地博物馆延长开放时间并推出夜场活动，热门场馆预约火爆。",
    "source_name": "光明网",
    "source_url": "https://www.gmw.cn",
    "credibility_score": 0.9,
    "publish_time": "2026-08-26T12:00:00+08:00",
    "category_id": 1403,
    "category_name": "文化体育"
  },
  {
    "id": 106,
    "title": "新就业形态职业伤害保障试点扩围，外卖骑手权益保障加强",
    "summary": "试点省份扩大覆盖平台企业与人群范围，保障待遇水平稳步提升。",
    "source_name": "新京报",
    "source_url": "https://www.bjnews.com.cn",
    "credibility_score": 0.86,
    "publish_time": "2026-08-26T08:00:00+08:00",
    "category_id": 1402,
    "category_name": "社会法治"
  },
  {
    "id": 107,
    "title": "各地秋粮陆续进入收获期，粮食安全保障有力",
    "summary": "农业农村部门调度显示，秋粮长势总体较好，丰收基础扎实。",
    "source_name": "央广网",
    "source_url": "https://www.cnr.cn",
    "credibility_score": 0.91,
    "publish_time": "2026-08-26T04:00:00+08:00",
    "category_id": 1401,
    "category_name": "民生资讯"
  }
];
