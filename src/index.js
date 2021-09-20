import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { EditPage } from "./page/editPage"
import { LoginPage } from "./page/loginPage"
import { ViewPage } from "./page/viewPage"
import { loadQuests, updateQuest, calcExp, login } from "./firebase"
import { Quest } from "./quest"


class Base extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: "",
      user_name: "",
      access_token: "",
      access_token_secret: "",
      quests: {},
    };

    this.login = login.bind(this)
  }


  componentDidMount() {
    if(this.state.user_id === ""){
      return
    }

    loadQuests(this.state.user_id).then((response) => {
      console.log(response);
      const quests = Object.fromEntries(
        response.map((quest) => [
          Number(quest[0]),
          new Quest(
            Number(quest[0]),
            quest[1]["name"],
            Number(quest[1]["proceed"]),
            Number(quest[1]["total"]),
            quest[1]["tags"]
          ),
        ])
      );
      this.setState({ quests: quests });
    });
  }

  proceedQuest(quest) {
    const prev_quest = new Quest(
      quest.quest_id,
      quest.questName,
      quest.proceed,
      quest.total,
      quest.tags
    )
    const quests = { ...this.state.quests };
    quests[quest.quest_id].proceed += 1;
    updateQuest(this.state.user_id, quests[quest.quest_id], prev_quest);
    this.setState({ quests: quests });
    this.checkQuestComplete()
  }

  editQuest(values, quest){
    const newQuest = new Quest(
      quest.quest_id,
      values.questName,
      Number(values.proceed),
      Number(values.total),
      [values.tags]
    );
    console.log(newQuest)
    updateQuest(this.state.user_id, newQuest, quest);

    return newQuest
  }

  render() {
    if(window.location.pathname.startsWith("/view/")){
      const pathname = window.location.pathname
      const userId = pathname.substr(6)

      return <ViewPage
        userId={userId}
      >
      </ViewPage>
    }
    if(this.state.user_id === ""){
      return <LoginPage
        login={() => this.login()}
      ></LoginPage>
    }else{
      return <EditPage
        quests={this.state.quests}
        userId={this.state.user_id}
        userName={this.state.user_name}
        access_token={this.state.access_token}
        access_token_secret={this.state.access_token_secret}
      >
      </EditPage>
    }
  }
}


// ========================================

ReactDOM.render(
  <Base />,
  document.getElementById("root")
);
