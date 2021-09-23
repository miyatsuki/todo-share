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


export async function get({ params }) {
  const { userName } = params;
  const userId = await getUserName(userName);
  const questLog = await getQuestLog(userId);
  const imageURL = `https://study-share.s3.ap-northeast-1.amazonaws.com/${userName}/all.png`

  return {
    body: {
      userName: userName,
      questLog: questLog,
      imageURL: imageURL
    },
  };
}
