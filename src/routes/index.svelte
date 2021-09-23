<script>
  import { onMount } from "svelte";
  import Auth0Client from "@auth0/auth0-spa-js";
  import { GraphQLClient, gql } from "graphql-request";
  import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, HASURA_URL } from "$lib/env.js";

  let auth0Client;
  onMount(async () => {
    auth0Client = await new Auth0Client({
      domain: AUTH0_DOMAIN,
      client_id: AUTH0_CLIENT_ID,
    });
  });

  var isAuthenticated = false;
  var idToken;
  var userId;
  async function handleClick() {
    const token = await auth0Client.loginWithPopup({});
    isAuthenticated = await auth0Client.isAuthenticated();

    //logged in. you can get the user profile like this:
    const user = await auth0Client.getUser();
    userId = user["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    let claim = await auth0Client.getIdTokenClaims();
    idToken = claim.__raw;

    await fetchUserQuest(userId, idToken);
  }

  var questLog;
  var maxQuestId = 0;
  async function fetchUserQuest(userId, idToken) {
    const graphQLClient = new GraphQLClient(HASURA_URL, {
      headers: {
        authorization: "Bearer " + idToken,
      },
    });

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

    let rawQuestLog = {};
    for (var quest of data["quests"]) {
      if (
        quest.quest_id in rawQuestLog &&
        rawQuestLog[quest.quest_id].insert_time <= quest.insert_time
      ) {
        rawQuestLog[quest.quest_id] = quest;
      } else {
        rawQuestLog[quest.quest_id] = quest;
      }

      if (maxQuestId < quest.quest_id) {
        maxQuestId = quest.quest_id;
      }
    }

    questLog = Object.keys(rawQuestLog).map((k) => {
      return {
        questId: rawQuestLog[k].quest_id,
        questName: rawQuestLog[k].quest_name,
        proceed: rawQuestLog[k].after_proceed,
        total: rawQuestLog[k].total,
      };
    });
  }

  var userName;
  async function getUserName(userId) {
    const graphQLClient = new GraphQLClient(HASURA_URL);

    const query = gql`
      query ($userId: String) {
        users(where: { user_id: { _eq: $userId } }) {
          user_name
        }
      }
    `;
    const variables = { userId: userId };
    const data = await graphQLClient.request(query, variables);
    userName = data["users"][0]["user_name"];

    return userName;
  }

  async function updateQuest(updatedQuest) {
    const updatedQuestLog = [];
    for (var quest of questLog) {
      if (updatedQuest.questId !== quest.questId) {
        updatedQuestLog.push(quest);
      } else {
        updatedQuestLog.push({ ...updatedQuest });
        // run update query
        const query = gql`
					mutation MyMutation {
					insert_quests_one(object: {after_proceed: ${updatedQuest.proceed}, before_proceed: ${quest.proceed}, quest_id: ${updatedQuest.questId}, quest_name: "${updatedQuest.questName}", total: ${updatedQuest.total}, user_id: "${userId}"}) {
						id
						user_id
						total
						quest_name
						quest_id
						insert_time
						before_proceed
						after_proceed
					}
				}
				`;

        const graphQLClient = new GraphQLClient(HASURA_URL, {
          headers: {
            authorization: "Bearer " + idToken,
          },
        });
        graphQLClient.request(query);
      }
    }

    questLog = [...updatedQuestLog];
    createImage(questLog);
  }

  async function addQuest(addingQuest) {
    // run update query
    const query = gql`
			mutation MyMutation {
			insert_quests_one(object: {after_proceed: ${addingQuest.proceed}, before_proceed: 0, quest_id: ${addingQuest.questId}, quest_name: "${addingQuest.questName}", total: ${addingQuest.total}, user_id: "${userId}"}) {
				id
				user_id
				total
				quest_name
				quest_id
				insert_time
				before_proceed
				after_proceed
			}
		}
		`;

    const graphQLClient = new GraphQLClient(HASURA_URL, {
      headers: {
        authorization: "Bearer " + idToken,
      },
    });
    graphQLClient.request(query);
    questLog = [...questLog, addingQuest];
    createImage(questLog);
  }

  async function createImage(questLog) {
    if (!userName) {
      await getUserName(userId);
    }

    let quests = {};
    for (var quest of questLog) {
      quests[quest.questName] = quest.proceed / quest.total;
    }

    const response = await fetch(
      "https://j5wvkfcw7k.execute-api.ap-northeast-1.amazonaws.com/image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName,
          quests: quests,
        }),
      }
    );
  }

  let editingQuest;
  function handleEditButtonClick(quest) {
    editingQuest = { ...quest };
  }

  let addingQuest;
  function hancleAddButtonClick() {
    addingQuest = {
      questId: maxQuestId + 1,
      questName: null,
      proceed: null,
      total: null,
    };
  }

  function handleUpdateButton(quest) {
    if (
      editingQuest.questName !== quest.questName ||
      editingQuest.proceed !== quest.proceed ||
      editingQuest.total !== quest.total
    ) {
      updateQuest(editingQuest);
    }
    editingQuest = null;
  }

  function handleAddQuestButton() {
    if (addingQuest.questName && addingQuest.proceed && addingQuest.total) {
      maxQuestId = addingQuest.questId;
      addQuest(addingQuest);
    }

    addingQuest = null;
  }

  function handleCancelButton() {
    editingQuest = null;
    addingQuest = null;
  }
</script>

<div>クエスト一覧</div>
{#if !auth0Client}
  初期化中...
{:else if !isAuthenticated}
  <button on:click={handleClick} id="login">login</button>
{:else if !questLog}
  データ取得中。。。
{:else}
  {#each questLog as quest (quest.questId)}
    {#if !editingQuest || editingQuest.questId !== quest.questId}
      <div>
        <span>#{quest.questId}</span>
        <span>{quest.questName}</span>
        <span>{quest.proceed}/{quest.total}</span>
        <button on:click={() => handleEditButtonClick(quest)}>編集</button>
      </div>
    {:else}
      <div>
        <span>#{quest.questId}</span>
        <input bind:value={editingQuest.questName} placeholder="クエスト名" />
        <input bind:value={editingQuest.proceed} placeholder="進捗" />/<input
          bind:value={editingQuest.total}
          placeholder="合計"
        />
        <button on:click={() => handleUpdateButton(quest)}>更新</button>
        <button on:click={handleCancelButton}>キャンセル</button>
      </div>
    {/if}
  {/each}
  {#if addingQuest}
    <div>
      <span>#{addingQuest.questId}</span>
      <input bind:value={addingQuest.questName} placeholder="クエスト名" />
      <input bind:value={addingQuest.proceed} placeholder="進捗" />/<input
        bind:value={addingQuest.total}
        placeholder="合計"
      />
      <button on:click={handleAddQuestButton}>追加</button>
      <button on:click={handleCancelButton}>キャンセル</button>
    </div>
  {/if}
  <button on:click={hancleAddButtonClick}>クエスト追加</button>
{/if}
