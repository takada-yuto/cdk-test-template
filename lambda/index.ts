import { Handler } from "aws-lambda"

const cloudfrontUrl = process.env.cloudfrontUrl
export const handler: Handler = async (event) => {
  const allowedOrigins = [cloudfrontUrl, "http://localhost:3000"]
  const origin = event.headers.origin
  const isAllowedOrigin = allowedOrigins.includes(origin)

  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  }

  if (isAllowedOrigin) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Headers"] = "Content-Type"
  }

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({
      message: "Hello from Lambda!",
    }),
  }
}
