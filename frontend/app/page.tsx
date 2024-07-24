"use client"
import useEnv from "@/lib/useEnv"
import { useState } from "react"

export default function Home() {
  const [lambdaMessage, setLambdaMessage] = useState("")
  const { env } = useEnv() // S3のenv.jsonから環境変数を取得

  const handler = async () => {
    const apiUrl = env.apigatewayUrl

    if (!apiUrl) return

    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`An error occurred: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Data received from API:", data)
      setLambdaMessage(data.message)
    } catch (e) {
      console.error("Failed to fetch data from API", e)
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={handler}
        className="px-6 py-3 text-white bg-blue-500 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
      >
        Invoke Lambda
      </button>
      {lambdaMessage && <p className="ml-4">{lambdaMessage}</p>}
    </div>
  )
}
