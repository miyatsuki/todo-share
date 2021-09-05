module Main exposing (..)

import Browser
import Dict exposing (Dict)
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)


main =
    Browser.sandbox
        { init = init
        , update = update
        , view = view
        }


type alias Model =
    Dict Int Quest


init : Model
init =
    Dict.fromList
        [ ( 0, Quest 0 "quest1" 0 2 [ "tag1", "tag2" ] )
        , ( 1, Quest 1 "quest2" 0 2 [ "tag1" ] )
        ]


type Msg
    = Increment Int
    | Decrement


type alias Quest =
    { id : Int
    , name : String
    , proceeding : Int
    , total : Int
    , tags : List String
    }


update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment id ->
            Dict.update id proceedQuest model

        Decrement ->
            model


proceedQuest : Maybe Quest -> Maybe Quest
proceedQuest maybe_quest =
    case maybe_quest of
        Just quest ->
            Just (Quest quest.id quest.name (quest.proceeding + 1) quest.total quest.tags)

        Nothing ->
            Nothing


view : Dict Int Quest -> Html Msg
view model =
    div []
        ([ div [] [ text "取り組んでいるクエスト一覧" ]
         , div []
            [ button [] [ text "Share" ]
            ]
         ]
            ++ List.map quest2mainHTML (Dict.toList model)
            ++ [ div []
                    [ button [] [ text "クエスト追加" ]
                    ]
               ]
        )


quest2mainHTML : ( Int, Quest ) -> Html Msg
quest2mainHTML ( id, quest ) =
    div []
        [ button [ onClick (Increment id) ] [ text "+" ]
        , text ("#" ++ String.fromInt id)
        , text quest.name
        , text (String.fromInt quest.proceeding ++ "/" ++ String.fromInt quest.total)
        ]
