import { GraphQLClient, gql } from "graphql-request";
import { HASURA_URL } from "$lib/env.js";

const graphQLClient = new GraphQLClient(HASURA_URL);

async function getUserName(userName) {
  const query = gql`
    query ($userName: String) {
      users(where: { user_name: { _eq: $userName } }) {
        user_id
      }
    }
  `;
  const variables = { userName: userName };
  const data = await graphQLClient.request(query, variables);
  const userId = data["users"][0]["user_id"];

  return userId;
}

async function getQuestLog(userId) {
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
  return data["quests"];
}

async function createImage(userName, questLog) {

  let rawQuestLog = {};
  for (var quest of questLog) {
    if (
      quest.quest_id in rawQuestLog &&
      rawQuestLog[quest.quest_id].insert_time <= quest.insert_time
    ) {
      rawQuestLog[quest.quest_id] = quest;
    } else {
      rawQuestLog[quest.quest_id] = quest;
    }
  }

  let quests = {}
  for (var questId of Object.keys(rawQuestLog)){
    quests[rawQuestLog[questId].quest_name] = rawQuestLog[questId].after_proceed / rawQuestLog[questId].total
  }

  var imageURL
  const response  = await fetch(
    'https://j5wvkfcw7k.execute-api.ap-northeast-1.amazonaws.com/image', 
    {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {        
          user_name: userName,
          quests: quests
        }
      )
    }
  )

  imageURL = response["url"]
  return imageURL
}

export async function get({ params }) {
  const { userName } = params;
  const userId = await getUserName(userName);
  const questLog = await getQuestLog(userId);
  // const imageURL = await createImage(userName, questLog)
  const imageURL = `https://study-share.s3.ap-northeast-1.amazonaws.com/${userName}/all.png`

  return {
    body: {
      userName: userName,
      questLog: questLog,
      imageURL: imageURL
    },
  };
}
