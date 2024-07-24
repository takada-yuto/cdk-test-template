const cloudfrontUrl = process.env.cloudfrontUrl
export async function handler() {
  console.log(cloudfrontUrl)
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify({
      message: "Hello from Lambda!",
    }),
  }
}
