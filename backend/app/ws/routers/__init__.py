from app.ws.routers import (auth, channels, conversations, highlights, join, me, private_highlights,
                            tasks, workspaces)

ROUTERS = [auth.router, me.router, conversations.router, private_highlights.router, workspaces.router,
           channels.router, join.router, highlights.router, tasks.router]
