import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
const axios = require("axios").default;

class Quest {
  constructor(id, name, proceed, total, tags) {
    this.id = id;
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
    axios
      .get("http://localhost:8000/api/quest/" + this.state.user_id)
      .then((response) => {
        const quests = Object.fromEntries(
          response["data"].map((quest) => [
            quest["id"],
            new Quest(
              quest["id"],
              quest["name"],
              quest["proceed"],
              quest["total"],
              quest["tags"]
            ),
          ])
        );
        this.setState({ quests: quests });
      });
  }

  proceedQuest(quest) {
    const quests = { ...this.state.quests };
    quests[quest.id].proceed += 1;
    this.setState({ quests: quests });
  }

  render() {
    const quests_html = Object.values(this.state.quests).map((quest) => (
      <QuestRow
        key={quest.id}
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
      <div>#{quest.id}</div>
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
