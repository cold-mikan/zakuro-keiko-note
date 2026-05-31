# ザクロ連絡帳

小劇場の10月公演に向けた、稽古出欠管理WebアプリのMVPです。

スマホで見やすいこと、未回答者とシーン稽古可否がすぐ分かることを優先しています。

## すぐ確認する方法

この環境では npm が入っていない場合でも確認できるように、簡易プレビューを用意しています。

一番かんたんな方法は、`start-keiko-app.cmd` をダブルクリックすることです。

黒い画面が開いたら、閉じずにそのまま置いておきます。
そのあとブラウザで次を開きます。

```text
http://127.0.0.1:4173
```

止めるときは、黒い画面で `Ctrl + C` を押します。

手でコマンドを打つ場合は、次の手順です。

1. このフォルダを開きます。
2. 次のコマンドで確認用サーバーを起動します。

```powershell
& 'C:\Users\cold_mikan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' preview-server.mjs
```

3. ブラウザで次を開きます。

```text
http://127.0.0.1:4173
```

止めるときは、サーバーを起動した画面で `Ctrl + C` を押します。

## React / TypeScript として動かす方法

通常の開発環境では、こちらの手順を使います。

```powershell
npm install
npm run dev
```

表示されたURLをブラウザで開くとアプリを確認できます。

## できること

- 稽古日一覧の表示
- 出欠登録
- 稽古日ごとの出席者、欠席者、遅刻者、早退者、未定、未回答者の確認
- シーンごとの稽古可否判定
- 不足している役の表示
- ダッシュボード
- メンバー一覧
- メンバーごとの出席率表示
- 出欠データのブラウザ保存
- CSVエクスポート

## ファイル構成

```text
.
├─ index.html                 React/Vite用の入口
├─ package.json               開発用コマンドと依存関係
├─ preview.html               npmなしで確認するための入口
├─ preview-app.tsx            簡易プレビュー用のReactコード
├─ preview-server.mjs         ローカル確認用サーバー
├─ public                     Vercel公開時にそのまま配信されるアイコンやPWA設定
├─ supabase-schema.sql        Supabaseに作るテーブルと権限設定
└─ src
   ├─ main.tsx                Reactアプリ本体
   ├─ styles.css              画面デザイン
   ├─ types.ts                データの形
   ├─ data
   │  └─ sampleData.ts        サンプルの稽古日、メンバー、出欠、シーン
   └─ utils
      └─ attendance.ts        未回答者、出席率、シーン判定などの計算
```

## データ構造

後からGoogleスプレッドシートやFirebaseへ移しやすいように、主なデータは4種類に分けています。

- `members`: メンバー情報
- `rehearsals`: 稽古日情報
- `attendances`: 出欠回答
- `scenes`: シーンと必要な役

画面側はこの4種類のデータを読んで表示します。保存先がJSON、ブラウザ内保存、Googleスプレッドシート、Firebaseに変わっても、この形を保つと移行しやすいです。

## Googleスプレッドシート連携の方針

今のMVPではGoogleスプレッドシートへの直接送信は外し、CSV出力だけにしています。

CSVをGoogleスプレッドシートで使う場合は、スプレッドシートを開いて `ファイル > インポート > アップロード` からCSVを読み込んでください。

将来的にしっかり連携する場合は、シートを4枚に分ける方法がおすすめです。

- `members` シート
- `rehearsals` シート
- `attendances` シート
- `scenes` シート

アプリ側には `src/services/attendanceRepository.ts` のようなファイルを追加し、データの読み書きをそこに集めます。

最初はブラウザ内保存とCSV、必要になったらFirebaseや専用サーバー、という順番にすると無理がありません。

## CSV

CSVは `出欠一覧` 画面から出力できます。

- `この稽古日のCSV`: 選択中の稽古日だけ出力します。
- `全稽古日のCSV`: 全稽古日と全メンバー分を出力します。
- `6月分CSV` のような月別ボタン: その月の稽古日だけまとめて出力します。

## オンライン保存とリアルタイム同期

オンライン保存にはSupabaseを使います。Supabaseは、アプリのデータをネット上に保存できるサービスです。

この版では、データを次の表に分けて保存します。誰かが入力した内容はSupabaseに保存され、ほかの端末にも自動で反映される構成です。

- `members`: メンバー
- `rehearsals`: 稽古日
- `attendances`: 出欠
- `scenes`: シーン
- `edit_logs`: 編集履歴

### Supabase側の準備

