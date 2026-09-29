# Wrzucenie na GitHub

```bash
unzip nawylot.zip && cd nawylot
git init -b main
git add .
git commit -m "chore: project scaffold, docs and Claude Code context"

# z GitHub CLI (prywatne repo):
gh repo create nawylot --private --source=. --push

# potem zaproś Szymona i Do.:
gh repo edit --add-collaborator <login>   # albo Settings → Collaborators
```

Potem: `claude` w katalogu repo → `/next-task`.
