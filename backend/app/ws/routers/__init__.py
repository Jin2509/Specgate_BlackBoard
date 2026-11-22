from app.ws.routers import (auth, channels, conversations, documents, highlights, join, me,
                            private_highlights, tasks, workspaces)

ROUTERS = [auth.router, me.router, conversations.router, documents.router, private_highlights.router,
           workspaces.router, channels.router, join.router, highlights.router, tasks.router]
