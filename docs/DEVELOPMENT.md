# Development
It is highly recommended to just use GitPod for development, there is less setup to do but you can also do locally

You'll probably need the environment variable setup in configure_gcp.sh

## Local development
- [Install NodeJS](https://www.google.com/search?ei=D3Q4XZGcM8OHjLsPs--n8AM&q=install+nodejs)

```
git clone https://github.com/louis030195/cloud-computer-vision.git
cd cloud-computer-vision
npm install
```

# TODO
## BACK
- Second endpoint /api/frames/predictions/objects excluding frames from video ?
- Endpoint /api/videos/predictions/objects ?

## FRONT
- Time / price estimator / simulator (before launching the task and after also) more user feedback
- Stuff with dates, count, stats ...
- More vizualisation / stats / graphics, make graphics resizable by drag & drop, co-occurences diagram
- Modify environment variables of every component from interface (atm 60%)
- Improve video (timeline ...)

## MISC
- Script that configure all the repo + gcp automatically (atm 60%)
- Split back / front
- More logs
- Datastore callbacks ([doc](https://cloud.google.com/appengine/docs/standard/java/datastore/callbacks#top_of_page))
- Other tasks (segmentation, action classification, captioning ...)
- Deploy in production

# Design
## Color scheme
https://coolors.co/export/pdf/dcc48e-eaefd3-b3c0a4-505168-27233a