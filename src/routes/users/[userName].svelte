<script context="module">
  export async function load({ page, fetch }) {
    const url = `/users/${page.params.userName}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return;
    }
    const { userName, questLog } = await res.json();
    return {
      props: {
        userName: userName,
        questLog: questLog,
      },
    };
  }
</script>

<script>
  export let userName;
  export let questLog;
</script>

<svelte:head>
  <meta name="twitter:card" content="summary" />
  <meta
    property="og:url"
    content="http://bits.blogs.nytimes.com/2011/12/08/a-twitter-for-my-sister/"
  />
  <meta property="og:title" content="A Twitter for My Sister" />
  <meta
    property="og:description"
    content="In the early days, Twitter grew so quickly that it was almost impossible to add new features because engineers spent their time trying to keep the rocket ship from stalling."
  />
  <meta
    property="og:image"
    content="http://graphics8.nytimes.com/images/2011/12/08/technology/bits-newtwitter/bits-newtwitter-tmagArticle.jpg"
  />
</svelte:head>

<span>{userName} の 勉強ログ</span>

{#each questLog as quest (quest.id)}
  <div>
    <span>#{quest.quest_id}</span>
    <span>{quest.quest_name}</span>
    <span
      >{quest.before_proceed}/{quest.total} -> {quest.after_proceed}/{quest.total}</span
    >
    <span>{quest.insert_time}</span>
  </div>
{/each}
