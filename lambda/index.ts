import { Event } from "aws-cdk-lib/aws-stepfunctions-tasks"
import { Context } from "vm"

export async function handler(event: Event, context: Context) {
  console.log("Received event:", JSON.stringify(event, null, 2))

  // ここでビジネスロジックを実装します。
  // 例: event.body を使用して、リクエストデータを処理します。

  // レスポンスを返します。
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello from Lambda!",
      input: event,
    }),
  }
}
