export const runtime = "edge";

export async function GET() {
  return Response.json({
    ok: true,
    ts: new Date().toISOString(),
    sha: process.env.COMMIT_REF || null,
    context: process.env.CONTEXT || null,
    nodeEnv: process.env.NODE_ENV || null,
  });
}
