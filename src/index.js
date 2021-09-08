import React from "react";
import ReactDOM from "react-dom";
import ReactModal from "react-modal";
import "./index.css";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

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
const db = getFirestore();

async function asyncCall(user_id) {
  const querySnapshot = await getDocs(
    collection(db, "users/" + user_id + "/quests")
  );
  const result = [];
  querySnapshot.forEach((doc) => result.push([doc.id, doc.data()]));
  return result;
}

async function updateFirebase(user_id, quest) {
  console.log(quest);
  await setDoc(doc(db, "users/" + user_id + "/quests/" + quest.quest_id), {
    name: quest.name,
    proceed: quest.proceed,
    total: quest.total,
    tags: quest.tags,
  });
}

class Quest {
  constructor(quest_id, name, proceed, total, tags) {
    this.quest_id = quest_id;
    this.name = name;
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
      user_id: 0,
      quests: {},
      showQuestModal: false,
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleModalQuestNameChange =
      this.handleModalQuestNameChange.bind(this);
    this.addQuest = this.addQuest.bind(this);
  }

  handleOpenModal() {
    this.setState({ showQuestModal: true });
  }

  handleCloseModal() {
    this.setState({ showQuestModal: false });
  }

  componentDidMount() {
    asyncCall(this.state.user_id).then((response) => {
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

  handleModalQuestNameChange(event) {
    this.setState({ questModal_questName: event.target.value });
  }

  proceedQuest(quest) {
    const quests = { ...this.state.quests };
    quests[quest.quest_id].proceed += 1;
    updateFirebase(this.state.user_id, quests[quest.quest_id]);
    this.setState({ quests: quests });
  }

  addQuest(quest_info) {
    console.log(quest_info);
    const quest_ids = Object.keys(this.state.quests).map((x) => Number(x));
    const max_quest_id = Math.max(...quest_ids);
    const newQuest = new Quest(
      max_quest_id + 1,
      quest_info.questName,
      0,
      quest_info.total,
      [quest_info.tags]
    );
    updateFirebase(this.state.user_id, newQuest);

    const quests = { ...this.state.quests };
    quests[newQuest.quest_id] = newQuest;
    this.setState({
      quests: quests,
      showQuestModal: false,
    });
  }

  render() {
    const quests_html = Object.values(this.state.quests).map((quest) => (
      <QuestRow
        key={quest.quest_id}
        quest={quest}
        onClick={(quest) => this.proceedQuest(quest)}
      ></QuestRow>
    ));

    return (
      <div>
        <div>クエスト一覧</div>
        <button>Share</button>
        <div>user_id: {this.state.user_id}</div>
        {quests_html}
        <button onClick={this.handleOpenModal}>クエスト追加</button>
        <ReactModal
          isOpen={this.state.showQuestModal}
          contentLabel="クエスト追加"
          onRequestClose={this.handleCloseModal}
        >
          <Formik
            initialValues={{
              questName: "",
              total: 0,
              tags: "",
            }}
            validationSchema={Yup.object({
              questName: Yup.string().required("Required"),
              total: Yup.number().min(1, "at least 1").required("Required"),
              tags: Yup.string().required("required"),
            })}
            onSubmit={(values, { setSubmitting }) => {
              this.addQuest(values);
            }}
          >
            <Form>
              <label>クエスト名</label>
              <Field name="questName" />
              <ErrorMessage name="questName" />

              <label>作業量</label>
              <Field name="total" />
              <ErrorMessage name="total" />

              <label>タグ</label>
              <Field name="tags" />
              <ErrorMessage name="tags" />

              <button type="submit">Submit</button>
            </Form>
          </Formik>
        </ReactModal>
      </div>
    );
  }
}

function QuestRow(props) {
  const quest = props.quest;
  return (
    <div>
      <button onClick={() => props.onClick(quest)}>＋</button>
      <div>#{quest.quest_id}</div>
      <div>{quest.name}</div>
      <div>
        {quest.proceed}/{quest.total}
      </div>
    </div>
  );
}

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
        },
      ],
      stepNumber: 0,
      xIsNext: true,
    };
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: step % 2 === 0,
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ? "G to move #" + move : "Go to game start";
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    this.setState({
      history: history.concat([{ squares: squares }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });
  }
}

// ========================================

ReactDOM.render(
  <Base />,
  //<Game />,
  document.getElementById("root")
);

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
