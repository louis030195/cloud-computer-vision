# Development
It is highly recommended to just use GitPod for development, there is less setup to do but you can also do locally

You'll probably need these var env

    export PORT=8080
    export SECRET=keyboardcat

## Local development
- [Install NodeJS](https://www.google.com/search?ei=D3Q4XZGcM8OHjLsPs--n8AM&q=install+nodejs)

```
git clone https://github.com/louis030195/vision-client.git
cd vision-client
npm install
```

# TODO
Most important things to do:
1. Handle videos
2. Make front end less ugly and give more use feedback
## BACK
- Second endpoint /api/frames/predictions/objects excluding frames from video
- Endpoint /api/videos/predictions/objects ?

## FRONT
- Reset / remake new predictions (new model ...)
- Time / price estimator / simulator (before launching the task and after also) more user feedback (use pubsub ?)
- Stuff with dates, count, stats ...
- More vizualisation / stats / graphics, make graphics resizable by drag & drop
- Group images by class

## MISC
- Script that configure all the repo + gcp automatically
- Split back / front
- LOGS LOGS LOGS
- Datastore callbacks (E.g delete frame => delete its predictions+objects see [doc](https://cloud.google.com/appengine/docs/standard/java/datastore/callbacks#top_of_page))
- Handle multiple models, choosing on front
- Other tasks (segmentation, action classification, captioning ...)
