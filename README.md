# The Unsaid

**[Try The Unsaid →](https://theunsaid.vercel.app)**

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Built with SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://kit.svelte.dev/)

> *"I've been trying to tell my dad I'm proud of him for two years.  I keep drafting it in my Notes app and deleting it.  Your app finally helped me find the words."*  
> — Beta tester, December 2025

---

## The Hard Question Everyone Asks

**"Why not just use a notes app?"**

Fair question. Here's the truth: **a blank Notes app is terrifying when the stakes are high.**

When you're trying to tell your mom you appreciate her sacrifices, or apologize to someone you hurt, or say goodbye to a friend who's moving away — that blinking cursor in Notes doesn't help you.  It just judges you. 

The Unsaid is different because it **meets you where you are**: 
- **Prompts that unlock what you're feeling** — "I've never told you this, but..." is easier than a blank page
- **AI that refines, not replaces** — You still write it.  AI just helps you say it better
- **Privacy so you can be honest** — Zero-knowledge encryption means even *I* can't read your drafts
- **Patterns that show your growth** — See how your communication evolves over time
- **Saves your courage** — That thing you almost sent? It's here when you're ready

**A notes app is a box.  The Unsaid is a guide.**

---

## The Even Harder Question

**"If I'll never send them, why keep them at all?  Isn't that just emotional hoarding?"**

Here's what I learned building this:  **unsent letters aren't failures.  They're proof you tried to show up.**

Some things you'll send:
- The apology you've been putting off
- The gratitude text that felt "too much"
- The boundaries conversation you've been avoiding

Some things you'll keep:
- Letters to people who are gone
- Drafts that helped you process before therapy
- Words you needed to say out loud, even if only to yourself

**Writing it down isn't about sending it. It's about not carrying it alone.**

Your notes app doesn't differentiate between a grocery list and a letter to your deceased grandfather. The Unsaid does.  It treats your hard conversations with the weight they deserve.

And if you *do* want to delete them?  You can. **Export everything, delete your account, and walk away clean. ** No guilt, no "are you sure?" dark patterns.  Just a tool that was there when you needed it.

---

## Why This Exists

I built The Unsaid because I watched too many people — myself included — *almost* say the thing that mattered.  Almost apologize.  Almost reconnect. Almost tell someone they mattered.

The gap between *feeling something* and *saying it well* is where relationships die. 

This tool bridges that gap. Not by writing for you, but by **helping you find the words that were already in you.**

---

## What Makes This Different

### **Zero-Knowledge Encryption (Actually)**
- **AES-256-GCM encryption** happens in your browser *before* data leaves your device
- Your password = your key.  I literally cannot read your drafts even if I wanted to
- No backdoors, no "trust us," no fine print
- Open source crypto implementation — [verify it yourself](src/lib/crypto/cipher.ts)

### **AI That Respects Your Voice**
| Other AI Tools | The Unsaid |
|---|---|
| "Here, I wrote it for you" | "Here are 3 ways to say what *you* already meant" |
| Generates polished corporate speak | Preserves your emotional truth |
| No consent required | Explicit opt-in, disable anytime |
| Your data trains their models | Your drafts never leave the encryption layer |

### **Insights Without Surveillance**
- See patterns in who you write to, when you struggle, what emotions you revisit
- **All analysis happens locally** after decryption — your data never goes to an analytics server
- No tracking pixels, no ad retargeting, no selling "anonymized" datasets

### **Built for Real Conversations**
- **30+ curated prompts** organized by relationship type (parents, partners, friends, grief, self)
- Emotion tagging so you can find "that draft where I was trying to apologize"
- History timeline that shows your communication journey

---

## Who This Is For

- **Adult children** finding words for complicated parent relationships
- **Partners** who've been together so long they forgot how to say "I see you"
- **Grieving humans** writing letters to people who can't write back
- **Anyone** carrying something unsaid that's getting heavier

**This is for you if:**
- You've drafted and deleted the same text 47 times
- You know what you *feel* but not how to *say* it
- You've used ChatGPT for a difficult message and felt gross about it
- You want AI help without giving up your privacy
- You believe words matter and deserve better than a notes app

---

## Features

### Core Experience
- **Distraction-free editor** with autosave and sync
- **Conversation prompts** by relationship and situation
- **AI articulation modes**:  Clarity, Alternatives, Tone, Expansion, Opening suggestions
- **Draft history** with search, filters, and patterns
- **Export** to JSON, Markdown, or TXT
- **Full data control** — export everything, delete account, no questions asked

### Privacy & Security
- End-to-end encryption (AES-256-GCM + PBKDF2 10K iterations)
- Keys stored in memory only, never persisted
- No ads, no trackers, no analytics that phone home
- Open source encryption implementation
- Row-level security (RLS) in database

### Accessibility
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Mobile responsive with touch-optimized UI
- Dark mode support

---

## Tech Stack

**Frontend**: SvelteKit (Svelte 5) · TypeScript · Tailwind CSS v4 · DaisyUI v5  
**Backend**: FastAPI (Python 3.15+) · OpenRouter API  
**Database**: Supabase (PostgreSQL + Auth)  
**Encryption**: Web Crypto API (AES-256-GCM)  
**Testing**: Vitest · pytest

**Why this stack?**
- Svelte 5 runes = reactive encryption state without framework overhead
- FastAPI = type-safe AI endpoints with 0. 003s response times
- Supabase = RLS policies mean even a DB breach can't decrypt your drafts
- Web Crypto API = browser-native encryption, no sketchy third-party libs

---

## Quick Start

### Try It Live
👉 **[theunsaid.vercel.app](https://theunsaid.vercel.app)** — No credit card, no waitlist, just sign up and write.

### Run Locally

```bash
# Clone the repo
git clone https://github.com/Ishan-Karpe/The-Unsaid.git
cd The-Unsaid

# Install dependencies
pnpm install

# Set up environment variables
cp .env. example .env
# Edit .env with your Supabase and OpenRouter keys

# Start the frontend
pnpm dev  # Runs on http://localhost:5173

# Start the backend (separate terminal)
cd backend
uv venv && source . venv/bin/activate
uv pip install -e ".[dev]"
uvicorn app.main:app --reload  # Runs on http://localhost:8000
```

**Get API keys**: 
- [Supabase](https://supabase.com) — Free tier includes auth + PostgreSQL
- [OpenRouter](https://openrouter.ai) — Pay per AI request (~ $0.001/request)

**Full setup guide**:  [CLAUDE. md](CLAUDE.md)

---

## How It Works (The Encryption Part)

Because "trust us" isn't good enough: 

1. **You sign up** → Supabase generates a random salt for you
2. **You log in** → Your password + salt → PBKDF2 (100K iterations) → 256-bit encryption key
3. **You write** → Content encrypted in browser → Sent to server as ciphertext
4. **You read** → Server sends ciphertext → Decrypted in browser with your key
5. **You log out** → Key deleted from memory forever

**Your password is the key.  Lose it = lose your drafts. ** No password reset can save you.  This is the tradeoff of zero-knowledge encryption.

**Code**:  [encryptionService.ts](src/lib/services/encryptionService.ts) · [cipher.ts](src/lib/crypto/cipher.ts)

---

## What This Is NOT

| What We Don't Do | What We Do Instead |
|---|---|
| Hidden tracking | Transparent:  [No analytics code](https://github.com/Ishan-Karpe/The-Unsaid/search?q=analytics) |
| Sell your data | Can't sell what we can't read (literally encrypted) |
| AI writes for you | AI suggests; you decide |
| Lock you in | Export → Delete → Walk away clean |
| Notifications / streaks | No addiction mechanics |
| "Trust us" security | Open source crypto you can audit |

---

## Roadmap

**Shipped** 
- [x] Zero-knowledge encryption
- [x] 5 AI articulation modes
- [x] Draft history + patterns
- [x] Mobile responsive
- [x] Accessibility (WCAG 2.1 AA)

**Coming Soon** 
- [ ] End-to-end encrypted sync across devices
- [ ] Offline mode with local-first storage
- [ ] Voice-to-text for drafting
- [ ] Scheduled send (draft now, send later)
- [ ] Customizable AI personality

**Considering** 
- [ ] Therapist sharing mode (encrypted, time-limited access)
- [ ] Integration with journaling apps (Day One, Obsidian)
- [ ] Community prompts (user-submitted, curated)

**Will Never Build** 
- Social feed (this isn't Instagram for feelings)
- Ad-supported tier (privacy and ads are incompatible)
- AI training on user data (defeats the whole point)

---

## Contributing

This is a solo project right now, but I'd love help with:
- Bug reports (especially encryption edge cases)
- Accessibility improvements
- Internationalization (i18n)
- Better AI prompts (maintaining user voice is hard)

**Before opening a PR**:  Read [CLAUDE.md](CLAUDE.md) for architecture context.

---

## FAQ

**Q: Is this really free?**  
A: Yes. The live demo is free.  If you self-host, you pay for your own Supabase/OpenRouter usage (pennies per month for personal use).

**Q: How do you make money?**  
A: I don't yet. This is a passion project. Future revenue might come from:
- Premium AI models (GPT-4 vs.  free tier)
- Optional pro features (offline mode, scheduled send)
- Never ads, never selling data

**Q: What if I forget my password?**  
A: Your drafts are gone. Zero-knowledge encryption means I can't help you.  **Back up important drafts.**

**Q: Can you read my drafts?**  
A: No.  Technically impossible. Your drafts are encrypted *before* they reach my server. I see gibberish. 

**Q: What if the service shuts down?**  
A:  Export your data (JSON/Markdown). The encryption is client-side, so you can decrypt locally forever.  Self-hosting instructions in [CLAUDE.md](CLAUDE.md).

**Q: Is this HIPAA compliant?**  
A: No. Don't use this for medical records. It's for personal communication, not regulated data.

---

## License

MIT License — Use this, fork this, learn from this.  Just don't claim you built it.

See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with: 
- [Svelte](https://svelte.dev) — The framework that just gets out of the way
- [Supabase](https://supabase.com) — Firebase for people who like PostgreSQL
- [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) — UI that doesn't look like Bootstrap
- [OpenRouter](https://openrouter.ai) — AI routing without vendor lock-in

Inspired by:
- Every unsent text I regret not sending
- Every sent text I regret sending too fast
- The gap between what we feel and what we say

---

## About

Built by [Ishan Karpe](https://github.com/Ishan-Karpe) — 15 years old, learning to build tools that matter.

**Why did a 15-year-old build this?**  
Because I've watched adults — parents, teachers, friends — carry unsaid things that eat them alive. If I can build a tool that helps one person say the thing they've been holding back, that's enough.

This isn't a startup. It's not a resume project. It's a tool I wish existed when I needed it.

---

<p align="center">
  <sub>Made with ❤️ by Ishan Karpe</sub>
</p>
