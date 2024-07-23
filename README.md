# 初期構築時にやったこと

## プロジェクト作成

1.cdk プロジェクト作成

```
cdk init app --language typescript
```

2.フロントアプリ作成

```
npx create-next-app@latest frontend
```

## フロントアプリ準備

3.フロントアプリに移動

```
cd frontend
```

4.ビルド

```
npm run build
```

5.サーバー立ち上げ

```
npm run dev
```

6.画面確認（http://localhost:3000）

## インフラ構築

7.cdk コード追記

8.ターミナルで aws にログイン

9.デプロイ

```
cdk deploy --profile ${ログインしたユーザー}
```

9.cloudfront の URL で画面確認
