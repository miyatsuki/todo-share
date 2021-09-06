import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore();

const axios = require("axios").default;

async function asyncCall() {
  const querySnapshot = await getDocs(collection(db, "quests"));
  const result = [];
  querySnapshot.forEach((doc) => result.push([doc.id, doc.data()]));
  return result;
}

async function proceedFirebase(quest) {
  await setDoc(doc(db, "quests", quest.firebase_id), {
    user_id: 0,
    quest_id: quest.quest_id,
    name: quest.name,
    proceed: quest.proceed,
    total: quest.total,
    tags: quest.tags,
  });
}

class Quest {
  constructor(firebase_id, quest_id, name, proceed, total, tags) {
    this.firebase_id = firebase_id;
    this.quest_id = quest_id;
    this.name = name;
    this.proceed = proceed;
    this.total = total;
    this.tags = tags;
  }
}

class Base extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: 0,
      quests: {},
    };
  }

  componentDidMount() {
    asyncCall().then((response) => {
      console.log(response);
      const quests = Object.fromEntries(
        response.map((quest) => [
          quest[1]["quest_id"],
          new Quest(
            quest[0],
            quest[1]["quest_id"],
            quest[1]["name"],
            quest[1]["proceed"],
            quest[1]["total"],
            quest[1]["tags"]
          ),
        ])
      );
      this.setState({ quests: quests });
    });
  }

  proceedQuest(quest) {
    const quests = { ...this.state.quests };
    quests[quest.quest_id].proceed += 1;
    proceedFirebase(quests[quest.quest_id]);
    this.setState({ quests: quests });
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
