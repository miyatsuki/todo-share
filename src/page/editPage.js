import React from "react";
import ReactModal from "react-modal";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getMaxQuestId, updateQuest, calcExp } from "../firebase"
import { Quest } from "../quest"


const axios = require('axios').default;


ReactModal.setAppElement("#root");
export class EditPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          user_id: "",
          user_name: "",
          access_token: "",
          access_token_secret: "",
          quests: {},
          showQuestModal: false,
          editingQuest: null,
          shareImageBase64: ""
        };
    
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.sendEXP = this.sendEXP.bind(this);
    }

    componentDidUpdate(prevProps) {
        if(this.state.user_id !== this.props.userId){
            this.setState({
                user_id: this.props.userId
            })    
        }

        if(this.state.user_name !== this.props.userName){
            this.setState({
                user_name: this.props.userName
            })    
        }

        if(this.state.quests !== this.props.quests){
            this.setState({
                quests: this.props.quests
            })    
        }

        if(this.state.access_token !== this.props.access_token){
            this.setState({
                access_token: this.props.access_token
            })    
        }

        if(this.state.access_token_secret !== this.props.access_token_secret){
            this.setState({
                access_token_secret: this.props.access_token_secret
            })    
        }
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
    
    async sendEXP(user_id, range){
        const expDict = await calcExp(user_id, range)
        // Make a request for a user with a given ID
        try{
            const response  = await axios.post('https://j5wvkfcw7k.execute-api.ap-northeast-1.amazonaws.com/image', 
            {
              user_name: this.state.user_name,
              exp: expDict,
              access_token: this.state.access_token,
              access_token_secret: this.state.access_token_secret
            })
            console.log(response)

            this.setState({
                shareImageBase64: response["data"]
              })
      
        }catch(error){
            console.log(error)
        }
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

      async addQuest(values){
        const max_quest_id = await getMaxQuestId(this.state.user_id)
        console.log(max_quest_id)
    
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

      render() {
        console.log(this.state)
        const quests_html = Object.values(this.state.quests).map((quest) => (
            <QuestRow
            key={quest.quest_id}
            quest={quest}
            onClickIncrement={(quest) => this.proceedQuest(quest)}
            onClickEditButton={(quest) => this.handleOpenModal(quest)}
            ></QuestRow>
        ));

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
  