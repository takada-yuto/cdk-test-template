## 環境

- node 20.9.0
- npm 10.1.0
- Nextjs 14.2.5
- CDK 2.148.0

## 初期構築時にやったこと

### プロジェクト作成

1.cdk プロジェクト作成

```
cdk init app --language typescript
```

2.フロントアプリ作成

```
npx create-next-app@latest frontend
```

### フロントアプリ準備

3.フロントアプリに移動

```
cd frontend
```

4.[next.config.mjs](frontend/next.config.mjs)に以下を追記

```
output: "export"
```

5.ビルド

```
npm run build
```

6.サーバー立ち上げ

```
npm run dev
```

7.画面確認（http://localhost:3000）

### インフラ構築

8.cdk コード追記

9.ターミナルで aws にログイン

10.デプロイ

```
cdk deploy --profile ${ログインしたユーザー}
```

11.cloudfront の URL で画面確認
