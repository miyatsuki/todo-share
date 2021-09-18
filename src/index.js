import React from "react";
import ReactDOM from "react-dom";
import ReactModal from "react-modal";
import "./index.css";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, serverTimestamp, query } from "firebase/firestore";
import { getAuth, signInWithPopup, TwitterAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
const axios = require('axios').default;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPoJ0DnaAosqUdSWMqLbsGqZnEaiXTXD0",
  authDomain: "todo-share-d22b4.firebaseapp.com",
  projectId: "todo-share-d22b4",
  storageBucket: "todo-share-d22b4.appspot.com",
  messagingSenderId: "191584350833",
  appId: "1:191584350833:web:eeb5f9f97f714ed1b761d0",
  measurementId: "G-SYC1XPYCY1",
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
initializeApp(firebaseConfig);

// Firestore
const db = getFirestore();
async function loadQuests(user_id) {
  const querySnapshot = await getDocs(
    collection(db, "users/" + user_id + "/quests")
  );

  let result = [];
  querySnapshot.forEach((doc) => result.push([doc.id, doc.data()]));
  result = result.filter((doc) => doc[1].total > doc[1].proceed)

  return result;
}

// Auth
const auth = getAuth();
const provider = new TwitterAuthProvider();

async function updateQuest(user_id, quest, prevQuest) {
  console.log(quest);
  await setDoc(doc(db, "users/" + user_id + "/quests/" + quest.quest_id), {
    name: quest.questName,
    proceed: quest.proceed,
    total: quest.total,
    tags: quest.tags,
  });

  await addDoc(collection(db, "users/" + user_id + "/proceed_log"), {
    quest_id: quest.quest_id,
    before_proceed: prevQuest ? prevQuest.proceed : 0,
    after_proceed: quest.proceed,
    tags: quest.tags,
    timestamp: serverTimestamp()
  });
}

async function calcExp(user_id, range) {
  const d = new Date()
  var from_date, to_date
  if(range === "day"){
    from_date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    to_date  = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  }
  else{
    console.log(range)
    return []
  }

  const q = query(
    collection(db, "users/" + user_id + "/proceed_log")
  );

  const result = [];
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    result.push([
      doc.data().tags[0], 
      doc.data().after_proceed - doc.data().before_proceed,
      doc.data().timestamp.toDate()
    ])
  });

  let expDict = {user_name: "user_name", exp: {}}
  for(let proceed of result){
    if(proceed[1] == 0 || proceed[2] < from_date || proceed[2] > to_date){
      continue
    }

    if(!(proceed[0] in expDict)){
      expDict["exp"][proceed[0]] = {total: 0, proceed: 0}
    }

    expDict["exp"][proceed[0]]["proceed"] += proceed[1]
  }

  for(let proceed of result){
    if(!(proceed[0] in expDict["exp"])){
      continue
    }

    expDict["exp"][proceed[0]]["total"] += proceed[1]
  }

  console.log(result)
  console.log(expDict)

  return expDict
}

async function getMaxQuestId(userId) {
  const querySnapshot = await getDocs(
    collection(db, "users/" + userId + "/quests")
  );

  let result = [];
  querySnapshot.forEach((doc) => result.push([doc.id]));
  if(result.length > 0){
    return Math.max(...result);
  }else{
    return -1
  }

}

class Quest {
  constructor(quest_id, questName, proceed, total, tags) {
    this.quest_id = quest_id;
    this.questName = questName;
    this.proceed = proceed;
    this.total = total;
    this.tags = tags;
  }
}

