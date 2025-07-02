import { Elysia } from "elysia"
import axios from "axios"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBperuUWtP36lO_cRyGYSxuiTkhpy54F_Q",
  authDomain: "myvue3-e45b9.firebaseapp.com",
  projectId: "myvue3-e45b9",
  storageBucket: "myvue3-e45b9.firebasestorage.app",
  messagingSenderId: "439732498123",
  appId: "1:439732498123:web:46d43d1cb409e8678c754e",
  measurementId: "G-80R2D8D149",
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
const youtubeApiKey = "AIzaSyAUD7ipwX-VAIIgbtw4V6sHKOTfyWoPdMo"

const app = new Elysia()

app.get("/", (ctx) => {
  ctx.headers['Content-Type'] = "text/plain; charset=utf-8"
  return "Hello Elysia"
})

app.group("/api", (app) => {
  app.get("/hello", (ctx) => {
    ctx.headers['Content-Type'] = "application/json; charset=utf-8"
    return {
      message: "Hello World.",
      message2: "こんにちは、世界。",
      message3: "世界，你好!",
    }
  })

  app.get("/firebasefood", async (ctx) => {
    ctx.headers['Content-Type'] = "application/json; charset=utf-8"
    try {
      const myvue3foodCollection = collection(db, "myvue3food")
      const snapshot = await getDocs(myvue3foodCollection)
      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      return { myvue3food: documents }
    } catch (error) {
      return {
        error: "Failed to fetch data from Firestore",
        details: (error as Error).message,
      }
    }
  })

  app.get("/youtube/channel/:channelIds", async (ctx) => {
    const channelIdsParam = ctx.params.channelIds
    if (!channelIdsParam) return { error: "請提供 channelIds 參數（可用逗號分隔多個）" }

    const channelIds = channelIdsParam.split(",").map((v) => v.trim()).filter((v) => v.length > 0)
    if (channelIds.length === 0 || channelIds.length > 50)
      return { error: "頻道 ID 數量需介於 1 到 50 之間" }

    try {
      const res = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
        params: {
          part: "snippet,statistics",
          id: channelIds.join(","),
          key: youtubeApiKey,
        },
        headers: {
          "Accept-Encoding": "gzip, deflate", // ✅ 修正 Brotli
        },
      })

      const items = res.data?.items || []
      if (items.length === 0) return { error: "找不到任何頻道資料" }
      return { count: items.length, items }
    } catch (error: any) {
      return {
        error: "無法取得頻道資料",
        message: error.message,
        status: error.response?.status || null,
        response: error.response?.data || null,
      }
    }
  })

  app.get("/youtube/videos/:videoIds", async (ctx) => {
    const videoIdsParam = ctx.params.videoIds
    if (!videoIdsParam) return { error: "請提供 videoIds 參數（可用逗號分隔多個）" }

    const videoIds = videoIdsParam.split(",").map((v) => v.trim()).filter((v) => v.length > 0)
    if (videoIds.length === 0 || videoIds.length > 50)
      return { error: "影片 ID 數量需介於 1 到 50 之間" }

    try {
      const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet,statistics",
          id: videoIds.join(","),
          key: youtubeApiKey,
        },
        headers: {
          "Accept-Encoding": "gzip, deflate", // ✅ 修正 Brotli
        },
      })

      const items = res.data?.items || []
      if (items.length === 0) return { error: "找不到任何影片資料" }
      return { count: items.length, items }
    } catch (error: any) {
      return {
        error: "無法取得影片資料",
        message: error.message,
        status: error.response?.status || null,
        response: error.response?.data || null,
      }
    }
  })

  app.get("/countdown/:slug", (ctx) => {
    const slug = ctx.params.slug
    if (!slug || slug.length < 12) return { error: "Invalid slug. Format should be: YYYYMMDDHHMM" }

    const slugISO = `${slug.slice(0, 4)}-${slug.slice(4, 6)}-${slug.slice(6, 8)}T${slug.slice(8, 10)}:${slug.slice(10, 12)}:00+08:00`
    const now = new Date()
    const next = new Date(slugISO)

    const diffMs = next.getTime() - now.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    let remaining = diffSec

    const diffday = Math.floor(remaining / 86400)
    remaining -= diffday * 86400
    const diffhour = Math.floor(remaining / 3600)
    remaining -= diffhour * 3600
    const diffminute = Math.floor(remaining / 60)
    const diffsecond = remaining % 60

    return {
      slug,
      now: now.toISOString(),
      slugISO,
      next: next.toISOString(),
      diffMs,
      diffday,
      diffhour,
      diffminute,
      diffsecond,
    }
  })

  app.get("/bilibili/:bvid", async (ctx) => {
    ctx.headers['Content-Type'] = "application/json; charset=utf-8"
    const bvid = ctx.params.bvid
    if (!bvid) return { error: "請提供 bvid 參數" }

    try {
      const res = await axios.get("https://api.bilibili.com/x/web-interface/view", {
        params: { bvid },
        headers: {
          Referer: "https://www.bilibili.com/",
          "Accept-Encoding": "gzip, deflate", // ✅ 修正 Brotli
        },
      })

      const { pic, title, owner, stat, pages } = res.data.data
      const raw = res.data.data
      const newdata: Record<string, any> = {}
      for (const key in raw) {
        if (typeof raw[key] !== "object") newdata[key] = raw[key]
      }

      return { pic, title, owner, stat, data: newdata, pages }
    } catch (error: any) {
      return {
        error: "無法取得 Bilibili 資料",
        message: error.message,
        status: error.response?.status || null,
        response: error.response?.data || null,
      }
    }
  })

  app.get("/bilibili/proxyimg", async (ctx) => {
    const url = ctx.query.url
    if (!url) {
      ctx.set.status = 400
      return { error: "請提供 url 參數" }
    }

    try {
      const response = await axios.get(url, {
        responseType: "stream",
        headers: {
          Referer: "https://www.bilibili.com/",
          "Accept-Encoding": "gzip, deflate", // ✅ 修正 Brotli
        },
      })

      ctx.headers["Content-Type"] = response.headers["content-type"] || "application/octet-stream"
      ctx.headers["Cache-Control"] = "public, max-age=86400"

      return response.data
    } catch (err: any) {
      ctx.set.status = 500
      return { error: "圖片代理失敗", message: err.message }
    }
  })

  return app
})

const server = app.listen(3000)
console.log(`🦊 Elysia is running at ${server.server?.hostname ?? "localhost"}:${server.server?.port}`)
