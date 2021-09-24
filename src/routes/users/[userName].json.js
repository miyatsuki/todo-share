import { GraphQLClient, gql } from "graphql-request";
import { HASURA_URL } from "$lib/env.js";
import { fetchQuestLog } from "$lib/quest.js";

async function getUserName(userName) {
  const graphQLClient = new GraphQLClient(HASURA_URL);
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

export async function get({ params }) {
  const { userName } = params;
  const userId = await getUserName(userName);
  const questLog = await fetchQuestLog(userId);
  const imageURL = `https://study-share.s3.ap-northeast-1.amazonaws.com/${userName}/all.png`

  return {
    body: {
      userName: userName,
      questLog: questLog,
      imageURL: imageURL
    },
  };
}
