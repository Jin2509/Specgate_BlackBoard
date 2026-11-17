from app.ws.routers import (auth, channels, conversations, highlights, join, me, paper_runs, private_highlights,
                            workspaces)

ROUTERS = [auth.router, me.router, conversations.router, private_highlights.router, workspaces.router,
           channels.router, join.router, highlights.router, paper_runs.router]
