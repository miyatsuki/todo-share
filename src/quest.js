export class Quest {
  constructor(quest_id, questName, proceed, total, tags) {
    this.quest_id = quest_id;
    this.questName = questName;
    this.proceed = proceed;
    this.total = total;
    this.tags = tags;
  }
}