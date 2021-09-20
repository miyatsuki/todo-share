// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, serverTimestamp, query } from "firebase/firestore";
import { getAuth, signInWithPopup, TwitterAuthProvider } from "firebase/auth";
import { Quest } from "./quest"

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
export async function loadQuests(user_id) {
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

export async function updateQuest(user_id, quest, prevQuest) {
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

export async function calcExp(user_id, range) {
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

  let expDict = {};
  for(let proceed of result){
    if(proceed[1] === 0 || proceed[2] < from_date || proceed[2] > to_date){
      continue
    }

    if(!(proceed[0] in expDict)){
      expDict[proceed[0]] = {total: 0, proceed: 0}
    }

    expDict[proceed[0]]["proceed"] += proceed[1]
  }

  for(let proceed of result){
    if(!(proceed[0] in expDict)){
      continue
    }

    expDict[proceed[0]]["total"] += proceed[1]
  }

  console.log(result)
  console.log(expDict)

  return expDict
}

export async function getMaxQuestId(userId) {
  const querySnapshot = await getDocs(
    collection(db, "users/" + userId + "/quests")
  );

  let result = [];
  querySnapshot.forEach((doc) => result.push([doc.id]));

  console.log(result)

  if(result.length > 0){
    return Math.max(...result);
  }else{
    return -1
  }

}


// === auth
export async function login() {
	try {
		const result = await signInWithPopup(auth, provider)

		// This gives you a the Twitter OAuth 1.0 Access Token and Secret.
		// You can use these server side with your app's credentials to access the Twitter API.
		const credential = TwitterAuthProvider.credentialFromResult(result);
		const token = credential.accessToken;
		const secret = credential.secret;

		// The signed-in user info.
		const user = result.user;
		console.log(user)

		this.setState({
			user_id: user.uid,
			user_name: user.displayName,
			access_token: token,
			access_token_secret: secret
		})

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

	} catch(error) {
		// Handle Errors here.
		const errorCode = error.code;
		const errorMessage = error.message;
		console.log(errorCode)
		console.log(errorMessage)
	}
}
