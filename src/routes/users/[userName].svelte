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
