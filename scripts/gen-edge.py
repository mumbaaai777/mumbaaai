# Generates supabase/functions/api/index.ts (one file, for the Supabase dashboard editor) from workers/api/src.
import re
src='workers/api/src/'
rss=open(src+'rss.ts').read(); prompt=open(src+'prompt.ts').read(); idx=open(src+'index.ts').read()
idx=re.sub(r"^import .*\n","",idx,flags=re.M)
i=idx.index('// ---------- router ----------'); router=idx[i:]; idx=idx[:i]
router=router.replace("export default {\n  async fetch(","const handler = {\n  async fetch(")
router=router.replace("const path = url.pathname.replace(/\\/+$/, '') || '/';","const path = url.pathname.replace(/^\\/(functions\\/v1\\/)?api/, '').replace(/\\/+$/, '') || '/';")
router+="""
// Supabase Edge Function entry (Deno). Secrets: GEMINI_API_KEY; optional GEMINI_MODEL, GEMINI_FALLBACK_MODEL, ALLOWED_ORIGINS.
// Deploy with "Verify JWT" OFF so the public app can call it.
Deno.serve((req: Request) => {
  const g = (k: string) => Deno.env.get(k) ?? undefined;
  const env: Env = {
    GEMINI_API_KEY: g('GEMINI_API_KEY'), GEMINI_MODEL: g('GEMINI_MODEL'), GEMINI_FALLBACK_MODEL: g('GEMINI_FALLBACK_MODEL'),
    ALLOWED_ORIGINS: g('ALLOWED_ORIGINS') ?? 'https://mumbaaai777.github.io',
    RATE_LIMIT_PER_MINUTE: g('RATE_LIMIT_PER_MINUTE'), RATE_LIMIT_PER_DAY: g('RATE_LIMIT_PER_DAY'),
    SUPABASE_URL: g('SUPABASE_URL'), SUPABASE_ANON_KEY: g('SUPABASE_ANON_KEY'),
  };
  return handler.fetch(req, env);
});
"""
out="// MumbaAai API as one Supabase Edge Function (generated from workers/api/src by scripts/gen-edge.py).\n"+rss.replace('export ','')+"\n"+prompt.replace('export ','')+"\n"+idx.replace('export ','')+router
out=out.replace("'Access-Control-Allow-Headers': 'Content-Type'","'Access-Control-Allow-Headers': 'Content-Type, authorization, apikey, x-client-info'")
open('supabase/functions/api/index.ts','w').write(out)
print('ok')
