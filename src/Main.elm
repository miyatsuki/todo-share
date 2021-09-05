module Main exposing (..)

import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)


main =
    Browser.sandbox { init = 0, update = update, view = view }


type Msg
    = Increment
    | Decrement


update msg model =
    case msg of
        Increment ->
            model + 1

        Decrement ->
            model - 1


view model =
    div []
        [ div [] [ text "取り組んでいるクエスト一覧" ]
        , div []
            [ button [] [ text "Share" ]
            ]
        , div []
            [ button [] [ text "□" ]
            , text "todo-shareの開発"
            , text "0/1"
            ]
        , div []
            [ button [] [ text "□" ]
            , text "技術書を1章読む"
            , text "3/6"
            ]
        , div []
            [ button [] [ text "クエスト追加" ]
            ]
        ]
