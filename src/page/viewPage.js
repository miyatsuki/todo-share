import React from "react";
import { calcExp } from "../firebase"

const axios = require('axios').default;
const imageURL = 'https://j5wvkfcw7k.execute-api.ap-northeast-1.amazonaws.com/image'

export class ViewPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: props.userId,
            shareImageBase64: ""
        };
        this.sendEXP(this.state.userId, "day")
    }

    async sendEXP(user_id, range){
        const expDict = await calcExp(user_id, range)
        // Make a request for a user with a given ID
        try{
            const response  = await axios.post(imageURL, {
                user_name: "",
                exp: expDict
            })
            console.log(response)

            this.setState({
                shareImageBase64: response["data"]
            })
        }catch(error){
            console.log(error)
        }
    }

    render() {
        console.log(this.state)
        return (
            <div>
                <img src={"data:image/png;base64," + this.state.shareImageBase64} />
            </div>
        )
    }
}