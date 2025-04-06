export function analyzeMessage(message: string): {
  intent: string
  sentiment: string
  keywords: string[]
  intensity: number // 感情の強さ（0-10）
} {
  const lowerMessage = message.toLowerCase()

  // 意図の分析（拡張版）
  let intent = "general"

  if (
    lowerMessage.includes("こんにちは") ||
    lowerMessage.includes("おはよう") ||
    lowerMessage.includes("こんばんは") ||
    lowerMessage.includes("よろしく") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi")
  ) {
    intent = "greeting"
  } else if (
    lowerMessage.includes("?") ||
    lowerMessage.includes("？") ||
    lowerMessage.includes("ですか") ||
    lowerMessage.includes("かな") ||
    lowerMessage.includes("教えて") ||
    lowerMessage.includes("どう") ||
    lowerMessage.includes("何")
  ) {
    intent = "question"
  } else if (lowerMessage.includes("ありがとう") || lowerMessage.includes("感謝") || lowerMessage.includes("thanks")) {
    intent = "gratitude"
  } else if (lowerMessage.includes("助けて") || lowerMessage.includes("手伝って") || lowerMessage.includes("help")) {
    intent = "help_request"
  } else if (
    lowerMessage.includes("すごい") ||
    lowerMessage.includes("素晴らしい") ||
    lowerMessage.includes("良い") ||
    lowerMessage.includes("いい") ||
    lowerMessage.includes("great") ||
    lowerMessage.includes("good")
  ) {
    intent = "praise"
  } else if (
    lowerMessage.includes("ダメ") ||
    lowerMessage.includes("だめ") ||
    lowerMessage.includes("違う") ||
    lowerMessage.includes("ちがう") ||
    lowerMessage.includes("bad") ||
    lowerMessage.includes("wrong")
  ) {
    intent = "criticism"
  } else if (
    lowerMessage.includes("頑張") ||
    lowerMessage.includes("がんば") ||
    lowerMessage.includes("応援") ||
    lowerMessage.includes("エール")
  ) {
    intent = "encouragement"
  }

  // 感情分析（拡張版）
  let sentiment = "neutral"
  let intensity = 5 // デフォルトは中間

  // ポジティブな言葉とその強度
  const positiveWords = [
    { word: "ありがとう", strength: 7 },
    { word: "嬉しい", strength: 8 },
    { word: "楽しい", strength: 8 },
    { word: "すごい", strength: 9 },
    { word: "素晴らしい", strength: 10 },
    { word: "よかった", strength: 7 },
    { word: "好き", strength: 8 },
    { word: "幸せ", strength: 9 },
    { word: "感謝", strength: 8 },
    { word: "うれしい", strength: 8 },
    { word: "たのしい", strength: 8 },
    { word: "最高", strength: 10 },
    { word: "大好き", strength: 10 },
    { word: "excellent", strength: 9 },
    { word: "perfect", strength: 10 },
    { word: "great", strength: 8 },
    { word: "good", strength: 7 },
    { word: "nice", strength: 7 },
    { word: "love", strength: 9 },
  ]

  // ネガティブな言葉とその強度
  const negativeWords = [
    { word: "悲しい", strength: 7 },
    { word: "辛い", strength: 8 },
    { word: "大変", strength: 6 },
    { word: "疲れた", strength: 7 },
    { word: "難しい", strength: 6 },
    { word: "嫌い", strength: 8 },
    { word: "残念", strength: 7 },
    { word: "失敗", strength: 7 },
    { word: "だめ", strength: 7 },
    { word: "つらい", strength: 8 },
    { word: "かなしい", strength: 7 },
    { word: "最悪", strength: 10 },
    { word: "嫌だ", strength: 8 },
    { word: "terrible", strength: 9 },
    { word: "awful", strength: 8 },
    { word: "bad", strength: 7 },
    { word: "sad", strength: 7 },
    { word: "hate", strength: 9 },
  ]

  // 感情の強調表現
  const intensifiers = [
    { word: "とても", multiplier: 1.5 },
    { word: "すごく", multiplier: 1.5 },
    { word: "非常に", multiplier: 1.7 },
    { word: "めちゃくちゃ", multiplier: 1.8 },
    { word: "本当に", multiplier: 1.4 },
    { word: "マジで", multiplier: 1.6 },
    { word: "超", multiplier: 1.7 },
    { word: "very", multiplier: 1.5 },
    { word: "really", multiplier: 1.4 },
    { word: "extremely", multiplier: 1.7 },
    { word: "so", multiplier: 1.3 },
  ]

  // 検出されたキーワード
  const keywords: string[] = []

  // 感情分析
  let foundPositive = false
  let maxPositiveStrength = 0

  for (const { word, strength } of positiveWords) {
    if (lowerMessage.includes(word)) {
      foundPositive = true
      keywords.push(word)
      if (strength > maxPositiveStrength) {
        maxPositiveStrength = strength
      }
    }
  }

  let foundNegative = false
  let maxNegativeStrength = 0

  for (const { word, strength } of negativeWords) {
    if (lowerMessage.includes(word)) {
      foundNegative = true
      keywords.push(word)
      if (strength > maxNegativeStrength) {
        maxNegativeStrength = strength
      }
    }
  }

  // 強調表現の検出と感情の強度調整
  let intensifierMultiplier = 1.0
  for (const { word, multiplier } of intensifiers) {
    if (lowerMessage.includes(word)) {
      keywords.push(word)
      intensifierMultiplier = Math.max(intensifierMultiplier, multiplier)
    }
  }

  // 感情の判定と強度の計算
  if (foundPositive && foundNegative) {
    // 両方の感情がある場合は強い方を採用
    if (maxPositiveStrength > maxNegativeStrength) {
      sentiment = "positive"
      intensity = Math.min(10, Math.round(maxPositiveStrength * intensifierMultiplier))
    } else {
      sentiment = "negative"
      intensity = Math.min(10, Math.round(maxNegativeStrength * intensifierMultiplier))
    }
  } else if (foundPositive) {
    sentiment = "positive"
    intensity = Math.min(10, Math.round(maxPositiveStrength * intensifierMultiplier))
  } else if (foundNegative) {
    sentiment = "negative"
    intensity = Math.min(10, Math.round(maxNegativeStrength * intensifierMultiplier))
  } else {
    // 特定の感情が検出されない場合はニュートラル
    sentiment = "neutral"
    intensity = 5
  }

  // 感嘆符や疑問符の数に基づいて強度を調整
  const exclamationCount = (message.match(/!/g) || []).length
  const questionCount = (message.match(/\?/g) || []).length

  if (exclamationCount > 0) {
    intensity = Math.min(10, intensity + exclamationCount)
    keywords.push("!")
  }

  if (questionCount > 0) {
    keywords.push("?")
  }

  return { intent, sentiment, keywords, intensity }
}

