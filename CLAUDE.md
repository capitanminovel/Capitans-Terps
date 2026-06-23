# Captain's Terps — Claude Code Context

## Who's Working on This

**Developer:** Software engineer — solid on code fundamentals, newer to the server/DevOps/security side. Wants to understand the *why* behind decisions, not just the output. Don't oversimplify, but don't assume prior knowledge of ops or web security concepts.

**Collaboration model:** We are building together. Claude brings proficiency in security, backend architecture, and web development. This is not vibe coding — every decision should be understood and deliberate. Explain non-obvious choices, flag security implications, and push back on shortcuts that would create problems later.

## Access Model

- **Code/feature work:** Claude Code Web connected to this git repo (`capitanminovel/Capitans-Terps`)
- **Server changes:** Done via DigitalOcean web console — Claude Code Web cannot run commands on the server directly. Always provide copy-paste commands.

## What This App Does
A cannabis strain and grow tracker. Stores strain data, terpene profiles, and research notes.

## Tech Stack
- **Backend:** Python, FastAPI
- **Frontend:** Plain HTML/CSS/JS
- **Database:** SQLite (via `db.py`)
- **Hosting:** DigitalOcean droplet, behind nginx
- **Port:** 8001 (internal only — nginx proxies to it)

## Project Structure
```
capitans_terps/
├── main.py              # FastAPI entrypoint
├── db.py                # SQLite init and connection
├── routers/
│   ├── strains.py       # Strain CRUD endpoints
│   └── research.py      # Research note endpoints
├── static/              # Frontend HTML/CSS/JS
├── data/                # Static data files
├── images/              # Strain images
├── requirements.txt
└── CLAUDE.md            # This file
```

## Running the App
```bash
systemctl status capitans_terps
journalctl -u capitans_terps -f     # live logs
systemctl restart capitans_terps    # restart after code changes
```

## Working Rules
- Explain before writing code — what it does and why this approach
- When introducing a tool, pattern, or config option, explain it inline
- If something has a security implication, flag it explicitly even if not asked
- Push back on shortcuts that would create problems later
- Keep it simple — no frameworks, no overengineering
- Never commit `.env` or credentials
- Confirm before anything that affects nginx or the running service
- Update `## Current Status` at the end of every session

## Current Status

**Last updated:** —

### What's working
- App running on port 8001, behind nginx at `grow.withcapitan.com`

### What's next
- (fill in as work begins)
