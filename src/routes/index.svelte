<script>
  import { onMount } from "svelte";
  import Auth0Client from "@auth0/auth0-spa-js";
  import { GraphQLClient, gql } from "graphql-request";
  import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, HASURA_URL } from "$lib/env.js";
  import { fetchCurrentQuests } from "$lib/quest";

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

    fetchUserQuest(userId);

    let claim = await auth0Client.getIdTokenClaims();
    idToken = claim.__raw;
  }

  var currentQuests;
  var maxQuestId = 0;
  async function fetchUserQuest(userId) {
    currentQuests = await fetchCurrentQuests(userId);

    for (var questName of Object.keys(currentQuests)) {
      if (currentQuests[questName].questId > maxQuestId) {
        maxQuestId += currentQuests[questName].questId;
      }
    }

    return currentQuests;
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
    const updatedQuests = [];
    for (var quest of currentQuests) {
      if (updatedQuest.questId !== quest.questId) {
        updatedQuests.push(quest);
      } else {
        updatedQuest["updateTime"] = new Date();
        updatedQuests.push({ ...updatedQuest });
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

    currentQuests = [...updatedQuests];
    createImage(currentQuests);
  }

  async function addQuest(addingQuest) {
    addingQuest["updateTime"] = new Date();

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
    currentQuests = [...currentQuests, addingQuest];
    createImage(currentQuests);
  }

  async function createImage(currentQuests) {
    const today = new Date();
    const yyyy = today.getFullYear().toString();
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const dd = today.getDate().toString().padStart(2, "0");
    const yyyymmdd = yyyy + mm + dd;

    let highlight = [];
    for (var quest of currentQuests) {
      if (
        quest.updateTime.getFullYear() == today.getFullYear() &&
        quest.updateTime.getMonth() == today.getMonth() &&
        quest.updateTime.getDate() == today.getDate()
      ) {
        highlight.push(quest.questName);
      }
    }

    if (!userName) {
      await getUserName(userId);
    }

    let quests = {};
    for (var quest of currentQuests) {
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
          yyyymmdd: yyyymmdd,
          highlight: highlight,
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
{:else if !currentQuests || !idToken}
  データ取得中。。。
{:else}
  {#each currentQuests as quest (quest.questId)}
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
