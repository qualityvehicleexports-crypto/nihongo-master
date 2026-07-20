// Flat, namespaced dictionary of every learner-facing UI string. Every
// language file (dictionaries/*.ts) must implement this exact shape —
// TypeScript will error on a missing key, which is the safety net for
// translation completeness across 11 languages.
//
// Interpolation: strings containing {placeholders} are filled in by the
// small `t()` helper in index.ts, e.g. t(dict, "level.backToHome", {name}).

export interface Dictionary {
  category: {
    vocabulary: string;
    grammar: string;
    listening: string;
    listeningFull: string;
    reading: string;
  };
  learnerHome: {
    currentLevel: string;
    target: string;
    aiAnalysis: string;
    backToProfiles: string;
    aiCoachNote: string;
    chooseLevel: string;
    accuracyWithCount: string; // {pct} {total}
    notAttempted: string;
  };
  level: {
    backToHome: string; // {name}
    levelSuffix: string;
    tryQuiz: string;
    questionsCount: string;
    comprehensiveQuiz: string;
    randomAllCategories: string;
    vocabListTitle: string;
    grammarListTitle: string;
    example: string;
  };
  quiz: {
    loading: string;
    noQuestionsFound: string;
    loadFailed: string;
    backToLevel: string;
    resultsOf: string; // {name}
    correct: string;
    incorrect: string;
    correctAnswer: string; // {answer}
    next: string;
    scoreButton: string;
    scoring: string;
    aiAnalysis: string;
  };
  analytics: {
    backToHome: string; // {name}
    title: string;
    refresh: string;
    refreshing: string;
    coachAnalysis: string;
    lastUpdated: string; // {date}
    weakStrongTitle: string;
    weakStrongSubtitle: string;
    paceTitle: string;
    trendTitle: string;
    trendSubtitle: string;
    recommendationsTitle: string;
  };
  gauge: {
    statusGood: string;
    statusWarning: string;
    statusSerious: string;
    statusCritical: string;
    weeksEstimate: string; // {weeks}
  };
  lineChart: {
    noData: string;
    showTable: string;
    hideTable: string;
    tooltipAccuracy: string; // {pct} {correct} {attempts}
    colDate: string;
    colAttempts: string;
    colCorrect: string;
    colAccuracy: string;
  };
  narrative: {
    noAttempts: string;
    summary: string; // {total} {acc} {days}
    weakest: string; // {category}
    strongest: string; // {category}
    paceKnown: string; // {target} {weeks} {pct}
    paceUnknown: string;
  };
  pace: {
    levelReached: string;
    note: string; // {confidence}
    needMoreData: string;
    confidenceLow: string;
    confidenceMedium: string;
    confidenceHigh: string;
  };
  recommendations: {
    reviewWeakestTitle: string; // {category}
    reviewWeakestDescription: string; // {pct}
    tryComprehensiveTitle: string; // {level}
    tryComprehensiveDescription: string;
    vocabReviewTitle: string; // {level}
    vocabReviewDescription: string; // {count}
    grammarReviewTitle: string; // {level}
    grammarReviewDescription: string; // {count}
    levelUpTitle: string; // {level}
    levelUpDescription: string; // {current} {level}
  };
}
