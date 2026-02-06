---
description: Setup and run the development environment for ndy-dispatchlookup
---

1. Install dependencies
// turbo
run_command(CommandLine="npm install", Cwd="/home/red/.gemini/antigravity/scratch/ndy-dispatchlookup", SafeToAutoRun=true, WaitMsBeforeAsync=5000)

2. Generate Prisma Clients
// turbo
run_command(CommandLine="npm run generate", Cwd="/home/red/.gemini/antigravity/scratch/ndy-dispatchlookup", SafeToAutoRun=true, WaitMsBeforeAsync=5000)

3. Start Development Server
// turbo
run_command(CommandLine="npm run dev", Cwd="/home/red/.gemini/antigravity/scratch/ndy-dispatchlookup", SafeToAutoRun=true, WaitMsBeforeAsync=1000)