1. Supabaseでプロジェクトを作ります。
2. 左側の `SQL Editor` を開きます。
3. [supabase-schema.sql](C:/Users/cold_mikan/Documents/Codex/2026-05-24/web-10-4-6-10-2/supabase-schema.sql) の中身を貼り付けて実行します。
4. 左側の `Project Settings` を開きます。
5. `API` を開きます。
6. `Project URL` と `anon public` key をコピーします。

### アプリ側の使い方

1. アプリ上部の `オンライン保存` を開きます。
2. `入力者名` に自分の名前を入れます。
3. `Supabase URL` に `Project URL` を貼ります。
4. `anon public key` に `anon public` key を貼ります。
5. `部屋ID` を決めます。例：`zakuro-keiko`
6. 初回だけ `現在のデータをSupabaseへ送る` を押します。
7. 別の端末では同じ設定を入れて `オンラインから読み込み` を押します。

友人には、公開したアプリURLと同じ `Supabase URL`、`anon public key`、`部屋ID` を共有します。友人側で `オンラインから読み込み` を押すと、同じデータを見られます。

読み込み後は、出欠登録、稽古日追加、メンバー編集、シーン編集などをしたときに、その変更だけをSupabaseへ保存します。

`edit_logs` に入力者名、変更対象、変更日時が残ります。ログインなし運用なので本人確認まではできませんが、「誰の名前で変更されたか」は追えるようにしています。

削除ボタンは、オンライン同期を開始したあとは画面から隠れるようにしています。最初の運用では、全員が誤って削除できない形にしています。

注意：このプロトタイプは「ログインなしで限定配布」を優先しています。URLとSupabase情報を知っている人は読み書きできます。知らない人に広がると困る場合は、次の段階でログイン、合言葉、管理者だけ削除可能、などを追加してください。

## Vercelで公開する方法

Vercelは、React/Viteアプリを公開URLにできるサービスです。

1. GitHubにこのフォルダをアップロードします。
2. Vercelで `Add New Project` を押します。
3. GitHubのリポジトリを選びます。
4. Framework Preset が `Vite` になっていることを確認します。
5. Environment Variables に次を入れます。

```text
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_DEFAULT_ROOM_ID=zakuro-keiko
```

6. `Deploy` を押します。

公開後のURLを友人に共有すると、iPhone、Android、Windowsから開けます。スマホではブラウザの共有メニューから「ホーム画面に追加」を選ぶと、アプリ風に起動できます。

## GitHub Pagesで公開する方法

GitHub Pagesは、HTMLやCSSやJavaScriptをネット上に公開できるGitHubの機能です。公開すると、iPhone、Android、友人のPCからURLで見られます。

このフォルダでは、GitHub Pages用に [github-pages](C:/Users/cold_mikan/Documents/Codex/2026-05-24/web-10-4-6-10-2/github-pages) を用意しています。

手順は次の通りです。

1. GitHubで新しいリポジトリを作ります。
2. リポジトリ名を決めます。例：`keiko-note`
3. [github-pages](C:/Users/cold_mikan/Documents/Codex/2026-05-24/web-10-4-6-10-2/github-pages) の中身をGitHubへアップロードします。
4. GitHubのリポジトリ画面で `Settings` を開きます。
5. 左側の `Pages` を開きます。
6. `Build and deployment` の `Source` を `Deploy from a branch` にします。
7. `Branch` を `main`、フォルダを `/root` にして保存します。
8. 数分待つと、次のようなURLで見られるようになります。

```text
https://あなたのGitHubユーザー名.github.io/keiko-note/
```

公開後にアプリを更新したい場合は、同じリポジトリへ新しいファイルをアップロードし直します。友人側はページを更新すれば新しい版を見られます。

注意：GitHub Pages版でもSupabase設定を入れればオンライン保存は使えます。ただし、今後はVercel公開の方がReact/Viteアプリとして更新しやすいです。

## エラーが出たときの確認ポイント

- 画面が開かない場合: サーバー起動コマンドを実行した画面にエラーが出ていないか確認します。
- `npm` が見つからない場合: Node.jsをインストールするか、上の「すぐ確認する方法」を使います。
- `http://127.0.0.1:4173` が開かない場合: サーバーが止まっていないか、別のアプリが同じ番号を使っていないか確認します。
- 画面が古い場合: `Ctrl + F5` で強めに更新します。
- CSVが文字化けする場合: Excelで開くときに文字コード `UTF-8` を選びます。
- オンライン保存ができない場合: Supabase URL、anon key、SQLの実行、RLSポリシーを確認します。

## 次に追加するとよい機能

- LINE通知
- Discord通知
- 本番直前用PDF出力
- CSVインポート
- Firebaseなどを使った複数人同時編集
