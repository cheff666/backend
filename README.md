# Chess Scoreboard API

This repo powers a tiny REST endpoint deployed on Render.com. It stores wins/losses/draws in memory and is queried by a StarfallEx chess script.

## Local test
```bash
npm install
node server.js
# POST a win
curl -d "id=white&result=win" http://localhost:3000/report -X POST
curl http://localhost:3000/scores