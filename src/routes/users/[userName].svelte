<script context="module">
  export async function load({ page, fetch }) {
    const url = `/users/${page.params.userName}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return;
    }
    const { userName, questLog, imageURL } = await res.json();
    return {
      props: {
        userName: userName,
        questLog: questLog,
        imageURL: imageURL,
      },
    };
  }
</script>

<script>
  export let userName;
  export let questLog;
  export let imageURL;
  const siteURL = `https://todo-share.vercel.app/users/${userName}`;
  const siteTitle = `${userName}の学習ログ`;
</script>

<svelte:head>
  <meta name="twitter:card" content="summary_large_image" />
  <meta property="og:url" content={siteURL} />
  <meta property="og:title" content={siteTitle} />
  <meta property="og:description" content={siteTitle} />
  <meta property="og:image" content={imageURL} />
</svelte:head>

<span>{userName} の 勉強ログ</span>

{#each questLog as quest (quest.id)}
  <div>
    <span>#{quest.questId}</span>
    <span>{quest.questName}</span>
    <span
      >{quest.beforeProceed}/{quest.total} -> {quest.afterProceed}/{quest.total}</span
    >
    <span>{quest.insertTime}</span>
  </div>
{/each}
