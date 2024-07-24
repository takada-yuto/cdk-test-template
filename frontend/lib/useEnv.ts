import useSWR from "swr"

interface Env {
  apigatewayUrl: string | undefined
}

const fetcher = async () => {
  const res = await fetch("/env.json")
  return res.json()
}

export default function useEnv() {
  const { data: env } = useSWR<Env>("/env.json", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  if (!env) {
    return {
      env: Object.freeze({
        apigatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
      }) as Env,
    }
  }

  return { env: Object.freeze(env) }
}
