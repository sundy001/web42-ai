/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	PLAN_STEPS_QUEUE: Queue<any>;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		let log = {
			url: request.url,
			method: request.method,
			headers: Object.fromEntries(request.headers),
		};
		await env.PLAN_STEPS_QUEUE.send(log);
		return new Response(JSON.stringify({ status: 'success' }), {
			status: 201, // 201 Created is a good status for a successful POST
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;
