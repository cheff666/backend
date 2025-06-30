## Local test (persistent)

```bash
npm install
node server.js            # creates data/scores.db automatically
curl -d "id=white&result=win" -X POST http://localhost:3000/report
curl http://localhost:3000/scores