// キャラクターの態度を更新する関数
export function updateCharacterAttitude(
  currentAttitude: string,
  messageHistory: { intent: string; sentiment: string; intensity: number }[],
  characterType: string,
): string {
  // 最近のメッセージの傾向を分析
  const recentMessages = messageHistory.slice(-5) // 最新の5つのメッセージを分析

  let positiveCount = 0
  let negativeCount = 0
  let questionCount = 0
  let praiseCount = 0
  let criticismCount = 0

  for (const msg of recentMessages) {
    if (msg.sentiment === "positive") positiveCount++
    if (msg.sentiment === "negative") negativeCount++
    if (msg.intent === "question") questionCount++
    if (msg.intent === "praise") praiseCount++
    if (msg.intent === "criticism") criticismCount++
  }

  // 態度の変化ロジック
  if (positiveCount >= 3 || praiseCount >= 2) {
    // ポジティブなメッセージが多い場合
    return characterType === "cat" ? "tsundere" : "friendly"
  } else if (negativeCount >= 3 || criticismCount >= 2) {
    // ネガティブなメッセージが多い場合
    return characterType === "cat" ? "aloof" : "sympathetic"
  } else if (questionCount >= 3) {
    // 質問が多い場合
    return "helpful"
  } else {
    // 大きな変化がない場合は現在の態度を維持
    return currentAttitude
  }
}

