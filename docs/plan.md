# Zotilla

This app is an attempt at an open source, self-hostable Google Recorder alternative.

Ok so how i usually start is with laying out the models.

## Models

### User
- id (uuid)
- name
- email
- password
- avatar
- created_at
- updated_at

### Recording
- id (uuid)
- title (auto generated like "Sunday at 7:57 pm", but can be changed)
- transcript
- geolocation
- user_id
- created_at
- updated_at
- status (not sure if ill need this level of granularity)
  - pending
  - recording
  - done
  - error
  - deleted


## Tech
Aim to use the following stack:
- JS backend, node express with typescript
- tanstack router react PWA for frontend, served by express.
- postgres for db
- Zod for back and front. 
- Not sure about tailwind, i love css.
- auth, not sure if roll my own or use some lib
- Maybe zustand for state on the frontend.


## Deployment
Deploy to GHCR and run it on my unraid server.


## Thoughts
Being able to drop files into a folder and parse them, move then into the right folder and transcribe would be handy.
maybe using the wordpress uploads folder structure would be good, year/month/day/file.mp3


## UI
The UI layout is going to fit into 2 main sections, a "sidebar" with the list of recordings, which will actually be the "main view" on mobile, and a "player/recorder" view which will be main content on desktop but navigateable from the sidebar on mobile.

