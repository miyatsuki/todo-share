# todo-share

## 使用方法

```bash
elm make src/Main.elm --output elm.js
```
で、elm.jsが出力されます。

```bash
uvicorn main:app --reload
```
でローカルサーバが立ち上がります

http://127.0.0.1:8000/ にアクセスするとelm.jsonを読み込んだindex.htmlが表示されます