// キャラクターの態度に基づいた応答生成
export function generateCharacterResponse(
  analysis: { intent: string; sentiment: string; intensity: number },
  characterType: string,
  characterAttitude: string,
  characterMood: string,
): string {
  const { intent, sentiment, intensity } = analysis

  // 猫のキャラクター応答パターン
  const catResponses: Record<string, Record<string, string[]>> = {
    friendly: {
      greeting: ["にゃ〜、こんにちは！", "やあ、元気にゃ？", "こんにちは！今日も頑張ろうね！"],
      question: ["うーん、考えてみるにゃ...", "いい質問だにゃ！", "それはね..."],
      gratitude: ["どういたしまして！", "にゃはは、お役に立てて嬉しいにゃ！", "いつでも頼ってにゃ！"],
      help_request: ["任せるにゃ！", "どうしたの？手伝うよ！", "大丈夫、一緒に解決するにゃ！"],
      praise: ["えへへ、ありがとうにゃ！", "褒められると嬉しいにゃ〜", "もっと頑張るにゃ！"],
      criticism: ["ごめんにゃさい...", "次は気をつけるにゃ", "失敗しちゃったにゃ..."],
      encouragement: ["ありがとう！頑張るにゃ！", "応援してくれて嬉しいにゃ！", "一緒に頑張ろうね！"],
      general: ["なるほどにゃ〜", "そうなんだにゃ", "わかったにゃ！"],
    },
    tsundere: {
      greeting: ["ふん、こんにちはだにゃ", "ま、元気そうでなによりだにゃ", "...やあ"],
      question: [
        "そんなこともわからないの？...まあ教えてあげるにゃ",
        "ふーん、それが知りたいの？",
        "しょうがないにゃ、教えてあげる",
      ],
      gratitude: ["べ、別に君のためじゃないんだからね！", "当然だにゃ！", "...どういたしまして"],
      help_request: [
        "しょうがないにゃ、手伝ってあげる",
        "弱っているところは見ていられないにゃ...",
        "任せなさい！...別に心配してるわけじゃないけど",
      ],
      praise: ["べ、別に褒められて嬉しいわけじゃないんだからね！", "ふん、当然だにゃ", "...ありがと"],
      criticism: ["うっ...そんなつもりじゃなかったにゃ", "わ、わかってるよ！", "...ごめん"],
      encouragement: ["応援なんていらないにゃ...でも、ありがと", "ふん、当然頑張るにゃ", "...一緒に頑張ろうか"],
      general: ["ふーん", "まあそうかもね", "わかったわよ..."],
    },
    aloof: {
      greeting: ["...やあ", "こんにちは...", "..."],
      question: ["...知らない", "考えてみる...", "...難しい質問だね"],
      gratitude: ["...どういたしまして", "...うん", "...いいよ"],
      help_request: ["...できることなら", "...手伝おうか", "...何をすればいい？"],
      praise: ["...そう", "...ありがとう", "..."],
      criticism: ["...そうかもね", "...ごめん", "..."],
      encouragement: ["...うん", "...頑張る", "...ありがとう"],
      general: ["...", "...そう", "...なるほど"],
    },
    helpful: {
      greeting: [
        "こんにちは！何かお手伝いできることはあるかにゃ？",
        "やあ！今日は何をするにゃ？",
        "こんにちは！タスク管理のお手伝いをするにゃ！",
      ],
      question: ["いい質問だにゃ！答えを探すよ！", "それについて調べてみるにゃ！", "うーん、考えてみるにゃ..."],
      gratitude: ["お役に立てて嬉しいにゃ！", "いつでも頼ってにゃ！", "どういたしまして！もっとお手伝いするにゃ！"],
      help_request: ["すぐに手伝うにゃ！", "どんな問題でも解決するにゃ！", "任せるにゃ！"],
      praise: ["ありがとうにゃ！もっと頑張るよ！", "嬉しいにゃ！これからも頑張るよ！", "褒めてくれてありがとうにゃ！"],
      criticism: ["改善するにゃ！", "ごめんにゃさい、次は気をつけるよ！", "フィードバックありがとうにゃ！"],
      encouragement: ["一緒に頑張るにゃ！", "応援ありがとうにゃ！", "絶対に成功するにゃ！"],
      general: ["なるほどにゃ！", "わかったにゃ！", "了解したにゃ！"],
    },
  }

  // 犬のキャラクター応答パターン
  const dogResponses: Record<string, Record<string, string[]>> = {
    friendly: {
      greeting: ["わん！こんにちは！", "やあ、元気かな？", "こんにちはわん！今日も一緒に頑張ろう！"],
      question: ["うーん、考えてみるわん...", "いい質問だワン！", "それはね..."],
      gratitude: ["どういたしまして！", "わん！お役に立てて嬉しいよ！", "いつでも頼ってワン！"],
      help_request: ["任せるワン！", "どうしたの？手伝うよ！", "大丈夫、一緒に解決するワン！"],
      praise: ["わん！ありがとう！", "褒められると嬉しいワン！", "もっと頑張るワン！"],
      criticism: ["ごめんなさいワン...", "次は気をつけるワン", "失敗しちゃったワン..."],
      encouragement: ["ありがとう！頑張るワン！", "応援してくれて嬉しいワン！", "一緒に頑張ろうね！"],
      general: ["なるほどワン！", "そうなんだワン", "わかったワン！"],
    },
    sympathetic: {
      greeting: ["こんにちは...元気？", "やあ、何か悩みがあるなら聞くよ", "こんにちは、今日の調子はどう？"],
      question: ["うーん、一緒に考えてみよう...", "いい質問だね、答えを探すよ", "それは難しいけど..."],
      gratitude: ["いつでも頼ってね", "困ったときはお互い様だよ", "どういたしまして、また何かあれば言ってね"],
      help_request: ["大丈夫、一緒に乗り越えよう", "何があったの？話を聞かせて", "心配しないで、手伝うよ"],
      praise: ["そう言ってくれて嬉しいよ", "ありがとう、君も頑張ってるね", "お互い頑張ろうね"],
      criticism: ["ごめんね...改善するよ", "そうだね、気をつけるよ", "フィードバックありがとう、直すね"],
      encouragement: ["君なら絶対できるよ！", "一緒に頑張ろう！", "応援してるよ！"],
      general: ["そうなんだね...", "気持ちわかるよ", "なるほど、それで？"],
    },
    energetic: {
      greeting: ["わんわん！こんにちは！", "やっほー！元気いっぱいだワン！", "わーい！会えて嬉しいワン！"],
      question: ["考えるワン！考えるワン！", "わくわく！いい質問だワン！", "うーん！答えを探すワン！"],
      gratitude: ["やったー！役に立ててうれしいワン！", "わんわん！いつでも頼ってね！", "わーい！どういたしまして！"],
      help_request: ["任せて任せて！すぐに助けるワン！", "大丈夫！一緒に解決するワン！", "よーし！手伝うぞー！"],
      praise: ["わーい！ありがとうワン！", "もっともっと頑張るワン！", "嬉しすぎて尻尾が止まらないワン！"],
      criticism: ["うぅ...ごめんなさいワン...", "次は絶対失敗しないワン！", "もっと頑張るワン！"],
      encouragement: ["わんわん！一緒に頑張るワン！", "絶対に成功するワン！", "応援ありがとうワン！"],
      general: ["わかったワン！", "そうなんだワン！", "なるほどワン！"],
    },
    helpful: {
      greeting: [
        "こんにちは！何かお手伝いできることはあるかな？",
        "やあ！今日は何をする？",
        "こんにちは！タスク管理のお手伝いをするよ！",
      ],
      question: ["いい質問だね！答えを探すよ！", "それについて調べてみるね！", "うーん、考えてみるワン..."],
      gratitude: ["お役に立てて嬉しいよ！", "いつでも頼ってね！", "どういたしまして！もっとお手伝いするよ！"],
      help_request: ["すぐに手伝うよ！", "どんな問題でも解決するワン！", "任せてね！"],
      praise: ["ありがとう！もっと頑張るよ！", "嬉しいワン！これからも頑張るよ！", "褒めてくれてありがとう！"],
      criticism: ["改善するワン！", "ごめんなさい、次は気をつけるよ！", "フィードバックありがとう！"],
      encouragement: ["一緒に頑張ろう！", "応援ありがとう！", "絶対に成功するワン！"],
      general: ["なるほど！", "わかったワン！", "了解したよ！"],
    },
  }

  // キャラクタータイプと態度に基づいて応答パターンを選択
  const responsePatterns = characterType === "cat" ? catResponses : dogResponses
  const attitudeResponses = responsePatterns[characterAttitude] || responsePatterns.friendly
  const intentResponses = attitudeResponses[intent] || attitudeResponses.general

  // ランダムに応答を選択
  const randomIndex = Math.floor(Math.random() * intentResponses.length)
  let response = intentResponses[randomIndex]

  // 感情の強度に応じて応答を調整
  if (sentiment === "positive" && intensity >= 8) {
    response = `${response} ${characterType === "cat" ? "にゃ〜！！" : "わん！！"}`
  } else if (sentiment === "negative" && intensity >= 8) {
    response = `${response} ${characterType === "cat" ? "...にゃ" : "...わん"}`
  }

  // 気分に応じた追加表現
  if (characterMood === "happy") {
    response = `${response} ${characterType === "cat" ? "😺" : "🐶"}`
  } else if (characterMood === "sad") {
    response = `${response} ${characterType === "cat" ? "😿" : "🐶💧"}`
  } else if (characterMood === "angry") {
    response = `${response} ${characterType === "cat" ? "😾" : "🐶💢"}`
  }

  return response
}

