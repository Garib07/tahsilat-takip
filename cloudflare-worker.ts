// @ts-expect-error `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: { CRON_SECRET?: string },
    ctx: ExecutionContext
  ) {
    const secret = env.CRON_SECRET;
    if (!secret) {
      console.error("[cron] CRON_SECRET tanımlı değil.");
      return;
    }

    ctx.waitUntil(
      handler.fetch(
        new Request("https://tahsilat-takip.internal/api/cron/backup", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secret}`
          }
        }),
        env,
        ctx
      )
    );
  }
} satisfies ExportedHandler;

// @ts-expect-error re-export generated Durable Objects if present
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
