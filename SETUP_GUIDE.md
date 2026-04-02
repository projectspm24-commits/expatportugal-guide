# ExpatPortugal.guide — Automation Setup Guide
## From zero to fully automated in ~2 hours

---

## What you're setting up

| Component | What it does | Cost |
|---|---|---|
| Supabase | Database storing all content | Free |
| n8n | Runs automated workflows | €5–20/month |
| Buttondown | Newsletter sending | Free up to 1,000 subs |
| Vercel | Hosts your website | Free |
| Anthropic API | Writes summaries & newsletters | ~€30–50/month |

**Total: ~€35–70/month** at early traffic. Your 8 hours/month easily earns this back.

---

## STEP 1 — Set up Supabase (15 minutes)

1. Go to **supabase.com** and create a free account
2. Click **New Project** — name it `expatportugal`
3. Choose a region: **West EU (Ireland)** for lowest latency from Portugal
4. Set a strong database password and save it
5. Once created, go to **SQL Editor → New Query**
6. Paste the entire contents of `supabase_schema.sql` and click **Run**
7. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdef.supabase.co`)
   - **anon public key** (long JWT string)
8. Paste both into the Settings panel of `admin.html`

---

## STEP 2 — Deploy the admin dashboard (5 minutes)

1. Upload `admin.html` to your Vercel project alongside your other pages
2. Access it at `expatportugal.guide/admin.html`
3. The default password is `expatadmin2025` — **change this immediately** in Settings
4. Paste your Supabase URL and key in Settings → Save & reconnect

> **Security note:** Keep `admin.html` password-protected. For extra security, you can rename it to something less obvious like `dashboard-ep2025.html`.

---

## STEP 3 — Set up n8n (30 minutes)

### Option A: n8n Cloud (easiest, €20/month)
1. Go to **n8n.io** → Start for free
2. Create an account
3. You get a hosted n8n instance at `your-name.app.n8n.cloud`

### Option B: Railway.app (cheapest, ~€5/month)
1. Go to **railway.app** and create an account
2. Click **New Project → Deploy from template → n8n**
3. Railway auto-deploys n8n with a URL like `n8n-production-xxxx.up.railway.app`
4. Open that URL and create your n8n account

### Import the workflows:
1. In n8n, click **Workflows → Import from file**
2. Import `n8n_daily_news.json`
3. Import `n8n_weekly_digest.json`
4. Import `n8n_rental_update.json`

### Add credentials in n8n:
Go to **Credentials → Add credential** and add:

**Anthropic API:**
- Type: HTTP Header Auth
- Name: `Anthropic API`
- Header name: `x-api-key`
- Header value: your Anthropic API key (from console.anthropic.com)

**Supabase:**
- Type: Supabase
- Host: your Supabase project URL
- Service Role Key: from Supabase → Settings → API → service_role key

### Set Anthropic spend limit:
Go to **console.anthropic.com → Settings → Billing → Monthly spend limit**
Set it to **€50** to cap your maximum exposure.

### Activate the workflows:
1. Open each workflow
2. Click the toggle to **Active**
3. The daily news pipeline will run tonight at 7am
4. The digest will run next Sunday at 8pm
5. The rental update runs on the 1st of each month

---

## STEP 4 — Set up Buttondown newsletter (10 minutes)

1. Go to **buttondown.email** and create a free account
2. Settings → API Keys → create a key
3. Paste the key into:
   - `n8n_weekly_digest.json` (replace `YOUR_BUTTONDOWN_API_KEY`)
   - Settings panel in admin.html
4. In Buttondown Settings, set your **sender name** to `ExpatPortugal.guide`
5. Set your **reply-to email** to your address

The digest workflow sends emails as **drafts** in Buttondown. Every Monday morning:
1. Open Buttondown → Emails → you'll see a draft
2. Read it (takes 3 minutes)
3. Click Send — done

---

## STEP 5 — Update your website pages to fetch live data (optional but recommended)

Add this JavaScript to your `index.html` to fetch live articles from Supabase instead of showing hardcoded placeholders:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

async function loadLiveNews() {
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/articles?status=eq.approved&order=published_at.desc&limit=6',
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
  );
  const articles = await res.json();
  const list = document.getElementById('news-list');
  list.innerHTML = articles.map(a => `
    <div class="ni">
      <div class="ni-img">${a.image_emoji}</div>
      <div>
        <div class="ni-cat">${a.category}</div>
        <div class="ni-title">${a.title}</div>
        <div class="ni-meta">${new Date(a.published_at).toLocaleDateString('en-GB')}
          <span class="ni-reg">${a.region}</span>
        </div>
      </div>
    </div>`).join('');
}

loadLiveNews();
```

---

## Your monthly 8-hour schedule

### Every day (optional, 0–5 minutes)
- Open admin.html → Article review tab
- Glance at pending articles
- Click "Approve all" if they look good, or reject obvious non-starters
- Done

### Every Monday (required, 10–15 minutes)
- Open Buttondown
- Read the auto-generated digest draft
- Fix anything that reads oddly
- Click Send

### Once a month (1–2 hours)
- Check automation logs for any errors
- Review subscriber growth
- Match any unmatched language exchange pairs (send intro email)
- Check directory for any expired listings
- Do one quality sweep of the site

### As needed (2–3 hours/month)
- Add new directory listings (paid customers)
- Reply to any contact emails
- Update content on specialist pages (bureaucracy tool, etc.)

---

## Troubleshooting

**Articles not appearing?**
→ Check n8n automation logs → daily_news workflow → look for errors
→ Check Supabase → articles table → any rows with status='pending'?

**Digest not generating?**
→ Check n8n → weekly_digest workflow → did it run Sunday night?
→ Check Supabase → newsletter_sends table → any rows with status='draft'?

**Admin dashboard can't connect?**
→ Settings → check Supabase URL and key are correct
→ Make sure you're using the anon key (not service_role) in admin settings

**High Anthropic costs?**
→ You've set a spend cap at step 3 — you're protected
→ If approaching limit, reduce RSS feeds from 4 to 2 in the daily_news workflow

---

## Estimated running costs at different traffic levels

| Monthly visitors | API cost | Total infra | Potential revenue |
|---|---|---|---|
| 500 | €5 | €25 | €0–50 |
| 2,000 | €15 | €35 | €100–300 |
| 10,000 | €45 | €65 | €500–1,500 |
| 50,000 | €150 | €200 | €2,000–5,000 |

Revenue comes from: directory listings + newsletter sponsorships + tool purchases + affiliate links.
