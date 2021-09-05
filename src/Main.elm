module Main exposing (..)

import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)


main =
    Browser.sandbox
        { init = [ Quest "quest1" 1 2 [ "tag1", "tag2" ], Quest "quest2" 1 2 [ "tag1" ] ]
        , update = update
        , view = view
        }


type Msg
    = Increment
    | Decrement


type alias Quest =
    { name : String
    , proceeding : Int
    , total : Int
    , tags : List String
    }


update msg model =
    case msg of
        Increment ->
            model

        Decrement ->
            model


view model =
    div []
        ([ div [] [ text "取り組んでいるクエスト一覧" ]
         , div []
            [ button [] [ text "Share" ]
            ]
         ]
            ++ List.map quest2mainHTML model
            ++ [ div []
                    [ button [] [ text "クエスト追加" ]
                    ]
               ]
        )


quest2mainHTML quest =
    div []
        [ button [] [ text "□" ]
        , text quest.name
        , text (String.fromInt quest.proceeding ++ "/" ++ String.fromInt quest.total)
        ]
