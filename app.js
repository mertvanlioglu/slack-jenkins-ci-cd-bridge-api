import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.use((req, res, next) => { let d=""; req.setEncoding("utf8"); req.on("data",c=>d+=c); req.on("end",()=>{req.bodyRaw=d; next();}); });

function verifySlack(req) {
  const ts=req.headers["x-slack-request-timestamp"];
  const sig=req.headers["x-slack-signature"];
  if(!ts||!sig) return false;
  const base=`v0:${ts}:${req.bodyRaw||""}`;
  const mac=crypto.createHmac("sha256", process.env.SLACK_SIGNING_SECRET).update(base).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(`v0=${mac}`), Buffer.from(sig)); } catch { return false; }
}

async function triggerJenkins(repo, branch) {
  const base = process.env.JENKINS_URL.replace(/\/+$/,'');
  const jobPath = process.env.JENKINS_JOB_PATH || `job/${process.env.JENKINS_JOB}`;
  const buildUrl = `${base}/${jobPath}/buildWithParameters`;

  const auth = "Basic " + Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_API_TOKEN}`).toString("base64");
  let headers = { "Authorization": auth };

  try {
    const c = await fetch(`${base}/crumbIssuer/api/json`, { headers });
    if (c.ok) {
      const j = await c.json();
      headers[j.crumbRequestField || "Jenkins-Crumb"] = j.crumb;
    }
  } catch (_) {}

  const form = new URLSearchParams();
  form.append("REPO", repo);
  form.append("BRANCH", branch);
  if (process.env.JENKINS_TOKEN) form.append("token", process.env.JENKINS_TOKEN);

  const res = await fetch(buildUrl, { method: "POST", headers, body: form });
  console.log("Jenkins trigger:", res.status, await res.text().catch(()=> ""));
  return res.ok || res.status === 201;
}


app.post("/slack/build", (req, res) => {
  const ack = (t) => res.json({ response_type:"in_channel", text:t });
  if (!verifySlack(req)) return res.status(401).send("invalid signature");

  const params = new URLSearchParams(req.bodyRaw);
  const text = params.get("text") || "";
  const user = params.get("user_name") || "unknown";
  const [repo, branch] = text.split("/").map(s => (s||"").trim());
  if (!repo || !branch) return ack("Usage: `/build Repo/Branch`");

  ack(`Build is queued: *${repo}/${branch}* (by ${user})`);

  triggerJenkins(repo, branch).then(ok => {
    if (!ok) console.error("Jenkins trigger failed");
  }).catch(e => console.error("Trigger error:", e));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("listening on", PORT));
