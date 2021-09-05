module Main exposing (..)

import Browser
import Dict exposing (Dict)
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)
import Http
import Json.Decode as Decode


main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }


type alias Model =
    Dict Int Quest


init : () -> ( Model, Cmd Msg )
init _ =
    ( Dict.fromList
        [ ( 0, Quest 0 "quest1" 0 2 [ "tag1", "tag2" ] )
        , ( 1, Quest 1 "quest2" 0 2 [ "tag1" ] )
        ]
    , Cmd.none
    )


type Msg
    = Increment Int
    | Decrement
    | RecieveUpdated (Result Http.Error String)


type alias Quest =
    { id : Int
    , name : String
    , proceeding : Int
    , total : Int
    , tags : List String
    }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment id ->
            -- Dict.update id proceedQuest model
            ( model, updateServerProceeding (Dict.get id model) )

        Decrement ->
            ( model, Cmd.none )

        RecieveUpdated result ->
            case result of
                Ok url ->
                    ( model, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )


proceedQuest : Maybe Quest -> Maybe Quest
proceedQuest maybe_quest =
    case maybe_quest of
        Just quest ->
            Just (Quest quest.id quest.name (quest.proceeding + 1) quest.total quest.tags)

        Nothing ->
            Nothing



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none



-- VIEW


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
        [ button
            [ onClick (Increment id)
            ]
            [ text "+" ]
        , text ("#" ++ String.fromInt id)
        , text quest.name
        , text (String.fromInt quest.proceeding ++ "/" ++ String.fromInt quest.total)
        ]



--- HTTP


updateServerProceeding : Maybe Quest -> Cmd Msg
updateServerProceeding quest =
    Http.get { url = "http://127.0.0.1:8000/", expect = Http.expectJson RecieveUpdated jsonDecoder }


jsonDecoder : Decode.Decoder String
jsonDecoder =
    Decode.field "status" Decode.string