ReactModal.setAppElement("#root");
class Base extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: "",
      quests: {},
      showQuestModal: false,
      editingQuest: null,
      shareImageBase64: ""
    };

    this.login = this.login.bind(this)
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.sendEXP = this.sendEXP.bind(this);
  }

  handleOpenModal(quest) {
    console.log(quest)
    this.setState({
      editingQuest: quest ? quest: null,
      showQuestModal: true
    })
  }

  handleCloseModal() {
    this.setState({ showQuestModal: false });
  }

  login() {
    signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
      // You can use these server side with your app's credentials to access the Twitter API.
      const credential = TwitterAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const secret = credential.secret;

      // The signed-in user info.
      const user = result.user;
      // ...

      console.log(auth)
      console.log(auth.currentUser)

      this.setState({
        user_id: auth.currentUser.uid
      })

    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = TwitterAuthProvider.credentialFromError(error);
      // ...
    });
  }

  componentDidMount() {
    return
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

  checkQuestComplete() {
    const proceedingQuests = {}
    for(let k of Object.keys(this.state.quests)){
      if(this.state.quests[k].proceed >= this.state.quests[k].total){
        alert("クエスト:" + this.state.quests[k].questName + "を完了しました！")
      }else{
        proceedingQuests[k] = this.state.quests[k]
      }
    }

    this.setState({ quests: proceedingQuests })
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

  async addQuest(values){
    const max_quest_id = await getMaxQuestId(this.state.user_id)
    const new_quest_id = max_quest_id + 1

    const newQuest = new Quest(
      new_quest_id,
      values.questName,
      Number(values.proceed),
      Number(values.total),
      [values.tags]
    );
    console.log(newQuest)
    updateQuest(this.state.user_id, newQuest, null);

    return newQuest
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

  async submitQuest(values){
    console.log(values);

    var newQuest;
    if(this.state.editingQuest){
      newQuest = this.editQuest(values, this.state.editingQuest)
    }else{
      newQuest = await this.addQuest(values)
    }
    console.log(newQuest)

    const quests = { ...this.state.quests };
    quests[newQuest.quest_id] = newQuest;
    this.setState({
      quests: quests,
      showQuestModal: false,
    });
    this.checkQuestComplete();
  }

  async sendEXP(user_id, range){
    const expDict = await calcExp(user_id, range)
    // Make a request for a user with a given ID
    const response  = await axios.post('https://j5wvkfcw7k.execute-api.ap-northeast-1.amazonaws.com/image', expDict)
    this.setState({
      shareImageBase64: response["data"]
    })
  }

  render() {
    const quests_html = Object.values(this.state.quests).map((quest) => (
      <QuestRow
        key={quest.quest_id}
        quest={quest}
        onClickIncrement={(quest) => this.proceedQuest(quest)}
        onClickEditButton={(quest) => this.handleOpenModal(quest)}
      ></QuestRow>
    ));

    if(this.state.user_id == ""){
      return (
        <div>
          <button onClick={() => this.login()}>ログイン</button>
        </div>
      )
    }

    return (
      <div>
        <div>クエスト一覧</div>
        <button onClick={() => this.sendEXP(this.state.user_id, "day")}>Share</button>
        <div>user_id: {this.state.user_id}</div>
        {quests_html}
        <button onClick={() => this.handleOpenModal(null)}>クエスト追加</button>
        <ReactModal
          isOpen={this.state.showQuestModal}
          contentLabel="クエスト追加"
          onRequestClose={this.handleCloseModal}
        >
          <Formik
            initialValues={{
              questName: this.state.editingQuest ? this.state.editingQuest.questName : "",
              proceed: this.state.editingQuest ? this.state.editingQuest.proceed : 0,
              total: this.state.editingQuest ? this.state.editingQuest.total : 0,
              tags: this.state.editingQuest ? this.state.editingQuest.tags[0] : "",
            }}
            validationSchema={Yup.object({
              questName: Yup.string().required("Required"),
              proceed: Yup.number().min(0, "can't be negative").required("Required"),
              total: Yup.number().min(1, "at least 1").required("Required"),
              tags: Yup.string().required("required"),
            })}
            onSubmit={(values, { setSubmitting }) => {
              this.submitQuest(values)
            }}
          >
            <Form>
              <div>
                <label>クエスト名</label>
                <Field name="questName" />
                <ErrorMessage name="questName" />
              </div>

              <div>
                <label>進捗</label>
                <Field name="proceed" />
                <ErrorMessage name="proceed" />
              </div>

              <div>
                <label>トータル</label>
                <Field name="total" />
                <ErrorMessage name="total" />
              </div>

              <div>
                <label>タグ</label>
                <Field name="tags" />
                <ErrorMessage name="tags" />
              </div>

              <div>
                <button type="submit">Submit</button>
              </div>
            </Form>
          </Formik>
        </ReactModal>
        <div>
          <img src={"data:image/png;base64," + this.state.shareImageBase64} />
        </div>
      </div>
    );
  }
}

function QuestRow(props) {
  const quest = props.quest;
  return (
    <div className="questRow">
      <button onClick={() => props.onClickIncrement(quest)}>＋</button>
      <div>#{quest.quest_id}</div>
      <div>{quest.questName}</div>
      <div>
        {quest.proceed}/{quest.total}
      </div>
      <div>{quest.tags[0]}</div>
      <button onClick={() => props.onClickEditButton(quest)}>編集</button>
    </div>
  );
}

// ========================================

ReactDOM.render(
  <Base />,
  document.getElementById("root")
);
