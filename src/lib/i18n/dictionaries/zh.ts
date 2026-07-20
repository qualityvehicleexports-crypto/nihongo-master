import type { Dictionary } from "../types";

const zh: Dictionary = {
  category: { vocabulary: "词汇", grammar: "语法", listening: "听力", listeningFull: "听力（含文字稿）", reading: "阅读" },
  learnerHome: { currentLevel: "当前等级", target: "目标", aiAnalysis: "查看AI分析", backToProfiles: "返回选择账号", aiCoachNote: "来自AI教练的提示", chooseLevel: "选择等级", accuracyWithCount: "正确率{pct}%（共{total}题）", notAttempted: "尚未作答" },
  level: { backToHome: "← 返回{name}的主页", levelSuffix: "级", tryQuiz: "开始测验", questionsCount: "10道题", comprehensiveQuiz: "综合测验", randomAllCategories: "从所有分类中随机出题", vocabListTitle: "词汇表（示例）", grammarListTitle: "语法表（示例）", example: "例句：" },
  quiz: { loading: "正在加载题目...", noQuestionsFound: "未找到符合条件的测验题目。", loadFailed: "加载题目失败。", backToLevel: "返回等级页面", resultsOf: "{name}的成绩", correct: "正确", incorrect: "错误", correctAnswer: "正确答案：{answer}", next: "下一题", scoreButton: "提交", scoring: "正在评分...", aiAnalysis: "查看AI分析" },
  analytics: { backToHome: "← 返回{name}的主页", title: "AI学习进度分析", refresh: "刷新分析", refreshing: "正在刷新...", coachAnalysis: "AI教练分析", lastUpdated: "最后更新：{date}", weakStrongTitle: "强项与弱项", weakStrongSubtitle: "各分类正确率", paceTitle: "通过概率与学习进度", trendTitle: "进度趋势（最近30天）", trendSubtitle: "每日正确率", recommendationsTitle: "接下来该学什么" },
  gauge: { statusGood: "进展顺利", statusWarning: "即将达成", statusSerious: "需要复习", statusCritical: "需要注意", weeksEstimate: "预计约需{weeks}周可达到目标。" },
  lineChart: { noData: "暂无学习记录。完成一次测验后，您的每日正确率将显示在这里。", showTable: "显示表格", hideTable: "隐藏表格", tooltipAccuracy: "正确率{pct}%（{correct}/{attempts}题）", colDate: "日期", colAttempts: "作答数", colCorrect: "正确数", colAccuracy: "正确率" },
  narrative: { noAttempts: "目前还没有测验记录。选择一个等级并开始测验吧——有了数据后，AI将分析您的薄弱环节和学习进度。", summary: "您目前已完成{total}道题，正确率{acc}%（共{days}天有学习记录）。", weakest: "您在{category}方面的正确率略低于其他分类，建议优先复习这一部分。", strongest: "您在{category}方面表现不错，请继续保持。", paceKnown: "按照您目前的学习进度，预计约{weeks}周后可达到{target}水平，通过概率约为{pct}%。", paceUnknown: "还需要再完成几次测验才能估算学习进度。" },
  pace: { levelReached: "您已经达到目标等级，请继续复习以保持水平。", note: "这是根据您目前的学习进度所做的估算（可信度：{confidence}）。", needMoreData: "目前的测验记录还不多，需要再完成几次测验才能得到可靠的估算。", confidenceLow: "低", confidenceMedium: "中", confidenceHigh: "高" },
  recommendations: { reviewWeakestTitle: "重点复习{category}", reviewWeakestDescription: "您在这方面的近期正确率为{pct}%。再次尝试同一分类有助于加深记忆。", tryComprehensiveTitle: "尝试{level}综合测验", tryComprehensiveDescription: "从一个涵盖所有分类的测验开始，了解自己目前的水平。", vocabReviewTitle: "复习{level}词汇表", vocabReviewDescription: "复习这{count}个单词，重点关注您不太熟悉的词汇。", grammarReviewTitle: "复习{level}语法句型", grammarReviewDescription: "复习这{count}个句型及其例句。", levelUpTitle: "可以开始学习{level}了", levelUpDescription: "您在{current}方面的正确率一直很稳定——接下来可以试试{level}测验。" },
};

export default zh;