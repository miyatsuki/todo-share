import { GraphQLClient, gql } from "graphql-request";
import { HASURA_URL } from "$lib/env.js";

export async function fetchQuestLog(userId) {
	const graphQLClient = new GraphQLClient(HASURA_URL);

	const query = gql`
		query ($userId: String) {
			quests(where: { user_id: { _eq: $userId } }) {
				id
				quest_name
				quest_id
				insert_time
				before_proceed
				after_proceed
				total
			}
		}
	`;
	const variables = { userId: userId };
	const data = await graphQLClient.request(query, variables);

	const questLog = data["quests"].map( quest => {
		// hasuraにはUTCで入る
		var d = new Date(quest.insert_time)
		d.setHours(d.getHours() + 9)

		return {
			id: quest.id,
			questName: quest.quest_name,
			questId: quest.quest_id,
			insertTime: d,
			beforeProceed: quest.before_proceed,
			afterProceed: quest.after_proceed,
			total: quest.total,
		}
	})

	return questLog
}

export async function fetchCurrentQuests(userId){
	const questLog = await fetchQuestLog(userId)
	return extractCurrentQuests(questLog)
}

export function extractCurrentQuests(questLog){
	let currentQuests = {};
	for (var quest of questLog) {
		if (
			quest.questId in currentQuests &&
			currentQuests[quest.questId].insertTime <= quest.insertTime
		) {
			currentQuests[quest.questId] = quest;
		} else {
			currentQuests[quest.questId] = quest;
		}
	}

	return Object.keys(currentQuests).map((k) => {
		return {
			questId: currentQuests[k].questId,
			questName: currentQuests[k].questName,
			proceed: currentQuests[k].afterProceed,
			total: currentQuests[k].total,
			updateTime: new Date(currentQuests[k].insertTime),
		};
	});
}