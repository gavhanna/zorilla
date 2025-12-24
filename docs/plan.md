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
- JS backend, bun or node
- SQLite or just to with postgres straight away
- React, very likely with tanstack start
- Zod for back and front. 
- Not sure about tailwind, i love css.
- Probably roll my own shit auth system.
- Maybe zustand for state on the frontend.


## Deployment
Deploy to GHCR and run it on my unraid server.
